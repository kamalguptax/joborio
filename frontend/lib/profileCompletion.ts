import type { User } from "@/lib/api/types";

export type ProfileCompletion = {
  /** 0-100 */
  percent: number;
  done: number;
  total: number;
  /** Labels of the steps still to do, in order. */
  missing: string[];
};

const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/**
 * How complete the signed-in account's profile is. Every step has equal weight.
 * Add / remove steps here to change what counts as "complete".
 */
export function computeProfileCompletion(
  user: User | null | undefined,
): ProfileCompletion | null {
  if (!user) return null;

  const steps: Array<{ label: string; done: boolean }> = [
    { label: "Add a profile photo", done: filled(user.avatar_url) },
    { label: "Add your name", done: filled(user.name) },
    { label: "Add your email", done: filled(user.email) },
  ];

  if (user.creator) {
    const links = user.creator.social_links ?? {};
    steps.push(
      { label: "Pick a username", done: filled(user.creator.handle) },
      { label: "Write a short bio", done: filled(user.creator.bio) },
      {
        label: "Add a social link",
        done: Object.values(links).some((v) => filled(v)),
      },
      {
        label: "Choose your niches",
        done: (user.creator.niches?.length ?? 0) > 0,
      },
    );
  }

  if (user.employer) {
    steps.push({
      label: "Add your company name",
      done: filled(user.employer.company_name),
    });
  }

  const pub = user.publisher_users?.find((m) => m.is_active)?.publisher;
  if (pub) {
    steps.push(
      { label: "Add a display name", done: filled(pub.display_name) },
      { label: "Pick a username", done: filled(pub.username) },
    );
  }

  const done = steps.filter((s) => s.done).length;
  return {
    percent: Math.round((done / steps.length) * 100),
    done,
    total: steps.length,
    missing: steps.filter((s) => !s.done).map((s) => s.label),
  };
}
