/**
 * API Route: Sync Subscription from Dodo
 * POST /api/billing/sync-subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dodoClient } from '@/lib/dodo/config'
import { upsertSubscription } from '@/lib/dodo/db'
import type { DodoSubscription } from '@/lib/supabase/dodo-types'
import type { DodoSubscriptionStatus } from '@/lib/dodo/types'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Verify user ID matches authenticated user
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get subscription from database
    const { data: dbSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    const subscription = dbSubscription as DodoSubscription | null

    if (subError || !subscription || !subscription.dodo_subscription_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // Fetch subscription from Dodo Payments
    const dodoSubscription = await dodoClient.subscriptions.retrieve(
      subscription.dodo_subscription_id
    ) as DodoSubscriptionStatus

    // Update database with latest data
    await upsertSubscription(userId, dodoSubscription)

    return NextResponse.json({
      success: true,
      subscription: dodoSubscription,
    })
  } catch (error: any) {
    console.error('Error syncing subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync subscription' },
      { status: 500 }
    )
  }
}