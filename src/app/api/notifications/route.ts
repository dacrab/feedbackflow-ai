import { CRUDService } from "@/lib/services/crud-service";
import { errorResponse, successResponse, withAuthGet, withAuthRequest } from "@/lib/utils";
import { CreateNotificationSchema, parseOrError } from "@/lib/validations";

export const GET = withAuthGet(async (user) => {
  const service = new CRUDService("user_notifications", user.id);
  return successResponse(await service.list());
});

export const POST = withAuthRequest(async (req, user) => {
  const parsed = parseOrError(CreateNotificationSchema, await req.json());
  if (!parsed.success) {
    return errorResponse(parsed.error, 400);
  }

  const service = new CRUDService("user_notifications", user.id);
  const notification = await service.create(parsed.data);
  return successResponse(notification);
});
