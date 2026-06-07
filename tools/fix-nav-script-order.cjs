/**
 * Move nav-tree.js script tag before site-nav.js on every HTML page.
 * Run: node tools/fix-nav-script-order.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function listHtml (dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'tools', 'mcps', 'agent-transcripts', 'terminals', '_grills-source'].includes(e.name)) continue;
      listHtml(p, out);
    } else if (e.isFile() && e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function fixFile (htmlAbs) {
  let html = fs.readFileSync(htmlAbs, 'utf8');
  if (!html.includes('nav-tree.js') || !html.includes('site-nav.js')) return false;

  html = html.replace(/\s*<script[^>]+src="[^"]*nav-tree\.js"[^>]*>\s*<\/script>\s*/gi, '');

  var navTagMatch = html.match(/<script[^>]+src="[^"]*site-nav\.js"[^>]*>\s*<\/script>/i);
  if (!navTagMatch) return false;

  var prefixMatch = navTagMatch[0].match(/src="([^"]*)site-nav\.js"/i);
  var prefix = prefixMatch ? prefixMatch[1] : '';
  var treeTag = '<script src="' + prefix + 'nav-tree.js" defer></script>\n  ';

  if (html.indexOf(treeTag.trim()) >= 0 && html.indexOf(treeTag.trim()) < html.indexOf(navTagMatch[0])) return false;

  html = html.replace(navTagMatch[0], treeTag + navTagMatch[0]);
  fs.writeFileSync(htmlAbs, html, 'utf8');
  return true;
}

var n = 0;
listHtml(ROOT).forEach(function (f) {
  if (fixFile(f)) n++;
});
console.log('Reordered nav-tree before site-nav on', n, 'pages');
