'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database } from '@/lib/supabase/database.types'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  MapPin,
  Building2,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Sparkles,
  FileText,
  Brain
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Application = Database['public']['Tables']['applications']['Row'] & {
  company?: Database['public']['Tables']['companies']['Row']
}

interface ApplicationDetailProps {
  application: Application
}

function formatJobDescription(description: string) {
  if (!description) return null

  const lines = description.split('\n').filter(line => line.trim())

  const formattedContent: React.ReactElement[] = []
  let currentList: string[] = []
  let listType: 'bullet' | 'number' | null = null

  const flushList = () => {
    if (currentList.length > 0) {
      formattedContent.push(
        <ul key={formattedContent.length} className="list-disc list-inside space-y-1.5 my-3 ml-3">
          {currentList.map((item, idx) => (
            <li key={idx} className="text-muted-foreground leading-relaxed text-sm break-words">{item}</li>
          ))}
        </ul>
      )
      currentList = []
      listType = null
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (/^[•\-\*]\s+/.test(trimmed)) {
      const text = trimmed.replace(/^[•\-\*]\s+/, '')
      currentList.push(text)
      listType = 'bullet'
    }
    else if (/^\d+[\.)]\s+/.test(trimmed)) {
      const text = trimmed.replace(/^\d+[\.)]\s+/, '')
      currentList.push(text)
      listType = 'number'
    }
    else if (
      (trimmed === trimmed.toUpperCase() && trimmed.length < 50 && trimmed.length > 3) ||
      (trimmed.endsWith(':') && trimmed.length < 80)
    ) {
      flushList()
      formattedContent.push(
        <h3 key={index} className="text-base font-semibold text-foreground mt-5 mb-2 break-words">
          {trimmed.replace(/:$/, '')}
        </h3>
      )
    }
    else if (trimmed.length > 0) {
      flushList()
      formattedContent.push(
        <p key={index} className="text-muted-foreground leading-relaxed mb-3 text-sm break-words">
          {trimmed}
        </p>
      )
    }
  })

  flushList()

  return <div className="space-y-2">{formattedContent}</div>
}

export default function ApplicationDetail({ application }: ApplicationDetailProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showMenu, setShowMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this application?')) {
      return
    }

    setDeleting(true)

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', application.id)

      if (error) throw error

      toast.success('Application deleted', { style: { color: '#16a34a' } })
      router.push('/dashboard/applications')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message, { style: { color: '#dc2626' } })
    } finally {
      setDeleting(false)
    }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 85) return 'text-green-600 dark:text-green-400'
    if (score >= 70) return 'text-blue-600 dark:text-blue-400'
    if (score >= 55) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreLabel = (score: number | null) => {
    if (!score) return 'No Match Score'
    if (score >= 85) return 'Excellent Match'
    if (score >= 70) return 'Good Match'
    if (score >= 55) return 'Moderate Match'
    if (score >= 40) return 'Weak Match'
    return 'Poor Match'
  }

  const matchAnalysis = application.match_analysis as any

  return (
    <div className="w-full min-w-0 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/applications">
          <Button variant="ghost" className="mb-4 -ml-3 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground mb-1 break-words">
                {application.job_title}
              </h1>
              <div className="mb-2">
                {application.company?.slug ? (
                  <Link
                    href={`/dashboard/companies/${application.company.slug}`}
                    className="text-base sm:text-lg text-primary hover:opacity-80 hover:underline transition-opacity break-words inline-block"
                  >
                    {application.company_name}
                  </Link>
                ) : (
                  <p className="text-base sm:text-lg text-muted-foreground break-words">{application.company_name}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                {application.location && (
                  <div className="flex items-center gap-1 min-w-0">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{application.location}</span>
                  </div>
                )}
                {application.created_at && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Added {formatDate(application.created_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>

            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-44 bg-card rounded-xl shadow-lg border border-border py-2 z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      router.push(`/dashboard/applications/${application.id}/edit`)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-foreground text-sm"
                  >
                    <Edit className="w-4 h-4 flex-shrink-0" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      handleDelete()
                    }}
                    disabled={deleting}
                    className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-2 text-destructive text-sm disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5 min-w-0">
          {/* Status Card */}
          <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
            <h2 className="text-base font-semibold text-foreground mb-3">Status</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                  application.status
                )}`}
              >
                {getStatusLabel(application.status)}
              </span>
              {application.applied_date && (
                <span className="text-xs text-muted-foreground">
                  Applied on {formatDate(application.applied_date)}
                </span>
              )}
            </div>

            {application.status === 'interviewing' && application.interview_prep_enabled && (
              <Link href={`/dashboard/applications/${application.id}/interview-prep`} className="block mt-4">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-sm"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Start Interview Prep
                </Button>
              </Link>
            )}
          </div>

          {/* Match Analysis */}
          {application.match_score !== null && matchAnalysis && (
            <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                <h2 className="text-base font-semibold text-foreground">Match Analysis</h2>
              </div>

              <div className="mb-5 p-4 rounded-xl bg-primary/5">
                <p className="text-foreground text-sm break-words">{matchAnalysis.summary}</p>
              </div>

              <div className="space-y-5">
                {matchAnalysis.strengths && matchAnalysis.strengths.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <h3 className="font-semibold text-foreground text-sm">Strengths</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {matchAnalysis.strengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">•</span>
                          <span className="break-words">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {matchAnalysis.concerns && matchAnalysis.concerns.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                      <h3 className="font-semibold text-foreground text-sm">Concerns</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {matchAnalysis.concerns.map((concern: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0">•</span>
                          <span className="break-words">{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {matchAnalysis.recommendations && matchAnalysis.recommendations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <h3 className="font-semibold text-foreground text-sm">Recommendations</h3>
                    </div>
                    <ul className="space-y-1.5">
                      {matchAnalysis.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">•</span>
                          <span className="break-words">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Company Info Card */}
          {application.company && (
            <Link href={`/dashboard/companies/${application.company.slug}`}>
              <div className="bg-card rounded-xl shadow-sm p-5 border border-border hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <h2 className="text-base font-semibold text-foreground">Company Information</h2>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
                </div>

                {application.company.description && (
                  <p className="text-muted-foreground mb-3 line-clamp-3 text-sm break-words">
                    {application.company.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  {application.company.industry && (
                    <span className="px-2.5 py-1 bg-muted text-foreground rounded-full">
                      {application.company.industry}
                    </span>
                  )}
                  {application.company.company_size && (
                    <span className="px-2.5 py-1 bg-muted text-foreground rounded-full">
                      {application.company.company_size}
                    </span>
                  )}
                  {application.company.overall_rating !== null && (
                    <span className="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-medium">
                      ★ {application.company.overall_rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* Job Description */}
          {application.job_description && (
            <div className="bg-card rounded-xl shadow-sm p-5 border border-border overflow-hidden">
              <h2 className="text-base font-semibold text-foreground mb-3">Job Description</h2>
              <div className="max-w-full overflow-hidden">
                {formatJobDescription(application.job_description)}
              </div>
            </div>
          )}

          {/* Notes */}
          {application.notes && (
            <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
              <h2 className="text-base font-semibold text-foreground mb-3">Notes</h2>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm break-words">{application.notes}</p>
            </div>
          )}

          {/* Job URL */}
          {application.job_url && (
            <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
              <h2 className="text-base font-semibold text-foreground mb-3">Original Posting</h2>
              <a
                href={application.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity text-sm min-w-0"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{application.job_url}</span>
              </a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5 min-w-0">
          {/* Match Score */}
          {application.match_score !== null && (
            <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
              <h3 className="text-xs font-medium text-muted-foreground mb-3">Match Score</h3>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-2 bg-primary/10">
                  <span className={`text-3xl font-bold ${getScoreColor(application.match_score)}`}>
                    {application.match_score}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground mb-0.5">
                  {getScoreLabel(application.match_score)}
                </p>
                <p className="text-xs text-muted-foreground">Based on your preferences</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
            <h3 className="text-xs font-medium text-muted-foreground mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start rounded-xl text-sm"
                onClick={() => router.push(`/dashboard/applications/${application.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">Edit Details</span>
              </Button>

              {application.status === 'interviewing' && application.interview_prep_enabled && (
                <Link href={`/dashboard/applications/${application.id}/interview-prep`} className="block">
                  <Button variant="outline" className="w-full justify-start rounded-xl text-sm">
                    <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Interview Prep</span>
                  </Button>
                </Link>
              )}

              {application.company && (
                <Link href={`/dashboard/companies/${application.company.slug}`} className="block">
                  <Button variant="outline" className="w-full justify-start rounded-xl text-sm">
                    <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Company Info</span>
                  </Button>
                </Link>
              )}

              {application.job_url && (
                <a href={application.job_url} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full justify-start rounded-xl text-sm">
                    <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">View Job Posting</span>
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-card rounded-xl shadow-sm p-5 border border-border">
            <h3 className="text-xs font-medium text-muted-foreground mb-3">Timeline</h3>
            <div className="space-y-3">
              {application.created_at && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground break-words">Added to TrailAm</p>
                    <p className="text-xs text-muted-foreground">{formatDate(application.created_at)}</p>
                  </div>
                </div>
              )}
              {application.applied_date && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground break-words">Applied</p>
                    <p className="text-xs text-muted-foreground">{formatDate(application.applied_date)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}