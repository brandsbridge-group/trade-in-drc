"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function AnimatedField({ show, children }: { show: boolean; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="field"
          initial={reduce ? false : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: reduce ? 0 : 0.15, ease: "easeOut" }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
