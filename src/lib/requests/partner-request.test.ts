import { describe, expect, it } from "vitest";
import {
  ATTACHMENT_PATH_PATTERN,
  EMPTY_PARTNER_REQUEST,
  attachmentError,
  firstInvalidStep,
  partnerRequestDetails,
  readPartnerRequestDetails,
  stepErrors,
  validatePartnerRequest,
  type PartnerRequestValues,
} from "./partner-request";

const complete: PartnerRequestValues = {
  need: "supplier",
  productService: "Fèves de cacao fermentées",
  sectorId: "",
  targetProvince: "",
  timeline: "m_3_6",
  volume: "k50_250k",
  requirement: "Nous cherchons un fournisseur régulier, 12 tonnes par trimestre.",
  preferences: ["verified_only"],
  companyName: "Benelux Cocoa Traders",
  contactPerson: "Anke Vermeulen",
  email: "anke@example.com",
  phone: "+32470123456",
  country: "Belgium",
  website: "www.benelux-cocoa.example",
};

describe("validatePartnerRequest", () => {
  it("accepts a complete request", () => {
    expect(validatePartnerRequest(complete)).toEqual({});
  });

  it("lists every missing required field of an empty form", () => {
    expect(validatePartnerRequest(EMPTY_PARTNER_REQUEST)).toEqual({
      need: "required",
      productService: "required",
      timeline: "required",
      requirement: "required",
      companyName: "required",
      contactPerson: "required",
      email: "required",
      country: "required",
    });
  });

  it("leaves the optional fields alone when they are empty", () => {
    const errors = validatePartnerRequest({ ...complete, volume: "", phone: "", website: "", sectorId: "", targetProvince: "", preferences: [] });
    expect(errors).toEqual({});
  });

  it("names the problem, not just the field", () => {
    expect(validatePartnerRequest({ ...complete, email: "anke@example" }).email).toBe("email");
    expect(validatePartnerRequest({ ...complete, phone: "0470 12 34 56" }).phone).toBe("phone");
    expect(validatePartnerRequest({ ...complete, website: "pas un site" }).website).toBe("website");
    expect(validatePartnerRequest({ ...complete, requirement: "Trop court." }).requirement).toBe("too_short");
    expect(validatePartnerRequest({ ...complete, companyName: "x".repeat(201) }).companyName).toBe("too_long");
  });

  it("accepts a website with or without its protocol", () => {
    for (const website of ["kivu.cd", "https://kivu.cd", "http://www.kivu.cd/fr/produits"]) {
      expect(validatePartnerRequest({ ...complete, website }).website).toBeUndefined();
    }
  });

  it("refuses option values the form does not offer", () => {
    const forged = { ...complete, timeline: "someday", volume: "huge", preferences: ["free_gifts"] } as unknown as PartnerRequestValues;
    expect(validatePartnerRequest(forged)).toEqual({ timeline: "invalid", volume: "invalid", preferences: "invalid" });
  });
});

describe("steps", () => {
  it("only reports the errors of the step asked for", () => {
    expect(stepErrors(EMPTY_PARTNER_REQUEST, "need")).toEqual({ need: "required" });
    expect(Object.keys(stepErrors(EMPTY_PARTNER_REQUEST, "contact")).sort()).toEqual(["companyName", "contactPerson", "country", "email"]);
    expect(stepErrors({ ...EMPTY_PARTNER_REQUEST, need: "supplier" }, "need")).toEqual({});
  });

  it("finds the first step still to fix", () => {
    expect(firstInvalidStep(EMPTY_PARTNER_REQUEST)).toBe("need");
    expect(firstInvalidStep({ ...complete, requirement: "" })).toBe("details");
    expect(firstInvalidStep({ ...complete, email: "" })).toBe("contact");
    expect(firstInvalidStep(complete)).toBeNull();
  });
});

describe("details", () => {
  it("stores keys, trimmed, with the preferences in a stable order", () => {
    expect(partnerRequestDetails({ ...complete, productService: "  Cacao  ", preferences: ["sponsorship", "verified_only"], website: "" })).toEqual({
      form: "partner_request",
      need: "supplier",
      product: "Cacao",
      volume: "k50_250k",
      preferences: ["verified_only", "sponsorship"],
      website: null,
    });
  });

  it("reads its own output back", () => {
    const details = partnerRequestDetails(complete);
    expect(readPartnerRequestDetails(JSON.parse(JSON.stringify(details)))).toEqual(details);
  });

  it("returns null for requests written by another form", () => {
    expect(readPartnerRequestDetails({})).toBeNull();
    expect(readPartnerRequestDetails(null)).toBeNull();
    expect(readPartnerRequestDetails({ form: "partner_request", need: "world_domination" })).toBeNull();
  });

  it("drops unknown values instead of trusting them", () => {
    expect(readPartnerRequestDetails({ form: "partner_request", need: "supplier", volume: "huge", preferences: ["x", "b2b_meetings"], website: 4 })).toEqual({
      form: "partner_request",
      need: "supplier",
      product: "",
      volume: null,
      preferences: ["b2b_meetings"],
      website: null,
    });
  });
});

describe("attachment", () => {
  it("refuses a file that is too large or of another type", () => {
    expect(attachmentError({ size: 1024, type: "application/pdf" })).toBeNull();
    expect(attachmentError({ size: 11 * 1024 * 1024, type: "application/pdf" })).toBe("too_large");
    expect(attachmentError({ size: 1024, type: "application/x-msdownload" })).toBe("bad_type");
  });

  it("only accepts paths this app issued", () => {
    expect(ATTACHMENT_PATH_PATTERN.test("inbox/3f2b8c1e-9a4d-4e7b-8c2f-1a2b3c4d5e6f/file.pdf")).toBe(true);
    expect(ATTACHMENT_PATH_PATTERN.test("inbox/../company-documents/file.pdf")).toBe(false);
    expect(ATTACHMENT_PATH_PATTERN.test("inbox/3f2b8c1e-9a4d-4e7b-8c2f-1a2b3c4d5e6f/evil.exe")).toBe(false);
  });
});
