/**
 * Student profile view.
 *
 * `get(studentId)` returns a structured, human-readable summary of every
 * confirmed claim. Prepended to Dean's system prompt per turn so Dean
 * never re-asks what we already know.
 */

import "server-only";
import { hasSupabase } from "@/lib/utils/env";

export interface ProfileSummary {
  studentId: string;
  displayName: string | null;
  claimCounts: {
    total: number;
    confirmed: number;
    pending: number;
  };
  academic: string[];
  activities: string[];
  themes: string[];
  financial: string[];
  schools: string[];
  rawClaims: Array<{
    id: string;
    predicate: string;
    object: unknown;
    status: string;
    confidence: number;
  }>;
}

const EMPTY: ProfileSummary = {
  studentId: "",
  displayName: null,
  claimCounts: { total: 0, confirmed: 0, pending: 0 },
  academic: [],
  activities: [],
  themes: [],
  financial: [],
  schools: [],
  rawClaims: [],
};

export async function get(studentId: string): Promise<ProfileSummary> {
  if (!hasSupabase()) return { ...EMPTY, studentId };
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [studentRes, claimsRes] = await Promise.all([
    supabase.from("students").select("display_name").eq("id", studentId).maybeSingle(),
    supabase
      .from("claims")
      .select("id, predicate, object, status, confidence")
      .eq("student_id", studentId)
      .order("confidence", { ascending: false })
      .limit(200),
  ]);

  type Row = {
    id: string;
    predicate: string;
    object: unknown;
    status: string;
    confidence: number;
  };
  const claims = (claimsRes.data ?? []) as Row[];

  const confirmed = claims.filter((c) => c.status === "confirmed");
  const pending = claims.filter((c) => c.status === "pending");

  const bucket = (pred: string) =>
    confirmed.filter((c) => c.predicate === pred);

  const academic = [
    ...bucket("has_gpa").map((c) => `GPA: ${stringifyObj(c.object)}`),
    ...bucket("has_sat_score").map((c) => `SAT: ${stringifyObj(c.object)}`),
    ...bucket("has_act_score").map((c) => `ACT: ${stringifyObj(c.object)}`),
    ...bucket("took_course").map((c) => `Took: ${stringifyObj(c.object)}`),
  ];

  const activities = bucket("participates_in").map((c) =>
    `• ${stringifyObj(c.object)}`,
  );

  const themes = bucket("has_theme").map((c) => stringifyObj(c.object));

  const financial = [
    ...bucket("household_agi").map((c) => `AGI: ${stringifyObj(c.object)}`),
    ...bucket("pell_eligible").map((c) => `Pell: ${stringifyObj(c.object)}`),
    ...bucket("max_loan_tolerance").map(
      (c) => `Max loan tolerance: ${stringifyObj(c.object)}`,
    ),
  ];

  const schools = bucket("interested_in_school").map((c) =>
    stringifyObj(c.object),
  );

  return {
    studentId,
    displayName: studentRes.data?.display_name ?? null,
    claimCounts: {
      total: claims.length,
      confirmed: confirmed.length,
      pending: pending.length,
    },
    academic,
    activities,
    themes,
    financial,
    schools,
    rawClaims: claims,
  };
}

/** Render a ProfileSummary as a short string block for injection into
 *  Dean's system prompt. Keep it dense — Dean has limited context budget. */
export function render(p: ProfileSummary): string {
  const lines: string[] = [];
  lines.push(`<student_profile id="${p.studentId}">`);
  if (p.displayName) lines.push(`name: ${p.displayName}`);
  lines.push(
    `claims: ${p.claimCounts.confirmed} confirmed, ${p.claimCounts.pending} pending`,
  );
  if (p.academic.length) lines.push(`academic:\n  ${p.academic.join("\n  ")}`);
  if (p.activities.length)
    lines.push(`activities:\n  ${p.activities.join("\n  ")}`);
  if (p.themes.length) lines.push(`themes: ${p.themes.join(", ")}`);
  if (p.financial.length) lines.push(`financial:\n  ${p.financial.join("\n  ")}`);
  if (p.schools.length) lines.push(`schools: ${p.schools.join(", ")}`);
  lines.push(`</student_profile>`);
  return lines.join("\n");
}

function stringifyObj(o: unknown): string {
  if (o === null || o === undefined) return "";
  if (typeof o === "string") return o;
  if (typeof o === "number" || typeof o === "boolean") return String(o);
  try {
    return JSON.stringify(o);
  } catch {
    return String(o);
  }
}
