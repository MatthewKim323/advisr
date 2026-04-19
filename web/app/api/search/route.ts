import { NextResponse } from "next/server";
import { z } from "zod";
import { searchGraph } from "@/lib/humandelta/search";
import { emit } from "@/lib/events/bus";
import { DEMO_STUDENT_ID } from "@/lib/utils/env";

/**
 * POST /api/search — the F1 endpoint.
 *
 * Body: { query: string, studentId?: string, scopes?: ["student","world"] }
 *
 * Returns scope+sourceKind-tagged hits the source-to-UI binding layer
 * dispatches against. The hero beat depends on this returning
 * deterministically and within ~150–300ms.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  query: z.string().min(1).max(200),
  studentId: z.string().uuid().optional(),
  scopes: z.array(z.enum(["student", "world"])).optional(),
  topK: z.number().int().positive().max(30).optional(),
  grep: z.boolean().optional(),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "bad body" },
      { status: 400 },
    );
  }

  const studentId = parsed.studentId ?? DEMO_STUDENT_ID;
  emit({ type: "query_committed", query: parsed.query, studentId }, studentId);

  const result = await searchGraph({
    query: parsed.query,
    studentId,
    scopes: parsed.scopes,
    topK: parsed.topK ?? 12,
    grep: parsed.grep,
  });

  emit(
    {
      type: "query_hits_resolved",
      query: parsed.query,
      hits: [...result.hitsByScope.student, ...result.hitsByScope.world],
      optimistic: false,
    },
    studentId,
  );

  return NextResponse.json(result);
}
