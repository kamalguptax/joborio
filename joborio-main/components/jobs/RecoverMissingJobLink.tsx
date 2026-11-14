"use client";

import { useEffect } from "react";
import { getAuthToken } from "@/lib/auth/session";
import { loginUrlWithNext } from "@/lib/auth/safeRedirect";
import {
  STATIC_EXPORT_PLACEHOLDER,
  creatorProfilePath,
  listingJobPath,
  syndicatedJobPath,
} from "@/lib/staticExport";

/** Static hosts 404 `/jobs/s/{id}` because only `/jobs/s/static` is exported. */
export default function RecoverMissingJobLink() {
  useEffect(() => {
    const path = window.location.pathname;
    const syndicated = path.match(/^\/jobs\/s\/([^/]+)\/?$/);
    if (syndicated && syndicated[1] !== STATIC_EXPORT_PLACEHOLDER) {
      const next = syndicatedJobPath(decodeURIComponent(syndicated[1]));
      window.location.replace(getAuthToken() ? next : loginUrlWithNext(next));
      return;
    }
    const listing = path.match(/^\/jobs\/(\d+)\/?$/);
    if (listing) {
      const next = listingJobPath(listing[1]);
      window.location.replace(getAuthToken() ? next : loginUrlWithNext(next));
      return;
    }
    const profile = path.match(/^\/p\/([^/]+)\/?$/);
    if (profile && profile[1] !== STATIC_EXPORT_PLACEHOLDER) {
      window.location.replace(creatorProfilePath(decodeURIComponent(profile[1])));
    }
  }, []);

  return null;
}
