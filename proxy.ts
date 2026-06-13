import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const user = req.auth?.user as any
  const gymSlug = user?.gymSlug

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/attend')) {
    if (isLoggedIn && pathname.startsWith('/login') && gymSlug) {
      const dest = user?.role === 'MEMBER' ? `/${gymSlug}/me` : `/${gymSlug}/dashboard`
      return NextResponse.redirect(new URL(dest, req.url))
    }
    return NextResponse.next()
  }

  // Protected routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Tenant & Role isolation
  const slugMatch = pathname.match(/^\/([^\/]+)\//)
  if (slugMatch && slugMatch[1]) {
    const slugInPath = slugMatch[1]
    
    if (slugInPath !== gymSlug) {
      const dest = user?.role === 'MEMBER' ? `/${gymSlug}/me` : `/${gymSlug}/dashboard`
      return NextResponse.redirect(new URL(dest, req.url))
    }

    // Redirect member to /me if trying to access other pages
    if (user?.role === 'MEMBER' && !pathname.startsWith(`/${gymSlug}/me`)) {
      return NextResponse.redirect(new URL(`/${gymSlug}/me`, req.url))
    }

    // Redirect owner to /dashboard if trying to access /me
    if (user?.role === 'OWNER' && pathname.startsWith(`/${gymSlug}/me`)) {
      return NextResponse.redirect(new URL(`/${gymSlug}/dashboard`, req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
