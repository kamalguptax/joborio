"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyPprRegistration } from "@/lib/api/public";

function Inner() {
  const params = useSearchParams();
  const [status, setStatus] = useState("Verifying your email…");

  useEffect(() => {
    const id = params.get("id");
    const token = params.get("token");
    if (!id || !token) {
      setStatus("Invalid verification link.");
      return;
    }
    verifyPprRegistration(Number(id), token)
      .then((data) => {
        setStatus(
          data.status === "verified"
            ? "Email verified! The creator earns after the hold period."
            : `Status: ${String(data.status)}`,
        );
      })
      .catch(() => setStatus("Verification failed or expired."));
  }, [params]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff9fd] px-6">
      <p className="max-w-md text-center text-sm font-medium text-slate-700">
        {status}
      </p>
    </main>
  );
}

export default function PprVerifyPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#fff9fd]" />}>
      <Inner />
    </Suspense>
  );
}
