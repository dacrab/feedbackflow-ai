import { getDashboardData } from "@/lib/dashboard-data";
import { successResponse } from "@/lib/utils/api";
import { withAuthGet } from "@/lib/utils/route-handler";

export const GET = withAuthGet(async (user) => {
  const data = await getDashboardData(user.id);
  return successResponse(data);
});
