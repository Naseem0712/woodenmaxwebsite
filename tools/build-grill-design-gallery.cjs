#!/usr/bin/env node
/**
 * Process grill design photos → images/products/aluminium-iron-grills-design/
 * Outputs gallery-manifest.json for HTML injection.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'aluminium & iron Grills Design');
const OUT = path.join(ROOT, 'images', 'products', 'aluminium-iron-grills-design');
const MANIFEST = path.join(OUT, 'gallery-manifest.json');

function slugify(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function titleFromSlug(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function categoriesFromName(lower) {
  const cats = [];
  if (lower.includes('vertical')) cats.push('vertical');
  if (lower.includes('horizontal')) cats.push('horizontal');
  if (lower.includes('round')) cats.push('round');
  if (lower.includes('balcony')) cats.push('balcony');
  if (lower.includes('staircase')) cats.push('staircase');
  if (lower.includes('premium')) cats.push('premium');
  if (!cats.length) cats.push('all');
  return cats;
}

function materialsFromName(lower) {
  if (lower.includes('round')) return 'Solid iron bars only';
  if (lower.includes('solid')) return 'Solid iron — custom sizes';
  const mats = [];
  if (lower.includes('aluminium') || lower.includes('hollow-aluminium')) mats.push('Aluminium');
  if (lower.includes('iron')) mats.push('Iron');
  if (lower.includes('brass')) mats.push('Brass');
  if (mats.length) return mats.join(', ');
  if (lower.includes('balcony')) return 'Iron or aluminium';
  if (lower.includes('vertical') || lower.includes('horizontal')) return 'Aluminium, iron, brass';
  return 'Aluminium, iron, brass';
}

function generateAlt(lower) {
  let alt;
  if (lower.includes('round')) {
    alt = 'Round bar window grill design in solid iron only - 100% safety with long life';
  } else if (lower.includes('solid')) {
    alt = 'Solid iron bar grill design - any custom design possible, maximum strength';
  } else if (lower.includes('vertical')) {
    alt = 'Vertical window grill design, available in aluminium, iron and brass - strong safety for homes';
  } else if (lower.includes('horizontal')) {
    alt = 'Horizontal window grill design, available in aluminium, iron and brass - strong safety for homes';
  } else if (lower.includes('balcony')) {
    alt = 'Balcony safety grill design - strong window and railing protection for homes';
  } else if (lower.includes('staircase')) {
    alt = 'Staircase railing grill design - durable safety bars for indoor and outdoor stairs';
  } else {
    alt = 'Window grill design for home safety - aluminium, iron and brass options';
  }

  if (lower.includes('premium') && !alt.includes('premium')) {
    alt = alt.replace('grill design', 'premium luxury finish grill design');
  }
  if (lower.includes('balcony') && !alt.toLowerCase().includes('balcony')) {
    alt = alt.replace('grill design', 'balcony safety grill design');
  }
  if (lower.includes('staircase') && !alt.toLowerCase().includes('staircase')) {
    alt = alt.replace('grill design', 'staircase railing grill design');
  }

  if (alt.length > 125) alt = alt.slice(0, 122) + '...';
  return alt;
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Source folder not found:', SRC);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const files = fs.readdirSync(SRC).filter((f) => /\.(webp|jpe?g|png)$/i.test(f));
  const items = [];

  for (const file of files) {
    const lower = file.toLowerCase();
    const slug = slugify(file);
    const outFile = `${slug}.webp`;
    const outPath = path.join(OUT, outFile);
    const srcPath = path.join(SRC, file);

    await sharp(srcPath)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toFile(outPath);

    const meta = await sharp(outPath).metadata();
    items.push({
      slug,
      file: outFile,
      src: `../../images/products/aluminium-iron-grills-design/${outFile}`,
      url: `https://woodenmax.in/images/products/aluminium-iron-grills-design/${outFile}`,
      name: titleFromSlug(slug),
      alt: generateAlt(lower),
      materials: materialsFromName(lower),
      categories: categoriesFromName(lower),
      width: meta.width,
      height: meta.height,
    });
    console.log('  ✓', outFile, `(${meta.width}×${meta.height})`);
  }

  items.sort((a, b) => a.slug.localeCompare(b.slug));
  fs.writeFileSync(MANIFEST, JSON.stringify(items, null, 2), 'utf8');
  console.log(`\n${items.length} images → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
