# WoodenMax SEO Recovery — Dual-Check Plan

**Status:** Living plan — **NOT fully complete yet** (docs only until each Fix is executed)  
**Updated:** 2026-11-06  
**Account / site:** woodenmax.in · Merchant Center `5356280396`  
**Related:** `docs/MERCHANT_CENTER_QUALITY_AUDIT.md` (woodenmax-live), `docs/WINDOW_SEGMENT_SEO_KEYWORD_MAP.md`, GA4/GSC analysis 2026-11-06  

**Workflow:** Complete **one Fix** → dual-check live **with screenshot proof** → only then start the next Fix.  
**Never change** public URLs / slugs / paths / canonical path unless the owner explicitly overrides.

**Synced copies:**
- `woodenmax-window-design-v1/docs/SEO_RECOVERY_DUAL_CHECK_PLAN.md` (this file)
- `woodenmax-live/docs/SEO_RECOVERY_DUAL_CHECK_PLAN.md`

---

## Status board (honest — 2026-11-06)

Plan is **not** finished. Drop-URL core: **A–J done**; growth **K–M** live PASS 2026-11-06; next = **N** mirrors (do **not** start N until M pushed).

| Board | Fixes | Notes |
|-------|-------|-------|
| **DONE** | **A** 3-track · **B** hub · **C** telescopic · **D** Domal + 2-track price + 4-track · **E** calculators · **F** Merchant Path B + schema hygiene · **G** long-tail · **H** city · **I** index hygiene · **J** competitors · **K** shower · **L** pergola · **M** louvers | GMC **Fetch** + Fix I **GSC Removals** = user actions; proofs `docs/assets/seo-recovery/{H,I,J,K,L,M}/` |
| **NEW PENDING** (growth segments) | **N** mirrors | Same dual-check; **no URL change**; hub first → top children by traffic |

**Overlap clarity for owner:** Fix D locked Domal / 2-track price guide / 4-track. Fix E (2026-11-06) locked calculator SERP: primary = `/aluminium-window-price-calculator`; hub `/calculators`; sliding product calc; glass elevation — **no URL changes**.

---

## Diagnosis snapshot (why this plan exists)

| Signal | Reading |
|--------|---------|
| Ranking | **Not** a collapse — positions largely stable |
| Impressions | Up (India demand / visibility OK) |
| Clicks / CTR | Down — SERP promise weak vs rivals |
| Top losses | 3-track **−788** @ pos ~4; hub **−304**; telescopic **−394** |
| Appearance | Product snippets **−612**; Merchant listings **−339 → 0** |
| Cluster risk | Sliding / Domal / 3-track / 4-track / calculator cannibalization |
| Winners (protect) | Domal, grills hub, `aluminium-sliding-window` (don’t rewrite into sliding sameness) |
| Growth lag (K–N) | Shower / pergola / louvers / mirrors — impressions or demand OK but **rank/clicks soft** → CTR + differentiation (not URL surgery) |
| Seasonality | June-style monthly clicks high → Oct lower; long-tail historically strong |

**Strategy:** CTR + differentiation + honest schema/Merchant — **not** URL surgery.

---

## 1. Goals & non-negotiables

### Goals
1. Recover **CTR** on high-impression, stable-position pages (3-track, hub, telescopic first).
2. Stop **intent overlap** via differentiation + internal links + honest schema — **not** URL changes or reckless 301s.
3. Keep **generic keyword** gains **and** protect **June-style long-tail** (don’t flatten niche pages into head-term clones).
4. Restore **Product snippets / Merchant listings** eligibility honestly (checkout amount = feed/landing price).
5. Prove every Fix with **before → after** dual-check screenshots (localhost + live).

### Non-negotiables
| Do | Don’t |
|----|--------|
| One page / one Fix at a time | Batch-rewrite many money pages in one pass |
| High impressions → CTR assets first (title, meta, H1, OG, FAQ, SERP copy) | Sacrifice long-tail pages to chase head terms only |
| Differentiate siblings; soft rates; English site copy | Change URLs / reckless 301s / invent specs or rates |
| Honest Product / Offer / FAQ ↔ FAQPage | Fake reviews, free shipping claims, shouting ₹ |
| Dual-check proof before marking Done | Mark Done on localhost-only or “looks fine” |
| Soft noindex / canonical / content split for thin twins (if needed) | 301 money twins without explicit owner OK |

### Confirmed primary ownership (locked)
| Intent | Primary URL (unchanged) |
|--------|-------------------------|
| 3-track sliding (+ mesh identity) | `/products/aluminium-windows/3-track-sliding-window` |
| Hub browse / category | `/products/aluminium-windows` |
| Domal brand / Domal price | `/products/aluminium-windows/domal-window-price` |
| 2-track premium sliding product | `/products/aluminium-windows/aluminium-sliding-window` |
| Telescopic slim door | `/products/telescope-windows/telescopic-slim-sliding-door` |

**Fix A note:** 3-track Domal purge + hero swap may run in parallel elsewhere — this plan **documents** Fix A; do not fight that workstream; reconcile titles/H1 after it lands, then dual-check.

---

## 2. Dual-check protocol (exact steps)

Use this **every** Fix. No “Done” without evidence files.

### Evidence folder
`docs/assets/seo-recovery/<fix-letter>/`

| File | What |
|------|------|
| `before-live.png` | Live above-fold (title tab + H1 + hero) |
| `before-meta.png` | DevTools / view-source: title, canonical, og:title, og:image, Product/FAQ name |
| `before-gsc-or-serp.png` | Optional: GSC URL Inspection or incognito SERP for money query |
| `after-local.png` | Localhost same path after fix |
| `after-live.png` | Live after deploy/cache (or note “awaiting push”) |
| `after-schema.png` | Product name + FAQ JSON-LD vs visible FAQ |
| `pass-fail.md` | One-line Pass/Fail + date + cache note |

### BEFORE (do not edit yet)
1. Open **live** URL in private/hard-refresh window.
2. Screenshot set “BEFORE” (table above).
3. Optional: GSC Performance → Page filter for this URL (CTR, impressions, avg position last 28d) — note numbers in `pass-fail.md`.
4. Open localhost same path if edit tree is served (`http://localhost:5500/...`).
5. Run **pre-edit checklist** (below) and mark gaps.

### Pre-edit / complete-page checklist
- [ ] Canonical = clean public path (no `?srsltid=` / junk params)
- [ ] One clear H1; title unique vs siblings in §4
- [ ] Meta description unique; soft rates only from **canonical rate source**
- [ ] OG + Twitter: title/description/image aligned with H1 intent
- [ ] Product pages: Master v1 layout if already in family; gallery LEFT / calc RIGHT; no floating-calc unless Reference exception
- [ ] Breadcrumbs present, non-duplicate, match visible trail
- [ ] FAQ **visible on page** ≡ FAQPage JSON-LD Q+A **exact**
- [ ] Product / Offer JSON-LD: real name, availability, honest rates — no fake AggregateRating
- [ ] No free-shipping schema lies; no shouting ₹ in every heading
- [ ] Internal links push equity to the **primary** for this intent
- [ ] English customer-facing copy only (no internal/dev language)

### AFTER fix
1. Apply edit on **one** page only.
2. Screenshot localhost AFTER.
3. Deploy / note awaiting push. When live: hard refresh → AFTER live screenshots.
4. Spot-check: wrong identity strings gone (e.g. Domal-primary on 3-track).
5. Score Pass/Fail. Only **PASS** → next Fix.

### Pass / fail criteria
| Pass | Fail |
|------|------|
| Title / H1 / meta / OG match intent map (§4) | Sibling still shares same SERP identity |
| Live HTML matches intended copy (post-cache) | Live still shows old title/hero/identity |
| FAQ visible ≡ FAQPage; Product name honest | Schema name ≠ H1 / wrong brand series |
| Screenshots filed under evidence folder | “Looks fine” with no proof |
| Merchant Fix F: Diagnostics trend improves after fetch + wait | Feed price ≠ checkout charge |

---

## 3. Competitor SERP patterns (CTR benchmarks)

**Research date:** 2026-11-06 (WebSearch + fetches). Use as **title/H1 shape** references — not to copy brand / series trademarks into WoodenMax pages.  
**Full capture:** `docs/assets/seo-recovery/J/COMPETITOR_TITLES.md` (**Fix J PASS**).

**Priority order:** Alupure → Fenesta → Encraft → Alteza → Alcoi → Schüco → Saint-Gobain / India peers.

### Observed title / H1 formulas (product vs price vs hub)

| Brand | Page type | Example SERP / page title shape | Lesson for WoodenMax |
|-------|-----------|----------------------------------|----------------------|
| **Alupure** | Hub / brand | `Best Aluminium Windows & Doors Manufacturer Company in India \| Alupure` | Hub = category + role; no track count, no ₹ |
| **Alupure** | Product | `Best Aluminium Sliding Windows Designs \| Alupure` · `Sliding Windows And Doors Systems - Alupure` | Product = type + Designs/Systems; premium line owns “Systems” |
| **Alupure** | Guide | `Aluminium Sliding Windows for Homes and Offices - Alupure` | Use-case modifier differentiates from bare PDP |
| **Fenesta** | Product + soft price | `Aluminium Sliding Windows - Latest Designs & Price \| Fenesta` | Soft “Price” without ₹; H1 stays clean product type |
| **Fenesta** | Hub / material | `uPVC Windows - Modern Designs, Price, Manufacturer \| Fenesta` | Material hub = Designs + soft Price + role |
| **Encraft** | Product / hub | `Best Upvc Sliding Window Manufacturers in India \| Encraft` | OEM “Best + type + India”; hard ₹ left to dealers |
| **Alteza** | Hub | `Stylish and Energy-Efficient Aluminium Windows for Your Home \| Alteza` | Hub = benefit + category; children browse from cards |
| **Alteza** | Product | `Leading Aluminium sliding window manufacturers in India \| Alteza` · H1: `Aluminium Sliding Windows` | Clean H1; track variants on-page, not title spam |
| **Alcoi** | Product / system | `Best Aluminium Sliding Windows for Home & Offices \| ALCOI` · H1: `AluBUILD Sliding Window` | Named system in H1; clear product type in title |
| **Alcoi** | Series product | `AluLITE 3-Track Aluminium and Sliding Glass Windows \| ALCOI` | Modifier (**3-Track**) first when that is the money intent |
| **Schüco** | Hub / lifestyle | Benefit + category (“sliding doors… light and space”) | Browse hubs ≠ one child SKU title |
| **Schüco** | System product | Short code titles (`AS 39 SC.NI`) + “Sliding System …” H1 | Spec identity pages; don’t mix sibling identities |
| **Saint-Gobain** | Hub / line | Luxury living + uPVC & Aluminum / Invisia line cues | Brand line + material; price in quote path |
| **India peers / dealers** | Price guides | `…Price in India…` / `…₹/sq ft…` (often marketplaces) | Price **guides** own hard ₹/sqft; PDPs keep soft bands |

### WoodenMax working CTR formula
```
PRODUCT:  {Distinct modifier} {Product type} | Soft Designs & Price Band | WoodenMax
PRICE:    {Product type} Price in India ({year}) | Soft ₹/sqft Band | WoodenMax
HUB:      {Category} for Indian Homes | Types, Soft Price Bands & Calculators | WoodenMax
CITY:     {Product type} Price in {City} | {Local cue} & Soft Band | WoodenMax
```
**Examples (direction only — finalize per Fix):**
- Product: `3-Track Aluminium Sliding Window with Mesh | Soft Price Band | WoodenMax`
- Price guide: `4 Track Sliding Window Price (2026) | Soft ₹/sqft Band | WoodenMax`
- Hub: `Aluminium Windows for Indian Homes | Types, Soft Price Bands & Calculators | WoodenMax`
- Shower hub (Fix K): `Shower Partitions for Indian Bathrooms | Types, Soft Price Bands & Calculators | WoodenMax`
- System: `System Sliding Window Guide | Large Openings Soft Price Band | WoodenMax`

Do **not** shout exact ₹ in every title; soft bands only when from canonical rate source. Never paste competitor series names (AluBUILD, AluLITE, ACA ##, AS 39, Invisia, AluPure, etc.).

---

## 4. Intent → primary page map (NO URL change)

Siblings must **differentiate** (titles, H1, schema `name`, intro, FAQ) and **link to** the primary — never steal its head term.

| Money / query theme | Owns SERP (keep URL) | Siblings must differentiate / link out |
|---------------------|----------------------|----------------------------------------|
| 3-track sliding / mesh sliding | `…/3-track-sliding-window` | Domal; 2-track product; 4-track price; hub |
| Domal / Domal price | `…/domal-window-price` | 3-track (**no Domal-primary copy**) |
| Category browse “aluminium windows” | `…/aluminium-windows` | Children deep-link; hub title ≠ one child |
| Generic 2-track / S29–S40 sliding product | `…/aluminium-sliding-window` | 2-track price guide; calculators |
| 2-track price guide | `…/2-track-aluminium-window-price` (if present) | Product page; 3-track |
| 4-track price | `…/4-track-sliding-window-price` | 3-track / 2-track |
| Telescopic slim door | `…/telescope-windows/telescopic-slim-sliding-door` | Folding / bifold / sliding-door blogs |
| Calculator SEO | **One** indexable primary among existing calc URLs (Fix E) | Other calc URLs: differentiate or soft noindex — **paths stay** |
| City price | Existing `…-price-{city}` URLs | Differentiate (Fix H); not noindex-first |
| Shower / pergola / louvers / mirrors | Existing hubs + children (Fix K–N) | Differentiate within family; do not flatten into sliding titles |
| Grills winners | Keep current primaries | Do not rewrite into sliding sameness |

**Thin twins:** Prefer content differentiation → stronger canonical signals → soft `noindex` only if still near-duplicate. **No 301** of public money URLs unless owner later explicitly allows.

---

## 5. Ordered fixes (A → N)

Execute in order unless owner reorders. **One page (or one sub-step) → dual-check → next.**  
Growth segments **K–N** may run after drop-URL core (D–J) or in parallel only if they do **not** steal attention from Fix C/D money pages — owner call.

---

### Fix A — 3-track CTR + Domal purge
- **URL(s):** `https://woodenmax.in/products/aluminium-windows/3-track-sliding-window`
- **Problem (metric):** **−788** clicks; CTR **0.73% → 0.48%** @ position ~**4** (impressions high → CTR work)
- **Exact work:**
  - Remove Domal-primary / 27×65 Domal identity leak
  - Hero = anthracite **3-track + mesh** asset
  - Rewrite title / H1 / meta / OG / Twitter / intro / FAQ / Product `name` to **3-track + mesh**
  - Soft internal link Domal intents → `domal-window-price`
  - Rates only from canonical rate source; soft ₹ language
- **Complete-page checklist:** Master v1 if in family; §2 checklist; FAQ≡FAQPage; honest Offer; breadcrumbs; no fake ratings
- **Dual-check proof:** `before-live` hero+H1; `after-local` + `after-live`; schema Product name; grep Domal-primary gone
- **Done:** Live page is clearly 3-track WoodenMax + mesh; Domal not primary; screenshots filed → **PASS**

---

### Fix B — Aluminium windows hub CTR
- **URL(s):** `https://woodenmax.in/products/aluminium-windows`
- **Problem (metric):** **−304** clicks; CTR ~**0.54%** @ pos ~**7.8**
- **Exact work:**
  - Browse-hub title/H1/meta (category / types / soft bands — **not** one child product)
  - Internal links favor §4 primaries (3-track, Domal, 2-track, calculators)
  - Unique OG; Collection/ItemList honesty if used
  - Protect long-tail children: don’t retitle hub to steal Domal/3-track heads
- **Complete-page checklist:** §2; hub not Master product layout unless already; no free CTAs noise; soft rates
- **Dual-check proof:** hub SERP assets + on-page link hierarchy screenshot; sibling title collision check vs 3-track/Domal
- **Done:** Hub does not steal 3-track/Domal SERP wording; screenshots filed → **PASS**

---

### Fix C — Telescopic slim door CTR
- **URL(s):** `https://woodenmax.in/products/telescope-windows/telescopic-slim-sliding-door`
- **Problem (metric):** **−394** clicks; CTR drop @ stable position
- **Exact work:**
  - Unique **telescope / slim multi-panel door** modifiers in title/H1/meta/OG
  - Separate from folding / bifold / generic sliding-door blogs via copy + internal links
  - FAQ answers door-specific intents; Product name matches H1
- **Complete-page checklist:** §2; Master if product family; soft rates; honest schema
- **Dual-check proof:** before/after title+H1; side-by-side title check vs folding/bifold siblings
- **Done:** Distinct SERP identity vs folding cluster; screenshots filed → **PASS**

---

### Fix D — Sliding cluster differentiation (Cluster A)
- **URL(s) — one page per sub-step (suggested order):**
  1. `…/domal-window-price` (winner — protect + clarify Domal-only)
  2. `…/aluminium-sliding-window` (winner — lock 2-track product head)
  3. `…/4-track-sliding-window-price`
  4. `…/2-track-aluminium-window-price` (if live)
  5. Other overlapping sliding siblings only if still colliding after 1–4
- **Problem (metric):** Cluster A cannibalization (sliding / Domal / 3-track / 4-track / calculator family)
- **Exact work (each sub-step):**
  - Enforce §4 ownership in title / H1 / intro / FAQ / schema `name`
  - Cross-link to true primary; remove copy that could be the sibling page
  - Soft rates; no URL merges
- **Complete-page checklist:** §2 per URL; Product pages Master if applicable
- **Dual-check proof:** after **each** URL: screenshots + “could this title be the other page?” test = **No**
- **Done:** Each touched sibling fails twin test; 3-track remains mesh/3-track owner → **PASS**

---

### Fix E — Calculator SEO unify (signals only — keep URLs)
- **URL(s):** Existing calculator paths only, e.g. `/calculators`, `/aluminium-window-price-calculator`, product `…-price-calculator` / `aluminium-sliding-window-price-calculator` — **do not change paths**
- **Problem (metric):** Multiple calc URLs fighting; organic soft while on-page engagement strong
- **Exact work:**
  - Choose **one** indexable calc SERP primary (document choice in tracker)
  - Others: unique titles + stronger differentiation **or** soft `noindex` / clearer canonical signals — **public paths stay**
  - Keep calculator widgets working everywhere
- **Complete-page checklist:** §2; WebApplication/SoftwareApplication honesty if used; no fake free-tool spam
- **Dual-check proof:** robots/canonical screenshots; title uniqueness; widget still calculates on secondary URLs
- **Done:** One clear calc SERP owner; widgets intact → **PASS**

---

### Fix F — Merchant listings + Product snippets
- **URL(s):** Feed SKUs + matching product landings (windows / showers / mirrors as listed in Merchant); organic Product JSON-LD on sellable pages
- **Problem (metric):** Product snippets **−612**; Merchant **−339 → 0**; Diagnostics (user): **User cannot complete purchase (151 / 100%)** + **Invalid sales price (1)**
- **Exact work:** See §5.F detail below. Prefer **Path B** (Book Now ₹1,000 matched end-to-end); fallback **Path A** if still rejected. Restore honest Product JSON-LD for organic snippets (no fake ratings).
- **Complete-page checklist:** Landing CTA amount = feed `price`; shipping/returns honest; no free-shipping lies
- **Dual-check proof:** GMC Diagnostics before/after; landing Buy/Book + charged amount; feed row sample; after organic Product rich-result test if available
- **Done:** Purchase issue trend down/clear; invalid price clear; **or** Path A fallback started with evidence → **PASS** / documented

#### Fix F detail — where “Google permission” actually is
There is **no** separate secret Google permission page outside Merchant Center compliance.

| What people mean | Where it is |
|------------------|-------------|
| Why products don’t show | Merchant Center → Products → **Diagnostics** (+ Shop quality) |
| Checkout / Buy rules | [Checkout requirements](https://support.google.com/merchants/answer/9158778) |
| Landing must match feed | [Landing page requirements](https://support.google.com/merchants/answer/4752265) |
| Price accuracy | [Price](https://support.google.com/merchants/answer/6324371) · [Sale price](https://support.google.com/merchants/answer/6324471) |

**Why ₹1k booking fails today:** Feed/listing shows **full package price** but primary control charges **₹1,000 booking** → “cannot complete purchase” / invalid price. Schema-only hygiene will **not** clear a manual purchase finding.

| Path | What Google needs | Pros / cons |
|------|-------------------|-------------|
| **A — Full purchase** | Buy charges **same INR** as feed `price` | Best Shopping alignment; larger commerce change |
| **B — Book Now ₹1k** (preferred) | CTA + feed `price` + Razorpay charge all = **₹1,000** for a clear bookable/deposit SKU | Matches WoodenMax flow; risk if copy still implies full-window purchase |

**Implementation order (later — not this docs-only task):** decide Path B → align feeds → fix invalid sale_price SKU → working Book/Buy on landing → deploy → Merchant Fetch → wait → Diagnostics dual-check → request review if offered → organic Product JSON-LD honesty pass.

---

### Fix G — Long-tail protection (June-style)
- **URL(s):** Niche guides / system / comparison / maintenance / strong city pages (sample from §6) — **one theme cluster at a time**, not a mass title wipe
- **Problem (metric):** Generic impressions up; June→Oct click soft; long-tail historically carried volume — risk of flattening
- **Exact work:**
  - Keep unique long-tail blocks (how-to, factors, vs, maintenance, mesh specifics)
  - Titles keep **long modifiers**; link up to §4 primaries without rewriting every page to the same head term
  - Do **not** “fix” shower/grill winners into sliding sameness
- **Complete-page checklist:** §2 light pass; uniqueness > keyword stuffing
- **Dual-check proof:** 3–5 sample long-tail URLs still distinct post any nearby Fix edits
- **Done:** No mass generic-only title pass on long-tail set → **PASS**

---

### Fix H — Thin city pages — DIFFERENTIATE (not noindex-first)
- **URL(s):** Existing city price pages (e.g. `aluminium-window-price-hyderabad` and peers) — **URLs unchanged**; **one city page at a time**
- **Problem (metric):** Thin twins / overlapping city boilerplate steal clarity from national primaries
- **Exact work:**
  - Unique title/H1/meta with **city + proof** (true local service / fab / delivery language only if accurate)
  - Local FAQ; distinct intro; soft rates; link to national primary
  - No duplicate boilerplate across cities
- **Complete-page checklist:** §2; still indexable unless owner later approves noindex
- **Dual-check proof:** two city pages side-by-side titles/H1 differ
- **Done:** Each touched city page fails “identical twin” test → **PASS**

---

### Fix I — Index hygiene (junk impressions)
- **URL(s):** GSC junk — `?_x_tr_*`, image URLs indexed as pages, stray hosts (`systemwindows.`, `window.`, etc.) — **not** money public paths
- **Problem (metric):** Noise impressions / diluted reporting
- **Exact work:** Canonical / robots / GSC Removals as appropriate; fix self-canonicals on money pages if wrong; **no** public money-URL changes
- **Dual-check proof:** GSC samples cleaned or documented with screenshots
- **Done:** Junk impressions trending down or ticketed → **PASS**

---

### Fix J — Competitor SERP title research (bench for CTR rewrites)
- **URL(s):** N/A (research) — brands: **Alupure (first)**, Fenesta, Encraft, Alteza, Alcoi, Schüco, Saint-Gobain
- **Problem:** Title rewrites need live SERP proof, not guesswork
- **Exact work:** For each brand capture 2–3 live examples for **product vs price vs system/hub**; expand §3 table; optional SERP screenshots under `docs/assets/seo-recovery/J/`
- **Dual-check proof:** Updated pattern table + `docs/assets/seo-recovery/J/COMPETITOR_TITLES.md`; cite pattern when rewriting A–D / K–N titles
- **Done:** CTR title edits cite a competitor pattern → **PASS** (2026-11-06) — formulas in `J/COMPETITOR_TITLES.md`; §3 expanded.

---

### Fix K — Shower segment growth (hub → top children)
- **URL(s) — suggested order (no path changes):**
  1. Hub: `https://woodenmax.in/products/shower-partitions`
  2. Top children by traffic (confirm in GSC; typical money set): `…/frameless-shower-partition`, `…/frameless-glass-shower-price`, `…/glass-shower-partition-price`, `…/sliding-shower-door-price`, `…/walk-in-shower-glass-price`, `…/black-profile-shower-partition` / slim-frame as needed
- **Problem (metric):** Segment under-performs on **rank / clicks** vs opportunity; still must **not** be rewritten into sliding-window sameness
- **Exact work (each URL):** Same dual-check stack as A–D — unique title / meta / H1 / OG; honest Product + FAQ≡FAQPage; soft rates; differentiate frameless vs framed vs walk-in vs price guides; hub = browse, not one SKU
- **Complete-page checklist:** §2; Master v1 if already in shower product family; no URL change
- **Dual-check proof:** `docs/assets/seo-recovery/K/<slug>/` before/after per page
- **Done:** Hub + touched children fail twin test within shower family → **PASS** (2026-11-06 LIVE `9e48c78`) — hub browse · frameless product · frameless price guide

---

### Fix L — Pergola segment growth (hub → top children)
- **URL(s) — suggested order:**
  1. Hub: `https://woodenmax.in/products/pergola`
  2. Top children by traffic (confirm GSC): `…/aluminium-pergola`, `…/retractable-pergola`, `…/profile-pergola`, `…/aluminium-pergola-glass-roof-price-india`, `…/glass-skylight` / canopy only if colliding
- **Problem (metric):** Low rank/clicks relative to outdoor / canopy demand
- **Exact work:** Hub browse vs product vs price-guide roles; title/H1/meta/schema/FAQ uniqueness; soft rates from canonical source; no URL change
- **Complete-page checklist:** §2; Master if product family (aluminium-pergola pilot exists)
- **Dual-check proof:** `docs/assets/seo-recovery/L-<slug>/`
- **Done:** Hub browse + aluminium-pergola product distinct vs glass-roof price guide → **PASS** (2026-11-06; hashes in `L-pergola/pass-fail.md`)

---

### Fix M — Louvers segment growth (hub → top children)
- **URL(s) — suggested order:**
  1. Hub: `https://woodenmax.in/products/metal-louvers`
  2. Top children by traffic (confirm GSC): `…/aluminium-facade-louver-price`, `…/ventilation-louver-price-per-sqft`, `…/motorized-louver-price-india`, `…/wooden-finish-aluminium-louvers`, `…/louver-canopy-facade`, city price pages only after hub+national
- **Problem (metric):** Facade / ventilation demand soft on clicks; city twins risk boilerplate
- **Exact work:** Hub vs price vs design vs motorized differentiation; CTR assets + honest schema/FAQ; link city pages to national primary (align with Fix H pattern later); **no URL change**
- **Complete-page checklist:** §2 per URL
- **Dual-check proof:** `docs/assets/seo-recovery/M-<slug>/`
- **Done:** Hub browse + facade price guide distinct; no free CTAs → **PASS** (2026-11-06; hashes in `M-metal-louvers/pass-fail.md`)

---

### Fix N — Mirrors segment growth (hub → top children)
- **URL(s) — suggested order:**
  1. Hub: `https://woodenmax.in/products/mirror-profiles`
  2. Top children by traffic (confirm GSC): `…/led-mirror-profile-price`, `…/led-bathroom-mirror-profile`, `…/backlit-mirror-profile-price`, `…/mirror-profile-price-per-foot`, `…/touch-sensor-mirror-profile` / wardrobe / round as traffic warrants; city LED pages after national
- **Problem (metric):** LED / bathroom mirror interest vs soft rank/clicks; LED vs non-LED / price-per-foot overlap risk
- **Exact work:** Lock hub browse vs LED product vs ₹/ft guide vs sensor variants; title/meta/H1/OG/FAQ/schema; soft rates; Merchant SKUs stay honest with Fix F Path B; **no URL change**
- **Complete-page checklist:** §2; Product Offer honesty
- **Dual-check proof:** `docs/assets/seo-recovery/N/<slug>/`
- **Done:** Mirror siblings fail twin test; city pages don’t clone national titles → **PASS**

---

## 6. Long-tail protection list (June-style themes)

Protect / keep distinct — do **not** fold into generic hub or 3-track titles:

| Theme | Page types to protect |
|-------|------------------------|
| Track-count + mesh / mosquito sliding how-tos | Product FAQs + niche guides |
| Domal vs system vs ₹/sqft **factor** guides | Domal page, brands compare, system vs normal |
| 2-track vs 3-track / folding vs sliding comparisons | Comparison guides (keep comparison H1s) |
| Soundproof / system aluminium niches | System price / villa / glass-options guides |
| Grill design niches | Grills hub + aluminium/iron/balcony grill PDPs (**winners**) |
| Shower family | Hub + frameless/price children — **Fix K** growth (protect modifiers; don’t flatten to sliding) |
| Pergola / louvers / mirrors | Hubs + top children — **Fix L / M / N** (keep outdoor / facade / LED modifiers) |
| City-strong pages | After Fix H differentiation |
| Telescope / slim door specifics | Fix C page + telescope hub — keep door modifiers |

**Rule:** When chasing head-term CTR on Fix A–C / K–N, **add** clarity on the primary — do not strip modifiers from long-tail siblings.

---

## 7. What NOT to do

- Change public URLs / slugs / paths / canonical path without explicit owner OK  
- Reckless 301s of money twins (only thin twins later, and only if owner allows)  
- Invent product specs, GTINs, or rates  
- Re-inject fake AggregateRating / Review JSON-LD  
- Claim free `0.00` shipping in feed/schema when policy says otherwise  
- Advertise full package price in Merchant feed while checkout only takes ₹1,000  
- Noindex city pages as the **first** tactic (owner: differentiate first)  
- Sacrifice June-style long-tail titles to force generic head terms everywhere  
- “Fix” Domal / grills / 2-track winners — or shower/pergola/louvers/mirrors — into sliding sameness  
- Interrupt Fix C telescopic page work owned by another agent  
- Commit / push / deploy from plan-only tasks without owner ask  
- Fight in-flight Fix A Domal purge — coordinate, don’t overwrite blindly  
- Mark a Fix Done without dual-check screenshots  
- Treat A+B as “cluster finished” while Fix D siblings still overlap  

---

## 8. Execution tracker

| Fix | Status | Evidence path | Notes |
|-----|--------|---------------|-------|
| A 3-track | **DONE / PASS** (2026-11-06) LIVE | `docs/assets/3track-fix-a/` · `seo-recovery/A/` | Live 26f6f0c + 1948ddf |
| B Hub | **DONE / PASS** (2026-11-06) LIVE | `docs/assets/hub-fix-b/` · `seo-recovery/B/` | Live 3e75128 |
| C Telescopic | PASS (2026-11-06) | `docs/assets/telescopic-fix-c/` · `seo-recovery/C/` | Live `5729cb4`; multi-panel door CTR; bifold FAQ |
| D Sliding cluster | **DONE / PASS** (2026-11-06) LIVE | `seo-recovery/D-domal-window-price/` · `D-2-track-aluminium-window-price/` · `D-4-track-sliding-window-price/` | Domal `69672de` · 2-track price `96ad223` · 4-track `bd9490c`; calc unify → **E** |
| E Calculators | **DONE / PASS** (2026-11-06) LIVE `b791e60` | `seo-recovery/E-aluminium-window-price-calculator/` (+ hub / sliding / glass) | Primary `/aluminium-window-price-calculator` (GSC); URLs stay |
| F Merchant / snippets | **DONE (Path B + schema)** — GMC Fetch = user | `docs/assets/seo-recovery/F/` | Feed+CTA+Razorpay = ₹1,000; await Diagnostics |
| G Long-tail | **DONE / PASS** (2026-11-06) LIVE `aa6fcae` | `seo-recovery/G-*/` (5 pages) | top-hung · french-sliding · georgian · soundproof · Al grill designs |
| H City differentiate | **DONE / PASS** (2026-11-06) local `0909831` | `seo-recovery/H-*/` (6 cities) | Hyd · Blr · Del · Pun · Mum · Chd; pushed main; await CDN after-live |
| I Index hygiene | **PENDING** | `docs/assets/seo-recovery/I/` | Junk GSC only |
| J Competitor titles | **DONE / PASS** (2026-11-06) | `docs/assets/seo-recovery/J/COMPETITOR_TITLES.md` | Alupure-first + 7 brands; WM formulas locked |
| K Shower | **DONE / PASS** (2026-11-06) LIVE `9e48c78` | `seo-recovery/K-shower-partitions/` · `K-frameless-*` | Hub browse + frameless PDP + price guide; cite Fix J |
| L Pergola | **NEW PENDING** | `docs/assets/seo-recovery/L/<slug>/` | Hub → aluminium / retractable / glass-roof |
| M Louvers | **NEW PENDING** | `docs/assets/seo-recovery/M/<slug>/` | Hub → facade / sqft / motorized |
| N Mirrors | **NEW PENDING** | `docs/assets/seo-recovery/N/<slug>/` | Hub → LED / backlit / ₹/ft |

---

## 9. Owner short note — Google “permission” + ₹1k booking

1. **Permission = Merchant Center compliance**, not a hidden Google form.  
   Open Merchants → account **5356280396** → **Products → Diagnostics**. Follow checkout + landing requirements.
2. Path B + schema hygiene are **implemented**; owner still runs **Merchant Fetch** (and review if offered), then wait for Diagnostics trend.
3. Historical blockers: **cannot complete purchase** + **invalid sales price** — Path B aims to clear when feed = landing = Razorpay **₹1,000**.
4. Prefer Path B (matched ₹1k); if Diagnostics still fail after honest deploy + fetch + review, fall back to Path A (full pay = feed price) or pause non-compliant SKUs.

---

*End of plan. Fix L pergola + Fix M louvers **PASS** 2026-11-06 (see `L-pergola` / `M-metal-louvers` proofs). Next = **N** mirrors (only after M). Merchant Fetch + GSC Removals remain user actions.*
