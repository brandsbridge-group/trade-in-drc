"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL } from "./shared";

export function FilterSelect<T extends string>({
  label,
  value,
  onValueChange,
  allLabel,
  options,
  renderOption,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  allLabel: string;
  options: T[];
  renderOption?: (o: T) => string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 w-full rounded-full border-slate-200 bg-white px-3.5 text-[13px] shadow-none" aria-label={label}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL} className="text-xs">
          {allLabel}
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="text-xs">
            {renderOption ? renderOption(o) : o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
