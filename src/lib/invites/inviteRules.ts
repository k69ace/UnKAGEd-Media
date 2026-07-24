export interface InviteUsabilityInput {
  accepted_at: string | null;
  revoked_at: string | null;
  expires_at: string;
}

/** Pure so both the pre-auth preview and the signup-time re-check share one definition of "still good." */
export function isInviteUsable(invite: InviteUsabilityInput, now: Date = new Date()): boolean {
  if (invite.accepted_at !== null) return false;
  if (invite.revoked_at !== null) return false;
  return new Date(invite.expires_at).getTime() > now.getTime();
}

/** An invite with no email set is an open link -- anyone holding it may sign up with it. */
export function inviteEmailMatches(inviteEmail: string | null, signupEmail: string): boolean {
  if (inviteEmail === null) return true;
  return inviteEmail.trim().toLowerCase() === signupEmail.trim().toLowerCase();
}
