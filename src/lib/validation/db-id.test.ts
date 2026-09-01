import { describe, it, expect } from "vitest";
import { dbId } from "./db-id";

/**
 * Regression guard for the bug that made every company registration fail with
 * "Some fields are invalid": Zod 4 tightened `z.uuid()` to enforce the RFC-9562
 * version/variant nibbles, which the seeded ids in this database do not carry.
 */
describe("dbId", () => {
  const schema = dbId();

  it("accepts the seeded ids Postgres actually stores", () => {
    // Version nibble is 0 — rejected by z.uuid(), valid in Postgres.
    expect(schema.safeParse("a0000000-0000-0000-0000-000000000001").success).toBe(true);
    expect(schema.safeParse("c0000000-0000-0000-0000-000000000003").success).toBe(true);
  });

  it("accepts ordinary generated uuids", () => {
    expect(schema.safeParse("550e8400-e29b-41d4-a716-446655440000").success).toBe(true);
    expect(schema.safeParse("9150f62a-18e9-4f8f-bf26-5f4571e9752d").success).toBe(true);
  });

  it("is case-insensitive and trims", () => {
    expect(schema.safeParse("A0000000-0000-0000-0000-000000000001").success).toBe(true);
    expect(schema.parse("  a0000000-0000-0000-0000-000000000001  ")).toBe(
      "a0000000-0000-0000-0000-000000000001"
    );
  });

  it("still rejects anything that is not uuid-shaped", () => {
    for (const bad of [
      "",
      "not-a-uuid",
      "a0000000-0000-0000-0000",
      "a0000000-0000-0000-0000-0000000000011",
      "g0000000-0000-0000-0000-000000000001",
      "a0000000_0000_0000_0000_000000000001",
    ]) {
      expect(schema.safeParse(bad).success).toBe(false);
    }
  });
});
