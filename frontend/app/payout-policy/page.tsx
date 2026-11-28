import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Payout Policy",
  description:
    "Upclift payout rules: minimum payout, hold periods, weekly payments, and conversion reversals.",
};

export default function PayoutPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Payout Policy"
      description="Clear rules for creator payouts: minimum balance, hold periods, when money is paid, and what happens if a conversion is reversed."
      updated="Last updated: 16 November 2026"
    >
      <h2>1. Purpose</h2>
      <p>
        This Payout Policy explains how Upclift pays creators for tracked results (clicks,
        registrations, applications, engagement, and similar). Platform settings in Admin can adjust
        the numbers below; if a figure in your dashboard differs from this page, the live dashboard /
        ledger value applies. Also read the{" "}
        <Link href="/terms">Terms &amp; Conditions</Link>.
      </p>

      <h2>2. Minimum payout</h2>
      <ul>
        <li>
          <strong>Default minimum:</strong> <strong>USD $10</strong> (or the equivalent shown in your
          payout currency settings).
        </li>
        <li>
          Approved earnings stay in your balance until the payable total reaches the minimum.
        </li>
        <li>
          Amounts below the minimum are carried forward to the next payout cycle — they are not
          cancelled.
        </li>
        <li>
          You must save a valid payout method (UPI, PayPal, or bank details as offered) before auto
          payout can run.
        </li>
      </ul>

      <h2>3. Hold period</h2>
      <p>
        New earnings start as <strong>pending</strong>. After the hold window they can move to{" "}
        <strong>approved</strong> (then payable / paid). Default holds:
      </p>
      <ul>
        <li>
          <strong>PPC / click-style earnings:</strong> typically <strong>3–5 days</strong> (default
          5 days; shorter hold may apply based on account settings).
        </li>
        <li>
          <strong>PPR / registration earnings:</strong> typically <strong>3 days</strong> after the
          registration is verified.
        </li>
        <li>
          <strong>PPA / application earnings:</strong> typically <strong>7 days</strong> after the
          qualifying event is confirmed.
        </li>
      </ul>
      <p>
        During the hold we review fraud signals (duplicates, self-clicks, invalid traffic). Events
        marked duplicate or invalid are not paid. Hold release is processed automatically on a
        regular schedule.
      </p>

      <h2>4. When payment happens</h2>
      <ul>
        <li>
          <strong>Schedule:</strong> auto payout batches run <strong>weekly</strong> (Monday
          morning, platform time) when auto payout is enabled.
        </li>
        <li>
          Only balances that are <strong>approved</strong>, meet the <strong>minimum payout</strong>,
          and have a saved payout method are included.
        </li>
        <li>
          Upclift may also run a manual payout batch from Admin if needed (for example after a
          review).
        </li>
        <li>
          After a batch is completed, the money is marked <strong>paid</strong> in your ledger.
          Bank / UPI / PayPal timing then depends on the payment provider (usually 1–3 business
          days).
        </li>
        <li>
          A platform fee (default <strong>25%</strong> of gross, unless your account shows another
          rate) is deducted before net payout.
        </li>
      </ul>

      <h2>5. If a client conversion is reversed</h2>
      <p>
        Sometimes an employer or partner later cancels, rejects, or disputes a conversion (for
        example a fake signup, refunded hire, chargeback, or failed verification). In that case:
      </p>
      <ul>
        <li>
          Upclift may mark the related earning as <strong>reversed</strong> (or create a matching
          debit / clawback on the ledger).
        </li>
        <li>
          If the earning was still <strong>pending</strong> or <strong>approved</strong> but not yet
          paid, it is removed from your payable balance.
        </li>
        <li>
          If the amount was already <strong>paid</strong>, the reversed value may be deducted from
          future payouts until recovered.
        </li>
        <li>
          Fraud, self-traffic, or Terms violations can lead to wider holds, withheld payouts, or
          account suspension in addition to reversing that conversion.
        </li>
      </ul>
      <p>
        Disputes are reviewed by Upclift and, where needed, with the employer. Final ledger state
        after a resolved dispute is binding for payout.
      </p>

      <h2>6. What you should do</h2>
      <ul>
        <li>Use only your official Upclift share /go links so clicks are attributed correctly.</li>
        <li>Keep payout details accurate so weekly batches do not fail.</li>
        <li>
          Check <Link href="/creator/earnings">Earnings</Link> and{" "}
          <Link href="/creator/profile?tab=payout">Payout</Link> for live balances, holds, and history.
        </li>
      </ul>

      <h2>7. Contact</h2>
      <p>
        Payout questions: <a href="mailto:hello@joborio.com">hello@joborio.com</a>.
      </p>
    </LegalPage>
  );
}
