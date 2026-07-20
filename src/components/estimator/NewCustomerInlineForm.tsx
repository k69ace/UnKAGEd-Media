"use client";

import { createCustomerAndEstimate } from "@/app/estimator/(app)/estimates/actions";

export function NewCustomerInlineForm() {
  return (
    <form action={createCustomerAndEstimate} className="mt-3 flex flex-col gap-3 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Customer / contact name" name="name" required />
        <TextField label="Company (optional)" name="companyName" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Contact first name" name="contactFirstName" />
        <TextField label="Contact last name" name="contactLastName" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Contact email" name="contactEmail" type="email" />
        <TextField label="Contact phone" name="contactPhone" type="tel" />
      </div>
      <button type="submit" className="mt-2 self-start rounded-md bg-foreground px-4 py-2 font-medium text-background">
        Create customer &amp; start estimate
      </button>
    </form>
  );
}

function TextField({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-foreground/70">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="rounded-md border border-foreground/15 bg-transparent px-3 py-2 outline-none focus:border-foreground/40"
      />
    </label>
  );
}
