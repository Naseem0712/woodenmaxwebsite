/**
 * build-pincode-data.cjs
 * Converts the 8 MB all-india-pincode CSV into two small JSON datasets used by
 * js/pincode-lookup.js for the enquiry-form auto-fetch feature.
 *
 *   data/pincodes.min.json  { "<pincode>": [office, region, district, state] }   (~19k keys)
 *   data/cities.min.json    [[city, pincode, region, state], ...]                 (district level)
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

  var pinBest = Object.create(null);   // pincode -> { office, region, district, state, rank }
  var cityGroups = Object.create(null); // "district|state" -> { city, region, state, pinByRank, bestRank }

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

    // --- pincode map: keep the best-ranked office per pincode ---
    var prev = pinBest[pincode];
    if (!prev || rank < prev.rank) {
      pinBest[pincode] = { office: office, region: region, district: district, state: state, rank: rank };
    }

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

  // Serialize pincode map
  var pinOut = Object.create(null);
  var pinKeys = Object.keys(pinBest);
  for (var k = 0; k < pinKeys.length; k++) {
    var p = pinBest[pinKeys[k]];
    pinOut[pinKeys[k]] = [p.office, p.region, p.district, p.state];
  }

  // Serialize cities (sorted alphabetically for stable diffs)
  var cityOut = Object.keys(cityGroups)
    .map(function (key) { var g = cityGroups[key]; return [g.city, g.pin, g.region, g.state]; })
    .sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });

  fs.writeFileSync(OUT_PIN, JSON.stringify(pinOut), 'utf8');
  fs.writeFileSync(OUT_CITY, JSON.stringify(cityOut), 'utf8');

  function kb(file) { return (fs.statSync(file).size / 1024).toFixed(0) + ' KB'; }
  console.log('pincodes.min.json:', pinKeys.length, 'pincodes,', kb(OUT_PIN));
  console.log('cities.min.json  :', cityOut.length, 'cities,', kb(OUT_CITY));
  console.log('skipped rows     :', skipped);
}

main();
