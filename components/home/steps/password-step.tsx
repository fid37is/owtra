// app/components/auth/steps/password-step.tsx

'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface PasswordStepProps {
  email: string
  password: string
  showPassword: boolean
  loading: boolean
  userName?: string
  onPasswordChange: (password: string) => void
  onShowPasswordChange: (show: boolean) => void
  onSuccess: () => void
  onForgotPassword: () => void
  onLoading: (state: boolean) => void
}

export default function PasswordStep({
  email,
  password,
  showPassword,
  loading,
  userName,
  onPasswordChange,
  onShowPasswordChange,
  onSuccess,
  onForgotPassword,
  onLoading,
}: PasswordStepProps) {
  const supabase = createClient()
  const router = useRouter()

  const handlePasswordSubmit = async () => {
    if (!password) {
      toast.error('Please enter your password')
      return
    }

    onLoading(true)

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid password')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email first.')
        } else {
          throw error
        }
        onLoading(false)
        return
      }

      // Check if user is admin
      if (user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

          console.log('Profile check - is_admin:', profile?.is_admin, 'Error:', profileError)

          if (profile?.is_admin === true) {
            console.log('User is admin, redirecting to /admin')
            toast.success('Welcome back, Admin!')
            router.push('/admin')
          } else {
            console.log('User is not admin, redirecting to /dashboard')
            toast.success('Welcome back!')
            router.push('/dashboard')
          }
        } catch (err) {
          console.error('Unexpected error checking admin status:', err)
          toast.success('Welcome back!')
          router.push('/dashboard')
        }

        router.refresh()
        onLoading(false)
      }
    } catch (err: any) {
      toast.error(err.message)
      onLoading(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Message */}
      <div className="text-center">
        <p className="text-lg sm:text-xl font-semibold text-foreground capitalize">
          Welcome back {userName || email.split('@')[0]}
        </p>
      </div>

      {/* Password Input */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <Label htmlFor="password" className="text-sm sm:text-base text-foreground font-medium">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="••••••••"
              className="h-10 sm:h-12 mt-1 bg-background border-input text-sm sm:text-base text-foreground focus:border-transparent focus:ring-2 focus:ring-primary rounded-xl pr-10 sm:pr-12"
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
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
          <div className="mt-1.5 sm:mt-2 text-right">
            <button
              onClick={onForgotPassword}
              className="text-xs sm:text-sm text-secondary hover:underline font-medium"
              type="button"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button
          onClick={handlePasswordSubmit}
          disabled={loading}
          className="w-full h-10 sm:h-12 text-sm sm:text-base bg-primary text-primary-foreground font-semibold rounded-xl hover:brightness-110 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'Sign in'}
        </Button>
      </div>
    </div>
  )
}