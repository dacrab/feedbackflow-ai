import { z } from "zod";
import { CRUDService } from "@/lib/services/crud-service";
import { errorResponse, successResponse } from "@/lib/utils/api";
import { withAuthDelete, withAuthParams } from "@/lib/utils/route-handler";

const PatchBody = z.object({
  enabled: z.boolean().optional(),
  repo: z.string().min(3).optional(),
  token: z.string().optional(), // empty string clears
});

export const PATCH = withAuthParams(async (req, params, user) => {
  const json = await req.json();
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return errorResponse(parsed.error.message, 400);
  }

  const service = new CRUDService("user_sources", user.id);
  await service.update(params.id, parsed.data);
  return successResponse({ ok: true });
});

export const DELETE = withAuthDelete(async (params, user) => {
  const service = new CRUDService("user_sources", user.id);
  await service.delete(params.id);
  return successResponse({ ok: true });
});
