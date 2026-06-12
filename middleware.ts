import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const user = req.auth?.user as any
  const pathname = nextUrl.pathname

  // Check if route matches dashboard paths: /[gymSlug]/dashboard/...
  const isDashboardRoute = /^\/[^\/]+\/dashboard(\/.*)?$/.test(pathname)

  if (isDashboardRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }

    const segments = pathname.split("/")
    const gymSlugFromUrl = segments[1]

    if (user && user.gymSlug !== gymSlugFromUrl) {
      if (user.gymSlug) {
        return NextResponse.redirect(new URL(`/${user.gymSlug}/dashboard`, nextUrl))
      } else {
        return NextResponse.redirect(new URL("/login", nextUrl))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
