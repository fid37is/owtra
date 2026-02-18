'use client'

import { Application } from '@/lib/supabase/dodo-types'
import { TrendingUp, TrendingDown, Target, Clock, Award, Sparkles, X, Loader2 } from 'lucide-react'
import { useState, useEffect, JSX } from 'react'
import { Button } from '@/components/ui/button'

interface InsightsDashboardProps {
  applications: Application[]
}

function InsightsDashboard({ applications }: InsightsDashboardProps) {
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Calculate statistics
  const totalApplications = applications.length
  const appliedCount = applications.filter(app => app.status === 'applied').length
  const interviewingCount = applications.filter(app => app.status === 'interviewing').length
  const offersCount = applications.filter(app => app.status === 'offer').length
  const rejectedCount = applications.filter(app => app.status === 'rejected').length
  const notAppliedCount = applications.filter(app => app.status === 'not_applied').length

  const responseRate = appliedCount > 0 
    ? ((interviewingCount + offersCount) / appliedCount * 100).toFixed(1)
    : '0'

  const averageMatchScore = applications.length > 0
    ? (applications.reduce((sum, app) => sum + (app.match_score || 0), 0) / applications.length).toFixed(0)
    : '0'

  // Most common locations
  const locationCounts: Record<string, number> = {}
  applications.forEach(app => {
    if (app.location) {
      locationCounts[app.location] = (locationCounts[app.location] || 0) + 1
    }
  })
  const topLocations = Object.entries(locationCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Application trend (last 7 days vs previous 7 days)
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const recentApps = applications.filter(app => 
    app.created_at && new Date(app.created_at) >= sevenDaysAgo
  ).length

  const previousApps = applications.filter(app => 
    app.created_at && 
    new Date(app.created_at) >= fourteenDaysAgo && 
    new Date(app.created_at) < sevenDaysAgo
  ).length

  const trendPercentage = previousApps > 0
    ? ((recentApps - previousApps) / previousApps * 100).toFixed(0)
    : '0'

  const isPositiveTrend = Number(trendPercentage) >= 0

  const handleGetAIInsights = async () => {
    setShowAIInsights(true)
    setLoading(true)

    try {
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
          topLocations: topLocations.map(([loc, count]) => ({ location: loc, count })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate insights')
      }

      const data = await response.json()
      setAiInsights(data.insights)
    } catch (error) {
      console.error('Error generating AI insights:', error)
      setAiInsights('Sorry, I couldn\'t generate insights at this time. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Listen for AI Insights trigger from button
  useEffect(() => {
    const handleOpenInsights = () => {
      handleGetAIInsights()
    }
    window.addEventListener('openAIInsights', handleOpenInsights)
    return () => window.removeEventListener('openAIInsights', handleOpenInsights)
  }, [])

  // Function to format AI insights text
  const formatInsights = (text: string) => {
    // Pre-process: Split inline titles from paragraphs
    const processed = text
      .replace(/([.!?])([A-Z][a-z]+ [A-Z][a-z]+:)/g, '$1\n\n$2')
      .replace(/([.!?])(\*\*[A-Z][^*]+\*\*:)/g, '$1\n\n$2')

    const lines = processed.split('\n')
    const elements: JSX.Element[] = []

    lines.forEach((line, index) => {
      const trimmed = line.trim()

      // Skip empty lines
      if (!trimmed) {
        elements.push(<div key={`empty-${index}`} className="h-2" />)
        return
      }

      // Section headers with dividers (━━━)
      if (line.startsWith('━━━')) {
        const title = line.replace(/━━━/g, '').trim()
        elements.push(
          <div key={`divider-${index}`} className="pt-6 first:pt-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
              <h3 className="text-xs sm:text-base font-semibold text-primary uppercase tracking-wide whitespace-nowrap">
                {title}
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
            </div>
          </div>
        )
        return
      }

      // Section titles (ending with :)
      if (trimmed.endsWith(':') && 
          trimmed.length < 80 && 
          !trimmed.startsWith('•') &&
          !trimmed.startsWith('-') &&
          !trimmed.match(/^\d+\./)) {
        const title = trimmed.replace(/^\*\*(.*?)\*\*$/, '$1').replace(/:$/, '')
        elements.push(
          <h4 key={`title-${index}`} className="text-sm sm:text-base font-bold text-foreground mt-6 mb-3 first:mt-0">
            {title}
          </h4>
        )
        return
      }

      // Numbered lists
      if (trimmed.match(/^\d+\.\s/)) {
        const number = trimmed.match(/^\d+\./)?.[0] || ''
        const content = trimmed.replace(/^\d+\.\s*/, '')
        elements.push(
          <div key={`num-${index}`} className="flex gap-2 sm:gap-3 text-foreground/90 leading-relaxed pl-2">
            <span className="text-primary font-semibold flex-shrink-0">{number}</span>
            <span className="flex-1 text-sm sm:text-base">{content}</span>
          </div>
        )
        return
      }

      // Bullet points
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        const content = trimmed.replace(/^[•\-]\s*/, '')
        elements.push(
          <div key={`bullet-${index}`} className="flex gap-2 sm:gap-3 text-foreground/90 leading-relaxed pl-2">
            <span className="text-primary mt-1 flex-shrink-0">•</span>
            <span className="flex-1 text-sm sm:text-base">{content}</span>
          </div>
        )
        return
      }

      // Regular paragraphs
      elements.push(
        <p key={`p-${index}`} className="text-foreground/90 leading-relaxed text-sm sm:text-base">
          {line}
        </p>
      )
    })

    return elements
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Modal */}
      {showAIInsights && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2">
          <div className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 sm:p-6 border-b border-border flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">AI Career Advisor</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Personalized insights for your job search</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAIInsights(false)}
                  className="hover:bg-accent flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground text-center text-sm">Analyzing your job search patterns...</p>
                </div>
              ) : aiInsights ? (
                <div className="space-y-4">
                  {formatInsights(aiInsights)}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-border bg-muted/30 flex-shrink-0">
              <p className="text-xs text-muted-foreground text-center">
                💡 These insights are AI-generated based on your application data
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Stats - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Total"
          value={totalApplications.toString()}
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="In Progress"
          value={interviewingCount.toString()}
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          label="Offers"
          value={offersCount.toString()}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Response"
          value={`${responseRate}%`}
        />
      </div>

      {/* Application Trend & Average Match */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Trend */}
        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Application Activity</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className={`p-3 rounded-xl flex-shrink-0 ${isPositiveTrend ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {isPositiveTrend ? (
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {recentApps} applications
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Last 7 days • {isPositiveTrend ? '+' : ''}{trendPercentage}% from previous week
              </p>
            </div>
          </div>
        </div>

        {/* Average Match Score */}
        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Average Match Score</h2>
          {applications.some(app => app.match_score) ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-4xl sm:text-5xl font-bold text-primary">
                {averageMatchScore}%
              </div>
              <p className="text-sm text-muted-foreground">
                Overall alignment with your preferences
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No match score data yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Add applications to track match scores
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Breakdown & Top Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-6">Status Breakdown</h2>
          <div className="space-y-4">
            <StatusBar label="Applied" count={appliedCount} total={totalApplications} color="hsl(var(--secondary))" />
            <StatusBar label="Interviewing" count={interviewingCount} total={totalApplications} color="#fbbf24" />
            <StatusBar label="Offers" count={offersCount} total={totalApplications} color="#10b981" />
            <StatusBar label="Rejected" count={rejectedCount} total={totalApplications} color="#ef4444" />
          </div>
        </div>

        {/* Top Locations */}
        {topLocations.length > 0 && (
          <div className="bg-card rounded-2xl shadow-sm p-6 border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-6">Top Locations</h2>
            <div className="space-y-3">
              {topLocations.map(([location, count]) => (
                <div key={location} className="flex items-center justify-between py-2">
                  <span className="text-foreground font-medium text-sm truncate">{location}</span>
                  <span className="text-sm font-medium text-muted-foreground px-3 py-1 bg-muted rounded-full flex-shrink-0">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      {totalApplications > 0 && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20 flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Need personalized advice?</h3>
              <p className="text-sm text-muted-foreground">
                Click the AI Advisor icon at the top right to get intelligent insights and recommendations for your job search
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalApplications === 0 && (
        <div className="bg-card rounded-2xl shadow-sm p-8 sm:p-12 border border-border text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No data yet
          </h3>
          <p className="text-muted-foreground">
            Start tracking applications to see your insights
          </p>
        </div>
      )}
    </div>
  )
}

InsightsDashboard.displayName = 'InsightsDashboard'

export default InsightsDashboard

function StatCard({ icon, label, value }: { 
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-card rounded-xl shadow-sm p-4 sm:p-5 border border-border hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
          {icon}
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-foreground text-right">{value}</div>
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function StatusBar({ label, count, total, color }: {
  label: string
  count: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? (count / total * 100).toFixed(0) : '0'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs sm:text-sm text-muted-foreground">{count} ({percentage}%)</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}