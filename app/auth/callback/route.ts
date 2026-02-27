// /app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const redirectParam = requestUrl.searchParams.get('redirect')
  const origin = requestUrl.origin

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )

  // ── Path A: token_hash flow (password recovery, email confirmation via OTP)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any })

    if (error) {
      console.error('OTP verify error:', error.message, '| type:', type)
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/?error=reset_link_expired`)
      }
      return NextResponse.redirect(`${origin}/?error=auth_failed`)
    }

    // Recovery — session is now live, send to homepage reset step
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/?type=recovery`)
    }

    // Email confirmation — fall through to post-auth logic below
  }

  // ── Path B: PKCE code flow (Google OAuth, magic link, email signup confirmation)
  else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Code exchange error:', error.message, '| type:', type)

      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/?error=reset_link_expired`)
      }

      // May have already confirmed before crash — check and fall through if so
      const { data: { user: existingUser } } = await supabase.auth.getUser()
      if (!existingUser?.email_confirmed_at) {
        return NextResponse.redirect(`${origin}/?error=auth_failed`)
      }
    }
  }

  // ── No recognised params
  else {
    return NextResponse.redirect(`${origin}/?error=no_token`)
  }

  // ── Post-auth routing
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  // Password recovery already handled above — this catches the code flow edge case
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/?type=recovery`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, account_status, deletion_scheduled_at')
    .eq('id', user.id)
    .single()

  // Reactivation flow
  if (type === 'reactivate' && (profile?.account_status === 'hibernated' || profile?.account_status === 'deleted')) {
    if (profile?.account_status === 'deleted') {
      const deletionDate = new Date(profile.deletion_scheduled_at)
      if (new Date() > deletionDate) {
        return NextResponse.redirect(`${origin}/?error=account_permanently_deleted`)
      }
    }
    await supabase
      .from('profiles')
      .update({ account_status: 'active', deletion_scheduled_at: null })
      .eq('id', user.id)
    return NextResponse.redirect(`${origin}/dashboard?reactivated=true`)
  }

  // Hibernated / deleted — block login
  if (profile?.account_status === 'hibernated' || profile?.account_status === 'deleted') {
    return NextResponse.redirect(
      `${origin}/auth/reactivate?email=${encodeURIComponent(user.email || '')}&status=${profile.account_status}`
    )
  }

  const hasSubscriptionIntent = user.user_metadata?.intent_upgrade || redirectParam === '/subscription'
  const needsOnboarding = !profile || !profile.onboarding_completed

  if (needsOnboarding) {
    return NextResponse.redirect(
      `${origin}/onboarding${hasSubscriptionIntent ? '?redirect=/subscription&verified=true' : '?verified=true'}`
    )
  }

  if (hasSubscriptionIntent) {
    return NextResponse.redirect(`${origin}/subscription`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}