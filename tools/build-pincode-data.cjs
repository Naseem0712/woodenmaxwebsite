/**
 * build-pincode-data.cjs
 * Converts the 8 MB all-india-pincode CSV into two small JSON datasets used by
 * js/pincode-lookup.js for the enquiry-form auto-fetch feature.
 *
 *   data/pincodes.min.json  { "<pincode>": [district, region, state, [areas...]] }  (~19k keys)
 *   data/cities.min.json    [[city, pincode, region, state], ...]                   (district level)
 *
 * Run:  node tools/build-pincode-data.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'all-india-pincode-html-csv.csv');
const OUT_PIN = path.join(ROOT, 'data', 'pincodes.min.json');
const OUT_CITY = path.join(ROOT, 'data', 'cities.min.json');

function titleCase(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\b([a-z])/g, function (m, c) { return c.toUpperCase(); })
    .trim();
}
function clean(s) { return String(s == null ? '' : s).trim(); }

// Strip the postal office-type suffix (B.O / S.O / H.O / G.P.O.) so users see a
// friendly locality name, e.g. "Tejalhera B.O" -> "Tejalhera", keeping any (...) tag.
function cleanArea(name) {
  return clean(name)
    .replace(/\s+(?:G\.?P\.?O\.?|H\.?P\.?O\.?|H\.?O|S\.?O|B\.?O|E\.?D\.?S\.?O|P\.?O)\.?(\s*\([^)]*\))?\s*$/i,
      function (m, paren) { return paren ? (' ' + paren.trim()) : ''; })
    .trim();
}

// Priority for picking the "main" office of a pincode / district (lower = better).
function officeRank(name) {
  var n = name.toUpperCase();
  if (/\bG\.?P\.?O\b/.test(n)) return 0; // General Post Office
  if (/\bH\.?O\b/.test(n)) return 1;     // Head Office
  if (/\bS\.?O\b/.test(n)) return 2;     // Sub Office
  if (/\bB\.?O\b/.test(n)) return 3;     // Branch Office
  return 4;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('CSV not found:', SRC);
    process.exit(1);
  }
  var raw = fs.readFileSync(SRC, 'utf8');
  var lines = raw.split(/\r?\n/);

  var pinData = Object.create(null);   // pincode -> { region, district, state, areas: [{name, rank}] }
  var cityGroups = Object.create(null); // "district|state" -> { city, region, state, pin, bestRank }

  var skipped = 0;
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i];
    if (!line) continue;
    var c = line.split(',');
    if (c.length < 5) { skipped++; continue; }

    var office = clean(c[0]);
    var pincode = clean(c[1]);
    var region = titleCase(c[2]);
    var district = titleCase(c[3]);
    var state = titleCase(c[4]);

    if (!/^\d{6}$/.test(pincode)) { skipped++; continue; }
    if (!district || !state) { skipped++; continue; }

    var rank = officeRank(office);

    // --- pincode map: collect every area (office) under each pincode ---
    var pd = pinData[pincode];
    if (!pd) {
      pd = pinData[pincode] = { region: region, district: district, state: state, areas: [] };
    }
    // The lowest-ranked office (GPO/HO) defines the canonical district/region/state.
    if (rank < (pd._rank == null ? 99 : pd._rank)) {
      pd._rank = rank; pd.region = region; pd.district = district; pd.state = state;
    }
    var area = cleanArea(office);
    if (area) pd.areas.push({ name: area, rank: rank });

    // --- city (district) map: choose main pincode = best-ranked office's pincode ---
    var key = district + '|' + state;
    var g = cityGroups[key];
    if (!g) {
      g = cityGroups[key] = { city: district, region: region, state: state, pin: pincode, bestRank: rank };
    } else if (rank < g.bestRank) {
      g.bestRank = rank;
      g.pin = pincode;
      g.region = region;
    }
  }

  // Serialize pincode map: [district, region, state, [unique areas, main first]]
  var pinOut = Object.create(null);
  var pinKeys = Object.keys(pinData);
  var totalAreas = 0;
  for (var k = 0; k < pinKeys.length; k++) {
    var p = pinData[pinKeys[k]];
    p.areas.sort(function (a, b) { return a.rank - b.rank || (a.name < b.name ? -1 : 1); });
    var seen = Object.create(null);
    var areas = [];
    for (var a = 0; a < p.areas.length; a++) {
      var nm = p.areas[a].name;
      var key2 = nm.toLowerCase();
      if (seen[key2]) continue;
      seen[key2] = 1;
      areas.push(nm);
    }
    totalAreas += areas.length;
    pinOut[pinKeys[k]] = [p.district, p.region, p.state, areas];
  }

  // Serialize cities (sorted alphabetically for stable diffs)
  var cityOut = Object.keys(cityGroups)
    .map(function (key) { var g = cityGroups[key]; return [g.city, g.pin, g.region, g.state]; })
    .sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });

  fs.writeFileSync(OUT_PIN, JSON.stringify(pinOut), 'utf8');
  fs.writeFileSync(OUT_CITY, JSON.stringify(cityOut), 'utf8');

  function kb(file) { return (fs.statSync(file).size / 1024).toFixed(0) + ' KB'; }
  console.log('pincodes.min.json:', pinKeys.length, 'pincodes,', totalAreas, 'areas,', kb(OUT_PIN));
  console.log('cities.min.json  :', cityOut.length, 'cities,', kb(OUT_CITY));
  console.log('skipped rows     :', skipped);
}

main();
