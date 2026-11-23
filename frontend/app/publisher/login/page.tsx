import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import PublisherLoginForm from "@/components/auth/PublisherLoginForm";
import GuestOnly from "@/components/auth/GuestOnly";

export const metadata: Metadata = {
  title: "Publisher login",
  description: "Sign in to your JobOrio publisher studio.",
};

export default function PublisherLoginPage() {
  return (
    <GuestOnly>
    <AuthShell
      title="Publisher Network sign-in"
      subtitle="Publishers manage communities and commissions. Network Members use the member portal after joining via invite."
      topPrompt="Network Member?"
      topLinkLabel="Member sign-in"
      topLinkHref="/login"
      roleSwitch={{ mode: "login", current: "publisher" }}
      panelHeading="Run your private creator network."
      panelBody="Create communities, invite creators, track reports, and check your 10–15% pool commission."
    >
      <PublisherLoginForm />
    </AuthShell>
    </GuestOnly>
  );
}
