/**
 * The admin panel is a SEPARATE app (see ../admin).
 * Set NEXT_PUBLIC_ADMIN_URL in .env.local / .env.production
 *   dev  : http://localhost:3001
 *   prod : https://admin.joborio.com
 */
export const ADMIN_URL = (
  process.env.NEXT_PUBLIC_ADMIN_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://admin.joborio.com"
    : "http://localhost:3001")
).replace(/\/$/, "");

/** Admin login page (admin accounts cannot use the website dashboards). */
export const ADMIN_LOGIN_URL = `${ADMIN_URL}/login`;
