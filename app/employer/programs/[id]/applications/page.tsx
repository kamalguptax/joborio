import EmployerApplicationsClient from "./EmployerApplicationsClient";
import { STATIC_EXPORT_PLACEHOLDER } from "@/lib/staticExport";

export function generateStaticParams() {
  return [{ id: STATIC_EXPORT_PLACEHOLDER }];
}

export default function EmployerApplicationsPage() {
  return <EmployerApplicationsClient />;
}
