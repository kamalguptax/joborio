import Link from "next/link";
import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-50">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminPanel({
  title,
  href,
  children,
  className = "",
}: {
  title?: string;
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-sm ${className}`}
    >
      {title ? (
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
          {href ? (
            <Link
              href={href}
              className="text-sm font-semibold text-zinc-200 hover:text-amber-400"
            >
              {title} →
            </Link>
          ) : (
            <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
          )}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </p>
        {href ? (
          <span className="text-xs font-semibold text-amber-500/80">Open →</span>
        ) : null}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums text-zinc-50">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-zinc-600">{hint}</p> : null}
    </>
  );
  const className =
    "block cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 transition hover:border-amber-500/50 hover:bg-zinc-800";

  if (!href) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 disabled:opacity-50";

export function AdminButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const variants = {
    primary: "bg-amber-500 text-zinc-950 hover:bg-amber-400",
    secondary: "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 hover:border-zinc-600",
    danger: "bg-red-600/90 text-white hover:bg-red-600",
    ghost: "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
  };
  return (
    <button
      type="button"
      className={`${btnBase} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminLinkButton({
  href,
  children,
  variant = "secondary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const variants = {
    primary: "bg-amber-500 text-zinc-950 hover:bg-amber-400",
    secondary:
      "border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800",
  };
  return (
    <Link href={href} className={`${btnBase} ${variants[variant]}`}>
      {children}
    </Link>
  );
}

export function AdminInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      {...props}
    />
  );
}

export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
      {...props}
    />
  );
}

export function AdminTableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[640px] text-left text-sm text-zinc-300">
        {children}
      </table>
    </div>
  );
}

export function AdminAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "warn" | "info";
  children: ReactNode;
}) {
  const tones = {
    error: "border-red-900/80 bg-red-950/40 text-red-200",
    warn: "border-amber-900/80 bg-amber-950/30 text-amber-100",
    info: "border-zinc-700 bg-zinc-900 text-zinc-300",
  };
  return (
    <p className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </p>
  );
}
