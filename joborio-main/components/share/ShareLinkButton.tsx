"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Share2 } from "lucide-react";

type Props = {
  url: string;
  title: string;
  className?: string;
  onShare?: () => void;
};

function shareLinks(url: string, title: string) {
  const text = `${title} ${url}`;
  return [
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(text)}`,
    },
    {
      id: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      id: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      id: "email",
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${url}`)}`,
    },
  ];
}

export default function ShareLinkButton({ url, title, className, onShare }: Props) {
  const [open, setOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const markShared = () => {
    onShare?.();
  };

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const nativeShare = async () => {
    if (!navigator.share) return;
    try {
      markShared();
      await navigator.share({ title, text: title, url });
      setOpen(false);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          setOpen((value) => {
            if (!value) markShared();
            return !value;
          });
        }}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#172b63]"
        }
      >
        <Share2 size={16} />
        Share
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          {shareLinks(url, title).map((item) => (
            <a
              key={item.id}
              role="menuitem"
              href={item.href}
              target={item.id === "email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={() => {
                markShared();
                setOpen(false);
              }}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {item.label}
            </a>
          ))}
          {canNativeShare ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => void nativeShare()}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              More apps
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
