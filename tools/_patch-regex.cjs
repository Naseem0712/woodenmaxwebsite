const fs = require("fs");
const p = "d:/Downloads/woodenmax-live/tools/optimize-speed.cjs";
let c = fs.readFileSync(p, "utf8");
const from = "    /<link([^>]+rel=([\"'])preload\\2([^>]+as=([\"'])image\\4[^>]*)>/gi,";
const to = "    /<link[^>]*\\brel=([\"'])preload\\1[^>]*\\bas=\\1image\\1[^>]*>/gi,";
if (!c.includes(from)) { console.error("not found"); process.exit(1); }
c = c.replace(from, to);
fs.writeFileSync(p, c);
console.log("patched");
