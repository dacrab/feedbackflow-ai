import { CRUDService } from "@/lib/services/crud-service";
import { runIngest } from "@/lib/services/ingest-service";
import { errorResponse, successResponse, withAuthGet, withAuthRequest } from "@/lib/api";
import { CreateSourceSchema, parseOrError } from "@/lib/validations";

export const GET = withAuthGet(async (user) => {
  const service = new CRUDService("user_sources", user.id);
  return successResponse(await service.list());
});

export const POST = withAuthRequest(async (req, user) => {
  const parsed = parseOrError(CreateSourceSchema, await req.json());
  if (!parsed.success) {
    return errorResponse(parsed.error, 400);
  }

  try {
    const service = new CRUDService("user_sources", user.id);
    const source = await service.create(parsed.data);
    runIngest().catch(() => {});
    return successResponse(source);
  } catch {
    return errorResponse("Failed to create source", 500);
  }
});
