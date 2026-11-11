"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkle, Trophy } from "lucide-react";
import StatsBar from "@/components/Statsbar";
import RoleSection from "@/components/Rolesection";
import EarningCalculator from "@/components/Earningcalculator";
import OpportunityCard from "@/components/Opportunitydrops";
import HowItWorks from "@/components/HowItWorks";
import { Handshake, Briefcase, UserRound, Users, type LucideIcon } from "lucide-react";
import CreatedByCreatorsCard from "@/components/Createdbycreatorscard";
import TopCreators from "@/components/Topcreators";


interface Pillar {
  icon: LucideIcon;
}

const PILLARS: Pillar[] = [
  { icon: UserRound},
  { icon: Briefcase },
  { icon: Handshake },
  { icon: Users },
];



export default function HomePage() {
  return (
    <main className="">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F5FF] via-[#FAFAFF] to-white pt-[150px]">
        <div className="max-w-[1460px] mx-auto">
          <div className="relative mx-auto grid max-w-container grid-cols-1 items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-10">
            <div className="">
              <div className="bg-[#dee2ff] mb-4 rounded-[50px] px-5 py-1.5 inline-block text-[13px] font-semibold text-[#5d53f4]">
                  Turn your audience into opportunity
              </div>
              <h1 className="text-[38px] font-extrabold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-[46px] lg:text-[52px]">Your Audience<br /> Trusts You. <br />
                <span className="bg-gradient-to-r from-[#6547F5] via-[#5C55F4] to-[#3478F4] bg-clip-text text-transparent">Now Make Every</span><br />
                <span className="bg-gradient-to-r from-[#6547F5] to-[#3478F4] bg-clip-text text-transparent">Recommendation Count.</span>
              </h1>
              <p className="mt-5 text-[14px] leading-7 text-slate-500 sm:text-[15px]">Share relevant jobs, courses, campaigns and opportunities. Track real results and earn from qualified actions.</p>
              <div className="flex items-center gap-3 mt-4">
                <Link href="#" className="inline-flex items-center gap-2 hidden rounded-[10px] px-[30px] py-3.5 text-sm font-medium text-white transition-all duration-300 ease-out hover:scale-105 hover:bg-white/10 hover:text-white bg-gradient-to-r from-blue-600 to-purple-600">Start Earning <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></Link>
              </div>
            </div>
            <div className="relative z-[9]">
              <div className="pointer-events-none absolute right-[330px] top-[-70px] h-[420px] w-[420px] rounded-full bg-gradient-to-br from-[#8B7CFF] via-[#9810fa] to-transparent opacity-60 z-[-1] animate-[floatCircle_8s_ease-in-out_infinite]"/>
              <div className="pointer-events-none absolute right-[-120px] top-[80px] h-[520px] w-[520px] rounded-full bg-gradient-to-bl from-[#9810fa] via-[#C5DCFF] to-transparent opacity-60 z-[-1] animate-[floatCircleReverse_10s_ease-in-out_infinite]"/>

              <svg viewBox="0 0 24 24" fill="none" className="absolute left-[60px] top-[50px] w-[50px]">
                <defs>
                  <linearGradient id="instagramGradient" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFDC80" />
                    <stop offset="0.25" stopColor="#F77737" />
                    <stop offset="0.5" stopColor="#E1306C" />
                    <stop offset="0.75" stopColor="#C13584" />
                    <stop offset="1" stopColor="#833AB4" />
                  </linearGradient>
                </defs>
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="url(#instagramGradient)" strokeWidth="2"/>
                <circle cx="12" cy="12" r="4.2" stroke="url(#instagramGradient)" strokeWidth="2"/>
                <circle cx="17.4" cy="6.7" r="1.2" fill="#E1306C" />
              </svg>

              <svg viewBox="0 0 24 24" fill="none" className="absolute left-[20px] top-[140px] w-[50px]">
                  <path d="M21.58 7.19a2.75 2.75 0 0 0-1.94-1.94C17.92 4.75 12 4.75 12 4.75s-5.92 0-7.64.5a2.75 2.75 0 0 0-1.94 1.94C1.92 8.91 1.92 12 1.92 12s0 3.09.5 4.81a2.75 2.75 0 0 0 1.94 1.94c1.72.5 7.64.5 7.64.5s5.92 0 7.64-.5a2.75 2.75 0 0 0 1.94-1.94c.5-1.72.5-4.81.5-4.81s0-3.09-.5-4.81Z" fill="#FF0000"/>
                  <path d="m10 15.5 5-3.5-5-3.5v7Z" fill="white" />
              </svg>

              <svg viewBox="0 0 24 24" fill="none" className="absolute left-[10px] top-[230px] w-[50px]">
                <circle cx="12" cy="12" r="10" fill="#229ED9" />
                <path d="m17.6 7.35-2.08 9.82c-.16.69-.57.86-1.16.54l-3.18-2.34-1.53 1.47c-.17.17-.31.31-.63.31l.23-3.23 5.88-5.31c.26-.23-.06-.36-.4-.13L7.47 13.1 4.34 12.12c-.68-.21-.7-.68.14-1l12.25-4.72c.57-.21 1.07.14.87.95Z" fill="white"/>
              </svg>

              <div className="max-w-[500px]">
                <img src="images/banner-img.png" alt="" />
              </div>

              <svg viewBox="0 0 24 24" fill="none" className="absolute right-[330px] top-[50px] w-[50px]">
                <circle cx="12" cy="12" r="10" fill="#1877F2" />
                <path d="M13.45 19v-6.25h2.1l.32-2.44h-2.42V8.75c0-.71.2-1.2 1.22-1.2h1.3V5.37c-.22-.03-.98-.1-1.86-.1-1.84 0-3.1 1.12-3.1 3.18v1.86H8.92v2.44h2.09V19h2.44Z" fill="white" />
              </svg>

              <svg viewBox="0 0 24 24" fill="none" className="absolute right-[290px] top-[140px] w-[50px]">
                <circle cx="12" cy="12" r="10" fill="#25D366" />
                <path d="M17.45 6.55A7.68 7.68 0 0 0 12 4.3a7.7 7.7 0 0 0-6.67 11.56L4.25 19.7l3.94-1.03A7.7 7.7 0 0 0 19.7 12a7.68 7.68 0 0 0-2.25-5.45ZM12 18.2a6.2 6.2 0 0 1-3.16-.87l-.23-.14-2.34.61.62-2.28-.15-.24A6.2 6.2 0 1 1 12 18.2Z" fill="white" />
                <path d="M15.58 13.86c-.2-.1-1.17-.58-1.35-.65-.18-.07-.31-.1-.44.1-.13.2-.5.65-.61.78-.11.13-.23.15-.43.05-.2-.1-.83-.3-1.58-.95-.58-.52-.97-1.16-1.08-1.36-.11-.2-.01-.31.08-.41.09-.09.2-.23.3-.35.1-.12.13-.2.2-.33.07-.13.03-.25-.02-.35-.05-.1-.44-1.06-.6-1.45-.16-.38-.32-.33-.44-.34h-.37c-.13 0-.34.05-.52.25-.18.2-.68.67-.68 1.63s.7 1.89.8 2.02c.1.13 1.37 2.09 3.32 2.93.46.2.82.32 1.1.41.46.15.88.13 1.21.08.37-.06 1.17-.48 1.34-.94.17-.46.17-.85.12-.94-.05-.08-.18-.13-.38-.23Z" fill="white" />
              </svg>

              <svg viewBox="0 0 24 24" fill="none" className="absolute right-[270px] top-[230px] w-[50px]">
                <path d="M15.5 4c.25 1.92 1.32 3.05 3.25 3.17v2.72a8.02 8.02 0 0 1-3.22-.74v6.06c0 5.04-5.48 6.62-8.5 3.41-1.94-2.06-1.82-5.68.45-7.43 1.3-1 2.9-1.2 4.25-.74v2.88c-2.07-.7-3.76.74-3.16 2.61.55 1.7 3.68 1.93 4.32-.55V4h2.61Z" fill="#000000"/>
                <path d="M15.5 4c.25 1.92 1.32 3.05 3.25 3.17v1.1a7.8 7.8 0 0 1-3.25-1.02V13c0 5.04-5.48 6.62-8.5 3.41-.38-.4-.66-.86-.85-1.34.94.72 2.1.98 3.1.64 1.06-.36 2.08-1.27 2.33-2.57v-6.6h3.92V4Z" fill="#25F4EE" opacity=".9"/>
                <path d="M15.5 4c.25 1.92 1.32 3.05 3.25 3.17v1.1a7.8 7.8 0 0 1-3.25-1.02V13c0 5.04-5.48 6.62-8.5 3.41-.38-.4-.66-.86-.85-1.34.94.72 2.1.98 3.1.64 1.06-.36 2.08-1.27 2.33-2.57v-6.6h3.92V4Z" fill="#FE2C55" opacity=".75" transform="translate(-0.45 0.45)"/>
              </svg>

             <div className="absolute right-0 top-0 w-full max-w-[270px] overflow-visible rounded-[14px] border border-slate-200/70 bg-white/95 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.20)] backdrop-blur-xl">

                {/* Top Creator Badge */}
                <div className="absolute -top-4 left-5 z-10">
                  <div className="flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 px-3 py-1.5 shadow-[0_8px_20px_-8px_rgba(245,158,11,0.45)]">
                    <span className="text-sm leading-none">👑</span>
                    <span className="text-[10px] font-bold tracking-wide text-amber-800">
                      Top Creator This Week
                    </span>
                  </div>
                </div>

                {/* Profile */}
                <div className="px-4 pb-4 pt-8">

                  <div className="flex items-center gap-3.5">

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="h-[72px] w-[72px] overflow-hidden rounded-full bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-[2px] shadow-md">
                        <div className="h-full w-full overflow-hidden rounded-full bg-white">
                          <svg
                            viewBox="0 0 100 100"
                            className="h-full w-full"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect width="100" height="100" fill="#f5dfe0" />
                            <path
                              d="M17 100 Q17 67 50 67 Q83 67 83 100"
                              fill="#243b70"
                            />
                            <path
                              d="M25 47 Q17 12 50 10 Q83 12 76 47 L80 74 Q66 65 50 65 Q34 65 20 74Z"
                              fill="#211a20"
                            />
                            <ellipse
                              cx="50"
                              cy="43"
                              rx="23"
                              ry="29"
                              fill="#d99a76"
                            />
                            <path
                              d="M27 37 Q26 9 51 11 Q77 10 74 39 Q65 24 51 24 Q38 24 27 37Z"
                              fill="#211a20"
                            />
                            <path
                              d="M30 37 Q26 56 22 70 L16 77 L18 38Z"
                              fill="#211a20"
                            />
                            <path
                              d="M70 37 Q74 56 78 70 L84 77 L82 38Z"
                              fill="#211a20"
                            />
                            <circle cx="42" cy="43" r="1.8" fill="#30201e" />
                            <circle cx="58" cy="43" r="1.8" fill="#30201e" />
                            <path
                              d="M44 55 Q50 60 57 55"
                              fill="none"
                              stroke="#9c454b"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M38 100 L43 75 L50 83 L57 75 L62 100"
                              fill="#ffffff"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Online indicator */}
                      <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-emerald-500" />
                    </div>

                    {/* Profile Info */}
                    <div className="min-w-0 flex-1">

                      <div className="flex items-center gap-1.5">
                        <h2 className="truncate text-[15px] font-extrabold tracking-[-0.01em] text-slate-900">
                          Sneha Verma
                        </h2>

                        {/* Verified */}
                        <svg
                          className="h-[17px] w-[17px] shrink-0 text-blue-500"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2.5l2.4 1.2 2.7-.2 1.5 2.2 2.4 1.2-.2 2.7 1.2 2.4-1.2 2.4.2 2.7-2.4 1.2-1.5 2.2-2.7-.2L12 23l-2.4-1.2-2.7.2-1.5-2.2L3 18.6l.2-2.7L2 13.5l1.2-2.4L3 8.4l2.4-1.2 1.5-2.2 2.7.2L12 2.5z" />
                          <path
                            d="M8 12.3l2.5 2.5 5.5-5.5"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>

                      <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                        Career &amp; Job Updates
                      </p>

                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span className="text-[11px] font-medium text-slate-500">
                          52.4K Audience
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Earnings Card */}
                <div className="mx-3 rounded-[18px] border border-emerald-100/80 bg-gradient-to-br from-[#ecfdf5] via-[#e7f9f0] to-[#dcf7e9] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">

                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700/80">
                        Total Earnings
                      </p>

                      <p className="mt-0.5 text-[10px] font-medium text-emerald-700/60">
                        This Week
                      </p>
                    </div>

                    {/* Growth */}
                    <div className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-emerald-600 shadow-sm">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 17L17 7" />
                        <path d="M9 7h8v8" />
                      </svg>

                      <span className="text-[11px] font-extrabold">
                        +32%
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-[21px] font-bold text-emerald-600">
                      ₹
                    </span>

                    <span className="text-[24px] font-black leading-none tracking-[-0.04em] text-emerald-600">
                      18,420
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 flex items-center border-t border-emerald-200/60 pt-3">

                    <div className="flex-1">
                      <p className="text-[14px] font-extrabold text-slate-700">
                        1,248
                      </p>

                      <p className="mt-0.5 text-[9px] font-medium text-slate-500">
                        Qualified Clicks
                      </p>
                    </div>

                    <div className="h-7 w-px bg-emerald-200/70" />

                    <div className="flex-1 pl-4">
                      <p className="text-[14px] font-extrabold text-slate-700">
                        6
                      </p>

                      <p className="mt-0.5 text-[9px] font-medium text-slate-500">
                        Campaigns
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Quote */}
                <div className="flex items-center gap-3 px-4 py-4">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50">
                    <svg
                      className="h-4 w-4 text-rose-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z" />
                    </svg>
                  </div>

                  <p className="text-[10px] font-medium leading-[1.5] text-slate-500">
                    “Sharing the right opportunities
                    <br />
                    has never felt this rewarding!”
                  </p>
                </div>

              </div>


            </div>
          </div>
        </div>

      </section>
      {/*  */}
      <section className="bg-white">
        <div className="max-w-[1460px] mx-auto">
          <div className="relative flex h-[42px] w-full overflow-hidden rounded-full border border-slate-100 bg-white shadow-[0_8px_30px_rgba(60,80,120,0.08)]">
            <div className="relative z-20 flex shrink-0 items-center gap-2 bg-white px-5 shadow-[8px_0_15px_-12px_rgba(15,23,42,0.25)]">
              <span className="text-base">⚡</span>

              <span className="whitespace-nowrap text-[11px] font-bold text-slate-700">
                Live Earnings
              </span>
            </div>
            <div className="relative min-w-0 flex-1 overflow-hidden">

              <div className="flex h-full w-max items-center animate-live-marquee">

                {/* SET 1 */}
                <div className="flex shrink-0 items-center whitespace-nowrap">

                  <div className="px-6 text-[12px] font-medium text-slate-600">
                    <strong className="text-slate-700">Rohit</strong>{" "}
                    (Tech Updates) just earned{" "}
                    <strong className="text-blue-600">₹12,450</strong>
                  </div>

                  <span className="text-slate-300">•</span>

                  <div className="px-6 text-[12px] font-medium text-slate-600">
                    <strong className="text-slate-700">Priya</strong>{" "}
                    (Govt. Jobs) just earned{" "}
                    <strong className="text-blue-600">₹8,320</strong>
                  </div>

                  <span className="text-slate-300">•</span>

                  <div className="px-6 text-[12px] font-medium text-slate-600">
                    <strong className="text-slate-700">Arjun</strong>{" "}
                    (Study Zone) just earned{" "}
                    <strong className="text-blue-600">₹6,780</strong>
                  </div>

                  <span className="text-slate-300">•</span>

                  <div className="px-6 text-[12px] font-medium text-slate-600">
                    <strong className="text-slate-700">Neha</strong>{" "}
                    (Freshers Help) just earned{" "}
                    <strong className="text-slate-400">₹5,430</strong>
                  </div>

                  <span className="px-5 text-slate-300">•</span>

                  <div className="flex items-center gap-1.5 px-5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[12px] font-semibold text-slate-600">
                      Live
                    </span>
                  </div>
                </div>

                {/* SET 2 - seamless duplicate */}
                <div className="flex shrink-0 items-center whitespace-nowrap">

                  <div className="px-6 text-[12px] font-medium text-slate-600">
                    <strong className="text-slate-700">Rohit</strong>{" "}
                    (Tech Updates) just earned{" "}
                    <strong className="text-blue-600">₹12,450</strong>
                  </div>

                  <span className="text-slate-300">•</span>

                  <div className="px-6 text-[12px] font-medium text-slate-600">
                    <strong className="text-slate-700">Priya</strong>{" "}
                    (Govt. Jobs) just earned{" "}
                    <strong className="text-blue-600">₹8,320</strong>
                  </div>

                  <span className="text-slate-300">•</span>

                  <div className="px-6 text-[12px] font-medium text-slate-600">
                    <strong className="text-slate-700">Arjun</strong>{" "}
                    (Study Zone) just earned{" "}
                    <strong className="text-blue-600">₹6,780</strong>
                  </div>

                  <span className="text-slate-300">•</span>

                  <div className="px-6 text-[12px] font-medium text-slate-600">
                    <strong className="text-slate-700">Neha</strong>{" "}
                    (Freshers Help) just earned{" "}
                    <strong className="text-slate-400">₹5,430</strong>
                  </div>

                  <span className="px-5 text-slate-300">•</span>

                  <div className="flex items-center gap-1.5 px-5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[12px] font-semibold text-slate-600">
                      Live
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
 
      <StatsBar />

      {/*  */}
      <section className="pt-[80px] pb-[80px]">
        <div className="max-w-[1460px] mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-indigo-950 sm:text-4xl">Choose Your Role</h2>
            <p className="mt-3 text-balance text-sm leading-relaxed text-slate-600 sm:text-base">Whether you have an audience or need talent — we've got you covered.</p>
          </div>
          <RoleSection/>
        </div>
      </section>
      {/*  */}

      <section className="bg-white pt-[80px] pb-[80px]">
        <div className="max-w-[1460px] mx-auto">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <OpportunityCard />
            </div>
            <div className="lg:col-span-4">
              <EarningCalculator />
            </div>
          </div>
        </div>
      </section>

    <HowItWorks/>

    <section className="bg-white pt-[80px] pb-[80px]">
      <div className="max-w-[1460px] mx-auto">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <article className={`relative isolate min-h-[11.5rem] overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-pink-100 via-violet-100 to-sky-100 px-5 pt-5 shadow-[0_10px_30px_rgba(124,58,237,0.12)] `}>
              <div aria-hidden="true" className="absolute -bottom-16 -right-10 -z-10 h-56 w-56 rounded-full bg-violet-300/40 blur-3xl"/>          
                <div className="grid grid-cols-[1.05fr_1fr] items-end gap-2">
                    {/* Text */}
                    <div className="pb-5">
                      <h3 className="flex items-center gap-2 text-xl font-extrabold leading-tight tracking-tight text-indigo-950">
                        <Trophy className="h-7 w-7 shrink-0 fill-amber-300 text-amber-600" strokeWidth={1.75} aria-hidden="true" />Creator Squads</h3>
                        <p className="mt-2 max-w-[14rem] text-sm leading-relaxed text-slate-700">Team up. Share more. Earn more.</p>
            
                      <Link href="#" className="group mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:from-violet-600 hover:to-indigo-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-300" >Join a Squad
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true"/>
                      </Link>
                    </div>
            
                    {/* Photo: card ke neeche edge se chipka hua */}
                    <div className="relative h-36 w-full">
                      <Image src="/images/squad.png" alt='' fill sizes="(min-width: 1024px) 200px, 45vw" className="object-contain object-bottom" />
                    </div>
                </div>
            </article>
          </div>
          <div className="lg:col-span-6">
            <TopCreators />
          </div>
          <div className="lg:col-span-3">
            <CreatedByCreatorsCard />
          </div>
        </div>
      </div>
    </section>
      
    </main>
  );
}