/**
 * middleware.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Route-level auth guard for the Next.js App Router.
 *
 * Rules
 * ──────
 *  • Public routes  → always reachable (no token needed).
 *  • API routes     → passed through; API handlers do their own auth.
 *  • /login         → if user already has a valid token, redirect to /dashboard.
 *  • Everything else → requires a valid `access_token` cookie; missing or
 *                      invalid token → redirect to /login.
 *
 * Why jose and not jsonwebtoken?
 * ──────────────────────────────
 *  Next.js middleware runs on the Edge Runtime, which is a subset of the
 *  standard Web APIs and does NOT support Node.js built-ins like `crypto`
 *  (synchronous) used by `jsonwebtoken`. The `jose` package is already in the
 *  project's dependencies and is fully Edge-compatible.
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** Routes that are always accessible — no token required. */
const PUBLIC_ROUTES = ["/login"];

/**
 * Prefixes that should be let through without any auth check.
 * API routes handle their own authentication where needed.
 */
const BYPASS_PREFIXES = [
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/public/",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function isBypassRoute(pathname: string): boolean {
  return BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return true;
  } catch {
    // Expired, malformed, or wrong signature
    return false;
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Let static assets and API routes pass through immediately.
  if (isBypassRoute(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;

  // 2. If the user is trying to reach /login...
  if (isPublicRoute(pathname)) {
    // ...and already has a valid token, send them to the dashboard.
    if (token && (await verifyToken(token))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // ...otherwise let them through.
    return NextResponse.next();
  }

  // 3. Protected route: no token → redirect to /login.
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the original destination so we can redirect back after login.
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Protected route: token present but invalid/expired → redirect to /login.
  const valid = await verifyToken(token);
  if (!valid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    // Clear the stale cookie so the browser doesn't keep sending it.
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("access_token");
    return response;
  }

  // 5. All good — let the request through.
  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — tells Next.js which paths to run this middleware on.
// Excludes static files (_next/static, _next/image, favicon, etc.) at the
// framework level for extra efficiency before our JS even runs.
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     *   - _next/static  (static chunks)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     *   - Files with an extension (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js)$).*)",
  ],
};
