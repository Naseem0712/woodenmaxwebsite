/**
 * Smoke: Alu ↔ UPVC never mix on profiles / members / fabricator sizing.
 * Run: node tools/_smoke-material-isolation.mjs
 */

function filterProfiles(profiles, material) {
  return profiles.filter((p) => p.material === material);
}

function isUpvcOnlyMemberClass(memberClass) {
  const c = (memberClass || '').toLowerCase();
  return c.startsWith('upvc') || c === 'upvc only';
}

function filterMembersForMaterial(members, material) {
  if (material === 'UPVC') return members;
  return members.filter((m) => !isUpvcOnlyMemberClass(m.memberClass));
}

function glassShutterWidthMm(windowWidthMm, glassShutters) {
  const n = Math.max(1, Number(glassShutters) || 1);
  if (n === 2 || n === 4) return windowWidthMm / 2;
  return windowWidthMm / n;
}

function defaultRailCount(memberClass) {
  if (memberClass === '2-track') return 2;
  if (memberClass === '2.5-track' || memberClass === '3-track') return 3;
  return 0;
}

function pickWheelByWeight(hardware, requiredKg) {
  const wheels = hardware.filter(
    (h) =>
      (h.category || '').toLowerCase().includes('roller') &&
      (h.weightCapacityKg ?? 0) > 0,
  );
  if (!wheels.length) return undefined;
  const sorted = [...wheels].sort(
    (a, b) => (a.weightCapacityKg ?? 0) - (b.weightCapacityKg ?? 0),
  );
  return sorted.find((w) => (w.weightCapacityKg ?? 0) >= requiredKg) ?? sorted[sorted.length - 1];
}

const profiles = [
  { id: 'u1', name: 'Series A sash', material: 'UPVC' },
  { id: 'u2', name: 'Steel reinforcement', material: 'UPVC' },
  { id: 'a1', name: 'Aluminium shutter', material: 'Aluminium' },
  { id: 'a2', name: 'Aluminium top track', material: 'Aluminium' },
];

const members = [
  { memberClass: '2-track' },
  { memberClass: 'Shutter' },
  { memberClass: 'UPVC only' },
  { memberClass: 'UPVC shutter' },
  { memberClass: 'Mesh' },
];

const hardware = [
  { name: 'Sliding roller 40 kg', category: 'Rollers', weightCapacityKg: 40 },
  { name: 'Sliding roller 60 kg', category: 'Rollers', weightCapacityKg: 60 },
  { name: 'Sliding roller 80 kg', category: 'Rollers', weightCapacityKg: 80 },
];

const cases = [
  ['alu-profiles-only', filterProfiles(profiles, 'Aluminium').every((p) => p.material === 'Aluminium'), true],
  ['alu-profiles-count', filterProfiles(profiles, 'Aluminium').length, 2],
  ['upvc-profiles-count', filterProfiles(profiles, 'UPVC').length, 2],
  ['alu-members-no-upvc-only', filterMembersForMaterial(members, 'Aluminium').some((m) => isUpvcOnlyMemberClass(m.memberClass)), false],
  ['alu-members-count', filterMembersForMaterial(members, 'Aluminium').length, 3],
  ['shutter-w-2', glassShutterWidthMm(1800, 2), 900],
  ['shutter-w-4', glassShutterWidthMm(1800, 4), 900],
  ['rails-2', defaultRailCount('2-track'), 2],
  ['rails-3', defaultRailCount('3-track'), 3],
  ['wheel-55kg', pickWheelByWeight(hardware, 55)?.weightCapacityKg, 60],
  ['wheel-90kg', pickWheelByWeight(hardware, 90)?.weightCapacityKg, 80],
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
