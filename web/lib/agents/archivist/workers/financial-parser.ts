/**
 * FinancialParser worker.
 *
 * Input:  tax return / FAFSA-ready financial summary
 * Output: claims — family_income · household_size · parent_education_max
 *           number_of_siblings · pell_eligible · efc_sai
 *           single_parent_household · first_gen (inference)
 *
 * Needed for Bursar's Sequence-C personalization (true cost modeling).
 * All outputs tagged sensitivity=high; gated by ProposalQueue before use.
 */

export async function runFinancialParser(_sourceFileId: string) {
  throw new Error("not implemented");
}
