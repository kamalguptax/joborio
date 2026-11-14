import type { Metadata } from "next";
import PageTemplate from "@/components/layout/PageTemplate";
import { pages } from "@/lib/pages";

export const metadata: Metadata = { title: "Resources", description: pages.resources.description };

export default function Page() {
  return <PageTemplate c={pages.resources} />;
}
