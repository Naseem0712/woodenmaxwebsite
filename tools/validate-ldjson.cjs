const fs = require('fs');
const path = require('path');
const files = process.argv.slice(2);
let ok = true;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const re = /<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/gi;
  let m;
  let i = 0;
  while ((m = re.exec(html))) {
    i++;
    try {
      JSON.parse(m[1].trim());
    } catch (e) {
      console.error('FAIL', f, 'block', i, e.message);
      ok = false;
    }
  }
}
console.log(ok ? 'All JSON-LD blocks parse OK' : 'Some blocks failed');
process.exit(ok ? 0 : 1);
