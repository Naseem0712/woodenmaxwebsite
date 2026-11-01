# Windows & Doors Fabricator Toolkit

Local Vite + React + TypeScript app for fabricator shops: **Settings (series/rates) → size entry → BOQ / quote / margin**.

This folder is version-controlled under `apps/` and is **not** part of the WoodenMax public website product pages. Original Excel kits are left untouched.

## Start

```bash
cd apps/windows-doors-toolkit
npm install
npm run dev
```

See the Project store user guide: `docs/toolkit-user-guide.md` (Agent Store) or run the working copy at `D:\Downloads\Windows-Doors-Toolkit`.

## Stack

- React 19 + React Router
- Calc engine in `src/engine/calcs.ts`
- Seed masters in `src/data/seed.ts` (generic Series A / B)
- Persistence: `localStorage` + JSON export/import
