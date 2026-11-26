"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, Share2, UserPlus } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import {
  absoluteSiteUrl,
  communityJoinUrl,
  createPublisherInvitation,
  type PublisherCommunity,
} from "@/lib/api/publisher";
import { toast } from "@/components/ui/Toast";

export default function CommunityInviteMenu({
  community,
}: {
  community: PublisherCommunity;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function resolveInviteLink(): Promise<string | null> {
    const existing = communityJoinUrl(community);
    if (existing) return existing;
    setBusy(true);
    try {
      const res = await createPublisherInvitation({
        community_id: community.id,
        channel: "link",
        expires_in_days: 14,
      });
      return (
        absoluteSiteUrl(res.invitation?.path, res.invite_url) || res.invite_url
      );
    } catch (err) {
      toast.error(
        err instanceof ApiClientError
          ? err.message
          : "Could not create invite link.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onCopy() {
    const link = await resolveInviteLink();
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied");
      setOpen(false);
    } catch {
      toast.error("Could not copy link.");
    }
  }

  async function onShare() {
    const link = await resolveInviteLink();
    if (!link) return;
    const text = `Join my JobOrio community "${community.name}": ${link}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `Join ${community.name}`,
          text,
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
        toast.success("Invite link copied");
      }
      setOpen(false);
    } catch {
      /* cancelled */
    }
  }

  function onInviteMember() {
    setOpen(false);
    router.push(`/publisher/network?community=${community.id}`);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Invite
        <ChevronDown size={14} className={open ? "rotate-180" : ""} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 z-30 mt-1.5 min-w-[11.5rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void onCopy()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-800"
          >
            <Copy size={14} />
            Copy
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void onShare()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-800"
          >
            <Share2 size={14} />
            Share
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onInviteMember}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-800"
          >
            <UserPlus size={14} />
            Invite member
          </button>
        </div>
      ) : null}
    </div>
  );
}
