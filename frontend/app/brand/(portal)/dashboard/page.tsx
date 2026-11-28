"use client";

import { useEffect, useState } from "react";
import CampaignCommandCenter from "@/components/employer/CampaignCommandCenter";
import { fetchEmployerPrograms } from "@/lib/api/employer";

export default function EmployerDashboardPage() {
  const [active, setActive] = useState(3);
  const [total, setTotal] = useState(6);

  useEffect(() => {
    fetchEmployerPrograms()
      .then((programs) => {
        if (!programs.length) return;
        setTotal(programs.length);
        setActive(programs.filter((p) => p.status === "active").length);
      })
      .catch(() => {
        /* keep sample defaults */
      });
  }, []);

  return (
    <CampaignCommandCenter activeCampaigns={active} totalCampaigns={total} />
  );
}
