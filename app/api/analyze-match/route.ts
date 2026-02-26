// app/api/analyze-match/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeJobMatch, type MatchAnalysisResult } from '@/lib/ai/match-analyzer'
import { isAIConfigured, getAIProvider, getProviderName } from '@/lib/ai/providers'
import { getApiErrorMessage, getHttpStatus } from '@/lib/ai/errors'

export async function POST(request: Request) {
    try {
        // Check if AI is configured
        if (!isAIConfigured()) {
            const provider = getAIProvider()
            return NextResponse.json(
                {
                    error: `AI provider ${getProviderName(provider)} is not configured. Please add the API key to your environment variables.`
                },
                { status: 503 }
            )
        }

        const supabase = await createClient()

        // Verify authentication
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { applicationId, jobTitle, companyName, location, jobDescription } = body

        let jobData: {
            job_title: string
            company_name: string
            location: string | null
            job_description: string
        }

        // Two modes: analyze existing application OR analyze before saving
        if (applicationId) {
            // MODE 1: Analyze existing application
            const { data: application, error: appError } = await supabase
                .from('applications')
                .select('*')
                .eq('id', applicationId)
                .eq('user_id', user.id)
                .single()

            if (appError || !application) {
                return NextResponse.json({ error: 'Application not found' }, { status: 404 })
            }

            jobData = {
                job_title: application.job_title,
                company_name: application.company_name,
                location: application.location,
                job_description: application.job_description ?? ''
            }
        } else if (jobTitle && companyName) {
            // MODE 2: Analyze before saving (preview mode)
            jobData = {
                job_title: jobTitle,
                company_name: companyName,
                location: location || null,
                job_description: jobDescription || ''
            }
        } else {
            return NextResponse.json(
                { error: 'Either applicationId or job details (jobTitle, companyName) required' },
                { status: 400 }
            )
        }

        // Check if job description exists and is sufficient
        if (!jobData.job_description || jobData.job_description.trim().length < 100) {
            return NextResponse.json(
                { error: 'Job description is too short or missing. Please add more details to enable AI analysis.' },
                { status: 400 }
            )
        }

        // Fetch user preferences AND professional profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`
                top_values, 
                deal_breakers, 
                work_location_preference, 
                preferred_company_size, 
                preferred_industries,
                current_job_title,
                experience_level,
                skills,
                career_goals,
                short_term_goal,
                long_term_goal
            `)
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const hasPreferences =
            (Array.isArray(profile.top_values) && profile.top_values.length > 0) ||
            (Array.isArray(profile.deal_breakers) && profile.deal_breakers.length > 0) ||
            profile.work_location_preference ||
            profile.preferred_company_size ||
            (Array.isArray(profile.preferred_industries) && profile.preferred_industries.length > 0)

        const hasProfile =
            profile.current_job_title ||
            profile.experience_level ||
            (Array.isArray(profile.skills) && profile.skills.length > 0)

        if (!hasPreferences && !hasProfile) {
            const emptyAnalysis: MatchAnalysisResult = {
                match_score: 0,
                category_scores: {
                    values_alignment: 0,
                    culture_fit: 0,
                    growth_opportunity: 0,
                    practical_fit: 0,
                    qualification_match: 0
                },
                strengths: [],
                concerns: [],
                recommendations: ['Complete your professional profile and preferences to get personalized match insights'],
                interview_question: 'What does success look like in this role?',
                summary: 'Complete your profile (job title, skills, experience) and preferences to receive AI-powered job matching analysis.',
                qualification_assessment: 'well-qualified'
            }

            return NextResponse.json({
                matchScore: null,
                analysis: emptyAnalysis
            })
        }

        // Perform AI analysis with comprehensive profile data
        const analysis = await analyzeJobMatch(
            jobData.job_title,
            jobData.company_name,
            jobData.job_description,
            jobData.location,
            {
                top_values: Array.isArray(profile.top_values) ? profile.top_values as string[] : [],
                deal_breakers: Array.isArray(profile.deal_breakers) ? profile.deal_breakers as string[] : [],
                work_location_preference: profile.work_location_preference,
                preferred_company_size: profile.preferred_company_size,
                preferred_industries: profile.preferred_industries,
                current_job_title: profile.current_job_title,
                experience_level: profile.experience_level,
                skills: Array.isArray(profile.skills) ? profile.skills as string[] : null,
                career_goals: profile.career_goals,
                short_term_goal: profile.short_term_goal,
                long_term_goal: profile.long_term_goal,
            }
        )

        // If analyzing existing application, save the result
        if (applicationId) {
            const { error: updateError } = await supabase
                .from('applications')
                .update({
                    match_score: analysis.match_score,
                    match_analysis: analysis as any,
                })
                .eq('id', applicationId)

            if (updateError) {
                console.error('Failed to update application:', updateError)
                return NextResponse.json({ error: 'Failed to save analysis results' }, { status: 500 })
            }
        }

        return NextResponse.json({
            success: true,
            matchScore: analysis.match_score,
            analysis
        })

    } catch (error: any) {
        console.error('Match analysis error:', error)
        return NextResponse.json(
            { error: getApiErrorMessage(error, 'analyze your match') },
            { status: getHttpStatus(error) }
        )
    }
}