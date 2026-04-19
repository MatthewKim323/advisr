import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { get as getProfile } from "@/lib/graph/profile";
import { StudentBriefDocument } from "@/lib/pdf/student-brief";
import { DEMO_STUDENT_ID } from "@/lib/utils/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/profile/brief?studentId=... → application/pdf */
export async function GET(req: Request) {
  const studentId =
    new URL(req.url).searchParams.get("studentId") ?? DEMO_STUDENT_ID;

  const profile = await getProfile(studentId);

  // @react-pdf/renderer types expect a Document element, but StudentBriefDocument
  // returns one; the generic cast keeps the runtime call clean.
  const element = StudentBriefDocument({ profile }) as unknown as Parameters<
    typeof renderToBuffer
  >[0];
  const buffer = await renderToBuffer(element);
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safe(profile.displayName ?? "student")}-brief.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

function safe(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 60);
}
