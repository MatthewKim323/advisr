import { NextResponse } from "next/server";
import { z } from "zod";
import { confirm, reject } from "@/lib/graph/claims";
import { DEMO_STUDENT_ID } from "@/lib/utils/env";

/**
 * PATCH /api/proposals/[id]
 *
 * Confirm or reject a pending claim.
 * Body: { action: "confirm" | "reject", studentId?: string }
 * Emits: `claim_confirmed` | `claim_rejected`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  action: z.enum(["confirm", "reject"]),
  studentId: z.string().uuid().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "missing claim id" }, { status: 400 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "bad body" },
      { status: 400 },
    );
  }

  const studentId = body.studentId ?? DEMO_STUDENT_ID;
  const ok =
    body.action === "confirm"
      ? await confirm(id, studentId)
      : await reject(id, studentId);

  if (!ok) {
    return NextResponse.json(
      { error: "claim not found or DB unavailable" },
      { status: 404 },
    );
  }
  return NextResponse.json({ claimId: id, status: body.action });
}
