import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

const post = (body: string, headers: Record<string, string> = {}) =>
  POST(new Request("https://www.tradeindrc.net/api/client-errors", { method: "POST", body, headers: { host: "www.tradeindrc.net", ...headers } }));

describe("POST /api/client-errors", () => {
  let log: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    log = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => log.mockRestore());

  it("writes one searchable line with the known fields only", async () => {
    const response = await post(
      JSON.stringify({ reference: "AB12CD34", area: "dashboard", name: "NotFoundError", message: "removeChild", translated: true, secret: "x" }),
      { origin: "https://www.tradeindrc.net" }
    );
    expect(response.status).toBe(204);
    expect(log).toHaveBeenCalledTimes(1);
    const [tag, line] = log.mock.calls[0] as [string, string];
    expect(tag).toBe("[client-error]");
    expect(JSON.parse(line)).toMatchObject({ reference: "AB12CD34", area: "dashboard", name: "NotFoundError", translated: true });
    expect(line).not.toContain("secret");
  });

  it("refuses another site, an oversized body and anything that is not a JSON object", async () => {
    expect((await post("{}", { origin: "https://evil.example" })).status).toBe(403);
    expect((await post(JSON.stringify({ stack: "x".repeat(20_000) }))).status).toBe(413);
    expect((await post("not json")).status).toBe(400);
    expect((await post("[1]")).status).toBe(400);
    expect(log).not.toHaveBeenCalled();
  });
});
