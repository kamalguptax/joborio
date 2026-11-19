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
      title="Publisher login"
      subtitle="Separate from creator and brand accounts. Sign in to manage your network."
      topPrompt="Not a publisher?"
      topLinkLabel="Creator login"
      topLinkHref="/creator/login"
      panelHeading="Your publisher studio, ready when you are."
      panelBody="Communities, members and campaign performance, all in one place."
    >
      <PublisherLoginForm />
    </AuthShell>
    </GuestOnly>
  );
}
