"use server";

import { z } from "zod";
import { dbId } from "@/lib/validation/db-id";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  STAFF_ROLE,
  LEGACY_ROLE,
  ACCOUNT_TYPE,
  resolveRole,
  type AppRole,
  type LegacyRole,
} from "@/constants/roles";
import type { StaffRole, AccountType, Json } from "@/lib/supabase/types";

/**
 * Admin user-management server actions (cluster C4).
 *
 * Why service-role: `profiles` has NO email column — email lives in
 * `auth.users`, which only the service-role key can read/list. Account
 * suspension (ban) is an Auth-admin operation, also service-role only.
 * The service-role client is constructed and used EXCLUSIVELY here, on the
 * server, and never leaves this module. Every action re-verifies the caller is
 * an admin via `requireAdmin` before touching anything, and writes an
 * `audit_log` row for the moderation trail (00015).
 *
 * RLS note: `requireAdmin` runs against the request-scoped server client
 * (honours RLS + session). Only after that gate passes do we reach for the
 * service-role client for the privileged read/write.
 */

const ADMIN_ENTITY = "profiles" as const;
const PAGE_SIZE = 100;
const MAX_PAGES = 50;
// Supabase Auth ban duration: a long fixed window = "suspended". "none" lifts it.
const SUSPEND_BAN_DURATION = "876000h"; // ~100 years
const REACTIVATE_BAN_DURATION = "none";

export interface AdminUserRow {
  id: string;
  email: string | null;
  fullName: string | null;
  legacyRole: LegacyRole;
  staffRole: StaffRole | null;
  accountType: AccountType | null;
  appRole: AppRole;
  companyCount: number;
  suspended: boolean;
  createdAt: string;
}

export interface AdminAuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string | null;
  actorEmail: string | null;
  createdAt: string;
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * The role value the UI may assign. Staff roles map to `staff_role`; the two
 * business types map to `account_type`. "user" clears both (plain account).
 */
const ASSIGNABLE_ROLES = [
  STAFF_ROLE.SUPER_ADMIN,
  STAFF_ROLE.MODERATOR,
  ACCOUNT_TYPE.CONGOLESE_COMPANY,
  ACCOUNT_TYPE.INTERNATIONAL_BUSINESS,
  "user",
] as const;

const setRoleSchema = z.object({
  userId: dbId(),
  role: z.enum(ASSIGNABLE_ROLES),
});

const userIdSchema = z.object({
  userId: dbId(),
});

/**
 * Resolve the authenticated admin's profile id for audit attribution.
 * `requireAdmin` already redirects unauthorized callers, so reaching here
 * guarantees an admin; we still capture the id explicitly.
 */
async function getActorId(locale: string): Promise<string> {
  const actor = await requireAdmin(locale);
  return actor.id;
}

async function writeAudit(params: {
  actorId: string;
  action: string;
  entityId: string;
  summary: string;
  metadata?: Json;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_log").insert({
    actor_id: params.actorId,
    action: params.action,
    entity_type: ADMIN_ENTITY,
    entity_id: params.entityId,
    summary: params.summary,
    metadata: params.metadata ?? {},
  });
  if (error) {
    throw new Error(`Audit write failed: ${error.message}`);
  }
}

/**
 * List every user: join `profiles` (role columns + company count) with
 * `auth.users` (email + ban state). Sorted newest profile first.
 */
export async function listUsers(locale: string): Promise<AdminUserRow[]> {
  await requireAdmin(locale);
  const admin = createAdminClient();

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, role, full_name, staff_role, account_type, created_at, companies(id)")
    .order("created_at", { ascending: false });

  if (profilesError) {
    throw new Error(`Failed to load profiles: ${profilesError.message}`);
  }

  // Page through auth.users to build an id -> {email, suspended} map.
  const authIndex = new Map<string, { email: string | null; suspended: boolean }>();
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });
    if (error) {
      throw new Error(`Failed to load auth users: ${error.message}`);
    }
    const users = data?.users ?? [];
    for (const u of users) {
      const bannedUntil = (u as { banned_until?: string | null }).banned_until;
      authIndex.set(u.id, {
        email: u.email ?? null,
        suspended: Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now()),
      });
    }
    if (users.length < PAGE_SIZE) break;
  }

  return (profiles ?? []).map((p) => {
    const auth = authIndex.get(p.id);
    const roleProfile = {
      account_type: p.account_type,
      staff_role: p.staff_role,
      role: p.role,
    };
    return {
      id: p.id,
      email: auth?.email ?? null,
      fullName: p.full_name,
      legacyRole: p.role,
      staffRole: p.staff_role,
      accountType: p.account_type,
      appRole: resolveRole(roleProfile),
      companyCount: Array.isArray(p.companies) ? p.companies.length : 0,
      suspended: auth?.suspended ?? false,
      createdAt: p.created_at,
    };
  });
}

/** Recent audit-trail rows scoped to user/profile moderation, newest first. */
export async function listUserAudit(
  locale: string,
  limit = 25
): Promise<AdminAuditRow[]> {
  await requireAdmin(locale);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("audit_log")
    .select("id, action, entity_type, entity_id, summary, created_at, actor_id")
    .eq("entity_type", ADMIN_ENTITY)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load audit log: ${error.message}`);
  }

  const rows = data ?? [];
  const actorIds = Array.from(
    new Set(rows.map((r) => r.actor_id).filter((id): id is string => Boolean(id)))
  );

  const actorEmails = new Map<string, string | null>();
  await Promise.all(
    actorIds.map(async (id) => {
      const { data: actor } = await admin.auth.admin.getUserById(id);
      actorEmails.set(id, actor?.user?.email ?? null);
    })
  );

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    summary: r.summary,
    actorEmail: r.actor_id ? actorEmails.get(r.actor_id) ?? null : null,
    createdAt: r.created_at,
  }));
}

/**
 * Assign a user's role. Staff roles set `staff_role` (and legacy `role`);
 * business types set `account_type`; "user" clears staff + keeps account_type
 * untouched only when not previously staff. Writes an audit row.
 */
export async function setUserRole(
  locale: string,
  input: { userId: string; role: (typeof ASSIGNABLE_ROLES)[number] }
): Promise<ActionResult> {
  const parsed = setRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { userId, role } = parsed.data;
  const actorId = await getActorId(locale);
  const admin = createAdminClient();

  // Build the column update for the chosen role.
  let update: {
    staff_role: StaffRole | null;
    account_type?: AccountType | null;
    role: LegacyRole;
  };

  if (role === STAFF_ROLE.SUPER_ADMIN || role === STAFF_ROLE.MODERATOR) {
    update = {
      staff_role: role,
      account_type: null,
      role: LEGACY_ROLE.ADMIN,
    };
  } else if (
    role === ACCOUNT_TYPE.CONGOLESE_COMPANY ||
    role === ACCOUNT_TYPE.INTERNATIONAL_BUSINESS
  ) {
    update = {
      staff_role: null,
      account_type: role,
      role: LEGACY_ROLE.USER,
    };
  } else {
    // Plain user: clear staff privilege and business classification.
    update = {
      staff_role: null,
      account_type: null,
      role: LEGACY_ROLE.USER,
    };
  }

  const { error } = await admin.from("profiles").update(update).eq("id", userId);
  if (error) {
    return { ok: false, error: error.message };
  }

  await writeAudit({
    actorId,
    action: "user.role.change",
    entityId: userId,
    summary: `Role set to ${role}`,
    metadata: { role },
  });

  revalidatePath(`/${locale}/admin/users`);
  return { ok: true };
}

/** Suspend (ban) a user's auth account so they cannot sign in. Audited. */
export async function suspendUser(
  locale: string,
  input: { userId: string }
): Promise<ActionResult> {
  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const actorId = await getActorId(locale);
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    ban_duration: SUSPEND_BAN_DURATION,
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  await writeAudit({
    actorId,
    action: "user.suspend",
    entityId: parsed.data.userId,
    summary: "Account suspended",
  });

  revalidatePath(`/${locale}/admin/users`);
  return { ok: true };
}

/** Lift a suspension (unban) so the user can sign in again. Audited. */
export async function reactivateUser(
  locale: string,
  input: { userId: string }
): Promise<ActionResult> {
  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const actorId = await getActorId(locale);
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    ban_duration: REACTIVATE_BAN_DURATION,
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  await writeAudit({
    actorId,
    action: "user.reactivate",
    entityId: parsed.data.userId,
    summary: "Account reactivated",
  });

  revalidatePath(`/${locale}/admin/users`);
  return { ok: true };
}
