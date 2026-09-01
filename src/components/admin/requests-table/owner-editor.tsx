"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

export function OwnerEditor({
  value,
  placeholder,
  disabled,
  onSave,
}: {
  value: string | null;
  placeholder: string;
  disabled: boolean;
  onSave: (owner: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? "");

  React.useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  function commit() {
    setEditing(false);
    if ((draft.trim() || null) !== (value ?? null)) {
      onSave(draft.trim());
    }
  }

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value ?? "");
            setEditing(false);
          }
        }}
        placeholder={placeholder}
        className="h-7 w-36 text-xs"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      disabled={disabled}
      className="rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
    >
      {value || placeholder}
    </button>
  );
}
