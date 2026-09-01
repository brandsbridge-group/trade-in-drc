"use client";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export function FilterChip({ label, value, onRemove }: FilterChipProps) {
  const t = useTranslations("Design");
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-full border border-slate-200 bg-card">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
      <button type="button" aria-label={t("remove")} onClick={onRemove} className="hover:text-foreground">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
