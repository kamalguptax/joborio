import type { ReactNode } from "react";

type Props = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Site-wide pattern: left-aligned section headings. */
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  /** `hero` = page H1 size; `section` = H2 section size. */
  variant?: "hero" | "section";
  /** Dark surfaces (PageHero / CTA bands). */
  tone?: "default" | "onDark";
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  id?: string;
};

/**
 * Shared marketing section / page heading stack.
 * Eyebrow → title (mt-3) → description (mt-4).
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as = "h2",
  variant = "section",
  tone = "default",
  className = "",
  titleClassName = "",
  descriptionClassName = "",
  id,
}: Props) {
  const Tag = as;
  const centered = align === "center";
  const onDark = tone === "onDark";

  return (
    <header
      id={id}
      className={[
        centered ? "mx-auto text-center" : "text-left",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {eyebrow ? (
        <p
          className={
            onDark
              ? "text-eyebrow text-slate-200"
              : "text-eyebrow text-violet-600"
          }
        >
          {eyebrow}
        </p>
      ) : null}

      <Tag
        className={[
          variant === "hero" ? "text-page-hero" : "text-section-heading",
          eyebrow ? "mt-3" : "",
          onDark ? "text-white" : "text-[#0F1B3D]",
          centered ? "mx-auto" : "",
          titleClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {title}
      </Tag>

      {description ? (
        <p
          className={[
            "text-section-copy mt-4",
            onDark ? "text-slate-300" : "",
            centered ? "mx-auto" : "",
            descriptionClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}
