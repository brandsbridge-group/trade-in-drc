"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { Json } from "@/lib/supabase/types";

/**
 * Structured rich-text body editor for the CMS. The body is persisted as JSONB
 * in the shape `{ blocks: [{ type: "paragraph", text: string }] }` — matching
 * the public `bodyToParagraphs` reader in `@/lib/content/pages`. Each block is a
 * paragraph; admins can add, remove, and reorder blocks.
 */

interface BodyBlock {
  type: "paragraph";
  text: string;
}

export interface StructuredBodyValue {
  blocks: BodyBlock[];
}

/** Normalize an arbitrary stored JSONB body into the editor's block array. */
export function jsonToBlocks(body: Json | undefined | null): BodyBlock[] {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    if (typeof body === "object" && body && "text" in body) {
      const text = (body as Record<string, unknown>).text;
      if (typeof text === "string" && text.trim().length > 0) {
        return text.split(/\n{2,}/).map((t) => ({ type: "paragraph", text: t.trim() }));
      }
    }
    return [];
  }
  const blocks = (body as Record<string, unknown>).blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks
    .map((b) =>
      b && typeof b === "object" && "text" in b
        ? { type: "paragraph" as const, text: String((b as Record<string, unknown>).text ?? "") }
        : null
    )
    .filter((b): b is BodyBlock => b !== null);
}

/** Serialize blocks back to the stored JSONB shape. */
export function blocksToJson(blocks: BodyBlock[]): StructuredBodyValue {
  return { blocks: blocks.filter((b) => b.text.trim().length > 0) };
}

interface StructuredBodyEditorProps {
  label: string;
  blocks: BodyBlock[];
  onChange: (blocks: BodyBlock[]) => void;
  addLabel: string;
  emptyLabel: string;
  paragraphPlaceholder: string;
}

export function StructuredBodyEditor({
  label,
  blocks,
  onChange,
  addLabel,
  emptyLabel,
  paragraphPlaceholder,
}: StructuredBodyEditorProps) {
  const t = useTranslations("AdminCms");
  const updateText = (index: number, text: string) => {
    onChange(blocks.map((b, i) => (i === index ? { ...b, text } : b)));
  };

  const addBlock = () => {
    onChange([...blocks, { type: "paragraph", text: "" }]);
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      {blocks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <div key={index} className="flex items-start gap-2">
              <Textarea
                value={block.text}
                onChange={(e) => updateText(index, e.target.value)}
                placeholder={paragraphPlaceholder}
                rows={3}
                className="flex-1"
              />
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveBlock(index, -1)}
                  disabled={index === 0}
                  aria-label={t("moveUp")}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveBlock(index, 1)}
                  disabled={index === blocks.length - 1}
                  aria-label={t("moveDown")}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeBlock(index)}
                  aria-label={t("removeParagraph")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addBlock}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}
