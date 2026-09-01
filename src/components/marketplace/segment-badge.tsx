"use client";
import { useTranslations } from "next-intl";
import { Factory, Truck, Globe, Banknote, Landmark, Building, Briefcase, ShipWheel, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SegmentKey } from "@/lib/marketplace/segments";

const iconBySegment: Record<SegmentKey, React.ElementType> = {
  manufacturer: Factory,
  importer: Truck,
  exporter: Globe,
  finance: Banknote,
  logistics: ShipWheel,
  government: Landmark,
  public_corp: Building,
  facilitation: Briefcase,
  investors: CircleDollarSign,
};

export function SegmentBadge({ segment, className }: { segment: SegmentKey; className?: string }) {
  const t = useTranslations("Market.segments");
  const Icon = iconBySegment[segment];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full bg-muted text-foreground",
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {t(segment)}
    </span>
  );
}
