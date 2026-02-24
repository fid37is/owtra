// /app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectParam = requestUrl.searchParams.get('redirect')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin

  if (code) {
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
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Handle errors silently
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Handle errors silently
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)

      // Supabase may have verified the user before the server crashed,
      // consuming the token but failing to complete the redirect.
      // If the user is already confirmed in the DB, continue normally
      // instead of showing a confusing auth_failed error.
      const { data: { user: existingUser } } = await supabase.auth.getUser()
      if (!existingUser?.email_confirmed_at) {
        return NextResponse.redirect(`${origin}/?error=auth_failed`)
      }
      // User is verified — fall through to post-auth logic below
    }

    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if profile exists and account status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, created_at, account_status, deletion_scheduled_at')
        .eq('id', user.id)
        .single()

      // Handle password recovery flow - skip onboarding check
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/?type=recovery`)
      }

      // Handle reactivation flow
      if (type === 'reactivate' && (profile?.account_status === 'hibernated' || profile?.account_status === 'deleted')) {
        if (profile?.account_status === 'deleted') {
          const deletionDate = new Date(profile.deletion_scheduled_at)
          if (new Date() > deletionDate) {
            return NextResponse.redirect(`${origin}/?error=account_permanently_deleted`)
          }
        }

        await supabase
          .from('profiles')
          .update({
            account_status: 'active',
            deletion_scheduled_at: null,
          })
          .eq('id', user.id)

        return NextResponse.redirect(`${origin}/dashboard?reactivated=true`)
      }

      // Check if account is hibernated or deleted (blocking login)
      if (profile?.account_status === 'hibernated' || profile?.account_status === 'deleted') {
        return NextResponse.redirect(
          `${origin}/auth/reactivate?email=${encodeURIComponent(user.email || '')}&status=${profile.account_status}`
        )
      }

      const hasSubscriptionIntent = user.user_metadata?.intent_upgrade || redirectParam === '/subscription'
      const needsOnboarding = !profile || !profile.onboarding_completed

      if (needsOnboarding) {
        if (hasSubscriptionIntent) {
          return NextResponse.redirect(`${origin}/onboarding?redirect=/subscription&verified=true`)
        }
        return NextResponse.redirect(`${origin}/onboarding?verified=true`)
      }

      if (hasSubscriptionIntent) {
        return NextResponse.redirect(`${origin}/subscription`)
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // No code - redirect to home with error
  return NextResponse.redirect(`${origin}/?error=no_token`)
}