import PublicCreatorClient from "./PublicCreatorClient";
import { STATIC_EXPORT_PLACEHOLDER } from "@/lib/staticExport";

export function generateStaticParams() {
  return [{ handle: STATIC_EXPORT_PLACEHOLDER }];
}

export default function PublicCreatorPage() {
  return <PublicCreatorClient />;
}
