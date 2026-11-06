const fs = require('fs');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (q && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (c === ',' && !q) {
      row.push(cur);
      cur = '';
    } else if ((c === '\n' || c === '\r') && !q) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur);
      if (row.length > 1 || row[0]) rows.push(row);
      row = [];
      cur = '';
    } else cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function check(file) {
  const rows = parseCsv(fs.readFileSync(file, 'utf8'));
  const h = rows[0];
  const idx = (k) => h.indexOf(k);
  let badSale = 0;
  let not1000 = 0;
  let badCond = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const p = r[idx('price')];
    const sp = (r[idx('sale_price')] || '').trim();
    const cond = r[idx('condition')];
    const brand = r[idx('brand')];
    if (sp && !/^\d+(\.\d+)?\s+INR$/.test(sp)) badSale++;
    if (p !== '1000.00 INR') not1000++;
    if (cond !== 'new') badCond++;
    if (i <= 2) {
      console.log(file, {
        id: r[idx('id')],
        price: p,
        sale_price: JSON.stringify(sp),
        condition: cond,
        brand,
        title: (r[idx('title')] || '').slice(0, 70)
      });
    }
  }
  console.log(file, { rows: rows.length - 1, not1000, badSale, badCond });
}

check('products-packages-feed.csv');
check('products-feed.csv');

const xml = fs.readFileSync('products-feed.xml', 'utf8');
const prices = [...xml.matchAll(/<g:price>([^<]+)<\/g:price>/g)].map((m) => m[1]);
console.log('xml', {
  entries: (xml.match(/<entry>/g) || []).length,
  uniquePrices: [...new Set(prices)],
  freeShipBlocks: (xml.match(/<g:service>Standard<\/g:service>/g) || []).length,
  salePriceTags: (xml.match(/<g:sale_price>/g) || []).length,
  bookingTitles: (xml.match(/Booking ₹1,000/g) || []).length
});
