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
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                identifier: credentials.identifier,
                password: credentials.password,
              }),
            }
          );
          const data = await res.json();

          // Banned — throw so result.error carries the full JSON
          if (!res.ok && data.message === "BANNED_ACCOUNT") {
            throw new Error(
              JSON.stringify({
                message: "BANNED_ACCOUNT",
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                bannedIdentifier: data.bannedIdentifier,
                reason: data.reason,
              })
            );
          }

          if (!res.ok || !data.success) return null;

          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            accessToken: data.token,
            sessionVersion: data.user.sessionVersion ?? 1,
          };
        } catch (err: any) {
          if (err.message?.startsWith("{")) throw err;
          return null;
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    // 👇 NEW – Prevents Google OAuth sign‑in for banned emails
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/check-banned?email=${encodeURIComponent(user.email)}`
          );
          const data = await res.json();
          if (data.banned) {
            const params = new URLSearchParams({
              error: "banned",
              email: user.email,
            });
            return `/login?${params.toString()}`;
          }
        } catch (e) {
          console.error("Banned check failed", e);
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // ── First sign-in via credentials ──
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.sessionVersion = (user as any).sessionVersion ?? 1;
      }

      // ── First sign-in via Google OAuth ──
      if (account?.provider === "google") {
        try {
          const syncRes = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/oauth-sync`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: token.name,
                email: token.email,
                image: token.picture,
              }),
            }
          );
          const syncData = await syncRes.json();

          if (!syncData.success) {
            token.banned = true;
            return token;
          }

          token.id = syncData.user.id;
          token.role = syncData.user.role;
          token.accessToken = syncData.token;
          token.sessionVersion = syncData.user.sessionVersion ?? 1;
        } catch (e) {
          console.error("OAuth sync failed", e);
        }
        return token;
      }

      // ── Every subsequent session refresh: revalidate via backend API ──
      if (token.id && token.accessToken) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/session-check`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token.accessToken}`,
              },
            }
          );

          if (!res.ok) {
            token.banned = true;
            return token;
          }

          const data = await res.json();

          if (data.sessionVersion !== (token.sessionVersion as number)) {
            token.banned = true;
            return token;
          }

          token.role = data.role;
        } catch (e) {
          console.error("Session check failed", e);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token.banned) {
        (session as any).banned = true;
        return session;
      }
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: { signIn: "/login", error: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};