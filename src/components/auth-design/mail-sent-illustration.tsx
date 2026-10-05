"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Envelope + letter + check badge, drawn in the brand palette
 * (primary #0047AB, gold #D9A441). Decorative only.
 */
export function MailSentIllustration() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto h-28 w-36" aria-hidden>
      {/* Soft halo */}
      <div className="absolute inset-x-4 inset-y-2 rounded-full bg-[radial-gradient(circle,rgba(0,71,171,0.12),transparent_70%)]" />

      <svg viewBox="0 0 208 160" className="relative h-full w-full">
        <defs>
          <linearGradient id="env-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1E5FC4" />
            <stop offset="1" stopColor="#0047AB" />
          </linearGradient>
          <linearGradient id="env-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2B6BD0" />
            <stop offset="1" stopColor="#003A8C" />
          </linearGradient>
          <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E7C173" />
            <stop offset="1" stopColor="#C8941F" />
          </linearGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0B1B33" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Sparkles */}
        <g fill="#D9A441">
          <path d="M24 42l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity="0.8" />
          <path d="M184 30l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" opacity="0.6" />
          <circle cx="178" cy="112" r="2.5" opacity="0.5" />
          <circle cx="32" cy="104" r="2" opacity="0.4" />
        </g>

        <g filter="url(#soft)">
          {/* Envelope back */}
          <path d="M44 72h120v64a6 6 0 0 1-6 6H50a6 6 0 0 1-6-6z" fill="url(#env-back)" />
          {/* Letter */}
          <rect x="60" y="30" width="88" height="86" rx="6" fill="#fff" />
          <rect x="72" y="44" width="22" height="22" rx="4" fill="#E8EFFA" />
          <rect x="100" y="48" width="36" height="5" rx="2.5" fill="#D6E2F5" />
          <rect x="100" y="58" width="26" height="5" rx="2.5" fill="#E8EFFA" />
          <rect x="72" y="76" width="64" height="5" rx="2.5" fill="#E8EFFA" />
          <rect x="72" y="86" width="50" height="5" rx="2.5" fill="#E8EFFA" />
          {/* Envelope front flaps */}
          <path d="M44 78l60 38 60-38v58a6 6 0 0 1-6 6H50a6 6 0 0 1-6-6z" fill="url(#env-front)" />
          <path d="M44 142l50-36m70 36l-50-36" stroke="#fff" strokeOpacity="0.12" strokeWidth="1.5" />
        </g>
      </svg>

      {/* Check badge — small delighter pop (MOTION.md §2.6, Jhey selective). */}
      <motion.div
        className="absolute right-3 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#E7C173,#C8941F)] shadow-lg shadow-amber-700/30 ring-[3px] ring-white"
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.35, delay: 0.15 }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </motion.div>
    </div>
  );
}
