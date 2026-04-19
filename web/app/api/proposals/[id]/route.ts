import { NextResponse } from "next/server";

/**
 * PATCH /api/proposals/[id]
 *
 * Confirm or reject a pending claim.
 * Body: { action: "confirm" | "reject", edited?: Partial<Claim> }
 * Emits: `claim_confirmed` | `claim_rejected`.
 */
export async function PATCH(
  _req: Request,
  _ctx: { params: Promise<{ id: string }> },
) {
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
