import { z } from "zod";

export const CreateSourceSchema = z.object({
  type: z.literal("github"),
  repo: z.string().regex(/^[^/]+\/[^/]+$/, "Invalid repo format. Use owner/repo"),
  token: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
});

export const UpdateSourceSchema = z.object({
  enabled: z.boolean().optional(),
  repo: z.string().min(3).optional(),
  token: z.string().optional(),
});

export const CreateNotificationSchema = z.object({
  type: z.literal("slack"),
  webhook: z.string().url("Invalid webhook URL"),
  enabled: z.boolean().optional(),
});

export const UpdateNotificationSchema = z.object({
  enabled: z.boolean().optional(),
  webhook: z.string().optional(),
});

export const SettingsSchema = z.object({
  provider: z.enum(["google", "openai", "anthropic"]),
  model: z.string().min(1, "Model is required"),
  apiKey: z.string().min(5, "API key must be at least 5 characters"),
});

export const FeedbackStatusSchema = z.object({
  status: z.enum(["New", "Acknowledged", "Actioned"]),
});
