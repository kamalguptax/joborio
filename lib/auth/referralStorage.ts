const REF_KEY = "joborio_referral_code";

export function saveReferralCode(code: string): void {
  if (typeof window === "undefined") return;
  const trimmed = code.trim().toUpperCase();
  if (trimmed) localStorage.setItem(REF_KEY, trimmed);
}

export function getReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REF_KEY);
}

export function clearReferralCode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REF_KEY);
}
