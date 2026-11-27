"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiClientError } from "@/lib/api/client";
import { fetchCreatorWallet } from "@/lib/api/creator";
import type { AccountWallet } from "@/lib/api/wallet";
import AccountWalletView from "@/components/wallet/AccountWalletView";
import { PageSkeleton } from "@/components/ui/Skeleton";

export default function CreatorWalletPage() {
  const [wallet, setWallet] = useState<AccountWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchCreatorWallet()
      .then(setWallet)
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load creator wallet.",
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
    <>
      <div className="mb-4 flex justify-end gap-2">
        <Link
          href="/creator/earnings"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Earnings detail
        </Link>
      </div>
      <AccountWalletView
        wallet={wallet}
        eyebrow="Account wallet"
        title="Creator wallet"
        onChanged={load}
      />
    </>
  );
}
