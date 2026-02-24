import { getAIProvider, getGeminiClient } from './providers'

export interface MatchAnalysisResult {
  match_score: number
  category_scores: {
    values_alignment: number
    culture_fit: number
    growth_opportunity: number
    practical_fit: number
    qualification_match: number // NEW
  }
  strengths: string[]
  concerns: string[]
  recommendations: string[] // NEW
  interview_question: string
  summary: string
  qualification_assessment: string // NEW: "underqualified" | "well-qualified" | "overqualified"
}

export interface UserPreferences {
  // Career preferences
  top_values: string[]
  deal_breakers: string[]
  work_location_preference: string | null
  preferred_company_size: string[] | null
  preferred_industries: string[] | null
  
  // Professional profile (NEW)
  current_job_title?: string | null
  experience_level?: string | null
  skills?: string[] | null
  career_goals?: string | null
  short_term_goal?: string | null
  long_term_goal?: string | null
}

export async function analyzeJobMatch(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  location: string | null,
  userPreferences: UserPreferences
): Promise<MatchAnalysisResult> {
  const provider = getAIProvider()

  switch (provider) {
    case 'gemini':
      return analyzeWithGemini(jobTitle, companyName, jobDescription, location, userPreferences)
    case 'openai':
      throw new Error('OpenAI provider not yet implemented. Set AI_PROVIDER=gemini in .env.local')
    case 'anthropic':
      throw new Error('Anthropic provider not yet implemented. Set AI_PROVIDER=gemini in .env.local')
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

async function analyzeWithGemini(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  location: string | null,
  userPreferences: UserPreferences
): Promise<MatchAnalysisResult> {
  const genAI = getGeminiClient()
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-lite',
  })

  // Build comprehensive prompt with professional profile
  const prompt = `You are an expert career advisor analyzing job opportunities. Analyze this job posting against BOTH the candidate's professional qualifications AND their career preferences. Provide a detailed, honest match assessment.

JOB DETAILS:
- Title: ${jobTitle}
- Company: ${companyName}
- Location: ${location || 'Not specified'}
- Description: ${jobDescription.substring(0, 3000)}${jobDescription.length > 3000 ? '...' : ''}

CANDIDATE PROFESSIONAL PROFILE:
- Current Position: ${userPreferences.current_job_title || 'Not specified'}
- Experience Level: ${userPreferences.experience_level || 'Not specified'}
- Skills: ${userPreferences.skills && userPreferences.skills.length > 0 ? userPreferences.skills.join(', ') : 'Not specified'}
- Career Goals: ${userPreferences.career_goals || 'Not specified'}
- Short-term Goal (1-2 years): ${userPreferences.short_term_goal || 'Not specified'}
- Long-term Goal (3-5 years): ${userPreferences.long_term_goal || 'Not specified'}

CANDIDATE PREFERENCES:
- Top Values: ${userPreferences.top_values && userPreferences.top_values.length > 0 ? userPreferences.top_values.join(', ') : 'Not specified'}
- Deal Breakers: ${userPreferences.deal_breakers && userPreferences.deal_breakers.length > 0 ? userPreferences.deal_breakers.join(', ') : 'None specified'}
- Work Location Preference: ${userPreferences.work_location_preference || 'Flexible'}
- Preferred Company Sizes: ${userPreferences.preferred_company_size && userPreferences.preferred_company_size.length > 0 ? userPreferences.preferred_company_size.join(', ') : 'Any'}
- Preferred Industries: ${userPreferences.preferred_industries && userPreferences.preferred_industries.length > 0 ? userPreferences.preferred_industries.join(', ') : 'Any'}

ANALYSIS REQUIREMENTS:
1. Assess if the candidate is QUALIFIED for this role based on their experience, skills, and job requirements
2. Evaluate how well the job aligns with their career goals and trajectory
3. Check preference alignment (values, location, company type)
4. Identify skill gaps or areas where they're overqualified
5. Consider if this is a good career move given their goals

IMPORTANT: Respond ONLY with valid JSON in exactly this format (no markdown, no code blocks, just raw JSON):
{
  "match_score": <overall score 0-100 considering BOTH qualifications AND preferences>,
  "category_scores": {
    "values_alignment": <how well job aligns with stated values, 0-100>,
    "culture_fit": <cultural indicators and work environment fit, 0-100>,
    "growth_opportunity": <learning and advancement potential, 0-100>,
    "practical_fit": <location, company size, industry preferences, 0-100>,
    "qualification_match": <how qualified they are for the role, 0-100>
  },
  "strengths": [
    "<skill/experience that makes them a strong fit>",
    "<preference that aligns well>",
    "<career goal alignment>",
    "<any other strong matches>"
  ],
  "concerns": [
    "<skill gap or qualification concern>",
    "<preference misalignment>",
    "<career trajectory concern>",
    "<any red flags>"
  ],
  "recommendations": [
    "<how to position their experience>",
    "<skills to emphasize or develop>",
    "<what to research about the company>",
    "<interview preparation tips>"
  ],
  "interview_question": "<one specific, insightful question they should ask based on their profile and goals>",
  "qualification_assessment": "<exactly one of: 'underqualified', 'well-qualified', or 'overqualified'>",
  "summary": "<2-3 sentences covering qualification fit, preference alignment, and whether this is a good career move>"
}

SCORING GUIDANCE:
- qualification_match: 80-100 if they meet most requirements, 50-79 if some gaps, below 50 if significantly underqualified
- Be honest about qualification gaps - don't inflate scores
- Consider both hard skills and soft skills
- Factor in if this role is a step up, lateral, or step down from their current position
- A lower score with honest concerns is better than inflated scores

Provide substantive, specific analysis based on the actual job description content and candidate profile.`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Clean up the response (remove markdown code blocks if present)
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    // Parse JSON
    const analysis = JSON.parse(cleanedText) as MatchAnalysisResult

    // Validate and sanitize scores
    analysis.match_score = Math.min(100, Math.max(0, Math.round(analysis.match_score)))
    analysis.category_scores.values_alignment = Math.min(100, Math.max(0, Math.round(analysis.category_scores.values_alignment)))
    analysis.category_scores.culture_fit = Math.min(100, Math.max(0, Math.round(analysis.category_scores.culture_fit)))
    analysis.category_scores.growth_opportunity = Math.min(100, Math.max(0, Math.round(analysis.category_scores.growth_opportunity)))
    analysis.category_scores.practical_fit = Math.min(100, Math.max(0, Math.round(analysis.category_scores.practical_fit)))
    analysis.category_scores.qualification_match = Math.min(100, Math.max(0, Math.round(analysis.category_scores.qualification_match)))

    // Ensure arrays exist
    if (!Array.isArray(analysis.strengths)) analysis.strengths = []
    if (!Array.isArray(analysis.concerns)) analysis.concerns = []
    if (!Array.isArray(analysis.recommendations)) analysis.recommendations = []

    // Validate qualification assessment
    const validAssessments = ['underqualified', 'well-qualified', 'overqualified']
    if (!validAssessments.includes(analysis.qualification_assessment)) {
      analysis.qualification_assessment = 'well-qualified'
    }

    return analysis
  } catch (error: any) {
    console.error('Gemini API error:', error)
    
    if (error.message?.includes('API key')) {
      throw new Error('Gemini API key is invalid or not configured. Please check your GEMINI_API_KEY in .env.local')
    }
    
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response. Please try again.')
    }
    
    throw new Error(`Failed to analyze job match: ${error.message}`)
  }
}