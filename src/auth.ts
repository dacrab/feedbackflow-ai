import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { db } from "@/db/client";
import { appUsers } from "@/db/schema";
import { normalizeEmail } from "@/lib/utils/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHub({
      clientId: process.env["GITHUB_CLIENT_ID"] ?? "",
      clientSecret: process.env["GITHUB_CLIENT_SECRET"] ?? "",
    }),
    Google({
      clientId: process.env["GOOGLE_CLIENT_ID"] ?? "",
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
    }),
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (!(email && password)) {
          return null;
        }

        const normalizedEmail = normalizeEmail(String(email));
        const [user] = await db
          .select()
          .from(appUsers)
          .where(eq(appUsers.email, normalizedEmail))
          .limit(1);

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(String(password), user.passwordHash);
        if (!isValid) {
          return null;
        }

        return { id: user.id, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Create user record for OAuth providers if it doesn't exist
      if (account?.provider === "github" || account?.provider === "google") {
        const email = user.email;
        if (!email) {
          return false;
        }

        const normalizedEmail = normalizeEmail(email);
        const [existing] = await db
          .select({ id: appUsers.id })
          .from(appUsers)
          .where(eq(appUsers.email, normalizedEmail))
          .limit(1);

        if (!existing) {
          const [newUser] = await db
            .insert(appUsers)
            .values({ email: normalizedEmail })
            .returning({ id: appUsers.id });
          if (newUser) {
            user.id = newUser.id;
          }
        } else {
          user.id = existing.id;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user && "id" in user && typeof user.id === "string") {
        token.sub = user.id;
        token.email = user.email ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};

export async function auth() {
  return getServerSession(authOptions);
}
