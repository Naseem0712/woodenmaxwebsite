#!/usr/bin/env node
'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { SLUGS, longPath, shortPath } = require('./shower-guide-identities.cjs');

const ROOT = path.resolve(__dirname, '..');
const BASE = (process.env.REDIRECT_TEST_BASE || 'http://127.0.0.1:8793').replace(/\/$/, '');
const MANIFEST = path.join(__dirname, 'shower-identity-manifest.json');
const WRITE_MANIFEST = process.argv.includes('--write-manifest');

function pageFile(slug) {
  return path.join(ROOT, 'products', 'shower-partitions', `${slug}.html`);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeIdentityUrls(text) {
  let result = text;
  for (const slug of SLUGS) {
    const token = `__SHOWER_GUIDE_${slug}__`;
    const long = longPath(slug);
    const short = shortPath(slug);
    const forms = [
      `https://woodenmax.in${long}`,
      `https://woodenmax.in${short}`,
      `./shower-partitions/${slug}`,
      `../../${slug}`,
      long,
      short,
    ];
    for (const form of forms) result = result.split(form).join(token);
  }
  return result;
}

function extractPageInfo(html, slug) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1].trim() || '';
  const description = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || '';
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] || '';
  const ogUrl = html.match(/<meta\b[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
  return {
    title,
    description,
    h1,
    canonical,
    ogUrl,
    contentHash: sha256(normalizeIdentityUrls(html)),
    expectedUrl: `https://woodenmax.in/${slug}`,
  };
}

function baselineHtml(slug) {
  return childProcess.execFileSync('git', ['show', `HEAD:products/shower-partitions/${slug}.html`], { cwd: ROOT, encoding: 'utf8' });
}

function writeManifest() {
  const guides = {};
  for (const slug of SLUGS) guides[slug] = extractPageInfo(baselineHtml(slug), slug);
  fs.writeFileSync(MANIFEST, JSON.stringify({ version: 1, guides }, null, 2) + '\n');
  console.log(`Wrote ${path.relative(ROOT, MANIFEST)} for ${SLUGS.length} guides.`);
}

function readManifest() {
  assert(fs.existsSync(MANIFEST), `Missing ${path.relative(ROOT, MANIFEST)}; run with --write-manifest from the approved baseline.`);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  assert.deepStrictEqual(Object.keys(manifest.guides).sort(), [...SLUGS].sort(), 'Shower identity manifest slug set is stale');
  return manifest;
}

function parseRules() {
  return new Map(fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(/\s+/))
    .map(([source, destination, status]) => [source, { destination, status: Number(status || 302) }]));
}

function assertStaticIdentity(manifest) {
  const rules = parseRules();
  for (const source of ['tools/shower-seo-pages-data.mjs', 'tools/generate-shower-seo-cluster.mjs']) {
    const generatedSource = fs.readFileSync(path.join(ROOT, source), 'utf8');
    for (const slug of SLUGS) {
      assert(!generatedSource.includes(longPath(slug)), `${source}: generator source retains a long guide URL for ${slug}`);
    }
  }
  let publicHtml = '';
  try {
    publicHtml = childProcess.execFileSync('rg', [
      '-l',
      'products/shower-partitions/(bathroom-shower-design-price|corner-shower-partition-price|fixed-glass-shower-panel-price|framed-vs-frameless-shower|frameless-glass-shower-price|glass-shower-partition-price|shower-curtain-vs-glass-partition|shower-enclosure-price|shower-glass-maintenance|shower-glass-thickness|shower-glass-types|shower-installation-cost|sliding-shower-door-price|small-bathroom-shower-design|walk-in-shower-glass-price)',
      '--glob', '*.html', '.'
    ], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (error) {
    if (error.status !== 1) throw error;
  }
  assert.strictEqual(publicHtml, '', 'Long shower-guide URLs remain in public HTML');
  for (const slug of SLUGS) {
    const long = longPath(slug);
    const short = shortPath(slug);
    assert.deepStrictEqual(rules.get(short), { destination: long, status: 200 }, `${slug}: short rewrite rule mismatch`);
    assert.deepStrictEqual(rules.get(long), { destination: short, status: 301 }, `${slug}: long clean rule mismatch`);
    assert.deepStrictEqual(rules.get(`${long}.html`), { destination: short, status: 301 }, `${slug}: long HTML rule mismatch`);
    assert.deepStrictEqual(rules.get(`${long}.html/`), { destination: short, status: 301 }, `${slug}: long HTML slash rule mismatch`);

    const html = fs.readFileSync(pageFile(slug), 'utf8');
    const actual = extractPageInfo(html, slug);
    assert.deepStrictEqual(actual, manifest.guides[slug], `${slug}: non-URL page content or metadata changed`);
    assert(html.includes(`\"@id\": \"https://woodenmax.in/${slug}#webpage\"`) || html.includes(`\"@id\":\"https://woodenmax.in/${slug}#webpage\"`), `${slug}: schema @id mismatch`);
    assert(!html.includes(`https://woodenmax.in${long}`), `${slug}: long schema or Offer URL remains`);
  }
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  assert.strictEqual((sitemap.match(/<loc>/g) || []).length, 173, 'Sitemap URL count changed');
  for (const slug of SLUGS) {
    assert(sitemap.includes(`<loc>https://woodenmax.in/${slug}</loc>`), `${slug}: short URL missing from sitemap`);
    assert(!sitemap.includes(`<loc>https://woodenmax.in${longPath(slug)}</loc>`), `${slug}: long URL entered sitemap`);
  }
  for (const file of ['llms.txt', 'llms-full.txt']) {
    const index = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const slug of SLUGS) {
      assert(!index.includes(`https://woodenmax.in${longPath(slug)}`), `${file}: long guide URL remains for ${slug}`);
      if (file === 'llms-full.txt') {
        assert(index.includes(`https://woodenmax.in${shortPath(slug)}`), `${file}: short guide URL missing for ${slug}`);
      }
    }
  }
}

function relativeLocation(location, currentUrl) {
  const url = new URL(location, currentUrl);
  return url.pathname + url.search;
}

async function trace(source, maxHops) {
  const hops = [];
  let current = BASE + source;
  for (let count = 0; count <= maxHops; count += 1) {
    const response = await fetch(current, { redirect: 'manual' });
    const body = response.headers.get('content-type')?.includes('text/html') ? await response.text() : '';
    const location = response.headers.get('location') || '';
    hops.push({ url: current, status: response.status, location, body });
    if (!(response.status >= 300 && response.status < 400) || !location) return hops;
    current = new URL(location, current).href;
  }
  throw new Error(`${source}: redirect loop or excessive chain`);
}

async function assertRouteIdentity(manifest) {
  for (const slug of SLUGS) {
    const short = shortPath(slug);
    const long = longPath(slug);
    const expected = manifest.guides[slug];
    const direct = await trace(short, 1);
    assert.strictEqual(direct.length, 1, `${slug}: short URL redirected away`);
    assert.strictEqual(direct[0].status, 200, `${slug}: short URL did not return 200`);
    assert(direct[0].body.includes(expected.h1), `${slug}: short URL served wrong guide or homepage fallback`);
    assert(direct[0].body.includes(`rel=\"canonical\" href=\"${expected.expectedUrl}\"`), `${slug}: short URL canonical mismatch`);

    for (const source of [long, `${long}.html`, `${long}.html/`]) {
      const hops = await trace(source, 2);
      assert.strictEqual(hops[0].status, 301, `${source}: expected permanent redirect`);
      assert.strictEqual(relativeLocation(hops[0].location, hops[0].url), short, `${source}: wrong redirect destination`);
      assert.strictEqual(hops.length, 2, `${source}: expected one hop`);
      assert.strictEqual(hops[1].status, 200, `${source}: final status is not 200`);
      assert(hops[1].body.includes(expected.h1), `${source}: final response served wrong guide or homepage fallback`);
    }
  }
}

async function main() {
  if (WRITE_MANIFEST) return writeManifest();
  const manifest = readManifest();
  assertStaticIdentity(manifest);
  await assertRouteIdentity(manifest);
  console.log(`Shower identity: ${SLUGS.length}/15 short 200, ${SLUGS.length}/15 long clean 301, ${SLUGS.length}/15 long HTML 301 passed`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
