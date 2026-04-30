import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const protectedPaths = ["/dashboard", "/inbox", "/settings", "/feedback"];
const authPaths = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuth = authPaths.includes(pathname);

  if (!isProtected && !isAuth) return NextResponse.next();

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const isLoggedIn = !!session?.user?.id;

    if (isProtected && !isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isAuth && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch {
    if (isProtected) return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|icon.svg).*)"],
};
