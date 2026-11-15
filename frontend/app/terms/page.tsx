import type { Metadata } from "next";
import LegalPage from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms for using JobOrio as a creator, employer or publisher.",
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      description="The rules for using JobOrio as a creator, employer or publisher."
    >
      <h2>Full terms coming soon</h2>
      <p>
        Our complete Terms &amp; Conditions are being finalized and will be published here before
        production launch.
      </p>
      <p>
        If you have a question in the meantime, write to{" "}
        <a href="mailto:hello@joborio.com">hello@joborio.com</a>.
      </p>
    </LegalPage>
  );
}
