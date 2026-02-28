'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface ResetPasswordStepProps {
  password: string
  confirmPassword: string
  showPassword: boolean
  showConfirmPassword: boolean
  loading: boolean
  onPasswordChange: (password: string) => void
  onConfirmPasswordChange: (password: string) => void
  onShowPasswordChange: (show: boolean) => void
  onShowConfirmPasswordChange: (show: boolean) => void
  onSuccess: () => void
  onLoading: (loading: boolean) => void
}

export default function ResetPasswordStep({
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  loading,
  onPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordChange,
  onShowConfirmPasswordChange,
  onSuccess,
  onLoading,
}: ResetPasswordStepProps) {
  const handleResetPasswordSubmit = async () => {
    if (!password || !confirmPassword) {
      toast.error('Please fill in both password fields')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    onLoading(true)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Verify session exists before attempting update
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Your reset session has expired. Please request a new reset link.')
        onLoading(false)
        return
      }

      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      toast.success('Password reset successfully! You can now sign in.')
      onSuccess()
    } catch (err: any) {
      console.error('Reset password error:', err)
      toast.error(err.message || 'Failed to reset password. Please try again.')
    } finally {
      onLoading(false)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <Label
          htmlFor="new-password"
          className="text-sm sm:text-base text-foreground font-medium"
        >
          New password
        </Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••••"
            className="h-10 sm:h-12 mt-1 bg-background border-input text-sm sm:text-base text-foreground focus:border-transparent focus:ring-2 focus:ring-primary rounded-xl pr-10 sm:pr-12"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const confirmInput = document.getElementById('confirm-password') as HTMLInputElement
                if (confirmInput) confirmInput.focus()
              }
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={() => onShowPasswordChange(!showPassword)}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 mt-0.5 p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            ) : (
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            )}
          </button>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
          Must be at least 6 characters
        </p>
      </div>

      <div>
        <Label
          htmlFor="confirm-password"
          className="text-sm sm:text-base text-foreground font-medium"
        >
          Confirm new password
        </Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder="••••••••"
            className="h-10 sm:h-12 mt-1 bg-background border-input text-sm sm:text-base text-foreground focus:border-transparent focus:ring-2 focus:ring-primary rounded-xl pr-10 sm:pr-12"
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleResetPasswordSubmit()}
          />
          <button
            type="button"
            onClick={() => onShowConfirmPasswordChange(!showConfirmPassword)}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 mt-0.5 p-1.5 sm:p-2 hover:bg-muted rounded-lg transition-colors"
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            ) : (
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      <Button
        onClick={handleResetPasswordSubmit}
        disabled={loading}
        className="w-full h-10 sm:h-12 text-sm sm:text-base bg-primary text-primary-foreground font-semibold rounded-xl hover:brightness-110 transition-all"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
        ) : (
          'Reset password'
        )}
      </Button>
    </div>
  )
}