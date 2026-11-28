import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms for using Upclift as a creator, employer or publisher.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      description="The rules for using Upclift as a creator, employer, publisher, or visitor."
      updated="Last updated: 16 November 2026"
    >
      <h2>1. Who these terms cover</h2>
      <p>
        These Terms &amp; Conditions (“Terms”) apply when you use Upclift websites, apps, APIs,
        tracking links, XML feeds, and related services (together, the “Service”). By creating an
        account or using the Service you agree to these Terms and our{" "}
        <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/payout-policy">Payout Policy</Link>.
      </p>

      <h2>2. Accounts and eligibility</h2>
      <ul>
        <li>You must provide accurate registration details and keep them up to date.</li>
        <li>
          Creator accounts may require social or website links and can stay pending until Upclift
          approves the profile.
        </li>
        <li>
          Employer accounts that go live must meet business requirements (such as company details,
          GST where applicable, a business email, and first payment / prepaid balance rules).
        </li>
        <li>You are responsible for activity under your login and tracking codes (for example VIG codes).</li>
      </ul>

      <h2>3. Roles on the platform</h2>
      <ul>
        <li>
          <strong>Creators</strong> promote jobs, courses, tools, branding, and related offers using
          Upclift share links and feeds.
        </li>
        <li>
          <strong>Employers / brands</strong> create campaigns, set budgets and rates, and fund
          payouts for tracked results.
        </li>
        <li>
          <strong>Publishers / network members</strong> operate under separate network rules where
          those apply.
        </li>
      </ul>

      <h2>4. Tracking, clicks, and fraud</h2>
      <p>
        Upclift records attribution events (views, clicks, applies, registrations, and similar) to
        measure performance and calculate earnings. We may mark events as not counted, duplicate,
        self-click, trial, or fraud when our systems or reviews detect abuse. Duplicate clicks from
        the same visitor and job within a short window may be stored but not paid.
      </p>
      <p>
        You must not inflate traffic with bots, forced redirects, misleading ads, incentive spam that
        violates campaign rules, or any method intended to fake conversions.
      </p>

      <h2>5. Campaigns and content</h2>
      <p>
        Campaign rates, budgets, and promotion types are shown in the product. Employers remain
        responsible for the legality of their offers and destination pages. Creators must promote
        honestly and follow any campaign brief or engagement rules.
      </p>

      <h2>6. Earnings and payouts</h2>
      <p>
        Earnings are provisional until they clear hold periods and fraud checks. Minimum payout,
        hold days, payout schedule, and conversion reversals are described in the{" "}
        <Link href="/payout-policy">Payout Policy</Link>. Platform fees may apply before net amounts
        are paid.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        Upclift branding, software, and documentation remain our property. You keep rights to your
        own profile content, and grant Upclift a licence to host and display it to operate the
        Service.
      </p>

      <h2>8. Suspension and termination</h2>
      <p>
        We may suspend or close accounts that break these Terms, fail verification, or create
        chargeback / fraud risk. You may stop using the Service at any time; unpaid balances may
        remain subject to the Payout Policy and outstanding disputes.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The Service is provided on an “as available” basis. Job volume from third-party feeds can
        change. We do not guarantee any specific earning level.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a href="mailto:hello@joborio.com">hello@joborio.com</a>.
      </p>
    </LegalPage>
  );
}
