import type { Metadata } from "next";
import PageTemplate from "@/components/layout/PageTemplate";
import { pages } from "@/lib/pages";

export const metadata: Metadata = { title: "Campaigns", description: pages.campaigns.description };

export default function Page() {
  return <PageTemplate c={pages.campaigns} />;
}
