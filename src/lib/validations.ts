import { z } from "zod";

export const CreateSourceSchema = z.object({
  type: z.literal("github"),
  repo: z.string().min(3),
  token: z.string().optional(),
});

export const UpdateSourceSchema = z.object({
  enabled: z.boolean().optional(),
  repo: z.string().min(3).optional(),
  token: z.string().optional(),
});

export const CreateNotificationSchema = z.object({
  type: z.literal("slack"),
  webhook: z.string().url(),
  enabled: z.boolean().optional(),
});

export const UpdateNotificationSchema = z.object({
  enabled: z.boolean().optional(),
  webhook: z.string().optional(),
});

export const SettingsSchema = z.object({
  provider: z.enum(["google", "openai", "anthropic"]),
  model: z.string().min(1),
  apiKey: z.string().min(5),
});

export const FeedbackStatusSchema = z.object({
  status: z.enum(["New", "Acknowledged", "Actioned"]),
});
