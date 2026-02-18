/**
 * API Route: Reactivate Subscription
 * POST /api/billing/reactivate-subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dodoClient } from '@/lib/dodo/config'
import { reactivateSubscriptionInDb } from '@/lib/dodo/db'
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

    // Reactivate subscription with Dodo Payments
    // Set cancel_at_next_billing_date to false
    await dodoClient.subscriptions.update(subscriptionId, {
      cancel_at_next_billing_date: false,
    })

    // Update database
    await reactivateSubscriptionInDb(user.id, subscriptionId)

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully',
    })
  } catch (error: any) {
    console.error('Error reactivating subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reactivate subscription' },
      { status: 500 }
    )
  }
}