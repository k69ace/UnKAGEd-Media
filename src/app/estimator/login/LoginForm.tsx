"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthActionState } from "./actions";
import type { InvitePreview } from "@/lib/data/invites";

const ROLE_LABELS: Record<string, string> = {
  sales_manager: "Sales Manager",
  chef: "Chef",
  catering_admin: "Catering Admin",
  manager_owner: "Manager/Owner",
  reporting_readonly: "Reporting (read-only)",
};

const initialState: AuthActionState = { error: null, message: null };

export function LoginForm({ invitePreview, inviteToken }: { invitePreview: InvitePreview | null; inviteToken: string | null }) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">(invitePreview ? "sign-up" : "sign-in");
  const [signInState, signInAction, signInPending] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialState);

  const invalidInvite = inviteToken !== null && invitePreview === null;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold">Catering Estimator</h1>
      <p className="mt-1 text-sm text-foreground/60">
        {invitePreview
          ? `You've been invited to join ${invitePreview.organizationName} as ${ROLE_LABELS[invitePreview.role] ?? invitePreview.role}.`
          : mode === "sign-in"
            ? "Sign in to your organization."
            : "Create a new organization."}
      </p>
      {invalidInvite && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          This invite link isn&apos;t valid or has expired. Ask your admin for a new one, or sign in/create an
          organization below.
        </p>
      )}

      {!invitePreview && (
        <div className="mt-6 flex gap-4 border-b border-foreground/10 text-sm">
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`-mb-px border-b-2 pb-2 ${mode === "sign-in" ? "border-foreground font-medium" : "border-transparent text-foreground/50"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={`-mb-px border-b-2 pb-2 ${mode === "sign-up" ? "border-foreground font-medium" : "border-transparent text-foreground/50"}`}
          >
            Create organization
          </button>
        </div>
      )}

      {mode === "sign-in" ? (
        <form action={signInAction} className="mt-6 flex flex-col gap-4">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          {signInState.error && <ErrorText>{signInState.error}</ErrorText>}
          <SubmitButton pending={signInPending}>Sign in</SubmitButton>
        </form>
      ) : (
        <form action={signUpAction} className="mt-6 flex flex-col gap-4">
          {invitePreview && <input type="hidden" name="inviteToken" value={inviteToken ?? ""} />}
          <Field label="Your name" name="fullName" type="text" autoComplete="name" required />
          {!invitePreview && <Field label="Organization name" name="organizationName" type="text" required />}
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={invitePreview?.email ?? undefined}
          />
          <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          {signUpState.error && <ErrorText>{signUpState.error}</ErrorText>}
          {signUpState.message && <InfoText>{signUpState.message}</InfoText>}
          <SubmitButton pending={signUpPending}>{invitePreview ? "Join organization" : "Create organization"}</SubmitButton>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
  minLength,
  defaultValue,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        defaultValue={defaultValue}
        className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
      />
    </label>
  );
}

function ErrorText({ children }: { children: string }) {
  return (
    <p className="text-sm text-red-500" role="alert">
      {children}
    </p>
  );
}

function InfoText({ children }: { children: string }) {
  return (
    <p className="text-sm text-foreground/70" role="status">
      {children}
    </p>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
