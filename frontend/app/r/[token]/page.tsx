import { STATIC_EXPORT_PLACEHOLDER } from "@/lib/staticExport";
import TrackingRedirectClient from "./TrackingRedirectClient";

export function generateStaticParams() {
  return [{ token: STATIC_EXPORT_PLACEHOLDER }];
}

export default function PublicTrackingRedirectPage() {
  return <TrackingRedirectClient />;
}
