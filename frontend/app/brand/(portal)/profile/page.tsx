"use client";

import { useEffect, useState } from "react";
import { fetchEmployerBilling, saveEmployerBilling } from "@/lib/api/employer";
import { ApiClientError } from "@/lib/api/client";
import { toast } from "@/components/ui/Toast";
import PageHeader from "@/components/layout/PageHeader";

const FIELDS = [
  ["Company name", "company"],
  ["Website", "website"],
  ["Business email", "email"],
  ["Phone", "phone"],
  ["Country", "country"],
  ["GSTIN", "gst"],
  ["Billing address", "address"],
  ["Primary contact", "contact"],
] as const;

export default function EmployerProfilePage() {
  const [form, setForm] = useState<Record<string, string>>({
    company: "",
    website: "",
    email: "",
    phone: "",
    country: "India",
    gst: "",
    address: "",
    contact: "",
  });
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchEmployerBilling()
      .then((d) => {
        const e = d.employer ?? {};
        setForm({
          company: String(e.company_name ?? ""),
          website: String(e.website ?? ""),
          email: String(e.business_email ?? ""),
          phone: String(e.phone ?? ""),
          country: String(e.country_code ?? "IN") === "IN" ? "India" : String(e.country_code ?? "India"),
          gst: String(e.gst_number ?? ""),
          address: String(e.billing_address ?? ""),
          contact: String(e.company_name ?? ""),
        });
        setVerified(Boolean(d.can_go_live));
      })
      .catch(() => null);
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      await saveEmployerBilling({
        company_name: form.company.trim(),
        website: form.website.trim() || undefined,
        business_email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        primary_contact: form.contact.trim() || undefined,
        gst_number: form.gst.trim().toUpperCase(),
        billing_address: form.address.trim(),
        payment_method: "card",
        country_code: form.country === "India" ? "IN" : "IN",
      });
      toast.success("Brand profile saved.");
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Could not save profile.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Brand profile" />
      <div>
        <p className="mt-1 text-sm text-slate-500">
          Verification status:{" "}
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
              verified
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {verified ? "Verified" : "Pending verification"}
          </span>
        </p>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map(([label, key]) => (
            <label
              key={key}
              className={`block text-xs font-semibold uppercase tracking-wide text-slate-400 ${
                key === "address" ? "sm:col-span-2" : ""
              }`}
            >
              {label}
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-[#0A2150]"
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="mt-4 rounded-full bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
      </section>
    </>
  );
}
