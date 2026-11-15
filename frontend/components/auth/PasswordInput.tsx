"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import { authField } from "@/components/auth/authStyles";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** Password field with a show/hide eye button inside the input. */
export default function PasswordInput({ className, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`${className ?? authField} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1.5 top-[calc(50%+3px)] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:text-violet-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
