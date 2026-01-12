/**
 * Centralized Zod validation schemas for API inputs
 */

import { z } from "zod";

// Helper to normalize GitHub repo from URL or owner/repo format
function normalizeGitHubRepo(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/(?:https?:\/\/)?github\.com\/([^/]+\/[^/]+)/i);
  if (urlMatch?.[1]) {
    return urlMatch[1].replace(/\.git$/, "");
  }
  return trimmed;
}

// Sources
export const CreateSourceSchema = z.object({
  type: z.literal("github"),
  repo: z
    .string()
    .min(3)
    .transform(normalizeGitHubRepo)
    .refine((val) => /^[^/]+\/[^/]+$/.test(val), {
      message: "Invalid repo format. Use owner/repo or a GitHub URL",
    }),
  token: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
});

export const UpdateSourceSchema = z.object({
  enabled: z.boolean().optional(),
  repo: z.string().min(3).optional(),
  token: z.string().optional(),
});

// Notifications
export const CreateNotificationSchema = z.object({
  type: z.literal("slack"),
  webhook: z.string().url("Invalid webhook URL"),
  enabled: z.boolean().optional(),
});

export const UpdateNotificationSchema = z.object({
  enabled: z.boolean().optional(),
  webhook: z.string().optional(),
});

// Settings
export const SettingsSchema = z.object({
  provider: z.enum(["google", "openai", "anthropic"]),
  model: z.string().min(1, "Model is required"),
  apiKey: z.string().min(5, "API key must be at least 5 characters"),
});

// Feedback status
export const FeedbackStatusSchema = z.object({
  status: z.enum(["New", "Acknowledged", "Actioned"]),
});

// Auth
export const RegisterSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Validation helper
export function parseOrError<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.issues.map((e) => e.message).join(", ") };
}
