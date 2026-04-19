import ProposalQueue from "@/components/proposals/ProposalQueue";

/**
 * /proposals — the human-in-the-loop gate.
 *
 * Lists every pending claim with source, reasoning, and confidence. Student
 * confirms/rejects; only confirmed claims are treated as ground truth by
 * downstream agents.
 */
export default function ProposalsPage() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <ProposalQueue />
    </main>
  );
}
