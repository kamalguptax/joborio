"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import OnboardingShell from "@/components/auth/OnboardingShell";
import { authField, authLabel } from "@/components/auth/authStyles";
import { registerEmployer } from "@/lib/api/employer";
import { getAuthToken } from "@/lib/auth/session";

const steps = [
  {
    icon: Building2,
    title: "Create your company profile",
    description:
      "Add your company name to launch sponsored programs and start working with creators.",
  },
];

export default function EmployerOnboardingPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/login");
    }
  }, [router]);

  const submit = async () => {
    setError(null);
    if (!company.trim()) {
      setError("Enter your company name to continue.");
      return;
    }
    setSaving(true);
    try {
      await registerEmployer({ company_name: company.trim(), country_code: "US" });
      router.push("/employer/dashboard");
    } catch {
      setError("Could not register. Use a logged-in account that is not already an employer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell
      steps={steps}
      current={0}
      intro="Set up your company to start running sponsored programs."
      error={error}
      exitHref="/employer/dashboard"
      onNext={submit}
      nextDisabled={saving}
      nextLabel={saving ? "Saving…" : "Save and continue"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label htmlFor="company" className={authLabel}>
          Company name
        </label>
        <input
          id="company"
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Acme Hiring"
          className={authField}
        />
      </form>
    </OnboardingShell>
  );
}
