/**
 * Tracks "this account was just created and still has to finish its onboarding".
 *
 * The backend can give an account a creator profile / role the moment it is
 * registered, so "has no role" is not a reliable sign of a new account. The flag
 * (set by the register forms) is what keeps a new account in its own onboarding
 * until it is finished or skipped. It is stored per user id, so another login on the same
 * browser never sees it.
 */
export type OnboardingRole = "creator" | "employer" | "publisher" | "network";

export const ONBOARDING_PATHS: Record<OnboardingRole, string> = {
  creator: "/onboarding",
  employer: "/brand/onboarding",
  publisher: "/publisher/onboarding",
  network: "/network/onboarding",
};

const key = (userId: number, role: OnboardingRole) =>
  `joborio_onboarding_pending:${userId}:${role}`;

export function markOnboardingPending(userId: number, role: OnboardingRole): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key(userId, role), "1");
  } catch {
    /* storage blocked: the user simply lands on the dashboard */
  }
}

export function isOnboardingPending(userId: number, role: OnboardingRole): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(key(userId, role)) === "1";
  } catch {
    return false;
  }
}

export function clearOnboardingPending(userId: number, role: OnboardingRole): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key(userId, role));
  } catch {
    /* ignore */
  }
}
