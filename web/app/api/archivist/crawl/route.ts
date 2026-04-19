import { NextResponse } from "next/server";
import { crawlSite, listIndexes, HdNotConfigured } from "@/lib/humandelta";

/**
 * /api/archivist/crawl
 *   POST { url, maxPages?, name? } — start a website index job.
 *   GET                           — list recent index jobs.
 *
 * Use this for ingesting entire college admissions sites, FAFSA guides,
 * scholarship databases, etc. into the Archivist's context library.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { url?: unknown; maxPages?: unknown; name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "expected JSON body" }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  const maxPages =
    typeof body.maxPages === "number" && body.maxPages > 0
      ? Math.min(500, Math.floor(body.maxPages))
      : 50;
  const name = typeof body.name === "string" ? body.name : undefined;

  try {
    const job = await crawlSite(url, { maxPages, name });
    return NextResponse.json({
      id: job.id,
      status: job.status,
      name: job.name,
      source_type: job.source_type,
    });
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

export async function GET() {
  try {
    const jobs = await listIndexes();
    return NextResponse.json({
      jobs: jobs.map((j) => ({
        id: j.id,
        status: j.status,
        name: j.name,
        source_type: j.source_type,
      })),
    });
  } catch (err) {
    if (err instanceof HdNotConfigured) {
      return NextResponse.json({ jobs: [], configured: false });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
