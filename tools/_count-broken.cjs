const fs = require("fs");
const path = require("path");
function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory() && !["node_modules", ".git"].includes(e.name)) walk(p, a);
    else if (e.name.endsWith(".html")) a.push(p);
  }
  return a;
}
let n = 0;
for (const f of walk("d:/Downloads/woodenmax-live")) {
  const t = fs.readFileSync(f, "utf8");
  if (t.includes("<noscript><link rel=\"preload\"")) n++;
}
console.log("broken_noscript_files", n);
