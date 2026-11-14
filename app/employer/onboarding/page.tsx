"use client";

import { ArrowRight, Building2, Megaphone, Users, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMe } from "@/lib/api/auth";
import { registerEmployer } from "@/lib/api/employer";
import { getAuthToken } from "@/lib/auth/session";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import { authError, authInput, authLabel, authPrimaryButton } from "@/components/auth/authStyles";

const steps = [
  {
    id: "company",
    icon: Building2,
    title: "Company profile",
    description: "Tell us who is hiring.",
  },
  {
    id: "program",
    icon: Megaphone,
    title: "Launch a program",
    description: "Post jobs or campaigns creators can promote.",
  },
  {
    id: "creators",
    icon: Users,
    title: "Creators promote",
    description: "Creators share your openings with their audience.",
  },
  {
    id: "pay",
    icon: Wallet,
    title: "Pay on results",
    description: "You pay for verified clicks and registrations.",
  },
];

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/login");
      return;
    }
    fetchMe()
      .then((me) => setUserEmail(me.email ?? null))
      .catch(() => undefined);
  }, [router]);

  const save = async () => {
    setError(null);
    if (!company.trim()) {
      setError("Enter your company name to continue.");
      return;
    }
    setLoading(true);
    try {
      await registerEmployer({ company_name: company.trim(), country_code: "US" });
      router.push("/employer/dashboard");
    } catch {
      setError("Could not register. Use a logged-in account that is not already an employer.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void save();
  };

  return (
    <OnboardingShell
      steps={steps}
      activeIndex={0}
      heading="Create your company profile"
      lead="Set up your company to launch sponsored programs and reach creators."
      userEmail={userEmail}
      onSaveExit={() => void save()}
      saveExitBusy={loading}
    >
      <form onSubmit={submit} className="space-y-6">
        <div>
          <label htmlFor="company" className={authLabel}>
            Company name
          </label>
          <input
            id="company"
            required
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Technologies"
            className={authInput}
          />
        </div>

        {error ? (
          <p role="alert" className={authError}>
            {error}
          </p>
        ) : null}

        <div className="border-t border-slate-100 pt-6">
          <button
            type="submit"
            disabled={loading}
            className={`${authPrimaryButton} sm:w-auto sm:min-w-[200px]`}
          >
            {loading ? "Saving…" : "Save and continue"}
            {!loading ? <ArrowRight size={18} /> : null}
          </button>
        </div>
      </form>
    </OnboardingShell>
  );
}
