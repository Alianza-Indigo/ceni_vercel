import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Role-gated areas. Fine-grained per-resource authorization happens again in
 * every server action / route handler; this is the outer fence.
 */
export async function middleware(request: NextRequest) {
  // The cookie carries the __Secure- prefix only when served over HTTPS,
  // so try both variants (HTTP localhost vs TLS production).
  const token =
    (await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: false,
    })) ??
    (await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: true,
    }));

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/panel")) {
    if (!token) {
      const url = new URL("/entrar", request.url);
      url.searchParams.set("desde", pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== "ORG") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!token) {
      const url = new URL("/entrar", request.url);
      url.searchParams.set("desde", pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/panel", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/admin/:path*"],
};
