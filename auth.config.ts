import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.includes('/dashboard')
      const isPublic = ['/login', '/register', '/attend'].some(p => 
        nextUrl.pathname.startsWith(p)
      )
      
      if (isPublic) return true
      if (isOnDashboard && !isLoggedIn) return false
      if (isLoggedIn && nextUrl.pathname === '/login') {
        const gymSlug = (auth?.user as any)?.gymSlug
        return Response.redirect(new URL(`/${gymSlug}/dashboard`, nextUrl))
      }
      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
