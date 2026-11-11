"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

function VerifyPprContent() {
  const params = useSearchParams();
  const status = params.get("status");
  const message = params.get("message");

  const verified = status === "verified";
  const failed = status === "error" || (!verified && status !== null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7ff] px-5 pt-20">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">
        {verified ? (
          <>
            <CheckCircle2 className="mx-auto text-emerald-500" size={48} />
            <h1 className="mt-4 text-2xl font-bold text-[#172b63]">
              Email verified
            </h1>
            <p className="mt-3 text-slate-600">
              Your registration is confirmed. The creator&apos;s PPR earning is
              now in pending hold before approval.
            </p>
          </>
        ) : failed ? (
          <>
            <XCircle className="mx-auto text-red-500" size={48} />
            <h1 className="mt-4 text-2xl font-bold text-[#172b63]">
              Verification failed
            </h1>
            <p className="mt-3 text-slate-600">
              {message ?? "This link may be expired or already used."}
            </p>
          </>
        ) : (
          <p className="text-slate-600">Open the link from your verification email.</p>
        )}
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white"
        >
          Back to JobOrio
        </Link>
      </div>
    </main>
  );
}

export default function VerifyPprPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-slate-500">Loading…</p>
        </main>
      }
    >
      <VerifyPprContent />
    </Suspense>
  );
}
