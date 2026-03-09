import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./src/lib/auth/session-cookie";

function isPublicPath(pathname: string) {
  if (pathname === "/login" || pathname.startsWith("/login/")) {
    return true;
  }
  if (pathname === "/signup" || pathname.startsWith("/signup/")) {
    return true;
  }
  if (
    pathname === "/backoffice/login" ||
    pathname.startsWith("/backoffice/login/")
  ) {
    return true;
  }
  if (
    pathname === "/forgot-password" ||
    pathname.startsWith("/forgot-password/")
  ) {
    return true;
  }
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return true;
  }
  if (pathname === "/favicon.ico") {
    return true;
  }
  if (pathname.includes(".")) {
    return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME);
  if (!session) {
    const isBackofficePath =
      pathname.startsWith("/bo") || pathname.startsWith("/backoffice");
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = isBackofficePath ? "/backoffice/login" : "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
