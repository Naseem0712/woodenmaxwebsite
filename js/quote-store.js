/**
 * WoodenMax Quote Store — single source of truth for the multi-product
 * project estimate ("quotation cart").
 *
 * Isolation guarantees:
 *   • Every item carries its own `itemId` (UUID). Nothing is keyed by product
 *     slug, page path or array index, so two products can never overwrite
 *     each other.
 *   • Everything written in is deep-cloned before it is stored, and everything
 *     read out is a fresh deep clone. A caller therefore cannot hold a live
 *     reference into the store, which is what previously let one calculator's
 *     nested `details` / `config` objects bleed into another saved item.
 *   • The internal copies are deep-frozen, so an accidental in-place mutation
 *     inside this module fails loudly instead of silently corrupting a quote.
 *
 * Storage keys are versioned (`_v2`). The legacy `woodenmax_quote_cart_v1`
 * cart and `woodenmax_lead_cache_v1` lead are migrated once, then removed.
 *
 * Works in the browser and in Node (tests) — when Web Storage is unavailable
 * it falls back to an in-memory backend.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WoodenMaxQuoteStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SCHEMA = 2;

  var KEYS = {
    items: 'wm_quote_items_v2',
    customer: 'wm_quote_customer_v2',
    meta: 'wm_quote_meta_v2'
  };

  var LEGACY_KEYS = {
    cart: 'woodenmax_quote_cart_v1',
    lead: 'woodenmax_lead_cache_v1'
  };

  var EVENTS = {
    ProductAdded: 'ProductAdded',
    ProductUpdated: 'ProductUpdated',
    ProductRemoved: 'ProductRemoved',
    QuoteCleared: 'QuoteCleared',
    QuoteVersionBumped: 'QuoteVersionBumped',
    CustomerUpdated: 'CustomerUpdated',
    QuoteSynced: 'QuoteSynced'
  };

  // ---------- storage backends ----------

  function memoryBackend () {
    var map = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null; },
      setItem: function (k, v) { map[k] = String(v); },
      removeItem: function (k) { delete map[k]; }
    };
  }

  function webBackend (which) {
    try {
      var s = typeof window !== 'undefined' ? window[which] : null;
      if (!s) return null;
      var probe = '__wm_probe__';
      s.setItem(probe, '1');
      s.removeItem(probe);
      return s;
    } catch (e) {
      return null;
    }
  }

  var local = webBackend('localStorage') || memoryBackend();
  var session = webBackend('sessionStorage') || null;

  function readRaw (backend, key) {
    if (!backend) return null;
    try { return backend.getItem(key); } catch (e) { return null; }
  }

  function writeRaw (backend, key, value) {
    if (!backend) return false;
    try { backend.setItem(key, value); return true; } catch (e) { return false; }
  }

  function dropRaw (backend, key) {
    if (!backend) return;
    try { backend.removeItem(key); } catch (e) { /* ignore */ }
  }

  /**
   * Read an envelope, preferring whichever backend holds the higher `rev`.
   * The old cart always preferred localStorage, so a write that only landed in
   * sessionStorage (quota error) was invisible and the user saw a stale cart.
   */
  function readEnvelope (key) {
    var candidates = [readRaw(local, key), readRaw(session, key)];
    var best = null;
    for (var i = 0; i < candidates.length; i++) {
      var parsed = parseEnvelope(candidates[i]);
      if (!parsed) continue;
      if (!best || (parsed.rev || 0) > (best.rev || 0)) best = parsed;
    }
    return best;
  }

  function parseEnvelope (raw) {
    if (!raw) return null;
    try {
      var obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') return null;
      return obj;
    } catch (e) {
      return null;
    }
  }

  function writeEnvelope (key, envelope) {
    var json = JSON.stringify(envelope);
    var okLocal = writeRaw(local, key, json);
    // sessionStorage is a fallback for quota/private-mode failures only.
    if (!okLocal) writeRaw(session, key, json);
    else dropRaw(session, key);
    return okLocal;
  }

  // ---------- helpers ----------

  function uuid () {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        var b = new Uint8Array(16);
        crypto.getRandomValues(b);
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        var hex = [];
        for (var i = 0; i < 16; i++) hex.push((b[i] + 0x100).toString(16).slice(1));
        return hex.slice(0, 4).join('') + '-' + hex.slice(4, 6).join('') + '-' +
          hex.slice(6, 8).join('') + '-' + hex.slice(8, 10).join('') + '-' +
          hex.slice(10, 16).join('');
      }
    } catch (e) { /* fall through */ }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
    });
  }

  function deepClone (value) {
    if (value === null || typeof value !== 'object') return value;
    try {
      if (typeof structuredClone === 'function') return structuredClone(value);
    } catch (e) { /* DOM nodes / functions — fall back to JSON */ }
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (e2) {
      return Array.isArray(value) ? [] : {};
    }
  }

  function deepFreeze (value) {
    if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.keys(value).forEach(function (k) { deepFreeze(value[k]); });
    return value;
  }

  function now () { return Date.now(); }

  // ---------- in-memory cache ----------

  var cache = {
    items: null,     // frozen deep clones
    itemsRev: 0,
    customer: null,
    customerRev: 0,
    meta: null
  };

  function loadItems () {
    if (cache.items) return cache.items;
    var env = readEnvelope(KEYS.items);
    if (!env || !Array.isArray(env.items)) {
      migrateLegacyIfNeeded();
      env = readEnvelope(KEYS.items);
    }
    var items = (env && Array.isArray(env.items)) ? env.items : [];
    cache.itemsRev = (env && env.rev) || 0;
    cache.items = deepFreeze(items.map(normalizeItem));
    return cache.items;
  }

  function persistItems (items, event, detail) {
    cache.itemsRev += 1;
    cache.items = deepFreeze(deepClone(items).map(normalizeItem));
    writeEnvelope(KEYS.items, {
      schema: SCHEMA,
      rev: cache.itemsRev,
      updatedAt: now(),
      items: cache.items
    });
    bumpVersion();
    if (event) emit(event, detail || {});
    emitLegacyCartUpdate();
    return cache.items;
  }

  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Every item gets a UUID `itemId`. Anything that arrives with a short legacy
   * id ('item-3', a timestamp, …) is re-issued, because those ids collided
   * across pages. `id` mirrors `itemId` since the cart sheet, remove button and
   * print stage all key off `id`.
   */
  function normalizeItem (item) {
    var out = (item && typeof item === 'object') ? item : {};
    var candidate = out.itemId || out.id;
    out.itemId = UUID_RE.test(String(candidate)) ? candidate : uuid();
    out.id = out.itemId;
    if (!out.createdAt) out.createdAt = out.ts || now();
    if (!out.updatedAt) out.updatedAt = out.createdAt;
    if (!out.productType) out.productType = out.category || 'Products';
    if (!out.calculatorId) out.calculatorId = out.productKey || 'unknown';
    if (!out.productId) out.productId = out.productKey || out.calculatorId;
    return out;
  }

  // ---------- quote meta (id + version) ----------

  function loadMeta () {
    if (cache.meta) return cache.meta;
    var env = readEnvelope(KEYS.meta);
    if (env && env.quoteId) {
      cache.meta = env;
    } else {
      cache.meta = {
        schema: SCHEMA,
        quoteId: uuid(),
        quoteNo: null,
        version: 1,
        createdAt: now(),
        updatedAt: now()
      };
      writeEnvelope(KEYS.meta, cache.meta);
    }
    return cache.meta;
  }

  function bumpVersion () {
    var meta = loadMeta();
    meta.version = (meta.version || 1) + 1;
    meta.updatedAt = now();
    writeEnvelope(KEYS.meta, meta);
    emit(EVENTS.QuoteVersionBumped, { quoteId: meta.quoteId, version: meta.version });
    return meta.version;
  }

  // ---------- legacy migration ----------

  var migrated = false;

  function migrateLegacyIfNeeded () {
    if (migrated) return;
    migrated = true;

    var legacyRaw = readRaw(local, LEGACY_KEYS.cart) || readRaw(session, LEGACY_KEYS.cart);
    if (legacyRaw) {
      var legacy = null;
      try { legacy = JSON.parse(legacyRaw); } catch (e) { legacy = null; }
      if (Array.isArray(legacy) && legacy.length) {
        cache.itemsRev = 1;
        cache.items = deepFreeze(legacy.map(function (it) {
          var copy = deepClone(it) || {};
          copy.itemId = uuid();
          copy.id = copy.itemId;
          copy.migratedFrom = 'v1';
          return normalizeItem(copy);
        }));
        writeEnvelope(KEYS.items, {
          schema: SCHEMA,
          rev: cache.itemsRev,
          updatedAt: now(),
          items: cache.items
        });
      }
      dropRaw(local, LEGACY_KEYS.cart);
      dropRaw(session, LEGACY_KEYS.cart);
    }

    var leadRaw = readRaw(local, LEGACY_KEYS.lead);
    if (leadRaw && !readEnvelope(KEYS.customer)) {
      var lead = null;
      try { lead = JSON.parse(leadRaw); } catch (e2) { lead = null; }
      if (lead && typeof lead === 'object') {
        cache.customerRev = 1;
        cache.customer = deepFreeze(deepClone(lead));
        writeEnvelope(KEYS.customer, {
          schema: SCHEMA,
          rev: cache.customerRev,
          updatedAt: now(),
          customer: cache.customer
        });
      }
      dropRaw(local, LEGACY_KEYS.lead);
    }
  }

  // ---------- events ----------

  var listeners = {};

  function on (event, cb) {
    if (typeof cb !== 'function') return function () {};
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
    return function () { off(event, cb); };
  }

  function off (event, cb) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(function (fn) { return fn !== cb; });
  }

  function emit (event, detail) {
    var payload = { event: event, detail: detail || {}, at: now() };
    (listeners[event] || []).forEach(function (fn) {
      try { fn(payload); } catch (e) { /* a bad listener must not break the quote */ }
    });
    (listeners['*'] || []).forEach(function (fn) {
      try { fn(payload); } catch (e) { /* ignore */ }
    });
    if (typeof document !== 'undefined' && typeof CustomEvent === 'function') {
      try {
        document.dispatchEvent(new CustomEvent('wm-quote-event', { detail: payload }));
      } catch (e) { /* ignore */ }
    }
  }

  /** Back-compat: the old cart broadcast this on every write. */
  function emitLegacyCartUpdate () {
    if (typeof document === 'undefined' || typeof CustomEvent !== 'function') return;
    var items = loadItems();
    try {
      document.dispatchEvent(new CustomEvent('wm-cart-updated', {
        detail: { count: items.length, items: deepClone(items) }
      }));
    } catch (e) { /* ignore */ }
  }

  // ---------- cross-tab sync ----------

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('storage', function (e) {
      if (!e || (e.key !== KEYS.items && e.key !== KEYS.customer && e.key !== null)) return;
      cache.items = null;
      cache.customer = null;
      cache.meta = null;
      emit(EVENTS.QuoteSynced, { key: e.key });
      emitLegacyCartUpdate();
    });
  }

  // ---------- public API ----------

  /** @returns {object[]} fresh deep clones — safe to mutate, never aliases the store */
  function list () {
    return deepClone(loadItems());
  }

  /** @returns {object[]} the frozen internal copies (tests / read-only render) */
  function listFrozen () {
    return loadItems();
  }

  function get (itemId) {
    var found = null;
    loadItems().forEach(function (it) { if (it.itemId === itemId) found = it; });
    return found ? deepClone(found) : null;
  }

  function add (item) {
    var next = list();
    var created = normalizeItem(deepClone(item) || {});
    created.itemId = uuid();
    created.id = created.itemId;
    created.createdAt = now();
    created.updatedAt = created.createdAt;
    next.push(created);
    persistItems(next, EVENTS.ProductAdded, { itemId: created.itemId, item: deepClone(created) });
    return get(created.itemId);
  }

  function addMany (items) {
    var added = [];
    (items || []).forEach(function (it) {
      var created = add(it);
      if (created) added.push(created);
    });
    return added;
  }

  function update (itemId, patch) {
    var next = list();
    var hit = null;
    next = next.map(function (it) {
      if (it.itemId !== itemId) return it;
      var merged = Object.assign({}, it, deepClone(patch) || {});
      merged.itemId = it.itemId;
      merged.id = it.itemId;
      merged.createdAt = it.createdAt;
      merged.updatedAt = now();
      hit = merged;
      return merged;
    });
    if (!hit) return null;
    persistItems(next, EVENTS.ProductUpdated, { itemId: itemId, item: deepClone(hit) });
    return get(itemId);
  }

  function remove (itemId) {
    var before = list();
    var next = before.filter(function (it) { return it.itemId !== itemId && it.id !== itemId; });
    if (next.length === before.length) return false;
    persistItems(next, EVENTS.ProductRemoved, { itemId: itemId });
    return true;
  }

  function removeWhere (predicate) {
    if (typeof predicate !== 'function') return 0;
    var before = list();
    var next = before.filter(function (it) { return !predicate(it); });
    var dropped = before.length - next.length;
    if (dropped > 0) persistItems(next, EVENTS.ProductRemoved, { count: dropped });
    return dropped;
  }

  /**
   * Merge-or-append against a caller-supplied match (grill lines merge when the
   * size/profile fingerprint is identical). The matched item keeps its itemId,
   * so a merge is an update — never a delete-and-recreate.
   */
  function upsert (item, matchFn, mergeFn) {
    var next = list();
    var idx = -1;
    if (typeof matchFn === 'function') {
      for (var i = 0; i < next.length; i++) {
        if (matchFn(next[i], item)) { idx = i; break; }
      }
    }
    if (idx === -1) return add(item);

    var existing = next[idx];
    var merged = (typeof mergeFn === 'function')
      ? mergeFn(deepClone(existing), deepClone(item))
      : Object.assign({}, existing, deepClone(item));
    merged.itemId = existing.itemId;
    merged.id = existing.itemId;
    merged.createdAt = existing.createdAt;
    merged.updatedAt = now();
    next[idx] = merged;
    persistItems(next, EVENTS.ProductUpdated, { itemId: merged.itemId, item: deepClone(merged) });
    return get(merged.itemId);
  }

  function replaceAll (items) {
    var next = (items || []).map(function (it) { return normalizeItem(deepClone(it) || {}); });
    persistItems(next, EVENTS.QuoteVersionBumped, { replaced: next.length });
    return list();
  }

  function clear () {
    persistItems([], EVENTS.QuoteCleared, {});
    return [];
  }

  function count () {
    return loadItems().length;
  }

  function getCustomer () {
    if (cache.customer) return deepClone(cache.customer);
    var env = readEnvelope(KEYS.customer);
    if (!env) migrateLegacyIfNeeded();
    env = readEnvelope(KEYS.customer);
    cache.customer = deepFreeze((env && env.customer) || null);
    cache.customerRev = (env && env.rev) || 0;
    return cache.customer ? deepClone(cache.customer) : null;
  }

  function setCustomer (data) {
    cache.customerRev += 1;
    cache.customer = deepFreeze(deepClone(data) || {});
    writeEnvelope(KEYS.customer, {
      schema: SCHEMA,
      rev: cache.customerRev,
      updatedAt: now(),
      customer: cache.customer
    });
    emit(EVENTS.CustomerUpdated, {});
    return deepClone(cache.customer);
  }

  function meta () {
    return deepClone(loadMeta());
  }

  function setQuoteNo (quoteNo) {
    var m = loadMeta();
    m.quoteNo = quoteNo;
    m.updatedAt = now();
    writeEnvelope(KEYS.meta, m);
    return deepClone(m);
  }

  /**
   * "Edit this item" parks the item id here and sends the customer back to the
   * page it was configured on. Saving there updates that row instead of adding
   * a second one, so the quote never grows a duplicate on every edit.
   */
  function setEditing (itemId) {
    var m = loadMeta();
    m.editingItemId = itemId || null;
    m.updatedAt = now();
    writeEnvelope(KEYS.meta, m);
    return m.editingItemId;
  }

  function getEditing () {
    return loadMeta().editingItemId || null;
  }

  function clearEditing () {
    return setEditing(null);
  }

  /** Test hook: wipe every key and the in-memory cache. */
  function __reset () {
    [KEYS.items, KEYS.customer, KEYS.meta, LEGACY_KEYS.cart, LEGACY_KEYS.lead].forEach(function (k) {
      dropRaw(local, k);
      dropRaw(session, k);
    });
    cache = { items: null, itemsRev: 0, customer: null, customerRev: 0, meta: null };
    listeners = {};
    migrated = false;
  }

  /** Test hook: swap in a fresh in-memory backend. */
  function __useMemoryBackend () {
    local = memoryBackend();
    session = null;
    __reset();
  }

  /** Test hook: plant a raw value (used to exercise the v1 migration). */
  function __seedRaw (key, value) {
    writeRaw(local, key, value);
    cache = { items: null, itemsRev: 0, customer: null, customerRev: 0, meta: null };
    migrated = false;
  }

  /** Test hook: read a raw value, to assert a retired key really is gone. */
  function __readRaw (key) {
    return readRaw(local, key);
  }

  return {
    SCHEMA: SCHEMA,
    KEYS: KEYS,
    LEGACY_KEYS: LEGACY_KEYS,
    EVENTS: EVENTS,

    list: list,
    listFrozen: listFrozen,
    get: get,
    add: add,
    addMany: addMany,
    update: update,
    remove: remove,
    removeWhere: removeWhere,
    upsert: upsert,
    replaceAll: replaceAll,
    clear: clear,
    count: count,

    getCustomer: getCustomer,
    setCustomer: setCustomer,

    meta: meta,
    setQuoteNo: setQuoteNo,
    bumpVersion: bumpVersion,
    setEditing: setEditing,
    getEditing: getEditing,
    clearEditing: clearEditing,

    on: on,
    off: off,

    uuid: uuid,
    deepClone: deepClone,

    __reset: __reset,
    __useMemoryBackend: __useMemoryBackend,
    __seedRaw: __seedRaw,
    __readRaw: __readRaw
  };
});
