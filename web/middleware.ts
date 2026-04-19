import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Every request except static assets and the auth surface itself runs
 * through here so Supabase session cookies stay fresh. If an unauthed
 * user tries to reach the submarine, we bounce them to `/hail` with a
 * `next=` hint so we can return them to exactly where they wanted to go
 * once they're through the airlock.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname, search } = request.nextUrl;
  const isGated = pathname === "/" || pathname.startsWith("/office");

  // Demo-mode bypass: when running unauthenticated demos (judges, recording,
  // hero-beat Playwright), we short-circuit the airlock via `DEMO_MODE=true`
  // in env OR any non-empty `?demo=` query (e.g. `?demo=1`, `?demo=maria`).
  // The student identity falls back to DEMO_STUDENT_ID via `@/lib/utils/env`.
  const demoParam = request.nextUrl.searchParams.get("demo");
  const demoBypass =
    process.env.DEMO_MODE === "true" ||
    (demoParam !== null && demoParam.trim().length > 0);

  if (isGated && !user && !demoBypass) {
    const hailUrl = request.nextUrl.clone();
    hailUrl.pathname = "/hail";
    hailUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(hailUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every path except:
     *   - Next.js internals (_next/static, _next/image)
     *   - the auth surface (hail page + callback/signout routes)
     *   - favicon & common static asset extensions
     */
    "/((?!_next/static|_next/image|hail|auth|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
