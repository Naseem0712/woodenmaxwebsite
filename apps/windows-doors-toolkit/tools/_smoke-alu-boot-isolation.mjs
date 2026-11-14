/**
 * Aluminium boot / isolation smoke — Alu project must NOT expose full-package,
 * and generateUpvcFullPackage must throw when material is Aluminium.
 */
import { createSeedState } from '../src/data/seed.ts';
import { projectMaterial } from '../src/engine/materialContext.ts';
import { generateUpvcFullPackage } from '../src/engine/upvcPackage.ts';
import { extractProjectJob, applyProjectJob, emptyProjectJob } from '../src/store/projectKeys.ts';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const seed = createSeedState();
assert(projectMaterial(seed) === 'UPVC', 'default seed UPVC');

// Switch to Aluminium office sample (mirror AppContext project switch lightly)
const upvcBag = extractProjectJob(seed);
const aluMeta = seed.projects.find((p) => p.material === 'Aluminium');
assert(aluMeta, 'seed has Aluminium project');

const aluBag = emptyProjectJob(upvcBag);
// Minimal Alu site measure so send panel would have openings if UI loaded
const aluWt = seed.windowTypes.find((t) => t.material === 'Aluminium');
aluBag.siteMeasures = [
  {
    id: 'alu-sm-1',
    measuredOn: new Date().toISOString().slice(0, 10),
    leadId: '',
    location: 'Alu lobby',
    windowTypeId: aluWt?.id ?? '',
    width: 1200,
    height: 1200,
    unit: 'mm',
    qty: 1,
    ratePerSqft: aluWt?.ratePerSqft ?? 0,
    mesh: 'No',
    tracks: 2,
    glassDoors: 2,
    meshDoors: 0,
    meshType: 'none',
    hasVent: 'No',
    ventCount: 0,
    toughened: 'No',
    measuredBy: '',
    netWidth: 1190,
    netHeight: 1190,
  },
];

let aluState = applyProjectJob(
  {
    ...seed,
    projectBags: {
      ...seed.projectBags,
      [seed.activeProjectId]: upvcBag,
    },
    activeProjectId: aluMeta.id,
  },
  aluBag,
);
aluState = {
  ...aluState,
  projects: seed.projects,
  activeProjectId: aluMeta.id,
};

assert(projectMaterial(aluState) === 'Aluminium', 'switched to Aluminium');

let threw = false;
try {
  generateUpvcFullPackage(aluState);
} catch (e) {
  threw = true;
  assert(/UPVC-only/i.test(String(e.message)), `message should say UPVC-only, got ${e.message}`);
}
assert(threw, 'Alu must reject full package');

// Alu still has individual send data shape intact (openings / cuts empty until send)
assert(Array.isArray(aluState.siteMeasures), 'alu site measures');
assert(aluState.siteMeasures[0].netWidth === 1190, 'alu net preserved');

console.log(
  JSON.stringify(
    {
      ok: true,
      upvcDefault: projectMaterial(seed),
      aluMaterial: projectMaterial(aluState),
      fullPackageBlocked: true,
      aluOpeningsSeeded: aluState.siteMeasures.length,
    },
    null,
    2,
  ),
);
