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
      title="Apply Now — Publisher Network"
      subtitle="Share your name, username, email, country, audience niches, social links, team size, and preferred integration. After approval you can create communities and invite creators."
      topPrompt="Already approved?"
      topLinkLabel="Publisher login"
      topLinkHref="/publisher/login"
      wide
      panelHeading="Apply to run a JobOrio Publisher Network."
      panelBody="Create private communities, invite creators as Network Members, track campaign performance, and earn 10–15% of the creator pool."
    >
      <PublisherRegisterForm />
    </AuthShell>
    </GuestOnly>
  );
}
