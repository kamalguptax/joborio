import type { Metadata } from "next";
import PageTemplate from "@/components/layout/PageTemplate";
import { pages } from "@/lib/pages";

export const metadata: Metadata = { title: "About", description: pages.about.description };

export default function Page() {
  return <PageTemplate c={pages.about} />;
}
