import AdminUserDetailClient from "./AdminUserDetailClient";
import { STATIC_EXPORT_PLACEHOLDER } from "@/lib/staticExport";

export function generateStaticParams() {
  return [{ id: STATIC_EXPORT_PLACEHOLDER }];
}

export default function AdminUserDetailPage() {
  return <AdminUserDetailClient />;
}
