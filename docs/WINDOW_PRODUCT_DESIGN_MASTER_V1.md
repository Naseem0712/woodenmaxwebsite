# Window Product Design Master v1

**Status:** FROZEN (local design contract)  
**Freeze date:** 2026-10-28  
**Visual master page:** `products/aluminium-windows/aluminium-sliding-window.html`  
**Canonical:** https://woodenmax.in/products/aluminium-windows/aluminium-sliding-window  
**Local preview:** http://localhost:5500/products/aluminium-windows/aluminium-sliding-window  
**Shared CSS:** `css/window-product-design-v1.css` (load only on pages with `data-product-family="aluminium-window"`)  
**Evidence screenshots:** `docs/assets/window-design-master-v1/` (390 / 768 / 1440)

This contract freezes the **visual / layout system** for aluminium window product pages. It does **not** authorize URL, title, H1, canonical, robots, or commercial rate changes. Obey `.cursor/rules/woodenmax-polish.mdc` (product URL paste → full polish checklist: Master v1 layout + SEO stack; blogs/SEO pages exempt from Master v1), `docs/ALUMINIUM_SLIDING_WINDOW_2TRACK_FREEZE.md`, and `docs/WOODENMAX_2_MEDIA_SEO_FREEZE.md`.

---

## 1. Identity of the master

| Field | Value |
| --- | --- |
| Product | 2-track aluminium sliding window (S29 calculator) |
| Product id | `29mm-sliding` |
| Calc selector | `#price-calculator-29mm-sliding` |
| Layout | `data-product-page-layout="gallery-first"` + product-page pilot |
| Body | `class="page-window-pro" data-product-family="aluminium-window"` |

The master remains a **sliding** product. Slimline and other windows may adopt this **design system** while keeping their own product identity (e.g. slimline = casement S35/S38/14 mm).

---

## 2. Layout contract (desktop ≥1100px gallery-first)

### Companion column (gallery side) — `.wm-window-side-stack` (+ `.wm-2track-side-stack` on master)

1. **Pricing, options and calculator guide** (`.wm-window-calc-guide` / plan band) — compact only  
2. **Key Features** — denser grid  
3. **Pricing Information** (gallery `.calc-info-box`)

### Calculator column

- Live calculator (sticky on desktop)  
- Standard size packages remain in this column  

### Full-width below the calc row — `.wm-window-details-below`

1. Design / description prose (stay-or-go + overview)  
2. Feature \| Detail table (`#technical-specifications`, `.wm-window-options`)

Do **not** re-stuff tall Design + Feature\|Detail into the companion column (empty-right void regression).

### Mobile (≤1099px)

Order: **photo gallery → page intro (identity) → calculator → companion / rest**. Implemented via Master CSS (`display: contents` on gallery + flex `order`), overriding the older calc-before-gallery mobile rule for Master pages. Desktop ≥1100px stays gallery-LEFT / calc-RIGHT.

### Cost Calculator capsule (replaces “Calculator Finder”)

- Fixed **right**-side glass capsule (`.wm-calculator-finder`), label **Cost Calculator** (horizontal, readable)
- Geometry: My Estimate–style pill (`border-radius: 999px`, frosted navy glass); starts at `top: 25vh`
- Click → smooth scroll to calculator top (`#price-calculator…` / Master calc root)
- Hide while the calculator block intersects the viewport (top→bottom range); show again when scrolled fully above or below
- **No** `floating-calc-button` on Reference-aligned window pages

---

## 3. Design-shared vs product-specific

### Design-shared (Window Design Master v1)

- Companion + details-below layout pattern  
- Dense features / related cards / calc form spacing  
- Order CTA ivory band (`.wm-window-order-cta`)  
- Calc size-row + gallery/calc info-box swap  
- `data-product-family="aluminium-window"` scoping  
- Shared stylesheet `css/window-product-design-v1.css`

### Product-specific (do not homogenize)

| Surface | Master (2-track) | Slimline casement |
| --- | --- | --- |
| URL / slug / H1 / title | Frozen 2-track | Frozen slimline casement |
| Product id / SKU | `29mm-sliding` / `WM-ALU-SW-29MM` | `slimline-aluminium-window` / `WM-ALU-SLIMLINE-CASEMENT` |
| Operation | Sliding, no mesh UI | Casement, `#calc-mesh` + `#calc-grill` |
| Series copy | S29–S40 sliding | S35 / S38 / 14 mm casement |
| Package set | 2-track sizes | Casement / top-hung packages |
| Form wrapper ids | `#calc-user-details-form` | `#calc-user-form` (+ wrapper) |
| Alias classes | `.wm-2track-*` kept | `.wm-slimline-*` kept |

---

## 4. Tokens / chrome

Reuses site tokens from critical CSS / product pages (gold, ivory order CTA `#FAF6EE`, plan-band green, gallery-first pilot). No new framework. Fonts: existing Cormorant / Playfair stack already on window pages.

---

## 5. CSS architecture

1. Global / product shared: `styles.css`, `product-pages-global.css`, `product-window-mobile.css`, `product-page-pilot.css`, calculator CSS.  
2. **New:** `window-product-design-v1.css` — reusable density + companion/details layout, scoped under `[data-product-family="aluminium-window"]`.  
3. Page-local inline polish blocks for shared rules were removed from master + slimline after parity; product alias classes remain for freeze compatibility.  
4. Do **not** load `window-product-design-v1.css` on non-window pages.

---

## 6. Media freeze

Existing assets only. No new photography, no original-byte edits. Related / gallery images must match product type (no door/entrance thumbs on casement; 2-track related cards use real 2-track window images).

---

## 7. Approved micro-edits on frozen master (this batch)

User-approved only:

- Inbound label text → **Slimline Casement** (href unchanged)  
- Related Slimline card image → casement asset (not entrance door)  
- Dual-class `wm-window-*` aliases + shared CSS link + `data-product-family`  
- No SEO title / H1 / canonical / robots drift  

---

## 8. Related freeze docs

- `docs/ALUMINIUM_SLIDING_WINDOW_2TRACK_FREEZE.md` — page content freeze (points here for design system)  
- `docs/aluminium-sliding-window-2track-freeze.json` — machine contract  
- `docs/WOODENMAX_2_MEDIA_SEO_FREEZE.md` — media/SEO immutability  

---

## 9. Migration rule for other window pages

Adopt via shared CSS + minimal HTML adapters (side-stack / details-below / order CTA). Preserve calc selectors, form IDs, data attrs, packages, pricing hooks, and structured-data identity. **No** WEOS bulk migrate in this batch. Slimline was the first complete adopter after the master freeze.
