import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import PublisherRegisterForm from "@/components/auth/PublisherRegisterForm";
import GuestOnly from "@/components/auth/GuestOnly";

export const metadata: Metadata = {
  title: "Publisher registration",
  description:
    "Register as a Upclift publisher to manage communities, invite members, and run campaigns.",
};

export default function PublisherRegisterPage() {
  return (
    <GuestOnly>
    <AuthShell
      title="Apply Now — Publisher Network"
      subtitle="Create your account with your name, username, email and password. You will add your country, audience niches and links in the next step. After approval you can create communities and invite creators."
      topPrompt="Already approved?"
      topLinkLabel="Publisher login"
      topLinkHref="/publisher/login"
      roleSwitch={{ mode: "signup", current: "publisher" }}
      wide
      panelHeading="Apply to run a Upclift Publisher Network."
      panelBody="Create private communities, invite creators as Network Members, track campaign performance, and earn 10–15% of the creator pool."
    >
      <PublisherRegisterForm />
    </AuthShell>
    </GuestOnly>
  );
}
