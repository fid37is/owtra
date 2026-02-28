// ==========================================
// FILE: proxy.ts (CORRECTED for Next.js 15)
// ==========================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  const protectedRoutes = ['/dashboard', '/subscription', '/settings', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

  const isAuthRoute = ['/login', '/signup', '/'].includes(path) || path.startsWith('/auth/callback')

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, account_status, deletion_scheduled_at')
      .eq('id', user.id)
      .single()

    if (profile?.account_status === 'hibernated' || profile?.account_status === 'deleted') {
      if (!path.startsWith('/auth/reactivate')) {
        const redirectUrl = new URL(
          `/auth/reactivate?email=${encodeURIComponent(user.email || '')}&status=${profile.account_status}`,
          request.url
        )
        return NextResponse.redirect(redirectUrl)
      }
      return response
    }

    if (isProtectedRoute && !profile?.onboarding_completed) {
      if (path.startsWith('/subscription')) {
        const redirectUrl = new URL('/onboarding?redirect=/subscription', request.url)
        return NextResponse.redirect(redirectUrl)
      }
      const redirectUrl = new URL('/onboarding', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    if (path.startsWith('/onboarding') && profile?.onboarding_completed) {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Never redirect away from the password recovery flow
    if (request.nextUrl.searchParams.get('type') === 'recovery') {
      return response
    }

    if (isAuthRoute && profile?.onboarding_completed) {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    if (isAuthRoute && !profile?.onboarding_completed && path !== '/onboarding') {
      const redirectUrl = new URL('/onboarding', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|service-worker.js|register-sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}