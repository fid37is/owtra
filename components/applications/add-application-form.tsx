// components/AddApplicationForm/index.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  Link as LinkIcon,
  Building2,
  MapPin,
  Briefcase,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import StepIndicator from './application-form/StepIndicator'
import MeteoriteLoader from './application-form/MeteoriteLoader'

interface AddApplicationFormProps {
  userId: string
}

interface MatchAnalysis {
  matchScore: number | null
  analysis: {
    strengths: string[]
    concerns: string[]
    recommendations: string[]
    summary: string
  }
}

type FormStep = 'url' | 'details' | 'analysis' | 'research' | 'save'

// ─────────────────────────────────────────────
// Global client-side error normalizer
// Maps any fetch/API/Supabase error to a clean user-facing message
// ─────────────────────────────────────────────
function getFriendlyError(err: any, fallback = 'Something went wrong. Please try again.'): string {
  const msg: string = err?.message || ''

  // Pass through messages that are already clean (set by our own API routes)
  // These are short, don't contain URLs, brackets, or technical jargon
  const looksClean = msg.length > 0 && msg.length < 120 && !/[{[\]<>]/.test(msg) && !/https?:\/\//.test(msg)
  if (looksClean) return msg

  // Catch-all for anything that slipped through as raw
  return fallback
}

// Safe JSON parser — handles cases where the server returns non-JSON (e.g. a Next.js error page)
async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

export default function AddApplicationForm({ userId }: AddApplicationFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<FormStep>('url')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [researching, setResearching] = useState(false)

  // Form state
  const [jobUrl, setJobUrl] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [location, setLocation] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [status, setStatus] = useState<'not_applied' | 'applied'>('not_applied')
  const [appliedDate, setAppliedDate] = useState('')
  const [notes, setNotes] = useState('')

  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(null)
  const [interviewPrepEnabled, setInterviewPrepEnabled] = useState(false)
  const [companyResearch, setCompanyResearch] = useState<any>(null)

  // ─── URL Step ─────────────────────────────────────────────────────────────
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!jobUrl || jobUrl.trim() === '') {
      toast.error('Please enter a job URL', { style: { color: '#dc2626' } })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/scrape-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl }),
      })

      const data = await safeJson(response)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch job details')
      }

      setJobTitle(data.jobTitle || '')
      setCompanyName(data.companyName || '')
      setLocation(data.location || '')
      setJobDescription(data.description || '')

      setStep('details')
      toast.success('Job details extracted!', { style: { color: '#16a34a' } })
    } catch (err: any) {
      toast.error(
        getFriendlyError(err, 'Failed to extract job details. Please enter manually.'),
        { style: { color: '#dc2626' } }
      )
      // Still proceed to details so user can enter manually
      setStep('details')
    } finally {
      setLoading(false)
    }
  }

  // ─── Details Step → Analysis ───────────────────────────────────────────────
  const handleAnalyzeMatch = async () => {
    if (!jobTitle || !companyName) {
      toast.error('Job title and company name are required', { style: { color: '#dc2626' } })
      return
    }

    setAnalyzing(true)

    try {
      const response = await fetch('/api/analyze-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, companyName, location, jobDescription }),
      })

      const data = await safeJson(response)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze match')
      }

      setMatchAnalysis(data)
      setStep('analysis')
    } catch (err: any) {
      toast.error(
        getFriendlyError(err, 'Failed to analyze match. Please try again.'),
        { style: { color: '#dc2626' } }
      )
    } finally {
      setAnalyzing(false)
    }
  }

  // ─── Analysis Step → Research ──────────────────────────────────────────────
  const handleProceedToResearch = () => {
    setStep('research')
  }

  // ─── Research Step ─────────────────────────────────────────────────────────
  // Research fires after save with the real applicationId — not here
  const handleResearchComplete = () => {
    setCompanyResearch({ queued: true })
    setStep('save')
  }

  const handleSkipResearch = () => {
    setStep('save')
  }

  // ─── Save Application ──────────────────────────────────────────────────────
  const handleSaveApplication = async () => {
    setLoading(true)

    try {
      // 1. Save application record
      const { data: application, error } = await supabase
        .from('applications')
        .insert({
          user_id: userId,
          company_id: null,
          job_url: jobUrl,
          job_title: jobTitle,
          company_name: companyName,
          location: location || null,
          job_description: jobDescription || null,
          status,
          applied_date: status === 'applied' && appliedDate ? appliedDate : null,
          notes: notes || null,
          match_score: matchAnalysis?.matchScore || null,
          match_analysis: matchAnalysis?.analysis || null,
          interview_prep_enabled: interviewPrepEnabled,
        })
        .select()
        .single()

      if (error) {
        // Supabase errors can be technical — normalize them
        throw new Error('Failed to save application. Please try again.')
      }

      // 2. Navigate immediately — don't wait for anything else
      toast.success('Application saved!', { style: { color: '#16a34a' } })
      router.push('/dashboard/applications')
      router.refresh()

      // 3. Fire company research in background AFTER navigation
      const researchToastId = toast.loading(`Researching ${companyName} in background...`, {
        duration: Infinity,
      })

      const getOrigin = () => {
        try { return jobUrl ? new URL(jobUrl).origin : null } catch { return null }
      }

      fetch('/api/research-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          website: getOrigin(),
          applicationId: application.id,
        }),
      })
        .then(async (res) => {
          const data = await safeJson(res)
          toast.dismiss(researchToastId)
          if (data.success) {
            toast.success(`${companyName} research complete!`, {
              duration: 4000,
              style: { color: '#16a34a' },
            })
          } else {
            // Non-fatal — log only, don't surface to user
            console.warn('Research completed with issues:', data.error)
          }
        })
        .catch((err) => {
          toast.dismiss(researchToastId)
          console.error('Research fire failed (non-fatal):', err)
        })

      // 4. Fire interview prep in background if enabled
      if (interviewPrepEnabled) {
        fetch('/api/generate-interview-prep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId: application.id }),
        }).catch((err) => console.error('Interview prep failed (non-fatal):', err))
      }

    } catch (err: any) {
      console.error('Save error:', err)
      toast.error(
        getFriendlyError(err, 'Failed to save application. Please try again.'),
        { style: { color: '#dc2626' } }
      )
      setLoading(false)
    }
  }

  // ─── Navigation ────────────────────────────────────────────────────────────
  const handleBack = () => {
    if (step === 'save') setStep('research')
    else if (step === 'research') setStep('analysis')
    else if (step === 'analysis') setStep('details')
    else if (step === 'details') setStep('url')
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 55) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number | null) => {
    if (!score) return 'No Score'
    if (score >= 85) return 'Excellent Match'
    if (score >= 70) return 'Good Match'
    if (score >= 55) return 'Moderate Match'
    if (score >= 40) return 'Weak Match'
    return 'Poor Match'
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4">
      <div className="bg-card rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 md:p-8 border border-border w-full">
        <StepIndicator currentStep={step} isLoading={loading || analyzing || researching} />

        {/* URL Step */}
        {step === 'url' && !loading && (
          <URLStep jobUrl={jobUrl} setJobUrl={setJobUrl} onSubmit={handleUrlSubmit} onSkip={() => setStep('details')} />
        )}
        {step === 'url' && loading && <MeteoriteLoader message="Extracting job details..." />}

        {/* Details Step */}
        {step === 'details' && !analyzing && (
          <DetailsStep
            jobUrl={jobUrl} setJobUrl={setJobUrl}
            jobTitle={jobTitle} setJobTitle={setJobTitle}
            companyName={companyName} setCompanyName={setCompanyName}
            location={location} setLocation={setLocation}
            jobDescription={jobDescription} setJobDescription={setJobDescription}
            status={status} setStatus={setStatus}
            appliedDate={appliedDate} setAppliedDate={setAppliedDate}
            notes={notes} setNotes={setNotes}
            onAnalyze={handleAnalyzeMatch}
            onBack={handleBack}
          />
        )}
        {step === 'details' && analyzing && <MeteoriteLoader message="Analyzing match..." />}

        {/* Analysis Step */}
        {step === 'analysis' && (
          <AnalysisStep
            matchAnalysis={matchAnalysis}
            getScoreColor={getScoreColor}
            getScoreLabel={getScoreLabel}
            onProceed={handleProceedToResearch}
            onBack={handleBack}
          />
        )}

        {/* Research Step */}
        {step === 'research' && !researching && (
          <ResearchStep
            companyName={companyName}
            onComplete={handleResearchComplete}
            onSkip={handleSkipResearch}
            onBack={handleBack}
            research={companyResearch}
          />
        )}
        {step === 'research' && researching && <MeteoriteLoader message="Starting company research..." />}

        {/* Save Step */}
        {step === 'save' && (
          <SaveStep
            interviewPrepEnabled={interviewPrepEnabled}
            setInterviewPrepEnabled={setInterviewPrepEnabled}
            onSave={handleSaveApplication}
            onBack={handleBack}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function URLStep({ jobUrl, setJobUrl, onSubmit, onSkip }: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <Label htmlFor="jobUrl" className="text-foreground font-medium text-sm sm:text-base">
          Job URL
        </Label>
        <div className="relative mt-2">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
          <Input
            id="jobUrl"
            type="url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://example.com/jobs/software-engineer"
            className="h-10 sm:h-12 pl-9 sm:pl-10 border-input focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl text-sm"
            autoFocus
          />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
          Paste the link from LinkedIn, Indeed, or any job board
        </p>
      </div>

      <Button
        type="submit"
        className="w-full h-10 sm:h-12 bg-primary text-primary-foreground font-semibold rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity text-sm sm:text-base"
      >
        Continue
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs sm:text-sm">
          <span className="px-2 sm:px-3 bg-card text-muted-foreground">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onSkip}
        className="w-full h-10 sm:h-12 border-border rounded-lg sm:rounded-xl hover:bg-accent hover:text-accent-foreground text-sm sm:text-base"
      >
        Enter details manually
      </Button>
    </form>
  )
}

function DetailsStep(props: any) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); props.onAnalyze() }} className="space-y-4 sm:space-y-6">
      <div>
        <Label htmlFor="jobUrlDisplay" className="text-foreground font-medium text-sm sm:text-base">Job URL</Label>
        <div className="relative mt-2">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
          <Input
            id="jobUrlDisplay" type="url" value={props.jobUrl}
            onChange={(e) => props.setJobUrl(e.target.value)}
            placeholder="https://example.com/jobs/software-engineer"
            className="h-10 sm:h-12 pl-9 sm:pl-10 border-input focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl text-sm"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="jobTitle" className="text-foreground font-medium text-sm sm:text-base">
          Job Title <span className="text-destructive">*</span>
        </Label>
        <div className="relative mt-2">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
          <Input
            id="jobTitle" type="text" value={props.jobTitle} required
            onChange={(e) => props.setJobTitle(e.target.value)}
            placeholder="Senior Software Engineer"
            className="h-10 sm:h-12 pl-9 sm:pl-10 border-input focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl text-sm"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="companyName" className="text-foreground font-medium text-sm sm:text-base">
          Company Name <span className="text-destructive">*</span>
        </Label>
        <div className="relative mt-2">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
          <Input
            id="companyName" type="text" value={props.companyName} required
            onChange={(e) => props.setCompanyName(e.target.value)}
            placeholder="Acme Corporation"
            className="h-10 sm:h-12 pl-9 sm:pl-10 border-input focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl text-sm"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location" className="text-foreground font-medium text-sm sm:text-base">Location</Label>
        <div className="relative mt-2">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
          <Input
            id="location" type="text" value={props.location}
            onChange={(e) => props.setLocation(e.target.value)}
            placeholder="San Francisco, CA (Remote)"
            className="h-10 sm:h-12 pl-9 sm:pl-10 border-input focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl text-sm"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="jobDescription" className="text-foreground font-medium text-sm sm:text-base">Job Description</Label>
        <Textarea
          id="jobDescription" value={props.jobDescription} rows={5}
          onChange={(e) => props.setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          className="mt-2 border-input focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl resize-none text-sm"
        />
      </div>

      <div>
        <Label className="text-foreground font-medium mb-3 block text-sm sm:text-base">Application Status</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => props.setStatus('not_applied')}
            className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 text-center transition-all text-sm sm:text-base ${
              props.status === 'not_applied' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground hover:bg-muted'
            }`}
          >
            <div className="font-semibold text-foreground">Not Applied Yet</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Planning to apply</div>
          </button>

          <button
            type="button"
            onClick={() => props.setStatus('applied')}
            className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 text-center transition-all text-sm sm:text-base ${
              props.status === 'applied' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground hover:bg-muted'
            }`}
          >
            <div className="font-semibold text-foreground">Already Applied</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">Submitted application</div>
          </button>
        </div>
      </div>

      {props.status === 'applied' && (
        <div>
          <Label htmlFor="appliedDate" className="text-foreground font-medium text-sm sm:text-base">Application Date</Label>
          <Input
            id="appliedDate" type="date" value={props.appliedDate}
            onChange={(e) => props.setAppliedDate(e.target.value)}
            className="h-10 sm:h-12 mt-2 border-input focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl text-sm"
          />
        </div>
      )}

      <div>
        <Label htmlFor="notes" className="text-foreground font-medium text-sm sm:text-base">Notes</Label>
        <Textarea
          id="notes" value={props.notes} rows={4}
          onChange={(e) => props.setNotes(e.target.value)}
          placeholder="Any additional notes or thoughts about this opportunity..."
          className="mt-2 border-input focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl resize-none text-sm"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4">
        <Button
          type="button" variant="outline" onClick={props.onBack}
          className="flex-1 h-10 sm:h-12 border-border rounded-lg sm:rounded-xl hover:bg-accent hover:text-accent-foreground text-sm sm:text-base"
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 h-10 sm:h-12 bg-primary text-primary-foreground font-semibold rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity text-sm sm:text-base"
        >
          <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 mr-1.5 sm:mr-2" />
          Analyze Match
        </Button>
      </div>
    </form>
  )
}

function AnalysisStep({ matchAnalysis, getScoreColor, getScoreLabel, onProceed, onBack }: any) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center py-6 sm:py-8 border-b border-border">
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-3 sm:mb-4 bg-primary/10">
          <span className={`text-3xl sm:text-4xl font-bold ${getScoreColor(matchAnalysis?.matchScore || null)}`}>
            {matchAnalysis?.matchScore || '--'}
          </span>
        </div>
        <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
          {getScoreLabel(matchAnalysis?.matchScore || null)}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground px-2">
          {matchAnalysis?.analysis.summary || 'No analysis available'}
        </p>
      </div>

      {matchAnalysis?.analysis.strengths?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-green-600 flex-shrink-0" />
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {matchAnalysis.analysis.strengths.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-foreground">
                <span className="text-green-600 mt-0.5 flex-shrink-0">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {matchAnalysis?.analysis.concerns?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-600 flex-shrink-0" />
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Concerns</h3>
          </div>
          <ul className="space-y-2">
            {matchAnalysis.analysis.concerns.map((c: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-foreground">
                <span className="text-yellow-600 mt-0.5 flex-shrink-0">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {matchAnalysis?.analysis.recommendations?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 sm:w-5 h-4 sm:h-5 text-secondary flex-shrink-0" />
            <h3 className="font-semibold text-foreground text-sm sm:text-base">Recommendations</h3>
          </div>
          <ul className="space-y-2">
            {matchAnalysis.analysis.recommendations.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-foreground">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 border-t border-border">
        <Button
          type="button" variant="outline" onClick={onBack}
          className="flex-1 h-10 sm:h-12 border-border rounded-lg sm:rounded-xl hover:bg-accent hover:text-accent-foreground text-sm sm:text-base"
        >
          Edit Details
        </Button>
        <Button
          type="button" onClick={onProceed}
          className="flex-1 h-10 sm:h-12 bg-primary text-primary-foreground font-semibold rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity text-sm sm:text-base"
        >
          Next: Research Company
        </Button>
      </div>
    </div>
  )
}

function ResearchStep({ companyName, onComplete, onSkip, onBack, research }: any) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {!research ? (
        <>
          <div className="p-4 sm:p-6 bg-muted rounded-lg sm:rounded-xl border border-border">
            <h3 className="font-semibold text-foreground text-base sm:text-lg mb-2">
              Research {companyName}?
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              We'll gather company culture, insights, and interview tips to help you prepare — all in the background while you continue.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground italic">
              ✨ Research runs silently after saving — you won't have to wait at all.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4">
            <Button
              type="button" variant="outline" onClick={onBack}
              className="flex-1 h-10 sm:h-12 border-border rounded-lg sm:rounded-xl hover:bg-accent hover:text-accent-foreground text-sm sm:text-base"
            >
              Back
            </Button>
            <Button
              type="button" variant="outline" onClick={onSkip}
              className="flex-1 h-10 sm:h-12 border-border rounded-lg sm:rounded-xl hover:bg-accent hover:text-accent-foreground text-sm sm:text-base"
            >
              Skip
            </Button>
            <Button
              type="button" onClick={onComplete}
              className="flex-1 h-10 sm:h-12 bg-primary text-primary-foreground font-semibold rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity text-sm sm:text-base"
            >
              Yes, Research Company
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="p-4 sm:p-6 bg-green-50 dark:bg-green-950 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100 text-base sm:text-lg mb-1">
                  Research Queued!
                </h3>
                <p className="text-sm sm:text-base text-green-800 dark:text-green-200">
                  Once you save, we'll research {companyName} in the background. A notification will appear when it's ready.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4">
            <Button
              type="button" variant="outline" onClick={onBack}
              className="flex-1 h-10 sm:h-12 border-border rounded-lg sm:rounded-xl hover:bg-accent hover:text-accent-foreground text-sm sm:text-base"
            >
              Back
            </Button>
            <Button
              type="button" onClick={onSkip}
              className="flex-1 h-10 sm:h-12 bg-primary text-primary-foreground font-semibold rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity text-sm sm:text-base"
            >
              Continue to Save
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function SaveStep({ interviewPrepEnabled, setInterviewPrepEnabled, onSave, onBack, loading }: any) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-muted rounded-lg sm:rounded-xl gap-3">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1">
            <FileText className="w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-medium text-foreground text-sm sm:text-base">Enable Interview Prep</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Generate AI-powered interview questions when status changes to "Interviewing"
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setInterviewPrepEnabled(!interviewPrepEnabled)}
            className={`relative inline-flex h-5 sm:h-6 w-9 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 ${
              interviewPrepEnabled ? 'bg-primary' : 'bg-input'
            }`}
          >
            <span
              className={`inline-block h-3 sm:h-4 w-3 sm:w-4 transform rounded-full bg-white transition-transform ${
                interviewPrepEnabled ? 'translate-x-4 sm:translate-x-6' : 'translate-x-0.5 sm:translate-x-1'
              }`}
            />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
          💡 Interview prep will automatically generate when you update your application status to "Interviewing". Enable this option to get AI-powered questions based on the job description and company research.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 border-t border-border">
        <Button
          type="button" variant="outline" onClick={onBack} disabled={loading}
          className="flex-1 h-10 sm:h-12 border-border rounded-lg sm:rounded-xl hover:bg-accent hover:text-accent-foreground text-sm sm:text-base"
        >
          Back
        </Button>
        <Button
          type="button" onClick={onSave} disabled={loading}
          className="flex-1 h-10 sm:h-12 bg-primary text-primary-foreground font-semibold rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity text-sm sm:text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Saving...</span>
              <span className="sm:hidden">Save...</span>
            </>
          ) : (
            'Save Application'
          )}
        </Button>
      </div>
    </div>
  )
}