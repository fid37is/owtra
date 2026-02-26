// app/api/research-company/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApiErrorMessage, getHttpStatus } from '@/lib/ai/errors'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyName, website, applicationId } = await request.json()

    if (!companyName) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 })
    }

    console.log(`[API] Firing Edge Function for: ${companyName} (not awaiting)`)

    // Fire the Edge Function WITHOUT awaiting it.
    // The Edge Function runs on Supabase infrastructure independently —
    // it will complete even after this Next.js function has returned.
    supabase.functions
      .invoke('research-company', {
        body: { companyName, website, applicationId },
      })
      .then(({ error }) => {
        if (error) console.error('[API] Edge Function error (background):', error.message)
        else console.log('[API] Edge Function completed successfully (background)')
      })
      .catch((err) => {
        console.error('[API] Edge Function threw (background):', err.message)
      })

    // Return immediately — user is not blocked at all
    return NextResponse.json({
      success: true,
      message: 'Company research started in background',
    })

  } catch (error: any) {
    console.error('[API] Research route error:', error)
    return NextResponse.json(
      { error: getApiErrorMessage(error, 'start company research') },
      { status: getHttpStatus(error) }
    )
  }
}