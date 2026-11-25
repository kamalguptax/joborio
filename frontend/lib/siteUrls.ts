/**
 * Legacy separate admin host (optional).
 * Admin now lives on this site at `/admin`.
 * Keep NEXT_PUBLIC_ADMIN_URL only if an external admin deploy still exists.
 */
export const ADMIN_URL = (
  process.env.NEXT_PUBLIC_ADMIN_URL || ""
).replace(/\/$/, "");

/** Prefer same-site admin; fall back to external host only when configured. */
export const ADMIN_LOGIN_URL = ADMIN_URL
  ? `${ADMIN_URL}/login`
  : "/login";

export const ADMIN_HOME_URL = ADMIN_URL
  ? `${ADMIN_URL}/`
  : "/admin/dashboard";
