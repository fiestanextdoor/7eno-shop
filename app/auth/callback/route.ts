import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/account/login?error=missing_code`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('[Auth callback] exchangeCodeForSession failed:', {
      message: error.message,
      status: error.status,
      code: (error as Record<string, unknown>).code ?? 'n/a',
      name: error.name,
    })
    return NextResponse.redirect(
      `${origin}/account/login?error=auth_failed&reason=${encodeURIComponent(error.message)}`
    )
  }

  console.log('[Auth callback] success, user:', data.user?.email)
  return NextResponse.redirect(`${origin}${next}`)
}
