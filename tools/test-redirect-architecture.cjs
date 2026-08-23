#!/usr/bin/env node
'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REDIRECTS = path.join(ROOT, '_redirects');
const MANIFEST = path.join(__dirname, 'redirect-regression-manifest.json');
const BASE = (process.env.REDIRECT_TEST_BASE || 'http://127.0.0.1:8793').replace(/\/$/, '');
const WRITE_MANIFEST = process.argv.includes('--write-manifest');
const DYNAMIC_RULES = [
  '/products/products/aluminium-windows/city/*',
  '/products/products/*',
  '/city/about/about/*',
  '/city/city/blog/*',
  '/city/city/*',
];

function parseRules(text, allowDuplicates = false, allowNonRelative = false) {
  const sources = new Set();
  const rules = [];
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [source, destination, code = '302'] = line.split(/\s+/);
    assert(source && destination, `Invalid redirect declaration at line ${index + 1}`);
    assert(allowDuplicates || !sources.has(source), `Duplicate redirect source: ${source}`);
    sources.add(source);
    assert(allowNonRelative || source.startsWith('/'), `Non-relative redirect source: ${source}`);
    const dynamic = source.includes('*') || /:[A-Za-z]/.test(source);
    rules.push({ line: index + 1, source, destination, status: Number(code), dynamic });
  }
  return rules;
}

function architecture(rules) {
  const staticRules = rules.filter((rule) => !rule.dynamic);
  const dynamicRules = rules.filter((rule) => rule.dynamic);
  const firstDynamic = rules.findIndex((rule) => rule.dynamic);
  if (firstDynamic !== -1) {
    assert(rules.slice(firstDynamic).every((rule) => rule.dynamic), 'Exact rule appears after the dynamic section');
  }
  assert.strictEqual(staticRules.length, 425, `Expected 425 static rules, got ${staticRules.length}`);
  assert.strictEqual(dynamicRules.length, 5, `Expected 5 dynamic rules, got ${dynamicRules.length}`);
  assert.strictEqual(rules.length, 430, `Expected 430 effective rules, got ${rules.length}`);
  assert.deepStrictEqual(dynamicRules.map((rule) => rule.source), DYNAMIC_RULES, 'Unexpected dynamic redirect set');
  return { staticRules, dynamicRules };
}

function makeManifest(rules) {
  const { staticRules, dynamicRules } = architecture(rules);
  return {
    version: 1,
    generatedFrom: '_redirects',
    architecture: { static: 425, dynamic: 5, effective: 430, ignoredRequired: 0 },
    exactRules: staticRules.map((rule) => ({
      source: rule.source,
      expectedStatus: rule.status,
      expectedDestination: rule.destination,
      allowedHops: rule.status >= 300 && rule.status < 400 ? 1 : 0,
      expectedFinalCanonical: null,
    })),
    dynamicRules: dynamicRules.map((rule) => ({
      source: rule.source,
      expectedStatus: rule.status,
      expectedDestination: rule.destination,
      allowedHops: 1,
    })),
    wildcardCases: {
      positive: [
        { source: '/products/products/aluminium-windows/city/hyderabad', destination: '/city/hyderabad' },
        { source: '/products/products/aluminium-windows/3-track-sliding-window', destination: '/products/aluminium-windows/3-track-sliding-window' },
        { source: '/city/city/hyderabad', destination: '/city/hyderabad' },
        { source: '/city/about/about/quality-testing-process', destination: '/about/quality-testing-process' },
        { source: '/city/city/blog/pergola-design-ideas-india', destination: '/blog/pergola-design-ideas-india' },
      ],
      negative: [
        '/products/aluminium-windows/3-track-sliding-window',
        '/city/hyderabad',
        '/about/quality-testing-process',
        '/blog/pergola-design-ideas-india',
      ],
    },
    identityChecks: [
      { source: '/products/mirror-profiles/', expectedStatus: 200, canonical: 'https://woodenmax.in/products/mirror-profiles/', ogUrl: 'https://woodenmax.in/products/mirror-profiles/' },
      { source: '/products/mirror-profiles', expectedStatus: 308, canonical: 'https://woodenmax.in/products/mirror-profiles/' },
      { source: '/products/pergola', expectedStatus: 200, canonical: 'https://woodenmax.in/products/pergola' },
      { source: '/products/metal-louvers', expectedStatus: 200, canonical: 'https://woodenmax.in/products/metal-louvers' },
    ],
  };
}

function readManifest(rules) {
  if (WRITE_MANIFEST) {
    const manifest = makeManifest(rules);
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Wrote ${path.relative(ROOT, MANIFEST)} with ${manifest.exactRules.length} exact cases.`);
    return manifest;
  }
  assert(fs.existsSync(MANIFEST), `Missing ${path.relative(ROOT, MANIFEST)}; run with --write-manifest after an approved redirect change.`);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const expected = makeManifest(rules);
  assert.deepStrictEqual(manifest.architecture, expected.architecture, 'Manifest architecture is stale');
  assert.deepStrictEqual(manifest.exactRules, expected.exactRules, 'Manifest exact-rule cases are stale');
  assert.deepStrictEqual(manifest.dynamicRules, expected.dynamicRules, 'Manifest dynamic-rule cases are stale');
  return manifest;
}

function relativeLocation(location, currentUrl) {
  const url = new URL(location, currentUrl);
  return url.pathname + url.search;
}

async function trace(source, maxHops = 5) {
  const hops = [];
  let current = BASE + source;
  for (let count = 0; count <= maxHops; count += 1) {
    const response = await fetch(current, { redirect: 'manual' });
    const location = response.headers.get('location') || '';
    const body = response.headers.get('content-type')?.includes('text/html') ? await response.text() : '';
    hops.push({ url: current, status: response.status, location, body });
    if (!(response.status >= 300 && response.status < 400) || !location) return hops;
    current = new URL(location, current).href;
  }
  throw new Error(`Redirect loop or excessive chain: ${source}`);
}

function canonicalFrom(html) {
  return html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] || '';
}

function ogUrlFrom(html) {
  return html.match(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
}

async function assertExactCase(testCase) {
  const hops = await trace(testCase.source, testCase.allowedHops + 1);
  const first = hops[0];
  assert.strictEqual(first.status, testCase.expectedStatus, `${testCase.source}: expected ${testCase.expectedStatus}, got ${first.status}`);
  if (testCase.expectedStatus >= 300 && testCase.expectedStatus < 400) {
    assert.strictEqual(relativeLocation(first.location, first.url), testCase.expectedDestination, `${testCase.source}: wrong redirect destination`);
  }
  assert.strictEqual(hops.length - 1, testCase.allowedHops, `${testCase.source}: expected ${testCase.allowedHops} redirect hop(s), got ${hops.length - 1}`);
  assert.strictEqual(hops.at(-1).status, 200, `${testCase.source}: final response is not 200`);
  assert(!/WoodenMax \| Premium Aluminium Windows, Glass Facades & Door Systems India/.test(hops.at(-1).body) || testCase.expectedDestination === '/', `${testCase.source}: homepage fallback detected`);
}

async function assertIdentity(check) {
  const hops = await trace(check.source, 2);
  const first = hops[0];
  assert.strictEqual(first.status, check.expectedStatus, `${check.source}: wrong initial status`);
  const final = hops.at(-1);
  assert.strictEqual(final.status, 200, `${check.source}: final response is not 200`);
  assert.strictEqual(canonicalFrom(final.body), check.canonical, `${check.source}: canonical mismatch`);
  if (check.ogUrl) assert.strictEqual(ogUrlFrom(final.body), check.ogUrl, `${check.source}: og:url mismatch`);
  if (check.source === '/products/mirror-profiles/') {
    assert(final.body.includes('"url": "https://woodenmax.in/products/mirror-profiles/"'), 'Mirror schema URL is not slash identity');
  }
}

function assertShowerUnchanged(rules) {
  const baseline = childProcess.execFileSync('git', ['show', 'HEAD:_redirects'], { cwd: ROOT, encoding: 'utf8' });
  const showerMap = (text) => new Map(parseRules(text, true, true)
    .filter((rule) => rule.source.includes('shower-partitions'))
    .map((rule) => [rule.source, `${rule.destination} ${rule.status}`]));
  assert.deepStrictEqual(showerMap(fs.readFileSync(REDIRECTS, 'utf8')), showerMap(baseline), 'Shower redirect mappings changed');
}

async function main() {
  const rules = parseRules(fs.readFileSync(REDIRECTS, 'utf8'));
  const manifest = readManifest(rules);
  const { staticRules, dynamicRules } = architecture(rules);
  assertShowerUnchanged(rules);
  if (WRITE_MANIFEST) return;

  for (const testCase of manifest.exactRules) await assertExactCase(testCase);
  for (const testCase of manifest.wildcardCases.positive) {
    await assertExactCase({ ...testCase, expectedStatus: 301, expectedDestination: testCase.destination, allowedHops: 1 });
  }
  for (const source of manifest.wildcardCases.negative) {
    const hops = await trace(source, 1);
    assert.strictEqual(hops[0].status, 200, `${source}: wildcard false-positive`);
  }
  for (const check of manifest.identityChecks) await assertIdentity(check);

  console.log(`Architecture: ${staticRules.length} static, ${dynamicRules.length} dynamic, ${rules.length} effective`);
  console.log(`Exact alias cases: ${manifest.exactRules.length} passed`);
  console.log(`Wildcard cases: ${manifest.wildcardCases.positive.length} positive, ${manifest.wildcardCases.negative.length} negative passed`);
  console.log('Identity and shower-preservation checks passed');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
