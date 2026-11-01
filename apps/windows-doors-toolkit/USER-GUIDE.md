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
9. **Export toolbar** (also on **08 Quotation** and **07 Hardware BOM**):
   - **Export Quote** — PDF / Excel, each with **with rates** or **no rates**.
   - **Export BOM / materials** — PDF / Excel, each with **with rates** or **no rates** (config materials, names, sizes, qty, glass, colour, hardware).
   - Client-side: Excel = CSV (opens in Excel); PDF = print dialog → Save as PDF. Settings-driven rates apply only when “with rates” is chosen.

| Mode | Pricing (Settings-driven rules — not hardcoded rates) |
|------|------------------------------------------------------|
| **Home owner** | Retail = window-type ₹/sqft + colour adj + glass ₹/sqft |
| **Architects** | Retail minus (architect margin % × discount factor). Seed: 20% × 0.5 → **10% below** homeowner |
| **Builder** | If retail quote total ≥ threshold (seed ₹50L), apply builder % off (seed **15%**). Threshold + % editable in Settings → Allowances |
| **Vendor** | Verification unlocks **full fab tools** (sidebar + home hub); schedule shows retail. Private rate overrides available on Master catalogue. |

**Nav by mode:** Home owner / Architect / Builder see the **quote path** (Home, **Site Measure**, Configurator, Leads, Quotation) plus a **shop-owner shared-master Settings path** (Master catalogue, Window types, Series, Glass, Colours, Hardware, Profiles, Mode pricing, Export/Import). **Vendor** (after verification) sees every fab tool (01–15, Site Measure, stock, Business/GST, full Settings). Switching Mode on the project bar updates sidebar + home hub immediately (no refresh).

Edit colours under **Settings → Colours / finish**. Mode pricing under **Settings → Allowances → Mode pricing**. Door/mesh track defaults and typed mesh ₹/sqft under **Settings → Allowances → Door / mesh costing defaults**.

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

**Push:**

- **Push net → 01 Openings + Quote** — copies glass/mesh fields onto openings.
- **Push → 02/03 Costing** — feeds Tool 02 Sliding / 03 Casement (Vendor fab tools).
- **Push → Configurator** — cart lines include glass/mesh; mesh amount enters mode quote retail subtotal.
- **Push net → 05 Cutting** — fab sizes as before.

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

## Layout / scroll

Shell uses `250px + minmax(0,1fr)` with `overflow-x: hidden` on `html`/`body`/`.shell`/`.main`. Wide tables (Leads, Site Measure, etc.) scroll **inside** `.table-panel` / `.card` — the sidebar must not drag sideways with the page.

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
3. **Push net → 01 Openings + Quote** uses fabrication sizes for the openings schedule.
4. **Push net → 05 Cutting** fills cut lines from net W/H (frame pairs). Cutting should use fab sizes, not raw site readings.

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

Yellow number fields use a shared draft input: you can clear and retype without the value snapping to **0** mid-edit. Empty on blur restores the previous value.

---

## Demo path (smoke)

1. Open app — lands on **Site Measure** (not Home).
2. Confirm **Project** bar shows *Sample villa — Hyderabad*.
3. Living room seed: **3-track**, glass doors **2**, mesh doors **1**, type **rolling**; Mesh add-on KPI updates.
4. **Push → 02/03 Costing** (Vendor mode) → **02 Sliding** shows mesh doors + type.
5. **Push net → 01 Openings**, then **08 Quotation** / **Configurator**.
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
