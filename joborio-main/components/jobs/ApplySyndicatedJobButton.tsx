"use client";

import { useRouter } from "next/navigation";
import { fetchMe } from "@/lib/api/auth";
import { getAuthToken } from "@/lib/auth/session";
import { loginUrlWithNext } from "@/lib/auth/safeRedirect";
import { recordJobActivity } from "@/lib/api/creator";
import { getPublicCode, rememberPublicCode } from "@/lib/auth/session";
import { withSubid } from "@/lib/tracking/subid";

let cachedSubid: string | null = null;

async function currentSubid(): Promise<string | null> {
  if (cachedSubid) return cachedSubid;
  const me = await fetchMe().catch(() => null);
  if (!me) return getPublicCode();
  cachedSubid = rememberPublicCode(me);
  return cachedSubid;
}

type Props = {
  applyUrl: string;
  /** Where to return after login (defaults to current path). */
  returnPath?: string;
  referenceId?: string;
  title?: string;
  company?: string;
  className?: string;
  children?: React.ReactNode;
};

export default function ApplySyndicatedJobButton({
  applyUrl,
  returnPath,
  referenceId,
  title,
  company,
  className,
  children = "Apply on Jobrapido",
}: Props) {
  const router = useRouter();

  const onApply = async () => {
    const returnTo =
      returnPath ??
      (typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/jobs");

    if (!getAuthToken()) {
      router.push(loginUrlWithNext(returnTo));
      return;
    }

    if (referenceId) {
      await recordJobActivity({
        reference_id: referenceId,
        action: "apply",
        title,
        company,
      }).catch(() => undefined);
    }

    const code = getPublicCode() ?? (await currentSubid());
    const outbound = code ? withSubid(applyUrl, code) : applyUrl;
    window.open(outbound, "_blank", "noopener,noreferrer");
  };

  return (
    <button type="button" onClick={onApply} className={className}>
      {children}
    </button>
  );
}
