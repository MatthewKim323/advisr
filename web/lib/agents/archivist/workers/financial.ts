/**
 * C9 — FinancialParser.
 *
 * Looks for labelled fields in /about/05_financial_info.txt and similar
 * intake forms. Conservative confidence bumps on exact-string matches.
 */

import type {
  ArchivistWorker,
  ArchivistWorkerResult,
  ProposedClaim,
} from "../types";

export const financialWorker: ArchivistWorker = async (
  input,
): Promise<ArchivistWorkerResult> => {
  const { text } = input;
  const claims: ProposedClaim[] = [];
  const get = (re: RegExp) => text.match(re)?.[1]?.trim();

  const agi = get(/(?:AGI|adjusted gross income|family_income)[^\d]*\$?([\d,]+)/i);
  if (agi)
    claims.push({
      predicate: "household_agi",
      object: { amount: Number(agi.replace(/,/g, "")), currency: "USD" },
      confidence: 0.99,
      sensitivity: "high",
    });

  const size = get(/household size[^:]*[:\s]+(\d+)/i);
  if (size)
    claims.push({
      predicate: "household_size",
      object: { size: Number(size) },
      confidence: 0.99,
    });

  const siblings = get(/(?:siblings|number_of_siblings)[^:]*[:\s]+(\d+)/i);
  if (siblings)
    claims.push({
      predicate: "number_of_siblings",
      object: { count: Number(siblings) },
      confidence: 0.99,
    });

  if (/first[\s-]?gen(eration)?/i.test(text))
    claims.push({
      predicate: "first_gen",
      object: { value: true },
      confidence: 0.95,
    });

  if (/pell[-\s]?eligible|pell grant|pell[-\s]?qualify/i.test(text))
    claims.push({
      predicate: "pell_eligible",
      object: { value: true },
      confidence: 0.95,
    });

  const efc = get(/(?:EFC|SAI)[^\d]*\$?([\d,]+)/i);
  if (efc)
    claims.push({
      predicate: "efc_sai",
      object: { amount: Number(efc.replace(/,/g, "")) },
      confidence: 0.95,
      sensitivity: "high",
    });

  const maxLoan = get(/max(?:imum)?[_\s]*(?:unsubsidized)?[_\s]*loan[^\d]*\$?([\d,]+)/i);
  if (maxLoan)
    claims.push({
      predicate: "max_unsubsidized_loan_per_year",
      object: { amount: Number(maxLoan.replace(/,/g, "")) },
      confidence: 0.9,
      sensitivity: "medium",
    });

  const maxDebt = get(/max(?:imum)?[_\s]*(?:total)?[_\s]*debt[^\d]*\$?([\d,]+)/i);
  if (maxDebt)
    claims.push({
      predicate: "max_total_debt_target",
      object: { amount: Number(maxDebt.replace(/,/g, "")) },
      confidence: 0.9,
      sensitivity: "medium",
    });

  if (/parent(?:[ _]|-)plus[\s\S]{0,40}?(no|won't|will not|not willing)/i.test(text))
    claims.push({
      predicate: "willing_to_take_parent_plus",
      object: { value: false },
      confidence: 0.9,
      sensitivity: "medium",
    });

  const state = get(/home[_\s]state[^:]*[:\s]+([A-Z]{2})/i);
  if (state)
    claims.push({
      predicate: "home_state_residency",
      object: { state },
      confidence: 0.99,
    });

  if (/single[_\s]?parent|separated|custodial/i.test(text))
    claims.push({
      predicate: "single_parent_household",
      object: { value: true },
      confidence: 0.85,
      sensitivity: "high",
    });

  const parentEd = get(/parent[_\s]education[_\s]*(?:max)?[^:]*[:\s]+"?([A-Za-z]+)"?/i);
  if (parentEd)
    claims.push({
      predicate: "parent_education_max",
      object: { level: parentEd.toLowerCase() },
      confidence: 0.95,
    });

  return { workerName: "financial", claims };
};
