"use client";

import { Suspense, useEffect, useState } from "react";
import { fetchEmployerBilling } from "@/lib/api/employer";
import BrandCampaignWizard from "@/components/employer/BrandCampaignWizard";
import { PageSkeleton } from "@/components/ui/Skeleton";

function NewCampaignPageInner() {
  const [canGoLive, setCanGoLive] = useState(false);
  const [billingMissing, setBillingMissing] = useState<string[]>([]);

  useEffect(() => {
    fetchEmployerBilling()
      .then((d) => {
        setCanGoLive(Boolean(d.can_go_live));
        setBillingMissing(d.missing_labels ?? []);
      })
      .catch(() => {
        setCanGoLive(false);
        setBillingMissing([]);
      });
  }, []);

  return (
    <BrandCampaignWizard canGoLive={canGoLive} billingMissing={billingMissing} />
  );
}

export default function NewEmployerProgramPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewCampaignPageInner />
    </Suspense>
  );
}
