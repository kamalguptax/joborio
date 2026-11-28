"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { DEFAULT_AVATAR } from "@/lib/defaultAvatar";
import { fetchTopEarners, type TopEarner } from "@/lib/topEarners";

type Item = { a: number; r: number };

const style = (a: number, r: number): CSSProperties =>
  ({ "--a": `${a}deg`, "--r": `calc(var(--u) * ${r})` }) as CSSProperties;

/** Slot on an orbit: static placement, then counter-rotation so content stays upright. */
function Slot({
  a,
  r,
  parentCw,
  duration,
  children,
}: Item & { parentCw: boolean; duration: number; children: React.ReactNode }) {
  return (
    <div className="auth-orbit-slot" style={style(a, r)}>
      <div className="w-max -translate-x-1/2 -translate-y-1/2">
        {/* spins against the parent ring so the content stays upright */}
        <div
          className={parentCw ? "auth-spin-rev" : "auth-spin"}
          style={{ animationDuration: `${duration}s` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function Chip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold shadow-lg shadow-black/20 ${
        accent ? "bg-violet-500 text-white" : "bg-white text-[#0A2150]"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * A top earner's profile photo. Shows the default avatar when the creator has
 * not uploaded a photo (or the photo fails to load).
 */
function Avatar({
  earner,
  size = "md",
}: {
  earner: TopEarner;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const dim = size === "lg" ? "h-[4.5rem] w-[4.5rem]" : size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const src = earner.photoUrl && !failed ? earner.photoUrl : DEFAULT_AVATAR;
  return (
    <span
      className={`relative block overflow-hidden rounded-full bg-white ring-2 ring-white/70 shadow-lg shadow-black/25 ${dim}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </span>
  );
}

const OUTER: { a: number; label: string; accent?: boolean }[] = [
  { a: -78, label: "Creators" },
  { a: -28, label: "Verified clicks", accent: true },
  { a: 22, label: "Employers" },
  { a: 70, label: "USD payouts", accent: true },
  { a: 118, label: "Referrals" },
  { a: 160, label: "Publishers" },
  { a: 208, label: "Campaigns", accent: true },
];

const MIDDLE = [{ a: -50 }, { a: 40 }, { a: 130 }, { a: 220 }];

/**
 * Decorative orbit: role chips + avatars circling a centre creator. Motion-safe.
 * The centre shows the #1 top earner and the rings show #2 to #7, all ranked by
 * earnings. A top earner without a photo gets the default avatar. A ring slot is
 * left out when there are not enough top earners.
 */
export default function AuthOrbit() {
  const [earners, setEarners] = useState<TopEarner[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchTopEarners().then((list) => {
      if (!cancelled) setEarners(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const earner = (rank: number): TopEarner | undefined => earners[rank];

  return (
    <div className="auth-orbit" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[26em] w-[26em] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" style={{ fontSize: "var(--u)" }} />
      <div className="absolute left-1/2 top-1/2 h-[17em] w-[17em] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" style={{ fontSize: "var(--u)" }} />
      <div className="absolute left-1/2 top-1/2 h-[8.4em] w-[8.4em] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" style={{ fontSize: "var(--u)" }} />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 -m-6 rounded-full bg-violet-500/30 blur-2xl" />
        <div className="relative">
          <Avatar
            earner={earner(0) ?? { handle: "", name: "", photoUrl: null, paidUsd: 0 }}
            size="lg"
          />
        </div>
      </div>

      <div className="auth-spin absolute inset-0" style={{ animationDuration: "120s" }}>
        {OUTER.map((o) => (
          <Slot key={o.label} a={o.a} r={13} parentCw duration={120}>
            <Chip accent={o.accent}>{o.label}</Chip>
          </Slot>
        ))}
      </div>

      <div className="auth-spin-rev absolute inset-0" style={{ animationDuration: "90s" }}>
        {MIDDLE.map((m, i) => {
          const e = earner(i + 1);
          return e ? (
            <Slot key={m.a} a={m.a} r={8.5} parentCw={false} duration={90}>
              <Avatar earner={e} />
            </Slot>
          ) : null;
        })}
      </div>

      <div className="auth-spin absolute inset-0" style={{ animationDuration: "70s" }}>
        {earner(5) ? (
          <Slot a={200} r={4.2} parentCw duration={70}>
            <Avatar earner={earner(5) as TopEarner} size="sm" />
          </Slot>
        ) : null}
        {earner(6) ? (
          <Slot a={20} r={4.2} parentCw duration={70}>
            <Avatar earner={earner(6) as TopEarner} size="sm" />
          </Slot>
        ) : null}
      </div>
    </div>
  );
}
