import { CRUDService } from "@/lib/services/crud-service";
import { errorResponse, successResponse, withAuthDelete, withAuthParams } from "@/lib/api";
import { parseOrError, UpdateSourceSchema } from "@/lib/validations";

export const PATCH = withAuthParams(async (req, params, user) => {
  const parsed = parseOrError(UpdateSourceSchema, await req.json());
  if (!parsed.success) {
    return errorResponse(parsed.error, 400);
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
