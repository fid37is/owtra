'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface EmailStepProps {
  email: string
  onEmailChange: (email: string) => void
  loading: boolean
  onLoading: (loading: boolean) => void
  onNewUser?: () => void
  onExistingUser?: (userName: string) => void
}

export default function EmailStep({
  email,
  onEmailChange,
  loading,
  onLoading,
  onNewUser,
  onExistingUser,
}: EmailStepProps) {
  const supabase = createClient()

  const handleEmailContinue = async () => {
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    onLoading(true)

    try {
      // Call the RPC function to check if email exists
      const { data, error } = await supabase.rpc('email_exists', {
        p_email: email,
      })

      if (error) {
        throw error
      }

      // data will be true if email exists, false if it doesn't
      if (data) {
        // Fetch first name via RPC to bypass RLS
        const { data: firstName } = await supabase.rpc('get_user_first_name', {
          p_email: email,
        })

        const userName = firstName || email.split('@')[0]
        onExistingUser?.(userName)
      } else {
        // New user
        onNewUser?.()
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
      onLoading(false)
    } finally {
      onLoading(false)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <Label
          htmlFor="email"
          className="text-sm sm:text-base text-foreground font-medium"
        >
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          className="h-10 sm:h-12 mt-1 bg-background border-input text-sm sm:text-base text-foreground focus:border-transparent focus:ring-2 focus:ring-primary rounded-xl"
          disabled={loading}
          onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
          autoFocus
        />
      </div>

      <Button
        onClick={handleEmailContinue}
        disabled={loading}
        className="w-full h-10 sm:h-12 text-sm sm:text-base bg-primary text-primary-foreground font-semibold rounded-xl hover:brightness-110 transition-all"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
        ) : (
          'Continue'
        )}
      </Button>
    </div>
  )
}