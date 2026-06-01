import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isShopLocked } from '@/lib/release'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // --- Storefront seal -------------------------------------------------
  // Until the launch moment (see lib/release.ts) every page is locked behind
  // /coming-soon. The teaser page itself is exempt, and the matcher below
  // already skips API routes, the auth callback, Next internals and static
  // assets so the Stripe webhook and the coming-soon page keep working.
  if (isShopLocked() && pathname !== '/coming-soon') {
    const comingSoon = request.nextUrl.clone()
    comingSoon.pathname = '/coming-soon'
    comingSoon.search = ''
    return NextResponse.redirect(comingSoon)
  }

  // --- Account authentication -----------------------------------------
  // Only the /account area needs a session lookup; every other page passes
  // straight through without the extra Supabase round-trip.
  if (!pathname.startsWith('/account')) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = pathname === '/account/login' || pathname === '/account/register'
  const isProtectedRoute = !isAuthRoute

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/account/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/account/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  // Run on every page so the storefront seal applies site-wide, but skip API
  // routes, the auth callback, Next internals, favicon and any file with an
  // extension (static assets, including next/image originals under /logos).
  matcher: ['/((?!api|auth|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
