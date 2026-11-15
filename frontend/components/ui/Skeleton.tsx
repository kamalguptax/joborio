import type { ReactNode } from "react";

/**
 * Loading placeholders. Use these instead of "Loading…" text so layouts
 * don't jump when data arrives. All wrappers are announced once to screen readers.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

function Live({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-3.5 ${i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

function StatCards({ count = 4, className = "sm:grid-cols-2 xl:grid-cols-4" }: { count?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
          <Skeleton className="mt-4 h-7 w-28" />
        </div>
      ))}
    </div>
  );
}

function Table({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3.5">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 border-t border-slate-100 px-4 py-4">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={`h-3.5 flex-1 ${c === 0 ? "max-w-[40%]" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function CardGrid({ count = 3, className = "sm:grid-cols-2 xl:grid-cols-3" }: { count?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
          <SkeletonText lines={3} className="mt-5" />
          <Skeleton className="mt-5 h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Rows of text/list items (members, invites, jobs…). */
export function ListSkeleton({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <Live className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </Live>
  );
}

export function CardGridSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <Live>
      <CardGrid count={count} className={className} />
    </Live>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
  className = "",
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <Live className={className}>
      <Table rows={rows} cols={cols} />
    </Live>
  );
}

export function StatCardsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <Live>
      <StatCards count={count} className={className} />
    </Live>
  );
}

/** Cards + a table, no page title. For sections inside an already-rendered page. */
export function SectionSkeleton({ className = "" }: { className?: string }) {
  return (
    <Live className={`space-y-6 ${className}`}>
      <StatCards />
      <Table />
    </Live>
  );
}

/** Whole-page placeholder: title block + stat cards + table. */
export function PageSkeleton() {
  return (
    <Live>
      <div aria-hidden="true" className="mb-7 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-3.5 w-96 max-w-full" />
      </div>
      <div className="space-y-6">
        <StatCards />
        <Table />
      </div>
    </Live>
  );
}

/** Placeholder for auth / simple forms. */
export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <Live>
      <div aria-hidden="true" className="space-y-5">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </Live>
  );
}

/** Job / opportunity cards used on public listing pages. */
export function JobCardsSkeleton({ count = 6, className = "sm:grid-cols-2 lg:grid-cols-3" }: { count?: number; className?: string }) {
  return (
    <Live>
      <div aria-hidden="true" className={`grid gap-4 sm:gap-5 ${className}`}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="rounded-3xl border border-indigo-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <SkeletonText lines={2} className="mt-5" />
            <div className="mt-6 flex items-center justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </Live>
  );
}

/** Full-screen placeholder for layouts that gate on auth (sidebar + page). */
export function ShellSkeleton() {
  return (
    <div className="min-h-svh bg-[#F8F8FB] lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <aside aria-hidden="true" className="hidden border-r border-slate-200 bg-white p-5 lg:block">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </aside>
      <div className="px-5 py-7 lg:px-10">
        <PageSkeleton />
      </div>
    </div>
  );
}

/** Centered card placeholder for stand-alone public screens (invite, verify, profile). */
export function CenteredCardSkeleton() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#F8F8FB] px-4">
      <Live className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7">
        <div aria-hidden="true" className="space-y-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <SkeletonText lines={3} />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </Live>
    </main>
  );
}
