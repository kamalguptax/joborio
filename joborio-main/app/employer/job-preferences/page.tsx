"use client";

import { useEffect, useState } from "react";
import JobPreferencesForm, {
  type JobPreferencesValues,
} from "@/components/job-preferences/JobPreferencesForm";
import PreferredJobsList from "@/components/job-preferences/PreferredJobsList";
import PromoteJobsList from "@/components/job-preferences/PromoteJobsList";
import {
  fetchEmployerJobPreferences,
  fetchEmployerPreferredJobs,
  updateEmployerJobPreferences,
} from "@/lib/api/employer";
import type { Listing } from "@/lib/api/types";

export default function EmployerJobPreferencesPage() {
  const [initial, setInitial] = useState<JobPreferencesValues | null>(null);
  const [jobs, setJobs] = useState<Listing[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);

  const loadJobs = () => {
    fetchEmployerPreferredJobs()
      .then((rows) => setJobs(rows as Listing[]))
      .catch(() => setJobs([]));
  };

  useEffect(() => {
    fetchEmployerJobPreferences()
      .then((p) =>
        setInitial({
          niche_ids: p.niche_ids ?? [],
          countries: p.countries ?? [],
          remoteOnly: p.remote_only,
          job_types: p.job_types ?? [],
        }),
      )
      .catch(() =>
        setInitial({ niche_ids: [], countries: [], remoteOnly: false, job_types: [] }),
      );
    loadJobs();
  }, []);

  const onSave = async (values: JobPreferencesValues) => {
    await updateEmployerJobPreferences({
      niche_ids: values.niche_ids,
      countries: values.countries,
      remote_only: values.remoteOnly,
      job_types: values.job_types,
    });
    setJobTypes(values.job_types);
    setInitial(values);
    loadJobs();
  };

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">
          Market intel
        </p>
        <h1 className="mt-1 text-3xl font-bold">Job preferences</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Tell us what roles you hire for. We surface similar active listings on
          your dashboard.
        </p>
      </div>

      {initial ? (
        <JobPreferencesForm
          initial={initial}
          remoteLabel="Show remote listings only"
          onSave={onSave}
          onJobTypesChange={setJobTypes}
        />
      ) : (
        <p className="text-sm text-slate-500">Loading…</p>
      )}

      <PromoteJobsList types={jobTypes} />

      <div className="mt-10">
        <h2 className="text-lg font-bold">Preferred jobs in the market</h2>
        <div className="mt-4">
          <PreferredJobsList
            jobs={jobs}
            emptyHint="Save preferences to see matching marketplace jobs."
          />
        </div>
      </div>
    </>
  );
}
