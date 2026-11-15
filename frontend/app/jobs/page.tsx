import RequireAuth from "@/components/auth/RequireAuth";
import JobsBrowseClient from "./JobsBrowseClient";

/** /jobs is available to signed-in users only (guest -> /login/?next=/jobs). */
export default function Page() {
  return (
    <RequireAuth>
      <JobsBrowseClient />
    </RequireAuth>
  );
}
