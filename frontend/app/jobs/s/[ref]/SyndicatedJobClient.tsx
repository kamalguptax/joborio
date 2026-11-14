"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSyndicatedJob, type SyndicatedJob } from "@/lib/api/syndication";
import { postedAgo } from "@/lib/home/opportunityCards";
import { companyName } from "@/lib/jobs/companyName";
import { fetchPublicXmlJob } from "@/lib/syndication/publicXmlFeed";
import SyndicatedJobApplyBar from "@/components/jobs/SyndicatedJobApplyBar";
import { recordJobActivity } from "@/lib/api/creator";
import { getAuthToken, getPublicCode, rememberPublicCode } from "@/lib/auth/session";
import { fetchMe } from "@/lib/api/auth";
import { withSubid } from "@/lib/tracking/subid";
import { loginUrlWithNext } from "@/lib/auth/safeRedirect";
import { STATIC_EXPORT_PLACEHOLDER, syndicatedJobPath } from "@/lib/staticExport";

function referenceFromLocation(): string {
  const query = new URLSearchParams(window.location.search).get("ref");
  if (query) return query;
  const match = window.location.pathname.match(/^\/jobs\/s\/([^/]+)/);
  const segment = match?.[1] ? decodeURIComponent(match[1]) : "";
  return segment && segment !== STATIC_EXPORT_PLACEHOLDER ? segment : "";
}

export default function SyndicatedJobClient() {
  const router = useRouter();
  const [job, setJob] = useState<SyndicatedJob | null>(null);
  const [missing, setMissing] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [publicCode, setPublicCode] = useState<string | null>(null);

  useEffect(() => {
    const referenceId = referenceFromLocation();
    const returnTo = referenceId ? syndicatedJobPath(referenceId) : "/opportunities";
    if (!getAuthToken()) {
      setSignedIn(false);
      router.replace(loginUrlWithNext(returnTo));
      return;
    }
    setSignedIn(true);

    if (!referenceId) {
      setMissing(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const fromApi =
          (await fetchPublicXmlJob(referenceId).catch(() => null)) ??
          (await fetchSyndicatedJob(referenceId).catch(() => null));
        if (cancelled) return;
        if (!fromApi) {
          setMissing(true);
          return;
        }
        setJob(fromApi);
        const code = getPublicCode();
        if (code) setPublicCode(code);
        const me = await fetchMe().catch(() => null);
        if (!cancelled && me) setPublicCode(rememberPublicCode(me));
        await recordJobActivity({
          reference_id: fromApi.reference_id,
          action: "view",
          title: fromApi.title,
          company: fromApi.company,
        }).catch(() => undefined);
      } catch {
        if (!cancelled) setMissing(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (missing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff9fd] px-5 pt-24 text-[#172b63]">
        <div className="max-w-md rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <h1 className="text-2xl font-bold">This job is not live</h1>
          <p className="mt-3 text-sm leading-6 text-amber-950">
            It is no longer in the current feed, so the page cannot open it. Choose another job from the live list.
          </p>
          <Link
            href="/opportunities"
            className="mt-6 inline-block rounded-full bg-[#172b63] px-5 py-2.5 text-sm font-bold text-white"
          >
            Back to live jobs
          </Link>
        </div>
      </main>
    );
  }

  if (!signedIn || !job) {
    const referenceId = typeof window !== "undefined" ? referenceFromLocation() : "";
    const returnTo = referenceId ? syndicatedJobPath(referenceId) : "/opportunities";
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff9fd] px-5 pt-24 text-[#172b63]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Sign in to view this job</h1>
          <p className="mt-3 text-sm text-slate-500">
            Your account is required so this open can be counted.
          </p>
          <Link
            href={loginUrlWithNext(returnTo)}
            className="mt-6 inline-block rounded-full bg-[#172b63] px-5 py-2.5 text-sm font-bold text-white"
          >
            {signedIn ? "Loading…" : "Sign in"}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff9fd] pb-20 pt-32 text-[#172b63]">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <Link href="/opportunities" className="text-sm font-semibold text-purple-600">
          ← All opportunities
        </Link>
        {job.category ? (
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-indigo-600">
            {job.category}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-bold">{job.title}</h1>
        <p className="mt-2 text-sm font-semibold text-emerald-600">
          {postedAgo(job.publishdate)}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {companyName(job.company, "Company")} · {job.location_label || job.country}
        </p>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          {job.jobtype ? (
            <>
              <dt className="font-semibold text-slate-500">Job type</dt>
              <dd>{job.jobtype}</dd>
            </>
          ) : null}
          {job.experience ? (
            <>
              <dt className="font-semibold text-slate-500">Experience</dt>
              <dd>{job.experience}</dd>
            </>
          ) : null}
          {job.education ? (
            <>
              <dt className="font-semibold text-slate-500">Education</dt>
              <dd>{job.education}</dd>
            </>
          ) : null}
          {job.salary ? (
            <>
              <dt className="font-semibold text-slate-500">Salary</dt>
              <dd>{job.salary}</dd>
            </>
          ) : null}
        </dl>
        {job.description_html ? (
          <div
            className="prose prose-slate mt-8 max-w-none text-slate-600"
            dangerouslySetInnerHTML={{ __html: job.description_html }}
          />
        ) : job.description_text ? (
          <p className="mt-8 leading-7 text-slate-600">{job.description_text}</p>
        ) : null}
        <SyndicatedJobApplyBar
          applyUrl={publicCode ? withSubid(job.url, publicCode) : job.url}
          returnPath={syndicatedJobPath(job.reference_id)}
          referenceId={job.reference_id}
          title={job.title}
          company={companyName(job.company)}
        />
        <p className="mt-6 text-xs text-slate-400">
          reference {job.reference_id}
          {publicCode ? ` · subid ${publicCode}` : ""}
        </p>
      </div>
    </main>
  );
}
