import { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

const cookiePrefix = process.env.NEXTAUTH_COOKIE_PREFIX || "safem0de-gpt";
const isProd = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      // อยากเน้น security ก็ให้มีทั้ง pkce + state
      checks: ["pkce", "state"],
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  // 👇 รวม config cookie ไว้หมด ให้ชื่อและ option ตรงกันทั้งตอน set และ read
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    csrfToken: {
      name: `${cookiePrefix}.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    // ⭐ ตัวนี้แหละที่ขาดอยู่ → ทำให้ state cookie คนละโลกกับตัวอื่น
    state: {
      name: `${cookiePrefix}.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
    // แถม pkce ให้ชื่อไปใน namespace เดียวกันด้วย (กันเพี้ยน)
    pkceCodeVerifier: {
      name: `${cookiePrefix}.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
      }
      if (profile) {
        token.name = profile.name;
        token.email = profile.email;
        token.picture = (profile as any).picture || (profile as any).image;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      if (session.user) {
        session.user.name = token.name as string | null;
        session.user.email = token.email as string | null;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
};
