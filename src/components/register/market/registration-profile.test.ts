import { describe, it, expect } from "vitest";
import {
  stepsForProfile,
  CONGOLESE_STEPS,
  INTERNATIONAL_STEPS,
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
  // P2-2: a "plan" step was inserted (Congolese 5 -> 6 steps) so the pricing
  // panel can never again just disappear when someone switches to the
  // international profile (P1-4) — it's a validated step, not a
  // conditionally-rendered panel above the wizard.
  it("gives the Congolese path six steps, ending in plan then review", () => {
    expect(stepsForProfile("congolese")).toEqual(CONGOLESE_STEPS);
    expect(stepsForProfile("congolese")).toHaveLength(6);
    expect(CONGOLESE_STEPS.slice(-2)).toEqual(["plan", "review"]);
  });

  it("gives international applicants the seven-step market-entry form", () => {
    expect(stepsForProfile("international")).toEqual(INTERNATIONAL_STEPS);
    expect(stepsForProfile("international")).toHaveLength(7);
  });

  it("orders the international steps as the customer design does, with plan moved second-to-last", () => {
    // P2-2: "plan" (formerly "profile_plan", step 5 of 7) now sits right
    // before Review — the same relative position as the Congolese path —
    // instead of ahead of Documents.
    expect(INTERNATIONAL_STEPS).toEqual([
      "company_info",
      "business_profile",
      "market_interest",
      "contact_person",
      "documents",
      "plan",
      "review",
    ]);
  });

  it("puts the plan step in the same relative position (second-to-last) on both paths", () => {
    expect(CONGOLESE_STEPS.at(-2)).toBe("plan");
    expect(INTERNATIONAL_STEPS.at(-2)).toBe("plan");
  });
});

describe("requiredForStep", () => {
  it("defaults to the Congolese profile", () => {
    expect(EMPTY_FORM.profile).toBe("congolese");
    expect(isInternational(EMPTY_FORM)).toBe(false);
  });

  it("demands the Congolese registries on the legal step", () => {
    const req = requiredForStep("legal", form());
    expect(req).toContain("rccmNumber");
    expect(req).toContain("nationalId");
    expect(req).toContain("nif");
  });

  it("drops the DRC-only registries for an international applicant", () => {
    // The DECLARED PROFILE decides this — not the country field.
    const req = requiredForStep(
      "legal",
      form({ profile: "international", country: "Turkey" })
    );
    expect(req).toContain("rccmNumber"); // every jurisdiction has one
    expect(req).not.toContain("nationalId");
    expect(req).not.toContain("nif");
  });

  /**
   * Regression guard. Requirements used to key off `country`, so an
   * international applicant who selected the DRC as their country of
   * registration — a foreign group's Congolese subsidiary, which migration
   * 00038 calls out as legitimate — was hard-blocked on the Documents step by a
   * Congolese NIF document they cannot possess.
   */
  it("never demands the Congolese NIF document from an international applicant", () => {
    const drcSubsidiary = form({
      profile: "international",
      country: "Democratic Republic of the Congo",
    });
    expect(requiredForStep("documents", drcSubsidiary)).not.toContain("nifDocName");
    expect(requiredForStep("legal", drcSubsidiary)).not.toContain("nif");
    // …while a Congolese applicant still must supply it.
    expect(requiredForStep("documents", form())).toContain("nifDocName");
  });

  it("requires province only for DRC companies", () => {
    expect(requiredForStep("professional", form())).toContain("province");
    expect(
      requiredForStep("professional", form({ country: "Italy" }))
    ).not.toContain("province");
  });

  it("asks international applicants what they want in the DRC", () => {
    const data = form({ profile: "international", country: "Turkey" });
    const req = requiredForStep("market_interest", data);
    expect(req).toEqual(["drcInterests", "entryTimeline", "marketInterestNotes"]);
  });

  it("requires a head office on the international company step", () => {
    const req = requiredForStep("company_info", form({ profile: "international" }));
    expect(req).toContain("headOffice");
    expect(req).toContain("country");
    // Congolese-only registries never appear on the international path.
    expect(req).not.toContain("nationalId");
    expect(req).not.toContain("province");
  });

  it("never blocks the plan step — a plan is always selected", () => {
    expect(requiredForStep("plan", form({ profile: "international" }))).toEqual([]);
    expect(requiredForStep("plan", form())).toEqual([]);
  });

  it("returns a required set for every step of both paths", () => {
    for (const step of CONGOLESE_STEPS) {
      expect(Array.isArray(requiredForStep(step, form()))).toBe(true);
    }
    const intl = form({ profile: "international", country: "Turkey" });
    for (const step of INTERNATIONAL_STEPS) {
      expect(Array.isArray(requiredForStep(step, intl))).toBe(true);
    }
  });
});

// P0-5: when the server rejects fields the client-side pass missed, the
// wizard must jump to the step that actually collects the first offending
// field — never leave the applicant stuck on Review with nothing outlined.
describe("stepForInvalidFields", () => {
  it("picks the first Congolese step whose requiredForStep list contains a rejected field", () => {
    // "nif" is required on "legal"; "rccmCertName" on "documents". "legal"
    // comes first in CONGOLESE_STEPS, so it must win even though the fields
    // array lists the documents-step field first.
    const step = stepForInvalidFields(
      "congolese",
      ["rccmCertName", "nif"],
      form()
    );
    expect(step).toBe("legal");
  });

  it("picks the first international step whose requiredForStep list contains a rejected field", () => {
    const intl = form({ profile: "international", country: "Turkey" });
    // "drcInterests" only appears on "market_interest"; nothing before it
    // in INTERNATIONAL_STEPS collects that field.
    const step = stepForInvalidFields("international", ["drcInterests"], intl);
    expect(step).toBe("market_interest");
  });

  it("respects each profile's own step order, not the other profile's", () => {
    // "officialEmail" is collected on "professional" (Congolese) but on
    // "company_info" (international) — the same field name maps to a
    // different step depending on which path is running.
    expect(
      stepForInvalidFields("congolese", ["officialEmail"], form())
    ).toBe("professional");
    expect(
      stepForInvalidFields(
        "international",
        ["officialEmail"],
        form({ profile: "international", country: "Turkey" })
      )
    ).toBe("company_info");
  });

  it("falls back to review when no rejected field maps to any step", () => {
    // e.g. a DB-level rejection (unique constraint, etc.) with no field name
    // the wizard collects — still land somewhere sane with the generic toast.
    expect(stepForInvalidFields("congolese", ["ownerId"], form())).toBe(
      "review"
    );
  });

  it("falls back to review when the server sent no fields at all", () => {
    expect(stepForInvalidFields("congolese", [], form())).toBe("review");
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
