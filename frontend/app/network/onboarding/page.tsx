"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Megaphone, Users } from "lucide-react";
import OnboardingShell from "@/components/auth/OnboardingShell";
import { fetchMe } from "@/lib/api/auth";
import { fetchNetworkDashboard, type NetworkDashboard } from "@/lib/api/network";
import { clearOnboardingPending } from "@/lib/auth/onboardingFlag";
import { getAuthToken } from "@/lib/auth/session";

const steps = [
  {
    icon: Users,
    title: "Welcome to the network",
    description: "You joined through an invitation. Here is who you are working with.",
  },
  {
    icon: Megaphone,
    title: "How it works",
    description: "See how your activity is tracked and where to find your campaigns.",
  },
];

/** Onboarding for a member who just joined a publisher's network via invitation. */
export default function NetworkOnboardingPage() {
  const router = useRouter();
  const userId = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<NetworkDashboard | null>(null);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/login?next=/network/dashboard");
      return;
    }
    fetchMe()
      .then((u) => {
        userId.current = u.id;
      })
      .catch(() => router.replace("/login?next=/network/dashboard"));
    fetchNetworkDashboard()
      .then(setData)
      .catch(() => setData(null));
  }, [router]);

  const done = () => {
    if (userId.current != null) clearOnboardingPending(userId.current, "network");
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    done();
    router.push("/network/dashboard");
  };

  const publisher = data?.publisher?.name || "your publisher";
  const communities = data?.communities ?? [];

  return (
    <OnboardingShell
      steps={steps}
      current={step}
      intro={`Welcome${data?.member?.name ? `, ${data.member.name}` : ""}. Let's get you started.`}
      exitHref="/network/dashboard"
      exitLabel="Skip for now"
      onExit={done}
      onBack={step === 0 ? undefined : () => setStep(0)}
      onNext={next}
      nextLabel={step === steps.length - 1 ? "Go to dashboard" : "Continue"}
    >
      {step === 0 && (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            You are now a member of <span className="font-semibold text-slate-900">{publisher}</span>
            &apos;s network.
          </p>
          {communities.length > 0 && (
            <>
              <p>Your communities:</p>
              <ul className="list-disc space-y-1 pl-5">
                {communities.map((c, i) => (
                  <li key={c.code ?? i}>{c.name ?? c.code}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Campaigns are assigned to you by {publisher}. Your clicks, signups and approved actions
            show up on your dashboard as they happen.
          </p>
          {data && (
            <p>
              {data.assigned_campaigns.length === 0
                ? "No campaigns are assigned to you yet. They will appear on your dashboard once assigned."
                : `${data.assigned_campaigns.length} campaign(s) are already assigned to you.`}
            </p>
          )}
        </div>
      )}
    </OnboardingShell>
  );
}
