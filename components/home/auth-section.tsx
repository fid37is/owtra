'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

import GoogleAuthButton from './components/google-auth-button'
import EmailStep from './steps/email-step'
import PasswordStep from './steps/password-step'
import CreatePasswordStep from './steps/create-password-step'
import VerifyStep from './steps/verify-step'
import ForgotPasswordStep from './steps/forgot-password-step'
import ForgotPasswordSentStep from './steps/forgot-password-sent-step'
import ResetPasswordStep from './steps/reset-password-step'

type AuthStep = 'initial' | 'email' | 'verify' | 'password' | 'create-password' | 'forgot-password' | 'forgot-password-sent' | 'reset-password'

export default function AuthSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [step, setStep] = useState<AuthStep>('initial')
  const [email, setEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [intentUpgrade, setIntentUpgrade] = useState(false)
  const [toastShown, setToastShown] = useState(false)

  // Check for subscription intent and errors
  useEffect(() => {
    const upgrade = searchParams.get('upgrade')
    const error = searchParams.get('error')
    const type = searchParams.get('type')

    if (upgrade === 'true') setIntentUpgrade(true)
    if (type === 'recovery') setStep('reset-password')

    if (error) {
      const errorMessages: Record<string, string> = {
        'auth_failed': 'Authentication failed. Please try again.',
        'verification_failed': 'Email verification failed. Please try again.',
        'no_token': 'Invalid verification link.',
      }
      toast.error(errorMessages[error] || 'An error occurred')
    }
  }, [searchParams])

  // Check if user is authenticated AND check onboarding status
  useEffect(() => {
    const checkUserAndOnboarding = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user && step !== 'reset-password') {
        // Fetch user's profile to check onboarding status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed, account_status')
          .eq('id', user.id)
          .single<{ onboarding_completed: boolean | null; account_status: string | null }>()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          // If profile doesn't exist, they need onboarding
          if (intentUpgrade) {
            router.push('/onboarding?redirect=/subscription')
          } else {
            router.push('/onboarding')
          }
          return
        }

        // Check if account is hibernated or deleted
        if (profile?.account_status === 'hibernated' || profile?.account_status === 'deleted') {
          // Let them stay on auth page or redirect to reactivate
          router.push(`/auth/reactivate?email=${encodeURIComponent(user.email || '')}&status=${profile.account_status}`)
          return
        }

        // Check if they've completed onboarding
        if (!profile?.onboarding_completed) {
          // User needs to complete onboarding - show success toast if not shown yet
          if (!toastShown) {
            // Check auth provider to show appropriate message
            const provider = user.app_metadata?.provider

            if (provider === 'google') {
              toast.success('Signed in with Google successfully!')
            } else if (user.email_confirmed_at) {
              // Email was verified (either just now or previously)
              toast.success('Email verified successfully!')
            }
            setToastShown(true)
          }

          if (intentUpgrade) {
            router.push('/onboarding?redirect=/subscription')
          } else {
            router.push('/onboarding')
          }
        } else {
          // Onboarding completed - redirect to dashboard or subscription
          if (intentUpgrade) {
            router.push('/subscription')
          } else {
            router.push('/dashboard')
          }
        }
      }
    }

    checkUserAndOnboarding()
  }, [intentUpgrade, step, toastShown])

  const goBack = () => {
    setStep('initial')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const getHeaderText = () => {
    const headers: Record<AuthStep, { title: string; subtitle: string }> = {
      initial: { title: intentUpgrade ? 'Upgrade to Premium' : 'You got this', subtitle: intentUpgrade ? 'Sign in or create account' : 'Keep track of it' },
      email: { title: 'You got this', subtitle: 'Keep track of it' },
      verify: { title: 'Never give up', subtitle: 'Check your email' },
      password: { title: 'Loving it right?', subtitle: 'Welcome back' },
      'create-password': { title: 'Join the Owtras', subtitle: 'Create your account' },
      'forgot-password': { title: 'Did you forget?', subtitle: 'Reset your password' },
      'forgot-password-sent': { title: 'Almost Done', subtitle: 'Check your email' },
      'reset-password': { title: 'Did you forget?', subtitle: 'Set new password' },
    }
    return headers[step]
  }

  const headerText = getHeaderText()

  return (
    <div className="w-full flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Auth Card */}
        <div className="
        bg-card
        rounded-3xl
        shadow-[0_20px_60px_rgba(0,0,0,0.08)]
        border border-border/60
        px-8 py-10
        sm:px-10 sm:py-12
      ">

          {/* Header */}
          <div className="mb-8">

            <div className="relative flex items-center justify-center">

              {step !== 'initial' && step !== 'verify' && step !== 'forgot-password-sent' && (
                <button
                  onClick={goBack}
                  className="
                  absolute left-0
                  flex items-center justify-center
                  w-9 h-9
                  rounded-full
                  hover:bg-muted
                  transition-colors
                "
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
              )}

              <h1 className="
              text-3xl
              sm:text-4xl
              font-semibold
              text-foreground
              tracking-tight
            ">
                {headerText.title}
              </h1>

            </div>

            <p className="
            text-muted-foreground
            text-base
            text-center
            mt-2
          ">
              {headerText.subtitle}
            </p>

          </div>


          {/* Content */}
          <div className="space-y-5">

            {/* Initial Step */}
            {step === 'initial' && (
              <>
                <GoogleAuthButton
                  loading={googleLoading}
                  onLoading={setGoogleLoading}
                  intentUpgrade={intentUpgrade}
                />

                {/* Divider */}
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-border"></div>

                  <span className="
                  mx-4
                  text-sm
                  text-muted-foreground
                  bg-card
                ">
                    or
                  </span>

                  <div className="flex-grow border-t border-border"></div>
                </div>

                <EmailStep
                  email={email}
                  onEmailChange={setEmail}
                  loading={emailLoading}
                  onLoading={setEmailLoading}
                  onNewUser={() => setStep('create-password')}
                  onExistingUser={(name) => {
                    setUserName(name)
                    setStep('password')
                  }}
                />
              </>
            )}


            {/* Email Step */}
            {step === 'email' && (
              <EmailStep
                email={email}
                onEmailChange={setEmail}
                loading={emailLoading}
                onLoading={setEmailLoading}
                onNewUser={() => setStep('create-password')}
                onExistingUser={(name) => {
                  setUserName(name)
                  setStep('password')
                }}
              />
            )}


            {/* Create Password */}
            {step === 'create-password' && (
              <CreatePasswordStep
                email={email}
                password={password}
                confirmPassword={confirmPassword}
                showPassword={showPassword}
                showConfirmPassword={showConfirmPassword}
                loading={emailLoading}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onShowPasswordChange={setShowPassword}
                onShowConfirmPasswordChange={setShowConfirmPassword}
                onSuccess={() => setStep('verify')}
                onLoading={setEmailLoading}
                intentUpgrade={intentUpgrade}
              />
            )}


            {/* Password */}
            {step === 'password' && (
              <PasswordStep
                email={email}
                password={password}
                showPassword={showPassword}
                loading={emailLoading}
                userName={userName}
                onPasswordChange={setPassword}
                onShowPasswordChange={setShowPassword}
                onSuccess={() => {
                  toast.success('Welcome back!')
                  router.refresh()
                }}
                onForgotPassword={() => setStep('forgot-password')}
                onLoading={setEmailLoading}
              />
            )}


            {/* Verify */}
            {step === 'verify' && (
              <VerifyStep
                email={email}
                intentUpgrade={intentUpgrade}
                onChangeEmail={() => {
                  setStep('initial')
                  setEmail('')
                }}
              />
            )}


            {/* Forgot */}
            {step === 'forgot-password' && (
              <ForgotPasswordStep
                email={email}
                onEmailChange={setEmail}
                loading={emailLoading}
                onLoading={setEmailLoading}
                onSuccess={() => setStep('forgot-password-sent')}
              />
            )}


            {/* Forgot Sent */}
            {step === 'forgot-password-sent' && (
              <ForgotPasswordSentStep
                email={email}
                onRetry={() => {
                  setStep('forgot-password')
                  setEmail('')
                }}
              />
            )}


            {/* Reset */}
            {step === 'reset-password' && (
              <ResetPasswordStep
                password={password}
                confirmPassword={confirmPassword}
                showPassword={showPassword}
                showConfirmPassword={showConfirmPassword}
                loading={emailLoading}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onShowPasswordChange={setShowPassword}
                onShowConfirmPasswordChange={setShowConfirmPassword}
                onSuccess={() => {
                  toast.success('Password reset successfully!')
                  router.refresh()
                }}
                onLoading={setEmailLoading}
              />
            )}

          </div>


          {/* Terms */}
          {(step === 'initial' ||
            step === 'email' ||
            step === 'create-password' ||
            step === 'password' ||
            step === 'forgot-password') && (

              <p className="
            text-xs
            text-muted-foreground
            text-center
            mt-8
          ">
                By continuing, you agree to our{" "}
                <a
                  href="#"
                  className="text-primary font-medium hover:underline"
                >
                  Terms
                </a>
                {" "}and{" "}
                <a
                  href="#"
                  className="text-primary font-medium hover:underline"
                >
                  Privacy Policy
                </a>
              </p>

            )}

        </div>

      </div>
    </div>
  )

}