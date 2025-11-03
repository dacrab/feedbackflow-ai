import { z } from "zod";
import { CRUDService } from "@/lib/services/crud-service";
import { errorResponse, successResponse } from "@/lib/utils/api";
import { withAuthGet, withAuthRequest } from "@/lib/utils/route-handler";

const CreateBody = z.object({
  type: z.literal("github"),
  repo: z.string().min(3),
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
  if (!parsed.success) return errorResponse(parsed.error.message, 400);

  const service = new CRUDService("user_sources", user.id);
  const source = await service.create(parsed.data);
  return successResponse(source);
});
