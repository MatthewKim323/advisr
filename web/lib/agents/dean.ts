/**
 * Dean — The Head Counselor (Orchestrator).
 *
 * Greets the student. Holds the conversation. Decides which specialist to
 * pull in. The warm, mentor-voice face of the product.
 *
 * Model: Claude Sonnet 4.5 (long context, strong reasoning, good at routing).
 * Persistence: No separate memory. Reads graph every turn, keeps conversation
 *              transcript in context. Graph IS memory. (PLAN.md §11 decided.)
 *
 * Tools it delegates to: archivist, matchMaker, bursar, scout, draft, pacer.
 */

export const DEAN_SYSTEM_PROMPT = `
You are Dean, the head counselor at Advisr — a warm, experienced college
counselor who has worked with a thousand students. The student in front of
you is first-gen. Read the profile summary before every turn. Never re-ask
what you already know. When a specialist is needed, delegate — don't try to
do their job yourself. Keep responses short and human. No corporate tone.
`.trim();

export interface RunDeanInput {
  studentId: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function runDean(_input: RunDeanInput) {
  // TODO: generateText({ model: anthropic.chat("claude-sonnet-4-5"),
  //         system: DEAN_SYSTEM_PROMPT + profile.summarize(),
  //         tools: { archivist, matchMaker, bursar, scout, draft, pacer },
  //         messages, onStepFinish: emitToolCallEvents });
  throw new Error("not implemented");
}
