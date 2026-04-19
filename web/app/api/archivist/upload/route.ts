import { NextResponse } from "next/server";
import { uploadDocument, HdNotConfigured } from "@/lib/humandelta";

/**
 * POST /api/archivist/upload
 *
 * Accepts multipart form data with one or more files under the `file` key,
 * plus an optional `category` string, and forwards each file to Human
 * Delta's `/v1/documents` endpoint. The Archivist agent can then semantic-
 * search, summarize, or cite them via `hd.search(...)`.
 *
 * Response: `{ uploaded: HdDocument[], errors: { name, message }[] }`
 * — partial success is OK; we still 200 so the UI can show per-file state.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch (e) {
    return NextResponse.json(
      { error: "expected multipart/form-data" },
      { status: 400 },
    );
  }

  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "no files attached" }, { status: 400 });
  }

  const category = (form.get("category") as string | null) ?? undefined;

  const uploaded: unknown[] = [];
  const errors: { name: string; message: string }[] = [];

  for (const file of files) {
    try {
      const doc = await uploadDocument({ file, category });
      uploaded.push(doc);
    } catch (err) {
      if (err instanceof HdNotConfigured) {
        return NextResponse.json(
          { error: "HUMANDELTA_API_KEY not configured on the server" },
          { status: 503 },
        );
      }
      errors.push({
        name: file.name,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ uploaded, errors });
}
