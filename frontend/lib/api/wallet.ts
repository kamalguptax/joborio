import { apiFetch } from "@/lib/api/client";

export type WalletEvidence = {
  has_evidence: boolean;
  evidence_original_name?: string | null;
  evidence_note?: string | null;
  evidence_uploaded_at?: string | null;
};

export type WalletRelease = {
  id: string;
  kind: string;
  label: string;
  amount_usd: number;
  status?: string | null;
  method?: string | null;
  reference?: string | null;
  period_label?: string | null;
  community_name?: string | null;
  member_name?: string | null;
  notes?: string | null;
  occurred_at?: string | null;
  evidence?: WalletEvidence;
  batch_id?: number;
};

export type WalletStatementRow = {
  id: string;
  kind: string;
  label: string;
  direction: "credit" | "debit" | string;
  amount_usd: number;
  status?: string | null;
  reference?: string | null;
  occurred_at?: string | null;
};

export type WithdrawalRow = {
  id: number;
  role: string;
  account_id: number;
  amount_usd: number;
  currency: string;
  status: string;
  payout_method?: string | null;
  payout_details?: Record<string, string | null> | null;
  user_note?: string | null;
  admin_note?: string | null;
  external_reference?: string | null;
  evidence?: WalletEvidence;
  user?: { id?: number; name?: string | null; email?: string | null } | null;
  created_at?: string | null;
  reviewed_at?: string | null;
  paid_at?: string | null;
};

export type WalletPayoutAccount = {
  payout_method?: string | null;
  payout_holder_name?: string | null;
  payout_upi_id?: string | null;
  payout_paypal_email?: string | null;
  payout_bank_name?: string | null;
  payout_account_number?: string | null;
  payout_ifsc?: string | null;
  has_default?: boolean;
  summary?: string | null;
  payout_currency?: string | null;
};

export type AccountWallet = {
  role: "creator" | "network_member" | "publisher" | string;
  currency: string;
  balances: {
    available_usd: number;
    pending_usd: number;
    payable_usd?: number;
    approved_usd?: number;
    on_hold_usd?: number;
    paid_usd: number;
    lifetime_earned_usd: number;
    member_pending_usd?: number;
    member_paid_usd?: number;
  };
  account?: WalletPayoutAccount & Record<string, unknown>;
  min_payout_usd?: number;
  withdrawals?: WithdrawalRow[];
  statement?: WalletStatementRow[];
  releases: WalletRelease[];
  member_releases?: WalletRelease[];
  pending_member_settlements?: Array<{
    id: number;
    amount_usd: number;
    member_name?: string | null;
    community_name?: string | null;
    period_label?: string | null;
    created_at?: string | null;
    can_release?: boolean;
    wallet_shortfall_usd?: number;
  }>;
  note?: string;
};

export type WithdrawalRequestInput = {
  amount_usd: number;
  payout_method: "upi" | "bank_transfer" | "paypal";
  holder_name?: string;
  upi_id?: string;
  paypal_email?: string;
  bank_name?: string;
  account_number?: string;
  ifsc?: string;
  user_note?: string;
  save_as_default?: boolean;
};

function baseForRole(role: AccountWallet["role"]) {
  if (role === "publisher") return "/api/v1/publisher";
  if (role === "network_member") return "/api/v1/network";
  return "/api/v1/creator";
}

export function requestWalletWithdrawal(
  role: AccountWallet["role"],
  input: WithdrawalRequestInput,
) {
  return apiFetch<WithdrawalRow>(`${baseForRole(role)}/withdrawals`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(input),
  });
}

export function saveWalletPayoutAccount(
  role: AccountWallet["role"],
  input: Omit<WithdrawalRequestInput, "amount_usd" | "user_note" | "save_as_default">,
) {
  return apiFetch<WalletPayoutAccount>(`${baseForRole(role)}/payout-account`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(input),
  });
}

export function cancelWalletWithdrawal(
  role: AccountWallet["role"],
  withdrawalId: number,
) {
  return apiFetch<WithdrawalRow>(
    `${baseForRole(role)}/withdrawals/${withdrawalId}/cancel`,
    { method: "POST", auth: true },
  );
}

export function fetchWalletStatement(role: AccountWallet["role"]) {
  return apiFetch<{
    role: string;
    available_usd: number;
    min_payout_usd: number;
    rows: WalletStatementRow[];
  }>(`${baseForRole(role)}/wallet/statement`, { auth: true });
}
