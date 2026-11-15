import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import PublisherRegisterForm from "@/components/auth/PublisherRegisterForm";
import GuestOnly from "@/components/auth/GuestOnly";

export const metadata: Metadata = {
  title: "Publisher registration",
  description:
    "Register as a JobOrio publisher to manage communities, invite members, and run campaigns.",
};

export default function PublisherRegisterPage() {
  return (
    <GuestOnly>
    <AuthShell
      title="Publisher registration"
      subtitle="One-page application. After review and activation you can manage communities, invite members and track performance."
      topPrompt="Already approved?"
      topLinkLabel="Publisher login"
      topLinkHref="/publisher/login"
      wide
      panelHeading="Run your network. Grow every community."
      panelBody="Manage communities, invite members and track publisher-level performance in one studio."
    >
      <PublisherRegisterForm />
    </AuthShell>
    </GuestOnly>
  );
}
