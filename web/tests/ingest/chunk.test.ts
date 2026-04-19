import { describe, it, expect } from "vitest";
import { chunkText } from "@/lib/ingest/chunk";

describe("chunkText", () => {
  it("returns [] on empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("preserves short paragraphs as single chunks", () => {
    const text = "First paragraph here.\n\nSecond one, also short.";
    const chunks = chunkText(text, 100);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].text).toBe("First paragraph here.");
    expect(chunks[1].text).toBe("Second one, also short.");
    // Offsets point back into the original string.
    expect(text.slice(chunks[0].offsetStart, chunks[0].offsetEnd)).toContain(
      "First paragraph here.",
    );
  });

  it("splits long paragraphs on sentence boundaries under maxLen", () => {
    const long = Array.from(
      { length: 20 },
      (_, i) => `Sentence number ${i} stretches for a while.`,
    ).join(" ");
    const chunks = chunkText(long, 120);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.text.length).toBeLessThanOrEqual(140); // generous slack
    }
  });

  it("offsets are monotonic", () => {
    const text =
      "Paragraph A with some content.\n\nParagraph B that's a bit longer and " +
      "has multiple sentences. Another sentence here. And one more.";
    const chunks = chunkText(text, 60);
    let last = -1;
    for (const c of chunks) {
      expect(c.offsetStart).toBeGreaterThanOrEqual(last);
      expect(c.offsetEnd).toBeGreaterThanOrEqual(c.offsetStart);
      last = c.offsetStart;
    }
  });

  it("skips blank paragraphs", () => {
    const text = "First.\n\n\n\nSecond.\n\n\n\n";
    const chunks = chunkText(text);
    expect(chunks.map((c) => c.text)).toEqual(["First.", "Second."]);
  });
});
