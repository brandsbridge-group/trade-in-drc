import { describe, expect, it } from "vitest";
import { buildOnboarding } from "./onboarding";
import { HOME_COUNTRY } from "@/config/geo";
import { EMPTY_LEGAL, legalFromSummary, missingDocTypes, missingLegalFields, requiredDocTypes } from "@/lib/verifications/required-documents";
import { completenessHref } from "./profile-completeness";

const states = (input: Parameters<typeof buildOnboarding>[0]) =>
  buildOnboarding(input).steps.map((s) => `${s.key}:${s.state}`);

describe("buildOnboarding", () => {
  it("starts a new account on the company step", () => {
    const model = buildOnboarding({ companies: [], productCount: 0 });
    expect(states({ companies: [], productCount: 0 })).toEqual([
      "account:done",
      "company:current",
      "documents:upcoming",
      "product:upcoming",
    ]);
    expect(model.current?.href).toBe("/dashboard/companies/new");
    expect(model.percent).toBe(25);
    expect(model.complete).toBe(false);
  });

  it("sends a company that owes documents to its verification screen", () => {
    const model = buildOnboarding({ companies: [{ id: "c1", status: "pending_documents" }], productCount: 0 });
    expect(model.current).toEqual({ key: "documents", state: "current", href: "/dashboard/companies/c1/verification" });
    expect(model.doneCount).toBe(2);
  });

  it("puts a rejected company back on the documents step", () => {
    expect(buildOnboarding({ companies: [{ id: "c1", status: "rejected" }], productCount: 3 }).current?.key).toBe("documents");
  });

  it("counts documents as sent while the file is in review, and moves on to the product", () => {
    const model = buildOnboarding({ companies: [{ id: "c1", status: "pending" }], productCount: 0 });
    expect(model.current).toEqual({ key: "product", state: "current", href: "/dashboard/products/new" });
  });

  it("lets the product step be done before the documents one", () => {
    expect(states({ companies: [{ id: "c1", status: "pending_documents" }], productCount: 1 })).toEqual([
      "account:done",
      "company:done",
      "documents:current",
      "product:done",
    ]);
  });

  it("is complete once the company is submitted and has a product", () => {
    const model = buildOnboarding({ companies: [{ id: "c1", status: "verified" }], productCount: 2 });
    expect(model.complete).toBe(true);
    expect(model.current).toBeNull();
    expect(model.percent).toBe(100);
  });
});

describe("required verification documents", () => {
  it("asks a Congolese company for the RCCM and the NIF", () => {
    expect(requiredDocTypes(HOME_COUNTRY)).toEqual(["business_license", "tax_registration"]);
    // Rows created before the country column was filled default to the DRC.
    expect(requiredDocTypes(null)).toEqual(["business_license", "tax_registration"]);
  });

  it("asks a foreign company for its registration certificate only", () => {
    expect(requiredDocTypes("Turkey")).toEqual(["business_license"]);
  });

  it("lists what is still missing, ignoring optional documents", () => {
    expect(missingDocTypes(null, ["business_license", "additional_document"])).toEqual(["tax_registration"]);
    expect(missingDocTypes("Turkey", ["business_license"])).toEqual([]);
  });
});

describe("legal identity", () => {
  it("requires the registration number everywhere, and the NIF in the DRC", () => {
    expect(missingLegalFields(null, EMPTY_LEGAL)).toEqual(["registrationNumber", "taxId"]);
    expect(missingLegalFields("Turkey", EMPTY_LEGAL)).toEqual(["registrationNumber"]);
    expect(missingLegalFields(null, { ...EMPTY_LEGAL, registrationNumber: "CD/KNG/RCCM/1", taxId: "A123" })).toEqual([]);
  });

  it("reads the identifiers the registration form stored, tolerating a missing summary", () => {
    expect(legalFromSummary(null)).toEqual(EMPTY_LEGAL);
    expect(
      legalFromSummary({ registration_intake: { legal: { rccm_number: "R1", nif: null, year_established: 2019 } } })
    ).toEqual({ ...EMPTY_LEGAL, registrationNumber: "R1", yearEstablished: "2019" });
  });
});

describe("completenessHref", () => {
  it("opens the editor on the block holding the missing item", () => {
    expect(completenessHref("c1", "logo")).toBe("/dashboard/companies/c1/edit#media");
    expect(completenessHref("c1", "description")).toBe("/dashboard/companies/c1/edit#presentation");
    expect(completenessHref("c1", "markets")).toBe("/dashboard/companies/c1/edit#commerce");
    expect(completenessHref("c1", "contact")).toBe("/dashboard/companies/c1/edit#contact");
  });

  it("sends a missing product to the product form, and nothing missing to the top of the editor", () => {
    expect(completenessHref("c1", "products")).toBe("/dashboard/products/new");
    expect(completenessHref("c1", undefined)).toBe("/dashboard/companies/c1/edit");
  });
});
