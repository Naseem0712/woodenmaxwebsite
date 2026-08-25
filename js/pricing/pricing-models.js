/*
 * WoodenMax canonical pricing models.
 *
 * This small UMD module deliberately accepts data objects rather than fetching
 * them.  Browser calculators, package rendering and Node SSR therefore use
 * exactly the same arithmetic, while data/products.json and data/rates.json
 * remain the only monetary sources.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WMPriceModels = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function PricingDataError(code) {
    this.name = 'PricingDataError';
    this.code = code || 'invalid-pricing-data';
    this.message = 'Authoritative pricing data is unavailable.';
    if (Error.captureStackTrace) Error.captureStackTrace(this, PricingDataError);
  }
  PricingDataError.prototype = Object.create(Error.prototype);
  PricingDataError.prototype.constructor = PricingDataError;

  function number(value, code) {
    var result = Number(value);
    if (!Number.isFinite(result)) throw new PricingDataError(code);
    return result;
  }
  function positive(value, code) {
    var result = number(value, code);
    if (result <= 0) throw new PricingDataError(code);
    return result;
  }
  function required(object, key, code) {
    if (!object || object[key] === undefined || object[key] === null) throw new PricingDataError(code || ('missing-' + key));
    return object[key];
  }
  function round2(value) { return Math.round(number(value, 'invalid-amount') * 100) / 100; }
  function roundedINR(value) { return Math.round(round2(value)); }

  function threeTrack(product, input) {
    var rates = required(product, 'rates', 'missing-3track-rates');
    var width = positive(input && input.width, 'invalid-width');
    var height = positive(input && input.height, 'invalid-height');
    var track = String(input && input.track || '2track');
    var glassKey = String(input && input.glassMm || 6) + 'mm';
    var base = number(required(rates, 'baseRate', 'missing-3track-base'), 'invalid-3track-base');
    var hardware = number(required(rates, 'hardwareCost', 'missing-3track-hardware'), 'invalid-3track-hardware');
    /* 5mm is included in the approved base rate. It is an explicit zero
       add-on, not a fallback monetary rate. */
    var glass = glassKey === '5mm' ? 0 : number(required(required(rates, 'glass', 'missing-3track-glass'), glassKey, 'missing-3track-glass-rate'), 'invalid-3track-glass-rate');
    var trackRate = 0;
    if (track === '3track') {
      trackRate = number(required(required(rates, 'trackOptions', 'missing-track-options'), '3track', 'missing-3track-adder'), 'invalid-3track-adder');
    } else if (track !== '2track') {
      throw new PricingDataError('invalid-track');
    }
    return round2((base + trackRate + glass) * width * height + hardware);
  }

  function framelessShower(product, input) {
    var rates = required(product, 'rates', 'missing-shower-rates');
    var width = positive(input && input.width, 'invalid-width');
    var height = positive(input && input.height, 'invalid-height');
    var mode = String(input && input.mode || 'hinged');
    if (mode !== 'hinged' && mode !== 'sliding') throw new PricingDataError('invalid-shower-mode');
    var finish = String(input && input.finish || 'mill-finish');
    var doorCount = positive(input && input.doorCount || 1, 'invalid-door-count');
    var block = required(rates, mode, 'missing-shower-mode');
    var glass = number(required(block, 'glassRate', 'missing-shower-glass'), 'invalid-shower-glass');
    var hardware = number(required(required(block, 'hardware', 'missing-shower-hardware'), finish, 'missing-shower-hardware-rate'), 'invalid-shower-hardware-rate');
    return round2(width * height * glass + hardware * doorCount);
  }

  function pergolaRecord(rates, input) {
    var width = positive(input && input.width, 'invalid-width');
    var depth = positive(input && input.depth, 'invalid-depth');
    var clearance = positive(input && input.clearanceFt, 'invalid-clearance');
    var lineId = String(input && input.lineId || 'fixed_aluminium_glass');
    var roof = String(input && input.roof || '10mm_clr');
    var coating = String(input && input.coating || 'plain');
    var catalog = required(rates, 'pergola_catalog', 'missing-pergola-catalog');
    var lines = required(catalog, 'lines', 'missing-pergola-lines');
    var line = null;
    for (var i = 0; i < lines.length; i++) if (lines[i] && lines[i].id === lineId) { line = lines[i]; break; }
    if (!line) throw new PricingDataError('missing-pergola-line');
    var structure = number(required(line, 'aluminium_structure_per_sqft', 'missing-pergola-structure'), 'invalid-pergola-structure');
    var glass = number(required(required(rates, 'glass_unit_rates_per_sqft', 'missing-pergola-glass-rates'), roof, 'missing-pergola-glass'), 'invalid-pergola-glass');
    var coat = number(required(required(rates, 'coating_price', 'missing-pergola-coating-rates'), coating, 'missing-pergola-coating'), 'invalid-pergola-coating');
    var area = width * depth;
    return {
      amount: round2(area * (structure + glass + coat) * (clearance / 9)),
      inputs: { width: width, depth: depth, clearanceFt: clearance, lineId: lineId, roof: roof, coating: coating },
      rates: { structure: structure, glass: glass, coating: coat }
    };
  }
  function pergola(rates, input) { return pergolaRecord(rates, input).amount; }

  /* Stable, non-secret release marker. It detects rate/data drift before a
     browser is permitted to alter an SSR verified package or quote action. */
  function hash(text) {
    var n = 2166136261;
    text = String(text);
    for (var i = 0; i < text.length; i++) { n ^= text.charCodeAt(i); n = Math.imul(n, 16777619); }
    return (n >>> 0).toString(36);
  }
  function revisionFor(kind, source, input) {
    var payload;
    if (kind === '3track') {
      var r = required(source, 'rates', 'missing-3track-rates');
      payload = [r.baseRate, r.hardwareCost, r.trackOptions && r.trackOptions['3track'], r.glass && r.glass['6mm'], r.glass && r.glass['8mm']];
    } else if (kind === 'frameless-shower') {
      var s = required(source, 'rates', 'missing-shower-rates');
      payload = [s.hinged, s.sliding];
    } else if (kind === 'pergola') {
      input = input || {};
      var lineId = String(input.lineId || 'fixed_aluminium_glass');
      var roof = String(input.roof || '10mm_clr');
      var coating = String(input.coating || 'plain');
      var catalog = required(source, 'pergola_catalog', 'missing-pergola-catalog');
      var lines = required(catalog, 'lines', 'missing-pergola-lines');
      var line = null;
      for (var j = 0; j < lines.length; j++) if (lines[j] && lines[j].id === lineId) { line = lines[j]; break; }
      if (!line) throw new PricingDataError('missing-pergola-line');
      payload = [lineId, roof, coating, number(required(line, 'aluminium_structure_per_sqft', 'missing-pergola-structure')), number(required(required(source, 'glass_unit_rates_per_sqft', 'missing-pergola-glass-rates'), roof, 'missing-pergola-glass')), number(required(required(source, 'coating_price', 'missing-pergola-coating-rates'), coating, 'missing-pergola-coating'))];
    } else {
      throw new PricingDataError('unknown-pricing-kind');
    }
    return 'wm1-' + hash(JSON.stringify(payload));
  }

  return {
    PricingDataError: PricingDataError,
    round2: round2,
    roundedINR: roundedINR,
    threeTrack: threeTrack,
    framelessShower: framelessShower,
    pergola: pergola,
    pergolaRecord: pergolaRecord,
    revisionFor: revisionFor
  };
}));
