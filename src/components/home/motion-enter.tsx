"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Jakub Krehel marketing-surface enter recipe.
 * Wraps any RSC child — fires once on mount, respects prefers-reduced-motion.
 */
export function MotionEnter({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, translateY: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, translateY: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", duration: 0.45, bounce: 0 }}
    >
      {children}
    </motion.div>
  );
}
