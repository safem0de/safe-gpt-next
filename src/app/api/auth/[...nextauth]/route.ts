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
      if (account) {
        // เก็บ tokens จาก Keycloak
        token.accessToken = account.access_token;
        token.idToken = account.id_token; // เพิ่ม id_token สำหรับ logout
        token.refreshToken = account.refresh_token;
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
      // เพิ่ม tokens ลงใน session
      session.accessToken = token.accessToken as string | undefined;
      session.idToken = token.idToken as string | undefined; // สำหรับ logout

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
