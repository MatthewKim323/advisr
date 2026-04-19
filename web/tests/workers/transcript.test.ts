import { describe, it, expect } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { transcriptWorker } from "@agents/archivist/workers/transcript";

const FIXTURE = path.resolve(__dirname, "..", "..", "..", "about", "01_transcript.txt");

describe("transcriptWorker (Maria)", () => {
  it("extracts headline GPA + test scores", async () => {
    const text = await fs.readFile(FIXTURE, "utf8");
    const r = await transcriptWorker({
      studentId: "test",
      sourceFileId: null,
      filename: "01_transcript.txt",
      text,
    });

    const preds = new Set(r.claims.map((c) => c.predicate));
    expect(preds.has("has_gpa")).toBe(true);
    expect(preds.has("has_gpa_weighted")).toBe(true);
    expect(preds.has("has_class_rank")).toBe(true);
    expect(preds.has("has_test_score")).toBe(true);
    expect(preds.has("takes_course")).toBe(true);
  });

  it("GPA matches the structured value", async () => {
    const text = await fs.readFile(FIXTURE, "utf8");
    const r = await transcriptWorker({
      studentId: "test",
      sourceFileId: null,
      filename: "01_transcript.txt",
      text,
    });
    const gpa = r.claims.find((c) => c.predicate === "has_gpa");
    expect(gpa?.object).toEqual({ value: 3.72, scale: "unweighted_4" });
  });
});
