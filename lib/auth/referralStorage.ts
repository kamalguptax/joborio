const REF_KEY = "joborio_referral_code";

export function saveReferralCode(code: string): void {
  if (typeof window === "undefined") return;
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return;
  try {
    localStorage.setItem(REF_KEY, trimmed);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.setItem(REF_KEY, trimmed);
  } catch {
    /* ignore */
  }
}

export function getReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = sessionStorage.getItem(REF_KEY);
    if (fromSession) return fromSession;
  } catch {
    /* ignore */
  }
  try {
    return localStorage.getItem(REF_KEY);
  } catch {
    return null;
  }
}

export function clearReferralCode(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(REF_KEY);
  } catch {
    /* ignore */
  }
}
