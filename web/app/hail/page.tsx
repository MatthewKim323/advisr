import { redirect } from "next/navigation";

/**
 * /hail — demo build.
 *
 * Auth is disabled for the HD judging demo. If anyone lands here (old
 * bookmark, HAIL link from a stale badge, etc.) we bounce them straight
 * into the submarine. Restore git history for the Google OAuth airlock.
 */
export default async function HailPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/office?demo=maria" } = await searchParams;
  redirect(next || "/office?demo=maria");
}
