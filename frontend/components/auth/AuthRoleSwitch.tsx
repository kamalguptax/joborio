import Link from "next/link";
import { AUTH_ROLES, AUTH_ROUTES, type AuthRole } from "@/lib/auth/authRoutes";

/**
 * "Log in as / Sign up as" tabs shown on every auth page so it is always clear
 * which account type the page is for, and one click reaches the other two.
 * `current = null` means the page is not tied to one role (the universal /login).
 */
export default function AuthRoleSwitch({
  mode,
  current,
}: {
  mode: "login" | "signup";
  current: AuthRole | null;
}) {
  const verb = mode === "login" ? "Log in as" : "Sign up as";
  return (
    <nav aria-label={verb} className="mb-6">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
        {verb}
      </p>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {AUTH_ROLES.map((role) => {
          const active = role === current;
          return (
            <Link
              key={role}
              href={AUTH_ROUTES[role][mode]}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-10 items-center justify-center rounded-lg px-2 text-sm font-semibold transition ${
                active
                  ? "bg-white text-violet-700 shadow-sm ring-1 ring-violet-200"
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-800"
              }`}
            >
              {AUTH_ROUTES[role].label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
