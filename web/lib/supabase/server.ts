import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 *
 * Wires the SSR client to Next's async `cookies()` store so reads see the
 * latest session and writes round-trip back out via `Set-Cookie`.
 *
 * The `try/catch` around `setAll` is intentional: Server Components can't
 * mutate cookies, and the SDK will call `setAll` anyway during token
 * refresh. Swallowing the throw is safe because the middleware
 * (`web/middleware.ts`) is what persists refreshed cookies for each request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — middleware will refresh.
          }
        },
      },
    },
  );
}
