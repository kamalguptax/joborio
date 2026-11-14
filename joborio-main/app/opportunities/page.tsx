import type { Metadata } from "next";
import LiveOpportunities from "@/components/opportunities/LiveOpportunities";

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Live jobs and courses you can share with your audience.",
};

export default function Page() {
  return <LiveOpportunities />;
}
