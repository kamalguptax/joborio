export const COOKIE_CONSENT_KEY = "joborio_cookie_consent";

export type CookieChoice = "accepted" | "rejected";

export function readCookieChoice(): CookieChoice | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (stored === "accepted" || stored === "rejected") return stored;
  const match = document.cookie.match(/(?:^|; )joborio_cookie_consent=(accepted|rejected)/);
  return match ? (match[1] as CookieChoice) : null;
}

export function saveCookieChoice(choice: CookieChoice): void {
  window.localStorage.setItem(COOKIE_CONSENT_KEY, choice);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_CONSENT_KEY}=${choice}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}
