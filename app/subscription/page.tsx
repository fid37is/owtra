'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, AlertCircle, Check, Zap, TrendingUp, Calendar, Download, Crown, Loader2, ArrowRight, Settings, ArrowLeft, Sparkles } from 'lucide-react'
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

  const { createCheckout, loading: checkoutLoading } = useCreateCheckout()
  const { cancelSubscription, loading: cancelLoading } = useCancelSubscription()
  const { reactivateSubscription, loading: reactivateLoading } = useReactivateSubscription()
  const { openPortal, loading: portalLoading } = useCustomerPortal()
  const { syncSubscription } = useSubscription()

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
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
        ai_analyses_used: applicationsCount
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
    if (checkout) {
      window.location.href = checkout.checkoutUrl
    }
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
    if (success) {
      await fetchBillingData()
    }
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
  const usagePercentage = usage ? (usage.applications_count / usage.applications_limit) * 100 : 0

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-primary hover:opacity-75 mb-4 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-4xl font-bold mb-2">Billing</h1>
        </div>

        {subscription?.cancel_at_period_end && (
          <div className="bg-secondary/10 border-2 border-secondary rounded-2xl p-6 flex gap-4">
            <AlertCircle className="w-6 h-6 text-secondary" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Subscription Ending</h3>
              <p className="text-sm mb-4">
                Ends on {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
              </p>
              <button
                onClick={handleReactivateSubscription}
                disabled={reactivateLoading}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-semibold"
              >
                {reactivateLoading ? 'Processing...' : 'Reactivate'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-card rounded-3xl shadow-lg p-8 border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPremium ? 'bg-primary/10' : 'bg-navy/10'}`}>
                {isPremium ? <Crown className="w-6 h-6 text-primary" /> : <Zap className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{isPremium ? 'Premium' : 'Free'} Plan</h2>
              </div>
            </div>
          </div>

          {usage && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Applications</span>
                <span className="text-sm">
                  {usage.applications_count} / {isPremium ? '200' : usage.applications_limit}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-full rounded-full ${usagePercentage >= 90 ? 'bg-red-500' : 'bg-primary'}`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {!isPremium && pricing && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Upgrade to Premium</h2>
            </div>
            
            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div
                  onClick={() => { setSelectedPlan('monthly'); setShowUpgradeModal(true) }}
                  className="p-8 rounded-2xl border-2 cursor-pointer hover:border-primary"
                >
                  <h3 className="text-xl font-semibold mb-1">Monthly</h3>
                  <p className="text-sm text-muted-foreground mb-6">Cancel anytime</p>
                  
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-primary">${pricing.pricing.monthly.displayPrice}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pricing.plans.monthly.features?.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="bg-primary text-primary-foreground py-2.5 px-4 rounded-lg text-center font-semibold text-sm">
                    Choose Monthly
                  </div>
                </div>

                <div
                  onClick={() => { setSelectedPlan('yearly'); setShowUpgradeModal(true) }}
                  className="p-8 rounded-2xl border-2 cursor-pointer hover:border-primary relative"
                >
                  <div className="absolute -top-4 right-6 bg-secondary text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Save {pricing.pricing.yearly.discountPercentage}%
                  </div>

                  <h3 className="text-xl font-semibold mb-1">Yearly</h3>
                  <p className="text-sm text-muted-foreground mb-6">Best value</p>
                  
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-primary">${pricing.pricing.yearly.displayPrice}</span>
                    <span className="text-muted-foreground">/yr</span>
                    <p className="text-sm text-secondary font-semibold mt-2">
                      Save ${pricing.pricing.yearly.savings.toFixed(2)}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pricing.plans.yearly.features?.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="bg-primary text-primary-foreground py-2.5 px-4 rounded-lg text-center font-semibold text-sm">
                    Choose Yearly
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isPremium && (
          <div className="bg-card rounded-3xl shadow-lg p-8 border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Manage Billing</h2>
              <button
                onClick={handleManagePaymentMethod}
                disabled={portalLoading}
                className="text-primary font-semibold hover:underline flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Customer Portal
              </button>
            </div>

            {subscription && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-semibold">Premium {subscription.billing_cycle || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold capitalize">{subscription.status}</span>
                </div>
                {!subscription.cancel_at_period_end && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="text-secondary hover:underline text-sm"
                  >
                    Cancel subscription
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {invoices.length > 0 && (
          <div className="bg-card rounded-3xl shadow-lg p-8 border">
            <h2 className="text-xl font-semibold mb-6">Invoices</h2>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex justify-between items-center py-3 border-b last:border-0">
                  <div>
                    <div className="font-medium">${(invoice.amount / 100).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(invoice.created_at!).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {invoice.status}
                    </span>
                    {invoice.invoice_pdf && (
                      <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4 text-primary" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showUpgradeModal && pricing && selectedPlan && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl shadow-2xl max-w-lg w-full p-8 border">
            <h2 className="text-3xl font-bold mb-4">Upgrade to Premium</h2>
            <p className="text-lg mb-2">
              ${selectedPlan === 'monthly' ? pricing.pricing.monthly.displayPrice : pricing.pricing.yearly.displayPrice}
              {selectedPlan === 'monthly' ? '/month' : '/year'}
            </p>

            <div className="space-y-4 my-8">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5" />
                <span>AI-powered job matching & analysis</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5" />
                <span>Track up to 200 active applications</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5" />
                <span>Company research & insights</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5" />
                <span>AI interview preparation</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 rounded-xl border-2 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgradeToPremium}
                disabled={checkoutLoading}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Upgrade Now
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl shadow-2xl max-w-lg w-full p-8 border">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Cancel Subscription?</h2>
              <p className="text-muted-foreground">
                You'll lose access on {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl border-2 font-semibold"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 py-3 rounded-xl bg-secondary text-white font-semibold"
              >
                {cancelLoading ? 'Processing...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}