import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const protectedRoutes = ["/dashboard", "/inbox", "/settings", "/feedback"];
const authRoutes = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.includes(pathname);

  // Skip auth check for non-protected routes
  if (!isProtected && !isAuthRoute) {
    return NextResponse.next();
  }

  try {
    // Validate session properly using Better Auth
    const session = await auth.api.getSession({ headers: request.headers });
    const hasValidSession = !!session?.user?.id;

    if (isProtected && !hasValidSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (isAuthRoute && hasValidSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    if (isProtected) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icon.svg).*)"],
};
