// app/api/generate-interview-prep/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGeminiClient } from '@/lib/ai/providers'
import { InterviewPrep } from '@/lib/supabase/dodo-types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { applicationId } = await request.json()
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID required' }, { status: 400 })
    }

    const modelName = process.env.GEMINI_MODEL
    if (!modelName) {
      console.error('GEMINI_MODEL environment variable is not set')
      return NextResponse.json(
        { error: 'AI model is not configured. Please set GEMINI_MODEL in your environment variables.' },
        { status: 500 }
      )
    }

    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`*, company:companies(*)`)
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (!application.job_description || application.job_description.trim().length < 100) {
      return NextResponse.json(
        { error: 'Job description is too short. Please add more details to generate interview prep.' },
        { status: 400 }
      )
    }

    const interviewPrep = await generateInterviewQuestions(
      modelName,
      application.job_title,
      application.company_name,
      application.job_description,
      application.company?.description || null,
      application.company?.culture_summary || null,
    )

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

    return NextResponse.json({ success: true, interviewPrep })

  } catch (error: any) {
    console.error('Interview prep error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate interview prep' },
      { status: 500 }
    )
  }
}

async function generateInterviewQuestions(
  modelName: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  companyDescription: string | null,
  cultureSummary: string | null,
): Promise<InterviewPrep> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: modelName })

  // Always generate both sets — the page decides which to show based on selected mode
  const prompt = `You are an expert interview coach. Generate comprehensive interview preparation materials for a candidate applying to this position.

JOB DETAILS:
- Title: ${jobTitle}
- Company: ${companyName}
- Description: ${jobDescription.substring(0, 2500)}

${companyDescription ? `COMPANY BACKGROUND:\n${companyDescription}` : ''}
${cultureSummary ? `COMPANY CULTURE:\n${cultureSummary}` : ''}

Generate TWO separate question sets:

WRITTEN QUESTIONS (behavioral & role-specific — open ended, no MCQ):
1. 5 behavioral questions (STAR method focused)
2. 3 role-specific questions

MCQ QUESTIONS (technical & company-specific — multiple choice only, no open ended):
1. 5 technical questions
2. 3 company-specific questions

For MCQ questions you MUST include:
- "mcq_options": array of exactly 4 objects with "id" ("a","b","c","d") and "text"
- "correct_option_id": the correct option id
- "explanation": 1-2 sentences explaining why the correct answer is right
Make wrong options subtly plausible — common misconceptions, not obviously silly answers.

Also include:
- Key topics to study/prepare
- General preparation tips
- Company-specific insights to know

IMPORTANT: Respond ONLY with valid JSON in exactly this format (no markdown, no code blocks):
{
  "written_questions": [
    {
      "id": "w1",
      "category": "behavioral",
      "question": "<question text>",
      "tips": ["<tip 1>", "<tip 2>"],
      "sample_answer": "<optional sample answer framework>"
    },
    {
      "id": "w2",
      "category": "role-specific",
      "question": "<question text>",
      "tips": ["<tip 1>"]
    }
  ],
  "mcq_questions": [
    {
      "id": "m1",
      "category": "technical",
      "question": "<question text>",
      "tips": ["<tip 1>"],
      "mcq_options": [
        { "id": "a", "text": "<option A>" },
        { "id": "b", "text": "<option B>" },
        { "id": "c", "text": "<option C>" },
        { "id": "d", "text": "<option D>" }
      ],
      "correct_option_id": "b",
      "explanation": "<why the correct answer is right>"
    }
  ],
  "key_topics": ["<topic 1>", "<topic 2>", "<topic 3>", "<topic 4>"],
  "preparation_tips": ["<tip 1>", "<tip 2>", "<tip 3>", "<tip 4>"],
  "company_insights": ["<insight 1>", "<insight 2>", "<insight 3>"]
}

Make questions specific to the actual job description.`

  try {
    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()

    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    const raw = JSON.parse(text)

    const writtenQuestions = Array.isArray(raw.written_questions)
      ? raw.written_questions.map((q: any, idx: number) => ({
          id: q.id || `w${idx + 1}`,
          category: q.category || 'behavioral',
          question: q.question || '',
          tips: Array.isArray(q.tips) ? q.tips : [],
          sample_answer: q.sample_answer,
        }))
      : []

    const mcqQuestions = Array.isArray(raw.mcq_questions)
      ? raw.mcq_questions.map((q: any, idx: number) => ({
          id: q.id || `m${idx + 1}`,
          category: q.category || 'technical',
          question: q.question || '',
          tips: Array.isArray(q.tips) ? q.tips : [],
          mcq_options: Array.isArray(q.mcq_options) ? q.mcq_options : [],
          correct_option_id: q.correct_option_id || '',
          explanation: q.explanation || '',
        }))
      : []

    const prep: InterviewPrep = {
      written_questions: writtenQuestions,
      mcq_questions: mcqQuestions,
      // Keep questions for backwards compat — merge both
      questions: [...writtenQuestions, ...mcqQuestions],
      key_topics: Array.isArray(raw.key_topics) ? raw.key_topics : [],
      preparation_tips: Array.isArray(raw.preparation_tips) ? raw.preparation_tips : [],
      company_insights: Array.isArray(raw.company_insights) ? raw.company_insights : [],
      generated_at: new Date().toISOString(),
    }

    return prep

  } catch (error: any) {
    console.error('Gemini interview prep error:', error)
    throw new Error('Failed to generate interview questions. Please try again.')
  }
}