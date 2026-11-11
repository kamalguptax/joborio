import JobDetailClient from "./JobDetailClient";
import { STATIC_EXPORT_PLACEHOLDER } from "@/lib/staticExport";

export function generateStaticParams() {
  return [{ id: STATIC_EXPORT_PLACEHOLDER }];
}

export default function JobDetailPage() {
  return <JobDetailClient />;
}
