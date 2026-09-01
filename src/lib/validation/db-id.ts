import { z } from "zod";

/**
 * Shape-only UUID pattern — 8-4-4-4-12 hex, no version/variant constraint.
 */
const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validator for a Postgres `uuid` primary/foreign key coming from a form.
 *
 * Do NOT use `z.string().uuid()` here: Zod 4 tightened it to enforce the
 * RFC-9562 version and variant nibbles, and this database is full of seeded
 * ids like `a0000000-0000-0000-0000-000000000001` whose version nibble is `0`.
 * Postgres accepts them happily, so every form posting a seeded sector,
 * category or company id was being rejected as "invalid" before it ever
 * reached the database. Match the shape Postgres actually stores instead.
 */
export const dbId = () => z.string().trim().regex(UUID_SHAPE, "Invalid identifier");
