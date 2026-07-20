"use client";

import { useActionState, useRef } from "react";

export interface SectionState {
  error?: string;
}

/**
 * Wraps a form section with autosave-on-blur: any blur inside the form
 * triggers a submit of the whole section (satisfies "autosave every
 * section on change/blur" without per-keystroke debouncing). Shows a
 * small live-region status (Saving… / Saved / error) so a save failure is
 * never silent.
 */
export function AutosaveSection({
  action,
  initialState,
  title,
  description,
  children,
  disabled,
}: {
  action: (prevState: SectionState, formData: FormData) => Promise<SectionState>;
  initialState: SectionState;
  title: string;
  description?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <section className="border-b border-foreground/10 py-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-foreground/60">{description}</p>}
      <form
        ref={formRef}
        action={formAction}
        onBlur={(e) => {
          if (disabled) return;
          if (formRef.current?.contains(e.target)) {
            formRef.current.requestSubmit();
          }
        }}
        className="mt-4 flex flex-col gap-4"
        inert={disabled}
      >
        <fieldset disabled={disabled} className="contents">
          {children}
        </fieldset>
        <div aria-live="polite" className="text-xs">
          {pending ? (
            <span className="text-foreground/50">Saving…</span>
          ) : state.error ? (
            <span className="text-red-500" role="alert">
              {state.error}
            </span>
          ) : (
            <span className="text-foreground/30">Saved</span>
          )}
        </div>
      </form>
    </section>
  );
}
