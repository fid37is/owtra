// app/api/analyze-interview-answers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGeminiClient } from '@/lib/ai/providers'

type UserAnswer = {
  questionId: string
  answer: string
  timeSpent: number
}

type InterviewQuestion = {
  id: string
  category: string
  question: string
  tips: string[]
  sample_answer?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { applicationId, questions, answers, totalTime } = await request.json()

    if (!applicationId || !questions || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ── Model resolution ──────────────────────────────────────────────────
    const modelName = process.env.GEMINI_MODEL
    if (!modelName) {
      console.error('GEMINI_MODEL environment variable is not set')
      return NextResponse.json(
        { error: 'AI model is not configured. Please set GEMINI_MODEL in your environment variables.' },
        { status: 500 }
      )
    }

    // Get application details for context
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('job_title, company_name, job_description')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Analyze with Gemini
    const feedback = await analyzeWithGemini(
      modelName,
      application,
      questions,
      answers,
      totalTime
    )

    return NextResponse.json({ feedback })

  } catch (error: any) {
    console.error('Error analyzing interview answers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze answers' },
      { status: 500 }
    )
  }
}

async function analyzeWithGemini(
  modelName: string,
  application: any,
  questions: InterviewQuestion[],
  answers: UserAnswer[],
  totalTime: number
) {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ model: modelName })

  const analysisPrompt = `You are an expert interview coach analyzing a candidate's practice interview responses for a ${application.job_title} position at ${application.company_name}.

Job Context:
${application.job_description ? application.job_description.slice(0, 1000) : 'No job description available'}

The candidate answered ${questions.length} interview questions in ${Math.floor(totalTime / 60)} minutes and ${totalTime % 60} seconds.

Here are their responses:

${questions.map((q: InterviewQuestion, idx: number) => {
  const answer = answers.find((a: UserAnswer) => a.questionId === q.id)
  return `
Question ${idx + 1} (${q.category}):
${q.question}

Candidate's Answer:
${answer?.answer || '(No answer provided)'}

Time Spent: ${answer?.timeSpent ? Math.floor(answer.timeSpent / 60) + 'm ' + (answer.timeSpent % 60) + 's' : 'N/A'}
`
}).join('\n---\n')}

Please analyze each answer and provide:

1. **Individual Question Feedback** - For each question, identify:
   - Strengths: What they did well (specific aspects they got right)
   - Improvements: What they missed or could improve (be constructive)
   - Ideal Approach: Brief description of a strong answer approach
   - Score: Rate from 0-100 based on industry standards

2. **Overall Score** - An aggregate score (0-100) reflecting overall interview performance

3. **General Advice** - 3-5 actionable tips for improving their interview skills overall

4. **Encouragement** - A motivating message to keep them practicing

Scoring Guidelines:
- 85-100: Excellent answer with clear structure, relevant examples, demonstrates deep understanding
- 70-84: Good answer with solid content but room for improvement in structure or depth
- 55-69: Moderate answer that addresses the question but lacks detail or clarity
- 40-54: Weak answer that partially addresses the question
- 0-39: Poor answer that misses the point or shows lack of understanding

IMPORTANT: Respond ONLY with valid JSON in exactly this format (no markdown, no code blocks):
{
  "overall_score": 75,
  "question_feedback": [
    {
      "question_id": "q1",
      "question": "Tell me about a time...",
      "user_answer": "The candidate's answer...",
      "strengths": ["Clear STAR structure", "Quantified results"],
      "improvements": ["Could elaborate on the challenges faced", "Missing reflection on learnings"],
      "ideal_approach": "A strong answer would follow STAR format, provide specific metrics, and show growth mindset",
      "score": 75
    }
  ],
  "general_advice": [
    "Practice using the STAR method consistently",
    "Include more quantifiable results in your examples",
    "Show enthusiasm and passion for the role"
  ],
  "encouragement": "You demonstrated good foundational interview skills! With practice focusing on structure and specificity, you'll excel. Keep practicing and believe in yourself!"
}

Be constructive, encouraging, and specific in your feedback. Focus on actionable improvements.`

  try {
    const result = await model.generateContent(analysisPrompt)
    const response = result.response
    let text = response.text().trim()

    // Clean up response - remove markdown code blocks if present
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    const feedback = JSON.parse(text)

    // Validate the structure
    if (!feedback.overall_score || !Array.isArray(feedback.question_feedback)) {
      throw new Error('Invalid feedback structure')
    }

    return feedback

  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError)
    
    // Fallback feedback structure
    return {
      overall_score: 70,
      question_feedback: questions.map((q: InterviewQuestion) => {
        const answer = answers.find((a: UserAnswer) => a.questionId === q.id)
        return {
          question_id: q.id,
          question: q.question,
          user_answer: answer?.answer || '(No answer provided)',
          strengths: ['You attempted the question'],
          improvements: ['Could provide more specific examples', 'Consider using the STAR method for better structure'],
          ideal_approach: 'Provide a structured answer with specific examples and measurable outcomes',
          score: 65
        }
      }),
      general_advice: [
        'Practice structuring your answers using frameworks like STAR (Situation, Task, Action, Result)',
        'Include specific, quantifiable examples from your experience',
        'Show enthusiasm and knowledge about the company and role',
        'Prepare stories that demonstrate key competencies'
      ],
      encouragement: 'Great job completing the practice session! Keep practicing and you\'ll continue to improve. Remember, interview skills develop with consistent practice.'
    }
  }
}