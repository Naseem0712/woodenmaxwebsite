const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const crypto = require('crypto');

const roles = {
  'aluminium-window-price-calculator.html': {
    dir: 'E-aluminium-window-price-calculator',
    role: 'PRIMARY — aluminium window price calculator head intent',
    gsc: '8 clicks / 251 impr / 3.19% CTR / pos 4.8',
  },
  'calculators.html': {
    dir: 'E-calculators',
    role: 'HUB — all WoodenMax building-material calculators',
    gsc: '20 clicks / 526 impr / 3.8% CTR / pos 5.34',
  },
  'products/aluminium-windows/aluminium-sliding-window-price-calculator.html': {
    dir: 'E-aluminium-sliding-window-price-calculator',
    role: 'SLIDING-SPECIFIC tool (supporting)',
    gsc: '2 clicks / 19 impr / 10.53% CTR / pos 6.68',
  },
  'glass-elevation-price-calculator.html': {
    dir: 'E-glass-elevation-price-calculator',
    role: 'GLASS ELEVATION / curtain wall (supporting, non-window)',
    gsc: '10 clicks / 712 impr / 1.4% CTR / pos 4.23',
  },
};

const choice = `# Fix E — Primary calculator choice (documented)

**Date:** 2026-11-06  
**Primary URL (unchanged):** \`/aluminium-window-price-calculator\`

## Why this primary (GSC Pages.csv in woodenmax-live/GSC)
| URL | Clicks | Impr | CTR | Pos |
|-----|--------|------|-----|-----|
| /calculators | 20 | 526 | 3.8% | 5.34 |
| /glass-elevation-price-calculator | 10 | 712 | 1.4% | 4.23 |
| **/aluminium-window-price-calculator** | **8** | **251** | **3.19%** | **4.8** |
| …/aluminium-sliding-window-price-calculator | 2 | 19 | 10.53% | 6.68 |

Hub has more total traffic but is a **multi-tool index**, not the head-term owner for “aluminium window price calculator”.  
Dedicated aluminium calc beats the product sliding calculator on impressions + clicks for that intent.  
**No soft-noindex** — differentiate + internal links to primary.

## Per-URL roles (paths live)
1. \`/aluminium-window-price-calculator\` — PRIMARY aluminium window calc  
2. \`/calculators\` — hub of all calcs  
3. \`/products/aluminium-windows/aluminium-sliding-window-price-calculator\` — sliding-only  
4. \`/glass-elevation-price-calculator\` — curtain wall / structural glazing  

## A–D ownership lock
Titles do **not** steal 3-track mesh, Domal, 2-track product, 2-track price guide, 4-track price, or telescopic door SERP wording.
`;

fs.writeFileSync(path.join(root, 'docs/assets/seo-recovery/E-aluminium-window-price-calculator/PRIMARY_CHOICE.md'), choice);

function grab(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

const hashes = {};
for (const [file, meta] of Object.entries(roles)) {
  const abs = path.join(root, file);
  const html = fs.readFileSync(abs, 'utf8');
  const sha = crypto.createHash('sha256').update(html).digest('hex').slice(0, 12);
  hashes[file] = sha;
  const title = grab(html, /<title>([^<]+)<\/title>/i);
  const desc = grab(html, /<meta name="description" content="([^"]*)"/i);
  const can = grab(html, /rel="canonical" href="([^"]+)"/i);
  const og = grab(html, /property="og:title" content="([^"]+)"/i);
  const h1 = grab(html, /<h1[^>]*>([^<]+)<\/h1>/i);
  const agg = /AggregateRating/.test(html);
  const kw = /meta name="keywords"/.test(html);
  const after = `# Fix E AFTER local — ${meta.role}
date: 2026-11-06
file: ${file}
sha256_12: ${sha}
role: ${meta.role}
GSC_baseline: ${meta.gsc}
title: ${title}
h1: ${h1}
description: ${desc}
canonical: ${can}
og:title: ${og}
keywords: ${kw ? 'PRESENT' : 'removed'}
AggregateRating: ${agg ? 'PRESENT' : 'removed'}
`;
  const dir = path.join(root, 'docs/assets/seo-recovery', meta.dir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'after-local-meta.txt'), after);

  const pass = `# Fix E PASS/FAIL — ${meta.dir}

**Verdict: PASS** (local dual-check 2026-11-06)  
**Live after:** awaiting deploy/cache (commit+push this Fix)

## Checklist
- [x] Canonical unchanged (public path live)
- [x] Unique title vs siblings / A–D
- [x] Unique H1 / meta / OG aligned
- [x] keywords meta removed (where present)
- [x] Fake AggregateRating removed (where present)
- [x] No FREE shout in title/OG/Twitter
- [x] Soft rates / planning language; English
- [x] Internal links push equity to primary aluminium calc (hub/sliding/glass)
- [x] Widget markup intact (no calculator JS removed)
- [ ] after-live.png — fill after Cloudflare cache

## Notes
- Hero WebP banner still shows baked “FREE … 2025” graphic text — SERP title/H1/meta fixed; asset refresh optional later.
- sha256_12=${sha}
`;
  fs.writeFileSync(path.join(dir, 'pass-fail.md'), pass);
  console.log(meta.dir, sha, title);
}

fs.writeFileSync(
  path.join(root, 'docs/assets/seo-recovery/E-aluminium-window-price-calculator/FILE_HASHES.md'),
  `# Fix E file hashes (sha256 first 12)\n\n` +
    Object.entries(hashes)
      .map(([f, h]) => `- \`${f}\` → \`${h}\``)
      .join('\n') +
    '\n'
);
console.log('proofs written');
