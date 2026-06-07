/**
 * Remove dead legacy chrome from HTML (navbar, mobile menu, old footer, trust lines).
 * Also drops duplicate gallery assets — site-footer.js loads them globally.
 *
 * Run: node tools/purge-legacy-chrome.cjs
 *      node tools/purge-legacy-chrome.cjs --dry
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const SKIP = new Set(['calculator-design-preview.html', '_grills-source/index.html']);

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

function removeBalancedTag (html, startIdx, tagName) {
  var openRe = new RegExp('<' + tagName + '\\b', 'gi');
  var closeRe = new RegExp('</' + tagName + '>', 'gi');
  var depth = 0;
  var pos = startIdx;
  var slice = html.slice(startIdx);
  openRe.lastIndex = 0;
  closeRe.lastIndex = 0;

  var tokens = [];
  var re = new RegExp('<(/?)' + tagName + '\\b[^>]*>', 'gi');
  var m;
  while ((m = re.exec(slice)) !== null) {
    tokens.push({ idx: m.index, close: m[1] === '/' });
  }
  if (!tokens.length) return html;

  depth = 0;
  for (var i = 0; i < tokens.length; i++) {
    if (!tokens[i].close) depth++;
    else depth--;
    if (depth === 0) {
      var end = startIdx + tokens[i].idx + slice.slice(tokens[i].idx).match(new RegExp('</' + tagName + '>', 'i'))[0].length;
      return html.slice(0, startIdx) + html.slice(end);
    }
  }
  return html;
}

function removeByOpenMatch (html, openRe, tagName) {
  var m = html.match(openRe);
  if (!m) return html;
  return removeBalancedTag(html, m.index, tagName);
}

function purgeHtml (html) {
  var out = html;
  var n = 0;

  while (/<nav\s+class="navbar\b/i.test(out)) {
    out = removeByOpenMatch(out, /<nav\s+class="navbar\b[^>]*>/i, 'nav');
    n++;
  }

  while (/<div\s+class="mobile-menu\b/i.test(out)) {
    out = removeByOpenMatch(out, /<div\s+class="mobile-menu\b[^>]*>/i, 'div');
    n++;
  }

  out = out.replace(/\s*<p class="cluster-final-trust">[\s\S]*?<\/p>\s*/gi, function () { n++; return '\n'; });

  out = out.replace(/<footer>(?![\s\S]*wm-footer)[\s\S]*?<\/footer>\s*/gi, function () { n++; return ''; });

  out = out.replace(/\s*<script[^>]+src="[^"]*product-image-gallery\.js[^"]*"[^>]*>\s*<\/script>\s*/gi, function () { n++; return ''; });
  out = out.replace(/\s*<link[^>]+href="[^"]*product-image-gallery\.css[^"]*"[^>]*>\s*/gi, function () { n++; return ''; });
  out = out.replace(/\s*<noscript>\s*<link[^>]+product-image-gallery\.css[^>]*>\s*<\/noscript>\s*/gi, function () { n++; return ''; });

  out = out.replace(/\n{4,}/g, '\n\n\n');
  return { html: out, n };
}

function main () {
  var files = listHtml(ROOT);
  var touched = 0;
  var total = 0;

  files.forEach(function (f) {
    var rel = path.relative(ROOT, f).split(path.sep).join('/');
    if (SKIP.has(rel)) return;

    var raw = fs.readFileSync(f, 'utf8');
    var r = purgeHtml(raw);
    if (r.html !== raw) {
      touched++;
      total += r.n;
      if (!DRY) fs.writeFileSync(f, r.html, 'utf8');
      console.log((DRY ? '[dry] ' : '') + rel + ' (-' + r.n + ' blocks/refs)');
    }
  });

  console.log('\n=== SUMMARY ===');
  console.log('Files cleaned: ' + touched);
  console.log('Removals: ' + total);
}

main();
