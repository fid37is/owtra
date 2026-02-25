'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, Globe, Search, ArrowLeft, CheckCircle, XCircle,
  Loader2, MapPin, Users, TrendingUp, ThumbsUp, ThumbsDown,
  Star, ExternalLink, Save, Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'

interface CompanyResearch {
  name: string
  slug: string
  website: string | null
  description: string | null
  industry: string | null
  company_size: string | null
  headquarters: string | null
  founded_year: number | null
  overall_rating: number | null
  culture_summary: string | null
  pros: string[]
  cons: string[]
  linkedin_url: string | null
  glassdoor_url: string | null
  tech_stack?: string[]
}

type Step = 'input' | 'researching' | 'preview'

export default function ResearchCompanyPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>('input')
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [research, setResearch] = useState<CompanyResearch | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleResearch() {
    if (!companyName.trim() && !website.trim()) {
      toast.error('Please enter a company name or website URL')
      return
    }

    setStep('researching')

    try {
      // Call edge function directly and AWAIT the result.
      // Nothing is saved to DB at this point — the edge function
      // only saves when applicationId is provided (coming from add-application flow).
      // Here we pass no applicationId so the scrape result comes back but isn't persisted.
      const { data, error } = await supabase.functions.invoke('research-company', {
        body: {
          // Pass whatever the user provided — edge function + scraper handle the rest
          companyName: companyName.trim() || undefined,
          website: website.trim() || undefined,
          saveToDb: false,
        },
      })

      if (error) throw new Error(error.message)
      if (!data?.success) throw new Error(data?.error || 'Research failed')

      const company = data.company

      if (!company) throw new Error('No company data returned')

      // Store result in memory only — nothing saved to DB yet
      setResearch({
        name: company.name,
        slug: company.slug,
        website: company.website || null,
        description: company.description || null,
        industry: company.industry || null,
        company_size: company.company_size || null,
        headquarters: company.headquarters || null,
        founded_year: company.founded_year || null,
        overall_rating: company.overall_rating || null,
        culture_summary: company.culture_summary || null,
        pros: Array.isArray(company.pros) ? company.pros : [],
        cons: Array.isArray(company.cons) ? company.cons : [],
        linkedin_url: company.linkedin_url || null,
        glassdoor_url: company.glassdoor_url || null,
        tech_stack: Array.isArray(company.tech_stack) ? company.tech_stack : [],
      })

      setStep('preview')
    } catch (err: any) {
      setStep('input')
      toast.error(err.message || 'Research failed. Please try again.')
    }
  }

  async function handleSave() {
    if (!research) return
    setSaving(true)

    try {
      // Only now do we save to DB — user explicitly confirmed
      const res = await fetch('/api/save-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: research }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }

      const { company } = await res.json()
      toast.success(`${research.name} saved to your companies`)
      router.push(`/dashboard/companies/${company.slug}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save company')
    } finally {
      setSaving(false)
    }
  }

  function handleDiscard() {
    // Nothing was saved to DB — just reset state
    setResearch(null)
    setCompanyName('')
    setWebsite('')
    setStep('input')
    toast.success('Research discarded')
  }

  function renderStars(rating: number | null) {
    if (!rating) return null
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-border'}`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">{rating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">

      {/* Back nav — context aware */}
      {step === 'preview' ? (
        <button
          onClick={() => { setStep('input'); setResearch(null) }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Research another company
        </button>
      ) : (
        <Link
          href="/dashboard/companies"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companies
        </Link>
      )}

      {/* ── STEP 1: Input ── */}
      {step === 'input' && (
        <div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Research a Company</h1>
            <p className="text-muted-foreground">
              Enter a company name or website to get an in-depth report — culture, ratings, pros, cons and more. Nothing is saved until you confirm.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Company Name
                <span className="text-muted-foreground font-normal ml-1">(optional if website is provided)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. Google, Stripe, Notion..."
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleResearch()}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Website
                <span className="text-muted-foreground font-normal ml-1">(optional — improves accuracy)</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. https://stripe.com"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleResearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleResearch}
                disabled={!companyName.trim() && !website.trim()}
                className="gap-2 font-semibold"
              >
                <Search className="w-4 h-4" />
                Research Company
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Researching ── */}
      {step === 'researching' && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Researching {companyName}...
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Pulling together culture data, ratings, pros and cons. This takes about 20–30 seconds.
          </p>
          <div className="mt-8 space-y-3">
            {['Gathering company information', 'Analysing culture & ratings', 'Compiling pros & cons', 'Finalising report'].map((hint, i) => (
              <div
                key={hint}
                className="flex items-center gap-2 text-sm text-muted-foreground"
                style={{ opacity: 0, animation: `fadeIn 0.4s ease forwards`, animationDelay: `${i * 0.6}s` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                {hint}
              </div>
            ))}
          </div>
          <style>{`@keyframes fadeIn { to { opacity: 1; } }`}</style>
        </div>
      )}

      {/* ── STEP 3: Preview ── */}
      {step === 'preview' && research && (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">Research complete</h1>
            <p className="text-muted-foreground text-sm">
              Review the report below. Save it to your companies or discard — nothing has been saved yet.
            </p>
          </div>

          {/* Report card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h2 className="text-xl font-bold text-foreground">{research.name}</h2>
                    <div className="flex items-center gap-2">
                      {research.website && (
                        <a href={research.website} target="_blank" rel="noopener noreferrer"
                           className="text-muted-foreground hover:text-primary transition-colors"
                           title="Website">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {research.linkedin_url && (
                        <a href={research.linkedin_url} target="_blank" rel="noopener noreferrer"
                           className="text-muted-foreground hover:text-primary transition-colors"
                           title="LinkedIn">
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {research.industry && (
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />{research.industry}
                      </span>
                    )}
                    {research.company_size && (
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />{research.company_size}
                      </span>
                    )}
                    {research.headquarters && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />{research.headquarters}
                      </span>
                    )}
                  </div>
                </div>
                {research.overall_rating && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-foreground">{research.overall_rating.toFixed(1)}</div>
                    {renderStars(research.overall_rating)}
                    <div className="text-xs text-muted-foreground mt-1">Overall</div>
                  </div>
                )}
              </div>
              {research.description && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{research.description}</p>
              )}
            </div>

            {/* Pros & Cons */}
            {(research.pros.length > 0 || research.cons.length > 0) && (
              <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                {research.pros.length > 0 && (
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-foreground">Pros</span>
                    </div>
                    <ul className="space-y-2">
                      {research.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {research.cons.length > 0 && (
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-semibold text-foreground">Cons</span>
                    </div>
                    <ul className="space-y-2">
                      {research.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Culture summary */}
            {research.culture_summary && (
              <div className="p-6 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground mb-2">Culture</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{research.culture_summary}</p>
              </div>
            )}

            {/* Tech stack */}
            {research.tech_stack && research.tech_stack.length > 0 && (
              <div className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {research.tech_stack.map((tech, i) => (
                    <span key={i} className="px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-md font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleDiscard}
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              <Trash2 className="w-4 h-4" />
              Discard
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save to My Companies
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}