import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { legacyShopRedirect } from '@/lib/legacy-redirects'
import { PREVIEW_COOKIE, PREVIEW_COOKIE_MAX_AGE, previewParamAction } from '@/lib/preview'

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

  // ── Preview cookie ──────────────────────────────────────────────────────
  // `?preview=<SITE_PREVIEW_KEY>` stores the key in an httpOnly cookie so an
  // upcoming drop shows as live for QA (lib/preview.ts), then redirects to the
  // clean URL. `?preview=off` clears it. Ignored on Vercel production.
  const previewParam = request.nextUrl.searchParams.get('preview')
  if (previewParam !== null) {
    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete('preview')
    const res = NextResponse.redirect(cleanUrl)
    const action = previewParamAction(previewParam)
    if (action === 'clear') {
      res.cookies.delete({ name: PREVIEW_COOKIE, path: '/' })
    } else if (action === 'set') {
      res.cookies.set(PREVIEW_COOKIE, process.env.SITE_PREVIEW_KEY ?? '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: PREVIEW_COOKIE_MAX_AGE,
      })
    }
    return res
  }

  // ── Retired /shop?line= filters (spec section 3) ────────────────────────
  const legacy = legacyShopRedirect(request.nextUrl)
  if (legacy) return NextResponse.redirect(legacy, 308)

  // ── Account auth ────────────────────────────────────────────────────────
  if (pathname.startsWith('/account')) {
    return handleAccountAuth(request, pathname)
  }

  return NextResponse.next({ request })
}

export const config = {
  // Run on every page request except API routes, Next internals and static
  // files (any path containing a dot).
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
}
