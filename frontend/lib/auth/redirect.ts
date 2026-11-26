import type { User } from "@/lib/api/types";
import { postLoginRedirect } from "@/lib/auth/session";
import { ONBOARDING_PATHS, isOnboardingPending } from "@/lib/auth/onboardingFlag";

/** Admin console on this site (not a separate admin.joborio.com host). */
export const ADMIN_HOME_PATH = "/admin/dashboard";

/** Which account types this user has. One user can have more than one. */
export function roleFlags(me: User) {
  const roles = me.roles ?? [];
  const has = (name: string) => roles.some((r) => r.name === name);
  return {
    isAdmin: has("admin"),
    isPublisher:
      has("publisher") || (me.publisher_users?.some((m) => m.is_active) ?? false),
    isNetworkMember: has("network_member"),
    isEmployer: has("employer"),
    isCreator: !!me.creator,
  };
}

/** Fresh account: no creator profile, no employer, no publisher, nothing yet. */
export function hasNoRole(me: User): boolean {
  const f = roleFlags(me);
  return !(f.isAdmin || f.isPublisher || f.isNetworkMember || f.isEmployer || f.isCreator);
}

/**
 * Where a signed-in user lands, based on their account type:
 *   admin          -> /admin/dashboard
 *   publisher      -> /publisher/dashboard   (/publisher/onboarding until finished)
 *   network member -> /network/dashboard     (/network/onboarding until finished)
 *   brand/employer -> /employer/dashboard    (/brand/onboarding until finished)
 *   creator        -> /creator/dashboard
 *   nothing yet    -> /onboarding (creator onboarding)
 * `prefer: "employer"` is for the brand login page: a user who is both a
 * creator and a brand lands on the brand dashboard there.
 */
export function homePathForUser(
  me: User,
  opts?: { prefer?: "employer" },
): string {
  const f = roleFlags(me);
  if (f.isAdmin) return ADMIN_HOME_PATH;
  // A freshly registered brand / publisher / network member finishes their own
  // onboarding first (the flag is set by their register form).
  if (f.isPublisher) {
    return isOnboardingPending(me.id, "publisher")
      ? ONBOARDING_PATHS.publisher
      : "/publisher/dashboard";
  }
  if (f.isNetworkMember) {
    return isOnboardingPending(me.id, "network")
      ? ONBOARDING_PATHS.network
      : "/network/dashboard";
  }
  if (f.isCreator && isOnboardingPending(me.id, "creator") && opts?.prefer !== "employer") {
    return ONBOARDING_PATHS.creator;
  }
  if (f.isEmployer && (opts?.prefer === "employer" || !f.isCreator)) {
    return isOnboardingPending(me.id, "employer")
      ? ONBOARDING_PATHS.employer
      : "/employer/dashboard";
  }
  if (f.isCreator) {
    return isOnboardingPending(me.id, "creator")
      ? ONBOARDING_PATHS.creator
      : "/creator/dashboard";
  }
  return postLoginRedirect(false);
}

/** May this user open `path`? Used so `?next=` can never land on the wrong account's area. */
export function canVisit(path: string, me: User): boolean {
  const f = roleFlags(me);
  const p = path.split(/[?#]/)[0];
  if (p.startsWith("/admin")) return f.isAdmin;
  if (p.startsWith("/publisher")) return f.isPublisher;
  if (p.startsWith("/network")) return f.isNetworkMember;
  if (p.startsWith("/creator")) return f.isCreator;
  if (p.startsWith("/employer/onboarding")) {
    return !(f.isEmployer || f.isAdmin || f.isPublisher || f.isNetworkMember);
  }
  if (p.startsWith("/employer")) return f.isEmployer;
  if (p.startsWith("/onboarding")) {
    return hasNoRole(me) || isOnboardingPending(me.id, "creator");
  }
  return true;
}

/** Client-side navigation that also works for absolute URLs (admin app). */
export function navigateTo(router: { replace: (path: string) => void }, path: string) {
  if (/^https?:\/\//i.test(path)) {
    window.location.href = path;
  } else {
    router.replace(path);
  }
}
