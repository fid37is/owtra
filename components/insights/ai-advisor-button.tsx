'use client'

import { Sparkles } from 'lucide-react'
import { Application } from '@/lib/supabase/dodo-types'

interface AIAdvisorButtonProps {
  applications: Application[]
}

export default function AIAdvisorButton({ applications }: AIAdvisorButtonProps) {
  const handleClick = () => {
    // Trigger the AI insights modal
    const event = new CustomEvent('openAIInsights')
    window.dispatchEvent(event)
  }

  if (applications.length === 0) return null

  return (
    <div className="flex items-center gap-3 sm:gap-6">
      <div className="flex items-center gap-2">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">AI Advisor</span>
        <svg 
          width="16" 
          height="8" 
          viewBox="0 0 16 8" 
          className="text-muted-foreground flex-shrink-0"
        >
          <path d="M0 4 L12 4 L10 2 M12 4 L10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <button
        onClick={handleClick}
        className="group relative w-12 h-12 rounded-xl bg-background/40 backdrop-blur-md border border-primary/20 shadow-lg hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex items-center justify-center animate-bounce hover:animate-none flex-shrink-0"
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50 blur-lg animate-pulse"></div>
        <Sparkles className="w-5 h-5 text-primary relative z-10 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  )
}