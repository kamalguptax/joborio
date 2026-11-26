"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createEmployerAsset, fetchEmployerAssets } from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "@/components/ui/Toast";

const BUTTONS: Array<{
  l: string;
  type: "logo" | "banner" | "promotional_image" | "brand_guideline";
  accept: string;
  hint: string;
}> = [
  {
    l: "Logo",
    type: "logo",
    accept: "image/png,image/jpeg,image/svg+xml,image/webp",
    hint: "PNG, JPG, SVG or WebP. Prefer transparent PNG.",
  },
  {
    l: "Banner",
    type: "banner",
    accept: "image/png,image/jpeg,image/webp",
    hint: "PNG, JPG or WebP. Recommended 1200×628 or similar.",
  },
  {
    l: "Promotional image",
    type: "promotional_image",
    accept: "image/png,image/jpeg,image/webp",
    hint: "PNG, JPG or WebP for partner posts.",
  },
  {
    l: "Brand guideline PDF",
    type: "brand_guideline",
    accept: "application/pdf",
    hint: "PDF only. Include logo usage and do/don’t rules.",
  },
];

type Asset = {
  id: number;
  x: string;
  ver: string;
  st: string;
  asset_type: string;
};

function pill(st: string) {
  if (st === "Approved") return "bg-emerald-50 text-emerald-700";
  if (st === "Rejected") return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-800";
}

export default function EmployerAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadFor, setUploadFor] = useState<(typeof BUTTONS)[number] | null>(
    null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchEmployerAssets()
      .then((d) => setAssets(d.assets ?? []))
      .catch(() => toast.error("Could not load assets."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openUpload = (b: (typeof BUTTONS)[number]) => {
    setUploadFor(b);
    setFile(null);
    setDragOver(false);
  };

  const closeUpload = () => {
    if (busy) return;
    setUploadFor(null);
    setFile(null);
    setDragOver(false);
  };

  const pickFile = (f: File | null | undefined) => {
    if (!f || !uploadFor) return;
    const okType =
      uploadFor.accept.split(",").some((a) => {
        const t = a.trim();
        if (t.endsWith("/*")) return f.type.startsWith(t.replace("/*", "/"));
        return f.type === t || f.name.toLowerCase().endsWith(t.replace(".", ""));
      }) ||
      (uploadFor.type === "brand_guideline"
        ? f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
        : f.type.startsWith("image/"));

    if (!okType) {
      toast.error(`Choose a valid file for ${uploadFor.l}.`);
      return;
    }
    if (f.size > 12 * 1024 * 1024) {
      toast.error("File must be under 12 MB.");
      return;
    }
    setFile(f);
  };

  const submitUpload = async () => {
    if (!uploadFor || !file) {
      toast.error("Choose a file to upload.");
      return;
    }
    setBusy(true);
    try {
      await createEmployerAsset({
        file_name: file.name,
        asset_type: uploadFor.type,
      });
      toast.success(`${uploadFor.l} uploaded — queued for review.`);
      closeUpload();
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not upload asset.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B3D]">Campaign assets</h1>
        <p className="mt-1 text-sm text-slate-500">
          Logos, banners and guidelines JobOrio gives to distribution partners
          through approved briefs.
        </p>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {BUTTONS.map((b) => (
            <button
              key={b.l}
              type="button"
              onClick={() => openUpload(b)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold"
            >
              Add {b.l}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : assets.length === 0 ? (
            <p className="text-sm text-slate-500">
              No assets yet. Add a logo or guideline to get started.
            </p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-3">File</th>
                  <th className="px-3 py-3">Version</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-[#0F1B3D]">
                      {a.x}
                    </td>
                    <td className="px-3 py-3">{a.ver}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pill(a.st)}`}
                      >
                        {a.st}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {uploadFor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-[#0F1B3D]">
              Upload {uploadFor.l}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{uploadFor.hint}</p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              className={`mt-4 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center transition ${
                dragOver
                  ? "border-violet-500 bg-violet-50"
                  : "border-slate-200 bg-slate-50 hover:border-violet-300"
              }`}
            >
              <span className="text-sm font-bold text-[#0F1B3D]">
                {file ? file.name : "Drop file here or click to browse"}
              </span>
              <span className="mt-1 text-xs text-slate-500">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB`
                  : "Max 12 MB"}
              </span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={uploadFor.accept}
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeUpload}
                disabled={busy}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitUpload}
                disabled={busy || !file}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
