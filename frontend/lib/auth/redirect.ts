import type { User } from "@/lib/api/types";
import { postLoginRedirect } from "@/lib/auth/session";

/** Where a signed-in user lands by default, based on their role. */
export function homePathForUser(me: User): string {
  const roles = me.roles ?? [];
  const isAdmin = roles.some((r) => r.name === "admin");
  const isPublisher =
    roles.some((r) => r.name === "publisher") ||
    (me.publisher_users?.some((m) => m.is_active) ?? false);
  const isNetworkMember = roles.some((r) => r.name === "network_member");
  const isEmployer = roles.some((r) => r.name === "employer");

  if (isAdmin) return "/admin/dashboard";
  if (isPublisher) return "/publisher/dashboard";
  if (isNetworkMember) return "/network/dashboard";
  if (isEmployer && !me.creator) return "/employer/dashboard";
  if (me.creator) return "/creator/dashboard";
  return postLoginRedirect(false);
}
