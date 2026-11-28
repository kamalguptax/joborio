import type { Creator, User } from "@/lib/api/types";

/** Where the person goes to finish a step. "photo" opens the file picker; the rest are profile tabs. */
export type ProfileTarget = "photo" | "personal" | "public" | "preferences" | "payout";

export type ProfileStep = {
  id: string;
  label: string;
  /** One line telling the person what to do / where. */
  hint: string;
  done: boolean;
  target: ProfileTarget;
};

export type ProfileCompletion = {
  /** 0-100 */
  percent: number;
  done: number;
  total: number;
  /** Every step, done or not, in display order. */
  steps: ProfileStep[];
  /** Labels of the steps still to do, in order. */
  missing: string[];
};

const filled = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/**
 * A payout account only counts once the details its method needs are filled in.
 * Mirrors the checks in the backend's PayoutMethodController@update.
 */
export function hasPayoutAccount(c: Creator | null | undefined): boolean {
  if (!c || !filled(c.payout_method)) return false;
  switch (c.payout_method) {
    case "upi":
      return filled(c.payout_holder_name) && filled(c.payout_upi_id);
    case "paypal":
      return filled(c.payout_paypal_email);
    case "bank_transfer":
      return (
        filled(c.payout_holder_name) &&
        filled(c.payout_bank_name) &&
        filled(c.payout_account_number) &&
        filled(c.payout_ifsc)
      );
    default:
      // e.g. stripe_connect — set up elsewhere, so a chosen method is enough.
      return true;
  }
}

/**
 * How complete the signed-in account's profile is. Every step has equal weight.
 * Add / remove steps here to change what counts as "complete".
 */
export function computeProfileCompletion(
  user: User | null | undefined,
): ProfileCompletion | null {
  if (!user) return null;

  const steps: ProfileStep[] = [
    {
      id: "photo",
      label: "Add a profile photo",
      hint: "Upload a clear photo of you or your brand.",
      done: filled(user.avatar_url),
      target: "photo",
    },
    {
      id: "name",
      label: "Add your name",
      hint: "Personal tab → Full name.",
      done: filled(user.name),
      target: "personal",
    },
    {
      id: "email",
      label: "Add your email",
      hint: "Personal tab → Email.",
      done: filled(user.email),
      target: "personal",
    },
  ];

  if (user.creator) {
    const c = user.creator;
    const links = c.social_links ?? {};
    steps.push(
      {
        id: "username",
        label: "Pick a username",
        hint: "Personal tab → Username. Your public link uses it.",
        done: filled(c.handle),
        target: "personal",
      },
      {
        id: "bio",
        label: "Write a short bio",
        hint: "Public profile tab → Bio.",
        done: filled(c.bio),
        target: "public",
      },
      {
        id: "social",
        label: "Add a social link",
        hint: "Public profile tab → Profile socials.",
        done: Object.values(links).some((v) => filled(v)),
        target: "public",
      },
      {
        id: "niches",
        label: "Choose your niches",
        hint: "Preferences tab → Industry & keywords.",
        done: (c.niches?.length ?? 0) > 0,
        target: "preferences",
      },
      {
        id: "payout",
        label: "Add a payout account",
        hint: "Payout account tab → UPI, bank account or PayPal, so you can get paid.",
        done: hasPayoutAccount(c),
        target: "payout",
      },
    );
  }

  if (user.employer) {
    steps.push({
      id: "company",
      label: "Add your company name",
      hint: "Add it in your brand setup.",
      done: filled(user.employer.company_name),
      target: "personal",
    });
  }

  const pub = user.publisher_users?.find((m) => m.is_active)?.publisher;
  if (pub) {
    steps.push(
      {
        id: "display-name",
        label: "Add a display name",
        hint: "Personal tab → Full name.",
        done: filled(pub.display_name),
        target: "personal",
      },
      {
        id: "pub-username",
        label: "Pick a username",
        hint: "Set when you registered as a publisher.",
        done: filled(pub.username),
        target: "personal",
      },
    );
  }

  const done = steps.filter((s) => s.done).length;
  return {
    percent: Math.round((done / steps.length) * 100),
    done,
    total: steps.length,
    steps,
    missing: steps.filter((s) => !s.done).map((s) => s.label),
  };
}
