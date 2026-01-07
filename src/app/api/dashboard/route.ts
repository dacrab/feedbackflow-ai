import { getDashboardData } from "@/lib/dashboard";
import { successResponse, withAuthGet } from "@/lib/utils";

export const GET = withAuthGet(async (user) => {
  const data = await getDashboardData(user.id);
  return successResponse(data);
});
