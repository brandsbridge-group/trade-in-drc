"use client";

import { useLocale, useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SpecFieldsEditor } from "@/components/admin/spec-fields-editor";
import { termName, type CategoryTerm } from "@/lib/taxonomy/terms";

/** The specification template of one category, opened from its row in the tree. */
export function SpecFieldsSheet({
  category,
  onClose,
  onChanged,
}: {
  category: CategoryTerm | null;
  onClose: () => void;
  /** A field was added or removed: the tree's counters are stale. */
  onChanged: () => void;
}) {
  const t = useTranslations("Taxonomy.specsSheet");
  const locale = useLocale();
  if (!category) return null;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-full gap-0 overflow-y-auto bg-slate-50 p-0 sm:max-w-xl"
      >
        <SheetHeader className="gap-1 bg-white p-5 ring-1 ring-slate-200/70">
          <SheetTitle className="pr-8 font-display text-lg font-semibold text-market-navy">
            {t("title", { name: termName(category, locale) })}
          </SheetTitle>
          <SheetDescription className="text-[13px] leading-relaxed text-slate-500">{t("description")}</SheetDescription>
        </SheetHeader>
        <div className="p-4">
          <SpecFieldsEditor key={category.id} categoryId={category.id} onChanged={onChanged} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
