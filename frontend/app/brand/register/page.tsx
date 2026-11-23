import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import BrandRegisterForm from "@/components/auth/BrandRegisterForm";
import GuestOnly from "@/components/auth/GuestOnly";
import EmployerAwareness from "@/components/employer/EmployerAwareness";

export const metadata: Metadata = {
  title: "Brand & Company Registration",
  description:
    "Amplifying your brand presence through modern creator campaigns. Create your brand account on JobOrio.",
};

export default function BrandRegisterPage() {
  return (
    <GuestOnly>
      <>
        <AuthShell
          title="Brand & Company Registration"
          subtitle="Amplify your brand through modern creator campaigns. Scroll down to see who JobOrio is for and how campaigns work."
          topPrompt="Already registered?"
          topLinkLabel="Brand login"
          topLinkHref="/brand/login"
          roleSwitch={{ mode: "signup", current: "brand" }}
          wide
          panelHeading="Reach the right people through trusted creators."
          panelBody="Launch PPC, PPR, PPA or PPE campaigns. Pay for verified outcomes — traffic, sign-ups, applications, and engagement."
        >
          <BrandRegisterForm />
        </AuthShell>

        <section className="border-t border-slate-200 bg-[#f8f7fc] px-5 py-14 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-violet-600">
              Before you join
            </p>
            <h2 className="mt-2 text-center text-2xl font-bold text-[#172b63] sm:text-3xl">
              Why employers & brands use JobOrio
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-500">
              Understand the benefits, campaign models, and workflow — then finish
              registration above when you&apos;re ready.
            </p>
            <div className="mt-10">
              <EmployerAwareness
                primaryHref="/brand/register"
                primaryLabel="Create Brand Account"
                secondaryHref="/contact"
                secondaryLabel="Talk to Our Team"
              />
            </div>
          </div>
        </section>
      </>
    </GuestOnly>
  );
}
