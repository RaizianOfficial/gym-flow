import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const user = req.auth?.user as any
  const gymSlug = user?.gymSlug

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/attend')) {
    return NextResponse.next()
  }

  // Protected routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Tenant isolation - prevent accessing other gym's dashboard
  const slugMatch = pathname.match(/^\/([^\/]+)\//)
  if (slugMatch && slugMatch[1] !== gymSlug) {
    return NextResponse.redirect(new URL(`/${gymSlug}/dashboard`, req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
