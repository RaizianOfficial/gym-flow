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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.gymSlug = (user as any).gymSlug;
        token.gymId = (user as any).gymId;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).gymSlug = token.gymSlug;
        (session.user as any).gymId = token.gymId;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig
