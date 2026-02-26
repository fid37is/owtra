// app/api/generate-insights/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGeminiClient } from '@/lib/ai/providers'
import { getApiErrorMessage, getHttpStatus } from '@/lib/ai/errors'

function cleanAIText(text: string): string {
  return text
    .replace(/\*\*\*+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{1,3}/g, '')
    .replace(/!{2,}/g, '!')
    .replace(/([.!?])([A-Z][a-z]+\s+[A-Z][a-z]+:)/g, '$1\n\n$2\n\n')
    .replace(/([.!?])([A-Z][a-z]+:)/g, '$1\n\n$2\n\n')
    .replace(/([^\n])(•|[•◦▪▫])/g, '$1\n$2')
    .replace(/^[•◦▪▫–—]\s*/gm, '• ')
    .replace(/\n{4,}/g, '\n\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim()
}

export async function POST(request: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Model resolution ──────────────────────────────────────────────────
    const model = process.env.GEMINI_MODEL
    if (!model) {
      console.error('GEMINI_MODEL environment variable is not set')
      return NextResponse.json(
        { error: 'AI model is not configured. Please set GEMINI_MODEL in your environment variables.' },
        { status: 500 }
      )
    }

    // ── Payload ───────────────────────────────────────────────────────────
    const {
      totalApplications,
      appliedCount,
      interviewingCount,
      offersCount,
      rejectedCount,
      notAppliedCount,
      responseRate,
      averageMatchScore,
      recentApps,
      previousApps,
      topLocations,
    } = await request.json()

    // ── Prompt ────────────────────────────────────────────────────────────
    const prompt = `You are an expert career advisor and job search strategist. Analyze the following job search statistics and provide personalized, actionable insights and recommendations.

JOB SEARCH STATISTICS:
- Total Applications Tracked: ${totalApplications}
- Not Yet Applied: ${notAppliedCount}
- Applied: ${appliedCount}
- Currently Interviewing: ${interviewingCount}
- Offers Received: ${offersCount}
- Rejected: ${rejectedCount}
- Response Rate: ${responseRate}% (interviews + offers / applied)
- Average Match Score: ${averageMatchScore}%
- Recent Activity: ${recentApps} applications in last 7 days (vs ${previousApps} in previous 7 days)
${topLocations.length > 0 ? `- Top Target Locations: ${topLocations.map((l: { location: string; count: number }) => `${l.location} (${l.count})`).join(', ')}` : ''}

TASK:
Provide a comprehensive career coaching analysis with the following sections. CRITICAL: Each section title MUST be on its own line, followed by bullet points (where applicable), with each bullet point on a new line.

Overall Assessment:

[Write 2-3 sentences here]

Key Insights:

• [First insight]
• [Second insight]
• [Third insight]

Actionable Recommendations:

• [First recommendation]
• [Second recommendation]
• [Third recommendation]
• [Fourth recommendation]
• [Fifth recommendation]

Motivational Closing:

[Write 1-2 sentences here]

CONTENT GUIDELINES:
1. Overall Assessment: Evaluate their job search performance and momentum, highlight what they're doing well
2. Key Insights: Identify 3-4 patterns, strengths, areas of concern. Compare to industry benchmarks
3. Actionable Recommendations: Provide 5-7 specific action items, prioritized by impact
4. Motivational Closing: Encourage and energize them

FORMAT RULES (CRITICAL):
- Write in plain text without markdown formatting
- Do NOT use asterisks, stars, or special characters for emphasis
- Each section title MUST end with a colon and be on its own separate line
- Each bullet point MUST start on a new line with "•" character
- Leave a blank line between sections
- Write naturally and warmly
- Use specific numbers from their data

IMPORTANT CONTEXT:
- If they have very few applications (< 5), emphasize the need to increase volume
- If response rate is low (< 10%), focus on application quality and targeting
- If they have many tracked but not applied, encourage action
- If they're doing well, acknowledge it and suggest optimization strategies`

    // ── Generate ──────────────────────────────────────────────────────────
    const genAI = getGeminiClient()
    const geminiModel = genAI.getGenerativeModel({ model })

    const result = await geminiModel.generateContent(prompt)
    const insights = cleanAIText(result.response.text())

    return NextResponse.json({ success: true, insights })

  } catch (error: any) {
    console.error('Insights generation error:', error)
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'generate insights') },
      { status: getHttpStatus(error) }
    )
  }
}