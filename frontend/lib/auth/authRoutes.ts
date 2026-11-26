import type { User } from "@/lib/api/types";
import { roleFlags } from "@/lib/auth/redirect";

/**
 * Single source of truth for every login / signup URL.
 *
 *   Creator    login: /creator/login     signup: /creator/register
 *   Publisher  login: /publisher/login   signup: /publisher/register
 *   Brand      login: /brand/login       signup: /brand/register
 *
 * Extra entry points (kept so old links / shared referral links keep working):
 *   /signup  -> creator signup (referral links use /signup/?ref=CODE)
 *   /login   -> universal login (any account type; Network Members use this)
 */
export type AuthRole = "creator" | "publisher" | "brand";

export const AUTH_ROLES: readonly AuthRole[] = ["creator", "publisher", "brand"];

export const AUTH_ROUTES: Record<
  AuthRole,
  { label: string; login: string; signup: string }
> = {
  creator: { label: "Creator", login: "/creator/login", signup: "/creator/register" },
  publisher: { label: "Publisher", login: "/publisher/login", signup: "/publisher/register" },
  brand: { label: "Brand", login: "/brand/login", signup: "/brand/register" },
};

/** Universal login (any account type). Network Members sign in here. */
export const MEMBER_LOGIN_PATH = "/login";

/** Which login page a user should land on after signing out / losing their session. */
export function loginPathForUser(me?: User | null): string {
  if (!me) return MEMBER_LOGIN_PATH;
  const f = roleFlags(me);
  if (f.isAdmin) return MEMBER_LOGIN_PATH;
  if (f.isPublisher) return AUTH_ROUTES.publisher.login;
  if (f.isNetworkMember) return MEMBER_LOGIN_PATH;
  if (f.isEmployer && !f.isCreator) return AUTH_ROUTES.brand.login;
  if (f.isCreator) return AUTH_ROUTES.creator.login;
  if (f.isEmployer) return AUTH_ROUTES.brand.login;
  return MEMBER_LOGIN_PATH;
}
