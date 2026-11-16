/**
 * Smoke: fabricator cut piece counts for 2-track / 3-track sample.
 * Run: node tools/_smoke-fabricator-bom.mjs
 */

function glassShutterWidthMm(W, n) {
  if (n === 2 || n === 4) return W / 2;
  return W / Math.max(1, n);
}

/** Simplified piece plan mirroring fabricatorBom sliding rules. */
function plan(job) {
  const { W, H, tracks, glassShutters, meshDoors, meshType } = job;
  const shutterW = glassShutterWidthMm(W, glassShutters);
  const rails = tracks >= 2.75 ? 3 : tracks >= 2.45 ? 3 : 2;
  const lines = [];

  // Outer: T B L R
  lines.push({ name: 'outer top', pieces: 1, cut: W });
  lines.push({ name: 'outer bottom', pieces: 1, cut: W });
  lines.push({ name: 'outer left', pieces: 1, cut: H });
  lines.push({ name: 'outer right', pieces: 1, cut: H });
  lines.push({ name: 'bottom rails', pieces: rails, cut: W });

  // Per glass shutter: handle + center + top + bottom
  lines.push({ name: 'handle-side', pieces: glassShutters, cut: H });
  lines.push({ name: 'center', pieces: glassShutters, cut: H });
  lines.push({ name: 'shutter top', pieces: glassShutters, cut: shutterW });
  lines.push({ name: 'shutter bottom', pieces: glassShutters, cut: shutterW });

  if (glassShutters >= 4) {
    lines.push({ name: 'extra meeting', pieces: 1, cut: H });
  }

  // Slim interlock = glassShutters - 1
  const interlocks = Math.max(0, glassShutters - 1);
  if (interlocks > 0) {
    lines.push({ name: 'interlock', pieces: interlocks + (glassShutters > 2 ? glassShutters - 2 : 0), cut: H });
  }

  if (meshDoors > 0) {
    const mw = meshType === 'sliding' ? W / 2 : meshType === 'rolling' ? W : W / 2;
    const mh = H;
    lines.push({ name: 'mesh V', pieces: 2 * meshDoors, cut: mh });
    lines.push({ name: 'mesh H', pieces: 2 * meshDoors, cut: mw });
  }

  // Hardware
  const hw = {
    wheels: 2 * glassShutters,
    connectors: 4 * glassShutters,
    lock: 1,
    brushM: 2 * ((2 * shutterW + 2 * H) / 1000) * glassShutters,
  };

  return { lines, hw, shutterW, rails };
}

const twoTrack = plan({ W: 1500, H: 1200, tracks: 2, glassShutters: 2, meshDoors: 0, meshType: 'none' });
const threeTrack = plan({ W: 1800, H: 1500, tracks: 3, glassShutters: 2, meshDoors: 1, meshType: 'sliding' });
const fourGlass = plan({ W: 2400, H: 1500, tracks: 2, glassShutters: 4, meshDoors: 0, meshType: 'none' });

const cases = [
  ['2t-rails', twoTrack.rails, 2],
  ['2t-shutterW', twoTrack.shutterW, 750],
  ['2t-wheels', twoTrack.hw.wheels, 4],
  ['2t-connectors', twoTrack.hw.connectors, 8],
  ['2t-handle', twoTrack.lines.find((l) => l.name === 'handle-side').pieces, 2],
  ['3t-rails', threeTrack.rails, 3],
  ['3t-meshV', threeTrack.lines.find((l) => l.name === 'mesh V').pieces, 2],
  ['3t-meshH-cut', threeTrack.lines.find((l) => l.name === 'mesh H').cut, 900],
  ['4g-meeting', fourGlass.lines.some((l) => l.name === 'extra meeting'), true],
  ['4g-shutterW', fourGlass.shutterW, 1200],
];

let fail = 0;
for (const [name, got, want] of cases) {
  if (got !== want) {
    console.error(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
    fail++;
  } else {
    console.log(`ok ${name}=${JSON.stringify(got)}`);
  }
}

process.exit(fail ? 1 : 0);
