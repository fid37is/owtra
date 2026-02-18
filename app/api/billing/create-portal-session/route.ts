/**
 * API Route: Create Customer Portal Session
 * POST /api/billing/create-portal-session
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dodoClient } from '@/lib/dodo/config'
import type { CreatePortalSessionRequest } from '@/lib/dodo/types'

export async function POST(request: NextRequest) {
  try {
    const body: CreatePortalSessionRequest = await request.json()
    const { customerId } = body

    // Validate request
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
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

    // Verify customer ID belongs to user
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('dodo_customer_id', customerId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Create customer portal session with Dodo Payments
    const portalSession = await dodoClient.customers.customerPortal.create(customerId)

    return NextResponse.json({
      portalUrl: portalSession.link,
    })
  } catch (error: any) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    )
  }
}