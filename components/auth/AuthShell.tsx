import type { ReactNode } from "react";
import AuthLogo, { JobOrioMark } from "@/components/auth/AuthLogo";
import AuthShowcase from "@/components/auth/AuthShowcase";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Small line under the form, e.g. "Already have an account? Log in" */
  footer?: ReactNode;
  variant?: "login" | "signup";
};

/**
 * Full-width split layout used by login, signup, forgot-password and reset-password:
 * form on the left (straight on the page, no box), product showcase on the right.
 */
export default function AuthShell({ title, subtitle, children, footer, variant = "login" }: Props) {
  return (
    <div className="min-h-svh bg-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]">
      <div className="flex min-h-svh min-w-0 flex-col px-6 py-6 sm:px-12 lg:px-16 lg:py-8 xl:px-24">
        <AuthLogo />

        <div className="mx-auto my-auto w-full max-w-[440px] py-10">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#3F2AA8_0%,#7C3AED_100%)] shadow-lg shadow-violet-500/30">
            <JobOrioMark className="h-6 w-6" color="#fff" />
          </span>

          <h1 className="mt-7 text-[32px] font-bold leading-[1.15] tracking-[-0.035em] text-[#0F1B3D] sm:text-[34px]">
            {title}
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-500">{subtitle}</p>
          <hr className="my-8 border-slate-200" />

          {children}

          {footer ? <div className="mt-8 text-center text-[15px] text-slate-500">{footer}</div> : null}
        </div>
      </div>

      <div className="hidden lg:block lg:p-3">
        <div className="sticky top-3 h-[calc(100svh-1.5rem)] min-h-[600px]">
          <AuthShowcase variant={variant} />
        </div>
      </div>
    </div>
  );
}
