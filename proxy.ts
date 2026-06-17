import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isShopLocked } from '@/lib/release'

// Cookie that lets the owner browse the storefront while the launch seal is up.
const PREVIEW_COOKIE = 'seal_bypass'

// Paths that must stay reachable even while the seal is active. API routes,
// Next internals and static files (anything with a dot, e.g. /favicon.ico) are
// already excluded by the matcher below, so this only needs to cover the page
// and metadata routes that would otherwise loop or break: the teaser itself,
// the auth callback flow and the generated /icon favicon (app/icon.tsx) that
// the teaser's <head> links to.
function isSealExempt(pathname: string): boolean {
  return (
    pathname === '/coming-soon' ||
    pathname.startsWith('/coming-soon/') ||
    pathname.startsWith('/auth') ||
    pathname === '/icon'
  )
}

// Account auth (unchanged behaviour): protect /account/* behind a session and
// bounce already-logged-in users away from the login/register screens.
async function handleAccountAuth(request: NextRequest, pathname: string) {
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const previewKey = process.env.SITE_PREVIEW_KEY

  // ── Preview bypass ──────────────────────────────────────────────────────
  // `?preview=<SITE_PREVIEW_KEY>` drops a cookie so the owner can browse the
  // sealed shop, then redirects to the clean URL. `?preview=off` clears it.
  const previewParam = request.nextUrl.searchParams.get('preview')
  if (previewParam !== null) {
    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete('preview')
    const res = NextResponse.redirect(cleanUrl)
    if (previewParam === 'off') {
      res.cookies.delete({ name: PREVIEW_COOKIE, path: '/' })
    } else if (previewKey && previewParam === previewKey) {
      res.cookies.set(PREVIEW_COOKIE, '1', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    }
    return res
  }

  const hasBypass = request.cookies.get(PREVIEW_COOKIE)?.value === '1'

  // ── Storefront seal ─────────────────────────────────────────────────────
  // Until the launch moment (lib/release.ts), every page redirects to the
  // /coming-soon teaser. Auto-lifts at 19 June 2026, 19:00 CEST.
  if (isShopLocked() && !hasBypass && !isSealExempt(pathname)) {
    const comingSoon = request.nextUrl.clone()
    comingSoon.pathname = '/coming-soon'
    comingSoon.search = ''
    return NextResponse.redirect(comingSoon)
  }

  // ── Account auth ────────────────────────────────────────────────────────
  if (pathname.startsWith('/account')) {
    return handleAccountAuth(request, pathname)
  }

  return NextResponse.next({ request })
}

export const config = {
  // Run on every page request except API routes, Next internals and static
  // files (any path containing a dot). The seal + account logic is applied
  // inside the proxy function above.
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
}
