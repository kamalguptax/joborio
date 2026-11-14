"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ElementType } from "react";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  /** words that get `accentClassName` (e.g. a gradient) */
  accent?: string[];
  accentClassName?: string;
  delay?: number;
  stagger?: number;
};

/** Headline that rises word by word when scrolled into view. */
export function SplitText({
  text,
  as: Tag = "h2",
  className,
  accent = [],
  accentClassName = "",
  delay = 0,
  stagger = 0.06,
}: Props) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  if (reduce) return <Tag className={className}>{text}</Tag>;

  return (
    <Tag className={className} aria-label={text}>
      <motion.span
        aria-hidden="true"
        className="inline"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.6 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      >
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.14em] pr-[0.08em] -mr-[0.08em] align-bottom">
            <motion.span
              className={`inline-block pr-[0.1em] -mr-[0.1em] ${accent.includes(w) ? accentClassName : ""}`}
              variants={{
                hidden: { y: "110%", rotate: 4, opacity: 0 },
                show: { y: "0%", rotate: 0, opacity: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              {w}
            </motion.span>
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
