/**
 * Add .html to contact page links so static dev servers (e.g. Live Server) resolve
 * contact.html. Production Apache still 301s /contact.html → /contact (query kept).
 * Run: node tools/fix-contact-hrefs.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
// Note: / inside RegExp string — regex literal would break on ../ slashes
const re = new RegExp('href="((?:\\.\\./)*)contact(?!\\.html)((?:\\?|#)[^"]*)?"', "g");

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith(".") && name.name !== ".") continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules") continue;
      walk(p);
    } else if (name.name.endsWith(".html")) {
      let s = fs.readFileSync(p, "utf8");
      const n = s.replace(re, 'href="$1contact.html$2"');
      if (n !== s) {
        fs.writeFileSync(p, n, "utf8");
        console.log("Updated", path.relative(root, p));
      }
    }
  }
}

walk(root);
console.log("Done.");
