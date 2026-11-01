# Windows & Doors Fabricator Toolkit — User Guide

Local web app that mirrors the audited Excel **Business Toolkit** flow: **Settings-driven series/rates → size entry → automatic calculations**. Yellow = type, blue = linked from Settings/other tool, white = calculated. Data persists in browser `localStorage` and can be exported/imported as JSON.

**Do not modify the original Excel kits.** This app is a separate Vite + React + TypeScript tool.

---

## How to start

```bash
cd D:\Downloads\Windows-Doors-Toolkit
npm install   # first time only
npm run dev
```

Open the URL Vite prints (usually `http://127.0.0.1:5173/`).

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

## Recommended shop workflow

1. **Settings → Business / GST** — company name, address, GSTIN, GST on/off and %.
2. **Settings → Allowances** — min chargeable sqft, wastage, Al ₹/kg + coating, glass round-up, default margin, labour/transport defaults.
3. **Settings → Series & members** — create/edit Series A (sliding) / Series B (casement): member class, W/H factors, ₹/m, hardware defaults.
4. **Settings → Window types / Glass / Hardware / Profiles** — rate cards and stock masters.
5. **01 Openings** — job schedule: location, type, W×H×qty → chargeable sqft + estimate.
6. **02 Sliding** or **03 Casement** — pick series, enter size → member metres, glass, hardware, wastage, margin price.
7. **05–07** — cutting list, glass panes, hardware BOM (manual lines + masters).
8. **08 Quotation** + **10 Margin** — quote from openings (+ mesh/grill − discount + GST) vs cost stack.

Export JSON from **Settings → Export / Import** before major rate changes; use **Reset to seed** only when you want the generic sample back.

---

## Tools built (01–15)

| Route | Tool | Purpose |
|-------|------|---------|
| `/` | Home | KPIs + hub |
| `/openings` | 01 Window Sqft | Openings schedule |
| `/sliding` | 02 Sliding | Series + size → cost |
| `/casement` | 03 Casement | Panels/openable → cost |
| `/doors` | 04 Doors | Door/partition lines |
| `/cutting` | 05 Cutting | Cut list → stock to buy |
| `/glass` | 06 Glass | Pane lines → glass ₹ |
| `/hardware` | 07 Hardware | Type × item matrix |
| `/quote` | 08 Quotation | Schedule + GST + advance |
| `/compare` | 09 Compare | UPVC vs Aluminium |
| `/margin` | 10 Margin | Cost vs quoted |
| `/mesh` | 11 Mesh & Grill | Add-ons |
| `/labour` | 12 Labour | Fab + install |
| `/builder` | 13 Builder | Bulk/tower estimator |
| `/revision` | 14 Price Revision | Input cost impact |
| `/dashboard` | 15 Dashboard | Cross-tool KPIs |

---

## Settings modules

| Route | Module |
|-------|--------|
| `/settings` | Overview |
| `/settings/business` | Business / GST |
| `/settings/allowances` | Allowances & defaults |
| `/settings/series` | Series & profile members |
| `/settings/window-types` | Window types ₹/sqft |
| `/settings/glass` | Glass types |
| `/settings/hardware` | Hardware catalogue |
| `/settings/profiles` | Profiles stock |
| `/settings/data` | Export / Import / Reset seed |

---

## Demo path (smoke)

1. Open **02 Sliding** — seed defaults: Series A 60 mm Sliding, **1500 × 1200 mm**, qty 4, Clear 5 mm.
2. Confirm calculated total (sample seed ≈ ₹48,825 all windows; price/sqft @ margin ≈ ₹630).
3. Edit **Settings → Series** member ₹/m or **Business** company name; reload — values persist via `localStorage`.
4. **Settings → Export / Import** → Download JSON for backup.

Sample rates are generic India 2026 fiction (Series A / B — no brand copy).

---

## Screenshots

- `media/toolkit-home.png`
- `media/toolkit-sliding.png`
- `media/toolkit-settings-series.png`
