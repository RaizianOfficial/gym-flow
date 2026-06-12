import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      const t = token as any;
      if (user) {
        t.id = user.id;
        t.role = (user as any).role;
        t.gymId = (user as any).gymId;
        t.gymSlug = (user as any).gymSlug;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as any;
      if (t && session.user) {
        (session.user as any).id = t.id;
        (session.user as any).role = t.role;
        (session.user as any).gymId = t.gymId;
        (session.user as any).gymSlug = t.gymSlug;
      }
      return session;
    },
  },
  providers: [], // Configured dynamically in lib/auth.ts
} satisfies NextAuthConfig
