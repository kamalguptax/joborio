import Link from "next/link";

export default function Logo({
  compact = false,
  tone = "light",
}: {
  compact?: boolean;
  /** "light" = white wordmark (dark backgrounds), "dark" = navy wordmark (white backgrounds). */
  tone?: "light" | "dark";
}) {
  const src = tone === "dark" ? "/images/upclift-logo.png" : "/images/upclift-logo-light.png";
  return (
    <Link
      href="/"
      aria-label="Upclift"
      className={`flex shrink-0 items-center transition-all duration-300 ${
        compact ? "w-[120px] sm:w-[132px]" : "w-[150px] sm:w-[176px]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Upclift Logo"
        width={1220}
        height={340}
        className="h-auto w-full object-contain"
      />
    </Link>
  );
}
