import { requireProfile } from "@/lib/auth/profile";
import { listCustomers } from "@/lib/data/catering";
import { createEstimate } from "../actions";
import { NewCustomerInlineForm } from "@/components/estimator/NewCustomerInlineForm";

export default async function NewEstimatePage() {
  const profile = await requireProfile();
  const customers = await listCustomers(profile.organizationId);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold">Start a new estimate</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Pick an existing customer, or add a new one, to begin building the estimate.
      </p>

      {customers.length > 0 && (
        <form action={createEstimate} className="mt-6 flex flex-col gap-3 rounded-lg border border-foreground/10 p-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Existing customer</span>
            <select
              name="customerId"
              required
              className="rounded-md border border-foreground/15 bg-transparent px-3 py-2"
            >
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company_name ? ` — ${c.company_name}` : ""}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="mt-2 self-start rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background">
            Start estimate
          </button>
        </form>
      )}

      <div className="mt-6 rounded-lg border border-foreground/10 p-4">
        <h2 className="text-sm font-medium">New customer</h2>
        <NewCustomerInlineForm />
      </div>
    </div>
  );
}
