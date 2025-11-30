// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        // เพิ่ม access_token ที่ Keycloak ให้มาไว้ใน token
        token.accessToken = account.access_token;
      }
      if (profile) {
        // เพิ่มข้อมูล profile จาก Keycloak
        token.name = profile.name;
        token.email = profile.email;
        token.picture = (profile as any).picture || (profile as any).image;
      }
      return token;
    },
    async session({ session, token }) {
      // TypeScript fix: cast เป็น string | undefined
      session.accessToken = token.accessToken as string | undefined;
      // เพิ่มข้อมูล user ลงใน session
      if (session.user) {
        session.user.name = token.name as string | null;
        session.user.email = token.email as string | null;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
