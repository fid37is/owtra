import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dodoClient } from '@/lib/dodo/config'
import type { CreateCheckoutSessionRequest } from '@/lib/dodo/types'

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutSessionRequest = await request.json()
    const { userId, email, billingCycle } = body

    // Validate request
    if (!userId || !email || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      )
    }

    // Get user from database
    const supabase = await createClient()
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get plan from database
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_id', billingCycle)
      .eq('is_active', true)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      )
    }
    
    if (!plan.dodo_product_id) {
      return NextResponse.json(
        { error: 'Product ID not configured in database' },
        { status: 500 }
      )
    }

    // Create checkout session with Dodo Payments
    const session = await dodoClient.checkoutSessions.create({
      product_cart: [
        {
          product_id: plan.dodo_product_id,
          quantity: 1,
        },
      ],
      customer: {
        email: email,
        name: user.full_name || email,
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
      metadata: {
        user_id: userId,
        billing_cycle: billingCycle,
        plan_id: plan.plan_id,
      },
    })

    return NextResponse.json({
      sessionId: session.session_id,
      checkoutUrl: session.checkout_url,
    })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}