/**
 * renderCited — parse Dean's output into text + <Citation> nodes.
 *
 * Dean's system prompt tells him to cite with `[chunk:<id>]` tokens inline.
 * When we render his stream in the chat panel, we replace each token with
 * a brass superscript chip that opens a provenance popover.
 *
 * If a token is malformed or the id is empty, we drop it silently — better
 * a clean paragraph than a raw `[chunk:]` staring at the user.
 *
 * Example:
 *   in:  "your GPA is 3.95 [chunk:abc123], which is strong"
 *   out: ["your GPA is 3.95 ", <Citation chunkId="abc123">·</Citation>,
 *        ", which is strong"]
 */

import { Fragment, type ReactNode } from "react";
import Citation from "@/components/ui/Citation";

const CITE_RE = /\[chunk:([a-zA-Z0-9_-]{4,})\]/g;

export interface CitedOpts {
  /** Optional per-id metadata for hover preview. */
  meta?: Readonly<
    Record<string, { sourceFilename?: string; offsetStart?: number; offsetEnd?: number }>
  >;
  /** The glyph shown inside the Citation chip — defaults to a sonar dot. */
  glyph?: string;
}

export function renderCited(text: string, opts: CitedOpts = {}): ReactNode {
  if (!text || !CITE_RE.test(text)) return text;
  CITE_RE.lastIndex = 0;

  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(CITE_RE)) {
    const start = m.index ?? 0;
    const id = m[1];
    if (start > last) nodes.push(text.slice(last, start));
    const meta = opts.meta?.[id];
    nodes.push(
      <Citation
        key={`c-${i++}-${id}`}
        chunkId={id}
        sourceFilename={meta?.sourceFilename}
        offsetStart={meta?.offsetStart}
        offsetEnd={meta?.offsetEnd}
      >
        <span aria-hidden>{opts.glyph ?? "◉"}</span>
      </Citation>,
    );
    last = start + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <Fragment>{nodes}</Fragment>;
}
