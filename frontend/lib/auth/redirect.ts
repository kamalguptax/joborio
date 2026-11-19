import type { User } from "@/lib/api/types";
import { postLoginRedirect } from "@/lib/auth/session";
import { ADMIN_LOGIN_URL } from "@/lib/siteUrls";

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
 *   admin          -> admin app (separate site)
 *   publisher      -> /publisher/dashboard
 *   network member -> /network/dashboard
 *   brand/employer -> /employer/dashboard
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
  if (f.isAdmin) return ADMIN_LOGIN_URL;
  if (f.isPublisher) return "/publisher/dashboard";
  if (f.isNetworkMember) return "/network/dashboard";
  if (f.isEmployer && (opts?.prefer === "employer" || !f.isCreator)) {
    return "/employer/dashboard";
  }
  if (f.isCreator) return "/creator/dashboard";
  return postLoginRedirect(false);
}

/** May this user open `path`? Used so `?next=` can never land on the wrong account's area. */
export function canVisit(path: string, me: User): boolean {
  const f = roleFlags(me);
  const p = path.split(/[?#]/)[0];
  if (p.startsWith("/admin")) return false; // admin is a separate app
  if (p.startsWith("/publisher")) return f.isPublisher;
  if (p.startsWith("/network")) return f.isNetworkMember;
  if (p.startsWith("/creator")) return f.isCreator;
  if (p.startsWith("/employer/onboarding")) {
    return !(f.isEmployer || f.isAdmin || f.isPublisher || f.isNetworkMember);
  }
  if (p.startsWith("/employer")) return f.isEmployer;
  if (p.startsWith("/onboarding")) return hasNoRole(me);
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
