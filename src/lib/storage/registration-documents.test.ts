import { describe, it, expect } from "vitest";
import {
  ACCEPTED_REGISTRATION_DOCUMENT_MIME_TYPES,
  MAX_REGISTRATION_DOCUMENT_BYTES,
  buildRegistrationDocumentPath,
  validateRegistrationDocument,
} from "./registration-documents";

describe("validateRegistrationDocument", () => {
  it.each(ACCEPTED_REGISTRATION_DOCUMENT_MIME_TYPES)(
    "accepts %s at exactly the size ceiling",
    (type) => {
      const result = validateRegistrationDocument({
        type,
        size: MAX_REGISTRATION_DOCUMENT_BYTES,
      });
      expect(result).toEqual({ ok: true });
    }
  );

  it("rejects a MIME type outside the accepted list", () => {
    const result = validateRegistrationDocument({
      type: "application/zip",
      size: 1024,
    });
    expect(result).toEqual({ ok: false, reason: "type" });
  });

  it("rejects an empty/unknown MIME type (e.g. an extensionless drag-drop file)", () => {
    const result = validateRegistrationDocument({ type: "", size: 1024 });
    expect(result).toEqual({ ok: false, reason: "type" });
  });

  it("rejects a file one byte over the ceiling", () => {
    const result = validateRegistrationDocument({
      type: "application/pdf",
      size: MAX_REGISTRATION_DOCUMENT_BYTES + 1,
    });
    expect(result).toEqual({ ok: false, reason: "size" });
  });

  it("checks type before size — an oversized file of the wrong type still reports 'type'", () => {
    const result = validateRegistrationDocument({
      type: "video/mp4",
      size: MAX_REGISTRATION_DOCUMENT_BYTES * 10,
    });
    expect(result).toEqual({ ok: false, reason: "type" });
  });

  it("accepts a small, well-formed PDF", () => {
    const result = validateRegistrationDocument({
      type: "application/pdf",
      size: 200_000,
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("buildRegistrationDocumentPath", () => {
  const companyId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
  const now = 1735689000000;

  it("keys on the company id as the FIRST path segment (required by the owner-path RLS policy)", () => {
    const path = buildRegistrationDocumentPath(companyId, "business_license", "RCCM.pdf", now);
    expect(path.split("/")[0]).toBe(companyId);
  });

  it("embeds the document type and a deterministic timestamp for a given `now`", () => {
    const path = buildRegistrationDocumentPath(companyId, "tax_registration", "NIF Certificate.PDF", now);
    expect(path).toBe(`${companyId}/tax_registration-${now}-nif-certificate.pdf`);
  });

  it("slugifies accented and punctuated file names", () => {
    const path = buildRegistrationDocumentPath(companyId, "logo", "Société Générale (2026).png", now);
    expect(path).toBe(`${companyId}/logo-${now}-societe-generale-2026.png`);
  });

  it("falls back to a 'bin' extension when the file name has none", () => {
    const path = buildRegistrationDocumentPath(companyId, "proof_of_address", "document", now);
    expect(path).toBe(`${companyId}/proof_of_address-${now}-document.bin`);
  });

  it("falls back to 'file' as the base name when slugify strips everything (e.g. only punctuation)", () => {
    const path = buildRegistrationDocumentPath(companyId, "logo", "!!!.png", now);
    expect(path).toBe(`${companyId}/logo-${now}-file.png`);
  });

  it("produces distinct paths for the same file name at two different timestamps (no upsert collision)", () => {
    const first = buildRegistrationDocumentPath(companyId, "business_license", "RCCM.pdf", now);
    const second = buildRegistrationDocumentPath(companyId, "business_license", "RCCM.pdf", now + 1);
    expect(first).not.toBe(second);
  });

  it("lowercases the extension so .PDF and .pdf resolve to the same content type expectations", () => {
    const path = buildRegistrationDocumentPath(companyId, "business_license", "cert.PDF", now);
    expect(path.endsWith(".pdf")).toBe(true);
  });
});
