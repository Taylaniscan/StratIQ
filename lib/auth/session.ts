import { redirect } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { createClient } from "@/lib/auth/supabase/server";
import { adminPrisma } from "@/lib/db/admin";

/**
 * Server-side session helpers. The authenticated identity comes from Supabase;
 * the tenant + role linkage comes from our own User/Membership tables and is
 * resolved with the admin client (a cross-tenant, system-level lookup that must
 * not itself be tenant-scoped).
 */

/** The current Supabase auth user, or null if not signed in. */
export async function getAuthUser(): Promise<SupabaseUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Require an authenticated user; redirect to /login otherwise. */
export async function requireAuthUser(): Promise<SupabaseUser> {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * All memberships (with tenant) for a Supabase auth user. Empty until the user
 * has been linked to an app User + Membership (onboarding, a later task).
 */
export async function getMemberships(authUserId: string) {
  const appUser = await adminPrisma.user.findUnique({
    where: { authUserId },
    include: { memberships: { include: { tenant: true } } },
  });
  return appUser?.memberships ?? [];
}

/**
 * Resolve the membership for a given tenant (or the sole membership if the user
 * belongs to exactly one tenant). Returns null when it can't be determined.
 */
export async function getActiveMembership(authUserId: string, tenantId?: string) {
  const memberships = await getMemberships(authUserId);
  if (tenantId) return memberships.find((m) => m.tenantId === tenantId) ?? null;
  return memberships.length === 1 ? memberships[0] : null;
}
