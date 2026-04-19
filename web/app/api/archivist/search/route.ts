import { NextResponse } from "next/server";
import { search, HdNotConfigured } from "@/lib/humandelta";

/**
 * POST /api/archivist/search
 * Body: { query: string, topK?: number }
 *
 * Sonar sweep over the ingested context library. Returns scored chunks
 * straight from `hd.search(...)`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { query?: unknown; topK?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "expected JSON body" }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  const topK =
    typeof body.topK === "number" && body.topK > 0 && body.topK <= 50
      ? Math.floor(body.topK)
      : 10;

  try {
    const results = await search(query, topK);
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof HdNotConfigured) {
      return NextResponse.json(
        { error: "HUMANDELTA_API_KEY not configured" },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
