"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import type { PointerEvent, ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** max rotation in degrees */
  max?: number;
  /** hover scale */
  scale?: number;
  /** soft light that follows the cursor */
  glare?: boolean;
  glareColor?: string;
  className?: string;
  /** radius class, applied to the wrapper and the glare layer */
  rounded?: string;
};

/** 3D tilt + cursor-following light. Only reacts to mouse/pen, never touch. */
export function Tilt({
  children,
  max = 7,
  scale = 1.015,
  glare = true,
  glareColor = "rgba(255,255,255,0.45)",
  className = "",
  rounded = "rounded-3xl",
}: Props) {
  const reduce = useReducedMotion();
  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 20, mass: 0.6 });
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 20, mass: 0.6 });
  const s = useSpring(useMotionValue(1), { stiffness: 220, damping: 22 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glareOpacity = useSpring(useMotionValue(0), { stiffness: 160, damping: 22 });
  const bg = useMotionTemplate`radial-gradient(280px circle at ${gx}% ${gy}%, ${glareColor}, transparent 65%)`;

  if (reduce) return <div className={`${className} ${rounded}`}>{children}</div>;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 2 * max);
    rx.set(-(py - 0.5) * 2 * max);
    gx.set(px * 100);
    gy.set(py * 100);
    s.set(scale);
    glareOpacity.set(1);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    s.set(1);
    glareOpacity.set(0);
  };

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, scale: s, transformPerspective: 900 }}
      className={`relative will-change-transform ${rounded} ${className}`}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden="true"
          style={{ background: bg, opacity: glareOpacity }}
          className={`pointer-events-none absolute inset-0 z-20 ${rounded}`}
        />
      )}
    </motion.div>
  );
}
