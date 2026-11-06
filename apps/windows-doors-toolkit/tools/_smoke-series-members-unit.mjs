/**
 * Unit smoke: 2 / 2.5 / 3-track matching (mirrors calcs.slidingMemberCount).
 * Run: node tools/_smoke-series-members-unit.mjs
 */
function slidingMemberCount(memberClass, job, seriesMembers) {
  const meshDoors = job.meshDoors ?? (job.mesh === 'Yes' ? 1 : 0);
  const tracks = Number(job.tracks) || 0;
  const use2Track = tracks > 0 && tracks < 2.45;
  const use25Track = tracks >= 2.45 && tracks < 2.75;
  const use3Track = tracks >= 2.75 && tracks < 4;
  const has25Member = seriesMembers?.some((m) => m.memberClass === '2.5-track') ?? false;
  switch (memberClass) {
    case '2-track':
      return use2Track ? 1 : 0;
    case '2.5-track':
      return use25Track ? 1 : 0;
    case '3-track':
      if (use3Track) return 1;
      if (use25Track && !has25Member) return 1;
      return 0;
    case 'Shutter':
      return job.glassShutters;
    case 'Meeting':
      return Math.max(0, job.glassShutters - 1);
    case 'Mesh':
      return Math.max(0, meshDoors);
    default:
      return 1;
  }
}

const membersWith25 = [
  { memberClass: '2-track' },
  { memberClass: '2.5-track' },
  { memberClass: '3-track' },
  { memberClass: 'Shutter' },
  { memberClass: 'Mesh' },
];
const membersLegacy = [{ memberClass: '2-track' }, { memberClass: '3-track' }];

const cases = [
  ['2t@2', slidingMemberCount('2-track', { tracks: 2, glassShutters: 2, mesh: 'No', meshDoors: 0 }, membersWith25), 1],
  ['25@2', slidingMemberCount('2.5-track', { tracks: 2, glassShutters: 2, mesh: 'No', meshDoors: 0 }, membersWith25), 0],
  ['25@2.5', slidingMemberCount('2.5-track', { tracks: 2.5, glassShutters: 2, mesh: 'Yes', meshDoors: 1 }, membersWith25), 1],
  ['3@2.5-with25', slidingMemberCount('3-track', { tracks: 2.5, glassShutters: 2, mesh: 'Yes', meshDoors: 1 }, membersWith25), 0],
  ['3@2.5-legacy', slidingMemberCount('3-track', { tracks: 2.5, glassShutters: 2, mesh: 'Yes', meshDoors: 1 }, membersLegacy), 1],
  ['3@3', slidingMemberCount('3-track', { tracks: 3, glassShutters: 2, mesh: 'Yes', meshDoors: 1 }, membersWith25), 1],
  ['mesh@1', slidingMemberCount('Mesh', { tracks: 2.5, glassShutters: 2, mesh: 'Yes', meshDoors: 1 }, membersWith25), 1],
  ['shutter@4', slidingMemberCount('Shutter', { tracks: 2, glassShutters: 4, mesh: 'No', meshDoors: 0 }, membersWith25), 4],
];

let fail = 0;
for (const [name, got, want] of cases) {
  if (got !== want) {
    console.error(`FAIL ${name}: got ${got} want ${want}`);
    fail++;
  } else {
    console.log(`ok ${name}=${got}`);
  }
}

process.exit(fail ? 1 : 0);
