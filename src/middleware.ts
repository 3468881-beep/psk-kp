import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured, DEMO_AUTH_COOKIE } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isSupabaseConfigured) {
    return updateSession(request);
  }

  // Demo mode: gate on a simple cookie set by the login screen.
  const authed = request.cookies.get(DEMO_AUTH_COOKIE)?.value === "1";
  if (!authed && path !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (authed && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on everything except static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
