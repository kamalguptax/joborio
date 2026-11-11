import SyndicatedJobClient from "./SyndicatedJobClient";
import { STATIC_EXPORT_PLACEHOLDER } from "@/lib/staticExport";

export function generateStaticParams() {
  return [{ ref: STATIC_EXPORT_PLACEHOLDER }];
}

export default function SyndicatedJobDetailPage() {
  return <SyndicatedJobClient />;
}
