"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function AlertRibbon() {
  const t = useTranslations("Home");
  const [open, setOpen] = useState(true);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          layout
          key="alert-ribbon"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
          className="overflow-hidden bg-primary text-primary-foreground text-xs"
        >
          <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3">
            <p>{t("alert")}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("alertDismiss")}
              className="opacity-70 hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
