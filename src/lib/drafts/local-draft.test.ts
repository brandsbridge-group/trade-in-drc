import { beforeEach, describe, expect, it } from "vitest";
import { applyDraft, changedFields, readLocalDraft, writeLocalDraft } from "./local-draft";

const saved = { name: "Kivu Saveurs", city: "Goma", website: "" };

describe("changedFields", () => {
  it("keeps only what the user changed", () => {
    expect(changedFields({ ...saved, city: "Bukavu" }, saved)).toEqual({ city: "Bukavu" });
    expect(changedFields({ ...saved, website: "kivu.cd", name: "" }, saved)).toEqual({ website: "kivu.cd", name: "" });
  });

  it("is null when nothing differs, so the draft is removed", () => {
    expect(changedFields({ ...saved }, saved)).toBeNull();
  });
});

describe("applyDraft", () => {
  it("lays the draft over the saved values, field by field", () => {
    expect(applyDraft(saved, { city: "Bukavu" })).toEqual({ name: "Kivu Saveurs", city: "Bukavu", website: "" });
  });

  it("lets a value changed elsewhere win for fields the draft does not hold", () => {
    const newer = { ...saved, name: "Maison Kivu Saveurs" };
    expect(applyDraft(newer, { city: "Bukavu" }).name).toBe("Maison Kivu Saveurs");
  });

  it("ignores unknown fields, non-strings and malformed drafts", () => {
    expect(applyDraft(saved, { status: "verified", city: 42, name: null })).toEqual(saved);
    expect(applyDraft(saved, null)).toEqual(saved);
    expect(applyDraft(saved, "oops")).toEqual(saved);
  });
});

describe("storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("round-trips a draft and removes it on null", () => {
    writeLocalDraft("k", { city: "Bukavu" });
    expect(readLocalDraft<{ city: string }>("k")).toEqual({ city: "Bukavu" });
    writeLocalDraft("k", null);
    expect(readLocalDraft("k")).toBeNull();
  });

  it("reads broken content as no draft", () => {
    window.localStorage.setItem("k", "{not json");
    expect(readLocalDraft("k")).toBeNull();
    window.localStorage.setItem("k", "42");
    expect(readLocalDraft("k")).toBeNull();
  });
});
