const fs = require("fs");
const path = require("path");
const p = "d:/Downloads/woodenmax-live/tools/optimize-speed.cjs";
let c = fs.readFileSync(p, "utf8");
c = c.replace(
  /<link(\s+)\\brel=(["'])stylesheet\2(\s+)href=/gi,
  "<link$1rel=$2stylesheet$2$3href="
);
fs.writeFileSync(p, c);
function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const fp = path.join(d, e.name);
    if (e.isDirectory() && !["node_modules", ".git"].includes(e.name)) walk(fp, a);
    else if (e.name.endsWith(".html")) a.push(fp);
  }
  return a;
}
let n = 0;
for (const f of walk("d:/Downloads/woodenmax-live")) {
  let t = fs.readFileSync(f, "utf8");
  if (t.includes("\x08rel")) {
    t = t.replace(/\x08rel=/g, "rel=");
    fs.writeFileSync(f, t);
    n++;
  }
}
console.log("fixed_html", n, "script_patched");
