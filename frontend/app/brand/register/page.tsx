import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import BrandRegisterForm from "@/components/auth/BrandRegisterForm";
import GuestOnly from "@/components/auth/GuestOnly";

export const metadata: Metadata = {
  title: "Brand & Company Registration",
  description:
    "Amplifying your brand presence through modern creator campaigns. Create your brand account on JobOrio.",
};

export default function BrandRegisterPage() {
  return (
    <GuestOnly>
    <AuthShell
      title="Brand & Company Registration"
      subtitle="Amplify your brand through modern creator campaigns."
      topPrompt="Already registered?"
      topLinkLabel="Log in"
      topLinkHref="/login?next=/employer/dashboard"
      wide
      panelHeading="Reach the right people through trusted creators."
      panelBody="Create your brand account and launch performance-based hiring campaigns."
    >
      <BrandRegisterForm />
    </AuthShell>
    </GuestOnly>
  );
}
