"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiClientError } from "@/lib/api/client";
import { fetchNetworkWallet } from "@/lib/api/network";
import type { AccountWallet } from "@/lib/api/wallet";
import AccountWalletView from "@/components/wallet/AccountWalletView";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function NetworkWalletPage() {
  const [wallet, setWallet] = useState<AccountWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchNetworkWallet()
      .then(setWallet)
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load wallet.",
        ),
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {error}
      </p>
    );
  }

  if (!wallet) return <PageSkeleton />;

  return (
    <AccountWalletView
      wallet={wallet}
      eyebrow="Account wallet"
      title="My wallet"
      onChanged={load}
    />
  );
}
