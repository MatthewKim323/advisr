import { NextResponse } from "next/server";
import { deleteDocument, HdNotConfigured } from "@/lib/humandelta";

/**
 * DELETE /api/archivist/documents/:id
 * Removes a doc from the context library.
 */
export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    await deleteDocument(id);
    return NextResponse.json({ ok: true });
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
