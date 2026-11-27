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
      </>
    </GuestOnly>
  );
}
