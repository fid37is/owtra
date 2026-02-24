'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'
import NameStep from './steps/name-step'
import ValuesStep from './steps/values-step'
import DealBreakersStep from './steps/deal-breakers-step'
import WorkPreferencesStep from './steps/work-preferences-step'
import CompanyPreferencesStep from './steps/company-preferences-step'

type OnboardingStep = 'name' | 'values' | 'deal-breakers' | 'work-preferences' | 'company-preferences'

interface OnboardingFlowProps {
  user: User
  verified?: boolean
}

export default function OnboardingFlow({ user, verified = false }: OnboardingFlowProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectAfter = searchParams.get('redirect')
  const reactivated = searchParams.get('reactivated')
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('name')
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const [toastShown, setToastShown] = useState(false)

  // Form data
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [selectedDealBreakers, setSelectedDealBreakers] = useState<string[]>([])
  const [workLocation, setWorkLocation] = useState<string>('')
  const [companySize, setCompanySize] = useState<string[]>([])
  const [industries, setIndustries] = useState<string[]>([])

  useEffect(() => {
    if (!toastShown && verified) {
      checkAuthMethodAndShowToast()
      setToastShown(true)
    }
  }, [verified, toastShown])

  useEffect(() => {
    if (reactivated === 'true' && !toastShown) {
      toast.success('✅ Account reactivated! Welcome back.')
      setToastShown(true)
    }
  }, [reactivated, toastShown])

  const checkAuthMethodAndShowToast = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const provider = user.app_metadata?.provider
        if (provider === 'google') {
          toast.success('Signed in with Google successfully!')
        } else {
          toast.success('Email verified successfully!')
        }
      }
    } catch (error) {
      console.error('Error checking auth method:', error)
    }
  }

  const steps: OnboardingStep[] = ['name', 'values', 'deal-breakers', 'work-preferences', 'company-preferences']
  const currentStepIndex = steps.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const canProceed = () => {
    switch (currentStep) {
      case 'name': return userName.trim().length > 0
      case 'values': return selectedValues.length >= 3
      case 'deal-breakers': return true
      case 'work-preferences': return workLocation !== ''
      case 'company-preferences': return true
      default: return false
    }
  }

  const handleNext = async () => {
    if (currentStep === 'name') {
      setLoading(true)
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: userName })
          .eq('id', user.id)

        if (error) throw error

        if (currentStepIndex < steps.length - 1) {
          setCurrentStep(steps[currentStepIndex + 1])
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to save name')
      } finally {
        setLoading(false)
      }
    } else if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1])
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1])
    }
  }

  /** Fire welcome email without blocking navigation */
  const triggerWelcomeEmail = async (email: string, name: string) => {
    try {
      await fetch('/api/send-notification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'welcome', email, userName: name }),
      })
    } catch (err) {
      // Silent — never block the user for an email failure
      console.error('Welcome email failed:', err)
    }
  }

  const handleComplete = async () => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          top_values: selectedValues,
          deal_breakers: selectedDealBreakers,
          work_location_preference: workLocation,
          preferred_company_size: companySize,
          preferred_industries: industries,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('🎉 Registration complete! Welcome to Owtra')

      // Send welcome email — fire and forget, don't await
      if (user.email) {
        triggerWelcomeEmail(user.email, userName || user.email)
      }

      const destination = redirectAfter || '/dashboard'
      router.push(destination)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete setup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-5 sm:mb-6 md:mb-8">
          {currentStep !== 'name' && (
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2">
              Welcome {userName}! 👋
            </h1>
          )}
          {currentStep === 'name' && (
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2">
              Welcome to Owtra! 👋
            </h1>
          )}
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            {currentStep === 'name'
              ? "Let's start with your name"
              : "Let's personalize your job search experience"}
          </p>

          {redirectAfter === '/subscription' && currentStep !== 'name' && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 md:p-4 bg-primary/5 rounded-lg sm:rounded-xl border border-primary/20">
              <p className="text-xs sm:text-xs md:text-sm text-foreground font-semibold">
                🎉 After setup, you'll be redirected to upgrade to Premium
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {currentStep !== 'name' && (
          <div className="mb-5 sm:mb-6 md:mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-xs md:text-sm font-semibold text-foreground">
                Step {currentStepIndex} of {steps.length - 1}
              </span>
              <span className="text-xs sm:text-xs md:text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 ease-out rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Steps Content Card */}
        <div className="w-full bg-card rounded-xl sm:rounded-2xl md:rounded-3xl shadow-lg p-4 sm:p-6 md:p-8 border border-border">
          {currentStep === 'name' && (
            <NameStep userName={userName} onUserNameChange={setUserName} />
          )}
          {currentStep === 'values' && (
            <ValuesStep selectedValues={selectedValues} onValuesChange={setSelectedValues} />
          )}
          {currentStep === 'deal-breakers' && (
            <DealBreakersStep selectedDealBreakers={selectedDealBreakers} onDealBreakersChange={setSelectedDealBreakers} />
          )}
          {currentStep === 'work-preferences' && (
            <WorkPreferencesStep workLocation={workLocation} onWorkLocationChange={setWorkLocation} />
          )}
          {currentStep === 'company-preferences' && (
            <CompanyPreferencesStep
              companySize={companySize}
              onCompanySizeChange={setCompanySize}
              industries={industries}
              onIndustriesChange={setIndustries}
            />
          )}

          {/* Navigation */}
          <div className="mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 md:pt-8 border-t border-border">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full">
              {currentStepIndex > 0 ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-9 sm:h-10 md:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base font-semibold"
                    disabled={loading}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed() || loading}
                    className="flex-1 h-9 sm:h-10 md:h-12 text-white font-semibold rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity text-xs sm:text-sm md:text-base"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" />
                    ) : currentStepIndex === steps.length - 1 ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2" />
                        Complete Setup
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || loading}
                  className="w-full h-9 sm:h-10 md:h-12 text-white font-semibold rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity text-xs sm:text-sm md:text-base"
                  style={{ backgroundColor: 'hsl(var(--primary))' }}
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 animate-spin" />
                  ) : currentStepIndex === steps.length - 1 ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2" />
                      Complete Setup
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Skip option */}
        {currentStep !== 'name' && currentStep !== 'values' && (
          <div className="text-center mt-3 sm:mt-4 md:mt-5">
            <button
              onClick={handleComplete}
              className="text-xs sm:text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              disabled={loading}
            >
              Skip and complete later
            </button>
          </div>
        )}
      </div>
    </div>
  )
}