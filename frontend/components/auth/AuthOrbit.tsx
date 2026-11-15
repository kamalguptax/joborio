import type { CSSProperties } from "react";
import Character from "@/components/art/Character";

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
        accent ? "bg-violet-500 text-white" : "bg-white text-[#0F1B3D]"
      }`}
    >
      {children}
    </span>
  );
}

function Avatar({ hoodie, bg, size = "md" }: { hoodie: string; bg: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "h-[4.5rem] w-[4.5rem]" : size === "sm" ? "h-9 w-9" : "h-12 w-12";
  return (
    <span
      className={`block overflow-hidden rounded-full ring-2 ring-white/70 shadow-lg shadow-black/25 ${dim}`}
      style={{ background: bg }}
    >
      <Character hoodie={hoodie} className="h-full w-full" />
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

const MIDDLE = [
  { a: -50, hoodie: "#8B5CF6", bg: "#EDE9FE" },
  { a: 40, hoodie: "#2563EB", bg: "#DBEAFE" },
  { a: 130, hoodie: "#EC4899", bg: "#FCE7F3" },
  { a: 220, hoodie: "#0EA5E9", bg: "#E0F2FE" },
];

/** Decorative orbit: role chips + avatars circling a centre creator. Pure CSS, motion-safe. */
export default function AuthOrbit() {
  return (
    <div className="auth-orbit" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[26em] w-[26em] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" style={{ fontSize: "var(--u)" }} />
      <div className="absolute left-1/2 top-1/2 h-[17em] w-[17em] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" style={{ fontSize: "var(--u)" }} />
      <div className="absolute left-1/2 top-1/2 h-[8.4em] w-[8.4em] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" style={{ fontSize: "var(--u)" }} />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 -m-6 rounded-full bg-violet-500/30 blur-2xl" />
        <div className="relative">
          <Avatar hoodie="#6D3CF0" bg="#F5F3FF" size="lg" />
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
        {MIDDLE.map((m) => (
          <Slot key={m.a} a={m.a} r={8.5} parentCw={false} duration={90}>
            <Avatar hoodie={m.hoodie} bg={m.bg} />
          </Slot>
        ))}
      </div>

      <div className="auth-spin absolute inset-0" style={{ animationDuration: "70s" }}>
        <Slot a={200} r={4.2} parentCw duration={70}>
          <Avatar hoodie="#14B8A6" bg="#CCFBF1" size="sm" />
        </Slot>
        <Slot a={20} r={4.2} parentCw duration={70}>
          <Avatar hoodie="#F59E0B" bg="#FEF3C7" size="sm" />
        </Slot>
      </div>
    </div>
  );
}
