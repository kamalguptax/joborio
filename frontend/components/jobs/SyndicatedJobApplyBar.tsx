"use client";

import ApplySyndicatedJobButton from "@/components/jobs/ApplySyndicatedJobButton";

export default function SyndicatedJobApplyBar({
  applyUrl,
  returnPath,
  referenceId,
  title,
  company,
}: {
  applyUrl: string;
  returnPath: string;
  referenceId?: string;
  title?: string;
  company?: string;
}) {
  return (
    <div className="mt-8 space-y-3">
      <ApplySyndicatedJobButton
        applyUrl={applyUrl}
        returnPath={returnPath}
        referenceId={referenceId}
        title={title}
        company={company}
        className="inline-block rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-bold text-white"
      />
      <p className="text-xs text-slate-500">
        Sign in required — then you&apos;ll continue to the employer site.
      </p>
    </div>
  );
}
