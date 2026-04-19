"use client";

/**
 * Pending-claim review UI. Fetches from profile.pending(), renders each claim
 * with confidence bar + source link + reasoning, PATCHes /api/proposals/:id
 * on confirm/reject.
 */
export default function ProposalQueue() {
  // TODO: fetch pending claims, render rows, optimistic updates on confirm.
  return (
    <div className="font-mono text-sm text-[#f1e4c5]/60">
      // proposal.queue — fetch from /api/proposals
    </div>
  );
}
