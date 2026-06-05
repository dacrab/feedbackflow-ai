import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db/client";
import * as schema from "@/db/schema";

if (process.env.NODE_ENV === "production") {
  if (!process.env["BETTER_AUTH_SECRET"]) throw new Error("BETTER_AUTH_SECRET required");
  if (!process.env["BETTER_AUTH_URL"]) throw new Error("BETTER_AUTH_URL required");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders: {
    github: {
      clientId: process.env["GITHUB_CLIENT_ID"] ?? "",
      clientSecret: process.env["GITHUB_CLIENT_SECRET"] ?? "",
      enabled: !!(process.env["GITHUB_CLIENT_ID"] && process.env["GITHUB_CLIENT_SECRET"]),
    },
    google: {
      clientId: process.env["GOOGLE_CLIENT_ID"] ?? "",
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
      enabled: !!(process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]),
    },
  },
  session: {
    expiresIn: 604800,
    updateAge: 86400,
    cookieCache: { enabled: true, maxAge: 300, strategy: "compact" },
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  trustedOrigins: process.env["BETTER_AUTH_URL"]
    ? [process.env["BETTER_AUTH_URL"]]
    : process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:3000"],
  plugins: [nextCookies()],
});
