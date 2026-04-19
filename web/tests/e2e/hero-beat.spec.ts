import { test, expect, type Route } from "@playwright/test";

/**
 * Hero-beat smoke test.
 *
 * The live /api/search needs Supabase + a seeded Maria to return
 * deterministic essay/transcript counts. Playwright runs against a bare
 * dev server, so we route-mock /api/search to return the scripted
 * "essay-heavy → transcript-heavy" pair. This exercises:
 *   - SearchBar → officeStore → hero-controller → OfficeHUD close-line render
 *
 * Keep this shape stable with what the live server returns (hitsByScope).
 */

interface MockHit {
  chunkId: string;
  scope: "student" | "world";
  sourceKind:
    | "essay"
    | "transcript"
    | "activity"
    | "financial"
    | "college-profile"
    | "scholarship"
    | "aid-policy"
    | "style-guide";
  text: string;
  score: number;
}

function essayHit(i: number): MockHit {
  return {
    chunkId: `mock-essay-${i}`,
    scope: "student",
    sourceKind: "essay",
    text: `essay chunk ${i} about grandmother abuela tamales`,
    score: 0.9 - i * 0.01,
  };
}
function transcriptHit(i: number): MockHit {
  return {
    chunkId: `mock-transcript-${i}`,
    scope: "student",
    sourceKind: "transcript",
    text: `transcript chunk ${i} about robotics gripper makergirl`,
    score: 0.9 - i * 0.01,
  };
}

async function mockSearch(route: Route) {
  const body = (await route.request().postDataJSON()) as { query: string };
  const q = (body?.query ?? "").toLowerCase();
  let student: MockHit[] = [];
  if (q.includes("grandmother") || q.includes("abuela")) {
    student = Array.from({ length: 6 }, (_, i) => essayHit(i));
  } else if (q.includes("robot")) {
    student = Array.from({ length: 14 }, (_, i) => transcriptHit(i));
  }
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      query: body.query,
      hitsByScope: { student, world: [] },
      hitsBySourceKind: {},
      totalHits: student.length,
      latencyMs: 5,
    }),
  });
}

test("hero beat fires Dean close line on grandmother → robotics", async ({
  page,
}) => {
  await page.route("**/api/search", mockSearch);

  await page.goto("/office?demo=1");
  await page.waitForLoadState("domcontentloaded");

  const search = page.getByLabel("Tell me what I said");
  await expect(search).toBeVisible({ timeout: 15_000 });

  await search.fill("grandmother");
  await page.waitForTimeout(600);

  await search.fill("robotics");
  await page.waitForTimeout(1200);

  // The OfficeHUD surfaces the close line under a DEAN ↯ label; the exact
  // suffix varies by state (INTERCOM for unprompted / CLOSE for hero beat).
  // Assertion: the *content* of the close line has to show up.
  await expect(
    page.getByText(/wrote the page about your grandmother/i),
  ).toBeVisible({ timeout: 8_000 });
  await expect(page.getByText(/told me about robotics/i)).toBeVisible({
    timeout: 2_000,
  });
});
