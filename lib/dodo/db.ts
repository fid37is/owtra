/**
 * Database Utilities for Dodo Payments
 * Handles all database operations related to subscriptions
 */

import { createClient } from '@/lib/supabase/server'
import type { DodoSubscription } from '@/lib/supabase/dodo-types'
import type { DodoSubscriptionStatus, DodoPayment } from './dodo-types'

/**
 * Create or update subscription in database
 */
export async function upsertSubscription(
  userId: string,
  dodoSubscription: DodoSubscriptionStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const subscriptionData = {
      user_id: userId,
      tier: 'premium',
      status: mapDodoStatusToDbStatus(dodoSubscription.status),
      dodo_customer_id: dodoSubscription.customer.customer_id,
      dodo_subscription_id: dodoSubscription.subscription_id,
      current_period_start: dodoSubscription.previous_billing_date || dodoSubscription.created_at,
      current_period_end: dodoSubscription.next_billing_date,
      cancel_at_period_end: dodoSubscription.cancel_at_next_billing_date || false,
      billing_cycle: mapDodoIntervalToBillingCycle(dodoSubscription.payment_frequency_interval),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id',
      })

    if (error) {
      console.error('Error upserting subscription:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Exception in upsertSubscription:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Cancel subscription in database
 */
export async function cancelSubscriptionInDb(
  userId: string,
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('dodo_subscription_id', subscriptionId)

    if (error) {
      console.error('Error canceling subscription:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Exception in cancelSubscriptionInDb:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Reactivate subscription in database
 */
export async function reactivateSubscriptionInDb(
  userId: string,
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('dodo_subscription_id', subscriptionId)

    if (error) {
      console.error('Error reactivating subscription:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Exception in reactivateSubscriptionInDb:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create invoice record in database
 */
export async function createInvoice(
  userId: string,
  payment: DodoPayment
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const invoiceData = {
      user_id: userId,
      dodo_payment_id: payment.payment_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status === 'succeeded' ? 'paid' : 'open',
      invoice_pdf: payment.invoice_pdf || null,
      period_start: payment.created_at,
      period_end: payment.created_at,
      stripe_invoice_id: `dodo_${payment.payment_id}`,
    }

    const { error } = await supabase
      .from('invoices')
      .insert(invoiceData)

    if (error) {
      console.error('Error creating invoice:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Exception in createInvoice:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get subscription by user ID
 */
export async function getSubscriptionByUserId(
  userId: string
): Promise<DodoSubscription | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error getting subscription:', error)
      return null
    }

    return data as DodoSubscription
  } catch (error) {
    console.error('Exception in getSubscriptionByUserId:', error)
    return null
  }
}

/**
 * Get subscription by Dodo subscription ID
 */
export async function getSubscriptionByDodoId(
  dodoSubscriptionId: string
): Promise<DodoSubscription | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('dodo_subscription_id', dodoSubscriptionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error getting subscription by Dodo ID:', error)
      return null
    }

    return data as DodoSubscription
  } catch (error) {
    console.error('Exception in getSubscriptionByDodoId:', error)
    return null
  }
}

/**
 * Helper: Map Dodo status to database status
 */
function mapDodoStatusToDbStatus(
  dodoStatus: DodoSubscriptionStatus['status']
): string {
  const statusMap: Record<DodoSubscriptionStatus['status'], string> = {
    active: 'active',
    cancelled: 'canceled',
    past_due: 'past_due',
    on_hold: 'past_due',
    pending: 'trialing',
  }

  return statusMap[dodoStatus] || 'active'
}

/**
 * Helper: Map Dodo interval to billing cycle
 */
function mapDodoIntervalToBillingCycle(
  interval: DodoSubscriptionStatus['payment_frequency_interval']
): 'monthly' | 'yearly' | null {
  if (interval === 'Month') return 'monthly'
  if (interval === 'Year') return 'yearly'
  return null
}