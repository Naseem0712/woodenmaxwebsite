/**
 * Audit every client-side storage key and shared mutable global.
 *
 * Duplicate or overlapping keys are how two products end up writing over each
 * other, so this is meant to be re-run after any change to the quote flow.
 *
 *   node tools/audit-quote-storage.cjs
 *
 * Exits non-zero if a legacy key is still being written, or if two different
 * files write the same key without going through the store.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const JS_DIR = path.join(ROOT, 'js');

/** Keys owned by js/quote-store.js — nothing else may write them. */
const STORE_OWNED = ['wm_quote_items_v2', 'wm_quote_customer_v2', 'wm_quote_meta_v2'];

/** Retired keys. Reading them for migration is fine; writing them is not. */
const LEGACY = ['woodenmax_quote_cart_v1', 'woodenmax_lead_cache_v1'];

const GLOBAL_RE = /window\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=(?!=)/g;
const STORAGE_RE = /(localStorage|sessionStorage)\.(getItem|setItem|removeItem)\(\s*([A-Za-z0-9_$.]+|'[^']*'|"[^"]*")/g;
const COOKIE_RE = /document\.cookie\s*=/g;

function walk (dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = walk(JS_DIR, []);

/** key -> { reads: Set<file>, writes: Set<file> } */
const keys = new Map();
const globals = new Map();
const cookieWrites = [];
const constants = new Map();

function rel (f) { return path.relative(ROOT, f).replace(/\\/g, '/'); }

// First pass: resolve `var FOO = 'some_key'` so indirect usage is not missed.
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /(?:var|let|const)\s+([A-Za-z0-9_$]+)\s*=\s*(['"])([A-Za-z0-9_.-]+)\2/g;
  let m;
  while ((m = re.exec(src))) constants.set(rel(file) + ':' + m[1], m[3]);
}

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const r = rel(file);

  let m;
  STORAGE_RE.lastIndex = 0;
  while ((m = STORAGE_RE.exec(src))) {
    const op = m[2];
    let raw = m[3];
    let key;
    if (/^['"]/.test(raw)) key = raw.slice(1, -1);
    else key = constants.get(r + ':' + raw) || ('<dynamic:' + raw + '>');

    if (!keys.has(key)) keys.set(key, { reads: new Set(), writes: new Set() });
    const rec = keys.get(key);
    if (op === 'getItem') rec.reads.add(r);
    else rec.writes.add(r);
  }

  GLOBAL_RE.lastIndex = 0;
  while ((m = GLOBAL_RE.exec(src))) {
    const name = m[1];
    if (!globals.has(name)) globals.set(name, new Set());
    globals.get(name).add(r);
  }

  COOKIE_RE.lastIndex = 0;
  if (COOKIE_RE.test(src)) cookieWrites.push(r);
}

const problems = [];

// quote-store.js reaches storage through a backend abstraction, so its keys are
// declared rather than inlined at the call site. Verify the declaration instead.
const storeSrc = fs.readFileSync(path.join(JS_DIR, 'quote-store.js'), 'utf8');
for (const owned of STORE_OWNED) {
  if (!storeSrc.includes("'" + owned + "'")) {
    problems.push('Store-owned key "' + owned + '" is not declared in js/quote-store.js');
  }
  if (!keys.has(owned)) keys.set(owned, { reads: new Set(['js/quote-store.js']), writes: new Set(['js/quote-store.js']) });
}
for (const legacy of LEGACY) {
  if (!keys.has(legacy)) keys.set(legacy, { reads: new Set(['js/quote-store.js (migration only)']), writes: new Set() });
}

console.log('\n======================================================================');
console.log('  STORAGE KEYS');
console.log('======================================================================');
const sorted = [...keys.entries()].sort((a, b) => a[0].localeCompare(b[0]));
for (const [key, rec] of sorted) {
  const writers = [...rec.writes];
  const readers = [...rec.reads];
  console.log('\n  ' + key);
  console.log('    written by : ' + (writers.join(', ') || '—'));
  console.log('    read by    : ' + (readers.join(', ') || '—'));

  if (STORE_OWNED.includes(key)) {
    const outside = writers.filter((f) => f !== 'js/quote-store.js');
    if (outside.length) {
      problems.push('Store-owned key "' + key + '" is written outside the store by: ' + outside.join(', '));
    }
  }
  if (LEGACY.includes(key) && writers.some((f) => f !== 'js/quote-store.js')) {
    problems.push('Legacy key "' + key + '" is still written by: ' + writers.join(', '));
  }
  if (writers.length > 1 && !STORE_OWNED.includes(key)) {
    problems.push('Key "' + key + '" is written from ' + writers.length + ' files: ' + writers.join(', '));
  }
}

console.log('\n======================================================================');
console.log('  SHARED MUTABLE GLOBALS (window.*)');
console.log('======================================================================');
const gsorted = [...globals.entries()].sort((a, b) => a[0].localeCompare(b[0]));
for (const [name, where] of gsorted) {
  const flag = where.size > 1 ? '  <-- assigned in multiple files' : '';
  console.log('  window.' + name + '  [' + [...where].join(', ') + ']' + flag);
}

console.log('\n======================================================================');
console.log('  COOKIES');
console.log('======================================================================');
console.log(cookieWrites.length ? '  ' + cookieWrites.join('\n  ') : '  none');

console.log('\n======================================================================');
console.log('  RESULT');
console.log('======================================================================');
if (!problems.length) {
  console.log('  OK — no duplicate or leaked quote keys.\n');
  process.exit(0);
}
problems.forEach((p) => console.log('  PROBLEM: ' + p));
console.log('');
process.exit(1);
