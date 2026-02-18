// app/api/generate-interview-prep/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGeminiClient } from '@/lib/ai/providers'
import { InterviewPrep, InterviewQuestion } from '@/lib/supabase/dodo-types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { applicationId } = await request.json()

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 })
    }

    // Fetch application with company info
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Check if job description exists
    if (!application.job_description || application.job_description.trim().length < 100) {
      return NextResponse.json(
        { error: 'Job description is too short. Please add more details to generate interview prep.' },
        { status: 400 }
      )
    }

    // Generate interview prep
    const interviewPrep = await generateInterviewQuestions(
      application.job_title,
      application.company_name,
      application.job_description,
      application.company?.description || null,
      application.company?.culture_summary || null
    )

    // Update application with interview prep
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        interview_prep_enabled: true,
        interview_questions: interviewPrep,
        interview_prep_generated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)

    if (updateError) {
      console.error('Failed to update application:', updateError)
      return NextResponse.json({ error: 'Failed to save interview prep' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      interviewPrep
    })

  } catch (error: any) {
    console.error('Interview prep error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate interview prep' },
      { status: 500 }
    )
  }
}

async function generateInterviewQuestions(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  companyDescription: string | null,
  cultureSummary: string | null
): Promise<InterviewPrep> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-lite',
  })

  const prompt = `You are an expert interview coach. Generate comprehensive interview preparation materials for a candidate applying to this position.

JOB DETAILS:
- Title: ${jobTitle}
- Company: ${companyName}
- Description: ${jobDescription.substring(0, 2500)}

${companyDescription ? `COMPANY BACKGROUND:\n${companyDescription}` : ''}
${cultureSummary ? `COMPANY CULTURE:\n${cultureSummary}` : ''}

Generate a comprehensive interview prep package with:
1. 5 behavioral questions (STAR method focused)
2. 5 technical/role-specific questions
3. 3 company-specific questions
4. 3 questions about the role itself
5. Key topics to study/prepare
6. General preparation tips
7. Company-specific insights to know

IMPORTANT: Respond ONLY with valid JSON in exactly this format (no markdown, no code blocks):
{
  "questions": [
    {
      "id": "q1",
      "category": "behavioral",
      "question": "<question text>",
      "tips": ["<tip 1>", "<tip 2>"],
      "sample_answer": "<optional sample answer framework>"
    }
  ],
  "key_topics": ["<topic 1>", "<topic 2>", "<topic 3>", "<topic 4>"],
  "preparation_tips": ["<tip 1>", "<tip 2>", "<tip 3>", "<tip 4>"],
  "company_insights": ["<insight 1>", "<insight 2>", "<insight 3>"]
}

Make questions specific and relevant to the actual job description. Provide actionable tips.`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    let text = response.text().trim()

    // Clean up response
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    const prep = JSON.parse(text) as InterviewPrep
    prep.generated_at = new Date().toISOString()

    // Validate structure
    if (!Array.isArray(prep.questions)) prep.questions = []
    if (!Array.isArray(prep.key_topics)) prep.key_topics = []
    if (!Array.isArray(prep.preparation_tips)) prep.preparation_tips = []
    if (!Array.isArray(prep.company_insights)) prep.company_insights = []

    // Ensure questions have required fields
    prep.questions = prep.questions.map((q, idx) => ({
      id: q.id || `q${idx + 1}`,
      category: q.category || 'role-specific',
      question: q.question || '',
      tips: Array.isArray(q.tips) ? q.tips : [],
      sample_answer: q.sample_answer
    }))

    return prep

  } catch (error: any) {
    console.error('Gemini interview prep error:', error)
    throw new Error('Failed to generate interview questions. Please try again.')
  }
}