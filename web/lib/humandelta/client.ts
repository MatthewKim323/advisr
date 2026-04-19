/**
 * Human Delta — client singleton + auth.
 *
 * The API key (`hd_live_…`) MUST stay on the server. Every module in this
 * directory is marked `server-only`, so accidentally importing from a
 * Client Component will trip a build error rather than ship a bundled
 * secret to the browser.
 *
 * The singleton is lazy: we don't construct the SDK until a caller asks for
 * a client. This keeps cold-start for unrelated routes fast.
 */

import "server-only";
import { HumanDelta } from "humandelta";

export const BASE_URL =
  process.env.HUMANDELTA_BASE_URL ?? "https://api.humandelta.ai";

let _client: HumanDelta | null = null;

/** Lazy singleton. Returns null if the key is missing or malformed — callers
 *  should handle that case with a friendly "not configured" UI rather than
 *  letting a 500 bubble up. */
export function getClient(): HumanDelta | null {
  if (_client) return _client;
  const key = process.env.HUMANDELTA_API_KEY;
  if (!key || !key.startsWith("hd_live_")) return null;
  _client = new HumanDelta({ apiKey: key, baseUrl: BASE_URL });
  return _client;
}

/** Typed error callers can catch to render a "not configured" state. Keeps
 *  UI code from having to string-match on error messages. */
export class HdNotConfigured extends Error {
  constructor() {
    super("HUMANDELTA_API_KEY not set (or doesn't start with hd_live_)");
  }
}

export function requireClient(): HumanDelta {
  const c = getClient();
  if (!c) throw new HdNotConfigured();
  return c;
}

/** For REST endpoints the JS SDK v0.1.1 doesn't expose yet (notably
 *  `/v1/documents/*`). Keep this in sync with `requireClient()` — same env
 *  check, same failure mode. */
export function authHeaders(): Record<string, string> {
  const key = process.env.HUMANDELTA_API_KEY;
  if (!key || !key.startsWith("hd_live_")) throw new HdNotConfigured();
  return { Authorization: `Bearer ${key}` };
}
