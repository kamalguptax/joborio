"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Camera, KeyRound, Trash2, UserRound } from "lucide-react";
import PasswordInput from "@/components/auth/PasswordInput";
import { authField, authLabel } from "@/components/auth/authStyles";
import { toast } from "@/components/ui/Toast";
import { fetchMe } from "@/lib/api/auth";
import {
  changeAccountPassword,
  notifyAccountUpdated,
  removeAccountPhoto,
  updateAccountProfile,
  uploadAccountPhoto,
} from "@/lib/api/account";
import { updatePublisherPassword, updatePublisherProfile } from "@/lib/api/publisher";

type Variant = "creator" | "employer" | "publisher";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const card = "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7";
const primaryBtn =
  "inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500";
const ghostBtn =
  "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-60";

function errMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className={card}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-bold text-[#0F1B3D]">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{hint}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Profile photo, name, username and password for the signed-in account. */
export default function ProfileSettings({ variant }: { variant: Variant }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Publisher usernames are fixed at registration; creators can change their handle.
  const usernameEditable = variant === "creator";
  const hasUsername = variant !== "employer";

  useEffect(() => {
    fetchMe()
      .then((u) => {
        setName(u.name ?? "");
        setEmail(u.email ?? "");
        setAvatar(u.avatar_url ?? null);
        if (variant === "creator") setUsername(u.creator?.handle ?? "");
        if (variant === "publisher") {
          setUsername(u.publisher_users?.find((m) => m.is_active)?.publisher?.username ?? "");
        }
      })
      .catch(() => toast.error("Could not load your account."))
      .finally(() => setLoaded(true));
  }, [variant]);

  const initial = (name.trim()[0] ?? email.trim()[0] ?? "U").toUpperCase();

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
    } catch (err) {
      toast.error(errMessage(err, "Could not remove the photo."));
    } finally {
      setPhotoBusy(false);
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
      if (usernameEditable) setUsername(cleanUsername);
      notifyAccountUpdated();
      toast.success("Profile saved.");
    } catch (err) {
      toast.error(errMessage(err, "Could not save your profile."));
    } finally {
      setSaving(false);
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (!current) return setPwError("Enter your current password.");
    if (next.length < 8) return setPwError("New password must be at least 8 characters.");
    if (next !== confirm) return setPwError("New passwords do not match.");
    if (next === current) return setPwError("New password must be different from the current one.");
    setPwSaving(true);
    try {
      const body = { current_password: current, password: next, password_confirmation: confirm };
      if (variant === "publisher") await updatePublisherPassword(body);
      else await changeAccountPassword(body);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password updated.");
    } catch (err) {
      setPwError(errMessage(err, "Could not update your password."));
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">Account</p>
        <h1 className="mt-1 text-3xl font-bold">Profile settings</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Update your photo, name and username, and keep your account secure.
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        <Section
          icon={<Camera size={20} aria-hidden="true" />}
          title="Profile photo"
          hint="Shown in your sidebar. JPG, PNG or WebP, up to 2 MB."
        >
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-3xl font-bold text-white ring-4 ring-violet-50">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="Your profile photo" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </span>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => void onPickPhoto(e.target.files?.[0])}
              />
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
          </div>
        </Section>

        <Section
          icon={<UserRound size={20} aria-hidden="true" />}
          title="Personal details"
          hint="Your name is shown to brands and publishers you work with."
        >
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
            <div className="pt-1">
              <button type="submit" disabled={saving || !loaded} className={primaryBtn}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </Section>

        <Section
          icon={<KeyRound size={20} aria-hidden="true" />}
          title="Password"
          hint="Use at least 8 characters. You stay signed in on this device."
        >
          <form onSubmit={onChangePassword} className="space-y-4">
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
                  onChange={(e) => setNext(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="ps-confirm" className={authLabel}>Confirm new password</label>
                <PasswordInput
                  id="ps-confirm"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>
            <div className="pt-1">
              <button type="submit" disabled={pwSaving} className={primaryBtn}>
                {pwSaving ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        </Section>
      </div>
    </>
  );
}
