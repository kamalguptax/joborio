import type { User } from "@/lib/api/types";
import { logoutApi } from "@/lib/api/auth";
import { clearAuthToken } from "@/lib/auth/session";
import { clearCachedUser } from "@/lib/auth/userCache";
import {
  hasLoginRole,
  wrongLoginMessage,
  type LoginRole,
} from "@/lib/auth/redirect";

/** Set by the Google / LinkedIn buttons so /auth/callback knows which login page was used. */
export const OAUTH_ROLE_KEY = "joborio_oauth_login_role";

export type WrongRoleError = {
  message: string;
  linkLabel: string;
  linkHref: string;
};

/**
 * Role-specific login pages (creator / brand / publisher) only accept their own
 * account type. Returns null when the user may stay signed in; otherwise it
 * drops the session that was just created and returns what to show the user.
 */
export async function rejectWrongRole(
  me: User,
  role: LoginRole,
): Promise<WrongRoleError | null> {
  if (hasLoginRole(me, role)) return null;
  try {
    await logoutApi(); // revoke the token the server just issued
  } catch {
    /* ignore: the local session is dropped below either way */
  }
  clearAuthToken();
  clearCachedUser();
  return wrongLoginMessage(me, role);
}

const LOGIN_PAGE_LABEL: Record<string, string> = {
  "/creator/login": "Creator login",
  "/brand/login": "Brand login",
  "/publisher/login": "Publisher login",
};

/** Turns the server's ROLE_MISMATCH answer (or OAuth `wrong_role`) into the message + link we show. */
export function wrongRoleFromServer(
  message: string,
  usePath?: string | null,
): WrongRoleError {
  const href = usePath && usePath.startsWith("/") ? usePath : "/login";
  return {
    message,
    linkLabel: `Use ${LOGIN_PAGE_LABEL[href] ?? "the main login"}`,
    linkHref: href,
  };
}
