/**
 * Whole-order profile nesting — First Fit Decreasing on same-type stock bars.
 * Rates / stock lengths stay Settings-driven; this only packs cut lengths.
 */

export interface NestCutPiece {
  /** Profile / member key used to group same-type nesting */
  profileKey: string;
  profileName: string;
  cutMm: number;
  pieces: number;
  stockLengthM: number;
  ratePerM?: number;
}

export interface NestRemnant {
  profileKey: string;
  profileName: string;
  remnantMm: number;
  count: number;
}

export interface NestBar {
  profileKey: string;
  profileName: string;
  stockMm: number;
  usedMm: number;
  remnantMm: number;
  cuts: number[];
}

export interface NestProfileSummary {
  profileKey: string;
  profileName: string;
  stockLengthM: number;
  stockMm: number;
  usableMm: number;
  cutPieces: number;
  cutMetres: number;
  barsUsed: number;
  boughtMetres: number;
  offcutMetres: number;
  wastagePct: number;
  cost: number;
  remnants: NestRemnant[];
  bars: NestBar[];
}

export interface NestResult {
  profiles: NestProfileSummary[];
  totalBars: number;
  totalCutMetres: number;
  totalBoughtMetres: number;
  totalOffcutMetres: number;
  totalCost: number;
  /** Flat remnant rollup: "N pcs @ X mm" per profile+size */
  remnantLines: NestRemnant[];
}

function expandPieces(pieces: NestCutPiece[]): Array<{ profileKey: string; profileName: string; cutMm: number; stockLengthM: number; ratePerM: number }> {
  const out: Array<{ profileKey: string; profileName: string; cutMm: number; stockLengthM: number; ratePerM: number }> = [];
  for (const p of pieces) {
    const n = Math.max(0, Math.floor(p.pieces));
    const cut = Math.max(0, p.cutMm);
    if (n <= 0 || cut <= 0) continue;
    for (let i = 0; i < n; i++) {
      out.push({
        profileKey: p.profileKey,
        profileName: p.profileName,
        cutMm: cut,
        stockLengthM: p.stockLengthM > 0 ? p.stockLengthM : 5.8,
        ratePerM: p.ratePerM ?? 0,
      });
    }
  }
  return out;
}

/**
 * Nest cut pieces into stock bars (FFD). Same profileKey shares one stock length.
 * endTrimMm reduces usable bar length (Settings end trim).
 */
export function nestProfileCuts(
  pieces: NestCutPiece[],
  endTrimMm = 0,
  sawAllowanceMm = 0,
): NestResult {
  const expanded = expandPieces(pieces).map((p) => ({
    ...p,
    cutMm: p.cutMm + Math.max(0, sawAllowanceMm),
  }));

  const byKey = new Map<string, typeof expanded>();
  for (const p of expanded) {
    const list = byKey.get(p.profileKey) ?? [];
    list.push(p);
    byKey.set(p.profileKey, list);
  }

  const profiles: NestProfileSummary[] = [];

  for (const [profileKey, list] of byKey) {
    const stockLengthM = list[0]?.stockLengthM || 5.8;
    const stockMm = Math.round(stockLengthM * 1000);
    const usableMm = Math.max(1, stockMm - Math.max(0, endTrimMm));
    const ratePerM = list[0]?.ratePerM ?? 0;
    const profileName = list[0]?.profileName ?? profileKey;

    // First Fit Decreasing
    const sorted = [...list].sort((a, b) => b.cutMm - a.cutMm);
    const bars: NestBar[] = [];

    for (const piece of sorted) {
      if (piece.cutMm > usableMm) {
        // Oversized: one bar per piece (remnant 0 or negative clamped)
        bars.push({
          profileKey,
          profileName,
          stockMm,
          usedMm: Math.min(piece.cutMm, usableMm),
          remnantMm: Math.max(0, usableMm - piece.cutMm),
          cuts: [piece.cutMm],
        });
        continue;
      }
      let placed = false;
      for (const bar of bars) {
        if (bar.usedMm + piece.cutMm <= usableMm) {
          bar.usedMm += piece.cutMm;
          bar.cuts.push(piece.cutMm);
          bar.remnantMm = Math.max(0, usableMm - bar.usedMm);
          placed = true;
          break;
        }
      }
      if (!placed) {
        bars.push({
          profileKey,
          profileName,
          stockMm,
          usedMm: piece.cutMm,
          remnantMm: Math.max(0, usableMm - piece.cutMm),
          cuts: [piece.cutMm],
        });
      }
    }

    // Group remnants by rounded mm size (ignore scraps below 50 mm as scrap, still counted in offcut metres)
    const remnantMap = new Map<number, number>();
    for (const bar of bars) {
      const r = Math.round(bar.remnantMm);
      if (r < 50) continue;
      remnantMap.set(r, (remnantMap.get(r) ?? 0) + 1);
    }
    const remnants: NestRemnant[] = [...remnantMap.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([remnantMm, count]) => ({
        profileKey,
        profileName,
        remnantMm,
        count,
      }));

    const cutMetres = list.reduce((s, p) => s + p.cutMm / 1000, 0);
    const barsUsed = bars.length;
    const boughtMetres = barsUsed * stockLengthM;
    const offcutMetres = Math.max(0, boughtMetres - cutMetres);
    const wastagePct = boughtMetres <= 0 ? 0 : offcutMetres / boughtMetres;
    const cost = barsUsed * stockLengthM * ratePerM;

    profiles.push({
      profileKey,
      profileName,
      stockLengthM,
      stockMm,
      usableMm,
      cutPieces: list.length,
      cutMetres,
      barsUsed,
      boughtMetres,
      offcutMetres,
      wastagePct,
      cost,
      remnants,
      bars,
    });
  }

  profiles.sort((a, b) => a.profileName.localeCompare(b.profileName));

  const remnantLines = profiles.flatMap((p) => p.remnants);

  return {
    profiles,
    totalBars: profiles.reduce((s, p) => s + p.barsUsed, 0),
    totalCutMetres: profiles.reduce((s, p) => s + p.cutMetres, 0),
    totalBoughtMetres: profiles.reduce((s, p) => s + p.boughtMetres, 0),
    totalOffcutMetres: profiles.reduce((s, p) => s + p.offcutMetres, 0),
    totalCost: profiles.reduce((s, p) => s + p.cost, 0),
    remnantLines,
  };
}

export function formatRemnantLine(r: NestRemnant): string {
  return `${r.profileName}: ${r.count} pc${r.count === 1 ? '' : 's'} leftover @ ${r.remnantMm} mm`;
}
