import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/inbox(.*)",
  "/feedback(.*)",
  "/settings(.*)",
  "/sync(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: ["/((?!_next|_static|_vercel|favicon|icon).*)"],
};
