import { describe, it, expect } from "vitest";
import { DOCUMENT_TYPE, EXPECTED_DOC_TYPES } from "@/constants/status";
import { DOCUMENT_FIELD_TYPES } from "./upload-documents";

describe("DOCUMENT_FIELD_TYPES", () => {
  it("maps every registration document field to a value from the canonical DB enum (migration 00011)", () => {
    const canonical = new Set<string>(Object.values(DOCUMENT_TYPE));
    for (const type of Object.values(DOCUMENT_FIELD_TYPES)) {
      expect(canonical.has(type)).toBe(true);
    }
  });

  it("maps each of the four dropzone fields to a distinct document type — no two files would collide/overwrite", () => {
    const types = Object.values(DOCUMENT_FIELD_TYPES);
    expect(new Set(types).size).toBe(types.length);
  });

  it("covers exactly the four fields the Documents step collects", () => {
    expect(Object.keys(DOCUMENT_FIELD_TYPES).sort()).toEqual(
      ["additionalName", "logoName", "nifDocName", "rccmCertName"].sort()
    );
  });

  // Regression guard for the CRITICAL finding on e07847f: additionalName used
  // to map to `proof_of_address`, one of the three EXPECTED_DOC_TYPES the
  // admin verification queue (admin/verifications/page.tsx) scores as a
  // completeness dot. An applicant dropping ANY unrelated file into the
  // optional "Additional documents" slot made "Proof of address" read as
  // satisfied without ever proving an address — a false positive in a
  // regulatory check on a government portal. This must never regress: the
  // additional-documents field's type must never be a member of
  // EXPECTED_DOC_TYPES, no matter what that type is changed to later.
  it("never lets the optional additional-documents field satisfy an EXPECTED_DOC_TYPES completeness check", () => {
    const additionalType = DOCUMENT_FIELD_TYPES.additionalName;
    expect(EXPECTED_DOC_TYPES).not.toContain(additionalType);
  });

  it("still maps additionalName to a legal company_documents.type value (so the row can be inserted at all)", () => {
    const canonical = new Set<string>(Object.values(DOCUMENT_TYPE));
    expect(canonical.has(DOCUMENT_FIELD_TYPES.additionalName)).toBe(true);
  });

  // Pins the follow-up fix (migration 00044): `additionalName` no longer
  // borrows `photo` as a stand-in label — it has its own honest type,
  // `additional_document`. This asserts against EXPECTED_DOC_TYPES directly
  // (not just DOCUMENT_TYPE) so a future remap back onto ANY scored type —
  // not just the original `proof_of_address` regression — fails the suite.
  it("maps additionalName to the dedicated ADDITIONAL_DOCUMENT type, not a borrowed label", () => {
    expect(DOCUMENT_FIELD_TYPES.additionalName).toBe(DOCUMENT_TYPE.ADDITIONAL_DOCUMENT);
    expect(EXPECTED_DOC_TYPES).not.toContain(DOCUMENT_TYPE.ADDITIONAL_DOCUMENT);
  });
});
