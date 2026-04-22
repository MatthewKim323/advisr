import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * DEMO MODE (Human Delta judging build).
 *
 * Auth gating is disabled: anyone can walk into /office. We still call
 * updateSession so Supabase cookies stay fresh for anyone who IS signed
 * in (because several API routes still read the session to scope data),
 * but we never redirect.
 *
 * To re-enable the airlock post-demo, restore the `isGated && !user &&
 * !demoBypass` redirect block from git history.
 */
export async function middleware(request: NextRequest) {
  const { response } = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    /*
     * Still skip Next internals, the (now vestigial) auth surface, and
     * static assets. No reason to waste cookies on sprite fetches.
     */
    "/((?!_next/static|_next/image|hail|auth|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
