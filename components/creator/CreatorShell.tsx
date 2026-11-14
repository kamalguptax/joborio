"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Briefcase,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Gift,
  LayoutDashboard,
  Link2,
  LogOut,
  Megaphone,
  MousePointerClick,
  Settings,
  Sparkles,
  Trophy,
  Wallet,
} from "lucide-react";
import { FaLinkedinIn, FaTelegramPlane, FaWhatsapp } from "react-icons/fa";
import AuthLogo from "@/components/auth/AuthLogo";
import CreatorNotificationBell from "@/components/creator/CreatorNotificationBell";
import { clearAuthToken } from "@/lib/auth/session";
import { logoutApi } from "@/lib/api/auth";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Opens outside the dashboard (public page), in a new tab. */
  external?: boolean;
  isActive?: (pathname: string) => boolean;
};

const mobileNav = [
  { href: "/creator/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/creator/opportunities", label: "Jobs", icon: Briefcase },
  { href: "/creator/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/creator/performance", label: "Insights", icon: BarChart3 },
  { href: "/creator/earnings", label: "Earn", icon: Wallet },
];

function initials(name?: string, fallback?: string): string {
  const source = (name || fallback || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

function Avatar({ label, size = 36 }: { label: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3F2AA8,#7C3AED)] font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {label}
    </span>
  );
}

export default function CreatorShell({
  children,
  handle,
  name,
  email,
  bio,
}: {
  children: React.ReactNode;
  handle?: string;
  name?: string;
  email?: string;
  bio?: string | null;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const publicPath = handle ? `/p/${handle}` : null;
  const publicUrl = publicPath && origin ? `${origin}${publicPath}` : null;
  const displayName = name || (handle ? `@${handle}` : "Your account");
  const avatarLabel = initials(name, handle);

  const nav: NavItem[] = [
    { href: "/creator/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(publicPath
      ? [{ href: publicPath, label: "My Link", icon: Link2, external: true } as NavItem]
      : []),
    { href: "/creator/opportunities", label: "Opportunities", icon: Briefcase },
    { href: "/creator/campaigns", label: "Campaigns", icon: Megaphone },
    { href: "/creator/ai-studio", label: "Post Studio", icon: Sparkles },
    { href: "/creator/clicks", label: "Clicks", icon: MousePointerClick },
    {
      href: "/creator/performance",
      label: "Insights",
      icon: BarChart3,
      isActive: (p) => p === "/creator/performance" || p.startsWith("/creator/registrations"),
    },
    {
      href: "/creator/earnings",
      label: "Earnings",
      icon: Wallet,
      isActive: (p) =>
        p === "/creator/earnings" ||
        p.startsWith("/creator/payout") ||
        p.startsWith("/creator/trust-tier"),
    },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy, external: true },
    { href: "/creator/referrals", label: "Refer & Earn", icon: Gift },
  ];

  const signOut = async () => {
    try {
      await logoutApi();
    } catch {
      /* ignore */
    }
    clearAuthToken();
    window.location.href = "/login";
  };

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const shareText = "Check out the jobs and opportunities I share on JobOrio:";
  const shareLinks = publicUrl
    ? [
        {
          label: "WhatsApp",
          icon: FaWhatsapp,
          href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${publicUrl}`)}`,
        },
        {
          label: "LinkedIn",
          icon: FaLinkedinIn,
          href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`,
        },
        {
          label: "Telegram",
          icon: FaTelegramPlane,
          href: `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(shareText)}`,
        },
      ]
    : [];

  const iconBtn = (active: boolean) =>
    `inline-flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 ${
      active
        ? "border-violet-300 bg-violet-50 text-violet-700"
        : "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:text-violet-700"
    }`;

  return (
    <div className="min-h-screen bg-[#F7F7FD] text-[#0F1B3D]">
      {/* ============ LEFT SIDEBAR — fixed, nav scrolls inside ============ */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="shrink-0 px-6 pt-6">
          <AuthLogo className="h-8" />
        </div>

        <div ref={menuRef} className="relative shrink-0 px-4 pt-5">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
          >
            <Avatar label={avatarLabel} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{displayName}</span>
              {handle ? (
                <span className="block truncate text-xs text-slate-500">@{handle}</span>
              ) : null}
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-slate-400 transition ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute left-4 right-4 top-[calc(100%-0.25rem)] z-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
            >
              {email ? (
                <p className="truncate px-3 py-2 text-xs text-slate-500">{email}</p>
              ) : null}
              <Link
                role="menuitem"
                href="/creator/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Settings size={16} /> Settings
              </Link>
              {publicPath ? (
                <Link
                  role="menuitem"
                  href={publicPath}
                  target="_blank"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink size={16} /> Public page
                </Link>
              ) : null}
              <button
                type="button"
                role="menuitem"
                onClick={signOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          ) : null}
        </div>

        <nav
          aria-label="Creator"
          className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-4 [scrollbar-width:thin]"
        >
          {nav.map(({ href, label, icon: Icon, external, isActive }) => {
            const active = !external && (isActive ? isActive(pathname) : pathname === href);
            return (
              <Link
                key={href}
                href={href}
                target={external ? "_blank" : undefined}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 ${
                  active
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0F1B3D]"
                }`}
              >
                <Icon size={19} className={active ? "text-violet-600" : "text-slate-400"} />
                <span className="flex-1">{label}</span>
                {external ? <ExternalLink size={13} className="text-slate-300" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={19} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <div className="lg:pl-[264px] 2xl:pr-[380px]">
        <div className="sticky top-0 z-20 flex h-16 items-center justify-between bg-[#F7F7FD]/85 px-5 backdrop-blur lg:justify-end lg:px-8">
          <div className="lg:hidden">
            <AuthLogo className="h-7" />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/creator/settings"
              aria-label="Settings"
              title="Settings"
              className={iconBtn(
                pathname === "/creator/settings" || pathname.startsWith("/creator/job-preferences"),
              )}
            >
              <Settings size={18} />
            </Link>
            <CreatorNotificationBell />
          </div>
        </div>

        <div className="mx-auto max-w-[1100px] px-5 pb-28 pt-2 lg:px-8 lg:pb-14">{children}</div>
      </div>

      {/* ============ RIGHT PANEL — your public profile (wide screens) ============ */}
      <aside
        aria-label="Your public profile"
        className="fixed inset-y-0 right-0 z-20 hidden w-[380px] overflow-y-auto border-l border-slate-200 bg-white [scrollbar-width:thin] 2xl:block"
      >
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50/70 pl-4 pr-1.5">
              <Link2 size={16} className="shrink-0 text-violet-600" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                {publicUrl ? publicUrl.replace(/^https?:\/\//, "") : "Your link will appear here"}
              </span>
              <button
                type="button"
                onClick={copyLink}
                disabled={!publicUrl}
                aria-label="Copy link"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white hover:text-violet-700 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </button>
            </div>
            <Avatar label={avatarLabel} size={44} />
          </div>

          <div className="mt-6 overflow-hidden rounded-[22px] border border-slate-200">
            <div className="relative h-28 bg-[linear-gradient(135deg,#0B1D4F_0%,#3F2AA8_60%,#7C3AED_100%)]">
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl"
              />
            </div>
            <div className="px-5 pb-6">
              <div className="-mt-10">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3F2AA8,#7C3AED)] text-2xl font-bold text-white ring-4 ring-white">
                  {avatarLabel}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-bold tracking-tight">{displayName}</h2>
              {handle ? <p className="text-sm text-slate-500">@{handle}</p> : null}
              {bio ? (
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{bio}</p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Add a short bio in settings so your audience knows what you share.
                </p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2">
                {publicPath ? (
                  <Link
                    href={publicPath}
                    target="_blank"
                    className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#0F1B3D] text-sm font-semibold text-white transition hover:bg-[#1B2C5E]"
                  >
                    <ExternalLink size={15} /> View page
                  </Link>
                ) : (
                  <span />
                )}
                <Link
                  href="/creator/settings"
                  className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Settings size={15} /> Edit profile
                </Link>
              </div>
            </div>
          </div>

          {shareLinks.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Share your link</h3>
              <p className="mt-1 text-[13px] leading-5 text-slate-500">
                More clicks on your page means more verified earnings.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {shareLinks.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50/40"
                  >
                    <Icon size={15} aria-hidden="true" />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {/* ============ MOBILE BOTTOM NAV ============ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        {mobileNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-semibold ${
                active ? "text-violet-600" : "text-slate-400"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
