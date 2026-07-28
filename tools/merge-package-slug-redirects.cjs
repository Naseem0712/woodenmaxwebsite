/**
 * Merge tools/_package-slug-redirects.txt into _redirects between markers.
 * Never touches other redirect rules. Safe to re-run.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const redirectsPath = path.join(ROOT, '_redirects');
const snippetPath = path.join(ROOT, 'tools', '_package-slug-redirects.txt');

const START = '# BEGIN package-slug-landing redirects (auto)';
const END = '# END package-slug-landing redirects (auto)';

if (!fs.existsSync(snippetPath)) {
  console.error('Missing', snippetPath, '— run generate-package-merchant-feed.cjs first');
  process.exit(1);
}

const snippetBody = fs
  .readFileSync(snippetPath, 'utf8')
  .split(/\r?\n/)
  .filter((l) => l && !l.startsWith('#'))
  .join('\n');

let text = fs.readFileSync(redirectsPath, 'utf8');
const block = START + '\n' + snippetBody + (snippetBody ? '\n' : '') + END;

if (text.includes(START) && text.includes(END)) {
  text = text.replace(new RegExp(START + '[\\s\\S]*?' + END), block);
} else {
  if (!text.endsWith('\n')) text += '\n';
  text += '\n' + block + '\n';
}

fs.writeFileSync(redirectsPath, text, 'utf8');
console.log('Updated _redirects package-slug block (', snippetBody.split('\n').filter(Boolean).length, 'rules)');
