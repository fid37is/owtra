/**
 * API Route: Cancel Subscription
 * POST /api/billing/cancel-subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dodoClient } from '@/lib/dodo/config'
import { cancelSubscriptionInDb } from '@/lib/dodo/db'
import type { CancelSubscriptionRequest } from '@/lib/dodo/dodo-types'

export async function POST(request: NextRequest) {
  try {
    const body: CancelSubscriptionRequest = await request.json()
    const { subscriptionId } = body

    // Validate request
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify subscription belongs to user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('dodo_subscription_id', subscriptionId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Cancel subscription with Dodo Payments
    // Set cancel_at_next_billing_date to true
    await dodoClient.subscriptions.update(subscriptionId, {
      cancel_at_next_billing_date: true,
    })

    // Update database
    await cancelSubscriptionInDb(user.id, subscriptionId)

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
    })
  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}