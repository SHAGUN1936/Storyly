import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Signed-in areas. Visitors without a valid login go to /login.
// (Role checks, e.g. admin-only, happen in the pages themselves.)
export async function middleware(request: NextRequest) {
  const userId = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!userId) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/studio", "/my-videos", "/account", "/receipts", "/admin/:path*", "/template/:path*", "/editor/:path*"],
};
