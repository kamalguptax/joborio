"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { registerEmployer } from "@/lib/api/employer";
import { getAuthToken } from "@/lib/auth/session";

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/login");
    }
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await registerEmployer({ company_name: company, country_code: "US" });
      router.push("/employer/dashboard");
    } catch {
      setError("Could not register. Use a logged-in account that is not already an employer.");
    }
  };

  return (
    <main className="mx-auto max-w-md px-5 py-24">
      <h1 className="text-2xl font-bold">Employer onboarding</h1>
      <p className="mt-2 text-sm text-slate-500">
        Create a company profile to launch sponsored programs.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block text-sm font-semibold">
          Company name
          <input
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full bg-[#172b63] py-3 font-bold text-white"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
