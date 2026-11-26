"use client";

import ApplySyndicatedJobButton from "@/components/jobs/ApplySyndicatedJobButton";
import ShareSyndicatedJob from "@/components/jobs/ShareSyndicatedJob";

export default function SyndicatedJobApplyBar({
  applyUrl,
  returnPath,
  referenceId,
  title,
  company,
  publicCode,
}: {
  applyUrl: string;
  returnPath: string;
  referenceId?: string;
  title?: string;
  company?: string;
  publicCode?: string | null;
}) {
  return (
    <div className="mt-8 space-y-4">
      <ApplySyndicatedJobButton
        applyUrl={applyUrl}
        returnPath={returnPath}
        referenceId={referenceId}
        title={title}
        company={company}
        className="inline-block w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-center text-sm font-bold text-white sm:w-auto"
      />
      <p className="text-xs text-slate-500">
        Sign in required — then you&apos;ll continue to the employer site.
      </p>
      {referenceId && title ? (
        <ShareSyndicatedJob
          referenceId={referenceId}
          title={title}
          company={company}
          publicCode={publicCode}
        />
      ) : null}
    </div>
  );
}
