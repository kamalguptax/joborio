import type { Metadata } from "next";
import LiveTypedBrowse from "@/components/opportunities/LiveTypedBrowse";
import { pages } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Campaigns",
  description: pages.campaigns.description,
};

export default function Page() {
  return (
    <LiveTypedBrowse
      eyebrow="Campaigns"
      title="Campaigns to promote"
      description="Brand, job, and post-promote campaigns from employers. Join as a creator to earn PPC, PPR, PPA, or PPE."
      emptyHint="No campaign listings are live yet. Brands can launch from employer programs, or"
      ctaLabel="View campaign"
      listingTypes={["job", "branding", "post_promote", "other"]}
    />
  );
}
