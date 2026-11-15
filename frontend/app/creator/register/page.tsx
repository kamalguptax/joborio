import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import CreatorRegisterForm from "@/components/auth/CreatorRegisterForm";
import GuestOnly from "@/components/auth/GuestOnly";

export const metadata: Metadata = {
  title: "Join as a Creator",
  description:
    "Your audience has value. Share trusted campaigns, track real results, and get paid on JobOrio.",
};

export default function CreatorRegisterPage() {
  return (
    <GuestOnly>
    <AuthShell
      title="Join JobOrio as a Creator"
      subtitle="Share trusted campaigns, track real results, and get paid."
      topPrompt="Already a creator?"
      topLinkLabel="Log in"
      topLinkHref="/login?next=/creator/dashboard"
      wide
      panelHeading="Your audience has value. Start earning today."
      panelBody="Share trusted campaigns and earn USD on verified clicks and registrations."
    >
      <CreatorRegisterForm />
    </AuthShell>
    </GuestOnly>
  );
}
