import { requireProfile } from "@/lib/auth/profile";

// Minimal authenticated landing page confirming the auth flow works
// end-to-end. Replaced with the full Pipeline Board (status columns, KPI
// cards, filters) in a later stage — see task #6 in the project checklist.
export default async function PipelinePage() {
  const profile = await requireProfile();

  return (
    <div>
      <h1 className="text-xl font-semibold">Pipeline</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Signed in as {profile.fullName} ({profile.email}), role {profile.role}.
      </p>
      <p className="mt-4 text-sm text-foreground/60">
        The full pipeline board (status columns, KPI cards, filters) is under construction.
      </p>
    </div>
  );
}
