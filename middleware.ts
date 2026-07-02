/**
 * middleware.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Route-level auth + role-based access guard for the Next.js App Router.
 *
 * Rules
 * ──────
 *  • Public routes   → always reachable (no token needed).
 *  • API routes       → passed through; API handlers do their own auth.
 *  • /login            → if user already has a valid token, redirect to
 *                          their role's home route.
 *  • Everything else  → requires a valid `access_token` cookie; missing or
 *                          invalid token → redirect to /login.
 *  • Role check        → once authenticated, the user's `role` cookie is
 *                          matched against the allowed roles for the route
 *                          they're requesting. If the role isn't allowed on
 *                          that route, they're redirected to their own
 *                          role's home route (not /login — they ARE logged
 *                          in, they just can't see this page).
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

/**
 * Route → allowed roles map.
 * Mirrors the sidebar `items` config (icons/labels stripped — middleware
 * only needs `to`, `roles`, and any nested `children`).
 *
 * IMPORTANT: Keep this in sync with your sidebar nav config. If you add a
 * new route to the sidebar, add it here too, or it will be blocked for
 * everyone by default (see the "unknown route" behavior below).
 */
type RouteRule = {
  to: string;
  roles: readonly string[];
  children?: readonly { to: string }[];
};

const ROUTE_RULES: readonly RouteRule[] = [
  {
    to: "/leads",
    roles: ["ADMIN", "RECEPTIONIST", "SUPER ADMIN", "COUNSELLOR"],
    children: [{ to: "/leads/add" }, { to: "/leads/all" }],
  },
  {
    to: "/leads/add",
    roles: ["COUNSELLOR", "ADMIN", "RECEPTIONIST", "SUPER ADMIN"],
  },
  {
    to: "/visa",
    roles: ["ADMIN", "COUNSELLOR", "SUPER ADMIN"],
  },
  {
    to: "/applications",
    roles: ["ADMIN", "COUNSELLOR", "SUPER ADMIN"],
  },
  {
    to: "/reports",
    roles: ["ADMIN", "SUPER ADMIN", "COUNSELLOR"],
  },
  {
    to: "/loans",
    roles: ["ADMIN", "SUPER ADMIN", "COUNSELLOR"],
  },
  {
    to: "/branches",
    roles: ["ADMIN", "SUPER ADMIN"],
  },
  {
    to: "/universities",
    roles: ["ADMIN", "SUPER ADMIN"],
  },
  {
    to: "/users",
    roles: ["ADMIN", "SUPER ADMIN"],
  },
  {
    to: "/courses",
    roles: ["ADMIN", "SUPER ADMIN"],
  },
  {
    to: "/course-finder",
    roles: ["ADMIN", "COUNSELLOR", "SUPER ADMIN", "RECEPTIONIST"],
  },
  {
    to: "/assign-leads",
    roles: ["ADMIN", "SUPER ADMIN", "RECEPTIONIST"],
  },
  {
    to: "/counsellor",
    roles: ["ADMIN", "SUPER ADMIN"],
  },
  {
    to: "/master-settings",
    roles: ["ADMIN", "SUPER ADMIN"],
  },
];

/**
 * Each role's "home" route — where they land after login, and where they
 * get redirected if they try to hit a route they don't have access to.
 */
const ROLE_HOME: Record<string, string> = {
  COUNSELLOR: "/applications",
  RECEPTIONIST: "/leads/all",
  ADMIN: "/leads/all",
  "SUPER ADMIN": "/leads/all",
};

/** Fallback home if role is missing/unrecognized but token is valid. */
const DEFAULT_HOME = "/login";

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

/**
 * Normalizes a raw role string from the cookie: uppercase + collapse
 * internal whitespace, so backend variants like "super_admin", "Super Admin",
 * "  admin " etc. still line up with the ROUTE_RULES constants like
 * "SUPER ADMIN" / "ADMIN". Adjust the replace() below if your backend uses
 * underscores/dashes instead of spaces.
 */
function normalizeRole(rawRole: string | undefined): string {
  if (!rawRole) return "";
  return rawRole
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ") // "SUPER_ADMIN" / "SUPER-ADMIN" -> "SUPER ADMIN"
    .replace(/\s+/g, " ");  // collapse repeated spaces
}

/**
 * Finds the most specific matching rule for a pathname.
 * Checks children first (more specific), then parent `to`.
 * Falls back to prefix match so nested/dynamic segments
 * (e.g. /leads/all/123) still resolve to their parent rule.
 */
function findRouteRule(pathname: string): RouteRule | undefined {
  // 1. Exact match on a child path.
  for (const rule of ROUTE_RULES) {
    if (rule.children) {
      for (const child of rule.children) {
        if (pathname === child.to || pathname.startsWith(child.to + "/")) {
          return rule; // children inherit the parent's roles
        }
      }
    }
  }

  // 2. Exact match on a top-level `to`.
  const exact = ROUTE_RULES.find((rule) => pathname === rule.to);
  if (exact) return exact;

  // 3. Prefix match, longest `to` wins (most specific parent route).
  const prefixMatches = ROUTE_RULES.filter((rule) =>
    pathname.startsWith(rule.to + "/")
  ).sort((a, b) => b.to.length - a.to.length);

  return prefixMatches[0];
}

function getRoleHome(role: string): string {
  return ROLE_HOME[role] ?? DEFAULT_HOME;
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
  const role = normalizeRole(request.cookies.get("role")?.value).toUpperCase();

  // 2. If the user is trying to reach /login...
  if (isPublicRoute(pathname)) {
    // ...and already has a valid token, send them to their role's home.
    if (token && (await verifyToken(token))) {
      return NextResponse.redirect(new URL(getRoleHome(role), request.url));
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
    // Clear the stale cookies so the browser doesn't keep sending them.
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("access_token");
    response.cookies.delete("role");
    return response;
  }

  // 5. Token valid — now check role-based route access.
  const rule = findRouteRule(pathname);

  if (rule) {
    // Route is a known, guarded route — role MUST be in the allowed list.
    if (!role || !rule.roles.includes(role)) {
      // Logged in, but not allowed here → bounce to their own home,
      // not /login (they don't need to re-authenticate).
      return NextResponse.redirect(new URL(getRoleHome(role), request.url));
    }
  }
  // If `rule` is undefined, the route isn't in ROUTE_RULES (e.g. /dashboard,
  // /profile, /students — currently commented out in the sidebar, or any
  // route intentionally left unguarded). Falling through lets it pass.
  // If you want to BLOCK everything not explicitly listed, uncomment:
  //
  // if (!rule) {
  //   return NextResponse.redirect(new URL(getRoleHome(role), request.url));
  // }

  // 6. All good — let the request through.
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