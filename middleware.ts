import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip passcode check for login page and verify endpoint
  if (pathname === "/login" || pathname.startsWith("/api/verify-passcode")) {
    return NextResponse.next();
  }

  // Check for passcode cookie
  const passcodeCookie = request.cookies.get("fort-stats-pass");
  if (!passcodeCookie || passcodeCookie.value !== "valid") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
