import { successResponse, withAuthGet } from "@/lib/api";
import { getDashboardData } from "@/lib/dashboard";

export const GET = withAuthGet(async (user) => {
  const data = await getDashboardData(user.id);
  return successResponse(data);
});
