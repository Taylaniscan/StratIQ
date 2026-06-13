"use server";

import { redirect } from "next/navigation";

import { onboardingInputSchema } from "@/lib/adaptivity/profile";
import { requireAuthUser } from "@/lib/auth/session";
import { provisionTenantWorkspace } from "@/lib/domain/onboarding";

export type OnboardingResult = { ok: false; error: string };

/**
 * Complete onboarding: validate the wizard payload at the server boundary, then
 * provision the tenant + first workspace and redirect to the dashboard. Returns
 * an error object only on validation failure (success redirects).
 */
export async function completeOnboarding(
  raw: unknown,
): Promise<OnboardingResult> {
  const user = await requireAuthUser();

  const parsed = onboardingInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please complete all fields before continuing." };
  }

  await provisionTenantWorkspace({
    authUserId: user.id,
    email: user.email ?? "",
    input: parsed.data,
  });

  redirect("/dashboard");
}
