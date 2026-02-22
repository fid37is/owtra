'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, Crown, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

function SubscriptionSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [syncing, setSyncing] = useState(true)
  const [synced, setSynced] = useState(false)

  const subscriptionId = searchParams.get('subscription_id')
  const status = searchParams.get('status')

  useEffect(() => {
    const syncSubscription = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        await new Promise(resolve => setTimeout(resolve, 2000))

        const response = await fetch('/api/billing/sync-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })

        if (response.ok) {
          setSynced(true)
          toast.success('Premium activated!')
        }
      } catch (error) {
        console.error('Sync error:', error)
      } finally {
        setSyncing(false)
      }
    }

    syncSubscription()
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {syncing ? (
          <div className="bg-card rounded-3xl shadow-2xl p-12 border text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Activating Premium...</h1>
            <p className="text-muted-foreground">
              Please wait while we set up your account
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-3xl shadow-2xl p-12 border text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold mb-3">Welcome to Premium!</h1>

            <p className="text-lg text-muted-foreground mb-8">
              Your subscription is now active. Enjoy unlimited access to all premium features.
            </p>

            <div className="bg-primary/5 rounded-2xl p-6 mb-8 text-left">
              <div className="flex items-center gap-3 mb-4">
                <Crown className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-lg">What's included:</h3>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>AI-powered job matching & analysis</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Track up to 200 active applications</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Company research & insights</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>AI interview preparation</span>
                </li>
              </ul>
            </div>

            {subscriptionId && (
              <p className="text-xs text-muted-foreground mb-6">
                Subscription ID: {subscriptionId}
              </p>
            )}

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => router.push('/subscription')}
              className="w-full mt-3 text-primary font-semibold hover:underline"
            >
              Manage Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}