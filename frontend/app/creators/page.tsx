import type { Metadata } from "next";
import PageTemplate from "@/components/layout/PageTemplate";
import { pages } from "@/lib/pages";
import CreatorSolutionTimeline from "@/components/creators/CreatorSolutionTimeline";
import ApprovedCreatorsDirectory from "@/components/creators/ApprovedCreatorsDirectory";

export const metadata: Metadata = { title: "Creators", description: pages.creators.description };

export default function Page() {
  return (
    <PageTemplate
      c={pages.creators}
      featuresSlot={
        <>
          <ApprovedCreatorsDirectory />
          <CreatorSolutionTimeline />
        </>
      }
    />
  );
}
