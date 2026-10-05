import { describe, it, expect } from "vitest";
import {
  stepsForProfile,
  CONGOLESE_STEPS,
  INTERNATIONAL_STEPS,
  OPTIONAL_STEPS,
} from "./constants";
import {
  EMPTY_FORM,
  requiredForStep,
  isInternational,
  stepForInvalidFields,
  fieldLabelKey,
  filterKnownFields,
  coercePlanForProfile,
} from "./types";
import type { RegisterFormData } from "./types";

const form = (patch: Partial<RegisterFormData> = {}): RegisterFormData => ({
  ...EMPTY_FORM,
  ...patch,
});

describe("stepsForProfile", () => {
  // Brief v2: the short, signed-in-only form. Verification, profile details
  // and the plan moved to dashboard actions.
  it("gives the Congolese path two steps: company, then contact", () => {
    expect(stepsForProfile("congolese")).toEqual(["company", "contact"]);
  });

  it("gives the international path a third, optional DRC-interest step", () => {
    expect(stepsForProfile("international")).toEqual(["company", "contact", "market_interest"]);
    expect(OPTIONAL_STEPS).toEqual(["market_interest"]);
  });

  it("never includes a plan, documents or review step", () => {
    for (const step of [...CONGOLESE_STEPS, ...INTERNATIONAL_STEPS]) {
      expect(["plan", "documents", "review"]).not.toContain(step);
    }
  });
});

describe("requiredForStep", () => {
  it("defaults to the Congolese profile", () => {
    expect(EMPTY_FORM.profile).toBe("congolese");
    expect(isInternational(EMPTY_FORM)).toBe(false);
  });

  it("asks a Congolese company for name, country, sector, province and city", () => {
    expect(requiredForStep("company", form())).toEqual([
      "companyLegalName",
      "country",
      "sectorId",
      "province",
      "city",
    ]);
  });

  it("asks an international company for its head-office city instead of a province", () => {
    const req = requiredForStep("company", form({ profile: "international", country: "Turkey" }));
    expect(req).toEqual(["companyLegalName", "country", "sectorId", "city"]);
    expect(req).not.toContain("province");
  });

  it("requires the company e-mail, a contact person and a phone on both paths", () => {
    const expected = ["officialEmail", "contactPerson", "phone"];
    expect(requiredForStep("contact", form())).toEqual(expected);
    expect(requiredForStep("contact", form({ profile: "international" }))).toEqual(expected);
  });

  it("never blocks on the optional DRC-interest step, even once touched", () => {
    const touched = form({ profile: "international", drcInterests: ["investment"] });
    expect(requiredForStep("market_interest", touched)).toEqual([]);
  });

  it("no longer requires any verification or profile field at creation", () => {
    const all = new Set<keyof RegisterFormData>();
    const intl = form({ profile: "international", country: "Turkey" });
    for (const step of CONGOLESE_STEPS) requiredForStep(step, form()).forEach((f) => all.add(f));
    for (const step of INTERNATIONAL_STEPS) requiredForStep(step, intl).forEach((f) => all.add(f));
    for (const moved of [
      "rccmNumber",
      "nationalId",
      "nif",
      "yearEstablished",
      "legalForm",
      "employees",
      "jobTitle",
      "languages",
      "rccmCertName",
      "nifDocName",
    ] as const) {
      expect(all.has(moved)).toBe(false);
    }
  });
});

// P0-5: when the server rejects fields the client-side pass missed, the
// wizard jumps to the step that collects the first offending field.
describe("stepForInvalidFields", () => {
  it("picks the first step, in the profile's order, that collects a rejected field", () => {
    expect(stepForInvalidFields("congolese", ["phone", "city"], form())).toBe("company");
    expect(stepForInvalidFields("congolese", ["officialEmail"], form())).toBe("contact");
  });

  it("maps the international head-office city to the company step", () => {
    const intl = form({ profile: "international", country: "Turkey" });
    expect(stepForInvalidFields("international", ["city"], intl)).toBe("company");
  });

  it("returns null when no rejected field maps to any step", () => {
    expect(stepForInvalidFields("congolese", ["ownerId"], form())).toBeNull();
    expect(stepForInvalidFields("congolese", ["drcInterests"], form())).toBeNull();
  });

  it("returns null when the server sent no fields at all", () => {
    expect(stepForInvalidFields("congolese", [], form())).toBeNull();
  });
});

// General guard for the class of bug P0-4 was: a field gets added to a
// requiredForStep() list (so the wizard can block + jump to it) but nobody
// adds a matching FIELD_LABEL_KEYS entry, so the invalid-fields banner names
// the WRONG field to the applicant instead of the one that's actually empty.
// fieldLabelKey() silently falls back to "fields.companyLegalName" for any
// key missing from the map, so a missing mapping is invisible unless we check
// every field that can actually appear in a requiredForStep() result.
describe("fieldLabelKey coverage", () => {
  it("has a real (non-fallback) label for every field any requiredForStep() list can return", () => {
    const congolese = form();
    const international = form({ profile: "international", country: "Turkey" });

    const allRequiredFields = new Set<keyof RegisterFormData>();
    for (const step of CONGOLESE_STEPS) {
      requiredForStep(step, congolese).forEach((f) => allRequiredFields.add(f));
    }
    for (const step of INTERNATIONAL_STEPS) {
      requiredForStep(step, international).forEach((f) => allRequiredFields.add(f));
    }

    const FALLBACK_KEY = "fields.companyLegalName";
    const unmapped = [...allRequiredFields].filter(
      (field) => field !== "companyLegalName" && fieldLabelKey(field) === FALLBACK_KEY
    );

    expect(unmapped).toEqual([]);
  });

  // Code-review finding: `profile` and `interestOther` are real
  // register-company-actions.ts zod schema keys the server can reject, but
  // never appear in any requiredForStep() list, so the coverage test above
  // could never catch them being unmapped — they were found by reading the
  // schema directly, not by this test. Pin both explicitly.
  it("has a real (non-fallback) label for profile and interestOther, the two schema keys no requiredForStep list ever names", () => {
    const FALLBACK_KEY = "fields.companyLegalName";
    expect(fieldLabelKey("profile")).not.toBe(FALLBACK_KEY);
    expect(fieldLabelKey("interestOther")).not.toBe(FALLBACK_KEY);
    expect(fieldLabelKey("profile")).toBe("fields.companyProfile");
    expect(fieldLabelKey("interestOther")).toBe("fields.interestOther");
  });
});

// P1-3/code-review: register-wizard.tsx used to cast the server's rejected
// -field list straight into `keyof RegisterFormData` with no validation.
// filterKnownFields is the guard — any string the server sends that isn't a
// real, labeled RegisterFormData key must be dropped, not silently mislabeled
// via fieldLabelKey()'s companyLegalName fallback.
describe("filterKnownFields", () => {
  it("keeps only fields fieldLabelKey can genuinely label", () => {
    expect(filterKnownFields(["companyLegalName", "officialEmail"])).toEqual([
      "companyLegalName",
      "officialEmail",
    ]);
  });

  it("drops keys the label map doesn't know, instead of letting them through to be mislabeled", () => {
    expect(
      filterKnownFields(["companyLegalName", "someFutureUnmappedField", "id"])
    ).toEqual(["companyLegalName"]);
  });

  it("returns an empty list — not a fabricated guess — when nothing the server rejected is mappable", () => {
    expect(filterKnownFields(["someFutureUnmappedField"])).toEqual([]);
  });

  it("passes profile and interestOther through now that they're mapped", () => {
    expect(filterKnownFields(["profile", "interestOther"])).toEqual([
      "profile",
      "interestOther",
    ]);
  });
});

// P1-5: the international ladder only ever offers Free/Premium
// (INTL_REGISTER_PLANS) — a Congolese-only "verified" pick must not survive
// a switch to the international profile. register-wizard.tsx's
// selectProfile() unconditionally resets `plan` to "free" client-side;
// coercePlanForProfile is the authoritative server-side gate (used by
// registerCompany) so a stale restored draft, or any caller bypassing the
// wizard, can't smuggle "verified" through on the international path.
describe("coercePlanForProfile", () => {
  it("downgrades a Congolese-only 'verified' pick to 'free' on the international path", () => {
    expect(coercePlanForProfile("international", "verified")).toBe("free");
  });

  it("leaves 'free' and 'premium' untouched on the international path", () => {
    expect(coercePlanForProfile("international", "free")).toBe("free");
    expect(coercePlanForProfile("international", "premium")).toBe("premium");
  });

  it("never touches any plan on the Congolese path — 'verified' is legitimate there", () => {
    expect(coercePlanForProfile("congolese", "verified")).toBe("verified");
    expect(coercePlanForProfile("congolese", "free")).toBe("free");
    expect(coercePlanForProfile("congolese", "premium")).toBe("premium");
  });
});
