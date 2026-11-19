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
    hint: "Professional post for your network.",
  },
  {
    id: "instagram",
    label: "Instagram",
    hint: "Caption with clear CTA and hashtags.",
  },
  {
    id: "facebook",
    label: "Facebook",
    hint: "Friendly feed post with your tracked link.",
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

function listLines(picks: PostStudioPick[]): string {
  return picks
    .map((p, i) => {
      const rate = p.rateText ? ` (${p.rateText})` : "";
      return `${i + 1}. ${p.title}${rate}\n${p.shareUrl}`;
    })
    .join("\n\n");
}

function first(picks: PostStudioPick[]): PostStudioPick {
  return picks[0];
}

function tags(picks: PostStudioPick[]): string {
  const base = ["#JobOrio", "#Jobs", "#Hiring"];
  const extras = picks.flatMap((p) => {
    const b = p.badge.toUpperCase();
    if (b === "COURSE" || b === "COURSES") return ["#Upskill", "#Courses"];
    if (b === "TOOLS" || b === "TOOL") return ["#Tools"];
    return [];
  });
  return [...new Set([...base, ...extras])].slice(0, 6).join(" ");
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
  const hashtag = tags(picks);

  switch (platform) {
    case "linkedin":
      if (many) {
        return [
          "Hiring / upskilling picks worth sharing this week:",
          "",
          listLines(picks),
          "",
          "Each link is tracked to my JobOrio account — open one that fits and apply or explore.",
          "",
          hashtag,
        ].join("\n");
      }
      return [
        `Open role / opportunity: ${one.title}`,
        one.subtitle ? `${one.subtitle}` : null,
        one.rateText ? `Creator payout: ${one.rateText}` : null,
        "",
        "If this matches you (or someone in your network), use my tracked link:",
        one.shareUrl,
        "",
        hashtag,
      ]
        .filter(Boolean)
        .join("\n");

    case "instagram":
      if (many) {
        return [
          "Saved a few openings & courses for you 👇",
          "",
          ...picks.map(
            (p, i) =>
              `${i + 1}. ${p.title}${p.rateText ? ` · ${p.rateText}` : ""}`,
          ),
          "",
          "Links in comments / bio:",
          ...picks.map((p) => p.shareUrl),
          "",
          hashtag,
        ].join("\n");
      }
      return [
        `${one.title}`,
        one.subtitle ?? "",
        "",
        one.rateText ? `Earn ${one.rateText} when people use your link.` : null,
        "Tap the link to check it out:",
        one.shareUrl,
        "",
        hashtag,
      ]
        .filter(Boolean)
        .join("\n");

    case "facebook":
      return [
        many
          ? "Sharing a few JobOrio opportunities — jobs, courses, and paid campaigns:"
          : `Sharing this on JobOrio: ${one.title}`,
        "",
        listLines(picks),
        "",
        "Use the link above so clicks count on my account.",
        hashtag,
      ].join("\n");

    case "x": {
      if (many) {
        const titles = picks
          .slice(0, 3)
          .map((p) => p.title)
          .join(" · ");
        const link = picks[0].shareUrl;
        return `Openings worth a look: ${titles}\n${link}\n${hashtag}`.slice(
          0,
          280,
        );
      }
      return `${one.title}${one.rateText ? ` · ${one.rateText}` : ""}\n${one.shareUrl}\n${hashtag}`.slice(
        0,
        280,
      );
    }

    case "whatsapp":
      return [
        many
          ? "Hi — sharing a few opportunities from JobOrio:"
          : `Hi — sharing this opportunity: *${one.title}*`,
        "",
        listLines(picks),
        "",
        "Open the link if it fits. Thanks!",
      ].join("\n");

    case "reel":
      return [
        "HOOK (first 3s):",
        many
          ? `"Stop scrolling — ${picks.length} openings people are missing right now."`
          : `"Hiring / course alert: ${one.title}"`,
        "",
        "TALK TRACK:",
        many
          ? `Call out 2–3 titles, who they fit, and that your JobOrio link tracks the click.`
          : `Say who it’s for, location or remote, and why they should open the link today.`,
        "",
        "ON-SCREEN TEXT:",
        ...picks.slice(0, 3).map((p) => `• ${p.title}`),
        "",
        "END CARD / DESCRIPTION LINK:",
        picks[0].shareUrl,
        picks[1]?.shareUrl ? picks[1].shareUrl : null,
        "",
        `CTA: "Link in bio / description — ${hashtag}"`,
      ]
        .filter(Boolean)
        .join("\n");

    default:
      return listLines(picks);
  }
}
