import { CRUDService } from "@/lib/services/crud-service";
import { errorResponse, successResponse, withAuthDelete, withAuthParams } from "@/lib/utils";
import { parseOrError, UpdateNotificationSchema } from "@/lib/validations";

export const PATCH = withAuthParams(async (req, params, user) => {
  const parsed = parseOrError(UpdateNotificationSchema, await req.json());
  if (!parsed.success) {
    return errorResponse(parsed.error, 400);
  }

  const service = new CRUDService("user_notifications", user.id);
  await service.update(params.id, parsed.data);
  return successResponse({ ok: true });
});

export const DELETE = withAuthDelete(async (params, user) => {
  const service = new CRUDService("user_notifications", user.id);
  await service.delete(params.id);
  return successResponse({ ok: true });
});
