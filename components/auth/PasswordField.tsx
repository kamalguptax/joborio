"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { authInput } from "@/components/auth/authStyles";

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
};

/** Password input with a show / hide toggle. */
export default function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  required = true,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${authInput} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1 top-2 flex h-[52px] w-12 items-center justify-center rounded-xl text-slate-400 transition hover:text-violet-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}
