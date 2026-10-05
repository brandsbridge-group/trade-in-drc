import { describe, expect, it } from "vitest";
import { directoryHref, likePattern, pageCount, pageWindow, parseDirectoryParams } from "./directory";

const SECTOR = "a0000000-0000-0000-0000-000000000002";

describe("parseDirectoryParams", () => {
  it("defaults to an unfiltered first page, most recent first", () => {
    expect(parseDirectoryParams({})).toEqual({ q: "", sector: "", country: "", province: "", premiumOnly: false, sort: "recent", page: 1 });
  });

  it("reads every filter", () => {
    expect(parseDirectoryParams({ q: " kivu ", sector: SECTOR, country: "Angola", province: "Nord-Kivu", tier: "premium", sort: "az", page: "3" })).toEqual({
      q: "kivu",
      sector: SECTOR,
      country: "Angola",
      province: "Nord-Kivu",
      premiumOnly: true,
      sort: "az",
      page: 3,
    });
  });

  it("keeps older links working (region, premium=1)", () => {
    const params = parseDirectoryParams({ region: "Kinshasa", premium: "1" });
    expect(params.province).toBe("Kinshasa");
    expect(params.premiumOnly).toBe(true);
  });

  it("ignores malformed values instead of failing", () => {
    const params = parseDirectoryParams({ sector: "not-a-uuid", sort: "price", page: "-4", q: ["a", "b"] });
    expect(params).toMatchObject({ sector: "", sort: "recent", page: 1, q: "a" });
    expect(parseDirectoryParams({ page: "abc" }).page).toBe(1);
  });
});

describe("likePattern", () => {
  it("searches wildcards literally", () => {
    expect(likePattern("kivu")).toBe("%kivu%");
    expect(likePattern("100%_a\\b")).toBe("%100\\%\\_a\\\\b%");
  });
});

describe("pagination", () => {
  it("counts pages, never fewer than one", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(12)).toBe(1);
    expect(pageCount(13)).toBe(2);
    expect(pageCount(28)).toBe(3);
  });

  it("shows first, last and the neighbours, with gaps", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(1, 10)).toEqual([1, 2, null, 10]);
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageWindow(10, 10)).toEqual([1, null, 9, 10]);
  });
});

describe("directoryHref", () => {
  const base = parseDirectoryParams({});

  it("leaves defaults out", () => {
    expect(directoryHref(base)).toBe("/companies");
    expect(directoryHref(base, { page: 2 })).toBe("/companies?page=2");
  });

  it("carries the filters and applies a patch", () => {
    const params = parseDirectoryParams({ q: "café", sector: SECTOR, tier: "premium", page: "2" });
    expect(directoryHref(params, { page: 1 })).toBe(`/companies?q=caf%C3%A9&sector=${SECTOR}&tier=premium`);
    expect(directoryHref(params, { premiumOnly: false, page: 1, sort: "az" })).toBe(`/companies?q=caf%C3%A9&sector=${SECTOR}&sort=az`);
  });
});
