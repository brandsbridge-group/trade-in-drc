/**
 * What the team actually checked about a company, as the public pages may show
 * it: booleans and one count from the `company_public_verification` function
 * (00063) — approved documents of the real verification circuit, legacy
 * summary checks that passed, and approved client references.
 */
export interface VerificationFacts {
  /** Registration certificate (RCCM or the home country's equivalent) checked. */
  registration: boolean;
  /** Tax registration (NIF) checked. */
  tax: boolean;
  address: boolean;
  /** Trade licence / shipping record checked. */
  license: boolean;
  siteVisit: boolean;
  /** Approved client references. */
  references: number;
}

/** Anything unexpected (or a company the caller may not see) reads as "nothing checked". */
export function toVerificationFacts(raw: unknown): VerificationFacts {
  const facts = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    registration: facts.registration === true,
    tax: facts.tax === true,
    address: facts.address === true,
    license: facts.license === true,
    siteVisit: facts.site_visit === true,
    references: typeof facts.references === "number" && facts.references > 0 ? facts.references : 0,
  };
}
