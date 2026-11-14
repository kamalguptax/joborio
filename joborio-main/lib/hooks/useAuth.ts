"use client";

import { useEffect, useState } from "react";
import { fetchMe } from "@/lib/api/auth";
import { getAuthToken } from "@/lib/auth/session";

export function useAuth() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [handle, setHandle] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setReady(true);
      setLoggedIn(false);
      return;
    }
    fetchMe()
      .then((u) => {
        setLoggedIn(true);
        setHandle(u.creator?.handle ?? null);
        setIsAdmin(u.roles?.some((r) => r.name === "admin") ?? false);
      })
      .catch(() => {
        setLoggedIn(false);
      })
      .finally(() => setReady(true));
  }, []);

  return { ready, loggedIn, handle, isAdmin };
}
