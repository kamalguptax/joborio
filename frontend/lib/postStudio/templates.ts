export type PostPlatform =
  | "linkedin"
  | "instagram"
  | "facebook"
  | "x"
  | "whatsapp"
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
    id: "reel",
    label: "Reel / Short",
    hint: "Hook + talk track for a short video.",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    hint: "Detailed hiring post (location, skills, apply link).",
  },
  {
    id: "instagram",
    label: "Instagram",
    hint: "Short caption + bio CTA + hashtags.",
  },
  {
    id: "facebook",
    label: "Facebook",
    hint: "Short feed post like Instagram.",
  },
  {
    id: "x",
    label: "X / Twitter",
    hint: "Short post under character limits.",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    hint: "Message you can forward to groups.",
  },
];

function first(picks: PostStudioPick[]): PostStudioPick {
  return picks[0];
}

function companyName(p: PostStudioPick): string {
  return (p.company || "").trim();
}

function locationLabel(p: PostStudioPick): string {
  return (p.location || "").trim();
}

function roleLine(p: PostStudioPick): string {
  const company = companyName(p);
  if (company) return `${company} Looking for ${p.title}`;
  return p.title;
}

function hashToken(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9]+/g, "");
  return cleaned ? `#${cleaned}` : "";
}

function cityJobsTag(location?: string): string {
  if (!location) return "";
  const city = location.split(",")[0]?.trim() ?? "";
  if (!city) return "";
  return hashToken(`${city}Jobs`);
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

function topicTags(p: PostStudioPick): string[] {
  const badge = p.badge.toLowerCase();
  if (badge === "course" || badge === "courses") return ["#Upskill", "#Courses"];
  if (badge === "tool" || badge === "tools") return ["#Tools"];
  const out: string[] = ["#Hiring"];
  if (p.category?.trim()) out.push(hashToken(p.category.trim()));
  const titleBits = p.title
    .split(/[\s,/|()\-]+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter((w) => w.length >= 4)
    .slice(0, 3);
  for (const bit of titleBits) out.push(`#${bit}`);
  return out;
}

function linkedInHashtags(p: PostStudioPick): string {
  const tags = [
    ...topicTags(p),
    companyName(p) ? hashToken(companyName(p)) : "",
    companyName(p) ? hashToken(`${companyName(p)}Jobs`) : "",
    roleTag(p.title),
    cityJobsTag(locationLabel(p)),
    "#JobOrio",
  ].filter(Boolean);
  return [...new Set(tags)].slice(0, 8).join(" ");
}

function shortHashtags(p: PostStudioPick): string {
  const tags = [
    companyName(p) ? hashToken(companyName(p)) : "#Hiring",
    roleTag(p.title),
    ...topicTags(p).slice(0, 2),
    cityJobsTag(locationLabel(p)),
    "#JobOrio",
  ].filter(Boolean);
  return [...new Set(tags)].slice(0, 6).join(" ");
}

function linkedInJobBlock(p: PostStudioPick): string {
  const lines: Array<string | null> = [
    roleLine(p),
    "",
    locationLabel(p) ? `📍 Location: ${locationLabel(p)}` : null,
    p.experience?.trim() ? `💼 Experience: ${p.experience.trim()}` : null,
    p.qualification?.trim()
      ? `🎓 Qualification: ${p.qualification.trim()}`
      : null,
    p.salary?.trim() ? `💰 Salary: ${p.salary.trim()}` : null,
    p.jobType?.trim() ? `🧾 Job Type: ${p.jobType.trim()}` : null,
  ];

  const skills = (p.skills ?? []).map((s) => s.trim()).filter(Boolean);
  if (skills.length > 0) {
    lines.push("", "Required Technical Skills:", "", ...skills);
  } else if (p.subtitle?.trim() && !companyName(p)) {
    lines.push("", p.subtitle.trim());
  }

  lines.push("", "Apply Now:", p.shareUrl, "", linkedInHashtags(p));
  return lines.filter((line) => line !== null).join("\n");
}

function shortSocialBlock(p: PostStudioPick): string {
  const company = companyName(p) || "A top company";
  const loc = locationLabel(p);
  const headline = loc
    ? `${company} is hiring – ${p.title} in ${loc.split(",")[0]!.trim()}!`
    : `${company} is hiring – ${p.title}!`;

  const blurb =
    p.summary?.trim() ||
    (companyName(p)
      ? `${company} is hiring skilled professionals to join the team${loc ? ` in ${loc}` : ""} and contribute to its operations.`
      : p.subtitle?.trim() ||
        "Great opportunity for skilled professionals looking for their next role.");

  return [
    headline,
    "",
    blurb,
    "",
    "Check my bio link to apply for this role",
    p.shareUrl,
    "",
    shortHashtags(p),
  ].join("\n");
}

function listLines(picks: PostStudioPick[]): string {
  return picks
    .map((p, i) => {
      const rate = p.rateText ? ` (${p.rateText})` : "";
      return `${i + 1}. ${p.title}${rate}\n${p.shareUrl}`;
    })
    .join("\n\n");
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

  switch (platform) {
    case "linkedin":
      if (many) {
        return picks.map((p) => linkedInJobBlock(p)).join("\n\n———\n\n");
      }
      return linkedInJobBlock(one);

    case "instagram":
    case "facebook":
      if (many) {
        return [
          shortSocialBlock(one),
          "",
          "Also sharing:",
          ...picks.slice(1, 4).map((p, i) => `${i + 2}. ${p.title}`),
          "",
          "Links:",
          ...picks.slice(0, 4).map((p) => p.shareUrl),
        ].join("\n");
      }
      return shortSocialBlock(one);

    case "x": {
      const company = companyName(one) || "Hiring";
      const loc = locationLabel(one).split(",")[0]?.trim();
      const headline = loc
        ? `${company} is hiring – ${one.title} in ${loc}!`
        : `${company} is hiring – ${one.title}!`;
      const body = [
        headline,
        "",
        "Check my bio link to apply for this role",
        one.shareUrl,
        "",
        shortHashtags(one),
      ].join("\n");
      return body.slice(0, 280);
    }

    case "whatsapp":
      return [
        many
          ? "Hi — sharing a few opportunities from JobOrio:"
          : `Hi — *${roleLine(one)}*`,
        "",
        many ? listLines(picks) : linkedInJobBlock(one),
        "",
        "Open the link if it fits. Thanks!",
      ].join("\n");

    case "reel":
      return [
        "HOOK (first 3s):",
        many
          ? `"Stop scrolling — ${picks.length} openings people are missing right now."`
          : `"${companyName(one) || "Hiring"} alert: ${one.title}${locationLabel(one) ? ` in ${locationLabel(one).split(",")[0]}` : ""}"`,
        "",
        "TALK TRACK:",
        many
          ? "Call out 2–3 titles, who they fit, and that your JobOrio link tracks the click."
          : `Say who it’s for${locationLabel(one) ? `, location (${locationLabel(one)})` : ""}, and why they should open the link today.`,
        "",
        "ON-SCREEN TEXT:",
        ...picks.slice(0, 3).map((p) => `• ${p.title}`),
        "",
        "END CARD / DESCRIPTION LINK:",
        picks[0].shareUrl,
        picks[1]?.shareUrl ? picks[1].shareUrl : null,
        "",
        'CTA: "Link in bio / description"',
        shortHashtags(one),
      ]
        .filter(Boolean)
        .join("\n");

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
    if (/^(required|responsibilities|about|apply|location|experience|qualification|salary)/i.test(l)) {
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
