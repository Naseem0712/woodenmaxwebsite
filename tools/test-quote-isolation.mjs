/**
 * Product data isolation harness for js/quote-store.js.
 *
 *   npm run test:quote
 *
 * The bug this guards against: adding a Sliding Window and then a Pergola used
 * to leave the two items sharing nested objects, so editing one changed the
 * other. Every scenario below ends with a full cross-item field comparison that
 * fails if any value from one item appears in another.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const store = require('../js/quote-store.js');

// ---------- fixtures ----------

const PRODUCTS = [
  { key: 'sliding-window', name: '3 Track Sliding Window', category: 'Aluminium Windows', page: '/products/aluminium-windows/3-track-sliding-window' },
  { key: 'casement-window', name: 'Casement Window', category: 'Aluminium Windows', page: '/products/aluminium-windows/aluminium-casement-window-price' },
  { key: 'pergola', name: 'Aluminium Pergola', category: 'Pergolas', page: '/products/pergola/aluminium-pergola' },
  { key: 'glass-railing', name: 'Balcony Glass Railing', category: 'Glass Railing', page: '/products/glass-railing/balcony-glass-railing' },
  { key: 'shower', name: 'Frameless Shower Partition', category: 'Shower Partitions', page: '/products/shower-partitions/frameless-shower-partition' },
  { key: 'mirror', name: 'LED Mirror', category: 'Mirrors', page: '/products/mirrors/led-mirror' },
  { key: 'grill', name: 'Window Safety Grill', category: 'Grills', page: '/products/grills/window-safety-grills' },
  { key: 'louver', name: 'Wooden Finish Louvers', category: 'Metal Louvers', page: '/products/metal-louvers/wooden-finish-aluminium-louvers' },
];

const GLASS = ['6mm Clear', '8mm Toughened', '12mm Toughened', 'DGU 6-12-6'];
const COLOURS = ['Matte Black', 'Champagne Gold', 'Anodised Silver', 'Wood Finish'];
const HARDWARE = ['Standard', 'Premium Imported', 'Hafele'];

/** Deterministic pseudo-random so a failing run can be reproduced. */
function rng (seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function makeItem (product, n, rand) {
  const width = 900 + Math.floor(rand() * 4000);
  const height = 900 + Math.floor(rand() * 2500);
  const qty = 1 + Math.floor(rand() * 6);
  const rate = 400 + Math.floor(rand() * 1800);
  const areaSqft = ((width / 304.8) * (height / 304.8) * qty);
  const amount = Math.round(areaSqft * rate);

  return {
    productKey: product.key,
    productName: product.name + ' #' + n,
    category: product.category,
    pageUrl: 'https://woodenmax.in' + product.page,
    area: `${width} × ${height} mm (${areaSqft.toFixed(2)} sq.ft)`,
    exactAmount: amount,
    amount: '₹' + amount.toLocaleString('en-IN'),
    specs: [`Glass: ${GLASS[n % GLASS.length]}`, `Colour: ${COLOURS[n % COLOURS.length]}`],
    details: [
      { label: 'Product', value: product.name },
      { label: 'Width', value: String(width) },
      { label: 'Height', value: String(height) },
      { label: 'Quantity', value: String(qty) },
      { label: 'Glass', value: GLASS[n % GLASS.length] },
      { label: 'Colour', value: COLOURS[n % COLOURS.length] },
      { label: 'Hardware', value: HARDWARE[n % HARDWARE.length] },
      { label: 'Rate', value: '₹' + rate + ' / sq.ft' },
    ],
    // Deliberately deep, because the old shallow copy shared exactly this.
    config: {
      dims: { width, height, qty },
      opts: { glass: GLASS[n % GLASS.length], colour: COLOURS[n % COLOURS.length], hardware: HARDWARE[n % HARDWARE.length] },
      pricing: { rate, areaSqft, amount, breakup: [{ head: 'Profile', value: Math.round(amount * 0.55) }, { head: 'Glass', value: Math.round(amount * 0.3) }] },
    },
  };
}

/**
 * The core assertion: no field of any item may equal the corresponding field of
 * a different item unless the inputs genuinely were identical.
 */
function assertNoCrossContamination (saved, expected, label) {
  assert.equal(saved.length, expected.length, `${label}: item count`);

  saved.forEach((item, i) => {
    const want = expected[i];
    assert.equal(item.productName, want.productName, `${label}: item ${i} productName`);
    assert.equal(item.area, want.area, `${label}: item ${i} area`);
    assert.equal(item.exactAmount, want.exactAmount, `${label}: item ${i} amount`);
    assert.deepEqual(item.config.dims, want.config.dims, `${label}: item ${i} dims`);
    assert.deepEqual(item.config.opts, want.config.opts, `${label}: item ${i} options`);
    assert.deepEqual(item.config.pricing, want.config.pricing, `${label}: item ${i} pricing`);
    assert.deepEqual(item.details, want.details, `${label}: item ${i} details`);
  });

  const ids = saved.map((i) => i.itemId);
  assert.equal(new Set(ids).size, ids.length, `${label}: itemIds must be unique`);
  ids.forEach((id) => assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, `${label}: itemId must be a UUID`));

  // No two distinct items may share an object identity anywhere in their trees.
  for (let a = 0; a < saved.length; a++) {
    for (let b = a + 1; b < saved.length; b++) {
      assert.notEqual(saved[a].config, saved[b].config, `${label}: items ${a}/${b} share a config object`);
      assert.notEqual(saved[a].details, saved[b].details, `${label}: items ${a}/${b} share a details array`);
    }
  }
}

function reset () {
  store.__useMemoryBackend();
}

// ---------- generated multi-product scenarios ----------

const COMBOS = [];
for (let i = 0; i < PRODUCTS.length; i++) {
  for (let j = 0; j < PRODUCTS.length; j++) {
    if (i === j) continue;
    COMBOS.push([PRODUCTS[i], PRODUCTS[j]]);
  }
}

test('every two-product combination stays isolated (56 scenarios)', () => {
  COMBOS.forEach((combo, idx) => {
    reset();
    const rand = rng(1000 + idx);
    const inputs = combo.map((p, n) => makeItem(p, n + 1, rand));
    inputs.forEach((it) => store.add(it));
    assertNoCrossContamination(store.list(), inputs, `${combo[0].key}+${combo[1].key}`);
  });
  assert.ok(COMBOS.length >= 50, 'expected at least 50 generated combinations');
});

test('the full eight-product catalogue in one estimate stays isolated', () => {
  reset();
  const rand = rng(7);
  const inputs = PRODUCTS.map((p, n) => makeItem(p, n + 1, rand));
  inputs.forEach((it) => store.add(it));
  assertNoCrossContamination(store.list(), inputs, 'all-products');
});

test('editing one item leaves every other item untouched', () => {
  reset();
  const rand = rng(11);
  const inputs = PRODUCTS.map((p, n) => makeItem(p, n + 1, rand));
  const saved = inputs.map((it) => store.add(it));

  const target = saved[3];
  store.update(target.itemId, {
    exactAmount: 999999,
    area: 'EDITED 1000 × 1000 mm',
    config: { dims: { width: 1000, height: 1000, qty: 99 }, opts: { glass: 'EDITED' }, pricing: { rate: 1, areaSqft: 1, amount: 999999, breakup: [] } },
  });

  const after = store.list();
  assert.equal(after[3].exactAmount, 999999, 'the edited item must change');
  assert.equal(after[3].config.dims.qty, 99);

  after.forEach((item, i) => {
    if (i === 3) return;
    assert.equal(item.exactAmount, inputs[i].exactAmount, `item ${i} amount changed after editing item 3`);
    assert.deepEqual(item.config, inputs[i].config, `item ${i} config changed after editing item 3`);
    assert.notEqual(item.area, 'EDITED 1000 × 1000 mm');
  });
});

test('removing an item leaves the rest identical', () => {
  reset();
  const rand = rng(13);
  const inputs = PRODUCTS.map((p, n) => makeItem(p, n + 1, rand));
  const saved = inputs.map((it) => store.add(it));

  store.remove(saved[0].itemId);
  store.remove(saved[5].itemId);

  const remaining = store.list();
  const expected = inputs.filter((_, i) => i !== 0 && i !== 5);
  assertNoCrossContamination(remaining, expected, 'after-removal');
});

test('the same product added twice with different sizes keeps two distinct rows', () => {
  reset();
  const rand = rng(17);
  const a = makeItem(PRODUCTS[0], 1, rand);
  const b = makeItem(PRODUCTS[0], 2, rand);
  store.add(a);
  store.add(b);

  const saved = store.list();
  assert.equal(saved.length, 2);
  assert.notEqual(saved[0].itemId, saved[1].itemId);
  assert.notDeepEqual(saved[0].config.dims, saved[1].config.dims);
  assertNoCrossContamination(saved, [a, b], 'same-product-twice');
});

test('mutating the object passed in cannot reach into the store', () => {
  reset();
  const rand = rng(19);
  const input = makeItem(PRODUCTS[2], 1, rand);
  const originalWidth = input.config.dims.width;
  store.add(input);

  input.config.dims.width = 99999;
  input.details[1].value = 'HACKED';
  input.exactAmount = -1;

  const saved = store.list()[0];
  assert.equal(saved.config.dims.width, originalWidth, 'store must not alias the caller object');
  assert.notEqual(saved.details[1].value, 'HACKED');
  assert.notEqual(saved.exactAmount, -1);
});

test('mutating the object read out cannot reach into the store', () => {
  reset();
  const rand = rng(23);
  store.add(makeItem(PRODUCTS[1], 1, rand));
  store.add(makeItem(PRODUCTS[4], 2, rand));

  const first = store.list();
  first[0].config.opts.glass = 'HACKED';
  first[0].details.push({ label: 'Injected', value: 'yes' });
  first[1].exactAmount = 0;

  const second = store.list();
  assert.notEqual(second[0].config.opts.glass, 'HACKED');
  assert.equal(second[0].details.some((d) => d.label === 'Injected'), false);
  assert.notEqual(second[1].exactAmount, 0);
});

test('the internal copies are deep-frozen', () => {
  reset();
  const rand = rng(29);
  store.add(makeItem(PRODUCTS[0], 1, rand));
  const frozen = store.listFrozen()[0];
  assert.ok(Object.isFrozen(frozen), 'item must be frozen');
  assert.ok(Object.isFrozen(frozen.config), 'nested config must be frozen');
  assert.ok(Object.isFrozen(frozen.config.dims), 'deeply nested object must be frozen');
});

test('quantity changes on one line do not move another line', () => {
  reset();
  const rand = rng(31);
  const inputs = [PRODUCTS[0], PRODUCTS[2], PRODUCTS[3]].map((p, n) => makeItem(p, n + 1, rand));
  const saved = inputs.map((it) => store.add(it));

  for (let round = 1; round <= 10; round++) {
    const idx = round % saved.length;
    const current = store.get(saved[idx].itemId);
    store.update(current.itemId, {
      details: current.details.map((d) => (d.label === 'Quantity' ? { label: 'Quantity', value: String(round) } : d)),
    });
  }

  const after = store.list();
  assert.equal(after.length, 3);
  after.forEach((item, i) => {
    assert.equal(item.config.dims.width, inputs[i].config.dims.width, `item ${i} width drifted`);
    assert.equal(item.exactAmount, inputs[i].exactAmount, `item ${i} amount drifted`);
  });
});

test('upsert merges a matching line instead of recreating it', () => {
  reset();
  const rand = rng(37);
  const grill = makeItem(PRODUCTS[6], 1, rand);
  const other = makeItem(PRODUCTS[0], 2, rand);
  const savedGrill = store.add(grill);
  store.add(other);

  const merged = store.upsert(
    { ...grill, exactAmount: grill.exactAmount * 2 },
    (existing) => existing.productKey === 'grill',
    (existing, incoming) => ({ ...existing, exactAmount: existing.exactAmount + incoming.exactAmount })
  );

  assert.equal(store.count(), 2, 'merge must not add a row');
  assert.equal(merged.itemId, savedGrill.itemId, 'merged row must keep its itemId');
  assert.equal(merged.exactAmount, grill.exactAmount * 3);
  assert.equal(store.list()[1].exactAmount, other.exactAmount, 'the unrelated row must not move');
});

test('removeWhere only drops the rows it matches', () => {
  reset();
  const rand = rng(41);
  const inputs = PRODUCTS.map((p, n) => makeItem(p, n + 1, rand));
  inputs.forEach((it) => store.add(it));

  const dropped = store.removeWhere((it) => it.category === 'Aluminium Windows');
  assert.equal(dropped, 2);
  const remaining = store.list();
  assert.equal(remaining.length, PRODUCTS.length - 2);
  assert.equal(remaining.some((it) => it.category === 'Aluminium Windows'), false);
  assertNoCrossContamination(remaining, inputs.filter((it) => it.category !== 'Aluminium Windows'), 'after-removeWhere');
});

test('legacy v1 carts migrate with fresh UUIDs and the old key is deleted', () => {
  reset();
  const legacy = [
    { id: 'old-1', productName: 'Legacy Window', exactAmount: 5000, details: [{ label: 'Width', value: '1200' }] },
    { id: 'old-1', productName: 'Legacy Pergola', exactAmount: 90000, details: [{ label: 'Width', value: '5000' }] },
  ];
  store.__seedRaw(store.LEGACY_KEYS.cart, JSON.stringify(legacy));
  store.__seedRaw(store.LEGACY_KEYS.lead, JSON.stringify({ name: 'Old Lead', mobile: '8888888888' }));

  const migrated = store.list();
  assert.equal(migrated.length, 2);
  migrated.forEach((it) => {
    assert.match(it.itemId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.equal(it.id, it.itemId, 'id must mirror itemId for the existing cart UI');
  });
  // Both legacy rows carried the same id; they must not collapse into one.
  assert.notEqual(migrated[0].itemId, migrated[1].itemId);
  assert.equal(migrated[0].productName, 'Legacy Window');
  assert.equal(migrated[1].exactAmount, 90000);
  assert.equal(store.getCustomer().name, 'Old Lead', 'the cached lead migrates too');

  assert.equal(store.__readRaw(store.LEGACY_KEYS.cart), null, 'v1 cart key must be removed');
  assert.equal(store.__readRaw(store.LEGACY_KEYS.lead), null, 'v1 lead key must be removed');
});

test('events fire per mutation and carry the itemId', () => {
  reset();
  const rand = rng(43);
  const seen = [];
  store.on('*', (e) => seen.push(e.event));

  const added = store.add(makeItem(PRODUCTS[0], 1, rand));
  store.update(added.itemId, { exactAmount: 1234 });
  store.remove(added.itemId);

  assert.ok(seen.includes(store.EVENTS.ProductAdded));
  assert.ok(seen.includes(store.EVENTS.ProductUpdated));
  assert.ok(seen.includes(store.EVENTS.ProductRemoved));
  assert.ok(seen.filter((e) => e === store.EVENTS.QuoteVersionBumped).length >= 3, 'every mutation bumps the version');
});

test('the quote version increases monotonically across a long session', () => {
  reset();
  const rand = rng(47);
  let previous = store.meta().version;
  for (let i = 0; i < 25; i++) {
    store.add(makeItem(PRODUCTS[i % PRODUCTS.length], i + 1, rand));
    const current = store.meta().version;
    assert.ok(current > previous, `version must increase (was ${previous}, now ${current})`);
    previous = current;
  }
  assert.equal(store.count(), 25);
});

test('a 30-product estimate built page by page keeps every line correct', () => {
  reset();
  const rand = rng(53);
  const inputs = [];
  for (let i = 0; i < 30; i++) {
    const product = PRODUCTS[i % PRODUCTS.length];
    const item = makeItem(product, i + 1, rand);
    inputs.push(item);
    store.add(item);
    // Read back on every page, the way the cart sheet does.
    assert.equal(store.count(), i + 1);
  }
  assertNoCrossContamination(store.list(), inputs, 'thirty-items');
});

test('customer details are stored separately and never leak into items', () => {
  reset();
  const rand = rng(59);
  store.add(makeItem(PRODUCTS[0], 1, rand));
  store.setCustomer({ name: 'Test Customer', mobile: '9999999999', email: 'a@b.com', city: 'Hyderabad' });

  const item = store.list()[0];
  assert.equal(item.name, undefined);
  assert.equal(item.mobile, undefined);
  assert.equal(store.getCustomer().name, 'Test Customer');

  const customer = store.getCustomer();
  customer.name = 'HACKED';
  assert.equal(store.getCustomer().name, 'Test Customer', 'customer read must be a clone');
});

test('clear empties the estimate without breaking the quote identity', () => {
  reset();
  const rand = rng(61);
  const quoteIdBefore = store.meta().quoteId;
  PRODUCTS.forEach((p, n) => store.add(makeItem(p, n + 1, rand)));
  store.clear();
  assert.equal(store.count(), 0);
  assert.equal(store.meta().quoteId, quoteIdBefore, 'clearing items must not orphan the quote id');
});
