"use client";

import { useSyncExternalStore } from "react";

import type { ChainKey } from "@/lib/marketplace/chain";

/**
 * "My operation" — the providers a visitor has set aside across the chain
 * pages before sending one request to the team. A per-viewer draft, so it lives
 * in localStorage (wrapped in try/catch: private windows can throw); the
 * submitted request is what the team actually receives.
 */
export interface OperationItem {
  id: string;
  name: string;
  segment: ChainKey;
  /** "company" → companies.id, "institution" → institutions.id. */
  kind: "company" | "institution";
}

const KEY = "tidrc.operation.v1";
const EVENT = "tidrc:operation";
const MAX_ITEMS = 20;
const EMPTY: OperationItem[] = [];

let cacheRaw: string | null = null;
let cacheItems: OperationItem[] = EMPTY;

function read(): OperationItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  // Same string → same array, so useSyncExternalStore sees a stable snapshot.
  if (raw === cacheRaw) return cacheItems;
  cacheRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cacheItems = Array.isArray(parsed) ? (parsed as OperationItem[]) : EMPTY;
  } catch {
    cacheItems = EMPTY;
  }
  return cacheItems;
}

function write(items: OperationItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // Storage unavailable: the basket simply doesn't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useOperation() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    items,
    has: (id: string) => items.some((i) => i.id === id),
    toggle: (item: OperationItem) =>
      write(
        items.some((i) => i.id === item.id)
          ? items.filter((i) => i.id !== item.id)
          : [...items, item],
      ),
    remove: (id: string) => write(items.filter((i) => i.id !== id)),
    clear: () => write([]),
  };
}
