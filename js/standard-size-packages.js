/**
 * Standard Size Package Cards — all product categories
 * Live rates from products.json / mirror.json — never hardcoded ₹.
 * Premium look via CSS only (no images / heavy assets).
 */
(function (root) {
  'use strict';

  var ECONOMY_WINDOW_SIZES = [
    { w: 5, h: 4 }, { w: 4, h: 4 }, { w: 6, h: 6 }, { w: 6, h: 5 }
  ];
  var PREMIUM_WINDOW_SIZES = [
    { w: 7, h: 7 }, { w: 8, h: 8 }, { w: 6, h: 8 }, { w: 10, h: 8 }, { w: 12, h: 8 }
  ];
  var SHOWER_HEIGHT = 7;
  var SHOWER_WIDTHS = [4, 5, 6, 7];
  var SHOWER_DOOR_FT = 2.5;
  var LOUVER_SIZES = [{ w: 8, h: 4 }, { w: 10, h: 6 }, { w: 12, h: 8 }];
  var PERGOLA_FOOTPRINTS = [
    { w: 10, l: 10 }, { w: 12, l: 12 }, { w: 12, l: 15 }, { w: 15, l: 25 },
    { w: 35, l: 45 }, { w: 6, l: 25 }
  ];
  var PERGOLA_CLEARANCE_FT = [9, 9.5, 10];
  var BALCONY_LOUVER_SIZES = [
    { w: 8, h: 3 }, { w: 10, h: 3 }, { w: 12, h: 3.5 }, { w: 14, h: 3.5 }, { w: 16, h: 4 }
  ];
  var FACADE_LOUVER_SIZES = [
    { w: 8, h: 10 }, { w: 10, h: 12 }, { w: 12, h: 14 }, { w: 15, h: 18 }, { w: 20, h: 24 }
  ];
  var CURVED_LOUVER_SIZES = [
    { w: 6, h: 8 }, { w: 8, h: 10 }, { w: 10, h: 12 }, { w: 12, h: 16 }
  ];
  var CLAD_FACADE_BANDS = [
    { w: 10, h: 10 }, { w: 12, h: 10 }, { w: 15, h: 12 }, { w: 20, h: 12 }, { w: 25, h: 15 }
  ];
  var DUCT_SHAFT_WIDTHS_FT = [2, 3, 3.5, 4, 4.5];
  var DUCT_FLOOR_HEIGHT_FT = 12;
  var DUCT_MAX_FLOORS = 5;
  var DUCT_WALL_MM = '1.5';
  var CASEMENT_WINDOW_SIZES = [
    { w: 1.5, h: 3 }, { w: 2, h: 4 }, { w: 2.5, h: 5 }, { w: 3, h: 5 },
    { w: 3, h: 6 }, { w: 2, h: 6 }, { w: 3, h: 8 }
  ];
  var ENTRANCE_HEIGHTS = [6.5, 7, 8, 9];
  var ENTRANCE_SINGLE_WIDTHS = [2.5, 3];
  var ENTRANCE_DUAL_WIDTHS = [4, 5, 6];
  var DOOR_CLOSER_INR = 3500;
  var FLOOR_SPRING_INR = 5000;
  var TELESCOPE_HEIGHTS = [7, 8, 9, 20];
  var TELESCOPE_WIDTHS = [6, 7, 8, 9, 10, 12, 14, 15, 18, 20];
  var FOLD_HEIGHTS = [7, 8, 9, 10];
  var FOLD_WIDTHS = [6, 7, 8, 9, 10, 12, 14, 15, 18, 20];
  var RAILING_LENGTHS = [8, 10, 12, 14, 16, 18, 20];
  var RAILING_HEIGHTS_RES = [2, 2.5, 3, 3.5];
  var RAILING_HEIGHT_COMM = 4;
  var MIRROR_SIZES = [
    { w: 1.5, h: 2 }, { w: 2, h: 2 }, { w: 2.5, h: 3 }
  ];

  var CSS_HREF = '/css/standard-size-packages.css?v=20260728i';
  var MIRROR_JSON = '/data/mirror.json';
  var RATES_JSON = '/data/rates.json';
  var cachedRates = null;

  function setRates(r) { cachedRates = r || null; }
  function getRatesSync() { return cachedRates; }
  function ensureRates() {
    if (cachedRates) return Promise.resolve(cachedRates);
    if (typeof fetch === 'undefined') return Promise.resolve(null);
    return fetch(RATES_JSON).then(function (r) { return r.json(); }).then(function (data) {
      cachedRates = data;
      return data;
    }).catch(function () { return null; });
  }
  function clearanceFactor(clearanceFt) {
    return (Number(clearanceFt) || 9) / 9;
  }

  function fmtINR(n) {
    if (typeof root.formatPriceFromINR === 'function') return root.formatPriceFromINR(n);
    return '\u20B9' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  }
  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function sizeLabel(sz) { return sz.w + '\u00d7' + sz.h + ' ft'; }

  function ensureCss() {
    if (document.getElementById('wm-std-pkg-css')) return;
    var link = document.createElement('link');
    link.id = 'wm-std-pkg-css';
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    document.head.appendChild(link);
  }

  function isEconomyWindow(product) {
    return product && product.id === '3track-sliding';
  }
  function isPremiumSliding(product) {
    return product && product.category === 'aluminium-windows' && !isEconomyWindow(product) &&
      isSlidingWindow(product) && !isSwingDoorProduct(product);
  }
  function isPremiumWindow(product) { return isPremiumSliding(product); }
  function isEntranceDoorProduct(product) {
    if (!product) return false;
    return /slim-entrance|french-georgian|georgian-grill/.test(product.id || '');
  }
  function isSwingDoorProduct(product) {
    if (!product || product.category !== 'aluminium-windows') return false;
    if (isEconomyWindow(product) || isSlidingWindow(product)) return false;
    if (product.id === 'full-elevation-villa-facade' || product.id === '2track-french') return false;
    return isCasementLike(product) || isEntranceDoorProduct(product);
  }
  function needsCompositeLayout(w, h) {
    if ((w === 3 && h >= 6) || (w === 2 && h >= 6) || (w === 3 && h === 8)) return true;
    return w * h >= 18 && w >= 2.5;
  }
  function isSlidingWindow(product) {
    if (!product) return false;
    if (product.id === '3track-sliding') return true;
    var sub = String(product.subcategory || '').toLowerCase();
    return sub === 'sliding' || /sliding/.test(product.id || '');
  }
  function isCasementLike(product) {
    var sub = String(product.subcategory || '').toLowerCase();
    var id = String(product.id || '');
    return sub === 'casement' || /casement|slimline|georgian-bar-openable/.test(id);
  }

  function getThreeTrackAdder(product) {
    if (!product || !product.rates) return 0;
    var rates = product.rates;
    if (rates.trackOptions && rates.trackOptions['3track'] != null) {
      return Number(rates.trackOptions['3track']) || 0;
    }
    var m = rates.mesh;
    if (typeof m === 'number' && m > 0) return m;
    if (m && typeof m === 'object') {
      if (isCasementLike(product) && m.openable) return Number(m.openable) || 0;
      if (m.standard) return Number(m.standard) || 0;
      if (m.openable) return Number(m.openable) || 0;
      if (m.security) return Number(m.security) || 0;
    }
    return 0;
  }
  function supportsMeshOrThreeTrack(product) {
    return !!(product && (product.id === '3track-sliding' || getThreeTrackAdder(product) > 0));
  }

  /** glassMm: 6 economy · 8 premium */
  function priceWindow(product, w, h, withMesh, glassMm) {
    var rates = product.rates || {};
    var area = w * h;
    var base = Number(rates.baseRate) || 0;
    var hw = Number(rates.hardwareCost) || 0;
    var glass = rates.glass || {};
    var gKey = String(glassMm || 6) + 'mm';
    var glassExtra = Number(glass[gKey]) || 0;
    var rate = base + (withMesh ? getThreeTrackAdder(product) : 0);
    return round2(rate * area + hw + glassExtra * area);
  }

  function priceAreaBase(product, w, h) {
    var rates = product.rates || {};
    var area = w * h;
    var base = Number(rates.baseRate) || 0;
    var hw = Number(rates.hardwareCost) || 0;
    return round2(base * area + hw);
  }

  function priceShower(product, w, h, mode) {
    var rates = product.rates || {};
    var area = w * h;
    var id = product.id;
    var doorCount = 1;
    mode = mode || 'hinged';
    if (id === 'frameless-shower-partition') {
      var block = (mode === 'sliding' ? rates.sliding : rates.hinged) || rates.hinged || {};
      var glassRate = Number(block.glassRate) || 0;
      var hwMap = block.hardware || {};
      var hw = Number(hwMap['mill-finish']) || Number(hwMap.black) || 0;
      return round2(area * glassRate + hw * doorCount);
    }
    if (id === 'premium-black-profile-shower') {
      return round2(area * (Number(rates.glassRate) || 0) + (Number(rates.hardwarePerDoor) || 0));
    }
    if (id === 'black-profile-shower-partition') {
      var slidingHw = (rates.hardware && rates.hardware.sliding) || {};
      var hwRate = Number(slidingHw['matt-black']) || Number(slidingHw['mill-finish']) || 0;
      return round2(area * (Number(rates.baseGlassRate) || 0) + hwRate);
    }
    if (id === 'frosted-glass-bathroom-door') {
      return round2(area * (Number(rates.baseRate) || 0) + (Number(rates.hardwarePerSet) || 0));
    }
    if (id === 'slim-gold-profile-fluted-shower') {
      return round2(area * (Number(rates.baseRate) || 0) + (Number(rates.hardwarePerDoor) || 0));
    }
    return round2(area * (Number(rates.glassRate || rates.baseRate) || 0) + (Number(rates.hardwarePerDoor || rates.hardwarePerSet) || 0));
  }

  function priceRailing(product, lengthFt, heightFt, variant) {
    var rates = product.rates || {};
    heightFt = heightFt || 3.5;
    variant = variant || 'bottom_heavy';
    var wastage = product.id === 'glass-railing-staircase' ? (Number(rates.glassWastagePercent) || 20) : 0;
    var glassRate = Number(rates.glass && rates.glass['12mm']) || 0;
    var area = lengthFt * heightFt;
    var glassCost = area * (1 + wastage / 100) * glassRate;
    var bottomCost = 0;
    var pillarCost = 0;
    var heavyBottom = (rates.bottomProfiles && rates.bottomProfiles[0]) || null;
    var hand = null;
    if (rates.handrails) {
      for (var hi = 0; hi < rates.handrails.length; hi++) {
        if (rates.handrails[hi].id === 'al_25x25') { hand = rates.handrails[hi]; break; }
      }
      if (!hand) hand = rates.handrails[2] || rates.handrails[0];
    }
    if (variant === 'pillar' || variant === 'stair_pillar') {
      var pillar = (rates.pillarBrackets && rates.pillarBrackets[0]) || null;
      var qty = Math.max(3, Math.ceil(lengthFt / 2.5));
      pillarCost = ((Number(pillar && pillar.baseRate) || 0)) * qty;
    } else if (heavyBottom) {
      bottomCost = (Number(heavyBottom.baseRate) || 0) * lengthFt;
    }
    var handCost = (Number(hand && hand.baseRate) || 0) * lengthFt;
    var misc = ((Number(rates.hardwarePackagePerRft) || 0) +
      (Number(rates.anchorBoltPerRft) || 0) +
      (Number(rates.installationPerRft) || 0)) * lengthFt;
    return round2(glassCost + bottomCost + pillarCost + handCost + misc);
  }

  function getPanelConfigForWidth(widthFt, mode) {
    if (widthFt <= 0) return mode === 'telescopic' ? '2+1' : '2+1';
    if (widthFt < 5) return mode === 'telescopic' ? '1+1' : '2+1';
    if (widthFt <= 6) return '2+1';
    if (widthFt <= 8.5) return '3+1';
    if (widthFt <= 10) return '2+2';
    if (widthFt <= 12) return '3+1';
    if (widthFt <= 15) return mode === 'fold' ? '3+3' : '3+1';
    if (widthFt <= 20) return '5+1';
    return 'custom';
  }

  function priceFoldDoor(product, w, h, panelConfig) {
    var rates = product.rates || {};
    var area = w * h;
    var frameRate = Number(rates.frameRate || rates.baseRate) || 1155;
    var glassRates = rates.glass || {};
    var glassRate = Number(glassRates['8mm-clear']) || 495;
    var panelCosts = rates.panelConfig || {};
    var hw = Number(panelCosts[panelConfig]) || Number(panelCosts['2+1']) || 27500;
    return round2(area * frameRate + area * glassRate + hw);
  }

  function priceTelescopeDoor(product, w, h, panelConfig) {
    var rates = product.rates || {};
    var area = w * h;
    var base = Number(rates.baseRate) || 0;
    var panelCosts = rates.panelConfig || {};
    var hw = Number(panelCosts[panelConfig]) || Number(panelCosts['2+1']) || 8264;
    return round2(area * base + hw);
  }

  function priceCasementSwing(product, w, h, opts) {
    opts = opts || {};
    var rates = product.rates || {};
    var base = Number(rates.baseRate) || 0;
    var hwSingle = Number(rates.hardwareCost) || 0;
    var doorCount = opts.doorCount || 1;
    var composite = !!opts.composite;
    var withMesh = !!opts.withMesh;
    var meshRate = Number(rates.mesh && rates.mesh.openable) || 407;
    var areaCost;
    if (composite) {
      var fixedW = w / 2;
      var doorW = w / 2;
      areaCost = base * (fixedW * h) + base * (doorW * h) + hwSingle * doorCount;
    } else {
      areaCost = base * (w * h) + hwSingle * doorCount;
    }
    var meshExtra = withMesh ? meshRate * (w * h) : 0;
    var hwAddon = 0;
    if (opts.hardwareAddon === 'closer') hwAddon = DOOR_CLOSER_INR * doorCount;
    else if (opts.hardwareAddon === 'floor-spring') hwAddon = FLOOR_SPRING_INR * doorCount;
    return round2(areaCost + meshExtra + hwAddon);
  }

  function hardwareAddonLabel(key) {
    if (key === 'closer') return 'Door closer (90\u00b0 hold-open)';
    if (key === 'floor-spring') return 'Floor spring (hydraulic)';
    return 'Standard friction stay';
  }

  function swingTitle(product, w, h, opts) {
    var series = seriesShortName(product);
    var size = sizeLabel({ w: w, h: h });
    if (opts.kind === 'entrance') {
      var doors = opts.doorCount > 1 ? 'Dual swing ' + w + ' ft' : 'Single swing ' + w + ' ft';
      return series + ' ' + doors + ' \u00d7 ' + h + ' ft \u00b7 ' + hardwareAddonLabel(opts.hardwareAddon);
    }
    if (opts.composite) {
      return series + ' ' + size + ' Half fixed + half top-hung \u00b7 6mm';
    }
    if (opts.withMesh) return series + ' ' + size + ' With openable mesh \u00b7 6mm';
    return series + ' ' + size + ' Top hung / side swing \u00b7 6mm';
  }

  function priceCladding(product, sqft) {
    var rates = product.rates || {};
    if (rates.brands && rates.brands.greenlam) {
      return round2(sqft * (Number(rates.brands.greenlam.ratePerSqft) || 0) + sqft * (Number(rates.installation && rates.installation.facade && rates.installation.facade.ratePerSqft) || 0));
    }
    if (rates.commercial && rates.commercial['4mm']) {
      return round2(sqft * (Number(rates.commercial['4mm'].plain) || 0));
    }
    return round2(sqft * (Number(rates.baseRate) || 500));
  }

  function priceMirror(bevelCfg, w, h, withProfile, withLed) {
    var sqft = w * h;
    var bevel = Number(bevelCfg.bevel) || 0;
    var profileAdd = Number(bevelCfg.profileAdd) || 0;
    var led = Number(bevelCfg.ledV120) || 0;
    var total = sqft * bevel;
    if (withProfile) total += sqft * profileAdd;
    if (withLed) total += sqft * led;
    return round2(total);
  }

  function pricePergolaGlass(rates, w, l, clearanceFt, lineId) {
    rates = rates || cachedRates || {};
    var area = w * l;
    var catalog = rates.pergola_catalog || {};
    var lines = catalog.lines || [];
    var line = lines.length ? lines[0] : null;
    var want = lineId || 'fixed_aluminium_glass';
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].id === want) { line = lines[i]; break; }
    }
    var structRate = line ? Number(line.aluminium_structure_per_sqft) : Number(rates.base_pergola_per_sqft) || 1178;
    var glassRates = rates.glass_unit_rates_per_sqft || {};
    var glassRate = Number(glassRates['10mm_clr']) || 219;
    var coat = (rates.coating_price && rates.coating_price.plain) ? Number(rates.coating_price.plain) : 106;
    return round2(area * (structRate + glassRate + coat) * clearanceFactor(clearanceFt));
  }

  function priceDuctShaftZ(rates, widthFt, floors, wallMm, withTrap) {
    rates = rates || cachedRates || {};
    var cfg = rates.duct_shaft_z_louvers || {};
    var rateMap = cfg.package_rate_per_sqft || {};
    var mm = String(wallMm || DUCT_WALL_MM);
    var rate = Number(rateMap[mm]) || Number(rateMap['1.5']) || 631;
    var floorCount = Number(floors) || 1;
    var height = floorCount * DUCT_FLOOR_HEIGHT_FT;
    var area = widthFt * height;
    var total = area * rate;
    var trapRate = Number(cfg.trap_door_per_floor_inr) || 11800;
    if (withTrap) total += floorCount * trapRate;
    return round2(total);
  }

  function mirrorLedRate(cfg, led) {
    if (led === 'v220') {
      if (cfg.v220 != null) return Number(cfg.v220);
      return (Number(cfg.v120) || 0) + (Number(cfg.v220Extra) || 0);
    }
    return Number(cfg.v120) || 0;
  }

  function priceMirrorCatalog(mode, cfg, w, h, variant) {
    variant = variant || {};
    var sqft = w * h;
    if (mode === 'bevel-modular') {
      return priceMirror(cfg, w, h, !!variant.profile, !!(variant.ledV120 || variant.led));
    }
    var rate = mirrorLedRate(cfg, variant.led || 'v120');
    return round2(sqft * rate);
  }

  function seriesShortName(product) {
    var id = product.id || '';
    var name = String(product.name || '').replace(/\s+/g, ' ').trim();
    if (id === '3track-sliding') return '27mm Domal';
    if (id === '29mm-sliding') return '29mm Premium';
    if (id === 'system-sliding-30mm') return '30mm System Sliding';
    if (id === 'system-sliding-31mm') return '31mm System Sliding';
    if (id === 'system-sliding-35mm-gulf') return '35mm Gulf Sliding';
    if (id === 'system-sliding-40mm-minimal') return '40mm Minimal Sliding';
    if (id === 'system-sliding-31mm-glass') return '31mm Glass System Sliding';
    if (id === 'system-casement-50mm-euro-guide') return '50mm Euro Casement Guide';
    if (id === 'system-casement-52mm-gulf-brands') return '52mm Gulf Brands Casement';
    if (id === 'system-casement-50mm-euro') return '50mm Euro Casement';
    if (id === 'system-casement-52mm-gulf-slim') return '52mm Gulf Slim Casement';
    if (id === 'system-casement-50mm-euro-villa') return '50mm Euro Villa Casement';
    if (id === 'top-hung-casement') return 'Top Hung Casement';
    if (/slimline/.test(id)) return 'Slimline Casement';
    if (/french|georgian/.test(id)) return name ? name.slice(0, 42) : 'French / Georgian';
    if (/slim-entrance/.test(id)) return 'Slim Entrance Door';
    if (/full-elevation/.test(id)) return 'Full Elevation';
    if (/louver|fold|telescopic|railing|hpl|acp/.test(id)) return (name || id).slice(0, 42);
    return (name || id || 'Product').slice(0, 42);
  }

  function isDomalTrackProduct(product) {
    return !!(product && product.id === '3track-sliding' && product.rates && product.rates.trackOptions);
  }

  function windowSeoTitle(product, sz, withMesh, glassMm) {
    var series = seriesShortName(product);
    var size = sizeLabel(sz);
    var glass = glassMm + 'mm Clear Tuff';
    // Only Domal uses literal 2-track / 3-track SKU language
    if (isDomalTrackProduct(product)) {
      return withMesh
        ? '3 Track ' + series + ' Sliding Window ' + size + ' With Mesh · ' + glass
        : '2 Track ' + series + ' Sliding Window ' + size + ' Without Mesh · ' + glass;
    }
    if (isSlidingWindow(product)) {
      return withMesh
        ? series + ' Sliding Window ' + size + ' With Mesh · ' + glass
        : series + ' Sliding Window ' + size + ' Without Mesh · ' + glass;
    }
    if (isCasementLike(product)) {
      return withMesh
        ? series + ' Window ' + size + ' With Openable Mesh · ' + glass
        : series + ' Window ' + size + ' Without Mesh · ' + glass;
    }
    return withMesh
      ? series + ' ' + size + ' With Mesh · ' + glass
      : series + ' ' + size + ' Without Mesh · ' + glass;
  }

  function showerModes(product) {
    var id = product.id;
    if (id === 'frameless-shower-partition') return ['hinged', 'sliding'];
    if (id === 'premium-black-profile-shower') return ['hinged'];
    if (id === 'black-profile-shower-partition') return ['sliding'];
    if (id === 'slim-gold-profile-fluted-shower') return ['hinged', 'sliding'];
    if (id === 'frosted-glass-bathroom-door') return ['fold-slide'];
    return ['hinged'];
  }
  function isProfileShower(product) { return product.id !== 'frameless-shower-partition'; }
  function showerLayoutCopy(mode, w) {
    if (mode === 'sliding') {
      var half = round2(w / 2);
      return 'Sliding half\u2013half (' + half + ' + ' + half + ' ft)';
    }
    if (mode === 'fold-slide') return 'Fold & slide';
    return 'Hinged ' + SHOWER_DOOR_FT + ' ft door + ' + round2(Math.max(0, w - SHOWER_DOOR_FT)) + ' ft fixed';
  }
  function showerSeoTitle(product, sz, mode) {
    var names = {
      'frameless-shower-partition': 'Frameless Shower Partition',
      'premium-black-profile-shower': 'Black Profile Shower Partition',
      'black-profile-shower-partition': 'Black Profile Sliding Shower',
      'slim-gold-profile-fluted-shower': 'Gold Profile Shower Partition',
      'frosted-glass-bathroom-door': 'Fold & Slide Bathroom Door'
    };
    var base = names[product.id] || (product.name || 'Shower').slice(0, 40);
    var profile = isProfileShower(product) ? 'With Profile' : 'Frameless';
    var size = sizeLabel(sz);
    if (mode === 'sliding') return base + ' ' + size + ' Sliding Half-Half \u00b7 10mm \u00b7 ' + profile;
    if (mode === 'fold-slide') return base + ' ' + size + ' Fold & Slide \u00b7 10mm';
    return base + ' ' + size + ' Hinged 2.5 ft Door \u00b7 10mm \u00b7 ' + profile;
  }

  function buildWindowPackages(product) {
    if (isSwingDoorProduct(product)) return buildSwingDoorPackages(product);
    var list = [];
    var premium = isPremiumSliding(product);
    var sizes = premium ? PREMIUM_WINDOW_SIZES : ECONOMY_WINDOW_SIZES;
    var glassMm = premium ? 8 : 6;
    var meshOk = supportsMeshOrThreeTrack(product);
    sizes.forEach(function (sz) {
      list.push({
        kind: 'window', size: sz, withMesh: false, glassMm: glassMm,
        amount: priceWindow(product, sz.w, sz.h, false, glassMm),
        title: windowSeoTitle(product, sz, false, glassMm),
        specs: (premium ? 'Premium series \u00b7 ' : 'Economy Domal \u00b7 ') +
          (isDomalTrackProduct(product) && meshOk ? '2 track without mesh \u00b7 ' : (meshOk ? 'Without mesh \u00b7 ' : '')) +
          glassMm + 'mm clear tuff \u00b7 Standard powder coat'
      });
      if (meshOk) {
        list.push({
          kind: 'window', size: sz, withMesh: true, glassMm: glassMm,
          amount: priceWindow(product, sz.w, sz.h, true, glassMm),
          title: windowSeoTitle(product, sz, true, glassMm),
          specs: (premium ? 'Premium series \u00b7 ' : 'Economy Domal \u00b7 ') +
            (isDomalTrackProduct(product)
              ? '3 track with mesh \u00b7 '
              : (isCasementLike(product) ? 'With openable mesh \u00b7 ' : 'With mesh \u00b7 ')) +
            glassMm + 'mm clear tuff \u00b7 Standard powder coat'
        });
      }
    });
    return list;
  }

  function buildSwingDoorPackages(product) {
    var list = [];
    var meshOk = !!(product.rates && product.rates.mesh && product.rates.mesh.openable);
    if (isEntranceDoorProduct(product)) {
      ENTRANCE_HEIGHTS.forEach(function (h) {
        ENTRANCE_SINGLE_WIDTHS.forEach(function (w) {
          ['none', 'closer', 'floor-spring'].forEach(function (hw) {
            var opts = { kind: 'entrance', doorCount: 1, hardwareAddon: hw, composite: false, withMesh: false };
            list.push({
              kind: 'swing', size: { w: w, h: h }, doorCount: 1, hardwareAddon: hw, withMesh: false,
              amount: priceCasementSwing(product, w, h, opts),
              title: swingTitle(product, w, h, opts),
              specs: 'Swing door (not sliding) \u00b7 6mm clear tuff \u00b7 ' + hardwareAddonLabel(hw) +
                (hw === 'closer' ? ' \u00b7 Auto 90\u00b0 stop included' : '')
            });
          });
        });
        ENTRANCE_DUAL_WIDTHS.forEach(function (w) {
          ['none', 'closer'].forEach(function (hw) {
            var opts = { kind: 'entrance', doorCount: 2, hardwareAddon: hw, composite: false, withMesh: false };
            list.push({
              kind: 'swing', size: { w: w, h: h }, doorCount: 2, hardwareAddon: hw, withMesh: false,
              amount: priceCasementSwing(product, w, h, opts),
              title: swingTitle(product, w, h, opts),
              specs: 'Dual swing doors \u00b7 6mm clear tuff \u00b7 ' + hardwareAddonLabel(hw) +
                ' \u00d7 2 doors'
            });
          });
        });
      });
      return list;
    }
    CASEMENT_WINDOW_SIZES.forEach(function (sz) {
      var composite = needsCompositeLayout(sz.w, sz.h);
      var baseOpts = { kind: 'casement', composite: composite, withMesh: false, doorCount: 1, hardwareAddon: 'none' };
      list.push({
        kind: 'swing', size: sz, withMesh: false, composite: composite,
        amount: priceCasementSwing(product, sz.w, sz.h, baseOpts),
        title: swingTitle(product, sz.w, sz.h, baseOpts),
        specs: composite
          ? 'Half fixed lite + half top-hung / side swing \u00b7 6mm clear tuff'
          : 'Top hung / side swing casement \u00b7 6mm clear tuff \u00b7 Standard powder coat'
      });
      if (meshOk) {
        var meshOpts = { kind: 'casement', composite: composite, withMesh: true, doorCount: 1, hardwareAddon: 'none' };
        list.push({
          kind: 'swing', size: sz, withMesh: true, composite: composite,
          amount: priceCasementSwing(product, sz.w, sz.h, meshOpts),
          title: swingTitle(product, sz.w, sz.h, meshOpts),
          specs: (composite ? 'Half fixed + half openable \u00b7 ' : '') + 'With openable mesh \u00b7 6mm clear tuff'
        });
      }
    });
    return list;
  }

  function buildShowerPackages(product) {
    var list = [];
    var modes = showerModes(product);
    SHOWER_WIDTHS.forEach(function (w) {
      var sz = { w: w, h: SHOWER_HEIGHT };
      modes.forEach(function (mode) {
        list.push({
          kind: 'shower', size: sz, mode: mode, withMesh: false,
          amount: priceShower(product, sz.w, sz.h, mode),
          title: showerSeoTitle(product, sz, mode),
          specs: showerLayoutCopy(mode, w) + ' \u00b7 10mm clear toughened \u00b7 Straight'
        });
      });
    });
    return list;
  }

  function buildLouverPackages(product) {
    var id = product.id || '';
    if (id === 'ceiling-pergola-louvers') return buildPergolaLouverPackages(product);
    var sizes = LOUVER_SIZES;
    if (id === 'louver-canopy-facade') sizes = BALCONY_LOUVER_SIZES;
    else if (id === 'wooden-finish-aluminium-louvers') sizes = FACADE_LOUVER_SIZES;
    else if (id === 'curved-architectural-louvers') sizes = CURVED_LOUVER_SIZES;

    var list = sizes.map(function (sz) {
      var label = id === 'louver-canopy-facade'
        ? 'Balcony / canopy side ' + sizeLabel(sz)
        : seriesShortName(product) + ' ' + sizeLabel(sz);
      return {
        kind: 'louver', size: sz, withMesh: false,
        amount: priceAreaBase(product, sz.w, sz.h),
        title: label + ' Package',
        specs: 'Live calculator rate \u00b7 Wooden / powder coat options in calculator'
      };
    });
    if (id === 'louver-canopy-facade') {
      list = list.concat(buildDuctShaftZPackages());
    }
    return list;
  }

  function buildPergolaLouverPackages(product) {
    var list = [];
    PERGOLA_FOOTPRINTS.forEach(function (fp) {
      PERGOLA_CLEARANCE_FT.forEach(function (cl) {
        list.push({
          kind: 'pergola-louver',
          size: { w: fp.w, h: fp.l, clearance: cl },
          withMesh: false,
          amount: round2(priceAreaBase(product, fp.w, fp.l) * clearanceFactor(cl)),
          title: seriesShortName(product) + ' ' + fp.w + '\u00d7' + fp.l + ' ft \u00b7 ' + cl + ' ft clearance',
          specs: '25\u00d775 ceiling louver pergola \u00b7 ' + cl + ' ft standard clearance \u00b7 Live calculator rate'
        });
      });
    });
    return list;
  }

  function buildDuctShaftZPackages() {
    var list = [];
    var rates = cachedRates;
    if (!rates || !rates.duct_shaft_z_louvers) return list;
    DUCT_SHAFT_WIDTHS_FT.forEach(function (w) {
      for (var f = 1; f <= DUCT_MAX_FLOORS; f++) {
        [
          { trap: false, label: 'Z louvers only' },
          { trap: true, label: 'Z louvers + 1 trap door per floor' }
        ].forEach(function (opt) {
          list.push({
            kind: 'duct-shaft',
            size: { w: w, h: f * DUCT_FLOOR_HEIGHT_FT, floors: f },
            ductTrap: opt.trap,
            withMesh: false,
            amount: priceDuctShaftZ(rates, w, f, DUCT_WALL_MM, opt.trap),
            title: 'Pipe / duct shaft ' + w + ' ft wide \u00d7 ' + f + ' floor (' + (f * DUCT_FLOOR_HEIGHT_FT) + ' ft)',
            specs: opt.label + ' \u00b7 ' + DUCT_WALL_MM + ' mm Z louver \u00b7 12 ft/floor \u00b7 Live rates'
          });
        });
      }
    });
    return list;
  }

  function buildPergolaGlassPackages(rates, lineId) {
    var list = [];
    if (!rates) return list;
    PERGOLA_FOOTPRINTS.forEach(function (fp) {
      PERGOLA_CLEARANCE_FT.forEach(function (cl) {
        list.push({
          kind: 'pergola-glass',
          size: { w: fp.w, h: fp.l, clearance: cl },
          pergolaLine: lineId || 'fixed_aluminium_glass',
          withMesh: false,
          amount: pricePergolaGlass(rates, fp.w, fp.l, cl, lineId),
          title: 'Pergola ' + fp.w + '\u00d7' + fp.l + ' ft \u00b7 ' + cl + ' ft clearance \u00b7 glass roof',
          specs: 'Aluminium structure + 10mm toughened roof + plain powder coat \u00b7 Live pergola rates'
        });
      });
    });
    return list;
  }

  function buildFoldPackages(product) {
    var list = [];
    FOLD_HEIGHTS.forEach(function (h) {
      FOLD_WIDTHS.forEach(function (w) {
        var cfg = getPanelConfigForWidth(w, 'fold');
        list.push({
          kind: 'fold', size: { w: w, h: h }, panelConfig: cfg, withMesh: false,
          amount: priceFoldDoor(product, w, h, cfg),
          title: seriesShortName(product) + ' ' + w + '\u00d7' + h + ' ft \u00b7 ' + cfg + ' fold set',
          specs: cfg + ' hardware (live rates incl. +10% hardware) \u00b7 8mm clear tuff \u00b7 Frame + glass + set'
        });
      });
    });
    return list;
  }

  function buildTelescopePackages(product) {
    var list = [];
    TELESCOPE_HEIGHTS.forEach(function (h) {
      TELESCOPE_WIDTHS.forEach(function (w) {
        var cfg = getPanelConfigForWidth(w, 'telescopic');
        list.push({
          kind: 'telescope', size: { w: w, h: h }, panelConfig: cfg, withMesh: false,
          amount: priceTelescopeDoor(product, w, h, cfg),
          title: seriesShortName(product) + ' ' + w + '\u00d7' + h + ' ft \u00b7 ' + cfg + ' telescopic',
          specs: cfg + ' soft-close stack \u00b7 8mm clear tuff in base \u00b7 Imported slim profile'
        });
      });
    });
    return list;
  }

  function buildRailingPackages(product) {
    var list = [];
    var isStair = product.id === 'glass-railing-staircase';
    var variants = isStair
      ? [{ id: 'stair_pillar', label: 'SS pillar on treads \u00b7 25\u00d725 handrail' }]
      : [
        { id: 'bottom_heavy', label: '121\u00d745 heavy bottom rail \u00b7 parapet wall' },
        { id: 'pillar', label: 'Heavy SS pillar brackets \u00b7 open edge' }
      ];
    RAILING_LENGTHS.forEach(function (len) {
      RAILING_HEIGHTS_RES.forEach(function (h) {
        variants.forEach(function (v) {
          list.push({
            kind: 'railing', size: { w: len, h: h }, railingVariant: v.id, withMesh: false,
            amount: priceRailing(product, len, h, v.id),
            title: seriesShortName(product) + ' ' + h + ' ft glass \u00d7 ' + len + ' ft run \u00b7 12mm',
            specs: v.label + ' \u00b7 Glass area ' + (len * h).toFixed(1) + ' sq.ft \u00b7 Live calculator rate'
          });
        });
      });
      if (!isStair) {
        list.push({
          kind: 'railing', size: { w: len, h: RAILING_HEIGHT_COMM }, railingVariant: 'commercial',
          amount: priceRailing(product, len, RAILING_HEIGHT_COMM, 'bottom_heavy'),
          title: seriesShortName(product) + ' ' + RAILING_HEIGHT_COMM + ' ft commercial \u00d7 ' + len + ' ft \u00b7 12mm',
          specs: 'Commercial facade (no parapet) \u00b7 121\u00d745 heavy bottom \u00b7 4 ft glass height'
        });
      }
    });
    return list;
  }

  function buildCladdingPackages(product) {
    return CLAD_FACADE_BANDS.map(function (sz) {
      var sqft = sz.w * sz.h;
      return {
        kind: 'cladding', size: { w: sz.w, h: sz.h }, areaSqft: sqft, withMesh: false,
        amount: priceCladding(product, sqft),
        title: seriesShortName(product) + ' ' + sz.w + '\u00d7' + sz.h + ' ft (' + sqft + ' sq.ft)',
        specs: 'Facade elevation band \u00b7 Supply + typical install \u00b7 Live rate from products.json'
      };
    });
  }

  function buildMirrorCatalogPackages(mode, cfg) {
    var list = [];
    var presets = cfg.presetSizes;
    if (!presets || !presets.length) {
      presets = MIRROR_SIZES.map(function (s) { return [s.w, s.h]; });
    }
    presets.forEach(function (pair) {
      var w = pair[0];
      var h = pair[1];
      if (mode === 'bevel-modular') {
        [
          { profile: false, led: false },
          { profile: true, led: false },
          { profile: false, led: true },
          { profile: true, led: true }
        ].forEach(function (v) {
          var bits = [];
          bits.push(v.profile ? 'With Profile' : 'Without Profile');
          bits.push(v.led ? 'With LED' : 'Without LED');
          list.push({
            kind: 'mirror', size: { w: w, h: h }, withProfile: v.profile, withLed: v.led, withMesh: false,
            amount: priceMirror(cfg, w, h, v.profile, v.led),
            title: 'Mirror ' + w + '\u00d7' + h + ' ft \u00b7 ' + bits.join(' \u00b7 '),
            specs: 'Bevel modular \u00b7 Live page rates \u00b7 ' + bits.join(' \u00b7 ')
          });
        });
        return;
      }
      list.push({
        kind: 'mirror', size: { w: w, h: h }, withProfile: false, withLed: true, withMesh: false,
        amount: priceMirrorCatalog(mode, cfg, w, h, { led: 'v120' }),
        title: 'Mirror ' + w + '\u00d7' + h + ' ft \u00b7 V120 LED',
        specs: 'Live calculator rate on this page \u00b7 Standard V120 LED band'
      });
    });
    return list;
  }

  function buildMirrorPackages(bevelCfg) {
    var list = [];
    MIRROR_SIZES.forEach(function (sz) {
      [
        { profile: false, led: false },
        { profile: true, led: false },
        { profile: false, led: true },
        { profile: true, led: true }
      ].forEach(function (v) {
        var bits = [];
        bits.push(v.profile ? 'With Profile' : 'Without Profile');
        bits.push(v.led ? 'With LED' : 'Without LED');
        list.push({
          kind: 'mirror', size: sz, withProfile: v.profile, withLed: v.led, withMesh: false,
          amount: priceMirror(bevelCfg, sz.w, sz.h, v.profile, v.led),
          title: 'LED Mirror ' + sizeLabel(sz) + ' \u00b7 ' + bits.join(' \u00b7 '),
          specs: 'Bevel modular package \u00b7 Live mirror rates \u00b7 ' + bits.join(' \u00b7 ')
        });
      });
    });
    return list;
  }

  function buildPackages(product) {
    if (!product) return [];
    var cat = product.category;
    if (cat === 'aluminium-windows') return buildWindowPackages(product);
    if (cat === 'shower-partitions') return buildShowerPackages(product);
    if (cat === 'metal-louvers') return buildLouverPackages(product);
    if (cat === 'folding-systems') return buildFoldPackages(product);
    if (cat === 'telescope-windows') return buildTelescopePackages(product);
    if (cat === 'glass-railing') return buildRailingPackages(product);
    if (cat === 'elevation-cladding') return buildCladdingPackages(product);
    return [];
  }

  function buildSnap(product, pkg, calcEl) {
    var sz = pkg.size || {};
    var area = pkg.areaSqft != null ? pkg.areaSqft : (sz.w * sz.h);
    var amount = pkg.amount;
    var catMap = {
      'aluminium-windows': 'Aluminium Windows',
      'shower-partitions': 'Shower Partitions',
      'metal-louvers': 'Metal Louvers',
      'folding-systems': 'Folding Systems',
      'telescope-windows': 'Telescope Windows',
      'glass-railing': 'Glass Railing',
      'elevation-cladding': 'Elevation Cladding',
      'mirror-profiles': 'Mirror Profiles'
    };
    var category = (product && catMap[product.category]) || (pkg.kind === 'mirror' ? 'Mirror Profiles' : 'Products');
    var details = [
      { label: 'Product', value: pkg.title },
      { label: 'Category', value: category },
      { label: 'Size', value: pkg.areaSqft ? (pkg.areaSqft + ' sq.ft') : sizeLabel(sz) },
      { label: 'Area', value: Number(area).toFixed(2) + ' sq.ft' },
      { label: 'Specs', value: pkg.specs },
      { label: 'Qty', value: '1' }
    ];
    if (pkg.kind === 'window') {
      details.push({ label: 'Glass', value: (pkg.glassMm || 6) + 'mm clear toughened' });
      if (isDomalTrackProduct(product)) {
        details.push({ label: 'Track', value: pkg.withMesh ? '3 track (with mesh)' : '2 track (without mesh)' });
      } else {
        details.push({ label: 'Mesh', value: pkg.withMesh ? (isCasementLike(product) ? 'Openable mesh' : 'With mesh') : 'Without mesh' });
      }
    }
    if (pkg.kind === 'shower') {
      details.push({ label: 'Glass', value: '10mm clear toughened' });
      details.push({ label: 'Layout', value: showerLayoutCopy(pkg.mode, sz.w) });
    }
    if (pkg.kind === 'swing') {
      details.push({ label: 'Layout', value: pkg.composite ? 'Half fixed + half operable' : 'Full operable sash' });
      if (pkg.hardwareAddon && pkg.hardwareAddon !== 'none') {
        details.push({ label: 'Hardware', value: hardwareAddonLabel(pkg.hardwareAddon) });
      }
      if (pkg.doorCount > 1) details.push({ label: 'Doors', value: String(pkg.doorCount) });
    }
    if (pkg.kind === 'fold' || pkg.kind === 'telescope') {
      details.push({ label: 'Panel set', value: pkg.panelConfig || '' });
    }
    if (pkg.kind === 'railing') {
      details.push({ label: 'Glass height', value: sz.h + ' ft' });
      details.push({ label: 'Run length', value: sz.w + ' ft' });
    }
    if (pkg.kind === 'pergola-louver' || pkg.kind === 'pergola-glass') {
      if (sz.clearance) details.push({ label: 'Clearance height', value: sz.clearance + ' ft' });
      details.push({ label: 'Footprint', value: sz.w + ' \u00d7 ' + sz.h + ' ft' });
    }
    if (pkg.kind === 'duct-shaft') {
      details.push({ label: 'Shaft width', value: sz.w + ' ft' });
      details.push({ label: 'Floors', value: String(sz.floors || Math.round(sz.h / DUCT_FLOOR_HEIGHT_FT)) });
      details.push({ label: 'Trap doors', value: pkg.ductTrap ? '1 per floor' : 'None' });
    }
    if (pkg.kind === 'mirror') {
      details.push({ label: 'Profile', value: pkg.withProfile ? 'Yes' : 'No' });
      details.push({ label: 'LED', value: pkg.withLed ? 'Yes' : 'No' });
    }
    var productKey = (product && product.id) || (calcEl && calcEl.getAttribute('data-product')) || pkg.kind || 'product';
    return {
      productKey: productKey, productId: productKey, calculatorId: productKey,
      productName: pkg.title, savedProductName: pkg.title, category: category,
      details: details, specs: details.map(function (d) { return d.label + ': ' + d.value; }),
      area: area, exactAmount: amount, amount: fmtINR(amount),
      range: { min: amount, max: amount },
      pageUrl: typeof location !== 'undefined' ? location.href : '',
      ts: Date.now(),
      packageMeta: {
        widthFt: sz.w, heightFt: sz.h, withMesh: !!pkg.withMesh, mode: pkg.mode || null,
        kind: pkg.kind, glassMm: pkg.glassMm || null,
        withProfile: !!pkg.withProfile, withLed: !!pkg.withLed
      },
      mirrorMeta: pkg.kind === 'mirror' ? { withProfile: !!pkg.withProfile, withLed: !!pkg.withLed } : undefined
    };
  }

  function showPkgToast(kind, html) {
    var existing = document.getElementById('wm-std-pkg-toast');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.id = 'wm-std-pkg-toast';
    el.className = 'wm-std-pkg-toast wm-std-pkg-toast--' + (kind || 'info');
    el.innerHTML = html;
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-visible'); });
    setTimeout(function () {
      el.classList.remove('is-visible');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 280);
    }, 2600);
  }

  function addPackageToQuote(product, pkg, calcEl, thenBook) {
    var snap = buildSnap(product, pkg, calcEl);
    var store = root.WoodenMaxQuoteStore;
    if (!store || typeof store.add !== 'function') {
      showPkgToast('warn', '<strong>Quote store unavailable.</strong> Refresh and try again.');
      return null;
    }
    var created = store.add(snap);
    if (root.WoodenMaxQuote && typeof root.WoodenMaxQuote.refresh === 'function') {
      try { root.WoodenMaxQuote.refresh(); } catch (e) { /* ignore */ }
    }
    showPkgToast('ok', '<strong>Added to Project Estimate.</strong> ' + escapeHtml(pkg.title) + ' \u2014 ' + escapeHtml(fmtINR(pkg.amount)));
    if (thenBook && root.WoodenMaxQuote && typeof root.WoodenMaxQuote.openBookOrder === 'function') {
      root.WoodenMaxQuote.openBookOrder('booking');
    }
    return created;
  }

  function setInputValue(el, value) {
    if (!el) return;
    el.value = value;
    try {
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) { /* ignore */ }
  }

  function resolveProductId(calcEl) {
    var id = (calcEl.getAttribute('data-product') || '').trim();
    if (id) return id;
    var elId = calcEl.id || '';
    if (elId.indexOf('price-calculator-') === 0) {
      return elId.slice('price-calculator-'.length);
    }
    return '';
  }

  function mergeProductRates(p, globalRates) {
    if (!p) return null;
    var rates = JSON.parse(JSON.stringify(p.rates || {}));
    if (rates.useGlobalRates && globalRates) {
      if (globalRates.glass) {
        rates.glass = Object.assign({}, globalRates.glass, rates.glass || {});
        Object.keys(p.rates && p.rates.glass || {}).forEach(function (k) {
          if (p.rates.glass[k] === 0 && globalRates.glass[k] != null) rates.glass[k] = globalRates.glass[k];
        });
      }
      if (globalRates.mesh) {
        if (!rates.mesh) rates.mesh = Object.assign({}, globalRates.mesh);
        else if (typeof rates.mesh === 'object') rates.mesh = Object.assign({}, globalRates.mesh, rates.mesh);
      }
    }
    var out = Object.assign({}, p);
    out.rates = rates;
    return out;
  }

  function fetchProduct(productId) {
    var pm = root.productManager;
    if (pm && typeof pm.getProduct === 'function') {
      return Promise.resolve(pm.getProduct(productId));
    }
    return fetch('/data/products.json').then(function (r) { return r.json(); }).then(function (data) {
      var products = data.products || [];
      var globalRates = data.globalRates || {};
      for (var i = 0; i < products.length; i++) {
        if (products[i].id === productId && products[i].status !== 'inactive') {
          return mergeProductRates(products[i], globalRates);
        }
      }
      return null;
    }).catch(function () { return null; });
  }

  function goToCustomSize(calcEl, product, pkg) {
    if (!calcEl) return;
    var unit = calcEl.querySelector('#calc-unit') || document.getElementById('calc-unit');
    if (unit) setInputValue(unit, 'ft');
    if (pkg && pkg.size) {
      var w = pkg.size.w, h = pkg.size.h;
      var widthEl = calcEl.querySelector('#calc-width') || document.getElementById('calc-width');
      var heightEl = calcEl.querySelector('#calc-height') || document.getElementById('calc-height');
      var leftEl = calcEl.querySelector('#calc-left-width') || document.getElementById('calc-left-width');
      var rightEl = calcEl.querySelector('#calc-right-width') || document.getElementById('calc-right-width');
      var showerType = calcEl.querySelector('#calc-shower-type') || document.getElementById('calc-shower-type');
      var doorType = calcEl.querySelector('#calc-door-type') || document.getElementById('calc-door-type');
      if (leftEl) {
        if (showerType) setInputValue(showerType, 'straight');
        setInputValue(leftEl, String(w));
        if (rightEl) setInputValue(rightEl, '');
        if (heightEl) setInputValue(heightEl, String(h));
        if (doorType && pkg.mode === 'sliding') setInputValue(doorType, 'sliding');
        else if (doorType && pkg.mode === 'hinged') setInputValue(doorType, doorType.querySelector('option[value="hinged"]') ? 'hinged' : 'openable');
      } else if (widthEl) {
        setInputValue(widthEl, String(w));
        if (heightEl) setInputValue(heightEl, String(h));
      }
      var mesh = calcEl.querySelector('#calc-mesh') || document.getElementById('calc-mesh');
      if (mesh && typeof pkg.withMesh === 'boolean') {
        mesh.checked = !!pkg.withMesh;
        try { mesh.dispatchEvent(new Event('change', { bubbles: true })); } catch (eM) { /* ignore */ }
      }
      // Domal only: sync track select. Other series use mesh checkbox (set above).
      var track = calcEl.querySelector('#calc-track') || document.getElementById('calc-track');
      if (track && product && isDomalTrackProduct(product) && typeof pkg.withMesh === 'boolean') {
        setInputValue(track, pkg.withMesh ? '3track' : '2track');
      }
      var glass = calcEl.querySelector('#calc-glass') || document.getElementById('calc-glass');
      if (glass && pkg.glassMm) {
        var key = pkg.glassMm + 'mm';
        var has = Array.prototype.some.call(glass.options || [], function (o) { return o.value === key; });
        if (has) setInputValue(glass, key);
      }
      // Mirror catalog
      var mw = calcEl.querySelector('[name="width"], #wm-cc-width, #calc-mirror-width');
      var mh = calcEl.querySelector('[name="height"], #wm-cc-height, #calc-mirror-height');
      if (mw) setInputValue(mw, String(w));
      if (mh) setInputValue(mh, String(h));
    }
    var productId = (product && product.id) || (calcEl && resolveProductId(calcEl));
    var inst = productId && root['calculator_' + productId];
    if (inst && typeof inst.calculate === 'function') {
      try { inst.calculate(); } catch (eC) { /* ignore */ }
    }
    calcEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    calcEl.classList.add('wm-std-pkg-calc-flash');
    setTimeout(function () { calcEl.classList.remove('wm-std-pkg-calc-flash'); }, 1400);
  }

  function injectPackageJsonLd(product, packages) {
    if (typeof document === 'undefined' || !packages || !packages.length) return;
    var existing = document.getElementById('wm-std-pkg-jsonld');
    if (existing) existing.remove();
    var pageUrl = (typeof location !== 'undefined' ? location.href : '').split('#')[0];
    var cap = packages.slice(0, 24);
    var itemList = cap.map(function (pkg, i) {
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Offer',
          name: pkg.title,
          price: String(Math.max(1, Math.round(pkg.amount))),
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          url: pageUrl + '#wm-standard-packages',
          description: pkg.specs,
          seller: { '@type': 'Organization', name: 'WoodenMax', url: 'https://woodenmax.in' }
        }
      };
    });
    var schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: (product && product.name ? product.name + ' — ' : '') + 'Standard size packages',
      numberOfItems: cap.length,
      itemListElement: itemList
    };
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'wm-std-pkg-jsonld';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  function renderSection(anchorEl, product, packages, opts) {
    opts = opts || {};
    var existing = document.getElementById(opts.sectionId || 'wm-standard-packages');
    if (existing) existing.remove();

    var section = document.createElement('section');
    section.id = opts.sectionId || 'wm-standard-packages';
    section.className = 'wm-std-pkg wm-std-pkg--premium';
    if (product && product.id) section.setAttribute('data-product-id', product.id);
    if (packages.length > 12) section.classList.add('wm-std-pkg--scroll-grid');
    section.setAttribute('aria-label', 'Standard size packages');

    var heading = opts.heading || 'Standard packages';
    var sub = opts.sub || 'Live calculator rates \u00b7 Update automatically when prices change.';

    var gridHtml = packages.map(function (pkg, i) {
      return (
        '<article class="wm-std-pkg-card" data-pkg-index="' + i + '">' +
          '<div class="wm-std-pkg-card-top">' +
            '<h3 class="wm-std-pkg-title">' + escapeHtml(pkg.title) + '</h3>' +
            '<p class="wm-std-pkg-specs">' + escapeHtml(pkg.specs) + '</p>' +
          '</div>' +
          '<p class="wm-std-pkg-price" data-package-price>' + escapeHtml(fmtINR(pkg.amount)) + '</p>' +
          '<p class="wm-std-pkg-note">Before GST \u00b7 Live rate</p>' +
          '<div class="wm-std-pkg-actions">' +
            '<button type="button" class="wm-std-pkg-btn wm-std-pkg-btn--quote" data-action="pkg-quote">Add to Quotations</button>' +
            '<button type="button" class="wm-std-pkg-btn wm-std-pkg-btn--buy" data-action="pkg-buy">Buy Now</button>' +
            '<button type="button" class="wm-std-pkg-btn wm-std-pkg-btn--custom" data-action="pkg-custom">Try Custom Size</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    section.innerHTML =
      '<div class="wm-std-pkg-inner">' +
        '<header class="wm-std-pkg-header">' +
          '<div class="wm-std-pkg-header-text">' +
            '<p class="wm-std-pkg-eyebrow">WoodenMax packages</p>' +
            '<h2 class="wm-std-pkg-h2">' + escapeHtml(heading) + '</h2>' +
            '<p class="wm-std-pkg-sub">' + escapeHtml(sub) + '</p>' +
          '</div>' +
          '<button type="button" class="wm-std-pkg-btn wm-std-pkg-btn--custom-top" data-action="pkg-custom-top">Try Custom Size</button>' +
        '</header>' +
        '<div class="wm-std-pkg-grid">' + gridHtml + '</div>' +
      '</div>';

    if (anchorEl.nextSibling) {
      anchorEl.parentNode.insertBefore(section, anchorEl.nextSibling);
    } else {
      anchorEl.parentNode.appendChild(section);
    }
    try { injectPackageJsonLd(product, packages); } catch (eLd) { /* ignore */ }

    section.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      if (action === 'pkg-custom-top') {
        goToCustomSize(anchorEl, product, null);
        return;
      }
      var card = btn.closest('.wm-std-pkg-card');
      if (!card) return;
      var pkg = packages[parseInt(card.getAttribute('data-pkg-index'), 10)];
      if (!pkg) return;
      if (action === 'pkg-quote') addPackageToQuote(product, pkg, anchorEl, false);
      else if (action === 'pkg-buy') addPackageToQuote(product, pkg, anchorEl, true);
      else if (action === 'pkg-custom') goToCustomSize(anchorEl, product, pkg);
    });
  }

  function headingFor(product) {
    if (!product) return 'Standard packages';
    if (product.category === 'shower-partitions') return 'Standard shower packages (7 ft height)';
    if (isPremiumSliding(product)) return 'Premium sliding packages \u00b7 8mm clear tuff';
    if (isSwingDoorProduct(product)) {
      return isEntranceDoorProduct(product)
        ? 'Entrance door packages \u00b7 swing (not sliding)'
        : 'Casement / top-hung packages \u00b7 1.5\u00d73 to 3\u00d78 ft';
    }
    if (isEconomyWindow(product)) return 'Domal window packages \u00b7 6mm clear tuff';
    if (product.category === 'metal-louvers') {
      if (product.id === 'ceiling-pergola-louvers') return 'Pergola louver packages \u00b7 standard footprints';
      if (product.id === 'louver-canopy-facade') return 'Balcony canopy + bathroom duct shaft packages';
      return 'Standard louver packages';
    }
    if (product.category === 'folding-systems') return 'Fold / bi-fold packages by width band';
    if (product.category === 'telescope-windows') return 'Telescopic door packages (7\u201320 ft height)';
    if (product.category === 'glass-railing') return 'Glass railing packages \u00b7 height \u00d7 run length';
    if (product.category === 'elevation-cladding') return 'Elevation cladding packages \u00b7 standard facade bands';
    return 'Standard packages';
  }

  function mountGlassRailing() {
    var path = String(location.pathname || '').toLowerCase();
    var productId = null;
    if (path.indexOf('staircase-glass-railing') !== -1) productId = 'glass-railing-staircase';
    else if (path.indexOf('balcony-glass-railing') !== -1) productId = 'glass-railing-balcony';
    if (!productId) return;
    var calc = document.querySelector('.price-calculator-container');
    if (!calc) return;
    if (!calc.getAttribute('data-product')) calc.setAttribute('data-product', productId);
    mountOne(calc);
  }

  function mountOne(calcEl) {
    if (!calcEl || calcEl.getAttribute('data-std-pkg-mounted') === '1') return;
    var productId = resolveProductId(calcEl);
    if (!productId) return;
    calcEl.setAttribute('data-std-pkg-mounted', '1');
    Promise.resolve(ensureRates()).then(function () {
      return fetchProduct(productId);
    }).then(function (product) {
      if (!product) { calcEl.removeAttribute('data-std-pkg-mounted'); return; }
      var packages = buildPackages(product);
      if (!packages.length) { calcEl.removeAttribute('data-std-pkg-mounted'); return; }
      ensureCss();
      renderSection(calcEl, product, packages, {
        heading: headingFor(product),
        sub: isPremiumSliding(product)
          ? 'Live rates \u00b7 Package includes ' + (packages[0] && packages[0].glassMm ? packages[0].glassMm : 8) + 'mm clear toughened \u00b7 Mesh variants when product supports mesh \u00b7 Sizes 7\u00d77 to 12\u00d78.'
          : 'Live calculator rates \u00b7 Update when supplier rates change.'
      });
    }).catch(function () { calcEl.removeAttribute('data-std-pkg-mounted'); });
  }

  function mountMirror() {
    var catalog = document.getElementById('wmCatalogCalc');
    if (!catalog || catalog.getAttribute('data-std-pkg-mounted') === '1') return;
    if (!/mirror/i.test(location.pathname || '')) return;
    if (!catalog.getAttribute('data-calc-mode') && !catalog.getAttribute('data-calc-config')) return;
    catalog.setAttribute('data-std-pkg-mounted', '1');

    function applyPackages(mode, cfg) {
      var packages = buildMirrorCatalogPackages(mode, cfg);
      if (!packages.length) {
        catalog.removeAttribute('data-std-pkg-mounted');
        return;
      }
      ensureCss();
      var slug = catalog.getAttribute('data-page-slug') || 'mirror';
      var pageTitle = catalog.getAttribute('data-page-title') || 'LED Mirror';
      var fakeProduct = { id: 'mirror-' + slug, name: pageTitle, category: 'mirror-profiles' };
      renderSection(catalog, fakeProduct, packages, {
        sectionId: 'wm-standard-packages-mirror',
        heading: 'Standard mirror packages',
        sub: 'Preset sizes from this page\u2019s live calculator \u00b7 Rates update when supplier prices change.'
      });
    }

    var mode = catalog.getAttribute('data-calc-mode') || 'bevel-modular';
    var inlineCfg = {};
    try { inlineCfg = JSON.parse(catalog.getAttribute('data-calc-config') || '{}'); } catch (eCfg) { inlineCfg = {}; }

    if (inlineCfg && (inlineCfg.presetSizes || inlineCfg.bevel != null || inlineCfg.v120 != null)) {
      applyPackages(mode, inlineCfg);
      return;
    }

    var live = root.WM_MIRROR_RATES && root.WM_MIRROR_RATES.calculators && root.WM_MIRROR_RATES.calculators['bevel-modular'];
    if (live) { applyPackages('bevel-modular', live); return; }

    fetch(MIRROR_JSON).then(function (r) { return r.json(); }).then(function (data) {
      var cfg = data.calculators && data.calculators['bevel-modular'];
      if (cfg) applyPackages('bevel-modular', cfg);
      else catalog.removeAttribute('data-std-pkg-mounted');
    }).catch(function () { catalog.removeAttribute('data-std-pkg-mounted'); });
  }

  function mountPergola() {
    var rootEl = document.getElementById('product-pricing-root');
    if (!rootEl || rootEl.getAttribute('data-std-pkg-mounted') === '1') return;
    rootEl.setAttribute('data-std-pkg-mounted', '1');
    var lineId = rootEl.getAttribute('data-pergola-line') || 'fixed_aluminium_glass';

    function run(rates) {
      if (rates) setRates(rates);
      var packages = buildPergolaGlassPackages(rates || cachedRates, lineId);
      if (!packages.length) {
        rootEl.removeAttribute('data-std-pkg-mounted');
        return;
      }
      ensureCss();
      var fakeProduct = { id: 'pergola-' + lineId, name: 'Aluminium Pergola', category: 'pergola' };
      renderSection(rootEl, fakeProduct, packages, {
        sectionId: 'wm-standard-packages-pergola',
        heading: 'Standard pergola packages',
        sub: '6\u00d725 to 35\u00d745 ft footprints \u00b7 9 / 9.5 / 10 ft clearance \u00b7 Glass roof live rates.'
      });
    }

    if (cachedRates) { run(cachedRates); return; }
    ensureRates().then(run).catch(function () { rootEl.removeAttribute('data-std-pkg-mounted'); });
  }

  function mountAll() {
    ensureCss();
    ensureRates().then(function () {
      Array.prototype.forEach.call(
        document.querySelectorAll('.price-calculator-container[data-product]'),
        mountOne
      );
      Array.prototype.forEach.call(
        document.querySelectorAll('.price-calculator-container[id^="price-calculator-"]:not([data-std-pkg-mounted])'),
        mountOne
      );
      try { mountGlassRailing(); } catch (eG) { /* ignore */ }
      try { mountMirror(); } catch (eM) { /* ignore */ }
      try { mountPergola(); } catch (eP) { /* ignore */ }
    });
  }

  function remountAll() {
    try {
      document.querySelectorAll('.price-calculator-container[data-std-pkg-mounted]').forEach(function (el) {
        el.removeAttribute('data-std-pkg-mounted');
      });
      var mir = document.getElementById('wmCatalogCalc');
      if (mir) mir.removeAttribute('data-std-pkg-mounted');
      var perg = document.getElementById('product-pricing-root');
      if (perg) perg.removeAttribute('data-std-pkg-mounted');
      mountAll();
    } catch (eR) { /* ignore */ }
  }

  function hasCalcAnchor() {
    if (document.getElementById('wmCatalogCalc')) return true;
    if (document.getElementById('product-pricing-root')) return true;
    if (typeof document.querySelector === 'function') {
      return !!document.querySelector('.price-calculator-container[data-product], .price-calculator-container[id^="price-calculator-"]');
    }
    return false;
  }

  function scheduleMount() {
    function run() {
      var tries = 0;
      (function tick() {
        tries += 1;
        if (root.productManager || hasCalcAnchor()) {
          mountAll();
          if (typeof setTimeout === 'function') {
            setTimeout(remountAll, 600);
            setTimeout(remountAll, 2000);
          }
          return;
        }
        if (tries < 120 && typeof setTimeout === 'function') setTimeout(tick, 100);
      })();
    }
    if (typeof document === 'undefined') return;
    if (document.readyState === 'loading' && document.addEventListener) {
      document.addEventListener('DOMContentLoaded', run);
    } else run();
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('load', function () {
        setTimeout(remountAll, 300);
      });
    }
  }

  root.WMStandardPackages = {
    mountAll: mountAll,
    mountOne: mountOne,
    setRates: setRates,
    getRatesSync: getRatesSync,
    buildPackages: buildPackages,
    buildMirrorPackages: buildMirrorPackages,
    buildMirrorCatalogPackages: buildMirrorCatalogPackages,
    buildPergolaGlassPackages: buildPergolaGlassPackages,
    buildDuctShaftZPackages: buildDuctShaftZPackages,
    pricePergolaGlass: pricePergolaGlass,
    priceDuctShaftZ: priceDuctShaftZ,
    priceWindow: priceWindow,
    priceShower: priceShower,
    PREMIUM_WINDOW_SIZES: PREMIUM_WINDOW_SIZES,
    ECONOMY_WINDOW_SIZES: ECONOMY_WINDOW_SIZES,
    MIRROR_SIZES: MIRROR_SIZES
  };

  scheduleMount();
})(typeof window !== 'undefined' ? window : this);
