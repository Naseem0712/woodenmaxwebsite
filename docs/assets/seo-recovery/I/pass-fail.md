# Fix I PASS/FAIL — Index hygiene (junk impressions)

**Verdict: PASS** (local 2026-11-06) — commit `cedd4e1` pushed; GSC Removals = **user action** (ticketed below)

## Hash
commit=`cedd4e1`

## Twin / scope test
Touches junk indexation only — **no** public money URL / slug / path changes. Money-page canonicals remain clean self-canonicals on `woodenmax.in`.

## Checklist
- [x] `robots.txt` Disallow for `?_x_tr_*` translate/proxy junk
- [x] Sitewide `seo-enhancer.js` injects `noindex,follow` when `_x_tr_*` params present
- [x] Softened internal links away from `systemwindows.woodenmax.in` / `window.woodenmax.in` → main calculators / hubs
- [x] Removed junk hosts from homepage Organization `sameAs`
- [x] Money-page canonical scan: **0** junk/query canonicals (43 clean samples)
- [x] Image URLs: **no** blanket `X-Robots-Tag:noindex` (would drop Image Search) — GSC Removals documented
- [x] User GSC Removals ticket for subdomain junk documented (`GSC-REMOVALS.md`)
- [ ] GSC Removals submitted by owner (external console) — trending down = follow-up

## Dual-check proof
| Proof | Path |
|-------|------|
| robots excerpt | `robots-diff.txt` |
| Link soften inventory | `link-soften.md` |
| Canonical scan | `canonical-scan.txt` |
| GSC user steps | `GSC-REMOVALS.md` |
| Live after deploy | await CDN; re-fetch robots + sample softened pages |

## Notes
Subdomain junk (`systemwindows.*`, `window.*`) cannot be noindexed from this repo’s Pages deploy — those hosts are separate origins. Softening crawl equity + GSC Removals / property-level robots on those hosts is the controllable path.
