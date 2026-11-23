import { Handshake, Heart, MousePointerClick, UserPlus, Zap, type LucideIcon } from "lucide-react";

export type BrandModel = {
  code: "PPC" | "PPR" | "PPL" | "PPA" | "PPE";
  label: string;
  short: string;
  icon: LucideIcon;
  /** Tile colours (matches the brand mockup: cool tones for the first three, warm for the last two). */
  tile: string;
  iconTone: string;
  bestFor: string;
  youPay: string;
  verified: string;
  example: string;
};

export const BRAND_MODELS: BrandModel[] = [
  {
    code: "PPC",
    label: "Pay Per Click",
    short: "Click",
    icon: MousePointerClick,
    tile: "border-sky-100 bg-sky-50/80",
    iconTone: "text-sky-600",
    bestFor: "Awareness, traffic and content or product launches.",
    youPay: "When a unique, verified visitor clicks through a creator's tracked link to your page.",
    verified: "Duplicate clicks are filtered out and suspicious traffic goes to review before it counts.",
    example: "Send readers to a new career guide or a product launch page.",
  },
  {
    code: "PPR",
    label: "Pay Per Registration",
    short: "Registration",
    icon: UserPlus,
    tile: "border-blue-100 bg-blue-50/80",
    iconTone: "text-blue-600",
    bestFor: "Course enrolments, hackathon and event sign-ups, new user accounts.",
    youPay: "When someone completes a registration through a creator's link and the registration is verified.",
    verified: "Registrations are verified before they count, and every one is traced back to its creator.",
    example: "A bootcamp pays for each learner who enrols, not for every visit.",
  },
  {
    code: "PPL",
    label: "Pay Per Lead",
    short: "Lead",
    icon: Handshake,
    tile: "border-violet-100 bg-violet-50/80",
    iconTone: "text-violet-600",
    bestFor: "Demo requests, enquiries and quote forms for SaaS, AI tools and services.",
    youPay: "For each qualified lead, meaning a person who leaves their contact details through the campaign.",
    verified: "You review the leads that come in and can dispute any that do not qualify.",
    example: "An AI tool pays for demo requests from people who actually asked.",
  },
  {
    code: "PPA",
    label: "Pay Per Action",
    short: "Action",
    icon: Zap,
    tile: "border-orange-100 bg-orange-50/80",
    iconTone: "text-orange-500",
    bestFor: "Job applications, app sign-ups or any other specific action you define.",
    youPay: "When the agreed action is completed and you confirm it.",
    verified: "You confirm or dispute each action from your dashboard before it is paid out.",
    example: "A recruitment platform pays per completed job application.",
  },
  {
    code: "PPE",
    label: "Pay Per Engagement",
    short: "Engagement",
    icon: Heart,
    tile: "border-rose-100 bg-rose-50/80",
    iconTone: "text-rose-500",
    bestFor: "Boosting a specific public post with likes, comments or reposts.",
    youPay: "When a creator's engagement is submitted with proof and you approve it.",
    verified: "You review each proof link or note and approve or reject it before any payment.",
    example: "Get a LinkedIn, Instagram or X post seen and shared by relevant creators.",
  },
];

export function modelByCode(code: BrandModel["code"]): BrandModel {
  return BRAND_MODELS.find((m) => m.code === code) ?? BRAND_MODELS[0];
}
