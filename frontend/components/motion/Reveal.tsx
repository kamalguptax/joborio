"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export type RevealKind = "up" | "down" | "left" | "right" | "zoom" | "blur" | "flip";

const ease = [0.22, 1, 0.36, 1] as const;

function hiddenState(kind: RevealKind, d: number) {
  switch (kind) {
    case "up":    return { opacity: 0, y: d };
    case "down":  return { opacity: 0, y: -d };
    case "left":  return { opacity: 0, x: d };
    case "right": return { opacity: 0, x: -d };
    case "zoom":  return { opacity: 0, scale: 0.88 };
    case "blur":  return { opacity: 0, y: d / 2, filter: "blur(14px)" };
    case "flip":  return { opacity: 0, rotateX: -35, y: d / 2, transformPerspective: 800 };
  }
}

const shownState = { opacity: 1, x: 0, y: 0, scale: 1, rotateX: 0, filter: "blur(0px)" };

type RevealProps = {
  children: ReactNode;
  kind?: RevealKind;
  delay?: number;
  duration?: number;
  distance?: number;
  amount?: number;
  once?: boolean;
  className?: string;
};

/** Scroll-reveal wrapper. Plays once when the element enters the viewport. */
export function Reveal({
  children,
  kind = "up",
  delay = 0,
  duration = 0.8,
  distance = 36,
  amount = 0.2,
  once = true,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={hiddenState(kind, distance)}
      whileInView={shownState}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Stagger: children animate one after another ---------- */

const container = (gap: number, delay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

const item = (kind: RevealKind, d: number): Variants => ({
  hidden: hiddenState(kind, d),
  show: { ...shownState, transition: { duration: 0.75, ease } },
});

export function Stagger({
  children,
  gap = 0.1,
  delay = 0,
  amount = 0.15,
  className,
}: {
  children: ReactNode;
  gap?: number;
  delay?: number;
  amount?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={container(gap, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  kind = "up",
  distance = 36,
  className,
}: {
  children: ReactNode;
  kind?: RevealKind;
  distance?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={item(kind, distance)}>
      {children}
    </motion.div>
  );
}
