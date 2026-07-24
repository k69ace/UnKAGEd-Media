import { LoginForm } from "./LoginForm";
import { getInvitePreview } from "@/lib/data/invites";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;
  const invitePreview = invite ? await getInvitePreview(invite) : null;

  return <LoginForm invitePreview={invitePreview} inviteToken={invite ?? null} />;
}
