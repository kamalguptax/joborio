export type PostPlatform =
  | "linkedin"
  | "whatsapp"
  | "telegram"
  | "instagram"
  | "youtube"
  | "facebook"
  | "x"
  | "reel";

export type PostStudioPick = {
  id: string;
  title: string;
  subtitle?: string;
  badge: string;
  rateText?: string;
  shareUrl: string;
  /** Optional job posting details for richer drafts. */
  company?: string;
  location?: string;
  experience?: string;
  qualification?: string;
  salary?: string;
  jobType?: string;
  skills?: string[];
  summary?: string;
  category?: string;
};

export const POST_PLATFORMS: Array<{
  id: PostPlatform;
  label: string;
  hint: string;
}> = [
  {
    id: "linkedin",
    label: "LinkedIn",
    hint: "Detailed hiring post with location, requirements, and apply link.",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    hint: "Direct & easy to forward to groups.",
  },
  {
    id: "telegram",
    label: "Telegram",
    hint: "Clean channel / group post.",
  },
  {
    id: "instagram",
    label: "Instagram",
    hint: "Hook caption + bio/link CTA + hashtags.",
  },
  {
    id: "youtube",
    label: "YouTube",
    hint: "Description / pinned comment + hook.",
  },
  {
    id: "reel",
    label: "Reel / Short",
    hint: "Hook script + caption for short video.",
  },
  {
    id: "facebook",
    label: "Facebook",
    hint: "Community & feed post.",
  },
  {
    id: "x",
    label: "X / Twitter",
    hint: "Short post under character limits.",
  },
];

function first(picks: PostStudioPick[]): PostStudioPick {
  return picks[0]!;
}

function companyName(p: PostStudioPick): string {
  return (p.company || "").trim() || "Hiring company";
}

function locationLabel(p: PostStudioPick): string {
  return (p.location || "").trim();
}

function cityOnly(p: PostStudioPick): string {
  return locationLabel(p).split(",")[0]?.trim() || locationLabel(p);
}

function hashToken(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9]+/g, "");
  return cleaned ? `#${cleaned}` : "";
}

function roleTag(title: string): string {
  const words = title
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .slice(0, 3);
  if (words.length === 0) return "";
  return `#${words.join("")}`;
}

function minimumRequirements(p: PostStudioPick): string {
  const qual = p.qualification?.trim();
  const exp = p.experience?.trim();
  if (qual && exp) {
    return `${qual}; and ${exp}.`;
  }
  const single = qual || exp;
  if (single) {
    return single.endsWith(".") ? single : `${single}.`;
  }
  if (p.summary?.trim()) return p.summary.trim();
  if (p.subtitle?.trim()) return p.subtitle.trim();
  return "See the apply link for full requirements.";
}

function jobHashtags(p: PostStudioPick, extras: string[] = []): string {
  const company = companyName(p);
  const loc = cityOnly(p);
  const tags = [
    company && company !== "Hiring company" ? hashToken(company) : "",
    roleTag(p.title),
    /engineer/i.test(p.title) ? "#EngineeringJobs" : "",
    /engineer/i.test(p.title) ? "#EngineeringCareers" : "",
    /manufactur/i.test(p.title) || /manufactur/i.test(p.category ?? "")
      ? "#ManufacturingJobs"
      : "",
    loc ? hashToken(loc) : "",
    "#Hiring",
    "#JobAlert",
    "#JobOrio",
    ...extras.map((t) => (t.startsWith("#") ? t : `#${t}`)),
  ].filter(Boolean);
  return [...new Set(tags)].slice(0, 10).join(" ");
}

function applyLink(p: PostStudioPick): string {
  return p.shareUrl?.trim() || "[Insert Tracked Apply Link]";
}

function listLines(picks: PostStudioPick[]): string {
  return picks
    .map((p, i) => {
      const rate = p.rateText ? ` (${p.rateText})` : "";
      return `${i + 1}. ${p.title}${rate}\n${applyLink(p)}`;
    })
    .join("\n\n");
}

/** LinkedIn — detailed hiring post */
function linkedInPost(p: PostStudioPick): string {
  const company = companyName(p);
  const loc = locationLabel(p);
  const req = minimumRequirements(p);
  const roleWord = /engineer/i.test(p.title) ? "engineer" : "professional";

  return [
    `${company} is hiring for ${p.title}!`,
    "",
    loc ? `📍 Location: ${loc}` : null,
    "",
    "MINIMUM REQUIREMENTS:",
    `• ${req}`,
    "",
    `👉 Apply Now: ${applyLink(p)}`,
    "",
    `Tag ${roleWord === "engineer" ? "an engineer" : "someone"} in your network who is looking for their next ${/manufactur/i.test(p.title) ? "manufacturing " : ""}opportunity, and share this post to help it reach the right candidate.`,
    "",
    jobHashtags(p),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** WhatsApp — direct & easy to forward */
function whatsAppPost(p: PostStudioPick): string {
  const company = companyName(p);
  const loc = locationLabel(p);
  return [
    `🚨 *${company} is Hiring!*`,
    "",
    `*Role:* ${p.title}`,
    loc ? `*Location:* ${loc}` : null,
    "",
    "*Minimum Requirements:*",
    minimumRequirements(p),
    "",
    `*Apply Now:* ${applyLink(p)}`,
    "",
    "Share with friends looking for engineering & manufacturing roles!",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** Telegram — clean channel / group post */
function telegramPost(p: PostStudioPick): string {
  const company = companyName(p);
  const loc = locationLabel(p);
  return [
    `⚡ *JOB OPENING: ${p.title.toUpperCase()}* ⚡`,
    "",
    `🏢 *Company:* ${company}`,
    loc ? `📍 *Location:* ${loc}` : null,
    "",
    "*Minimum Requirements:*",
    minimumRequirements(p),
    "",
    `🔗 *Apply Now:* ${applyLink(p)}`,
    "",
    jobHashtags(p, ["EngineeringJobs"]),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** Instagram — hook caption + bio/link CTA */
function instagramPost(p: PostStudioPick): string {
  const company = companyName(p);
  const loc = locationLabel(p);
  const city = cityOnly(p);
  const hook = city
    ? `Early-career professionals in or around ${city}—don't miss this opening at ${company} 👀🔧`
    : `Don't miss this opening at ${company} 👀🔧`;

  return [
    hook,
    "",
    `${company} is hiring for ${p.title}`,
    loc ? `📍 Location: ${loc}` : null,
    "",
    "Minimum Requirements:",
    minimumRequirements(p),
    "",
    `Apply Now: ${applyLink(p)}`,
    "(Or check the link in bio / story link!)",
    "",
    jobHashtags(p, ["CareerOpportunities", "HiringNow"]),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** YouTube — description / pinned comment */
function youtubePost(p: PostStudioPick): string {
  const company = companyName(p);
  const loc = locationLabel(p);
  const hook = loc
    ? `Want to build your career as a ${p.title} at ${company} in ${loc}? Check out the details and apply link below 👇`
    : `Want to build your career as a ${p.title} at ${company}? Check out the details and apply link below 👇`;

  return [
    hook,
    "",
    `${company} is hiring for ${p.title}`,
    loc ? `📍 Location: ${loc}` : null,
    "",
    "MINIMUM REQUIREMENTS:",
    minimumRequirements(p),
    "",
    `Apply Now: ${applyLink(p)}`,
    "",
    jobHashtags(p),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** Reel / Short — hook script + caption */
function reelPost(p: PostStudioPick): string {
  const company = companyName(p);
  const loc = locationLabel(p);
  const expHint = p.experience?.trim()
    ? p.experience.trim()
    : "1 to 2 years of experience";

  return [
    `Hook (0–3 sec): "If you have ${expHint} and want a ${p.title} role at ${company}, watch this."`,
    "",
    `${company} is hiring for ${p.title}`,
    loc ? `Location: ${loc}` : null,
    "",
    "MINIMUM REQUIREMENTS:",
    minimumRequirements(p),
    "",
    `Apply Now: ${applyLink(p)}`,
    "",
    jobHashtags(p),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** Facebook — community & feed */
function facebookPost(p: PostStudioPick): string {
  const company = companyName(p);
  const loc = locationLabel(p);
  const exp = p.experience?.trim() || "relevant experience";
  const shareHook = loc
    ? `Know someone with ${exp} looking for a ${p.title} role in ${loc}? Share this with them! 👇`
    : `Know someone looking for a ${p.title} role? Share this with them! 👇`;

  return [
    shareHook,
    "",
    `${company} is hiring for ${p.title}`,
    loc ? `Location: ${loc}` : null,
    "",
    "MINIMUM REQUIREMENTS:",
    minimumRequirements(p),
    "",
    `Apply Now: ${applyLink(p)}`,
    "",
    jobHashtags(p, ["Jobs"]),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function xPost(p: PostStudioPick): string {
  const company = companyName(p);
  const loc = cityOnly(p);
  const headline = loc
    ? `${company} is hiring – ${p.title} in ${loc}!`
    : `${company} is hiring – ${p.title}!`;
  const body = [
    headline,
    "",
    `Apply: ${applyLink(p)}`,
    "",
    jobHashtags(p).split(" ").slice(0, 4).join(" "),
  ].join("\n");
  return body.slice(0, 280);
}

/** Rule-based drafts from your selected campaigns — no AI. */
export function buildPostDraft(
  platform: PostPlatform,
  picks: PostStudioPick[],
): string {
  if (picks.length === 0) {
    return "Select at least one opportunity to generate a post.";
  }

  const one = first(picks);
  const many = picks.length > 1;

  if (many && platform !== "whatsapp" && platform !== "reel") {
    return picks
      .map((p) => buildPostDraft(platform, [p]))
      .join("\n\n———\n\n");
  }

  switch (platform) {
    case "linkedin":
      return linkedInPost(one);
    case "whatsapp":
      if (many) {
        return [
          "🚨 *Hiring opportunities from JobOrio*",
          "",
          listLines(picks),
          "",
          "Share with friends looking for roles!",
        ].join("\n");
      }
      return whatsAppPost(one);
    case "telegram":
      return telegramPost(one);
    case "instagram":
      return instagramPost(one);
    case "youtube":
      return youtubePost(one);
    case "facebook":
      return facebookPost(one);
    case "x":
      return xPost(one);
    case "reel":
      if (many) {
        return [
          `Hook (0–3 sec): "Stop scrolling — ${picks.length} openings people are missing right now."`,
          "",
          "ON-SCREEN:",
          ...picks.slice(0, 3).map((p) => `• ${p.title} @ ${companyName(p)}`),
          "",
          "Apply links:",
          ...picks.slice(0, 3).map((p) => applyLink(p)),
          "",
          "#Hiring #JobOrio",
        ].join("\n");
      }
      return reelPost(one);
    default:
      return listLines(picks);
  }
}

/** Pull a few skill-like lines from syndication description text. */
export function extractSkillsFromText(text?: string | null, limit = 6): string[] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n|•|\u2022|;/)
    .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((l) => l.length >= 3 && l.length <= 80);

  const skillish = lines.filter((l) => {
    if (
      /^(required|responsibilities|about|apply|location|experience|qualification|salary)/i.test(
        l,
      )
    ) {
      return false;
    }
    return (
      /engineer|design|analysis|assessment|estimation|rehabilitation|strengthening|boq|forensic|cad|civil|structural|bridge|auto|sap|revit|skill/i.test(
        l,
      ) || l.split(" ").length <= 6
    );
  });

  return [...new Set(skillish)].slice(0, limit);
}
