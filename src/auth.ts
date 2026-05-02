import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders: {
    github: {
      clientId: process.env["GITHUB_CLIENT_ID"] || "",
      clientSecret: process.env["GITHUB_CLIENT_SECRET"] || "",
      enabled: !!(process.env["GITHUB_CLIENT_ID"] && process.env["GITHUB_CLIENT_SECRET"]),
    },
    google: {
      clientId: process.env["GOOGLE_CLIENT_ID"] || "",
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"] || "",
      enabled: !!(process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5, strategy: "compact" },
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: { enabled: false },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? [process.env["BETTER_AUTH_URL"] || ""]
      : ["http://localhost:3000"],
  plugins: [nextCookies()],
});
