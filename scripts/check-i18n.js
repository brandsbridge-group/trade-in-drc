#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
// check-i18n.js — i18n key audit
// Reports keys missing in EN or FR, and keys defined but never referenced in src/

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const EN_PATH = path.join(ROOT, "src/config/messages/en.json");
const FR_PATH = path.join(ROOT, "src/config/messages/fr.json");
const SRC_DIR = path.join(ROOT, "src");

// ── helpers ────────────────────────────────────────────────────────────────

function flatKeys(obj, prefix = "") {
  return Object.keys(obj).flatMap((k) => {
    const full = prefix ? `${prefix}.${k}` : k;
    return typeof obj[k] === "object" && obj[k] !== null
      ? flatKeys(obj[k], full)
      : [full];
  });
}

function walkFiles(dir, ext, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, ext, results);
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

// ── load messages ──────────────────────────────────────────────────────────

const en = JSON.parse(fs.readFileSync(EN_PATH, "utf8"));
const fr = JSON.parse(fs.readFileSync(FR_PATH, "utf8"));

const enKeys = new Set(flatKeys(en));
const frKeys = new Set(flatKeys(fr));

// ── 1. key drift: EN vs FR ─────────────────────────────────────────────────

const onlyInEn = [...enKeys].filter((k) => !frKeys.has(k));
const onlyInFr = [...frKeys].filter((k) => !enKeys.has(k));

// ── 2. unused keys — defined but never referenced in src/ ─────────────────

const srcFiles = [
  ...walkFiles(SRC_DIR, ".tsx"),
  ...walkFiles(SRC_DIR, ".ts"),
];

const srcContent = srcFiles.map((f) => fs.readFileSync(f, "utf8")).join("\n");

// next-intl usage patterns:
//   t("some.key")  t('some.key')  useTranslations("Ns")  getTranslations({namespace:"Ns"})
// We collect every quoted string that looks like a dotted key reference.
const quotedStrings = new Set(
  [...srcContent.matchAll(/["'`]([A-Za-z][A-Za-z0-9_.]*[A-Za-z0-9]|[A-Za-z0-9]+)["'`]/g)].map(
    (m) => m[1]
  )
);

// A key is "referenced" if any suffix of its dot-path appears in quoted strings.
// e.g. key "Auth.accountSettings.email" is referenced by t("email") inside useTranslations("Auth.accountSettings")
// or by t("accountSettings.email") inside useTranslations("Auth"), etc.
function isReferenced(key) {
  const parts = key.split(".");
  // Check all possible suffixes: the full key and every trailing sub-path
  for (let i = 0; i < parts.length; i++) {
    const suffix = parts.slice(i).join(".");
    if (quotedStrings.has(suffix)) return true;
  }
  // Also check if the top-level namespace appears as a useTranslations argument
  // and a sub-path of the key appears separately (loose heuristic)
  return false;
}

const unusedInEn = [...enKeys].filter((k) => !isReferenced(k));

// ── report ─────────────────────────────────────────────────────────────────

console.log("=== i18n Key Audit ===\n");

console.log(`EN keys: ${enKeys.size}  |  FR keys: ${frKeys.size}\n`);

if (onlyInEn.length === 0) {
  console.log("✓ No keys in EN missing from FR");
} else {
  console.log(`✗ Keys in EN but MISSING in FR (${onlyInEn.length}):`);
  onlyInEn.forEach((k) => console.log(`  - ${k}`));
}

console.log();

if (onlyInFr.length === 0) {
  console.log("✓ No keys in FR missing from EN");
} else {
  console.log(`✗ Keys in FR but MISSING in EN (${onlyInFr.length}):`);
  onlyInFr.forEach((k) => console.log(`  - ${k}`));
}

console.log();

if (unusedInEn.length === 0) {
  console.log("✓ No EN keys appear unused");
} else {
  console.log(`~ Possibly unused EN keys (${unusedInEn.length}) — verify manually:`);
  unusedInEn.forEach((k) => console.log(`  ? ${k}`));
}
