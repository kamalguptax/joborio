"use client";

import { useEffect, useState } from "react";
import JobPreferencesForm, {
  type JobPreferencesValues,
} from "@/components/job-preferences/JobPreferencesForm";
import PreferredJobsList from "@/components/job-preferences/PreferredJobsList";
import {
  fetchCreatorJobPreferences,
  fetchCreatorPreferredJobs,
  updateCreatorJobPreferences,
} from "@/lib/api/creator";
import type { Listing } from "@/lib/api/types";
import { SectionSkeleton } from "@/components/ui/Skeleton";
import PageHeader from "@/components/layout/PageHeader";

const emptyTargeting = {
  keywords: [] as string[],
  industry: [] as string[],
  brands: [] as string[],
  audience_type: [] as string[],
  work_mode: [] as string[],
  currency: "USD",
};

const emptyPrefs = {
  salary_min: null as number | null,
  salary_max: null as number | null,
  experience: [] as string[],
  duration: null as string | null,
  education: [] as string[],
  skills: [] as string[],
};

export default function CreatorJobPreferencesPage() {
  const [initial, setInitial] = useState<JobPreferencesValues | null>(null);
  const [jobs, setJobs] = useState<Listing[]>([]);

  const loadJobs = () => {
    fetchCreatorPreferredJobs().then(setJobs).catch(() => setJobs([]));
  };

  useEffect(() => {
    fetchCreatorJobPreferences()
      .then((p) =>
        setInitial({
          niche_ids: p.niche_ids,
          countries: p.countries ?? [],
          remoteOnly: p.prefer_remote,
          job_types: p.job_types ?? [],
          opportunity_categories: p.opportunity_categories ?? [],
          opportunity_targeting: {
            ...emptyTargeting,
            ...(p.opportunity_targeting ?? {}),
            currency: p.opportunity_targeting?.currency ?? "USD",
          },
          opportunity_preferences: {
            ...emptyPrefs,
            ...(p.opportunity_preferences ?? {}),
            experience: p.opportunity_preferences?.experience ?? [],
            education: p.opportunity_preferences?.education ?? [],
            skills: p.opportunity_preferences?.skills ?? [],
          },
        }),
      )
      .catch(() =>
        setInitial({
          niche_ids: [],
          countries: [],
          remoteOnly: false,
          job_types: [],
          opportunity_categories: [],
          opportunity_targeting: emptyTargeting,
          opportunity_preferences: emptyPrefs,
        }),
      );
    loadJobs();
  }, []);

  const onSave = async (values: JobPreferencesValues) => {
    await updateCreatorJobPreferences({
      niche_ids: values.niche_ids,
      countries: values.countries,
      prefer_remote: values.remoteOnly,
      job_types: values.job_types,
      opportunity_categories: values.opportunity_categories,
      opportunity_targeting: values.opportunity_targeting,
      opportunity_preferences: values.opportunity_preferences,
    });
    setInitial(values);
    loadJobs();
  };

  return (
    <>
      <div className="mb-8">
        <PageHeader title="Opportunity preferences" backHref="/creator/settings" backLabel="Settings" />
        <p className="mt-2 max-w-2xl text-slate-500">
          Categories, targeting, and filters for the opportunities you promote.
          Filters adapt to your selections — jobs unlock salary; courses unlock
          duration; both unlock the full set.
        </p>
      </div>

      {initial ? (
        <JobPreferencesForm
          initial={initial}
          remoteLabel="Remote jobs only"
          onSave={onSave}
        />
      ) : (
        <SectionSkeleton />
      )}

      <div className="mt-10">
        <h2 className="text-lg font-bold">Preferred jobs for you</h2>
        <div className="mt-4">
          <PreferredJobsList
            jobs={jobs}
            emptyHint="Set preferences above to see matching jobs."
          />
        </div>
      </div>
    </>
  );
}
