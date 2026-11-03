/**
 * Smoke: UPVC Site Measure → Generate full package
 * - Materials / cuts nested with remnants
 * - Glass + mesh + openings + quote header
 * - Aluminium path still rejects full-package helper
 */
import { createSeedState } from '../src/data/seed.ts';
import { calcCutting, calcGlassPanes, calcMeshGrill, calcQuote } from '../src/engine/calcs.ts';
import { projectMaterial } from '../src/engine/materialContext.ts';
import { nestProfileCuts } from '../src/engine/nesting.ts';
import { generateUpvcFullPackage } from '../src/engine/upvcPackage.ts';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const seed = createSeedState();
assert(projectMaterial(seed) === 'UPVC', 'seed active project should be UPVC');
assert(seed.siteMeasures.length > 0, 'seed needs site measures');

const beforeCuts = seed.cuts.length;
const { next, summary } = generateUpvcFullPackage(seed);

assert(summary.openings > 0, 'package should create openings');
assert(summary.cutLines > 0, 'package should create cut lines');
assert(next.cuts.length >= summary.cutLines, 'cuts written');
assert(next.glassPanes.length >= 1, 'glass panes written');
assert(next.quote.customerName, 'quote customer set');
assert(next.quote.quoteDate, 'quote date set');
assert(next.openings.every((o) => o.width > 0 && o.height > 0), 'openings use net sizes');

const cutting = calcCutting(next);
assert(cutting.nesting.totalBars > 0, 'nesting produced bars');
assert(Array.isArray(cutting.remnantLines), 'remnant lines present');

const glass = calcGlassPanes(next);
assert(glass.rows.length > 0, 'glass calc rows');

const mesh = calcMeshGrill(next);
// mesh may be 0 if seed openings have no mesh — check at least structure
assert(typeof mesh.total === 'number', 'mesh total numeric');

const quote = calcQuote(next);
assert(quote.grand >= 0, 'quote grand ok');

// Nesting unit: two 2000 mm cuts on 5800 stock → 1 bar, remnant ~1800 (minus trim/saw)
const nest = nestProfileCuts(
  [{ profileKey: 'a', profileName: 'Frame', cutMm: 2000, pieces: 2, stockLengthM: 5.8, ratePerM: 100 }],
  50,
  0,
);
assert(nest.totalBars === 1, `expected 1 bar got ${nest.totalBars}`);
assert(nest.remnantLines.some((r) => r.count === 1 && r.remnantMm >= 1700), 'expect ~1750–1800 remnant');

// Aluminium isolation — full package must throw
const alu = {
  ...seed,
  activeProjectId: 'project-alu-office',
  projects: seed.projects,
};
// Force material via project bag switch simulation
const aluState = {
  ...seed,
  projects: seed.projects.map((p) =>
    p.id === seed.activeProjectId ? { ...p, material: 'Aluminium' } : p,
  ),
};
let threw = false;
try {
  generateUpvcFullPackage(aluState);
} catch {
  threw = true;
}
assert(threw, 'Aluminium must not run UPVC full package');

console.log(
  JSON.stringify(
    {
      ok: true,
      beforeCuts,
      summary: {
        openings: summary.openings,
        cutLines: summary.cutLines,
        glassLines: summary.glassLines,
        meshLines: summary.meshLines,
        profileBars: summary.profileBars,
        remnants: summary.remnantLines.length,
        quoteCustomer: summary.quoteCustomer,
        quoteDate: summary.quoteDate,
      },
      cuttingBars: cutting.lengthsToBuy,
      quoteGrand: Math.round(quote.grand),
      nestUnitBars: nest.totalBars,
      nestRemnantMm: nest.remnantLines[0]?.remnantMm,
    },
    null,
    2,
  ),
);
