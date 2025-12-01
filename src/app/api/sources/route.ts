import { z } from "zod";
import { CRUDService } from "@/lib/services/crud-service";
import { runIngest } from "@/lib/services/ingest-service";
import { errorResponse, successResponse } from "@/lib/utils/api";
import { withAuthGet, withAuthRequest } from "@/lib/utils/route-handler";

/**
 * Extract owner/repo from GitHub URL or return as-is if already in owner/repo format
 */
function normalizeGitHubRepo(input: string): string {
  const trimmed = input.trim();
  // Match GitHub URLs like https://github.com/owner/repo or github.com/owner/repo
  const urlMatch = trimmed.match(/(?:https?:\/\/)?github\.com\/([^/]+\/[^/]+)/i);
  if (urlMatch?.[1]) {
    return urlMatch[1].replace(/\.git$/, ""); // Remove .git suffix if present
  }
  return trimmed;
}

const CreateBody = z.object({
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

export const GET = withAuthGet(async (user) => {
  const service = new CRUDService("user_sources", user.id);
  const sources = await service.list();
  return successResponse(sources);
});

export const POST = withAuthRequest(async (req, user) => {
  const json = await req.json();
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((e) => e.message).join(", ");
    return errorResponse(errors, 400);
  }

  try {
    const service = new CRUDService("user_sources", user.id);
    const source = await service.create(parsed.data);

    // Trigger initial ingestion in background (don't await)
    runIngest().catch(() => {});

    return successResponse(source);
  } catch {
    return errorResponse("Failed to create source", 500);
  }
});
