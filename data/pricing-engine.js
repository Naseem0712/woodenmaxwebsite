/**
 * WoodenMax Pricing Engine v1.0
 * Uses: data/products.json, data/rates.json, data/mirror.json
 *
 * Browser: WoodenMaxPricingEngine.init({ products, rates, mirror })
 * Node:    const engine = require('./data/pricing-engine.js'); engine.init(...)
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.WoodenMaxPricingEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var state = { products: null, rates: null, mirror: null };

  var API_VERSION = 'WoodenMax Pricing Engine v1.0';
  var ORIGIN = 'https://woodenmax.in';
  var WA_PHONE = '917895328080';
  var GST_PERCENT = 18;

  var CITIES = [
    'Delhi NCR', 'Jaipur', 'Lucknow', 'Hyderabad', 'Ahmedabad', 'Chandigarh',
    'Mumbai', 'Bengaluru', 'Pune', 'Chennai',
  ];

  var MIRROR_CALC_TYPES = {
    'half-round': true,
    'round-touch': true,
    'round-slim': true,
    'square-touch': true,
    'wooden-round': true,
    'rect-led': true,
    'backlit-touch': true,
    'bevel-modular': true,
    'custom-rect-led': true,
    'imported-motion': true,
    'luxury-glass': true,
  };

  var LOUVER_PROFILE_KEYS = {
    '25x25': 0,
    '25x50': 1,
    '40x40': 2,
    '75x38': 3,
    '100x50': 4,
  };

  function num(v, fallback) {
    var n = parseFloat(v);
    return isFinite(n) && n > 0 ? n : fallback;
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function init(opts) {
    opts = opts || {};
    state.products = opts.products || null;
    state.rates = opts.rates || null;
    state.mirror = opts.mirror || (opts.rates && opts.rates.mirror_profiles) || null;
    return api;
  }

  function getProducts() {
    if (!state.products) return [];
    return state.products.products || state.products;
  }

  function findProduct(id) {
    if (!id) return null;
    var key = String(id).toLowerCase().trim();
    var list = getProducts();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === key || list[i].slug === key) return list[i];
    }
    for (var j = 0; j < list.length; j++) {
      if (
        list[j].id.indexOf(key) !== -1 ||
        list[j].slug.indexOf(key) !== -1 ||
        key.indexOf(list[j].id) !== -1
      ) {
        return list[j];
      }
    }
    return null;
  }

  function resolveMirrorType(params, product) {
    if (params.type && MIRROR_CALC_TYPES[params.type]) return params.type;
    if (product && state.mirror && state.mirror.pageCalculator) {
      var pc = state.mirror.pageCalculator[product.id];
      if (pc) return pc;
    }
    if (MIRROR_CALC_TYPES[params.product] || MIRROR_CALC_TYPES[params.productId]) {
      return params.product || params.productId;
    }
    return null;
  }

  function isLouverProduct(product) {
    return product && product.category === 'metal-louvers';
  }

  function isWindowProduct(product) {
    return product && product.category === 'aluminium-windows';
  }

  function getGlobalRates() {
    if (state.products && state.products.globalRates) return state.products.globalRates;
    if (state.rates && state.rates.globalRates) return state.rates.globalRates;
    return {};
  }

  function glassRate(productRates, globalRates, glassKey, area, qty) {
    var g = (glassKey || '6mm').toLowerCase();
    var perSqft = 0;
    if (productRates && productRates.glass && productRates.glass[g] != null) {
      perSqft = productRates.glass[g];
    } else if (globalRates && globalRates.glass && globalRates.glass[g] != null) {
      perSqft = globalRates.glass[g];
    }
    return perSqft * area * qty;
  }

  function mapRate(obj, key, fallback) {
    if (!obj || key == null) return fallback;
    if (obj[key] != null) return obj[key];
    return fallback;
  }

  function calculateWindow(params) {
    var productId = params.productId || params.product;
    var product = findProduct(productId);
    if (!product) {
      return errorResponse('Product not found: ' + productId, params);
    }

    var width = num(params.width || params.width_ft, 0);
    var height = num(params.height || params.height_ft, 0);
    var qty = num(params.quantity, 1);
    if (!width || !height) {
      return errorResponse('width and height (feet) are required', params);
    }

    var area = width * height;
    var rates = product.rates || {};
    var global = getGlobalRates();
    var baseRate = rates.baseRate || 0;
    var hardware = rates.hardwareCost || 0;
    if (params.lock === 'multiPoint' && rates.hardwareCostMultiPoint) {
      hardware = rates.hardwareCostMultiPoint;
    }

    var glassKey = (params.glass || '6mm').toLowerCase();
    var meshKey = params.mesh === 'openable' || params.mesh === 'true' ? 'openable' : 'standard';
    var coatingKey = params.coating || 'wooden';
    var lockKey = params.lock || 'singlePoint';
    if (lockKey === 'multipoint') lockKey = 'multiPoint';
    if (lockKey === 'mortice' || lockKey === 'mortise') lockKey = 'mortice';

    var baseTotal = baseRate * area * qty;
    var hardwareTotal = hardware * qty;
    var glassExtra = 0;
    var meshExtra = 0;
    var coatingExtra = 0;
    var lockExtra = 0;
    var trackExtra = 0;
    var other = 0;

    if (product.id === '3track-sliding' || productId === '3track-sliding') {
      glassExtra = glassRate(rates, global, glassKey, area, qty);
      var track = (params.trackOption || params.track || '3track').toLowerCase();
      if (track.indexOf('2') !== -1) track = '2track';
      else track = '3track';
      var trackOpts = rates.trackOptions || {};
      trackExtra = mapRate(trackOpts, track, 0) * area * qty;
      var meshPerSqft = rates.mesh != null ? rates.mesh : mapRate(global.mesh, 'standard', 127);
      if (
        params.mesh === true ||
        params.mesh === 'true' ||
        params.mesh === '1' ||
        params.mesh === 'standard' ||
        params.mesh === 'openable'
      ) {
        meshExtra = meshPerSqft * area * qty;
      }
    } else if (rates.useGlobalRates) {
      glassExtra = glassRate(rates, global, glassKey, area, qty);
      if (params.mesh && params.mesh !== 'false' && params.mesh !== '0') {
        meshExtra = mapRate(global.mesh, meshKey, mapRate(rates.mesh, meshKey, 0)) * area * qty;
      }
      coatingExtra = mapRate(global.coating, coatingKey, 0) * area * qty;
      if (lockKey !== 'singlePoint') {
        lockExtra = mapRate(global.lock, lockKey, 0) * qty;
      }
    } else {
      glassExtra = glassRate(rates, global, glassKey, area, qty);
      if (params.mesh && params.mesh !== 'false') {
        meshExtra = mapRate(rates.mesh, meshKey, mapRate(global.mesh, meshKey, 0)) * area * qty;
      }
    }

    var grandTotal = baseTotal + hardwareTotal + glassExtra + trackExtra + meshExtra + coatingExtra + lockExtra + other;

    return successResponse({
      category: 'window',
      product: product,
      query: {
        product: product.name,
        product_id: product.id,
        width_ft: width,
        height_ft: height,
        area_sqft: round2(area),
        quantity: qty,
        glass: glassKey,
        mesh: params.mesh || '',
        coating: coatingKey,
        trackOption: params.trackOption || '',
        lock: lockKey,
        city: params.city || '',
      },
      breakdown: {
        base_rate_per_sqft: baseRate,
        base_total: round2(baseTotal),
        glass_extra: round2(glassExtra),
        hardware_total: round2(hardwareTotal),
        coating_extra: round2(coatingExtra),
        mesh_extra: round2(meshExtra),
        track_extra: round2(trackExtra),
        lock_extra: round2(lockExtra),
        other: round2(other),
      },
      grandTotal: grandTotal,
    });
  }

  function calculateLouver(params) {
    var productId = params.productId || params.product;
    var product = findProduct(productId);
    var width = num(params.width || params.width_ft, 0);
    var height = num(params.height || params.height_ft, 0);
    if (!width || !height) {
      return errorResponse('width and height (feet) are required', params);
    }
    var area = width * height;
    var coatingKey = (params.coating || 'plain').toLowerCase();
    if (coatingKey === 'wood' || coatingKey === 'wooden') coatingKey = 'wooden';
    if (coatingKey === 'texture') coatingKey = 'textured';

    var baseTotal = 0;
    var coatingExtra = 0;
    var frameTotal = 0;
    var wallMultiplier = 1;
    var profileLabel = '';
    var baseRatePerSqft = 0;

    if (product && product.rates && product.rates.baseRate && !params.profile) {
      baseRatePerSqft = product.rates.baseRate;
      profileLabel = product.name;
      baseTotal = baseRatePerSqft * area;
      var coatPerFt = product.rates.coatingRatePerFt || 0;
      if (coatPerFt && coatingKey !== 'plain') {
        coatingExtra = coatPerFt * (width + height) * 2;
      }
    } else {
      var lp = (state.rates && state.rates.louver_profiles) || {};
      var profiles = lp.profiles || [];
      var profileKey = (params.profile || '75x38').toLowerCase().replace(/\s/g, '');
      var idx = LOUVER_PROFILE_KEYS[profileKey];
      if (idx == null) idx = 3;
      var profile = profiles[idx] || profiles[3];
      if (!profile) {
        return errorResponse('Louver profile data missing in rates.json', params);
      }
      baseRatePerSqft = profile.rate_per_sqft;
      profileLabel = profile.size;
      baseTotal = baseRatePerSqft * area;

      var wallMm = num(params.wallMm || params.wall_mm, 1.2);
      var wallOpts = lp.wall_thickness_options || [];
      for (var w = 0; w < wallOpts.length; w++) {
        if (wallOpts[w].mm === wallMm) {
          wallMultiplier = wallOpts[w].multiplier;
          break;
        }
      }

      var coatPrices = (state.rates && state.rates.coating_price) || {};
      var coatPerSqft = mapRate(coatPrices, coatingKey, mapRate(coatPrices, 'plain', 0));
      coatingExtra = coatPerSqft * area;

      if (params.outerFrame === true || params.outerFrame === 'true' || params.outerFrame === '1') {
        frameTotal = (lp.outer_frame_rate_per_sqft || 0) * area;
      }
    }

    var adjustedBase = baseTotal * wallMultiplier;
    var grandTotal = adjustedBase + coatingExtra + frameTotal;

    return successResponse({
      category: 'louver',
      product: product || { id: productId, name: profileLabel || 'Aluminium louver', slug: productId },
      query: {
        product: (product && product.name) || profileLabel,
        product_id: productId || profileLabel,
        width_ft: width,
        height_ft: height,
        area_sqft: round2(area),
        quantity: 1,
        glass: '',
        coating: coatingKey,
        profile: profileLabel,
        city: params.city || '',
      },
      breakdown: {
        base_rate_per_sqft: round2(baseRatePerSqft),
        base_total: round2(adjustedBase),
        glass_extra: 0,
        hardware_total: 0,
        coating_extra: round2(coatingExtra),
        mesh_extra: 0,
        wall_multiplier: wallMultiplier,
        frame_extra: round2(frameTotal),
        other: round2(baseTotal * (wallMultiplier - 1)),
      },
      grandTotal: grandTotal,
    });
  }

  function mirrorLedRate(calc, voltage) {
    var v = (voltage || 'v120').toLowerCase();
    if (v === 'v220') {
      if (calc.v220 != null) return calc.v220;
      return (calc.v120 || 0) + (calc.v220Extra || 0);
    }
    return calc.v120 || 0;
  }

  function calculateMirror(params) {
    var type = resolveMirrorType(params, findProduct(params.product || params.productId));
    if (!type) type = params.type || params.product;
    if (!type || !MIRROR_CALC_TYPES[type]) {
      return errorResponse('Unknown mirror type. Use: half-round, round-touch, luxury-glass, etc.', params);
    }

    var mirrorData = state.mirror || {};
    var calcs = mirrorData.calculators || {};
    var calc = calcs[type];
    if (!calc) {
      return errorResponse('Mirror calculator config missing for: ' + type, params);
    }

    var width = num(params.width || params.width_ft, 0);
    var height = num(params.height || params.height_ft, 0);
    if (!width || !height) {
      return errorResponse('width and height (feet) are required', params);
    }

    var area = width * height;
    var voltage = params.voltage || 'v120';
    var profileFinish = (params.profileFinish || params.finish || '').toLowerCase();
    var baseTotal = 0;
    var profileCost = 0;
    var other = 0;
    var packing = 0;

    if (type === 'bevel-modular') {
      baseTotal = (calc.bevel || 850) * area;
      if (params.profile === true || params.profile === 'true' || params.addProfile === 'true') {
        other += (calc.profileAdd || 250) * area;
      }
      if (params.ledV120 === true || params.ledV120 === 'true') {
        other += (calc.ledV120 || 120) * area;
      }
      if (params.ledV220 === true || params.ledV220 === 'true') {
        other += (calc.ledV220 || 200) * area;
      }
    } else if (type === 'luxury-glass') {
      var billArea = area * (calc.wastage || 1.5);
      baseTotal = mirrorLedRate(calc, voltage) * billArea;
      if (params.sensor === 'touch') other += calc.touchPc || 850;
      if (params.sensor === 'motion') {
        var gc = num(params.glassCount, calc.defaultGlassCount || 2);
        other += gc * (calc.motionPerGlass || 1220);
      }
    } else if (type === 'imported-motion') {
      baseTotal = mirrorLedRate(calc, voltage) * area;
      if (params.packing !== false && params.packing !== '0') {
        packing = calc.packing || 500;
      }
    } else if (type === 'custom-rect-led') {
      if (width < (calc.minWidth || 2)) {
        return errorResponse('Minimum width ' + (calc.minWidth || 2) + ' ft for custom mirror', params);
      }
      if (height > (calc.maxHeight || 7)) {
        return errorResponse('Maximum height ' + (calc.maxHeight || 7) + ' ft for custom mirror', params);
      }
      baseTotal = mirrorLedRate(calc, voltage) * area;
    } else {
      baseTotal = mirrorLedRate(calc, voltage) * area;
    }

    if (profileFinish && mirrorData.profilePerFoot && mirrorData.profilePerFoot[profileFinish]) {
      var pf = mirrorData.profilePerFoot[profileFinish];
      var perFt = (pf.min + pf.max) / 2;
      var perimeter = 2 * (width + height);
      profileCost = perFt * perimeter;
    }

    var grandTotal = baseTotal + profileCost + other + packing;

    return successResponse({
      category: 'mirror',
      product: { id: type, name: 'Mirror — ' + type, slug: type, category: 'mirror-profiles' },
      query: {
        product: 'Mirror profile — ' + type,
        product_id: type,
        width_ft: width,
        height_ft: height,
        area_sqft: round2(area),
        quantity: num(params.quantity, 1),
        glass: '',
        coating: profileFinish,
        voltage: voltage,
        city: params.city || '',
      },
      breakdown: {
        base_rate_per_sqft: mirrorLedRate(calc, voltage),
        base_total: round2(baseTotal),
        glass_extra: 0,
        hardware_total: 0,
        coating_extra: 0,
        mesh_extra: 0,
        profile_perimeter_ft: round2(2 * (width + height)),
        profile_extra: round2(profileCost),
        packing_extra: round2(packing),
        other: round2(other),
      },
      grandTotal: grandTotal,
    });
  }

  function productPageUrl(product) {
    if (!product) return ORIGIN + '/catalog';
    if (product.category && product.slug) {
      return ORIGIN + '/products/' + product.category + '/' + product.slug;
    }
    return ORIGIN + '/products/' + (product.slug || product.id);
  }

  function waMessage(query, total) {
    var w = query.width_ft || 0;
    var h = query.height_ft || 0;
    var amt = Math.round(total);
    return (
      'I need a quote for ' +
      (query.product || 'product') +
      '. Size: ' +
      w +
      '×' +
      h +
      ' ft, estimated ₹' +
      amt +
      ' (ex-GST). City: ' +
      (query.city || 'India') +
      '.'
    );
  }

  function successResponse(ctx) {
    var total = ctx.grandTotal;
    var area = ctx.query.area_sqft || 1;
    var qty = ctx.query.quantity || 1;
    var gst = round2(total * (GST_PERCENT / 100));

    return {
      api: API_VERSION,
      source: 'woodenmax.in',
      manufacturer: 'WoodenMax Architectural Elements',
      fabricator: true,
      installer: true,
      cities: CITIES,
      query: ctx.query,
      breakdown: ctx.breakdown,
      result: {
        total_price: Math.round(total),
        price_per_sqft: round2(total / area / qty),
        price_per_rft: round2(total / (2 * (ctx.query.width_ft + ctx.query.height_ft)) / qty),
        gst_extra_18_percent: Math.round(gst),
        total_with_gst: Math.round(total + gst),
        installation: 'Included',
        validity_days: 30,
      },
      contact: {
        whatsapp_url: 'https://wa.me/' + WA_PHONE,
        whatsapp_message: waMessage(ctx.query, total),
        website: ORIGIN,
        product_page: productPageUrl(ctx.product),
      },
      last_updated: '2026-05',
      note: 'Final price confirmed after site visit. Transport and GST extra where applicable.',
    };
  }

  function errorResponse(message, params) {
    return {
      api: API_VERSION,
      source: 'woodenmax.in',
      error: true,
      message: message,
      query: params || {},
      contact: {
        whatsapp_url: 'https://wa.me/' + WA_PHONE,
        website: ORIGIN,
      },
    };
  }

  function calculate(params) {
    params = params || {};
    var productId = params.productId || params.product;
    var mirrorType = resolveMirrorType(params, findProduct(productId));

    if (mirrorType) {
      params.type = mirrorType;
      return calculateMirror(params);
    }

    var product = findProduct(productId);
    if (product && isLouverProduct(product)) {
      return calculateLouver(params);
    }
    if (product && isWindowProduct(product)) {
      return calculateWindow(params);
    }

    if (MIRROR_CALC_TYPES[productId]) {
      params.type = productId;
      return calculateMirror(params);
    }

    if (productId && (productId.indexOf('louver') !== -1 || productId.indexOf('pergola') !== -1 || productId.indexOf('canopy') !== -1)) {
      return calculateLouver(params);
    }

    if (productId && (productId.indexOf('mirror') !== -1 || productId.indexOf('touch') !== -1)) {
      return calculateMirror(params);
    }

    if (product) {
      return calculateWindow(params);
    }

    return calculateLouver(params);
  }

  var api = {
    init: init,
    calculate: calculate,
    calculateWindow: calculateWindow,
    calculateLouver: calculateLouver,
    calculateMirror: calculateMirror,
    findProduct: findProduct,
    CITIES: CITIES,
  };

  return api;
});
