# WoodenMax — Windows Topic Master Plan (Content + Data + Schema)

**Purpose:** One source of truth for scaling pages (guides + products + calculators) with **minimal duplicate overlap**, **Hyderabad-first local touch**, and **area/size context** (including ~200 sq.ft–style compact modules).  
**Scope:** Aluminium windows, doors, telescopic, folding — **elevation cladding excluded** until you open that phase.

**Ready-to-use copy:** Per-page `<title>`, H1, H2, H3 drafts + `- [ ]` checklists (tick done → row delete) are in [`windows-new-pages-blueprints.md`](./windows-new-pages-blueprints.md). That file also lists **existing URLs to avoid duplicating**.

**Category wave (types / sizes / systems / glass / design / cities):** Title–URL–H1 list + **har page mandatory module** (calculator, image, drawing, price table, FAQ schema, **Related Windows** footer links) — [`window-pages-category-matrix.md`](./window-pages-category-matrix.md).

---

## 1. Principles (duplicate guard)

| Rule | Implementation |
|------|------------------|
| **One primary intent per URL** | Each page answers *one* main question (price band vs vs-page vs city vs size-scenario). |
| **Shared specs, unique angle** | Master rates/materials live in one data file; page body must add **unique sections**: intro angle, FAQ set, “Who should choose”, Hyderabad note, size example. |
| **Merge, don’t split** | If two titles would use **same H1 + same paragraphs**, make **one** page with FAQ expansion. |
| **Canonical** | If `window.woodenmax.in` mirrors a page, decide **one canonical** per topic to avoid duplicate indexing. |

**Target:** Editorial duplicate feeling **&lt; ~20%** — same facts OK; same long copy blocks not OK.

---

## 2. Page types & title patterns

Use **one pattern per intent**. Replace `{Product}` with e.g. 3-track Domal, top-hung, telescopic slim, bi-fold.

### A. Commercial / price intent
- `{Product} price in India | Rate per sq.ft & what changes cost (2026)`
- `{Product} price in Hyderabad | Live estimate & site-visit notes`
- `Aluminium window price per sq ft in Hyderabad | Factors + calculator`
- `2-track vs 3-track sliding window price | Which is cheaper & when`

### B. Problem / solution (sound, heat, dust)
- `Soundproof windows in Hyderabad | DGU vs laminated | realistic noise reduction`
- `Best glass for traffic noise near {area}` — *only if you have real install notes; else keep “Hyderabad urban traffic” generic*

### C. Comparison (vs)
- `uPVC vs aluminium windows | Price, life, noise — India`
- `Telescopic door vs sliding door for kitchen partition`
- `Bi-fold vs sliding for balcony | Space, sealing, cost`

### D. Size / home-type scenarios (~200 sq.ft touch)
Use **“compact module”** framing (study room, kitchen partition, single large opening) — not a second copy of full-home pricing page.

- `Aluminium windows for small flats (≈500–800 sq.ft homes) | How many openings to budget`
- `Kitchen partition glass door ~6×7 ft | Price factors in Hyderabad`
- `Telescopic door for ~200 sq.ft open kitchen–living layout | Panel options & cost drivers`  
  *(“200 sq.ft” here = typical **open zone** or **one combined living+dining module** people ask about — adjust wording to your actual sales stories.)*

### E. Series / product education
- `What is Domal / 3-track series | Mesh option, profiles, maintenance`
- `Top hung casement vs sliding | Ventilation & rain in Hyderabad climate`

### F. Calculator / tool landing
- `Aluminium window cost calculator (India) | How to read the estimate`
- Link from hub to **existing product calculators** — avoid a second calculator engine per page.

---

## 3. Schema.org — what to use when

| Page type | Primary schema | Add if useful |
|-----------|----------------|---------------|
| Product / variant with offer bands | `Product` + `Offer` or `AggregateOffer` | `FAQPage` (separate block or main entity) |
| How-to / measure / install overview | `HowTo` | `FAQPage` |
| Pure comparison article | `Article` or `WebPage` + `FAQPage` | `BreadcrumbList` |
| City-focused service page | `LocalBusiness` / `Organization` (address Hyderabad) + `Service` | `FAQPage` |
| Big FAQ pages | `FAQPage` | — |

**Hyderabad local page:** include `areaServed` with `City` Hyderabad; optional `hasMap` / `geo` if you publish a real showroom map.

**Avoid:** stuffing `Product` schema on pure blog text with fake SKU.

---

## 4. Data layer (what every page should pull from)

Define **once** in JSON/Sheets; pages **reference** IDs.

| Field | Example use |
|-------|-------------|
| `product_id` | Maps to calculator `data-product` / `configs.js` |
| `profile_brand` | Hindalco / Imported |
| `glass_options` | 6mm, 8mm, DGU, laminated — **rates from master** |
| `rate_band_min_max` | ₹/sq.ft — single source |
| `hardware_included` | Y/N bullets |
| `mesh_optional` | Y/N + add-on range |
| `lead_time_days_typical` | Optional — only if stable |
| `warranty_years` | Align with site-wide claim |

**Page-unique fields (not in global table):** `primary_keyword`, `hyderabad_angle` (1 short paragraph), `size_scenario` (e.g. 6×4 ft × 2 windows), `faq_json` (3–8 unique questions).

---

## 5. Hyderabad preference — “local touch” checklist

Use **2–4 signals** per page — not keyword stuffing.

- **Climate:** monsoon driving rain, sealing, sill / outer frame note (where true for your installs).
- **Areas (examples only, rotate):** Banjara Hills, Jubilee Hills, Gachibowli, Kondapur, Miyapur, Uppal — *only as examples*, not fake “we only serve X”.
- **Buying behaviour:** gated community site rules, façade colour coordination, security grills combo (link to grills silo when relevant).
- **Language hooks (optional):** one line Hinglish in FAQ only if brand voice allows.

**Rule:** If you don’t have a **real** project note for an area, keep **“Hyderabad & Telangana”** generic.

---

## 6. ~200 sq.ft / area touch — how to use without duplication

**Intent:** Users think in **room size** or **one wall / one opening**, not only “full flat sq.ft”.

| Approach | Example |
|----------|---------|
| **One combined open area** | “~200 sq.ft living+dining open layout — typical 2 sliding + 1 fixed” |
| **Per-opening** | “12×8 ft opening → approx. X sq.ft glass area → rate maths” |
| **Budget band** | “Under ₹X lakhs for windows only” — *only if calculated from your master rates* |

Do **not** create 20 pages that only swap “200” with “250” — combine into **one** “small home / compact layout” guide + table.

---

## 7. Topic clusters (skeleton — expand to 100 without overlap)

Each **cluster** = 1 **pillar** + **children** with distinct intent.

1. **Pillar:** Aluminium windows India / Hyderabad hub → links down.  
2. **3-track / Domal:** price, vs 2-track, mesh, maintenance.  
3. **Soundproof / acoustic:** glass stack, realistic dB expectations, cost drivers.  
4. **Sliding / balcony:** sealing, wind, mesh.  
5. **Top hung / casement:** rain, ventilation.  
6. **Telescopic / partition:** kitchen, soft-close, sizes.  
7. **Folding / balcony:** vs sliding, track, maintenance.  
8. **Calculators:** hub page + “how to use” + product links.

**Hyderabad:** pick **10–15** URLs max for **city+product** combos; rest stay **India-wide** with one Hyderabad paragraph.

---

## 8. Pre-publish checklist (every URL)

- [ ] Primary intent one sentence in notes  
- [ ] Unique H1 ≠ any other live page  
- [ ] FAQ ≥ 3 questions **not** copied from sibling page  
- [ ] Internal links: pillar + 1 product + contact  
- [ ] Calculator linked where relevant (`data-product` correct)  
- [ ] Hyderabad block **unique line** vs previous page  
- [ ] Schema matches page type  
- [ ] Canonical set if duplicate risk (subdomain / similar URL)

---

## 9. Files to keep in sync

| File | Role |
|------|------|
| `js/calculator/configs.js` + products JSON | Calculator + rates source |
| `data/window-subdomain-urls.json` | Subdomain ↔ main URL map |
| This doc | Editorial + SEO architecture |

---

## 10. Next step (execution)

1. Lock **pillar list** (8–12 URLs) for next sprint.  
2. Export **master rate table** (Sheets → JSON).  
3. Assign **writer**: one cluster at a time; run duplicate check vs last 5 published pages.

---

*Document version: 2026-04. Update when cladding phase opens or URL strategy changes.*
