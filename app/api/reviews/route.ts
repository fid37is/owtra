/**
 * API Route: Reviews
 * POST /api/reviews       — submit a new review
 * GET  /api/reviews       — fetch approved reviews
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('reviews')
      .select('id, name, role, quote, rating, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({ reviews: data })
  } catch (error: any) {
    console.error('Failed to fetch reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, role, quote, rating } = body

    // Validation
    if (!name || !quote || !rating) {
      return NextResponse.json(
        { error: 'Name, review, and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be a whole number between 1 and 5' },
        { status: 400 }
      )
    }

    if (quote.trim().length < 20) {
      return NextResponse.json(
        { error: 'Review must be at least 20 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { error } = await supabase.from('reviews').insert({
      name: name.trim(),
      role: role?.trim() || null,
      quote: quote.trim(),
      rating,
      approved: false, // requires admin approval
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Thanks for your review! It'll appear after a quick check.",
    })
  } catch (error: any) {
    console.error('Failed to submit review:', error)
    return NextResponse.json(
      { error: 'Failed to submit your review. Please try again.' },
      { status: 500 }
    )
  }
}