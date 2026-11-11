"use client";

import { useEffect, useState } from "react";
import {
  adminCreateListing,
  adminDeleteListing,
  adminIngestListings,
  adminListListings,
} from "@/lib/api/admin";
import type { Listing } from "@/lib/api/types";

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    adminListListings()
      .then(({ data }) => setListings(data))
      .catch(() => setMsg("Failed to load listings"));
  };

  useEffect(() => {
    load();
  }, []);

  const ingest = async () => {
    setMsg(null);
    try {
      const r = await adminIngestListings();
      setMsg(`Ingest OK: ${JSON.stringify(r)}`);
      load();
    } catch {
      setMsg("Ingest failed");
    }
  };

  const addSample = async () => {
    setMsg(null);
    try {
      await adminCreateListing({
        title: `Sample role ${Date.now()}`,
        company_name: "JobOrio",
        destination_url: "https://example.com/jobs/sample",
        country_code: "US",
        is_remote: true,
        category: "technology",
        ppc_rate_usd: 0.03,
        ppr_rate_usd: 0.3,
      });
      load();
    } catch {
      setMsg("Create failed");
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Listings</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={ingest}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold"
        >
          Run ingest
        </button>
        <button
          type="button"
          onClick={addSample}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm"
        >
          Add sample listing
        </button>
      </div>
      {msg ? <p className="mt-4 text-sm text-amber-300">{msg}</p> : null}
      <ul className="mt-8 space-y-3">
        {listings.map((l) => (
          <li
            key={l.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div>
              <p className="font-semibold">{l.title}</p>
              <p className="text-xs text-slate-400">
                #{l.id} · {l.status ?? "active"} · {l.company_name}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-red-300 hover:text-red-200"
              onClick={async () => {
                await adminDeleteListing(l.id);
                load();
              }}
            >
              Mark expired
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
