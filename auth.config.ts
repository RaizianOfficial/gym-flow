import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized() {
      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
