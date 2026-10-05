/**
 * Product specifications: the category's template fields plus the seller's own
 * free lines, all stored in `products.specs` as one flat `{ key: value }`
 * object (migration 00055). Pure helpers shared by the seller's form, the
 * console and the public marketplace.
 */

export const SPEC_FIELD_TYPES = ["text", "number", "select", "boolean"] as const;
export type SpecFieldType = (typeof SPEC_FIELD_TYPES)[number];

export interface SpecOption {
  value: string;
  label_en: string;
  label_fr: string;
}

/** A row of `category_spec_fields`, as the readers need it. */
export interface SpecField {
  key: string;
  label_en: string;
  label_fr: string;
  field_type: SpecFieldType;
  unit: string | null;
  options: SpecOption[];
  required: boolean;
  sort_order: number;
}

/** A free line typed by the seller. */
export interface CustomSpec {
  /** Stable React key; never stored. */
  id: string;
  label: string;
  value: string;
}

export type SpecValue = string | number | boolean;
export type Specs = Record<string, SpecValue>;

/** Most characteristics a product can carry (template + free lines). */
export const MAX_SPECS = 30;
export const SPEC_LABEL_MAX = 60;
export const SPEC_VALUE_MAX = 200;

/** `category_spec_fields.options` comes back as loose JSON: keep only well-formed choices. */
export function parseOptions(raw: unknown): SpecOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const o = item as Record<string, unknown>;
    if (typeof o.value !== "string" || !o.value) return [];
    const en = typeof o.label_en === "string" && o.label_en ? o.label_en : o.value;
    const fr = typeof o.label_fr === "string" && o.label_fr ? o.label_fr : en;
    return [{ value: o.value, label_en: en, label_fr: fr }];
  });
}

/** Normalizes rows selected from `category_spec_fields`, in display order. */
export function toSpecFields(rows: unknown): SpecField[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const r = row as Record<string, unknown>;
      if (typeof r.key !== "string" || typeof r.label_en !== "string") return [];
      const type = SPEC_FIELD_TYPES.includes(r.field_type as SpecFieldType) ? (r.field_type as SpecFieldType) : "text";
      return [
        {
          key: r.key,
          label_en: r.label_en,
          label_fr: typeof r.label_fr === "string" && r.label_fr ? r.label_fr : r.label_en,
          field_type: type,
          unit: typeof r.unit === "string" && r.unit.trim() ? r.unit.trim() : null,
          options: parseOptions(r.options),
          required: r.required === true,
          sort_order: typeof r.sort_order === "number" ? r.sort_order : 0,
        },
      ];
    })
    .sort((a, b) => a.sort_order - b.sort_order || a.label_en.localeCompare(b.label_en));
}

/** French for French readers, English for everyone else (the template has those two). */
export function specLabel(row: { label_en: string; label_fr: string }, locale: string): string {
  return locale === "fr" ? row.label_fr : row.label_en;
}

/** "Moisture content (%)" → "moisture_content": the stable key stored in products.specs. */
export function slugifySpecKey(label: string): string {
  const slug = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[0-9_]+/, "")
    .slice(0, 60);
  return slug;
}

/** Key written by older products and free lines → something readable ("lead_time" → "Lead time"). */
export function humanizeSpecKey(key: string): string {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface SpecEntry {
  label: string;
  value: string;
}

/**
 * Printable characteristics of a product. Template fields come first, in the
 * template's order, with their localized label, unit and option label; the
 * rest (free lines, and specs written before templates existed) follow.
 * Without `fields` every entry is treated as a free line.
 */
export function specEntries(
  specs: unknown,
  options: { fields?: SpecField[]; locale?: string; yes?: string; no?: string } = {}
): SpecEntry[] {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return [];
  const record = specs as Record<string, unknown>;
  const { fields = [], locale = "en", yes = "✓", no = "—" } = options;
  const entries: SpecEntry[] = [];
  const used = new Set<string>();

  for (const field of fields) {
    const raw = record[field.key];
    used.add(field.key);
    let value: string | null = null;
    if (field.field_type === "boolean") {
      if (raw === true || raw === "true") value = yes;
      else if (raw === false || raw === "false") value = no;
    } else if (typeof raw === "number" || (typeof raw === "string" && raw.trim() !== "")) {
      const text = String(raw).trim();
      if (field.field_type === "select") {
        const option = field.options.find((o) => o.value === text);
        value = option ? specLabel(option, locale) : text;
      } else if (field.field_type === "number" && field.unit) {
        value = `${text} ${field.unit}`;
      } else {
        value = text;
      }
    }
    if (value !== null) entries.push({ label: specLabel(field, locale), value });
  }

  for (const [key, raw] of Object.entries(record)) {
    if (used.has(key)) continue;
    if (typeof raw === "number" || (typeof raw === "string" && raw.trim() !== "")) {
      entries.push({ label: humanizeSpecKey(key), value: String(raw).trim() });
    } else if (typeof raw === "boolean") {
      entries.push({ label: humanizeSpecKey(key), value: raw ? yes : no });
    }
  }
  return entries;
}

/** Form state of the template part: every value as the input holds it. */
export type TemplateValues = Record<string, string>;

/**
 * Splits stored specs for the form: what belongs to the category's template,
 * and what becomes free lines (including values whose field is not in this
 * template — nothing the seller typed is ever dropped by a category change).
 */
export function splitSpecs(specs: unknown, fields: SpecField[]): { values: TemplateValues; custom: CustomSpec[] } {
  const record = specs && typeof specs === "object" && !Array.isArray(specs) ? (specs as Record<string, unknown>) : {};
  const keys = new Set(fields.map((f) => f.key));
  const values: TemplateValues = {};
  const custom: CustomSpec[] = [];
  let n = 0;
  for (const [key, raw] of Object.entries(record)) {
    if (raw === null || raw === undefined || typeof raw === "object") continue;
    const text = String(raw);
    if (keys.has(key)) values[key] = text;
    else if (text.trim()) custom.push({ id: `stored-${n++}`, label: humanizeSpecKey(key), value: text });
  }
  return { values, custom };
}

export type BuildSpecsResult =
  | { ok: true; specs: Specs }
  | { ok: false; missing: string[]; invalidNumbers: string[]; incompleteRows: string[]; duplicates: string[]; tooMany: boolean };

/**
 * What gets saved in `products.specs`. Empty optional fields and empty free
 * lines are left out; the save is refused (with the offending items) when a
 * required field is empty, a number is not a number, a free line has a name or
 * a value but not both, or two characteristics share a name.
 */
export function buildSpecs(input: { fields: SpecField[]; values: TemplateValues; custom: CustomSpec[] }): BuildSpecsResult {
  const specs: Specs = {};
  const missing: string[] = [];
  const invalidNumbers: string[] = [];
  const incompleteRows: string[] = [];
  const duplicates: string[] = [];

  for (const field of input.fields) {
    const text = (input.values[field.key] ?? "").trim();
    if (!text) {
      if (field.required) missing.push(field.key);
      continue;
    }
    if (field.field_type === "number") {
      const number = Number(text.replace(",", "."));
      if (!Number.isFinite(number)) invalidNumbers.push(field.key);
      else specs[field.key] = number;
    } else if (field.field_type === "boolean") {
      specs[field.key] = text === "true";
    } else {
      specs[field.key] = text.slice(0, SPEC_VALUE_MAX);
    }
  }

  // A free line may not reuse a template field's key or label, nor another line's name.
  const taken = new Set<string>();
  for (const field of input.fields) {
    taken.add(field.key);
    taken.add(slugifySpecKey(field.label_en));
    taken.add(slugifySpecKey(field.label_fr));
  }
  for (const row of input.custom) {
    const label = row.label.trim().slice(0, SPEC_LABEL_MAX);
    const value = row.value.trim().slice(0, SPEC_VALUE_MAX);
    if (!label && !value) continue;
    if (!label || !value) {
      incompleteRows.push(row.id);
      continue;
    }
    const slug = slugifySpecKey(label) || label.toLowerCase();
    if (taken.has(slug)) {
      duplicates.push(row.id);
      continue;
    }
    taken.add(slug);
    specs[label] = value;
  }

  const tooMany = Object.keys(specs).length > MAX_SPECS;
  if (missing.length || invalidNumbers.length || incompleteRows.length || duplicates.length || tooMany) {
    return { ok: false, missing, invalidNumbers, incompleteRows, duplicates, tooMany };
  }
  return { ok: true, specs };
}

/**
 * Category changed in the form: carry what was typed over to the new template.
 * A value whose field does not exist in the new template becomes a free line
 * (under the old field's label), and a free line named like one of the new
 * template's fields moves into that field — so switching category, even by
 * mistake and back, loses nothing.
 */
export function rebaseSpecs(input: {
  previousFields: SpecField[];
  nextFields: SpecField[];
  values: TemplateValues;
  custom: CustomSpec[];
  locale: string;
}): { values: TemplateValues; custom: CustomSpec[] } {
  const nextKeys = new Set(input.nextFields.map((f) => f.key));
  const values: TemplateValues = {};
  const custom: CustomSpec[] = [];

  for (const field of input.previousFields) {
    const text = (input.values[field.key] ?? "").trim();
    if (!text) continue;
    if (nextKeys.has(field.key)) values[field.key] = text;
    else {
      const unit = field.field_type === "number" && field.unit ? ` ${field.unit}` : "";
      custom.push({ id: `moved-${field.key}`, label: specLabel(field, input.locale), value: `${text}${unit}` });
    }
  }

  // Free lines: adopt the ones a new text field now covers, keep the rest.
  const bySlug = new Map<string, SpecField>();
  for (const field of input.nextFields) {
    if (field.field_type !== "text") continue;
    bySlug.set(field.key, field);
    bySlug.set(slugifySpecKey(field.label_en), field);
    bySlug.set(slugifySpecKey(field.label_fr), field);
  }
  for (const row of input.custom) {
    const match = bySlug.get(slugifySpecKey(row.label));
    if (match && row.value.trim() && !values[match.key]) values[match.key] = row.value.trim();
    else custom.push(row);
  }
  return { values, custom };
}
