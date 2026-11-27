"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Camera,
  Check,
  Circle,
  Eye,
  ImagePlus,
  KeyRound,
  Mail,
  Trash2,
  X,
} from "lucide-react";
import PasswordInput from "@/components/auth/PasswordInput";
import { authField, authLabel } from "@/components/auth/authStyles";
import { Card, Field } from "@/components/account/AccountCard";
import {
  CreatorIndustryCard,
  CreatorJobPreferencesCard,
  CreatorSocialsCard,
} from "@/components/account/CreatorProfileCards";
import CreatorPayoutAccount from "@/components/account/CreatorPayoutAccount";
import CreatorProfilePreview from "@/components/account/CreatorProfilePreview";
import { toast } from "@/components/ui/Toast";
import { fetchMe } from "@/lib/api/auth";
import type { User } from "@/lib/api/types";
import {
  changeAccountPassword,
  notifyAccountUpdated,
  removeAccountPhoto,
  removeCoverBanner,
  requestPasswordChangeOtp,
  updateAccountProfile,
  uploadAccountPhoto,
  uploadCoverBanner,
} from "@/lib/api/account";
import { updateCreatorProfile } from "@/lib/api/creator";
import {
  requestPublisherPasswordOtp,
  updatePublisherPassword,
  updatePublisherProfile,
} from "@/lib/api/publisher";
import { computeProfileCompletion } from "@/lib/profileCompletion";
import { DEFAULT_AVATAR } from "@/lib/defaultAvatar";

type Variant = "creator" | "employer" | "publisher";
type TabId = "personal" | "public" | "preferences" | "payout" | "security";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const MAX_COVER_BYTES = 3 * 1024 * 1024;
const OTP_RESEND_SECONDS = 30;

const ROLE_LABEL: Record<Variant, string> = {
  creator: "Creator",
  employer: "Brand",
  publisher: "Publisher",
};

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500";
const ghostBtn =
  "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60";

function errMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

const TAB_IDS: TabId[] = ["personal", "public", "preferences", "payout", "security"];

/** Profile page: header, tabs and cards. Creators also get a live preview drawer. */
export default function ProfileSettings({ variant }: { variant: Variant }) {
  // useSearchParams needs a Suspense boundary for static export / prerender.
  return (
    <Suspense fallback={null}>
      <ProfileSettingsInner variant={variant} />
    </Suspense>
  );
}

function ProfileSettingsInner({ variant }: { variant: Variant }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<TabId>("personal");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [cover, setCover] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [editPersonal, setEditPersonal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Public profile (creators only)
  const [bio, setBio] = useState("");
  const [accent, setAccent] = useState("#2563eb");
  const [savedHandle, setSavedHandle] = useState("");
  const [niches, setNiches] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [editPublic, setEditPublic] = useState(false);
  const [savingPublic, setSavingPublic] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Publisher usernames are fixed at registration; creators can change their handle.
  const usernameEditable = variant === "creator";
  const hasUsername = variant !== "employer";
  const isCreator = variant === "creator";

  const load = useCallback(async () => {
    try {
      const u = await fetchMe();
      setUser(u);
      setName(u.name ?? "");
      setEmail(u.email ?? "");
      setAvatar(u.avatar_url ?? null);
      setCover(u.cover_url ?? null);
      if (variant === "creator") {
        setUsername(u.creator?.handle ?? "");
        setSavedHandle(u.creator?.handle ?? "");
        setNiches((u.creator?.niches ?? []).map((n) => n.name));
        setSocialLinks(
          Object.fromEntries(
            Object.entries(u.creator?.social_links ?? {}).filter(
              (entry): entry is [string, string] => typeof entry[1] === "string",
            ),
          ),
        );
        setBio(u.creator?.bio ?? "");
        setAccent(u.creator?.accent_color ?? "#2563eb");
      }
      if (variant === "publisher") {
        setUsername(u.publisher_users?.find((m) => m.is_active)?.publisher?.username ?? "");
      }
    } catch {
      toast.error("Could not load your account.");
    } finally {
      setLoaded(true);
    }
  }, [variant]);

  // Light refresh after a save: updates the completion numbers without touching what is typed in the forms.
  const refreshUser = useCallback(async () => {
    try {
      setUser(await fetchMe());
    } catch {
      /* keep the current values */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // The tab follows the URL (?tab=payout), so links from other pages — even while this
  // page is already open — switch to the right tab. Without ?tab it shows Personal.
  const wantedTab = searchParams.get("tab");
  useEffect(() => {
    const allowed: TabId[] = isCreator
      ? TAB_IDS
      : ["personal", "security"];
    const next = allowed.find((id) => id === wantedTab) ?? "personal";
    setTab(next);
  }, [wantedTab, isCreator]);

  function selectTab(id: TabId) {
    setTab(id);
    router.replace(id === "personal" ? (pathname ?? "") : `${pathname ?? ""}?tab=${id}`, {
      scroll: false,
    });
  }
  // Count down the "resend OTP" wait.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Close the preview drawer with Escape.
  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [previewOpen]);

  const completion = computeProfileCompletion(user);

  async function onPickPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error("Photo must be 2 MB or smaller.");
      return;
    }
    setPhotoBusy(true);
    try {
      const res = await uploadAccountPhoto(file);
      setAvatar(res.avatar_url);
      notifyAccountUpdated();
      toast.success("Profile photo updated.");
      void refreshUser();
    } catch (err) {
      toast.error(errMessage(err, "Could not upload the photo."));
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onRemovePhoto() {
    setPhotoBusy(true);
    try {
      await removeAccountPhoto();
      setAvatar(null);
      notifyAccountUpdated();
      toast.success("Profile photo removed.");
      void refreshUser();
    } catch (err) {
      toast.error(errMessage(err, "Could not remove the photo."));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onPickCover(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      toast.error("Cover banner must be 3 MB or smaller.");
      return;
    }
    const previous = cover;
    const local = URL.createObjectURL(file);
    setCover(local); // show it in the preview straight away
    setCoverBusy(true);
    try {
      const res = await uploadCoverBanner(file);
      setCover(res.cover_url ?? local);
      notifyAccountUpdated();
      toast.success("Cover banner updated.");
    } catch (err) {
      setCover(previous);
      toast.error(errMessage(err, "Could not upload the cover banner."));
    } finally {
      setCoverBusy(false);
      if (coverRef.current) coverRef.current.value = "";
    }
  }

  async function onRemoveCover() {
    setCoverBusy(true);
    try {
      await removeCoverBanner();
      setCover(null);
      notifyAccountUpdated();
      toast.success("Cover banner removed.");
    } catch (err) {
      toast.error(errMessage(err, "Could not remove the cover banner."));
    } finally {
      setCoverBusy(false);
    }
  }

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      toast.error("Enter your full name.");
      return;
    }
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
    if (usernameEditable && !/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      toast.error("Username must be 3–30 characters: a–z, 0–9 and _.");
      return;
    }
    setSaving(true);
    try {
      if (variant === "publisher") {
        await updatePublisherProfile({ full_name: cleanName });
      } else {
        await updateAccountProfile({
          name: cleanName,
          ...(usernameEditable ? { username: cleanUsername } : {}),
        });
      }
      notifyAccountUpdated();
      toast.success("Profile saved.");
      setEditPersonal(false);
      if (usernameEditable) {
        setUsername(cleanUsername);
        setSavedHandle(cleanUsername);
      }
      void refreshUser();
    } catch (err) {
      toast.error(errMessage(err, "Could not save your profile."));
    } finally {
      setSaving(false);
    }
  }

  async function onSavePublicProfile(e: FormEvent) {
    e.preventDefault();
    setSavingPublic(true);
    try {
      await updateCreatorProfile({ bio, accent_color: accent });
      notifyAccountUpdated();
      toast.success("Public profile saved.");
      setEditPublic(false);
      void refreshUser();
    } catch (err) {
      toast.error(errMessage(err, "Could not save your public profile."));
    } finally {
      setSavingPublic(false);
    }
  }

  function validatePasswordFields(): string | null {
    if (!current) return "Enter your current password.";
    if (next.length < 8) return "New password must be at least 8 characters.";
    if (next !== confirm) return "New passwords do not match.";
    if (next === current) return "New password must be different from the current one.";
    return null;
  }

  async function onSendOtp(e?: FormEvent) {
    e?.preventDefault();
    setPwError(null);
    const problem = validatePasswordFields();
    if (problem) return setPwError(problem);
    setOtpSending(true);
    try {
      if (variant === "publisher") await requestPublisherPasswordOtp();
      else await requestPasswordChangeOtp();
      setOtpSent(true);
      setOtp("");
      setCooldown(OTP_RESEND_SECONDS);
      toast.success(`We sent a 6-digit code to ${email || "your email"}.`);
    } catch (err) {
      setPwError(errMessage(err, "Could not send the OTP. Try again."));
    } finally {
      setOtpSending(false);
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    const problem = validatePasswordFields();
    if (problem) return setPwError(problem);
    if (!/^\d{6}$/.test(otp)) return setPwError("Enter the 6-digit OTP from your email.");
    setPwSaving(true);
    try {
      const body = {
        otp,
        current_password: current,
        password: next,
        password_confirmation: confirm,
      };
      if (variant === "publisher") await updatePublisherPassword(body);
      else await changeAccountPassword(body);
      setCurrent("");
      setNext("");
      setConfirm("");
      setOtp("");
      setOtpSent(false);
      setCooldown(0);
      toast.success("Password updated.");
    } catch (err) {
      setPwError(errMessage(err, "Could not update your password."));
    } finally {
      setPwSaving(false);
    }
  }

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "personal", label: "Personal" },
    ...(isCreator
      ? [
          { id: "public" as const, label: "Public profile" },
          { id: "preferences" as const, label: "Preferences" },
          { id: "payout" as const, label: "Payout account" },
        ]
      : []),
    { id: "security", label: "Security" },
  ];

  const shownName = name.trim() || (username ? `@${username}` : "Your account");

  return (
    <>
      {/* ——— Header card with tabs ——— */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isCreator ? (
          <div
            className="relative h-32 sm:h-40"
            style={{
              background: `linear-gradient(120deg, ${accent}55 0%, #a855f733 55%, #38bdf833 100%)`,
            }}
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="Your cover banner" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <p className="absolute bottom-3 left-5 text-xs font-medium text-slate-600">
                No cover yet · 1500×400 recommended, up to 3 MB
              </p>
            )}
            <input
              ref={coverRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => void onPickCover(e.target.files?.[0])}
            />
            <div className="absolute right-3 top-3 flex gap-2">
              <button
                type="button"
                disabled={coverBusy || !loaded}
                onClick={() => coverRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:text-violet-700 disabled:opacity-60"
              >
                <ImagePlus size={14} aria-hidden="true" />
                {coverBusy ? "Working…" : cover ? "Change cover" : "Upload cover"}
              </button>
              {cover ? (
                <button
                  type="button"
                  disabled={coverBusy}
                  onClick={() => void onRemoveCover()}
                  aria-label="Remove cover banner"
                  title="Remove cover"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-red-600 disabled:opacity-60"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-5 p-5 sm:p-6">
          <div className="relative h-24 w-24 shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => void onPickPhoto(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={photoBusy || !loaded}
              onClick={() => fileRef.current?.click()}
              aria-label={avatar ? "Change profile photo" : "Upload profile photo"}
              title={avatar ? "Change photo" : "Upload photo"}
              className="group relative block h-24 w-24 overflow-hidden rounded-full bg-slate-100 ring-4 ring-white shadow-md outline-none transition focus-visible:ring-violet-300 disabled:cursor-not-allowed"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar || DEFAULT_AVATAR} alt="Your profile photo" className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-slate-900/45 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                {photoBusy ? "Working…" : "Change"}
              </span>
            </button>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white shadow-md ring-2 ring-white"
            >
              <Camera size={15} />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="break-words text-2xl font-bold text-[#0F1B3D]">{shownName}</h1>
              <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                {ROLE_LABEL[variant]}
              </span>
            </div>
            {email ? <p className="mt-1 text-sm text-slate-500">{email}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold">
              <button
                type="button"
                disabled={photoBusy || !loaded}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-violet-700 transition hover:text-violet-900 disabled:opacity-60"
              >
                <Camera size={13} aria-hidden="true" />
                {photoBusy ? "Working…" : avatar ? "Change photo" : "Upload photo"}
              </button>
              {avatar ? (
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={() => void onRemovePhoto()}
                  className="inline-flex items-center gap-1.5 text-slate-500 transition hover:text-red-600 disabled:opacity-60"
                >
                  <Trash2 size={13} aria-hidden="true" />
                  Remove
                </button>
              ) : null}
            </div>
            {completion ? (
              <div className="mt-3 max-w-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Profile completion</span>
                  <span className={completion.percent >= 100 ? "text-emerald-600" : "text-violet-700"}>
                    {completion.percent}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      completion.percent >= 100
                        ? "bg-emerald-500"
                        : "bg-gradient-to-r from-violet-600 to-blue-600"
                    }`}
                    style={{ width: `${completion.percent}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {isCreator ? (
            <button type="button" onClick={() => setPreviewOpen(true)} className={primaryBtn}>
              <Eye size={16} aria-hidden="true" />
              Preview &amp; share
            </button>
          ) : null}
        </div>

        <div role="tablist" aria-label="Profile sections" className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 sm:px-6">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(t.id)}
                className={`relative my-2 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ——— Tab content ——— */}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
        {tab === "personal" ? (
          <>
            <Card
              title="Personal information"
              editing={editPersonal}
              onEdit={() => {
                if (editPersonal) void load();
                setEditPersonal((v) => !v);
              }}
            >
              {editPersonal ? (
                <form onSubmit={onSaveProfile} className="space-y-4">
                  <div>
                    <label htmlFor="ps-name" className={authLabel}>Full name</label>
                    <input
                      id="ps-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      disabled={!loaded}
                      className={authField}
                    />
                  </div>
                  {hasUsername ? (
                    <div>
                      <label htmlFor="ps-username" className={authLabel}>Username</label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                          @
                        </span>
                        <input
                          id="ps-username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase())}
                          readOnly={!usernameEditable}
                          disabled={!loaded}
                          autoComplete="username"
                          className={`${authField} pl-8 ${usernameEditable ? "" : "bg-slate-50 text-slate-500"}`}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {usernameEditable
                          ? "Your public link uses this. Changing it changes your link too."
                          : "Your publisher username is set at registration and can’t be changed."}
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <label htmlFor="ps-email" className={authLabel}>Email</label>
                    <input
                      id="ps-email"
                      value={email}
                      readOnly
                      className={`${authField} bg-slate-50 text-slate-500`}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Contact support if you need to change your email address.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={saving || !loaded} className={primaryBtn}>
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      className={ghostBtn}
                      onClick={() => {
                        setEditPersonal(false);
                        void load();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                  <Field label="Full name" value={name} />
                  {hasUsername ? <Field label="Username" value={username ? `@${username}` : ""} /> : null}
                  <Field label="Email" value={email} wide />
                </dl>
              )}
            </Card>

            <div className="space-y-5">
              <Card title="Profile photo">
                <p className="text-sm text-slate-500">
                  Shown in your sidebar and on your profile. JPG, PNG or WebP, up to 2 MB.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={photoBusy || !loaded}
                    onClick={() => fileRef.current?.click()}
                    className={ghostBtn}
                  >
                    <Camera size={16} aria-hidden="true" />
                    {photoBusy ? "Working…" : avatar ? "Change photo" : "Upload photo"}
                  </button>
                  {avatar ? (
                    <button
                      type="button"
                      disabled={photoBusy}
                      onClick={() => void onRemovePhoto()}
                      className={`${ghostBtn} hover:border-red-200 hover:text-red-600`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Remove
                    </button>
                  ) : null}
                </div>
              </Card>

              {completion && completion.missing.length > 0 ? (
                <Card title="Complete your profile">
                  <p className="text-sm text-slate-500">
                    {completion.done} of {completion.total} steps done.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {completion.missing.map((m) => (
                      <li key={m} className="flex items-center gap-2 text-sm text-slate-700">
                        <Circle size={14} className="shrink-0 text-slate-300" aria-hidden="true" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : completion ? (
                <Card title="Complete your profile">
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                    <Check size={16} aria-hidden="true" />
                    Your profile is 100% complete.
                  </p>
                </Card>
              ) : null}
            </div>
          </>
        ) : null}

        {tab === "public" && isCreator ? (
          <>
            <Card
              title="Public profile"
              editing={editPublic}
              onEdit={() => {
                if (editPublic) void load();
                setEditPublic((v) => !v);
              }}
            >
              {editPublic ? (
                <form onSubmit={onSavePublicProfile} className="space-y-4">
                  <div>
                    <label htmlFor="ps-bio" className={authLabel}>Bio</label>
                    <textarea
                      id="ps-bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      disabled={!loaded}
                      className={authField}
                    />
                  </div>
                  <div>
                    <label htmlFor="ps-accent" className={authLabel}>Accent color</label>
                    <input
                      id="ps-accent"
                      type="color"
                      value={accent}
                      onChange={(e) => setAccent(e.target.value)}
                      disabled={!loaded}
                      className="mt-1 h-10 w-20 cursor-pointer rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={savingPublic || !loaded} className={primaryBtn}>
                      {savingPublic ? "Saving…" : "Save public profile"}
                    </button>
                    <button
                      type="button"
                      className={ghostBtn}
                      onClick={() => {
                        setEditPublic(false);
                        void load();
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="grid gap-y-5">
                  <Field label="Bio" value={bio} />
                  <Field label="Niches" value={niches.join(", ")} />
                  <Field
                    label="Accent color"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-5 w-5 rounded-full ring-1 ring-slate-200"
                          style={{ background: accent }}
                        />
                        {accent.toUpperCase()}
                      </span>
                    }
                  />
                </dl>
              )}
            </Card>

            <CreatorSocialsCard
              variant="profile"
              socialLinks={socialLinks}
              onChange={(key, value) => setSocialLinks((prev) => ({ ...prev, [key]: value }))}
              onSaved={() => void refreshUser()}
            />
          </>
        ) : null}

        {tab === "preferences" && isCreator ? (
          <>
            <div className="lg:col-span-2">
              <CreatorIndustryCard />
            </div>
            <CreatorSocialsCard
              variant="audience"
              socialLinks={socialLinks}
              onChange={(key, value) => setSocialLinks((prev) => ({ ...prev, [key]: value }))}
              onSaved={() => void refreshUser()}
            />
            <CreatorJobPreferencesCard />
          </>
        ) : null}

        {tab === "payout" && isCreator ? <CreatorPayoutAccount /> : null}

        {tab === "security" ? (
          <Card title="Password">
            <p className="mb-4 text-sm text-slate-500">
              Use at least 8 characters. We email you a 6-digit OTP to confirm the change.
            </p>
            <form onSubmit={otpSent ? onChangePassword : onSendOtp} className="space-y-4">
              {pwError ? (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {pwError}
                </p>
              ) : null}
              <div>
                <label htmlFor="ps-current" className={authLabel}>Current password</label>
                <PasswordInput
                  id="ps-current"
                  autoComplete="current-password"
                  value={current}
                  disabled={otpSent}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ps-new" className={authLabel}>New password</label>
                  <PasswordInput
                    id="ps-new"
                    autoComplete="new-password"
                    minLength={8}
                    value={next}
                    disabled={otpSent}
                    onChange={(e) => setNext(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="ps-confirm" className={authLabel}>Confirm new password</label>
                  <PasswordInput
                    id="ps-confirm"
                    autoComplete="new-password"
                    value={confirm}
                    disabled={otpSent}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>

              {otpSent ? (
                <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                  <label htmlFor="ps-otp" className={authLabel}>Enter OTP</label>
                  <p className="mb-2 text-xs text-slate-500">
                    Sent to {email || "your email"}. It expires in a few minutes.
                  </p>
                  <input
                    id="ps-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className={`${authField} max-w-[12rem] text-center text-lg font-semibold tracking-[0.5em]`}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <button
                      type="button"
                      disabled={cooldown > 0 || otpSending}
                      onClick={() => void onSendOtp()}
                      className="font-semibold text-violet-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                    >
                      {otpSending ? "Sending…" : cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setPwError(null);
                      }}
                      className="font-semibold text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      Change password details
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="pt-1">
                {otpSent ? (
                  <button type="submit" disabled={pwSaving || otp.length !== 6} className={primaryBtn}>
                    <KeyRound size={16} aria-hidden="true" />
                    {pwSaving ? "Updating…" : "Verify & update password"}
                  </button>
                ) : (
                  <button type="submit" disabled={otpSending} className={primaryBtn}>
                    <Mail size={16} aria-hidden="true" />
                    {otpSending ? "Sending OTP…" : "Send OTP"}
                  </button>
                )}
              </div>
            </form>
          </Card>
        ) : null}
      </div>

      {/* ——— Preview & share drawer (opens from the header button) ——— */}
      {isCreator && previewOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Profile preview">
          <button
            type="button"
            aria-label="Close preview"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setPreviewOpen(false)}
          />
          <div className="relative h-full w-full max-w-md overflow-y-auto bg-[#F8F8FB] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F1B3D]">Preview &amp; share</h2>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <CreatorProfilePreview
              name={name}
              handle={username}
              bio={bio}
              accent={accent}
              avatarUrl={avatar}
              coverUrl={cover}
              niches={niches}
              socialLinks={socialLinks}
              savedHandle={savedHandle}
              loaded={loaded}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
