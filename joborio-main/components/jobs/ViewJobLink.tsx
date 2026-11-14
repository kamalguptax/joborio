"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth/session";
import { loginUrlWithNext } from "@/lib/auth/safeRedirect";

type Props = {
  href: string;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
};

/** Opens the job when signed in. Guests are sent to login, including before JavaScript runs. */
export default function ViewJobLink({ href, className, children, ariaLabel }: Props) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const loginHref = loginUrlWithNext(href);

  useEffect(() => {
    setAuthed(Boolean(getAuthToken()));
  }, []);

  return (
    <Link
      href={authed ? href : loginHref}
      aria-label={ariaLabel}
      className={className}
      onClick={(event) => {
        if (getAuthToken()) {
          if (!authed) {
            event.preventDefault();
            router.push(href);
          }
          return;
        }
        event.preventDefault();
        router.push(loginHref);
      }}
    >
      {children}
    </Link>
  );
}
