#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://woodenmax.in';
const baseArg = process.argv.find((arg) => arg.startsWith('--base='));
const base = baseArg ? baseArg.slice('--base='.length).replace(/\/$/, '') : '';

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function firstMatch(html, re, label) {
  const match = html.match(re);
  assert(match && match[1], 'Missing ' + label);
  return match[1].trim();
}

function pageIdentity(rel) {
  const html = read(rel);
  return {
    html,
    title: firstMatch(html, /<title>([\s\S]*?)<\/title>/i, rel + ' title'),
    description: firstMatch(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i, rel + ' description'),
    canonical: firstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i, rel + ' canonical'),
    ogUrl: firstMatch(html, /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i, rel + ' og:url'),
    h1: firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i, rel + ' H1').replace(/<[^>]+>/g, '').trim()
  };
}

function parseRedirects() {
  const rules = [];
  for (const raw of read('_redirects').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 3) rules.push({ from: parts[0], to: parts[1], status: Number(parts[2]) });
  }
  return rules;
}

function firstExactRule(rules, from) {
  return rules.find((rule) => rule.from === from);
}

function assertRule(rules, from, to, status) {
  const matches = rules.filter((rule) => rule.from === from);
  const rule = matches[0];
  assert(rule, 'Missing redirect rule for ' + from);
  assert.strictEqual(matches.length, 1, 'Duplicate redirect rules for ' + from);
  assert.strictEqual(rule.to, to, 'Wrong destination for ' + from);
  assert.strictEqual(rule.status, status, 'Wrong status for ' + from);
}

function assertJsonLdParses(rel, html) {
  let blocks = 0;
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    blocks += 1;
    assert.doesNotThrow(() => JSON.parse(match[1].trim()), rel + ' contains invalid JSON-LD');
  }
  assert(blocks > 0, rel + ' has no JSON-LD');
}

function trackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
}

function auditDuplicateMetadata(files) {
  const groups = { title: new Map(), description: new Map() };
  for (const rel of files.filter((file) => file.endsWith('.html'))) {
    const html = read(rel);
    const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
    const description = (html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || [])[1];
    for (const [kind, value] of [['title', title], ['description', description]]) {
      if (!value) continue;
      const key = value.trim();
      if (!groups[kind].has(key)) groups[kind].set(key, []);
      groups[kind].get(key).push(rel);
    }
  }
  return {
    title: [...groups.title.entries()].filter((entry) => entry[1].length > 1),
    description: [...groups.description.entries()].filter((entry) => entry[1].length > 1)
  };
}

function countHrefForms(files, re) {
  let links = 0;
  const sources = [];
  for (const rel of files.filter((file) => /\.(?:html|js|mjs|cjs)$/.test(file))) {
    const count = (read(rel).match(re) || []).length;
    if (count) {
      links += count;
      sources.push({ rel, count });
    }
  }
  return { links, sources };
}

async function trace(url) {
  const hops = [];
  let current = url;
  for (let i = 0; i < 6; i += 1) {
    const response = await fetch(current, { redirect: 'manual' });
    const location = response.headers.get('location');
    const next = location ? new URL(location, current).toString() : '';
    hops.push({ status: response.status, url: current, location: next });
    if (!next || response.status < 300 || response.status >= 400) break;
    current = next;
  }
  return hops;
}

async function main() {
  const rules = parseRedirects();
  const hubs = [
    { slug: 'pergola', rel: 'products/pergola/index.html' },
    { slug: 'metal-louvers', rel: 'products/metal-louvers/index.html' }
  ];

  for (const hub of hubs) {
    const preferred = '/products/' + hub.slug;
    assertRule(rules, preferred, preferred + '/', 200);
    for (const alias of [preferred + '/', preferred + '/index', preferred + '/index/', preferred + '/index.html', preferred + '/index.html/', preferred + '.html', preferred + '.html/']) {
      assertRule(rules, alias, preferred, 301);
    }

    const identity = pageIdentity(hub.rel);
    assert.strictEqual(identity.canonical, SITE + preferred);
    assert.strictEqual(identity.ogUrl, SITE + preferred);
    assert(identity.html.includes('"url": "' + SITE + preferred + '"'), hub.rel + ' schema URL is missing');
    assert(!identity.html.includes('"url": "' + SITE + preferred + '/"'), hub.rel + ' schema contains slash identity');
    assertJsonLdParses(hub.rel, identity.html);
  }

  const track = pageIdentity('products/aluminium-windows/3-track-sliding-window.html');
  const domal = pageIdentity('products/aluminium-windows/domal-window-price.html');
  assert.notStrictEqual(track.title, domal.title, '3-track and Domal titles still match');
  assert.notStrictEqual(track.description, domal.description, '3-track and Domal descriptions still match');
  assert(/3 Track Aluminium Sliding Window with Mesh/i.test(track.title));
  assert(/Domal Window Price/i.test(domal.title));
  assert(/27mm \/ 27x65/i.test(domal.title + ' ' + domal.description));
  assert.strictEqual(track.h1, 'Aluminium 3 Track Sliding Window with Mesh');
  assert.strictEqual(domal.h1, 'Aluminium Domal Window Price with Mesh');
  assert(track.html.includes('"url": "' + track.canonical + '"'));
  assert(domal.html.includes('"url": "' + domal.canonical + '"'));
  assertJsonLdParses('products/aluminium-windows/3-track-sliding-window.html', track.html);
  assertJsonLdParses('products/aluminium-windows/domal-window-price.html', domal.html);
  assert(track.html.toLowerCase().includes('calculator'));
  assert(domal.html.toLowerCase().includes('calculator'));

  const domalGenerator = read('tools/create-domal-window-page.cjs');
  assert(domalGenerator.includes(domal.title), 'Domal generator is missing the approved title');
  assert(domalGenerator.includes(domal.description), 'Domal generator is missing the approved description');

  const sitemap = read('sitemap.xml');
  const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.strictEqual(sitemapLocs.length, 173, 'Unexpected sitemap URL count');
  assert(!sitemapLocs.includes(SITE + '/api/calculate'));
  assert(!sitemapLocs.includes(SITE + '/llms.txt'));
  const headers = read('_headers');
  assert(/\/api\/\*[\s\S]*?X-Robots-Tag:\s*noindex, nofollow/i.test(headers));
  assert(/\/llms\.txt[\s\S]*?X-Robots-Tag:\s*noindex, nofollow/i.test(headers));
  for (const wanted of ['/products/pergola', '/products/metal-louvers', '/products/aluminium-windows/3-track-sliding-window', '/products/aluminium-windows/domal-window-price']) {
    assert.strictEqual(sitemapLocs.filter((loc) => loc === SITE + wanted).length, 1, 'Sitemap identity mismatch for ' + wanted);
  }

  const files = trackedFiles();
  const slashHubLinks = countHrefForms(files, /href=["'](?:https:\/\/woodenmax\.in)?\/products\/(?:pergola|metal-louvers)\/["']/gi);
  assert.strictEqual(slashHubLinks.links, 0, 'Redirecting slash-form hub links remain: ' + JSON.stringify(slashHubLinks.sources));

  const duplicates = auditDuplicateMetadata(files);
  const showerLongLinks = countHrefForms(files, /href=["'](?:https:\/\/woodenmax\.in)?\/products\/shower-partitions\/(?:bathroom-shower-design-price|corner-shower-partition-price|fixed-glass-shower-panel-price|framed-vs-frameless-shower|frameless-glass-shower-price|glass-shower-partition-price|shower-curtain-vs-glass-partition|shower-enclosure-price|shower-glass-maintenance|shower-glass-thickness|shower-glass-types|shower-installation-cost|sliding-shower-door-price|small-bathroom-shower-design|walk-in-shower-glass-price)(?:["'#?])/gi);

  console.log('Static Batch 1 checks: PASS');
  console.log('Sitemap URLs: ' + sitemapLocs.length);
  console.log('Duplicate title groups: ' + duplicates.title.length);
  console.log('Duplicate description groups: ' + duplicates.description.length);
  console.log('Redirecting slash-form hub links: ' + slashHubLinks.links);
  console.log('Blocked shower long-form hrefs retained: ' + showerLongLinks.links + ' across ' + showerLongLinks.sources.length + ' tracked files');

  if (!base) return;

  for (const hub of hubs) {
    const preferred = '/products/' + hub.slug;
    const cases = [
      { path: preferred, statuses: [200], final: preferred },
      { path: preferred + '/', statuses: [301, 200], final: preferred },
      { path: preferred + '/index', statuses: [301, 200], final: preferred },
      { path: preferred + '/index/', statuses: [301, 200], final: preferred },
      { path: preferred + '/index.html', statuses: [301, 200], final: preferred },
      { path: preferred + '/index.html/', statuses: [301, 200], final: preferred },
      { path: preferred + '.html', statuses: [301, 200], final: preferred },
      { path: preferred + '.html/', statuses: [301, 200], final: preferred }
    ];
    for (const testCase of cases) {
      const hops = await trace(base + testCase.path);
      assert.deepStrictEqual(hops.map((hop) => hop.status), testCase.statuses, 'HTTP status chain mismatch for ' + testCase.path);
      assert.strictEqual(new URL(hops[hops.length - 1].url).pathname, testCase.final, 'Final URL mismatch for ' + testCase.path);
      console.log(testCase.path + '\t' + hops.map((hop) => hop.status).join(' -> ') + '\t' + testCase.final);
    }
  }
  console.log('HTTP redirect matrix: PASS');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
