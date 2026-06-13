import { redirect } from "next/navigation";

import { getMemberships, requireAuthUser } from "@/lib/auth/session";

import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const user = await requireAuthUser();

  // Already onboarded? Go straight to the dashboard.
  const memberships = await getMemberships(user.id);
  if (memberships.length > 0) {
    redirect("/dashboard");
  }

  return <OnboardingWizard />;
}
