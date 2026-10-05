"use client";

import { ArrowLeft } from "lucide-react";

/** "Previous page" on the navy 404 hero: the browser's own back, nothing more. */
export function BackButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors hover:bg-white/10"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
