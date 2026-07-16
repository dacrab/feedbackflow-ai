import "server-only";

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  CRON_TOKEN: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"),
});

let _env: z.infer<typeof envSchema> | null = null;

function getEnv(): z.infer<typeof envSchema> {
  if (_env) return _env;
  const result = envSchema.safeParse({
    DATABASE_URL: process.env["DATABASE_URL"],
    ENCRYPTION_KEY: process.env["ENCRYPTION_KEY"],
    CLERK_WEBHOOK_SECRET: process.env["CLERK_WEBHOOK_SECRET"],
    CRON_SECRET: process.env["CRON_SECRET"],
    CRON_TOKEN: process.env["CRON_TOKEN"],
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
  });
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid environment variables: ${missing}`);
  }
  _env = result.data;
  return _env;
}

export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_target, prop) {
    return Reflect.get(getEnv(), prop);
  },
});
