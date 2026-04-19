import { describe, it, expect } from "vitest";
import { essayWorker } from "@agents/archivist/workers/essay";

const GRANDMOTHER_ESSAY = `
Common App Prompt 1

My grandmother, my abuela, taught me patience. She grew up in a house
where sacrifice had a name on every doorknob, and she brought that into
ours. I used to think...
`;

const ROBOTICS_PIQ = `
UC PIQ #2

When we started the gripper project, I didn't know silicone could do what
we needed it to. Mr. Arellano walked us through it. The robotics team
invented, tried, invented again.
`;

describe("essayWorker", () => {
  it("detects the grandmother theme + flags the cliché", async () => {
    const r = await essayWorker({
      studentId: "test",
      sourceFileId: null,
      filename: "common_app_essay_v3.txt",
      text: GRANDMOTHER_ESSAY,
    });

    const themes = r.claims
      .filter((c) => c.predicate === "essay_theme")
      .map((c) => (c.object as { theme: string }).theme);
    expect(themes).toContain("Grandmother");

    const weaknesses = r.claims
      .filter((c) => c.predicate === "essay_weakness")
      .map((c) => (c.object as { weakness: string }).weakness);
    expect(weaknesses).toContain("admissions_cliche_grandmother");
  });

  it("detects robotics theme on PIQ", async () => {
    const r = await essayWorker({
      studentId: "test",
      sourceFileId: null,
      filename: "uc_piq.txt",
      text: ROBOTICS_PIQ,
    });
    const themes = r.claims
      .filter((c) => c.predicate === "essay_theme")
      .map((c) => (c.object as { theme: string }).theme);
    expect(themes).toContain("Robotics_Gripper_Project");
  });
});
