import type { Metadata } from "next";
import Link from "next/link";
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
      description="How JobOrio collects, uses, and shares information to run the creator marketplace."
      updated="Last updated: 16 November 2026"
    >
      <h2>1. Who we are</h2>
      <p>
        JobOrio (“we”, “us”) operates joborio.com and related apps. This Privacy Policy explains what
        we collect when you visit the site, create an account, share tracking links, or run
        campaigns. Related rules for payments are in the{" "}
        <Link href="/payout-policy">Payout Policy</Link> and{" "}
        <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>

      <h2>2. Data we process</h2>
      <ul>
        <li>
          <strong>Account:</strong> name, email, password or OAuth identifiers, role (creator,
          employer, publisher, admin).
        </li>
        <li>
          <strong>Creator profile:</strong> handle, bio, niches, audience countries, social /
          website links, approval status.
        </li>
        <li>
          <strong>Employer / billing:</strong> company name, website, GST or tax details where
          provided, business email, prepaid balance and payment history.
        </li>
        <li>
          <strong>Attribution:</strong> click and apply events, reference IDs, IP address (when
          available), user agent, referrer, geo hints, and whether the event was counted or marked
          duplicate / fraud.
        </li>
        <li>
          <strong>Payout:</strong> payout method, UPI / PayPal / bank fields you submit, minimum
          payout settings, and ledger history.
        </li>
        <li>
          <strong>Technical:</strong> cookies or similar storage for login, preferences, and cookie
          consent; security and abuse logs.
        </li>
      </ul>

      <h2>3. Why we use it</h2>
      <ul>
        <li>Create and secure accounts</li>
        <li>Match creators to campaigns and show relevant jobs</li>
        <li>Attribute traffic, calculate earnings, and run payouts</li>
        <li>Detect fraud, duplicates, and self-clicks</li>
        <li>Provide support, product updates, and required legal notices</li>
      </ul>

      <h2>4. Sharing</h2>
      <p>
        We share data with processors that help us host the Service (for example cloud hosting,
        email, payments, analytics, and captcha). Employers may see campaign performance summaries
        that do not expose unnecessary personal detail. We do not sell personal data.
      </p>

      <h2>5. Retention</h2>
      <p>
        We keep account and ledger records for as long as needed to operate the Service, resolve
        disputes, and meet tax or legal duties. You may ask us to update or delete account data
        where the law allows; some financial records must be kept.
      </p>

      <h2>6. Your choices</h2>
      <ul>
        <li>Update profile and payout details in your dashboard</li>
        <li>Manage cookie preferences where the banner is shown</li>
        <li>
          Email <a href="mailto:hello@joborio.com">hello@joborio.com</a> for access or deletion
          requests
        </li>
      </ul>

      <h2>7. Contact</h2>
      <p>
        Privacy questions: <a href="mailto:hello@joborio.com">hello@joborio.com</a>.
      </p>
    </LegalPage>
  );
}
