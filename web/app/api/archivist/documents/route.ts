import { NextResponse } from "next/server";
import { listDocuments, HdNotConfigured } from "@/lib/humandelta";

/**
 * GET /api/archivist/documents?category=...
 *
 * Lists every document in the context library. Used to render the Archive
 * Manifest on `/archivist`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;

  try {
    const docs = await listDocuments(category);
    return NextResponse.json({ documents: docs });
  } catch (err) {
    if (err instanceof HdNotConfigured) {
      return NextResponse.json({ documents: [], configured: false });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
