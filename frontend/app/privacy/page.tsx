import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What JobOrio collects and why, to run the creator marketplace.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="JobOrio collects account information, attribution events (clicks, registrations) and payout details to operate the creator marketplace."
    >
      <h2>Data we process</h2>
      <ul>
        <li>Account: name, email, OAuth identifiers</li>
        <li>Creator profile: handle, bio, niches, audience countries</li>
        <li>Attribution: IP, device fingerprint, referrer, geo (where available)</li>
        <li>Payout: method selection (KYC flows coming in a later release)</li>
      </ul>
      <h2>Contact</h2>
      <p>
        Questions about your data: <a href="mailto:hello@joborio.com">hello@joborio.com</a>. Full
        legal text will be finalized before production launch.
      </p>
    </LegalPage>
  );
}
