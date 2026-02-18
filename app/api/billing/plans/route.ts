/**
 * API Route: Get Subscription Plans from Database
 * GET /api/billing/plans
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/dodo/config'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch active plans from database
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error

    if (!plans || plans.length === 0) {
      return NextResponse.json(
        { error: 'No subscription plans configured' },
        { status: 500 }
      )
    }

    // Transform plans into response format
    const monthlyPlan = plans.find(p => p.plan_id === 'monthly')
    const yearlyPlan = plans.find(p => p.plan_id === 'yearly')

    if (!monthlyPlan || !yearlyPlan) {
      return NextResponse.json(
        { error: 'Missing required plans' },
        { status: 500 }
      )
    }

    // Calculate savings
    const monthlyYearlyCost = monthlyPlan.price_cents * 12
    const savings = monthlyYearlyCost - yearlyPlan.price_cents

    return NextResponse.json({
      plans: {
        monthly: {
          id: monthlyPlan.plan_id,
          name: monthlyPlan.name,
          description: monthlyPlan.description,
          price: monthlyPlan.price_cents,
          displayPrice: monthlyPlan.price_cents / 100,
          interval: monthlyPlan.interval,
          features: monthlyPlan.features || [],
          product_id: monthlyPlan.dodo_product_id,
        },
        yearly: {
          id: yearlyPlan.plan_id,
          name: yearlyPlan.name,
          description: yearlyPlan.description,
          price: yearlyPlan.price_cents,
          displayPrice: yearlyPlan.price_cents / 100,
          interval: yearlyPlan.interval,
          features: yearlyPlan.features || [],
          product_id: yearlyPlan.dodo_product_id,
          discountPercentage: yearlyPlan.discount_percentage || 0,
        },
      },
      pricing: {
        monthly: {
          price: monthlyPlan.price_cents,
          displayPrice: monthlyPlan.price_cents / 100,
          formatted: formatPrice(monthlyPlan.price_cents),
        },
        yearly: {
          price: yearlyPlan.price_cents,
          displayPrice: yearlyPlan.price_cents / 100,
          formatted: formatPrice(yearlyPlan.price_cents),
          monthlyEquivalent: monthlyYearlyCost / 12 / 100,
          savings: savings / 100,
          savingsFormatted: formatPrice(savings),
          discountPercentage: yearlyPlan.discount_percentage || 0,
        },
      },
    })
  } catch (error: any) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}