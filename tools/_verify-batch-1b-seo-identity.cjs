#!/usr/bin/env node
'use strict';
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const pages = [
  'products/aluminium-windows/2-track-french-sliding-door.html',
  'products/aluminium-windows/top-hung-casement-window.html',
  'products/glass-railing/balcony-glass-railing.html',
  'products/shower-partitions/frosted-glass-bathroom-door.html',
];

function extract(html, re, label) {
  const m = html.match(re);
  assert(m && m[1], 'Missing ' + label);
  return m[1].trim();
}

function identityFrom(html) {
  return {
    title: extract(html, /<title>([\s\S]*?)<\/title>/i, 'title'),
    description: extract(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i, 'description'),
    canonical: extract(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i, 'canonical'),
    ogUrl: extract(html, /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i, 'og:url'),
    h1: extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i, 'h1').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
  };
}

let ok = true;
for (const rel of pages) {
  const base = execFileSync('git', ['show', `origin/main:${rel}`], { cwd: root, encoding: 'utf8' });
  const work = require('node:fs').readFileSync(path.join(root, rel), 'utf8');
  const a = identityFrom(base);
  const b = identityFrom(work);
  console.log('\n==', rel);
  for (const key of ['title', 'description', 'canonical', 'ogUrl', 'h1']) {
    const match = a[key] === b[key];
    console.log(match ? 'PASS' : 'FAIL', key);
    if (!match) {
      console.log('  main:', a[key]);
      console.log('  work:', b[key]);
      ok = false;
    }
  }
}

if (!ok) process.exit(1);
console.log('\nBATCH 1B SEO IDENTITY: PASS');
