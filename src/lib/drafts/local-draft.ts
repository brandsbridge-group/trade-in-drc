/**
 * Unsaved form edits kept in this browser, so leaving a page (or reloading it)
 * before pressing Save loses nothing. A draft holds only the fields that differ
 * from what is stored, so values changed elsewhere in the meantime still win
 * for every field the user did not touch.
 */

/** Storage can be unavailable (private mode, blocked site data): never let it break a form. */
export function readLocalDraft<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : null;
  } catch {
    return null;
  }
}

/** Save the draft, or remove it when `draft` is null. */
export function writeLocalDraft(key: string, draft: object | null): void {
  try {
    if (draft) window.localStorage.setItem(key, JSON.stringify(draft));
    else window.localStorage.removeItem(key);
  } catch {
    // Nothing to do: the form simply works without a draft.
  }
}

/** The fields of `current` that differ from `saved`; null when nothing differs. */
export function changedFields<T extends { [K in keyof T]: string }>(current: T, saved: T): Partial<T> | null {
  const changed: Partial<T> = {};
  for (const key of Object.keys(current) as (keyof T)[]) {
    if (current[key] !== saved[key]) changed[key] = current[key];
  }
  return Object.keys(changed).length > 0 ? changed : null;
}

/**
 * Lay a stored draft over the saved values. Only string fields the form still
 * has are taken, so an old or tampered draft cannot inject anything else.
 */
export function applyDraft<T extends { [K in keyof T]: string }>(saved: T, draft: unknown): T {
  if (!draft || typeof draft !== "object") return saved;
  const next = { ...saved };
  for (const key of Object.keys(saved) as (keyof T)[]) {
    const value = (draft as Record<string, unknown>)[key as string];
    if (typeof value === "string") next[key] = value as T[keyof T];
  }
  return next;
}
