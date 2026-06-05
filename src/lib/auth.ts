import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (!res.ok || !data.success) return null;

          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,          // include role
            accessToken: data.token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;   // store role in JWT
      }

      // Sync OAuth user (Google) to backend
      if (account && account.provider === "google") {
        try {
          const syncRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/oauth-sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: token.name,
              email: token.email,
              image: token.picture,
            }),
          });
          const syncData = await syncRes.json();
          if (syncData.success && syncData.user) {
            token.id = syncData.user.id;
            token.role = syncData.user.role;   // get role from backend
          }
        } catch (e) {
          console.error("OAuth sync failed", e);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).role = token.role;   // expose role in session
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};