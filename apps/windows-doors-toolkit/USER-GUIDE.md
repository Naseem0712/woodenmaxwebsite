# Windows & Doors Fabricator Toolkit — User Guide

Local web app that mirrors the audited Excel **Business Toolkit** plus the **Site Measurement & Quotation Kit** flow: **Settings-driven series/rates → site measure → openings → quote**. Yellow = type, blue = linked from Settings/other tool, white = calculated. Data persists in browser `localStorage` and can be exported/imported as JSON.

**Do not modify the original Excel kits or PDF guide.** This app is a separate Vite + React + TypeScript tool.

---

## How to start

```bash
cd D:\Downloads\Windows-Doors-Toolkit
npm install   # first time only
npm run dev
```

Open the URL Vite prints (usually `http://127.0.0.1:5173/`). **Default landing is Site Measure** (`/site-measure`); Home remains at `/home`.

Production build check:

```bash
npm run build
npm run preview
```

Source also lives under:

- Working copy: `D:\Downloads\Windows-Doors-Toolkit\`
- Project store snapshot: `docs/windows-doors-toolkit/` (this Agent Store)
- Repo copy for version control: `D:\Downloads\woodenmax-live\apps\windows-doors-toolkit\`

---

## Projects (job isolation)

Use the **Project** bar at the top of every page:

- **Select** a project — openings, site measures, cutting, quote, leads, etc. switch with it (no mixed job data).
- **Material (UPVC / Aluminium)** — locks the whole job. Series, window types, profiles, cutting stock, and Tools 02/03 only show that material. Switching material realigns sliding/casement to a matching series.
- **Mode (customer type)** — **Home owner**, **Architects**, **Builder**, **Vendor** (extensible). Modes shape quote UX / discounts — **never** embed shop rates. Rates stay Settings-driven.
- **Verification gate** — Architect / Builder / Vendor unlock only after **name + professional/business email + mobile + area + city + GST no**. Email is the login key (customer ID derived from it) so returning users can restore saved projects/quotes. Prefer a company email; personal email is allowed. Home owner has no GST gate.
- **Rename** / **+ New** — create empty job bags (pick material + mode for the new job) while keeping global Settings masters.
- **Less-off W/H** on the bar — optional project override of Settings less-off for the project’s material (clear with **Use Settings**).

**Global (shared):** Business, Allowances (+ mode pricing), Series, Window types, Glass, **Colours**, Hardware, Profiles catalogue, **Series stock**, mode verifications.  
**Per project:** Material lock, customer mode, Leads, Site Measure, Openings, costing jobs, Cutting, Quote, **Configurator cart**, Mesh, Labour, Builder, etc.

**Exception:** Tool **09 Compare** still shows UPVC vs Aluminium side-by-side on purpose.

Screenshots (store `media/`): homeowner configurator, architect price, builder threshold, verification gate, plus earlier material/mode shots.

---

## Quote configurator (by Mode)

Route: **`/configure`**. Same single-screen flow for Home owner / Architect / Builder:

1. Size + qty → 2. Type (sliding / openable / fix / door) → 3. Material UPVC | Aluminium → 4. Glass → 5. Colour → 6. Rate / area / budget → 7. **Add to quote**.
8. Below: quote tabs **List / Areas / Materials / Hardwares**.
9. **Export toolbar** — see **Export Quote / BOM** below (same controls on Quotation + Hardware BOM).

| Mode | Pricing (Settings-driven rules — not hardcoded rates) |
|------|------------------------------------------------------|
| **Home owner** | Retail = window-type ₹/sqft + colour adj + glass ₹/sqft |
| **Architects** | Retail minus (architect margin % × discount factor). Seed: 20% × 0.5 → **10% below** homeowner |
| **Builder** | If retail quote total ≥ threshold (seed ₹50L), apply builder % off (seed **15%**). Threshold + % editable in Settings → Allowances |
| **Vendor** | Verification unlocks **full fab tools** (sidebar + home hub); schedule shows retail. Private rate overrides available on Master catalogue. |

**Nav by mode:** Home owner / Architect / Builder see the **quote path** (Home, **Site Measure**, Configurator, Leads, Quotation) plus a **shop-owner shared-master Settings path** (Master catalogue, Window types, Series, Glass, Colours, Hardware, Profiles, Mode pricing, Export/Import). **Vendor** (after verification) sees every fab tool (01–15, Site Measure, stock, Business/GST, full Settings). Switching Mode on the project bar updates sidebar + home hub immediately (no refresh).

Edit colours under **Settings → Colours / finish**. Mode pricing under **Settings → Allowances → Mode pricing**. Door/mesh track defaults and typed mesh ₹/sqft under **Settings → Allowances → Door / mesh costing defaults**.

---

## Export Quote / BOM (PDF + Excel)

Visible **near the top of the page** (not Settings-only) on:

- **Site Measure** (`/site-measure`) — measured openings schedule
- **Configurator** (`/configure`)
- **08 Quotation** (`/quote`)
- **07 Hardware BOM** (`/hardware`, Vendor)

| Group | Formats | Options |
|-------|---------|---------|
| **Export Quote** | PDF, Excel | **package** amounts only (no ₹/sqft on the quote) |
| **Export BOM** | PDF, Excel | **with rates** · **no rates** |
| **Export Size list** | PDF, Excel | **with rates** · **no rates** (when available) |
| **Export Profile BOQ** | PDF, Excel | **with rates** · **no rates** (when available) |

Quote exports show **package amount per opening** — never a ₹/sqft rate column. BOM / size list / profile BOQ may still offer with/without rates from Settings — never invented rates. Excel downloads as CSV (opens in Excel); PDF opens a print view → Save as PDF. Smoke: `node tools/_smoke-export-wd12.mjs` · shell/export: `node tools/_smoke-shell-export-wd16.mjs` · quote PDF lines: `node tools/_smoke-quote-pdf-format-wd17.mjs` · opening rates: `node tools/_smoke-wd19-opening-rates-quote.mjs` · quote GST/discount/custom: `npx vite-node tools/_smoke-quote-enhance-unit.mjs` · `node tools/_smoke-quote-enhance-gst-discount.mjs`.

### Quote GST · line discount · footer · custom products

Shared on **Quotation**, **Configurator**, and **Site Measure** (package Quote PDF/Excel):

- **GST** — Settings → Business holds GST % (seed 18%) and default on/off. Each quote has an **Apply GST on grand total** toggle (quote-level; empty follows Settings). Off = no GST line; on = GST % on the taxable grand only (after discounts).
- **Discount % per product** — openings / configurator lines / custom lines. Empty = no discount narrative. When set: show **actual amount → discount % → selling amount**; package leader uses selling.
- **Footer** — Description, Terms, Bank details persist with the quote and print on PDF/Excel after the totals.
- **Custom products** — add lines not in window tools (doors, pergolas, chairs, tables, walls, louvers…): name, optional size, rate, unit (per pc / rft / sft / kg), qty → amount in the same package style. Rates are user/Settings-driven — never hardcoded shop rates.

**Window size list** (fab sheet, per opening) — Site Measure preview + export:

```
W-01 Living room ................ UPVC 3-track sliding · with rolling mesh
Actual 1800×1500 mm · qty 1 · Less W 5 · Less H 5 → Net 1795×1495 mm
Hardwares / design: Glass … · Colour … · Handle / lock … · Mesh …
```

**Hardware / profile BOQ** — rolls series members (vertical + top/bottom) across openings into stock bars (`name · N nos · stock ft` from Settings profile stock length) plus series/catalogue hardware qty (handle, connector, lock, rollers…). Cutting-list push also supplements profile lines. Rates Settings-driven only.

**Quote PDF / print opening lines** (Quotation, Configurator, Site Measure) use the shared W-01 narrative — one opening per block, wired from Site Measure / Configurator / Settings masters:

```
W-01 Living room, 1800×1500 mm, qty 1, area 29.06 sqft
Window: UPVC 3-track sliding
Shutter/door: 2 shutters Glass + 1 shutter mesh
Color: White (standard)
Glass: 5 mm clear tuff (Saint-Gobain)
Lock / handle type: Metro Type Matt black lock
Mesh: 0.5 mm, Black, rolling
Door closer: Door closer, Dorma, Matt Black, 45 kg
```

Codes run W-01, W-02… Size uses the selected unit (`mm` / `inch` / `ft`). Glass brand, lock/handle label, mesh thickness/colour/type, and door closer **or** floor spring (exclusive) are editable in Settings masters — never hardcoded into the formatter. Mesh line appears only when mesh doors & type are set. Door closer / floor spring lines appear for door/casement when that extra is selected. Per-opening **Notes** (when set) appear in the block. Quote PDFs keep the narrative, then a dotted leader row `description …… package amount` (amount right-aligned — **no ₹/sqft**). Summary totals use the same dotted layout. Excel keeps the grid with **Package ₹** and a **Schedule (W-01 block)** column (same shared formatter).

**Print typography:** Quote PDF/print uses a professional Inter / system-ui / Georgia stack (not monospace). The **W-01 location** header line is bold; the remaining narrative lines stay regular weight.

**Letterhead** (Quote PDF / print): company logo, name, address, phone, email, website, and **GST** (capital letters) + GSTIN from **Settings → Business / GST**, then customer / site from quote or job meta. Badge reads **Package amounts**. Logo accepts URL or local image upload (stored in this browser). Page left/right margins are set for print.

Smoke: `node tools/_smoke-quote-pdf-format-wd17.mjs` · letterhead/cards: `node tools/_smoke-wd19-cards-letterhead.mjs` · rates/quote: `node tools/_smoke-wd19-opening-rates-quote.mjs`.

Screenshots (store `media/`): `toolkit-export-site-measure.png`, `toolkit-export-configurator.png`, `toolkit-export-quotation.png`, `toolkit-quote-pdf-w01-preview.png`, `toolkit-quote-pdf-w01-configurator.png`, `toolkit-quote-pdf-w01-site-measure.png`, `toolkit-shell-mobile-drawer.png`, `toolkit-shell-desktop-scroll.png`.

---

## Site Measure — glass doors + mesh (costing)

Default route on app open: **`/site-measure`**.

After site qty, each opening carries costing selections (Settings defaults + per-row override):

| Field | Sliding | Openable / casement |
|-------|---------|---------------------|
| **Tracks** | 2, 2.5, 3, 4, 6… | — |
| **Glass doors** | Shutters (2, 3, 4, 6…) — required | Leaf / openable count |
| **Mesh doors** | Count (0 = none) — required when using mesh | Count; door-side uses leaf area |
| **Mesh type** | none / rolling / collapsible / fixed / door-side | same; vent → typically **fixed** |
| **Vent** | — | Yes → fixed outer mesh (casement profiles) |

**Rules (editable in Settings, not hardcoded):**

- **2-track** typically seeds **no mesh**; **2.5 / 3-track** (and higher) can take mesh.
- **Rolling / collapsible** usually charge **full window-size** area × Settings ₹/sqft (rates differ).
- **Door-side** (openable) charges **leaf/door size** × Settings door-side rate.
- **Fixed** mesh for vents / outer mesh; rates from Settings masters.

**Send openings to…** (all four use **net fab size** = site W×H after less-off):

- **Quote** — copies all openings (glass/mesh) onto the 01 Openings / Quote schedule.
- **Costing** — feeds first sliding → 02 Sliding and first casement/door → 03 Casement (Vendor tools).
- **Configurator** — cart lines include glass/mesh; mesh amount enters mode quote retail subtotal.
- **Cutting** — frame cut pairs (W×2 + H×2 per qty) on 05 Cutting.

After each send, a status line confirms what was written and links to the destination (Vendor-only tools ask you to switch Mode when needed).

Configurator (all modes) also asks glass doors + mesh doors/type after size/type.

---

## Master catalogue (shared + Vendor overrides)

Route: **`/settings/master`**.

- **Shared master** = fabricator-owned market/standard DB (window types, series members, glass, colours, hardware, profiles). Home owner / Architect / Builder calculations always read this shared base.
- **Shop-owner testing path** — quote Modes are not stuck: edit shared rates on Master, or open the dedicated Settings pages above to add/remove SKUs, without unlocking Vendor fab tools.
- **Export / Import shared JSON** — share market rates between shops without shipping job bags or Vendor private rates.
- **Vendor defaults = shared** — Vendor starts from the same shared masters. Private ₹ override columns appear only in Vendor mode; they layer **on top** of shared on read. Clearing an override falls back to shared. Shared master is never rewritten by overrides.
- Configurator (and Vendor tooling) reads **shared + optional Vendor override** via `resolveEffectiveCatalogue`. Formulas never hardcode shop rates.

---

## Layout / scroll / mobile

Desktop shell: fixed **100vh** grid (`~220px` sidebar + main). **Sidebar and main scroll independently** — the toolkit nav does not scroll away with the project pane. Dense spacing keeps project bar, cards, tables, and export controls above the fold where possible.

Mobile (≤980px): sidebar is a **hamburger overlay drawer**, **collapsed by default**. Menu button opens/closes; backdrop + Escape + route change close it. Inputs stack; touch targets ≥~36px. Wide tables still scroll inside `.table-panel` / `.card`.

**Site Measure openings (mobile):** each opening is a **stacked card** with **2 fields per row** (Location|Type, Size W|H, Unit|Qty, Less W|H, Glass|doors, Mesh…, Rates…) and a **Notes** field at the bottom of every opening — not a wide table. Desktop keeps the schedule table (also has Notes).

**Rates / amount on each opening (card + desktop table):** **₹/sqft**, **Mesh ₹**, and **Amount** (package) are editable number fields. Calculated defaults fill first from Settings / window-type / mesh costing; edits persist and drive KPI totals. Changing size / mesh / rate clears the matching lock so defaults refill. Numeric keypad uses `inputMode` (decimal) on mobile.

**Site Measure Actions & totals (mobile):** export Quote uses **PDF · package** / **Excel · package**; BOM keeps with/without rates. Desktop keeps the full export toolbar, add-on card, KPI row, and a tidy **Send openings to…** panel (Quote · Costing · Configurator · Cutting) above the openings list. Smoke: `node tools/_smoke-site-measure-mobile-cards-wd18.mjs` · polish: `node tools/_smoke-wd19-cards-letterhead.mjs` · rates/quote: `node tools/_smoke-wd19-opening-rates-quote.mjs` · send: `node tools/_smoke-site-measure-send-openings.mjs`.

---

## Material × class isolation

- **Do not mix UPVC and Aluminium** on one project. Masters stay global; dropdowns filter by the project material.
- **Class isolation:** Tool 02 Sliding lists **sliding** series only; Tool 03 Casement lists **casement + door** series — for both materials.
- Window types and profile SKUs carry **material + kind** so Settings and tools stay grouped (sliding under sliding, casement under casement).
- Sample seeds include UPVC Series A/B and Aluminium Series C/D plus a second Aluminium sample project.

---

## Series hardware by Kind (no sliding ↔ casement mix)

**Settings → Series** header shows **only** hardware for the selected Kind:

| Kind | Shown | Hidden |
|------|--------|--------|
| **sliding** | Tracks, glass shutters, rollers, sliding lock/handle | Friction stay, hinges, door connectors, swing door set |
| **casement** | Panels/openable, friction stay (size mm), hinges, connectors, lamination arm, lock guide / brush / EPDM / lock / closer | Rollers, tracks, sliding lock sets |
| **door** | Casement-style openable hardware **plus** swing: floor spring, door set, swing handle/lock | Sliding rollers |

- **Friction stay:** 1 set = **2 pc** per openable/door. Size options (inches → mm): 6→152, 8→203, 10→254, 12→305, 14→356, 16→406, 18→457, 20→508, 24→610, 30→762. Size catalogue ₹ edited in Settings; job picks size.
- **Hinges:** qty by weight need; ₹/pc from series master.
- **Door connector:** default **4 pc per door**; ₹/pc.
- **Lamination arm:** sizes **150 / 200 / 250 / 305 mm**; ₹ by size catalogue.
- **Name vs Kind warn:** e.g. name contains “Sliding” / “PS” while Kind=casement → yellow banner (rename or change Kind). Hardware still stays casement-only.
- Hardware catalogue items carry a **class** (sliding / casement / door / shared).

---

## Less-off → fabrication size

1. Set **per-material** defaults in **Settings → Allowances** (UPVC W/H and Aluminium W/H), and/or project bar, and/or **per row** on Site Measure.
2. **Site Measure** stores **site W/H** and persists **net W/H** = site − less (clamped ≥ 0; row warns if less-off would go negative). Effective default follows the project material.
3. **Send → Quote** uses fabrication sizes for the openings / Quote schedule.
4. **Send → Cutting** fills cut lines from net W/H (frame pairs). Cutting should use fab sizes, not raw site readings.

---

## Series stock

**Settings / Manage → Series stock** (also `/stock`):

- Inventory grouped by **material × kind × series** (filter defaults to the active project material).
- Editable **section / profile** names, opening balance, purchases, remaining.
- **Issue…** to the active project, or on **05 Cutting** use **Deduct metres from series stock** (matches series + section name when possible).

---

## Measure → quote path (recommended)

1. **Settings → Business / GST** — company, GSTIN, GST on/off and %.
2. **Settings → Allowances** — min chargeable sqft, mesh ₹/sqft, toughened extra, site install ₹/sqft, **less-off**, wastage, labour defaults.
3. **Settings → Window types / Series / Glass / Hardware** — rate cards (sample seeds only — overwrite with your shop rates).
4. Pick or create a **Project**.
5. **Leads** — log enquiry; **Use on job** fills customer/site on quote header.
6. **Site Measure** — site W×H, less-off, net fab size; push to openings / cutting.
7. **08 Quotation** — schedule from openings + mesh/grill − discount + GST; **Export Quote / BOM** (PDF + Excel, with or without rates).
8. Optional: **02/03** costing, **05–07** BOQ + stock deduct, **10 Margin**.

---

## Tools built (01–15 + measure kit)

| Route | Tool | Purpose |
|-------|------|---------|
| `/` | → redirects to Site Measure | Default landing |
| `/home` | Home | KPIs + hub |
| `/leads` | Leads | Enquiry CRM · follow-ups |
| `/site-measure` | Site Measure | Site W×H + glass/mesh doors → less-off → net → openings/02/03/configure |
| `/openings` | 01 Window Sqft | Openings schedule |
| `/sliding` | 02 Sliding | Series + size → cost |
| `/casement` | 03 Casement | Panels/openable → cost |
| `/doors` | 04 Doors | Door/partition lines |
| `/cutting` | 05 Cutting | Cut list → stock to buy / deduct |
| `/glass` | 06 Glass | Pane lines → glass ₹ |
| `/hardware` | 07 Hardware | Type × item matrix + Export BOM PDF/Excel |
| `/quote` | 08 Quotation | Schedule + GST + Export Quote/BOM (PDF/Excel ± rates) |
| `/configure` | Configurator | Mode quote cart + Export Quote/BOM (PDF/Excel ± rates) |
| `/compare` | 09 Compare | UPVC vs Aluminium |
| `/margin` | 10 Margin | Cost vs quoted |
| `/mesh` | 11 Mesh & Grill | Add-ons |
| `/labour` | 12 Labour | Fab + install |
| `/builder` | 13 Builder | Bulk/tower estimator |
| `/revision` | 14 Price Revision | Input cost impact |
| `/dashboard` | 15 Dashboard | Cross-tool KPIs |
| `/stock` | Series stock | Series-wise inventory |

---

## Settings modules

| Route | Module |
|-------|--------|
| `/settings` | Overview |
| `/settings/master` | **Master catalogue** (shared rates + Vendor overrides) |
| `/settings/business` | Business / GST |
| `/settings/allowances` | Allowances, less-off, mode pricing |
| `/settings/series` | Series & profile members |
| `/stock` | Series stock (opening / purchases / issues) |
| `/settings/window-types` | Window types ₹/sqft |
| `/settings/glass` | Glass types |
| `/settings/colours` | Colours / finish |
| `/settings/hardware` | Hardware catalogue |
| `/settings/profiles` | Profiles catalogue (rates / stock length) |
| `/settings/data` | Export / Import / Reset seed |

---

## Numeric editing

Yellow number fields use a shared draft input (`NumberInput` / `Input type="number"`): you can clear and retype without the value snapping to **0** mid-edit. Empty on blur restores the previous value.

**Mobile keyboards:** every numeric field opens the number keypad by default (`inputMode="decimal"` for rates/sizes; use `inputMode="numeric"` for integers-only; phone fields use `type="tel"`). Site Measure, Configurator, Settings rates, Less-off, tables, and cards all inherit this from the shared components — do not add raw `<input type="number">`.

---

## Demo path (smoke)

1. Open app — lands on **Site Measure** (not Home).
2. Confirm **Project** bar shows *Sample villa — Hyderabad*.
3. Living room seed: **3-track**, glass doors **2**, mesh doors **1**, type **rolling**; Mesh add-on KPI updates.
4. **Send → Costing** (Vendor mode) → **02 Sliding** shows mesh doors + type.
5. **Send → Quote**, then **08 Quotation** / **Send → Configurator**.
6. **Settings → Allowances** — Door / mesh costing defaults (track table + typed ₹/sqft).
7. **+ New** project, confirm openings/site measure empty; switch back — sample data returns.
8. **Settings → Export / Import** → Download JSON for backup.

Sample rates are generic India 2026 fiction (Series A / B — no brand copy).

---

## Screenshots

Store `media/` (and earlier shots):

- `toolkit-site-measure-landing-mesh.png` — default landing + glass/mesh columns
- `toolkit-sliding-3track-mesh.png` — Tool 02 after push (3-track + mesh)
- `toolkit-settings-mesh-defaults.png` — Allowances door/mesh masters
- `toolkit-homeowner-configurator.png` — Mode quote single-screen flow
- `toolkit-mode-verification-gate.png` — Architect/Builder/Vendor GST gate
- `toolkit-architect-price.png` — ~10% below retail
- `toolkit-builder-threshold.png` — 15% off when threshold met
- `toolkit-master-catalogue.png` — shared master catalogue
- `toolkit-master-vendor-overrides.png` — Vendor private override columns
- `toolkit-leads-no-hscroll.png` / `toolkit-site-measure-no-hscroll.png` — shell scroll fix
- Plus earlier: home, sliding, series, site-measure, stock, quote, leads

Related audit: `docs/site-measurement-kit-audit.md`
