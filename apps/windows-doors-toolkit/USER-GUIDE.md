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

## Measure → quote path (recommended)

1. **Settings → Business / GST** — company, GSTIN, GST on/off and %.
2. **Settings → Allowances** — min chargeable sqft, mesh ₹/sqft, toughened extra, site install ₹/sqft, wastage, labour defaults.
3. **Settings → Window types / Series / Glass / Hardware** — rate cards (sample seeds only — overwrite with your shop rates).
4. **Leads** — log enquiry (source, need, status, follow-up). **Use on job** fills customer/site on quote header.
5. **Site Measure** — one row per opening on site: location, type, W×H, unit, qty, mesh/toughened. Amount = chargeable sqft × (type rate + install + mesh + toughened extras from Settings).
6. Click **Push to 01 Openings + Quote header** — copies schedule into Tool 01 and customer into quote.
7. **08 Quotation** — schedule from openings + mesh/grill − discount + GST; set advance % or ₹; **Print quote** for A4.
8. Optional: **02/03** costing, **05–07** BOQ, **10 Margin**.

---

## Tools built (01–15 + measure kit)

| Route | Tool | Purpose |
|-------|------|---------|
| `/` | Home | KPIs + hub |
| `/leads` | Leads | Enquiry CRM · follow-ups |
| `/site-measure` | Site Measure | Site visit W×H → openings |
| `/openings` | 01 Window Sqft | Openings schedule |
| `/sliding` | 02 Sliding | Series + size → cost |
| `/casement` | 03 Casement | Panels/openable → cost |
| `/doors` | 04 Doors | Door/partition lines |
| `/cutting` | 05 Cutting | Cut list → stock to buy |
| `/glass` | 06 Glass | Pane lines → glass ₹ |
| `/hardware` | 07 Hardware | Type × item matrix |
| `/quote` | 08 Quotation | Printable schedule + GST + advance |
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
| `/settings/allowances` | Allowances, site-measure add-ons & defaults |
| `/settings/series` | Series & profile members |
| `/settings/window-types` | Window types ₹/sqft |
| `/settings/glass` | Glass types |
| `/settings/hardware` | Hardware catalogue |
| `/settings/profiles` | Profiles stock |
| `/settings/data` | Export / Import / Reset seed |

---

## Demo path (smoke)

1. Open **Site Measure** — seed openings linked to `LD-3001`; check measured value KPI.
2. **Push to 01 Openings**, then open **08 Quotation** — letterhead, schedule, GST, advance % (seed 40%), balance.
3. Open **02 Sliding** — Series A 60 mm, **1500 × 1200 mm**, qty 4 → sample total ≈ ₹48,825 / ≈ ₹630/sqft.
4. Edit **Settings → Series** or **Business**; reload — persists via `localStorage`.
5. **Settings → Export / Import** → Download JSON for backup.

Sample rates are generic India 2026 fiction (Series A / B — no brand copy).

---

## Screenshots

- `media/toolkit-home.png`
- `media/toolkit-sliding.png`
- `media/toolkit-settings-series.png`
- `media/toolkit-site-measure.png`
- `media/toolkit-quote-print.png`
- `media/toolkit-leads.png`

Related audit: `docs/site-measurement-kit-audit.md`
