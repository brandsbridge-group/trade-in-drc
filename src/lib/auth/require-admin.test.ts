import { describe, it, expect, vi, beforeEach } from "vitest";

const { redirectMock, getUserMock, fromMock } = vi.hoisted(() => {
  const redirectMock = vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  });
  const getUserMock = vi.fn();
  const fromMock = vi.fn();
  return { redirectMock, getUserMock, fromMock };
});

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

vi.mock("@/lib/supabase/server", () => ({
  // Real export name is createServerSupabaseClient (async)
  createServerSupabaseClient: async () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  }),
}));

import { requireAdmin } from "./require-admin";

function setupProfile(role: string | null) {
  fromMock.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: role ? { role } : null, error: null }),
      }),
    }),
  });
}

describe("requireAdmin", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    getUserMock.mockReset();
    fromMock.mockReset();
  });

  it("redirects to /login when no user", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    await expect(requireAdmin("en")).rejects.toThrow("REDIRECT:/en/login?next=/admin");
  });

  it("redirects to / when user is not admin", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    setupProfile("user");
    await expect(requireAdmin("fr")).rejects.toThrow("REDIRECT:/fr?error=not_authorized");
  });

  it("returns user when role is admin", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    setupProfile("admin");
    const result = await requireAdmin("en");
    expect(result.id).toBe("u1");
  });
});
