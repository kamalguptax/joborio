"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/config";
import { trackedClickUrl } from "@/lib/tracking/subid";

export default function GoPage() {
  const [message, setMessage] = useState("Opening the job…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get("code") || "").trim();
    const ref = (params.get("ref") || "").trim();
    const to = (params.get("to") || "").trim();
    const title = (params.get("title") || "").trim();

    if (!code || (!ref && !to.startsWith("https://"))) {
      setMessage("This link is missing the job.");
      return;
    }

    const open = (destination: string, jobTitle: string) => {
      window.location.replace(trackedClickUrl(code, destination, jobTitle || undefined, ref || undefined));
    };

    if (to.startsWith("https://")) {
      open(to, title);
      return;
    }

    const lookup = new URLSearchParams({ reference_id: ref, per_page: "1" });
    fetch(`${getApiBaseUrl()}/api/v1/syndication/vigyapanam/jobs?${lookup}`)
      .then((res) => res.json())
      .then((json) => {
        const job = json?.data?.jobs?.[0] as { url?: string; title?: string } | undefined;
        if (!job?.url) {
          setMessage("This job is no longer in the live feed.");
          return;
        }
        open(job.url, job.title || title);
      })
      .catch(() => setMessage("Could not open this job. Try again."));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff9fd] px-5 text-[#172b63]">
      <p className="text-lg font-semibold">{message}</p>
    </main>
  );
}
