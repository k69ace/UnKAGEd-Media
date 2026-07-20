import Link from "next/link";
import { requireProfile } from "@/lib/auth/profile";
import { signOut } from "../login/actions";
import { ADMIN_ROLES } from "@/lib/auth/profile";

export default async function EstimatorAppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const isAdmin = ADMIN_ROLES.includes(profile.role);

  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col px-6">
      <div className="flex items-center justify-between border-b border-foreground/10 py-4">
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/estimator/pipeline">Pipeline</Link>
          {isAdmin && <Link href="/estimator/settings">Settings</Link>}
        </nav>
        <div className="flex items-center gap-4 text-sm text-foreground/60">
          <span>
            {profile.fullName} · {roleLabel(profile.role)}
          </span>
          <form action={signOut}>
            <button type="submit" className="underline underline-offset-2">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <div className="flex-1 py-8">{children}</div>
    </div>
  );
}

function roleLabel(role: string): string {
  switch (role) {
    case "catering_admin":
      return "Catering Admin";
    case "manager_owner":
      return "Manager/Owner";
    case "sales_manager":
      return "Sales Manager";
    case "chef":
      return "Chef";
    case "reporting_readonly":
      return "Reporting (read-only)";
    default:
      return role;
  }
}
