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
import type { DodoWebhookPayload, DodoWebhookHeaders } from '@/lib/dodo/dodo-types'
import { createClient } from '@/lib/supabase/client'

const webhook = new Webhook(dodoConfig.webhookSecret)

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()

    // Get webhook headers
    const webhookHeaders: DodoWebhookHeaders = {
      'webhook-id': request.headers.get('webhook-id') || '',
      'webhook-signature': request.headers.get('webhook-signature') || '',
      'webhook-timestamp': request.headers.get('webhook-timestamp') || '',
    }

    // Verify webhook signature
    try {
      await webhook.verify(rawBody, webhookHeaders)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Parse payload
    const payload: DodoWebhookPayload = JSON.parse(rawBody)

    console.log('Received webhook event:', payload.event_type)

    // Handle different event types
    switch (payload.event_type) {
      case 'subscription.created':
        await handleSubscriptionCreated(payload)
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
        console.log('Unhandled webhook event type:', payload.event_type)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle subscription.created event
 */
async function handleSubscriptionCreated(payload: DodoWebhookPayload) {
  const subscription = payload.data.subscription
  if (!subscription) {
    console.log('❌ No subscription in payload')
    return
  }

  console.log('Subscription created:', subscription.subscription_id)
  console.log('Customer email:', subscription.customer.email)
  console.log('Metadata:', JSON.stringify(subscription.metadata))

  // Try to get user ID from metadata first
  let userId = subscription.metadata?.user_id as string
  
  // If not in metadata, look up user by email
  if (!userId) {
    console.log('No user_id in metadata, looking up by email...')
    
    const supabase = createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', subscription.customer.email)
      .single()
    
    userId = profile?.id || ''
    console.log('👤 Found user by email:', userId)
  }
  
  if (!userId) {
    console.error('❌ Could not find user ID')
    return
  }

  console.log('💾 Upserting subscription for user:', userId)
  const result = await upsertSubscription(userId, subscription)
  console.log('💾 Result:', result)
}

/**
 * Handle subscription.renewed event
 */
async function handleSubscriptionRenewed(payload: DodoWebhookPayload) {
  const subscription = payload.data.subscription
  if (!subscription) return

  console.log('Subscription renewed:', subscription.subscription_id)

  // Get subscription from database
  const dbSubscription = await getSubscriptionByDodoId(subscription.subscription_id)
  
  if (!dbSubscription) {
    console.error('Subscription not found in database:', subscription.subscription_id)
    return
  }

  // Update subscription in database
  await upsertSubscription(dbSubscription.user_id, subscription)
}

/**
 * Handle subscription.updated event
 */
async function handleSubscriptionUpdated(payload: DodoWebhookPayload) {
  const subscription = payload.data.subscription
  if (!subscription) return

  console.log('Subscription updated:', subscription.subscription_id)

  // Get subscription from database
  const dbSubscription = await getSubscriptionByDodoId(subscription.subscription_id)
  
  if (!dbSubscription) {
    console.error('Subscription not found in database:', subscription.subscription_id)
    return
  }

  // Update subscription in database
  await upsertSubscription(dbSubscription.user_id, subscription)
}

/**
 * Handle subscription.cancelled event
 */
async function handleSubscriptionCancelled(payload: DodoWebhookPayload) {
  const subscription = payload.data.subscription
  if (!subscription) return

  console.log('Subscription cancelled:', subscription.subscription_id)

  // Get subscription from database
  const dbSubscription = await getSubscriptionByDodoId(subscription.subscription_id)
  
  if (!dbSubscription) {
    console.error('Subscription not found in database:', subscription.subscription_id)
    return
  }

  // Update subscription status in database
  await cancelSubscriptionInDb(dbSubscription.user_id, subscription.subscription_id)
}

/**
 * Handle payment.succeeded event
 */
async function handlePaymentSucceeded(payload: DodoWebhookPayload) {
  const payment = payload.data.payment
  if (!payment) return

  console.log('Payment succeeded:', payment.payment_id)

  // Get subscription from payment metadata or customer
  const subscriptionId = (payment as any).subscription_id
  
  if (!subscriptionId) {
    console.log('No subscription ID found in payment')
    return
  }

  const dbSubscription = await getSubscriptionByDodoId(subscriptionId)
  
  if (!dbSubscription) {
    console.error('Subscription not found for payment:', payment.payment_id)
    return
  }

  // Create invoice record
  await createInvoice(dbSubscription.user_id, payment)
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payload: DodoWebhookPayload) {
  const payment = payload.data.payment
  if (!payment) return

  console.log('Payment failed:', payment.payment_id)

  // You might want to send an email to the user or take other actions
  // For now, we'll just log it
}