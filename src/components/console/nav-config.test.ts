import { describe, expect, it } from "vitest";
import { ROUTES } from "@/constants/routes";
import { activeConsoleItem, visibleConsoleNav } from "./nav-config";

const hrefs = (isSuperAdmin: boolean) => visibleConsoleNav(isSuperAdmin).flatMap((group) => group.items.map((item) => item.href));

describe("console navigation", () => {
  it("has no sidebar entry for the newsletter: it is a tab of Content", () => {
    expect(hrefs(true)).not.toContain(ROUTES.CONSOLE_NEWSLETTER);
  });

  it("keeps Content lit on every newsletter page", () => {
    for (const path of [ROUTES.CONSOLE_NEWSLETTER, `${ROUTES.CONSOLE_NEWSLETTER}/new`, `${ROUTES.CONSOLE_NEWSLETTER}/some-id`]) {
      expect(activeConsoleItem(path)?.href).toBe("/console/content");
    }
    expect(activeConsoleItem("/console/content/news")?.href).toBe("/console/content");
  });

  it("still picks the longest matching section", () => {
    expect(activeConsoleItem("/console/requests/premium")?.href).toBe("/console/requests/premium");
    expect(activeConsoleItem("/console/requests")?.href).toBe("/console/requests");
    expect(activeConsoleItem("/console")?.href).toBe("/console");
  });

  it("hides super-admin sections from moderators but keeps Content", () => {
    expect(hrefs(false)).toContain("/console/content");
    expect(hrefs(false)).not.toContain(ROUTES.CONSOLE_USERS);
    expect(hrefs(true)).toContain(ROUTES.CONSOLE_USERS);
  });
});
