"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/auth/supabase/server";

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(
    readCredentials(formData),
  );

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(readCredentials(formData));

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // Depending on the project's email-confirmation setting, the user may need to
  // confirm via email before a session exists. Surface a friendly notice either
  // way; if a session was created, /dashboard will load, otherwise the message
  // tells them to check their inbox.
  redirect(
    `/login?notice=${encodeURIComponent(
      "Account created. If email confirmation is on, check your inbox, then sign in.",
    )}`,
  );
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
