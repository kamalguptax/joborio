import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/layout/PageHero";
import EmployerAwareness from "@/components/employer/EmployerAwareness";
import { pages } from "@/lib/pages";

export const metadata: Metadata = {
  title: "For Brands & Employers",
  description: pages.brands.description,
};

export default function Page() {
  const c = pages.brands;

  return (
    <>
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        highlight={c.highlight}
        description={c.description}
        primary={c.primary}
        secondary={{ label: "Talk to our team", href: "/contact" }}
      />

      <section className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-8 md:py-16 lg:px-10">
        <EmployerAwareness
          primaryHref="/brand/register"
          primaryLabel="Create Brand Account"
          secondaryHref="/contact"
          secondaryLabel="Talk to Our Team"
        />
      </section>

      <section className="border-t border-slate-100 bg-slate-50/80 py-10">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 sm:px-8 lg:px-10">
          <p className="text-sm font-semibold text-slate-600">
            Already have a brand account?
          </p>
          <Link
            href="/brand/login"
            className="text-sm font-bold text-violet-700 hover:underline"
          >
            Sign in to employer dashboard →
          </Link>
        </div>
      </section>
    </>
  );
}
