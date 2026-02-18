/**
 * React Hooks for Dodo Payments Billing
 */

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  CancelSubscriptionRequest,
  CreatePortalSessionRequest,
  CreatePortalSessionResponse,
} from '@/lib/dodo/dodo-types'

/**
 * Hook to create checkout session
 */
export function useCreateCheckout() {
  const [loading, setLoading] = useState(false)

  const createCheckout = async (
    userId: string,
    email: string,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<CreateCheckoutSessionResponse | null> => {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          billingCycle,
        } as CreateCheckoutSessionRequest),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      return data
    } catch (error: any) {
      console.error('Error creating checkout:', error)
      toast.error(error.message || 'Failed to start checkout')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createCheckout, loading }
}

/**
 * Hook to cancel subscription
 */
export function useCancelSubscription() {
  const [loading, setLoading] = useState(false)

  const cancelSubscription = async (
    subscriptionId: string
  ): Promise<boolean> => {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
        } as CancelSubscriptionRequest),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      toast.success('Subscription will be canceled at the end of the billing period')
      return true
    } catch (error: any) {
      console.error('Error canceling subscription:', error)
      toast.error(error.message || 'Failed to cancel subscription')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { cancelSubscription, loading }
}

/**
 * Hook to reactivate subscription
 */
export function useReactivateSubscription() {
  const [loading, setLoading] = useState(false)

  const reactivateSubscription = async (
    subscriptionId: string
  ): Promise<boolean> => {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/reactivate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
        } as CancelSubscriptionRequest),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription')
      }

      toast.success('Subscription reactivated successfully!')
      return true
    } catch (error: any) {
      console.error('Error reactivating subscription:', error)
      toast.error(error.message || 'Failed to reactivate subscription')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { reactivateSubscription, loading }
}

/**
 * Hook to open customer portal
 */
export function useCustomerPortal() {
  const [loading, setLoading] = useState(false)

  const openPortal = async (customerId: string): Promise<void> => {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
        } as CreatePortalSessionRequest),
      })

      const data: CreatePortalSessionResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open customer portal')
      }

      // Redirect to portal
      window.location.href = data.portalUrl
    } catch (error: any) {
      console.error('Error opening portal:', error)
      toast.error(error.message || 'Failed to open customer portal')
    } finally {
      setLoading(false)
    }
  }

  return { openPortal, loading }
}

/**
 * Hook to fetch subscription data
 */
export function useSubscription() {
  const [loading, setLoading] = useState(false)

  const syncSubscription = async (userId: string): Promise<boolean> => {
    setLoading(true)
    try {
      // This would call an API endpoint to sync subscription from Dodo
      const response = await fetch('/api/billing/sync-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to sync subscription')
      }

      return true
    } catch (error: any) {
      console.error('Error syncing subscription:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  return { syncSubscription, loading }
}