"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthActionState } from "./actions";

const initialState: AuthActionState = { error: null, message: null };

export default function LoginPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [signInState, signInAction, signInPending] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialState);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold">Catering Estimator</h1>
      <p className="mt-1 text-sm text-foreground/60">
        {mode === "sign-in" ? "Sign in to your organization." : "Create a new organization."}
      </p>

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

      {mode === "sign-in" ? (
        <form action={signInAction} className="mt-6 flex flex-col gap-4">
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          {signInState.error && <ErrorText>{signInState.error}</ErrorText>}
          <SubmitButton pending={signInPending}>Sign in</SubmitButton>
        </form>
      ) : (
        <form action={signUpAction} className="mt-6 flex flex-col gap-4">
          <Field label="Your name" name="fullName" type="text" autoComplete="name" required />
          <Field label="Organization name" name="organizationName" type="text" required />
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          {signUpState.error && <ErrorText>{signUpState.error}</ErrorText>}
          {signUpState.message && <InfoText>{signUpState.message}</InfoText>}
          <SubmitButton pending={signUpPending}>Create organization</SubmitButton>
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
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
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
        className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
      />
    </label>
  );
}

function ErrorText({ children }: { children: string }) {
  return <p className="text-sm text-red-500" role="alert">{children}</p>;
}

function InfoText({ children }: { children: string }) {
  return <p className="text-sm text-foreground/70" role="status">{children}</p>;
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
