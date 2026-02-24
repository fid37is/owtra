/**
 * API Route: Dodo Payments Webhook Handler
 * POST /api/billing/webhook
 */

import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'standardwebhooks'
import { dodoConfig } from '@/lib/dodo/config'
import {
  upsertSubscription,
  createInvoice,
  getSubscriptionByDodoId,
  cancelSubscriptionInDb,
} from '@/lib/dodo/db'
import type { DodoWebhookHeaders } from '@/lib/dodo/types'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { sendInvoiceEmail, sendPaymentFailedEmail } from '@/lib/email/notification-service'

export async function POST(request: NextRequest) {
  const webhook = new Webhook(dodoConfig.webhookSecret)

  try {
    const rawBody = await request.text()

    const webhookHeaders: DodoWebhookHeaders = {
      'webhook-id': request.headers.get('webhook-id') || '',
      'webhook-signature': request.headers.get('webhook-signature') || '',
      'webhook-timestamp': request.headers.get('webhook-timestamp') || '',
    }

    try {
      await webhook.verify(rawBody, webhookHeaders)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    const payload: any = JSON.parse(rawBody)
    const eventType = payload.type || payload.event_type

    console.log('Received webhook event:', eventType)

    switch (eventType) {
      case 'subscription.created':
      case 'subscription.active':
        await handleSubscriptionActive(payload)
        break
      case 'subscription.renewed':
        await handleSubscriptionRenewed(payload)
        break
      case 'subscription.updated':
        await handleSubscriptionUpdated(payload)
        break
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload)
        break
      case 'payment.succeeded':
        await handlePaymentSucceeded(payload)
        break
      case 'payment.failed':
        await handlePaymentFailed(payload)
        break
      default:
        console.log('Unhandled webhook event type:', eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Use maybeSingle() — .single() throws "Cannot coerce to single JSON object"
 * when 0 rows are returned (e.g. profile not yet created or userId mismatch).
 */
async function getProfile(userId: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .maybeSingle()
  if (error) console.error('getProfile error:', error.message)
  console.log('👤 getProfile result for', userId, ':', data)
  return data
}

async function getProfileByEmail(email: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('email', email)
    .maybeSingle()
  if (error) console.error('getProfileByEmail error:', error.message)
  return data
}

function derivePlanName(intervalRaw: string, count: number): string {
  const interval = intervalRaw?.toLowerCase()
  if (interval === 'year' || interval === 'yearly' || count >= 12) {
    return 'Owtra Premium (Yearly)'
  }
  return 'Owtra Premium (Monthly)'
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

async function handleSubscriptionActive(payload: any) {
  const subscription = payload.data

  if (!subscription) {
    console.log('No subscription data in payload')
    return
  }

  console.log('✅ Subscription active:', subscription.subscription_id)

  let userId = subscription.metadata?.user_id as string

  if (!userId && subscription.customer?.email) {
    console.log('No user_id in metadata, looking up by email...')
    const supabase = await createServerClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', subscription.customer.email)
      .maybeSingle()
    userId = profile?.id || ''
    console.log('👤 Found user by email:', userId)
  }

  if (!userId) {
    console.error('Could not find user ID')
    return
  }

  // 1. Upsert subscription
  const dodoSub = {
    subscription_id: subscription.subscription_id,
    product_id: subscription.product_id,
    customer: subscription.customer,
    status: subscription.status,
    recurring_pre_tax_amount: subscription.recurring_pre_tax_amount,
    currency: subscription.currency,
    payment_frequency_count: subscription.payment_frequency_count,
    payment_frequency_interval: subscription.payment_frequency_interval,
    next_billing_date: subscription.next_billing_date,
    previous_billing_date: subscription.previous_billing_date,
    created_at: subscription.created_at,
    cancelled_at: subscription.cancelled_at,
    expires_at: subscription.expires_at,
    cancel_at_next_billing_date: subscription.cancel_at_next_billing_date,
    metadata: subscription.metadata,
  }

  const result = await upsertSubscription(userId, dodoSub)
  console.log('💾 Upsert result:', result)

  // Only send invoice on first activation
  if (payload.type !== 'subscription.active') return

  // 2. Save invoice record
  const syntheticPayment = {
    payment_id: `sub_payment_${subscription.subscription_id}`,
    amount: subscription.recurring_pre_tax_amount ?? 0,
    currency: subscription.currency ?? 'USD',
    status: 'succeeded' as const,
    created_at: subscription.previous_billing_date ?? subscription.created_at ?? new Date().toISOString(),
    invoice_pdf: null,
  }
  const invoiceResult = await createInvoice(userId, syntheticPayment as any)
  console.log('🧾 Invoice save result:', invoiceResult)

  // 3. Send invoice email
  // Primary: look up profile by userId
  // Fallback: use customer email directly from the Dodo payload — always present
  let emailAddress: string | null = null
  let userName: string = 'there'

  const profile = await getProfile(userId)
  if (profile?.email) {
    emailAddress = profile.email
    userName = profile.full_name || subscription.customer?.name || 'there'
  } else {
    // Fallback — Dodo always gives us the customer email in the payload
    emailAddress = subscription.customer?.email || null
    userName = subscription.customer?.name || 'there'
    console.log('⚠️ Profile not found by userId, falling back to Dodo customer email:', emailAddress)
  }

  if (!emailAddress) {
    console.error('No email address available — cannot send invoice email')
    return
  }

  try {
    const planName = derivePlanName(
      subscription.payment_frequency_interval,
      subscription.payment_frequency_count
    )
    await sendInvoiceEmail({
      email: emailAddress,
      userName,
      invoiceId: `INV-${subscription.subscription_id.slice(-8).toUpperCase()}`,
      amount: subscription.recurring_pre_tax_amount ?? 0,
      currency: subscription.currency ?? 'USD',
      planName,
      billingDate: subscription.previous_billing_date ?? subscription.created_at ?? new Date().toISOString(),
      nextBillingDate: subscription.next_billing_date,
      paymentId: subscription.subscription_id,
    })
    console.log('✅ Invoice email sent to:', emailAddress)
  } catch (err) {
    console.error('Failed to send invoice email:', err)
  }
}

async function handleSubscriptionRenewed(payload: any) {
  const subscription = payload.data?.subscription ?? payload.data
  if (!subscription) return

  console.log('Subscription renewed:', subscription.subscription_id)

  const dbSubscription = await getSubscriptionByDodoId(subscription.subscription_id)
  if (!dbSubscription) {
    console.error('Subscription not found:', subscription.subscription_id)
    return
  }

  await upsertSubscription(dbSubscription.user_id, subscription)

  // Save renewal invoice
  const syntheticPayment = {
    payment_id: `sub_renewal_${subscription.subscription_id}_${Date.now()}`,
    amount: subscription.recurring_pre_tax_amount ?? 0,
    currency: subscription.currency ?? 'USD',
    status: 'succeeded' as const,
    created_at: subscription.previous_billing_date ?? new Date().toISOString(),
    invoice_pdf: null,
  }
  await createInvoice(dbSubscription.user_id, syntheticPayment as any)

  // Send renewal invoice email
  let emailAddress: string | null = null
  let userName = 'there'

  const profile = await getProfile(dbSubscription.user_id)
  if (profile?.email) {
    emailAddress = profile.email
    userName = profile.full_name || 'there'
  } else {
    emailAddress = subscription.customer?.email || null
    userName = subscription.customer?.name || 'there'
  }

  if (!emailAddress) return

  try {
    const planName = derivePlanName(
      subscription.payment_frequency_interval,
      subscription.payment_frequency_count
    )
    await sendInvoiceEmail({
      email: emailAddress,
      userName,
      invoiceId: `INV-${subscription.subscription_id.slice(-8).toUpperCase()}`,
      amount: subscription.recurring_pre_tax_amount ?? 0,
      currency: subscription.currency ?? 'USD',
      planName,
      billingDate: subscription.previous_billing_date ?? new Date().toISOString(),
      nextBillingDate: subscription.next_billing_date,
      paymentId: subscription.subscription_id,
    })
    console.log('✅ Renewal invoice email sent to:', emailAddress)
  } catch (err) {
    console.error('Failed to send renewal invoice email:', err)
  }
}

async function handleSubscriptionUpdated(payload: any) {
  const subscription = payload.data?.subscription ?? payload.data
  if (!subscription) return

  console.log('Subscription updated:', subscription.subscription_id)

  const dbSubscription = await getSubscriptionByDodoId(subscription.subscription_id)
  if (!dbSubscription) {
    console.error('Subscription not found:', subscription.subscription_id)
    return
  }

  await upsertSubscription(dbSubscription.user_id, subscription)
}

async function handleSubscriptionCancelled(payload: any) {
  const subscription = payload.data?.subscription ?? payload.data
  if (!subscription) return

  console.log('Subscription cancelled:', subscription.subscription_id)

  const dbSubscription = await getSubscriptionByDodoId(subscription.subscription_id)
  if (!dbSubscription) {
    console.error('Subscription not found:', subscription.subscription_id)
    return
  }

  await cancelSubscriptionInDb(dbSubscription.user_id, subscription.subscription_id)
}

async function handlePaymentSucceeded(payload: any) {
  const payment = payload.data
  if (!payment) return
  console.log('Payment succeeded:', payment.payment_id)
  console.log('ℹ️ Invoice will be saved on subscription.active')
}

async function handlePaymentFailed(payload: any) {
  const payment = payload.data
  if (!payment) return

  console.log('Payment failed:', payment.payment_id)

  let emailAddress: string | null = null
  let userName = 'there'

  const subscriptionId = payment.subscription_id
  if (subscriptionId) {
    const dbSubscription = await getSubscriptionByDodoId(subscriptionId)
    if (dbSubscription) {
      const profile = await getProfile(dbSubscription.user_id)
      if (profile?.email) {
        emailAddress = profile.email
        userName = profile.full_name || 'there'
      }
    }
  }

  // Fallback to Dodo customer email
  if (!emailAddress && payment.customer?.email) {
    emailAddress = payment.customer.email
    userName = payment.customer?.name || 'there'
    console.log('⚠️ Using Dodo customer email fallback:', emailAddress)
  }

  if (!emailAddress) {
    console.error('Could not find email for failed payment:', payment.payment_id)
    return
  }

  try {
    await sendPaymentFailedEmail({
      email: emailAddress,
      userName,
      amount: payment.total_amount ?? 0,
      currency: payment.currency ?? 'USD',
      planName: derivePlanName(payment.payment_frequency_interval ?? 'month', 1),
      paymentId: payment.payment_id,
      failureReason: payment.error_message ?? payment.error_code,
    })
    console.log('✅ Payment failed email sent to:', emailAddress)
  } catch (err) {
    console.error('Failed to send payment-failed email:', err)
  }
}