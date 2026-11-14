import type { Metadata } from "next";
import LiveTypedBrowse from "@/components/opportunities/LiveTypedBrowse";
import { pages } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Marketplace",
  description: pages.marketplace.description,
};

export default function Page() {
  return (
    <LiveTypedBrowse
      eyebrow="Marketplace"
      title="Tools and offers ready to share"
      description="Software, tools, and marketplace offers from JobOrio. Open an offer to share with your audience."
      emptyHint="No marketplace tools are live yet. Check opportunities for more, or"
      ctaLabel="View offer"
      listingTypes={["tool"]}
      category="tools"
      includeXmlCategoryMatches
    />
  );
}
