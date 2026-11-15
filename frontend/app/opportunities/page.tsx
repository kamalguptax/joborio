import type { Metadata } from "next";
import RequireAuth from "@/components/auth/RequireAuth";
import LiveOpportunities from "@/components/opportunities/LiveOpportunities";

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Live jobs and courses you can share with your audience.",
};

/** Available to signed-in users only (guest -> /login/?next=/opportunities). */
export default function Page() {
  return (
    <RequireAuth>
      <LiveOpportunities />
    </RequireAuth>
  );
}
