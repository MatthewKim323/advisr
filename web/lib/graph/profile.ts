import type { Claim } from "./claims";
import type { Predicate } from "./predicates";

/**
 * The read surface every downstream agent uses. No raw SQL. No string matching.
 * See PLAN.md §5 "Query Helper API".
 */

export const profile = {
  async get(_opts: { predicate?: Predicate; object?: unknown; limit?: number }): Promise<Claim[]> {
    throw new Error("not implemented");
  },

  // -------- Single-value convenience getters --------
  async gpa(): Promise<number | null> { throw new Error("not implemented"); },
  async income(): Promise<number | null> { throw new Error("not implemented"); },
  async interests(): Promise<string[]> { throw new Error("not implemented"); },
  async schoolsConsidering(): Promise<Array<{ school: string; tier: "safety" | "target" | "reach" }>> {
    throw new Error("not implemented");
  },

  /** Formatted context dump for LLM prompts. */
  async summarize(_opts: { maxTokens: number }): Promise<string> {
    throw new Error("not implemented");
  },

  /** Semantic query — post-MVP when embeddings land. */
  async similar(_opts: { to: string; limit: number }): Promise<Claim[]> {
    throw new Error("not implemented");
  },

  /** Pending claims for the ProposalQueue UI. */
  async pending(): Promise<Claim[]> {
    throw new Error("not implemented");
  },
};
