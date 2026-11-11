"use client";

import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Lock,
  Send,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";

type PlatformKey = "instagram" | "whatsapp" | "telegram";

type SocialData = Record<PlatformKey, number>;

type Creator = {
  country: string;
  countryColor: string;
  name: string;
  image: string;
  followers: string;
  social: SocialData;
};

const flagByCountry: Record<string, string> = {
  India: "🇮🇳",
  USA: "🇺🇸",
  UK: "🇬🇧",
};

const platformMeta: Record<
  PlatformKey,
  {
    label: string;
    color: string;
    bg: string;
  }
> = {
  instagram: {
    label: "Instagram",
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
  whatsapp: {
    label: "WhatsApp",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  telegram: {
    label: "Telegram",
    color: "text-sky-500",
    bg: "bg-sky-50",
  },
};

const creators: Creator[] = [
  {
    country: "India",
    countryColor: "bg-blue-600",
    name: "Riya Sharma",
    image:
      "https://images.unsplash.com/photo-1654110455429-cf322b40a906?q=80&w=880&auto=format&fit=crop",
    followers: "1.2M",
    social: {
      instagram: 1_200_000,
      whatsapp: 45_000,
      telegram: 180_000,
    },
  },
  {
    country: "USA",
    countryColor: "bg-purple-600",
    name: "Alex Carter",
    image:
      "https://images.unsplash.com/photo-1654110455429-cf322b40a906?q=80&w=880&auto=format&fit=crop",
    followers: "850K",
    social: {
      instagram: 320_000,
      whatsapp: 12_000,
      telegram: 850_000,
    },
  },
  {
    country: "UK",
    countryColor: "bg-pink-500",
    name: "Emma Wilson",
    image:
      "https://images.unsplash.com/photo-1654110455429-cf322b40a906?q=80&w=880&auto=format&fit=crop",
    followers: "760K",
    social: {
      instagram: 760_000,
      whatsapp: 8_500,
      telegram: 95_000,
    },
  },
];

function getTopPlatform(social: SocialData): PlatformKey {
  return (Object.keys(social) as PlatformKey[]).reduce((top, key) =>
    social[key] > social[top] ? key : top
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }

  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(0)}K`;
  }

  return `${n}`;
}

function PlatformIcon({
  platform,
  className = "",
}: {
  platform: PlatformKey;
  className?: string;
}) {
  if (platform === "instagram") {
    return (
       <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="5"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle
      cx="12"
      cy="12"
      r="4"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle
      cx="17.5"
      cy="6.5"
      r="1"
      fill="currentColor"
    />
  </svg>
    );
  }

  if (platform === "whatsapp") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
      >
        <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.44 1.33 4.94L2 22l5.24-1.37a9.9 9.9 0 0 0 4.8 1.23h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2zm5.8 14.13c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.15-4.9-4.34-.14-.19-1.17-1.55-1.17-2.96s.73-2.1 1-2.39c.24-.26.53-.32.7-.32h.5c.16 0 .38-.03.58.44.24.57.8 1.98.87 2.12.07.14.12.3.02.49-.1.19-.15.31-.3.48-.15.17-.31.38-.44.51-.15.14-.3.3-.13.58.17.29.75 1.24 1.62 2.01 1.11 1 2.05 1.31 2.34 1.46.29.14.46.12.63-.07.17-.19.71-.83.9-1.11.19-.29.38-.24.63-.14.26.1 1.65.78 1.94.92.29.14.48.21.55.33.07.12.07.68-.17 1.32z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M22 3.5 2.6 11.3c-1.3.53-1.3 1.28-.24 1.6l4.95 1.55 1.9 5.97c.23.63.4.88.82.88.4 0 .58-.19.8-.4l1.98-1.9 4.13 3.05c.76.42 1.3.2 1.5-.7l2.7-12.7c.3-1.14-.42-1.66-1.14-1.35zM8.7 13.94l9.4-5.93c.44-.27.85-.12.52.18l-7.9 7.13-.31 3.3z" />
    </svg>
  );
}

export default function CreatorsSection() {
  return (
    <section className="relative overflow-hidden bg-[#fff9fd] py-20 sm:py-24 lg:py-28">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-blue-100/50 blur-[110px]" />

      <div className="pointer-events-none absolute right-[-160px] top-1/3 h-[420px] w-[420px] rounded-full bg-purple-100/60 blur-[120px]" />

      <div className="pointer-events-none absolute bottom-[-120px] left-1/3 h-[360px] w-[360px] rounded-full bg-pink-100/50 blur-[110px]" />

      <div className="relative mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-10">

        {/* =====================================================
            MAIN GRID
        ===================================================== */}

        <div className="grid items-center gap-12 lg:grid-cols-[0.75fr_1.25fr] xl:gap-20">

          {/* =================================================
              LEFT CONTENT
          ================================================= */}

          <div className="relative">

            {/* Eyebrow */}

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-purple-600 shadow-sm">

              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <Sparkles size={12} />
              </span>

              Top Creators
            </div>

            {/* Heading */}

            <h2 className="max-w-[560px] text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-[#172b63] sm:text-5xl">

              Meet the creators

              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                shaping opportunities.
              </span>

            </h2>

            {/* Description */}

            <p className="mt-5 max-w-[530px] text-sm leading-7 text-slate-500 sm:text-base">
              Discover creators who share real opportunities with their
              communities. Explore their audience reach and content — while
              keeping private social profiles protected.
            </p>

            {/* Mini Stats */}

            <div className="mt-8 grid max-w-[480px] grid-cols-3 border-y border-slate-200 py-5">

              <div>
                <div className="text-xl font-bold text-[#172b63]">
                  10K+
                </div>

                <div className="mt-1 text-[11px] text-slate-400">
                  Creators
                </div>
              </div>

              <div className="border-l border-slate-200 pl-4">
                <div className="text-xl font-bold text-[#172b63]">
                  50+
                </div>

                <div className="mt-1 text-[11px] text-slate-400">
                  Countries
                </div>
              </div>

              <div className="border-l border-slate-200 pl-4">
                <div className="text-xl font-bold text-[#172b63]">
                  1M+
                </div>

                <div className="mt-1 text-[11px] text-slate-400">
                  Reach
                </div>
              </div>

            </div>

            {/* CTA */}

            <div className="mt-7 flex flex-wrap gap-3">

              <a
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-purple-500/30"
              >
                Become a Creator

                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>

              <a
                href="/creators"
                className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-6 py-3.5 text-sm font-semibold text-[#172b63] transition hover:border-purple-200 hover:bg-purple-50"
              >
                Explore Creators

                <ArrowUpRight size={16} className="text-purple-600" />
              </a>

            </div>

            {/* Trust Note */}

            <div className="mt-7 flex items-center gap-2 text-xs text-slate-400">

              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check size={13} strokeWidth={3} />
              </span>

              Social profiles remain protected for registered employers.

            </div>

          </div>

          {/* =================================================
              CREATOR CARDS
          ================================================= */}

          <div className="relative">

            {/* Desktop background panel */}

            <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-70 blur-sm" />

            <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-3">

              {creators.map((creator) => {

                const topPlatform = getTopPlatform(creator.social);

                return (
                  <article
                    key={creator.name}
                    className="group relative overflow-hidden rounded-[15px] border border-slate-200/80 bg-white p-3.5 shadow-[0_15px_45px_rgba(23,43,99,0.07)] transition-all duration-300 hover:-translate-y-2 hover:border-purple-200 hover:shadow-[0_25px_65px_rgba(124,58,237,0.13)]"
                  >

                    {/* Country */}

                    <div
                      className={`absolute left-6 top-6 z-20 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold text-white shadow-lg ${creator.countryColor}`}
                    >
                      <span className="text-xs">
                        {flagByCountry[creator.country]}
                      </span>

                      {creator.country}
                    </div>

                    {/* Image */}

                    <div className="relative overflow-hidden rounded-[10px] bg-slate-100">

                      <img
                        src={creator.image}
                        alt={creator.name}
                        className="h-[230px] w-full object-cover transition duration-700 group-hover:scale-105"
                      />

                      {/* Gradient */}

                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#172b63]/50 to-transparent opacity-60" />

                      {/* Followers */}

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">

                        <div className="rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur-md">
                          {creator.followers} followers
                        </div>

                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-lg">
                          <Users size={14} />
                        </div>

                      </div>

                    </div>

                    {/* Creator Info */}

                    <div className="px-1 pt-4">

                      <div className="flex items-center gap-1.5">

                        <h3 className="truncate text-[15px] font-bold text-[#172b63]">
                          {creator.name}
                        </h3>

                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                          <Check size={10} strokeWidth={3} />
                        </span>

                      </div>

                      <p className="mt-1 text-[11px] text-slate-400">
                        Verified Creator
                      </p>

                    </div>

                    {/* Social Platforms */}

                    <div className="mt-4 grid grid-cols-3 gap-1.5">

                      {(Object.keys(creator.social) as PlatformKey[]).map(
                        (platform) => {

                          const isTop = platform === topPlatform;

                          return (
                            <div
                              key={platform}
                              title={`${platformMeta[platform].label}: ${formatCount(
                                creator.social[platform]
                              )}`}
                              className={`rounded-xl px-1 py-2 text-center transition ${
                                isTop
                                  ? `bg-gradient-to-b from-purple-50 to-blue-50 ring-1 ring-purple-200`
                                  : "bg-slate-50"
                              }`}
                            >

                              <PlatformIcon
                                platform={platform}
                                className={`mx-auto h-3.5 w-3.5 ${
                                  isTop
                                    ? platformMeta[platform].color
                                    : "text-slate-400"
                                }`}
                              />

                              <div
                                className={`mt-1 text-[9px] font-bold ${
                                  isTop
                                    ? "text-[#172b63]"
                                    : "text-slate-400"
                                }`}
                              >
                                {formatCount(creator.social[platform])}
                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                    {/* Profile */}

                    <button
                      type="button"
                      className="group/profile mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-slate-50 py-2.5 text-[11px] font-bold text-[#172b63] transition duration-300 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white"
                    >
                      <Lock
                        size={13}
                        className="transition-transform group-hover/profile:scale-90"
                      />

                      View Profile

                      <ArrowRight
                        size={13}
                        className="transition-transform group-hover/profile:translate-x-0.5"
                      />
                    </button>

                  </article>
                );
              })}

            </div>

            {/* Bottom Note */}

            <div className="relative mx-auto mt-5 flex max-w-[620px] items-center justify-center gap-2 text-center text-[11px] text-slate-400">

              <Lock size={12} className="text-purple-500" />

              Social handles are visible only to authorized employers.

            </div>

          </div>

        </div>

        {/* =====================================================
            BOTTOM FEATURE STRIP
        ===================================================== */}

        <div className="mt-16 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-3 lg:mt-20">

          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={18} />
            </div>

            <div>
              <div className="text-sm font-bold text-[#172b63]">
                Real Communities
              </div>

              <div className="text-xs text-slate-400">
                Authentic creator audiences
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <WalletCards size={18} />
            </div>

            <div>
              <div className="text-sm font-bold text-[#172b63]">
                Monetization
              </div>

              <div className="text-xs text-slate-400">
                Turn reach into opportunities
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-500">
              <Send size={18} />
            </div>

            <div>
              <div className="text-sm font-bold text-[#172b63]">
                Easy Sharing
              </div>

              <div className="text-xs text-slate-400">
                Share opportunities instantly
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}