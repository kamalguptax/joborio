import type { Metadata } from "next";
import LiveTypedBrowse from "@/components/opportunities/LiveTypedBrowse";
import { pages } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Courses",
  description: pages.courses.description,
};

export default function Page() {
  return (
    <LiveTypedBrowse
      eyebrow="Courses"
      title="Courses worth sharing"
      description="Live learning programmes from JobOrio listings and the opportunity feed. Share a course link and earn when people enrol."
      emptyHint="No course listings are live yet. Employers can launch a Courses campaign, or"
      ctaLabel="View course"
      listingTypes={["course"]}
      category="course"
      includeXmlCategoryMatches
    />
  );
}
