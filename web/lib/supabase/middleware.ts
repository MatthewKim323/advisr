import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresher for Next.js middleware.
 *
 * Builds a response the caller can extend, wires an SSR client whose
 * cookie adapter writes to BOTH the incoming request (so downstream
 * route handlers see refreshed tokens) and the outgoing response (so the
 * browser gets them too), then calls `getUser()` which triggers any
 * pending refresh.
 *
 * Returns the user so the top-level `middleware.ts` can decide whether to
 * redirect to `/hail`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
