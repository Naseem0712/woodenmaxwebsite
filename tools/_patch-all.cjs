const fs = require("fs");
const p = "d:/Downloads/woodenmax-live/tools/optimize-speed.cjs";
let c = fs.readFileSync(p, "utf8");
c = c.replace(
  /<link(\s+)rel=(["'])stylesheet\2(\s+)href=/gi,
  "<link$1\\brel=$2stylesheet$2$3href="
);
c = c.replace(
  "      return full.replace(/>$/, ' fetchpriority=\"high\">');",
  "      return full.replace(/<link/i, '<link fetchpriority=\"high\"');"
);
fs.writeFileSync(p, c);
console.log("ok");
