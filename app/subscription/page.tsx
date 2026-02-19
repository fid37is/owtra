'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, Check, Zap, Download, Crown, Loader2, ArrowRight, Settings, ArrowLeft, Sparkles, Calendar, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'
import type { DodoSubscription, DodoInvoice } from '@/lib/supabase/dodo-types'
import {
  useCreateCheckout,
  useCancelSubscription,
  useReactivateSubscription,
  useCustomerPortal,
  useSubscription,
} from '@/lib/dodo/hooks'
import Link from 'next/link'

type Subscription = DodoSubscription
type Invoice = DodoInvoice

interface UsageStats {
  applications_count: number
  applications_limit: number
  ai_analyses_used: number
}

interface PricingData {
  plans: {
    monthly: {
      id: string
      name: string
      description: string
      price: number
      displayPrice: number
      interval: string
      features: string[]
      product_id: string
    }
    yearly: {
      id: string
      name: string
      description: string
      price: number
      displayPrice: number
      interval: string
      features: string[]
      product_id: string
      discountPercentage: number
    }
  }
  pricing: {
    monthly: {
      price: number
      displayPrice: number
      formatted: string
    }
    yearly: {
      price: number
      displayPrice: number
      formatted: string
      monthlyEquivalent: number
      savings: number
      savingsFormatted: string
      discountPercentage: number
    }
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCurrency(amount: number) {
  return `$${(amount / 100).toFixed(2)}`
}

export default function SubscriptionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [pricing, setPricing] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null)
  const [trialDays, setTrialDays] = useState<number | null>(null)

  const { createCheckout, loading: checkoutLoading } = useCreateCheckout()
  const { cancelSubscription, loading: cancelLoading } = useCancelSubscription()
  const { reactivateSubscription, loading: reactivateLoading } = useReactivateSubscription()
  const { openPortal, loading: portalLoading } = useCustomerPortal()
  const { syncSubscription } = useSubscription()

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      if (currentUser?.created_at) {
        const daysSince = Math.floor((Date.now() - new Date(currentUser.created_at).getTime()) / (1000 * 60 * 60 * 24))
        setTrialDays(Math.max(0, 14 - daysSince))
      }
    }
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchBillingData()
      fetchPricing()
    }
  }, [user?.id])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const upgradeSuccess = params.get('upgrade') === 'success'
    if (upgradeSuccess && user?.id) {
      const timer = setTimeout(async () => {
        const synced = await syncSubscription(user.id)
        if (synced) {
          await fetchBillingData()
          window.history.replaceState({}, '', '/subscription')
          toast.success('Subscription updated!')
        }
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [user?.id])

  const fetchBillingData = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setSubscription(subData as Subscription)

      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setInvoices(invoiceData as Invoice[] || [])

      const { data: appsData } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', user.id)

      const applicationsCount = appsData?.length || 0
      const applicationsLimit = subData?.tier === 'premium' ? 200 : 10

      setUsage({
        applications_count: applicationsCount,
        applications_limit: applicationsLimit,
        ai_analyses_used: applicationsCount,
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/billing/plans')
      const data = await response.json()
      setPricing(data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleUpgradeToPremium = async () => {
    if (!user || !selectedPlan) return
    const checkout = await createCheckout(user.id, user.email!, selectedPlan)
    if (checkout) window.location.href = checkout.checkoutUrl
  }

  const handleCancelSubscription = async () => {
    if (!subscription?.dodo_subscription_id) return
    const success = await cancelSubscription(subscription.dodo_subscription_id)
    if (success) {
      await fetchBillingData()
      setShowCancelModal(false)
    }
  }

  const handleReactivateSubscription = async () => {
    if (!subscription?.dodo_subscription_id) return
    const success = await reactivateSubscription(subscription.dodo_subscription_id)
    if (success) await fetchBillingData()
  }

  const handleManagePaymentMethod = async () => {
    if (!subscription?.dodo_customer_id) return
    await openPortal(subscription.dodo_customer_id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const isPremium = subscription?.tier === 'premium'
  const isTrialing = subscription?.status === 'trialing'
  const usagePercentage = usage ? (usage.applications_count / usage.applications_limit) * 100 : 0

  const daysRemaining = subscription?.current_period_end
    ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="w-full max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-primary hover:opacity-75 mb-4 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-4xl font-bold">Billing</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription and billing details</p>
        </div>

        {/* Cancellation Warning Banner */}
        {subscription?.cancel_at_period_end && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 flex gap-4 items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100">Subscription ending</p>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                Your Premium access will end on <strong>{formatDate(subscription.current_period_end)}</strong>. You won't be charged again.
              </p>
            </div>
            <button
              onClick={handleReactivateSubscription}
              disabled={reactivateLoading}
              className="flex-shrink-0 bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors flex items-center gap-2"
            >
              {reactivateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Reactivate
            </button>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-card rounded-2xl border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Current Plan</h2>
            {isPremium && (
              <button
                onClick={handleManagePaymentMethod}
                disabled={portalLoading}
                className="text-sm text-primary font-semibold hover:underline flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4" />
                Customer Portal
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isPremium ? 'bg-primary/10' : 'bg-muted'}`}>
              {isPremium ? <Crown className="w-7 h-7 text-primary" /> : <Zap className="w-7 h-7 text-muted-foreground" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold">{isPremium ? 'Premium' : 'Free'}</h3>
                {isPremium && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    isTrialing
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : subscription?.cancel_at_period_end
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {isTrialing ? 'Trial' : subscription?.cancel_at_period_end ? 'Cancelling' : 'Active'}
                  </span>
                )}
              </div>
              {isPremium && subscription && (
                <p className="text-sm text-muted-foreground mt-0.5 capitalize">
                  {subscription.billing_cycle === 'yearly' ? 'Billed yearly' : 'Billed monthly'}
                </p>
              )}
            </div>
          </div>

          {/* Usage */}
          {usage && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Applications used</span>
                <span className="text-muted-foreground">
                  {usage.applications_count} / {isPremium ? '200' : usage.applications_limit}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className={`h-full rounded-full transition-all ${usagePercentage >= 90 ? 'bg-red-500' : 'bg-primary'}`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Trial Info - Free users only */}
          {!isPremium && trialDays !== null && (
            <div className={`rounded-xl p-3 text-sm ${
              trialDays > 0
                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40'
                : 'bg-muted/50 border border-border'
            }`}>
              {trialDays > 0 ? (
                <div className="flex gap-2">
                  <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">{trialDays} free trial days available</p>
                    <p className="text-xs text-green-800 dark:text-green-200 mt-0.5">
                      Upgrade now — no charge until{' '}
                      <strong>
                        {new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">No trial available</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your 14-day trial has passed. You'll be billed immediately on upgrade.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Billing Dates - Premium users only */}
          {isPremium && subscription && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {isTrialing ? 'Trial started' : 'Period started'}
                  </span>
                </div>
                <p className="font-semibold">{formatDate(subscription.current_period_start)}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    {subscription.cancel_at_period_end ? 'Access ends' : isTrialing ? 'First billing' : 'Next renewal'}
                  </span>
                </div>
                <p className="font-semibold">{formatDate(subscription.current_period_end)}</p>
                {daysRemaining !== null && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {daysRemaining === 0 ? 'Today' : `in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Cancel Link - Premium only */}
          {isPremium && !subscription?.cancel_at_period_end && (
            <div className="pt-2 border-t border-border">
              <button
                onClick={() => setShowCancelModal(true)}
                className="text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                Cancel subscription
              </button>
            </div>
          )}
        </div>

        {/* Upgrade Section */}
        {!isPremium && pricing && (
          <div id="upgrade" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Upgrade to Premium</h2>
              <p className="text-muted-foreground mt-1">Unlock unlimited access and AI-powered features</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monthly */}
              <div
                onClick={() => { setSelectedPlan('monthly'); setShowUpgradeModal(true) }}
                className="p-6 rounded-2xl border-2 border-border hover:border-primary cursor-pointer transition-all group"
              >
                <h3 className="text-lg font-semibold mb-1">Monthly</h3>
                <p className="text-sm text-muted-foreground mb-4">Flexible, cancel anytime</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-primary">${pricing.pricing.monthly.displayPrice}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {pricing.plans.monthly.features?.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-center text-sm font-semibold group-hover:opacity-90 transition-opacity">
                  Get Started
                </div>
              </div>

              {/* Yearly */}
              <div
                onClick={() => { setSelectedPlan('yearly'); setShowUpgradeModal(true) }}
                className="p-6 rounded-2xl border-2 border-primary cursor-pointer transition-all relative group"
              >
                <div className="absolute -top-3 right-5 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Save {pricing.pricing.yearly.discountPercentage}%
                </div>
                <h3 className="text-lg font-semibold mb-1">Yearly</h3>
                <p className="text-sm text-muted-foreground mb-4">Best value</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-primary">${pricing.pricing.yearly.displayPrice}</span>
                  <span className="text-muted-foreground text-sm">/year</span>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                    Save ${pricing.pricing.yearly.savings.toFixed(2)} vs monthly
                  </p>
                </div>
                <ul className="space-y-2 mb-6">
                  {pricing.plans.yearly.features?.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-center text-sm font-semibold group-hover:opacity-90 transition-opacity">
                  Get Started
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoices */}
        {invoices.length > 0 && (
          <div className="bg-card rounded-2xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Billing History</h2>
            <div className="divide-y divide-border">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(invoice.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                    {invoice.invoice_pdf && (
                      <a
                        href={invoice.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:opacity-75 transition-opacity"
                        title="Download invoice"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && pricing && selectedPlan && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl shadow-2xl max-w-md w-full p-8 border">
            <h2 className="text-2xl font-bold mb-1">Confirm Upgrade</h2>
            <p className="text-muted-foreground mb-6">
              You're upgrading to Premium ({selectedPlan})
            </p>

            <div className="bg-muted/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-medium">Premium {selectedPlan}</span>
                <span className="font-bold text-primary">
                  ${selectedPlan === 'monthly' ? pricing.pricing.monthly.displayPrice : pricing.pricing.yearly.displayPrice}
                  {selectedPlan === 'monthly' ? '/mo' : '/yr'}
                </span>
              </div>
              {selectedPlan === 'yearly' && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Saving ${pricing.pricing.yearly.savings.toFixed(2)} vs monthly billing
                </p>
              )}
            </div>

            {trialDays !== null && trialDays > 0 && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 rounded-xl p-3 mb-6">
                <div className="flex gap-2">
                  <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-900 dark:text-green-100">
                    <strong>{trialDays} days free</strong> — first charge on{' '}
                    {new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            )}

            <ul className="space-y-2 mb-6">
              {['AI-powered job matching & analysis', 'Track up to 200 active applications', 'Company research & insights', 'AI interview preparation'].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 rounded-xl border-2 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradeToPremium}
                disabled={checkoutLoading}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <>{trialDays && trialDays > 0 ? 'Start Free Trial' : 'Upgrade Now'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl shadow-2xl max-w-md w-full p-8 border">
            <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Cancel Subscription?</h2>
            <p className="text-muted-foreground mb-2">
              Your Premium access will continue until <strong className="text-foreground">{formatDate(subscription?.current_period_end ?? null)}</strong>.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              After that, you'll be moved to the Free plan and lose access to AI features and applications beyond the free limit.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl border-2 font-semibold text-sm"
              >
                Keep Premium
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 py-3 rounded-xl bg-destructive text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {cancelLoading ? 'Processing...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}