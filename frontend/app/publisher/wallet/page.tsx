"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiClientError } from "@/lib/api/client";
import { fetchPublisherWallet } from "@/lib/api/publisher";
import type { AccountWallet } from "@/lib/api/wallet";
import AccountWalletView from "@/components/wallet/AccountWalletView";
import { PageSkeleton } from "@/components/ui/Skeleton";
import BackButton from "@/components/ui/BackButton";

export default function PublisherWalletPage() {
  const [wallet, setWallet] = useState<AccountWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchPublisherWallet()
      .then((w) => {
        setWallet(w);
        window.dispatchEvent(new Event("joborio:wallet-updated"));
      })
      .catch((err) =>
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Could not load publisher wallet.",
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <BackButton href="/publisher/dashboard" label="Back to dashboard" />
        <Link
          href="/publisher/payments"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Release payments
        </Link>
      </div>
      <AccountWalletView
        wallet={wallet}
        eyebrow="Account wallet"
        title="Publisher wallet"
        releaseHref="/publisher/payments"
        onChanged={load}
      />
    </>
  );
}
