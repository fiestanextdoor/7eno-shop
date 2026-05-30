import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isShopLocked } from '@/lib/release'

// Owner preview: visiting any URL with ?preview=<COMING_SOON_PREVIEW_SECRET>
// stores a cookie that lets that browser through the lock to inspect the real
// site before launch. Leave the env var unset to disable previewing entirely.
const PREVIEW_COOKIE = 'eno_preview'
const PREVIEW_SECRET = process.env.COMING_SOON_PREVIEW_SECRET

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // ── Owner preview bypass ────────────────────────────────────────────────
  if (PREVIEW_SECRET && searchParams.get('preview') === PREVIEW_SECRET) {
    const clean = request.nextUrl.clone()
    clean.searchParams.delete('preview')
    const res = NextResponse.redirect(clean)
    res.cookies.set(PREVIEW_COOKIE, '1', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  }
  const previewing = request.cookies.get(PREVIEW_COOKIE)?.value === '1'

  // ── Coming-soon lock ────────────────────────────────────────────────────
  const locked = isShopLocked()
  const onComingSoon = pathname === '/coming-soon'
  const isWebhook = pathname === '/api/webhook' // Stripe must always reach this

  if (locked && !previewing && !onComingSoon && !isWebhook) {
    // Hard-block API calls (e.g. /api/checkout); redirect pages to the teaser.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'The shop is not open yet.' }, { status: 503 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/coming-soon'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Once unlocked, never strand anyone on the teaser.
  if (!locked && onComingSoon) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // ── Supabase session refresh + account auth (unchanged) ─────────────────
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
  const isProtectedRoute = pathname.startsWith('/account') && !isAuthRoute

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
  // Run on every route except Next internals and static assets, so the lock
  // covers pages and the checkout API alike.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|mp4|webm|woff|woff2|ttf|otf)).*)',
  ],
}
