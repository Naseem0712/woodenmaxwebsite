# REFERENCE PRODUCT PAGE V1 — PRODUCTION FREEZE

**Status:** FROZEN — production standard  
**Freeze date:** 2026-08-26  
**Freeze tip (production):** `650c86731d8158f0d66fab8bd4088a380f5f6e2f`  
**Machine manifest:** `docs/reference-v1-freeze-manifest.json`

This document freezes the shared Reference Product Page v1 architecture as the production contract for WoodenMax product pages. Individual page migrations must reuse this architecture as-is. Experimental or opportunistic edits to shared pilot/pricing infrastructure are disallowed without the cross-family gate below.

---

## 1. Golden reference URLs

| Family | Canonical URL | Page file | Introducing commit |
| --- | --- | --- | --- |
| 3-track Aluminium Window | https://woodenmax.in/products/aluminium-windows/3-track-sliding-window | `products/aluminium-windows/3-track-sliding-window.html` | `70fbba5` (2026-08-24) |
| Frameless Shower | https://woodenmax.in/products/shower-partitions/frameless-shower-partition | `products/shower-partitions/frameless-shower-partition.html` | `a16e8c3` (2026-08-24) |
| Aluminium Pergola | https://woodenmax.in/products/pergola/aluminium-pergola | `products/pergola/aluminium-pergola.html` | `650c867` (2026-08-26) |

Shared architecture tip = Pergola deploy tip = **`650c867`** (contains 3-track + frameless + pergola + pricing sync).

### Shared runtime (do not rename)

- `css/product-page-pilot.css`
- `js/product-page-pilot.js`

Opt-in marker: `data-product-page-layout="gallery-first"`.  
JS readiness class: `wm-product-pilot-ready` (progressive enhancement only).

---

## 2. Responsive shell behavior

As shipped in `css/product-page-pilot.css` at freeze tip:

| Band | Width | Shell |
| --- | --- | --- |
| Mobile polish | `≤767px` | Single column; gallery square by default; identity H1 fixed at `2rem` |
| Narrow / tablet | `<1100px` | Single-column `.wm-product-pilot-flow` (`max-width: 980px`); context / identity / calculator / accordions centered (`max-width: 820px`); gallery centered (`max-width: 720px`) |
| Desktop composition | `≥1100px` | Two-column grid (`max-width: 1180px`): gallery column 1 (row span), identity + calculator column 2 (`max-width: 680px`); `.wm-product-pilot-calculator-column` uses `display: contents`; packages + accordions (+ optional `#weight-summary-root`) span full width |

Notes:

- Desktop grid starts **above** the protected tablet range (`min-width: 1100px`).
- Optional page attribute `data-product-pilot-gallery-ratio="intrinsic"` (Pergola) opts out of forced `1 / 1` main-image box.

---

## 3. Gallery contract

Required on every Reference v1 page:

1. A `.wm-product-pilot-gallery` region inside the pilot root.
2. Primary image `#product-main-image` / `.product-main-image` with **`loading="eager"`** and **`fetchpriority="high"`** (LCP).
3. Explicit `width` / `height` on the primary image.
4. Default presentation: square container (`aspect-ratio: 1 / 1`), `object-fit: contain` — unless `data-product-pilot-gallery-ratio="intrinsic"`.
5. Thumbnail strip via existing gallery markup / `product-image-gallery` where the family uses it (3-track / frameless); Pergola keeps six `thumbnail-item` entries.

Do not replace the gallery with a different interaction model without a freeze revision.

---

## 4. Exactly one Calculator Finder

- Exactly **one** control whose visible text is `Calculator Finder`.
- Prefer class `.wm-calculator-finder` linking to the page calculator anchor (`#price-calculator-…` or equivalent).
- Reference pages must **not** ship a competing `floating-calc-button` (asserted by 3-track and frameless pilot tests).
- Secondary CTAs (e.g. “Calculate Your … Cost”) may exist, but must not duplicate the **Calculator Finder** label.

---

## 5. Calculator placement

Required DOM participants (pilot boot aborts if missing):

- `.wm-product-pilot-flow`
- `.wm-product-pilot-gallery`
- `.wm-product-pilot-identity`
- `.wm-product-pilot-calculator-column`
- Calculator node: `.price-calculator-container[data-product]` **or** `.wm-product-pilot-calculator`

Progressive enhancement order (`js/product-page-pilot.js`):

1. Move context (if present) to start of flow; move gallery then identity before the calculator column; remove `.wm-product-pilot-intro` when present.
2. Move calculator to the first child of the calculator column when it is a direct child.
3. Place `.wm-product-pilot-accordions` after `#wm-standard-packages` / `.wm-std-pkg[data-product-id]` when present.
4. Optional: `data-product-pilot-preserve-calculator-lead` keeps lead/copy above the calculator out of the accordion (Pergola).
5. Optional lead participant: `.wm-product-pilot-calculator-lead` (desktop grid column 2).

---

## 6. Accordion behavior

- Shared group `.wm-product-pilot-accordions` with **single-open** panels (`aria-expanded`, `hidden`).
- Sources: every `[data-product-pilot-source]` becomes a labeled panel (label from first `h2|h3|h4`).
- Optional `[data-product-pilot-technical-specs]` → panel “Technical specifications”.
- Pre-calculator siblings → panel “Pricing, options and calculator guide” unless preserve-lead is set.
- Optional `[data-product-pilot-one-open-details]` enforces one-open native `<details>` FAQs.
- Legacy `.mobile-toggle-btn` inside sources is stripped; accordion CSS forces collapsible bodies fully visible when open.

---

## 7. No-JS content requirement

Reference v1 is **progressive enhancement**, not JS-only UI:

- Product identity, gallery, calculator markup, SSR package cards, and detail/FAQ copy must exist in the HTML response without executing `product-page-pilot.js`.
- Accordion wrapping is enhancement only; source nodes remain in the document for crawlers and no-JS users.
- Standard packages must remain crawlable: `data-ssr="1"` section + static `#wm-std-pkg-jsonld` Offer list.

---

## 8. SEO / canonical / schema preservation

Migrations and shared edits must preserve per golden page:

- `<link rel="canonical">` exact production URL (no `.html`, apex `woodenmax.in`)
- Title / H1 / `og:url` / Product JSON-LD identity already shipping on that page
- Package ItemList Offers (`#wm-std-pkg-jsonld`) count and prices aligned with SSR cards
- No introduction of `floating-calc-button` or layout that hides primary SEO content behind JS-only injection

Family static contracts encode the locked strings (see §11).

---

## 9. Pricing / card / SSR / Offer consistency

Canonical rule (Pricing Synchronization):

> **approved rates → pricing model record → SSR card (`data-package-price`) → Offer JSON-LD** must be equal for every package row.

Also required:

- No active monetary fallbacks in calculator configs/extensions / package builders / Pergola pricing script (`tools/verify-pricing-sync.cjs` scans).
- `data-pricing-revision` on SSR sections must match the canonical revision helper when present.
- Rate-sync tooling must remain idempotent (`tools/test-rate-sync-idempotence.cjs`).

---

## 10. Supported viewport gates

Minimum visual / overflow gates for all three golden URLs (no horizontal overflow; shell readable; calculator reachable):

| Gate | Width (px) | Intent |
| --- | --- | --- |
| Mobile | **390** | Phone shell + Calculator Finder |
| Tablet | **768** | Protected single-column band |
| Small laptop | **1024** | Still below desktop grid (`<1100`) |
| Laptop | **1366** | Desktop two-column composition |
| Wide laptop | **1440** | Packages full-bleed within shell |

CSS contract breakpoints to respect: **767** (mobile polish), **1100** (desktop grid).  
Screenshot evidence baseline (3-track): `tools/3track-pilot-screenshots/` including `desktop-responsive-20260824/` at 390 / 768 / 1366 / 1440.

---

## 11. Required regression suites

### Per-family pilot static contracts

| Suite | Path |
| --- | --- |
| 3-track | `tools/test-3track-product-pilot.cjs` |
| Frameless shower | `tools/test-frameless-shower-product-pilot.cjs` |
| Aluminium Pergola | `tools/test-pergola-product-pilot.cjs` |

### Cross-family pricing / SSR / Offer

| Suite | Path |
| --- | --- |
| Pricing sync (all three golden pages) | `tools/verify-pricing-sync.cjs` |
| Standard packages derivation | `tools/verify-standard-packages.cjs` |
| Canonical pricing model fixtures | `tools/test-pricing-models.cjs` |
| Rates sync idempotence | `tools/test-rate-sync-idempotence.cjs` |

### Supporting (SEO / identity; run when touching URLs or meta)

- `tools/verify-no-seo-drift.cjs`
- `tools/test-shower-identity.cjs` (shower family URL identity)
- Optional gallery thumb sanity: `tools/_verify-gallery-thumbs.cjs`

### Convenience harness

```bash
node tools/reference-v1-cross-family-gate.cjs
```

Runs the three pilot contracts + `verify-pricing-sync` (hard gate for shared changes).

---

## 12. Cross-family gate rule (mandatory)

**Any change** to shared Reference v1 infrastructure requires a dedicated cross-family regression gate against **all three** golden pages before merge/deploy:

In scope (non-exhaustive):

- `css/product-page-pilot.css`
- `js/product-page-pilot.js`
- Shared pricing models / package SSR: `js/pricing/pricing-models.js`, `js/standard-size-packages.js`, rate-sync HTML writers
- Shared calculator shell / package card CSS-JS that all three families load

Minimum gate:

1. `node tools/test-3track-product-pilot.cjs`
2. `node tools/test-frameless-shower-product-pilot.cjs`
3. `node tools/test-pergola-product-pilot.cjs`
4. `node tools/verify-pricing-sync.cjs`
5. Viewport smoke at **390 / 768 / 1366 / 1440** on each golden URL (no horizontal overflow; Calculator Finder present; calculator reachable)

**Page-only migrations** must not modify the shared files above. If a migration appears to need a shared behavior change, **stop** and open a freeze-revision / cross-family change instead of editing shared behavior for one page.

---

## 13. Freeze revision policy

- Do not rename shared pilot files unless absolutely necessary.
- Behavior changes to the frozen shared architecture require: updated manifest + date, new freeze tip commit, and a passing cross-family gate (§12).
- Documentation-only updates may edit this file without a tip bump when they clarify (not change) shipped behavior.

---

## 14. Commit pointers (summary)

| Role | SHA (short) | Full | Date (IST) | Subject |
| --- | --- | --- | --- | --- |
| 3-track launch | `70fbba5` | `70fbba523f099b264b59ecefd232433a4ee60d65` | 2026-08-24 | feat(product-page): launch responsive 3-track pilot |
| Frameless migrate | `a16e8c3` | `a16e8c3e552fac71886cf0de3ca838b522911f3c` | 2026-08-24 | feat(product-page): migrate frameless shower reference v1 |
| Pricing sync | `65b0981` | (ancestor of tip) | 2026-08-26 | fix(pricing): synchronize calculator packages and offer schema |
| **Freeze / Pergola tip** | **`650c867`** | **`650c86731d8158f0d66fab8bd4088a380f5f6e2f`** | **2026-08-26** | **feat(product-page): integrate aluminium pergola Reference v1 on canonical pricing** |
