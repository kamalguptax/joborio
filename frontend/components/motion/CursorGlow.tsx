"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Site-wide mouse effect (desktop only):
 *  - a soft violet light that trails the cursor
 *  - a small ring that grows over links, buttons and sliders
 */
export default function CursorGlow() {
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const [seen, setSeen] = useState(false);

  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const glowX = useSpring(x, { stiffness: 90, damping: 20, mass: 0.8 });
  const glowY = useSpring(y, { stiffness: 90, damping: 20, mass: 0.8 });
  const ringX = useSpring(x, { stiffness: 420, damping: 32, mass: 0.35 });
  const ringY = useSpring(y, { stiffness: 420, damping: 32, mass: 0.35 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    const raf = requestAnimationFrame(() => setEnabled(true));

    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setSeen(true);
      const t = e.target as Element | null;
      setHover(!!t?.closest("a, button, [role='slider'], [data-cursor='hover']"));
    };
    const dn = () => setDown(true);
    const up = () => setDown(false);
    const leave = () => setSeen(false);

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", dn);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", dn);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <motion.div
        style={{ x: glowX, y: glowY }}
        animate={{ opacity: seen ? 1 : 0 }}
        className="absolute left-0 top-0 -ml-[260px] -mt-[260px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.16),transparent_62%)]"
      />
      <motion.div
        style={{ x: ringX, y: ringY }}
        animate={{ opacity: seen ? 1 : 0, scale: down ? 0.8 : hover ? 2.2 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="absolute left-0 top-0 -ml-3 -mt-3 h-6 w-6 rounded-full border border-white mix-blend-difference"
      />
    </div>
  );
}
