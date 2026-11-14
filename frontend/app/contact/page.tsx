import Link from "next/link";
import { Mail, MessageSquare } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#fff9fd] pb-20 pt-32 text-[#172b63]">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
        <p className="mt-4 text-slate-600">
          Questions about creators, payouts, or partnerships? Reach out — we&apos;ll
          route employer inquiries when the employer portal launches.
        </p>

        <div className="mt-10 space-y-4">
          <a
            href="mailto:hello@joborio.com"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple-200"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Mail size={22} />
            </span>
            <div>
              <p className="font-bold">Email</p>
              <p className="text-sm text-slate-500">hello@joborio.com</p>
            </div>
          </a>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MessageSquare size={22} />
            </span>
            <div>
              <p className="font-bold">Creators</p>
              <p className="text-sm text-slate-500">
                Use in-app dashboard first —{" "}
                <Link href="/creator/dashboard" className="text-purple-600">
                  open dashboard
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
