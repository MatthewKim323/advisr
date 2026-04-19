/**
 * Dean streaming runtime.
 *
 * Thin wrapper around `streamText` from the Vercel AI SDK. Wires:
 *   Claude Sonnet 4.5  ←  system prompt + conversation  →  toolset  →  events
 *
 * Call-sites:
 *   - `app/api/chat/route.ts` streams the result back to the client via
 *     `result.toUIMessageStreamResponse()`.
 *
 * Nothing here is Advisr-specific beyond the model + prompt + tools. If you
 * need a non-streaming variant (e.g. background summarization), add it here
 * with the same tool surface so Dean behaves identically.
 *
 * Requires `ANTHROPIC_API_KEY` in env. The provider surfaces a clear
 * `LoadAPIKeyError` if it's missing; we let it bubble so the API route can
 * return a 500 with a readable message.
 */

import "server-only";

import {
  streamText,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { anthropic } from "@ai-sdk/anthropic";

import { DEAN_SYSTEM_PROMPT } from "./dean";
import { buildDeanTools } from "./tools";
import { emit } from "@events/bus";

/** Tool-loop stops after this many steps. Generous enough that Dean can
 *  plan → call archivist → read → call a specialist → respond, but not so
 *  huge that a runaway loop burns budget. Bumpable if we add more specialists. */
const MAX_STEPS = 6;

export interface RunDeanStreamInput {
  /** Conversation as UIMessages from `@ai-sdk/react`'s `useChat`. */
  messages: UIMessage[];
  /** Optional — future use when profile summaries are prepended to the
   *  system prompt. For now just threads through to events. */
  studentId?: string;
}

export async function runDeanStream(input: RunDeanStreamInput) {
  emit({ type: "agent_spawned", agent: "dean" });

  // v6: `convertToModelMessages` may run async adapters (e.g. to materialize
  // file parts from data URLs), so it returns a Promise. Await before handing
  // off to streamText.
  const modelMessages = await convertToModelMessages(input.messages);

  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system: DEAN_SYSTEM_PROMPT,
    messages: modelMessages,
    tools: buildDeanTools(),
    stopWhen: stepCountIs(MAX_STEPS),
    onStepFinish: ({ text }) => {
      // If the step produced user-visible text from Dean, note it. Useful
      // for the office canvas to show Dean "speaking" when his bubble pops.
      if (text && text.trim().length > 0) {
        emit({ type: "response_to_user", agent: "dean", text });
      }
    },
    onFinish: () => {
      emit({ type: "agent_idle", agent: "dean" });
    },
    onError: ({ error }) => {
      const message = error instanceof Error ? error.message : String(error);
      emit({ type: "agent_blocked", agent: "dean", reason: message });
    },
  });

  return result;
}
