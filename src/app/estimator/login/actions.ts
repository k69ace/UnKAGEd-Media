"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateInviteForSignup } from "@/lib/data/invites";

export interface AuthActionState {
  error: string | null;
  message: string | null;
}

export async function signIn(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message, message: null };

  redirect("/estimator/pipeline");
}

export async function signUp(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");
  const organizationName = String(formData.get("organizationName") ?? "");
  const inviteToken = String(formData.get("inviteToken") ?? "").trim() || null;

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", message: null };
  }

  if (inviteToken) {
    const validation = await validateInviteForSignup(inviteToken, email);
    if (!validation.valid) return { error: validation.error, message: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        organization_name: organizationName || undefined,
        invite_token: inviteToken || undefined,
      },
    },
  });
  if (error) return { error: error.message, message: null };

  // With email confirmation enabled (the Supabase project default), signUp
  // succeeds but returns no session until the user clicks the confirmation
  // link — there's nothing to redirect into yet.
  if (!data.session) {
    return {
      error: null,
      message: "Account created. Check your email to confirm your address before signing in.",
    };
  }

  redirect("/estimator/pipeline");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/estimator/login");
}
