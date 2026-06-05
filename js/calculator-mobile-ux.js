/**
 * Calculator Mobile UX — v2
 *
 * Wires the new patterns introduced in css/calculator-mobile-ux.css:
 *
 *   • Live-updating sticky bottom price bar
 *   • Add-to-Cart from the calculator (multi-item, localStorage-persisted)
 *   • Bottom-sheet "Quote Cart"
 *   • Gated lead form modal (intent = "exact" | "export-pdf")
 *   • Print-stage builder → branded WoodenMax quote PDF via window.print()
 *
 * The original calculator engine (js/calculator/*) is untouched —
 * we observe its output (`#calc-result-total`, `#calc-area-display`,
 * and visible `.calc-price-row` items) and never write to its state.
 */
(function () {
  'use strict';

  if (window.__wmCalcMobileUxLoaded) {
    if (window.WoodenMaxQuote && typeof window.WoodenMaxQuote.refresh === 'function') {
      window.WoodenMaxQuote.refresh();
    }
    return;
  }
  window.__wmCalcMobileUxLoaded = true;

  // ---------- Constants ----------
  var STORAGE_KEY     = 'woodenmax_quote_cart_v1';
  var LEAD_STORAGE    = 'woodenmax_lead_cache_v1';
  var BODY_FLAG       = 'has-calc-sticky-bar';
  var BAR_VISIBLE     = 'is-visible';
  var SHEET_OPEN      = 'is-open';
  var sheetReturnFocusEl = null;
  var MODAL_OPEN      = 'is-open';
  var PLACEHOLDER_CLS = 'is-placeholder';
  var COMPANY_UPI_ID  = 'finilexnaseem-3@okicici';

  /** User-facing copy — project estimate, not e-commerce cart. */
  var UI = {
    fabLabel: 'Estimate',
    sheetTitle: 'Project Estimate',
    saveConfig: 'Save Configuration',
    saveShort: 'Save',
    saveInline: 'Save to Project Estimate',
    emptyTitle: 'No configurations saved yet',
    emptyBody: 'Configure sizes on any product page, then tap <strong>Save Configuration</strong>. Items stay saved as you browse — build one combined project estimate for windows, shower, mirror, pergola &amp; more.',
    savedHeading: 'Saved configurations',
    addMore: '+ Add configuration',
    toastSaved: 'Saved to project estimate.',
    toastOpenEstimate: 'Open Estimate → Download PDF or WhatsApp.'
  };

  var lastTrackedLiveInr = 0;

  // ---------- Tiny utilities ----------
  function $ (sel, root) { return (root || document).querySelector(sel); }
  function $$ (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function escapeHtml (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parsePriceRange (txt) {
    if (!txt) return { min: 0, max: 0 };
    var parts = String(txt).split(/[–-]/);
    var nums = parts.map(function (p) {
      var n = parseInt(String(p).replace(/[^0-9]/g, ''), 10);
      return isNaN(n) ? 0 : n;
    });
    var min = nums[0] || 0;
    var max = nums[1] != null ? nums[1] : min;
    return { min: min, max: max };
  }

  function readExactInr (el) {
    if (!el) return 0;
    var attr = el.getAttribute && el.getAttribute('data-wm-inr-total');
    if (attr) {
      var n = parseInt(attr, 10);
      if (!isNaN(n) && n > 0) return n;
    }
    var txt = (el.textContent || '').trim();
    if (!txt) return 0;
    var digits = txt.replace(/[^0-9]/g, '');
    if (!digits || /^0+$/.test(digits)) return 0;
    if (/[–-]/.test(txt)) {
      var r = parsePriceRange(txt);
      return Math.round((r.min + r.max) / 2);
    }
    return parseInt(digits, 10) || 0;
  }

  function itemExactAmount (it) {
    if (it && typeof it.exactAmount === 'number' && it.exactAmount > 0) return it.exactAmount;
    var r = (it && it.range) || parsePriceRange((it && it.amount) || '');
    return Math.round((r.min + r.max) / 2);
  }

  function cleanStoredProductName (raw) {
    raw = cleanLabel(raw || '').split('|')[0].trim();
    raw = raw
      .replace(/\s*\+.*$/i, '')
      .replace(/\s*\(2026\)\s*$/i, '')
      .replace(/\s*₹[\d,.\s–-]+(\/sqft)?/gi, ' ')
      .replace(/\bprice\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return raw || 'Product';
  }

  function displayProductName (it) {
    return resolveCartProductName(it);
  }

  function specsToDetailRows (specs) {
    return (specs || []).map(function (s) {
      var line = String(s || '');
      var idx = line.indexOf(':');
      if (idx > 0) {
        return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
      }
      return { label: 'Detail', value: line };
    }).filter(function (d) { return d.label && d.value; });
  }

  function hasSubstantiveCartDetails (it) {
    return !!(it && it.details && it.details.length >= 2);
  }

  function ensureCartItemDetails (it) {
    if (!it) return it;
    var copy = Object.assign({}, it);
    if (hasSubstantiveCartDetails(copy)) return copy;
    if (copy.specs && copy.specs.length) {
      copy.details = specsToDetailRows(copy.specs);
    }
    return copy;
  }

  function cartItemPagePath (it) {
    var pageUrl = (it && it.pageUrl) ? String(it.pageUrl) : '';
    if (!pageUrl) return '';
    try {
      return new URL(pageUrl, typeof location !== 'undefined' ? location.origin : 'https://woodenmax.in')
        .pathname.replace(/\.html$/, '').replace(/\/$/, '').toLowerCase();
    } catch (e) {
      return pageUrl.split('?')[0].replace(/\.html$/, '').replace(/\/$/, '').toLowerCase();
    }
  }

  function inferCategoryFromPageUrl (pageUrl) {
    var path = pageUrl ? String(pageUrl) : '';
    if (!path && typeof location !== 'undefined') path = location.pathname || '';
    try {
      if (path.indexOf('://') >= 0) {
        path = new URL(path, (typeof location !== 'undefined' && location.origin) || 'https://woodenmax.in').pathname;
      }
    } catch (e1) { /* keep raw path */ }
    path = path.replace(/\.html$/, '').replace(/\/$/, '').toLowerCase();
    if (path.indexOf('/pergola/') >= 0 || /\/pergola$/i.test(path)) return 'Pergolas';
    if (path.indexOf('/metal-louvers/') >= 0 || /\/metal-louvers$/i.test(path)) return 'Metal Louvers';
    if (path.indexOf('/shower-partitions/') >= 0) return 'Shower Partitions';
    if (path.indexOf('/telescope-windows/') >= 0) return 'Telescopic Doors';
    if (path.indexOf('/folding-systems/') >= 0) return 'Folding Systems';
    if (path.indexOf('/grills/') >= 0) return 'Safety Grills';
    if (path.indexOf('/glass-railing/') >= 0) return 'Glass Railing';
    if (path.indexOf('/mirror-profiles/') >= 0) return 'Mirror Profiles';
    return null;
  }

  function isPergolaPage () {
    return inferCategoryFromPageUrl(typeof location !== 'undefined' ? location.href : '') === 'Pergolas';
  }

  function isShowerCalcDom () {
    return !!(document.getElementById('calc-shower-type') || document.getElementById('calc-left-width'));
  }

  function resolveCartCategory (it) {
    if (!it) return 'Products';
    var fromUrl = inferCategoryFromPageUrl(it.pageUrl);
    if (fromUrl) return fromUrl;
    if (it.pergolaMeta) return 'Pergolas';
    if (it.mirrorMeta && isMirrorCartItem(it)) return 'Mirror Profiles';
    if (it.category && !/^aluminium windows$/i.test(String(it.category).trim())) {
      return it.category;
    }
    if (it.calcSnapshot && it.calcSnapshot.category &&
        !/^aluminium windows$/i.test(String(it.calcSnapshot.category).trim())) {
      return it.calcSnapshot.category;
    }
    return it.category || 'Products';
  }

  function resolveCartProductName (it) {
    if (!it) return 'Product';
    if (it.savedProductName) return cleanStoredProductName(it.savedProductName);
    if (it.productName && !/^product$/i.test(String(it.productName).trim())) {
      return cleanStoredProductName(it.productName);
    }
    if (it.pergolaMeta && it.pergolaMeta.pergolaLineLabel) {
      return cleanStoredProductName(it.pergolaMeta.pergolaLineLabel);
    }
    if (it.mirrorMeta && it.mirrorMeta.pageTitle && /mirror profiles/i.test(String(it.category || ''))) {
      return cleanStoredProductName(it.mirrorMeta.pageTitle);
    }
    if (it.name) return cleanStoredProductName(it.name);
    return 'Product';
  }

  function finalizeCartItemForPrint (it) {
    if (!it) return it;
    var copy = ensureCartItemDetails(it);
    var pname = resolveCartProductName(copy);
    var cat = resolveCartCategory(copy);
    copy.category = cat;
    var details = (copy.details || []).map(function (d) {
      if (!d || !d.label) return d;
      if (d.label === 'Window / product' || d.label === 'Product' || d.label === 'Grill product') {
        return { label: 'Product', value: pname };
      }
      if (d.label === 'Category') return { label: 'Category', value: cat };
      return d;
    });
    if (!details.some(function (d) { return d && d.label === 'Product'; })) {
      details.unshift({ label: 'Product', value: pname });
    }
    if (cat && !details.some(function (d) { return d && d.label === 'Category'; })) {
      details.splice(1, 0, { label: 'Category', value: cat });
    }
    copy.productName = pname;
    copy.details = details;
    copy.specs = details.map(function (d) { return d.label + ': ' + d.value; });
    return copy;
  }

  function attachCartItemIdentity (snap, meta, calc) {
    if (!snap) return snap;
    meta = meta || readProductMeta();
    calc = calc || getCalcContainer();
    var pname = productNameFromCalc(calc, meta);
    if (snap.productName && snap.productName !== 'Product') {
      pname = cleanStoredProductName(snap.productName);
    }
    snap.savedProductName = pname;
    snap.productName = pname;
    snap.category = inferCategoryFromPageUrl(snap.pageUrl) || snap.category || meta.category || 'Products';
    snap.productKey = snap.productKey || meta.key || 'product';
    snap.pageUrl = snap.pageUrl || (typeof location !== 'undefined' ? location.href : '');
    return snap;
  }

  function buildCalcSnapshotFromDom (calc, meta, exact) {
    if (!calc || calc.id === 'wmCatalogCalc' || calc.id === 'product-pricing-root') return null;
    meta = meta || readProductMeta();
    var pname = productNameFromCalc(calc, meta);
    var cat = inferCategoryFromPageUrl(typeof location !== 'undefined' ? location.href : '') ||
      meta.category || 'Products';
    var specRows = isShowerCalcDom() ? buildShowerCalcDetails(calc, exact) : buildStandardWindowCalcDetails(calc, exact);
    var details = mergeDetailRows(
      [{ label: 'Product', value: pname }, { label: 'Category', value: cat }],
      specRows
    );
    return {
      productName: pname,
      category: cat,
      productKey: meta.key || 'product',
      pageUrl: typeof location !== 'undefined' ? location.href : '',
      details: details
    };
  }

  function patchPrintItem (it, patch) {
    return finalizeCartItemForPrint(Object.assign({}, it, patch || {}));
  }

  function cartItemMatchesLivePage (it) {
    if (!it || typeof location === 'undefined') return false;
    var meta = readProductMeta();
    if (it.productKey && meta.key && it.productKey === meta.key) return true;
    var savedPath = cartItemPagePath(it);
    var livePath = location.pathname.replace(/\.html$/, '').replace(/\/$/, '').toLowerCase();
    return !!(savedPath && savedPath === livePath);
  }

  function productNameFromCalc (calc, meta) {
    calc = calc || getCalcContainer();
    meta = meta || readProductMeta();
    if (calc && calc.getAttribute('data-product-name')) {
      return cleanLabel(calc.getAttribute('data-product-name'));
    }
    return meta.name || shortProductName(calc, meta);
  }

  function shortProductName (calc, meta) {
    if (calc && calc.getAttribute('data-product-name')) {
      return cleanLabel(calc.getAttribute('data-product-name'));
    }
    var h1 = document.querySelector('.product-detail-hero h1, .cluster-hero h1, .page-window-pro h1, h1');
    var raw = h1 ? h1.textContent : ((meta && meta.name) || document.title || '');
    raw = cleanLabel(raw).split('|')[0].trim();
    raw = raw
      .replace(/\s*\+.*$/i, '')
      .replace(/\s*\(2026\)\s*$/i, '')
      .replace(/\s*₹[\d,.\s–-]+(\/sqft)?/gi, ' ')
      .replace(/\bprice\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    raw = raw.replace(/\baluminium\s+window\b/i, 'Window');
    if (raw.length > 42) raw = raw.split(/\s+/).slice(0, 4).join(' ');
    return raw || 'Product';
  }

  function calcSelectDetail (id, label) {
    var sel = document.getElementById(id);
    if (!sel || sel.tagName !== 'SELECT' || !sel.options || sel.selectedIndex < 0) return null;
    var v = cleanLabel(sel.options[sel.selectedIndex].textContent);
    if (!v || /^select/i.test(v)) return null;
    return { label: label, value: v };
  }

  function calcCheckboxDetail (id, label) {
    var cb = document.getElementById(id);
    if (!cb || cb.type !== 'checkbox') return null;
    return { label: label, value: cb.checked ? 'Yes' : 'No' };
  }

  function mergeDetailRows () {
    var map = {};
    var order = [];
    for (var i = 0; i < arguments.length; i++) {
      (arguments[i] || []).forEach(function (d) {
        if (!d || !d.label) return;
        if (!map.hasOwnProperty(d.label)) order.push(d.label);
        map[d.label] = d;
      });
    }
    return order.map(function (lbl) { return map[lbl]; });
  }

  function pageLevelWindowDetails (meta, calc, productName) {
    meta = meta || readProductMeta();
    calc = calc || getCalcContainer();
    productName = productName || productNameFromCalc(calc, meta);
    var rows = [{ label: 'Product', value: productName }];
    [
      ['calc-track', 'Track'],
      ['calc-color', 'Profile colour'],
      ['calc-profile', 'Profile / system'],
      ['calc-system', 'System'],
      ['calc-hardware', 'Hardware']
    ].forEach(function (p) {
      var d = calcSelectDetail(p[0], p[1]);
      if (d) rows.push(d);
    });
    var mesh = calcCheckboxDetail('calc-mesh', 'Mesh');
    if (mesh) rows.push(mesh);
    var grillOpt = calcCheckboxDetail('calc-grill', 'Window grill option');
    if (grillOpt) rows.push(grillOpt);
    return rows;
  }

  function rowOptionDetails (rowId, meta, calc, productName) {
    meta = meta || readProductMeta();
    calc = calc || getCalcContainer();
    productName = productName || productNameFromCalc(calc, meta);
    var glassSel = document.getElementById('calc-glass');
    var coatSel = document.getElementById('calc-coating');
    var lockSel = document.getElementById('calc-lock');
    function optText (sel, val) {
      if (!sel || !sel.options) return val;
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === val) return cleanLabel(sel.options[i].textContent);
      }
      return val;
    }
    var rowOpts = [];
    if (window.rowSelections && typeof window.rowSelections.get === 'function') {
      var rs = window.rowSelections.get(rowId);
      if (rs) {
        rowOpts = [
          { label: 'Glass', value: optText(glassSel, rs.glass) },
          { label: 'Coating', value: optText(coatSel, rs.coating) },
          { label: 'Lock', value: optText(lockSel, rs.lock) },
          { label: 'Mesh', value: rs.mesh ? 'Yes' : 'No' }
        ];
      }
    }
    if (!rowOpts.length) {
      rowOpts = [
        calcSelectDetail('calc-glass', 'Glass'),
        calcSelectDetail('calc-coating', 'Coating'),
        calcSelectDetail('calc-lock', 'Lock')
      ].filter(Boolean);
      var mesh = calcCheckboxDetail('calc-mesh', 'Mesh');
      if (mesh) rowOpts.push(mesh);
    }
    return mergeDetailRows(pageLevelWindowDetails(meta, calc, productName), rowOpts);
  }

  function leadCcEmail (lead) {
    var e = (lead && lead.email) ? String(lead.email).trim() : '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(e) ? e : '';
  }

  function readRowSnapshot (row, index, meta) {
    var amtEl = row.querySelector('.row-amount-text');
    var exact = readExactInr(amtEl);
    if (!exact) return null;

    var wEl = row.querySelector('.calc-size-width');
    var hEl = row.querySelector('.calc-size-height');
    var qEl = row.querySelector('.calc-size-qty');
    var w = wEl ? (wEl.value || '').trim() : '';
    var h = hEl ? (hEl.value || '').trim() : '';
    var q = qEl ? (qEl.value || '1').trim() : '1';
    if (!w || !h) return null;

    var unitSel = document.getElementById('calc-unit');
    var unitLabel = unitSel && unitSel.options
      ? cleanLabel(unitSel.options[unitSel.selectedIndex].textContent)
      : 'ft';

    var areaLine = '';
    var areaEl = row.querySelector('.row-area-text');
    if (areaEl && areaEl.textContent) {
      areaLine = cleanLabel(areaEl.textContent).replace(/^Area:\s*/i, '');
    }

    var calc = getCalcContainer();
    var productName = productNameFromCalc(calc, meta);
    var details = mergeDetailRows(
      rowOptionDetails(row.id, meta, calc, productName),
      [
        { label: 'Width × Height × Qty', value: w + ' × ' + h + ' ' + unitLabel + ' × ' + q },
        areaLine ? { label: 'Area', value: areaLine } : null
      ].filter(Boolean)
    );

    var rowCount = document.querySelectorAll('.calc-size-row').length;
    if (rowCount > 1) productName = productName + ' — Opening ' + (index + 1);

    return attachCartItemIdentity({
      productKey: meta.key,
      productName: productName,
      category: meta.category || 'Products',
      details: details,
      specs: details.map(function (d) { return d.label + ': ' + d.value; }),
      area: areaLine,
      exactAmount: exact,
      amount: fmtINR(exact),
      range: { min: exact, max: exact },
      pageUrl: location.href,
      ts: Date.now()
    }, meta, calc);
  }

  function readAllRowSnapshots () {
    var calc = getCalcContainer();
    if (!calc) return [];
    var meta = readProductMeta();
    meta.name = shortProductName(calc, meta);
    var rows = $$('.calc-size-row', calc);
    if (!rows.length) return [];
    var out = [];
    rows.forEach(function (row, i) {
      var snap = readRowSnapshot(row, i, meta);
      if (snap) out.push(snap);
    });
    return out;
  }

  function fmtINR (n) {
    if (!n && n !== 0) return '₹0';
    // Indian grouping (… , 12,34,567)
    var s = String(Math.round(n));
    var lastThree = s.slice(-3);
    var rest = s.slice(0, -3);
    if (rest) lastThree = ',' + lastThree;
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return '₹' + rest + lastThree;
  }

  function uid () {
    return 'q_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  }

  function grillInnerShapeLabel (shape) {
    var m = { rect: 'Rectangle / Square', round: 'Round', oval: 'Oval' };
    return m[shape] || shape || '—';
  }

  function grillGapTypeLabel (val) {
    var m = {
      uniform: 'Uniform gap',
      alternating2: 'Alternating 2 gaps',
      alternating3: 'Alternating 3 gaps'
    };
    return m[val] || val || '—';
  }

  function grillGapSpacingLine (r, inst) {
    var u = (r.unit || 'in').toLowerCase();
    var g1 = r.gap1;
    var g2 = r.gap2;
    var g3 = r.gap3;
    var gt = r.gapType || (inst && inst.val ? inst.val('grill-gap-type') : 'uniform');
    if (inst && typeof inst.numVal === 'function') {
      if (g1 == null) g1 = inst.numVal('grill-gap1');
      if (g2 == null) g2 = inst.numVal('grill-gap2');
      if (g3 == null) g3 = inst.numVal('grill-gap3');
    }
    var parts = [];
    if (g1 > 0) parts.push('Gap 1: ' + g1 + ' ' + u);
    if ((gt === 'alternating2' || gt === 'alternating3') && g2 > 0) {
      parts.push('Gap 2: ' + g2 + ' ' + u);
    }
    if (gt === 'alternating3' && g3 > 0) parts.push('Gap 3: ' + g3 + ' ' + u);
    return parts.join(' · ');
  }

  function buildGrillSpecDetails (r, meta, inst) {
    meta = meta || readProductMeta();
    var qty = r.qty || 1;
    var colorName = r.colorName || (inst && inst.selectedColor ? inst.selectedColor.name : '');
    var coating = r.coatingFinish || '';
    var finishSel = document.getElementById('grill-coating-finish');
    if (finishSel && finishSel.options && finishSel.selectedIndex >= 0) {
      coating = cleanLabel(finishSel.options[finishSel.selectedIndex].textContent) || coating;
    }
    if (!coating && inst && inst.val) coating = inst.val('grill-coating-finish') || '';
    var innerShape = r.innerShape || (inst && inst.val ? inst.val('grill-inner-shape') : 'rect');
    var rodSize = r.rodSize != null ? r.rodSize : (inst && inst.numVal ? inst.numVal('grill-rod-size') : 0);
    var hasDiv = r.hasDividers || (inst && inst.val && inst.val('grill-dividers') === 'yes');
    var rows = [
      { label: 'Grill product', value: resolveCartProductName({ productName: meta.name, name: meta.name }) },
      { label: 'Opening size', value: r.width + ' × ' + r.height + ' ' + (r.unit || 'in') },
      { label: 'Quantity', value: String(qty) },
      {
        label: 'Outer frame',
        value: (r.outerProfile || '—') + 'mm profile · ' + (r.outerThickness || '—') + 'mm wall'
      },
      {
        label: 'Inner section',
        value: (r.innerProfile || '—') + 'mm ' + grillInnerShapeLabel(innerShape) +
          ' · ' + (r.innerThickness || '—') + 'mm wall'
      },
      {
        label: 'Pattern',
        value: (r.pattern || '—') + ' · ' + grillGapTypeLabel(r.gapType)
      }
    ];
    var gapSp = grillGapSpacingLine(r, inst);
    if (gapSp) rows.push({ label: 'Gap spacing', value: gapSp });
    if (r.sectionSpaces && r.sectionSpaces.length > 1) {
      rows.push({ label: 'Sections', value: r.sectionSpaces.length + ' vertical section(s)' });
    }
    if (hasDiv) {
      var divTxt = 'Horizontal dividers — yes';
      if (inst && inst.numVal) {
        var dc = inst.numVal('grill-divider-count');
        var dl = inst.val('grill-divider-layout');
        if (dc > 0) {
          divTxt += ' (' + dc + ' · ' + (dl === 'center' ? 'center grouped' : 'equal spacing') + ')';
        }
      }
      rows.push({ label: 'Dividers', value: divTxt });
    }
    rows.push({
      label: 'Coating finish',
      value: coating + (colorName ? ' — ' + colorName : '')
    });
    rows.push({
      label: 'Threaded rod (iron)',
      value: rodSize > 0 ? rodSize + 'mm rod' : 'None'
    });
    return rows;
  }

  function grillCartFieldsFromItem (it) {
    var f = Object.assign({}, it);
    f.qty = grillCartQty(it);
    (it.details || []).forEach(function (d) {
      if (d.label === 'Opening size' || d.label === 'Size') {
        var m = String(d.value).match(/([\d.]+)\s*[×x]\s*([\d.]+)\s*([a-z]+)/i);
        if (m) {
          f.width = parseFloat(m[1]);
          f.height = parseFloat(m[2]);
          f.unit = m[3];
        }
      }
    });
    return f;
  }

  /** Same size + profile + pattern on grill pages → one cart/print line */
  function grillCartFingerprint (it) {
    if (!it || it.category !== 'Safety Grills') return null;
    var size = '';
    var outer = '';
    var inner = '';
    var pattern = '';
    var coating = '';
    (it.details || []).forEach(function (d) {
      if (d.label === 'Size') size = d.value;
      if (d.label === 'Outer frame') outer = d.value;
      if (d.label === 'Inner pipes') inner = d.value;
      if (d.label === 'Pattern') pattern = d.value;
      if (d.label === 'Coating') coating = d.value;
    });
    return [it.key || '', size, outer, inner, pattern, coating].join('\u00A6');
  }

  function grillCartQty (it) {
    var q = 1;
    (it.details || []).forEach(function (d) {
      if (d.label === 'Quantity') q = parseInt(d.value, 10) || 1;
    });
    return q;
  }

  /** Parse "48 × 48 in" → sq.ft (same formula as grills calculator). */
  function parseGrillSizeSqFt (sizeStr) {
    var s = String(sizeStr || '').trim();
    var m = s.match(/([\d.]+)\s*[×x]\s*([\d.]+)\s*(in(?:ch(?:es)?)?|ft(?:ee?t)?|mm|cm)?/i);
    if (!m) return 0;
    var w = parseFloat(m[1]);
    var h = parseFloat(m[2]);
    var u = (m[3] || 'in').toLowerCase();
    var wIn;
    var hIn;
    if (/^ft/.test(u)) {
      wIn = w * 12;
      hIn = h * 12;
    } else if (u === 'mm') {
      wIn = w / 25.4;
      hIn = h / 25.4;
    } else if (u === 'cm') {
      wIn = w / 2.54;
      hIn = h / 2.54;
    } else {
      wIn = w;
      hIn = h;
    }
    if (!(wIn > 0 && hIn > 0)) return 0;
    return (wIn * hIn) / 144;
  }

  function grillAreaSummaryLine (perArea, qty) {
    perArea = Number(perArea) || 0;
    qty = parseInt(qty, 10) || 1;
    if (!(perArea > 0)) return '';
    var total = perArea * qty;
    return perArea.toFixed(2) + ' sq.ft × ' + qty + ' = ' + total.toFixed(2) + ' sq.ft';
  }

  function resolveGrillPerAreaSqFt (it) {
    if (!it) return 0;
    if (it.grillPerAreaSqFt > 0) return it.grillPerAreaSqFt;
    var per = 0;
    (it.details || []).forEach(function (d) {
      if (d.label === 'Area (per grill)') {
        per = parseFloat(String(d.value).replace(/[^\d.]/g, '')) || per;
      } else if (d.label === 'Area' && /sq\.?\s*ft/i.test(d.value)) {
        var am = String(d.value).match(/([\d.]+)\s*sq/i);
        if (am) per = parseFloat(am[1]) || per;
      } else if (d.label === 'Size') {
        per = per || parseGrillSizeSqFt(d.value);
      }
    });
    if (per > 0) return per;
    if (it.wInches > 0 && it.hInches > 0) return (it.wInches * it.hInches) / 144;
    if (it.width > 0 && it.height > 0) {
      return parseGrillSizeSqFt(it.width + ' × ' + it.height + ' ' + (it.unit || 'in'));
    }
    var calc = document.querySelector('[data-grill-calculator]');
    if (calc && calc._wmGrillsCalc && calc._wmGrillsCalc.lastResults) {
      var r = calc._wmGrillsCalc.lastResults;
      if (r.totalAreaSqFt > 0) return r.totalAreaSqFt;
    }
    return 0;
  }

  function enrichGrillCartItem (it) {
    if (!it || it.category !== 'Safety Grills') return it;
    var copy = Object.assign({}, it);
    var meta = { name: copy.productName || copy.name || 'Safety Grills' };
    var inst = null;
    var calc = document.querySelector('[data-grill-calculator]');
    if (calc && calc._wmGrillsCalc) inst = calc._wmGrillsCalc;
    var fields = grillCartFieldsFromItem(copy);
    var baseDetails = buildGrillSpecDetails(fields, meta, inst);
    var qty = grillCartQty(copy);
    var perA = resolveGrillPerAreaSqFt(copy);
    if (perA > 0) {
      copy.grillPerAreaSqFt = perA;
      copy.grillTotalAreaSqFt = perA * qty;
      copy.area = grillAreaSummaryLine(perA, qty);
      copy.details = injectGrillAreaIntoDetails(baseDetails, perA, qty, copy.grillPerSqftRate || 0);
    } else {
      copy.details = baseDetails;
    }
    copy.specs = (copy.details || []).map(function (d) { return d.label + ': ' + d.value; });
    return finalizeCartItemForPrint(copy);
  }

  function buildPergolaCalcDetails (est) {
    if (!est) return [];
    var rows = [
      { label: 'Footprint', value: est.width + ' × ' + est.depth + ' ft (' + est.area + ' sq.ft)' },
      { label: 'Structure', value: est.materialDetail || est.material || '—' },
      { label: 'Fitting', value: est.fittingMode || '—' },
      { label: 'Powder coating', value: est.coatingKey || '—' },
      { label: 'Roof product', value: est.roofProduct || '—' },
      { label: 'Structure cost', value: fmtINR(est.baseTotal || 0) },
      { label: 'Roof cost', value: fmtINR(est.glazingTotal || 0) },
      { label: 'Coating cost', value: fmtINR(est.coatingTotal || 0) }
    ];
    if (est.pillarCount) {
      rows.push({
        label: 'Pillars',
        value: (est.pillarLabel || '') + ' × ' + est.pillarCount + ' — ' + fmtINR(est.pillarTotal || 0)
      });
    }
    if (est.motorTotal) {
      rows.push({ label: 'Motors', value: (est.motorLabel || '') + ' — ' + fmtINR(est.motorTotal) });
    }
    if (est.totalFrameRft > 0) {
      rows.push({ label: 'Frame length', value: est.totalFrameRft + ' rft' });
    }
    if (est.glazingSheets > 0) {
      rows.push({
        label: 'Roof sheets',
        value: est.glazingSheets + ' sheet(s)' +
          (est.sheetW && est.sheetH ? ' · ' + est.sheetW + '×' + est.sheetH + ' ft' : '')
      });
    }
    rows.push({ label: 'Line total', value: fmtINR(est.estimatedTotal || 0) });
    return rows;
  }

  function buildPergolaMetaPayload (est) {
    if (!est) return null;
    return {
      pageTitle: est.pageTitle,
      pageUrl: est.pageUrl,
      pergolaLineId: est.pergolaLineId,
      pergolaLineLabel: est.pergolaLineLabel,
      width: est.width,
      depth: est.depth,
      area: est.area,
      material: est.material,
      materialDetail: est.materialDetail,
      fittingMode: est.fittingMode,
      coatingKey: est.coatingKey,
      roofProduct: est.roofProduct,
      baseTotal: est.baseTotal,
      glazingTotal: est.glazingTotal,
      coatingTotal: est.coatingTotal,
      pillarCount: est.pillarCount,
      pillarLabel: est.pillarLabel,
      pillarTotal: est.pillarTotal,
      motorLabel: est.motorLabel,
      motorTotal: est.motorTotal,
      estimatedTotal: est.estimatedTotal,
      totalFrameRft: est.totalFrameRft,
      glazingSheets: est.glazingSheets,
      sheetW: est.sheetW,
      sheetH: est.sheetH
    };
  }

  function enrichPergolaCartItem (it) {
    if (!it || resolveCartCategory(it) !== 'Pergolas') return finalizeCartItemForPrint(it);
    var live = window.__pergolaLastEstimate;
    if (live && cartItemMatchesLivePage(it)) {
      return patchPrintItem(it, {
        productName: live.pergolaLineLabel || it.productName,
        details: buildPergolaCalcDetails(live),
        area: live.width + ' × ' + live.depth + ' ft (' + live.area + ' sq.ft)',
        exactAmount: live.estimatedTotal || it.exactAmount,
        amount: fmtINR(live.estimatedTotal || itemExactAmount(it)),
        pergolaMeta: buildPergolaMetaPayload(live)
      });
    }
    if (it.pergolaMeta) {
      return patchPrintItem(it, {
        productName: it.pergolaMeta.pergolaLineLabel || it.productName,
        details: buildPergolaCalcDetails(it.pergolaMeta),
        area: it.pergolaMeta.width + ' × ' + it.pergolaMeta.depth + ' ft (' + it.pergolaMeta.area + ' sq.ft)',
        exactAmount: it.pergolaMeta.estimatedTotal || it.exactAmount,
        amount: fmtINR(it.pergolaMeta.estimatedTotal || itemExactAmount(it))
      });
    }
    return finalizeCartItemForPrint(it);
  }

  function enrichMirrorCartItem (it) {
    if (!it || !isMirrorCartItem(it)) return it;
    var catalog = $('#wmCatalogCalc');
    var live = catalog && catalog._lastCalc;
    if (live && cartItemMatchesLivePage(it) && (!it.productKey || it.productKey === live.slug)) {
      return patchPrintItem(it, {
        productName: live.pageTitle || it.productName,
        details: buildMirrorCalcDetails(live),
        area: live.dims
          ? live.dims.w + ' × ' + live.dims.h + ' ft (' + live.dims.sqft.toFixed(2) + ' sq.ft)'
          : it.area,
        exactAmount: live.orderTotal || live.perPiece || it.exactAmount,
        amount: fmtINR(live.orderTotal || live.perPiece || itemExactAmount(it)),
        mirrorMeta: buildMirrorMetaPayload(live)
      });
    }
    var rebuilt = mirrorCalcSnapshotFromMeta(it.mirrorMeta);
    if (rebuilt) {
      return patchPrintItem(it, {
        productName: rebuilt.pageTitle || it.productName,
        details: buildMirrorCalcDetails(rebuilt),
        area: rebuilt.dims
          ? rebuilt.dims.w + ' × ' + rebuilt.dims.h + ' ft (' + rebuilt.dims.sqft.toFixed(2) + ' sq.ft)'
          : it.area,
        exactAmount: rebuilt.orderTotal || it.exactAmount,
        amount: fmtINR(rebuilt.orderTotal || itemExactAmount(it))
      });
    }
    return finalizeCartItemForPrint(it);
  }

  function enrichWindowCartItem (it) {
    var cat = resolveCartCategory(it);
    if (!it || cat === 'Safety Grills' || cat === 'Glass Railing' ||
        cat === 'Mirror Profiles' || cat === 'Pergolas' || isMirrorCartItem(it)) {
      return finalizeCartItemForPrint(it);
    }
    if (it.calcSnapshot && it.calcSnapshot.details && it.calcSnapshot.details.length) {
      var snapName = it.calcSnapshot.productName || it.productName;
      var snapDetails = it.calcSnapshot.details.filter(function (d) {
        return d && d.label !== 'Product' && d.label !== 'Category';
      });
      if (cartItemMatchesLivePage(it) && isShowerCalcDom()) {
        var liveShower = buildShowerCalcDetails(getCalcContainer(), itemExactAmount(it));
        if (liveShower.length) snapDetails = liveShower;
      }
      return patchPrintItem(it, {
        productName: snapName,
        category: cat,
        details: mergeDetailRows(
          [{ label: 'Product', value: snapName }, { label: 'Category', value: cat }],
          snapDetails
        )
      });
    }
    if (cartItemMatchesLivePage(it)) {
      var liveCalc = getCalcContainer();
      if (liveCalc && liveCalc.id !== 'wmCatalogCalc' && liveCalc.id !== 'product-pricing-root' &&
          liveCalc.getAttribute('data-grill-calculator') == null) {
        var liveMeta = readProductMeta();
        var liveExact = itemExactAmount(it);
        var liveName = productNameFromCalc(liveCalc, liveMeta);
        var liveStd = isShowerCalcDom()
          ? buildShowerCalcDetails(liveCalc, liveExact)
          : buildStandardWindowCalcDetails(liveCalc, liveExact);
        if (liveStd.length) {
          return patchPrintItem(it, {
            productName: liveName,
            category: cat,
            details: mergeDetailRows(
              [{ label: 'Product', value: liveName }, { label: 'Category', value: cat }],
              liveStd
            )
          });
        }
      }
    }
    if ((hasSubstantiveCartDetails(it) && !it._virtual) || !cartItemMatchesLivePage(it)) {
      return finalizeCartItemForPrint(it);
    }
    var calc = getCalcContainer();
    if (!calc || calc.getAttribute('data-grill-calculator') != null ||
        calc.id === 'wmCatalogCalc' || calc.id === 'product-pricing-root') {
      return finalizeCartItemForPrint(it);
    }
    var meta = readProductMeta();
    var exact = itemExactAmount(it);
    var pname = productNameFromCalc(calc, meta);
    var std = isShowerCalcDom() ? buildShowerCalcDetails(calc, exact) : buildStandardWindowCalcDetails(calc, exact);
    return patchPrintItem(it, {
      productName: pname,
      category: cat,
      details: mergeDetailRows(
        [{ label: 'Product', value: pname }, { label: 'Category', value: cat }],
        std,
        it.details || []
      )
    });
  }

  function enrichGlassRailingCartItem (it) {
    if (!it || it.category !== 'Glass Railing') return finalizeCartItemForPrint(it);
    if (hasSubstantiveCartDetails(it) && !cartItemMatchesLivePage(it)) {
      return finalizeCartItemForPrint(it);
    }
    var live = readGlassRailingQuoteSnapshot();
    if (live && cartItemMatchesLivePage(it)) {
      return patchPrintItem(it, {
        productName: live.productName || it.productName,
        details: live.details,
        area: live.area,
        railingRft: live.railingRft,
        exactAmount: live.exactAmount,
        amount: live.amount
      });
    }
    return finalizeCartItemForPrint(it);
  }

  function cartItemQtyLabel (it) {
    if (it && isMirrorCartItem(it)) {
      if (it.mirrorMeta && it.mirrorMeta.qty > 0) return String(it.mirrorMeta.qty);
      if (it.details) {
        for (var mi = 0; mi < it.details.length; mi++) {
          if (it.details[mi].label === 'Quantity') {
            var qm = String(it.details[mi].value).match(/(\d+)/);
            if (qm) return qm[1];
          }
        }
      }
      return '1';
    }
    if (it && it.category === 'Safety Grills') return String(grillCartQty(it));
    if (it && it.category === 'Glass Railing') {
      if (it.railingRft > 0) return it.railingRft.toFixed(2) + ' rft';
      var m = String(it.area || '').match(/([\d.]+)\s*rft/i);
      if (m) return m[1] + ' rft';
    }
    if (it && it.details) {
      for (var i = 0; i < it.details.length; i++) {
        if (it.details[i].label === 'Quantity') return it.details[i].value;
      }
    }
    return '1';
  }

  function enrichCartItemForPrint (it) {
    if (!it) return it;
    var cat = resolveCartCategory(it);
    var routed = Object.assign({}, it, { category: cat });
    if (cat === 'Safety Grills') return enrichGrillCartItem(routed);
    if (cat === 'Glass Railing') return enrichGlassRailingCartItem(routed);
    if (cat === 'Mirror Profiles' || isMirrorCartItem(routed)) return enrichMirrorCartItem(routed);
    if (cat === 'Pergolas') return enrichPergolaCartItem(routed);
    return enrichWindowCartItem(routed);
  }

  function grillAreaDetailRows (perArea, qty, perSqftRate) {
    perArea = Number(perArea) || 0;
    qty = qty || 1;
    var rows = [];
    if (perArea > 0) {
      rows.push({ label: 'Area', value: grillAreaSummaryLine(perArea, qty) });
    }
    if (perSqftRate > 0) rows.push({ label: 'Rate', value: fmtINR(perSqftRate) + '/sqft' });
    return rows;
  }

  function injectGrillAreaIntoDetails (details, perArea, qty, perSqftRate) {
    var filtered = (details || []).filter(function (d) {
      return d.label !== 'Area' && d.label !== 'Area (per grill)' &&
        d.label !== 'Total area' && d.label !== 'Rate';
    });
    var out = [];
    var inserted = false;
    filtered.forEach(function (d) {
      out.push(d);
      if (!inserted && d.label === 'Quantity') {
        grillAreaDetailRows(perArea, qty, perSqftRate).forEach(function (a) { out.push(a); });
        inserted = true;
      }
    });
    if (!inserted) {
      grillAreaDetailRows(perArea, qty, perSqftRate).forEach(function (a) { out.push(a); });
    }
    return out;
  }

  function grillSizeLine (width, height, unit, qty) {
    return width + ' \u00D7 ' + height + ' ' + unit + ' \u00B7 Qty ' + qty;
  }

  function mergeGrillCartLine (existing, incoming) {
    var qty = grillCartQty(existing) + grillCartQty(incoming);
    var merged = Object.assign({}, existing);
    merged.id = existing.id;
    merged.exactAmount = (existing.exactAmount || 0) + (incoming.exactAmount || 0);
    merged.amount = fmtINR(merged.exactAmount);
    var perArea = existing.grillPerAreaSqFt || incoming.grillPerAreaSqFt || 0;
    var perSqft = existing.grillPerSqftRate || incoming.grillPerSqftRate || 0;
    merged.grillPerAreaSqFt = perArea;
    merged.grillPerSqftRate = perSqft;
    merged.grillTotalAreaSqFt = perArea * qty;
    var sizeVal = '';
    merged.details = (existing.details || []).map(function (d) {
      if (d.label === 'Quantity') return { label: 'Quantity', value: String(qty) };
      if (d.label === 'Size') sizeVal = d.value;
      return d;
    });
    if (!(perArea > 0)) perArea = resolveGrillPerAreaSqFt(merged) || resolveGrillPerAreaSqFt(incoming);
    merged.grillPerAreaSqFt = perArea;
    merged.grillTotalAreaSqFt = perArea * qty;
    merged.details = injectGrillAreaIntoDetails(merged.details, perArea, qty, perSqft);
    merged.area = grillAreaSummaryLine(perArea, qty) || (sizeVal ? sizeVal + ' \u00B7 Qty ' + qty : merged.area);
    merged.specs = (merged.details || []).map(function (d) { return d.label + ': ' + d.value; });
    return merged;
  }

  function addGrillSnapToCart (cart, snap) {
    snap = enrichGrillCartItem(snap);
    var fp = grillCartFingerprint(snap);
    if (!fp) {
      cart.push(Object.assign({ id: uid() }, snap));
      return;
    }
    for (var i = 0; i < cart.length; i++) {
      if (grillCartFingerprint(cart[i]) === fp) {
        cart[i] = mergeGrillCartLine(cart[i], snap);
        return;
      }
    }
    cart.push(Object.assign({ id: uid() }, snap));
  }

  function collapseGrillCartLines (cart) {
    var merged = {};
    var order = [];
    cart.forEach(function (it) {
      var fp = grillCartFingerprint(it);
      if (!fp) {
        order.push({ k: 'o', item: it });
        return;
      }
      if (!merged[fp]) {
        merged[fp] = Object.assign({}, it);
        order.push({ k: 'g', fp: fp });
      } else {
        merged[fp] = mergeGrillCartLine(merged[fp], it);
      }
    });
    return order.map(function (e) {
      return enrichGrillCartItem(e.k === 'g' ? merged[e.fp] : e.item);
    });
  }

  function cartSnapFromGrillQuotationItem (it, meta) {
    meta = meta || readProductMeta();
    var colorSuffix = it.colorName ? ' \u2014 ' + it.colorName : '';
    var qty = it.qty || 1;
    var perArea = it.totalAreaSqFt || 0;
    if (!(perArea > 0) && it.wInches > 0 && it.hInches > 0) {
      perArea = (it.wInches * it.hInches) / 144;
    }
    if (!(perArea > 0)) {
      perArea = parseGrillSizeSqFt(it.width + ' \u00D7 ' + it.height + ' ' + (it.unit || 'in'));
    }
    var specSource = Object.assign({}, it, { colorName: it.colorName || (colorSuffix ? colorSuffix.replace(/^ \u2014 /, '') : '') });
    var details = injectGrillAreaIntoDetails(
      buildGrillSpecDetails(specSource, meta, null),
      perArea,
      qty,
      it.perSqftRate || 0
    );
    return {
      key: (location.pathname || 'grill').replace(/[^\w-]+/g, '-'),
      productName: productNameFromCalc(null, meta),
      name: productNameFromCalc(null, meta),
      category: 'Safety Grills',
      amount: fmtINR(it.grandTotal),
      exactAmount: Math.round(it.grandTotal),
      grillPerAreaSqFt: perArea,
      grillPerSqftRate: it.perSqftRate || 0,
      grillTotalAreaSqFt: perArea * qty,
      wInches: it.wInches,
      hInches: it.hInches,
      width: it.width,
      height: it.height,
      unit: it.unit,
      outerProfile: it.outerProfile,
      outerThickness: it.outerThickness,
      innerProfile: it.innerProfile,
      innerShape: it.innerShape,
      innerThickness: it.innerThickness,
      pattern: it.pattern,
      gapType: it.gapType,
      coatingFinish: it.coatingFinish,
      colorName: it.colorName,
      rodSize: it.rodSize,
      hasDividers: it.hasDividers,
      sectionSpaces: it.sectionSpaces,
      qty: qty,
      area: grillAreaSummaryLine(perArea, qty) || grillSizeLine(it.width, it.height, it.unit, qty),
      details: details,
      specs: details.map(function (d) { return d.label + ': ' + d.value; })
    };
  }

  function syncGrillQuotationToCart (quotationItems) {
    var cart = readCart().filter(function (it) { return it.category !== 'Safety Grills'; });
    var meta = readProductMeta();
    (quotationItems || []).forEach(function (it) {
      addGrillSnapToCart(cart, cartSnapFromGrillQuotationItem(it, meta));
    });
    writeCart(cart);
  }

  // ---------- Storage ----------
  function readCart () {
    var raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (!raw) {
      try { raw = sessionStorage.getItem(STORAGE_KEY); } catch (e2) {}
      if (raw) {
        try { localStorage.setItem(STORAGE_KEY, raw); } catch (e3) {}
      }
    }
    try {
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e4) { return []; }
  }
  function writeCart (items) {
    var json = JSON.stringify(items);
    try { localStorage.setItem(STORAGE_KEY, json); } catch (e) {}
    try { sessionStorage.setItem(STORAGE_KEY, json); } catch (e2) {}
    syncCartBadges();
    try {
      document.dispatchEvent(new CustomEvent('wm-cart-updated', {
        detail: { count: items.length, items: items }
      }));
    } catch (e3) {}
  }

  function syncCartBadges () {
    var cart = readCart();
    var n = cart.length;
    var grand = cartGrandTotal(cart).exact;
    var globalBtn = document.getElementById('wmGlobalQuoteCart');
    if (globalBtn) {
      var cnt = globalBtn.querySelector('.wm-global-quote-cart-count');
      if (cnt) cnt.textContent = String(n);
      var totalEl = document.getElementById('wmQuoteCartTotal');
      if (totalEl) {
        if (n > 0) {
          totalEl.textContent = fmtINR(grand);
          totalEl.hidden = false;
        } else {
          totalEl.textContent = '';
          totalEl.hidden = true;
        }
      }
      globalBtn.hidden = false;
      globalBtn.classList.toggle('has-items', n > 0);
    }
  }
  function readLead () {
    try {
      var raw = localStorage.getItem(LEAD_STORAGE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function writeLead (data) {
    try { localStorage.setItem(LEAD_STORAGE, JSON.stringify(data)); } catch (e) {}
  }

  // ---------- Calculator context ----------
  function getCalcKind () {
    if ($('#product-pricing-root')) return 'pergola';
    if ($('#wmCatalogCalc')) return 'catalog';
    if ($('.price-calculator-container')) return 'window';
    return null;
  }

  function getCalcContainer () {
    return (
      $('.price-calculator-container') ||
      $('#product-pricing-root') ||
      $('#wmCatalogCalc')
    );
  }

  function isGrillCalcPage () {
    return !!document.querySelector('[data-grill-calculator]') ||
      /\/products\/grills\//i.test(location.pathname || '');
  }

  function configureGrillStickyBar (bar) {
    if (!bar || !isGrillCalcPage()) return;
    var exact = bar.querySelector('.calc-sticky-exact');
    if (exact) exact.remove();
    var add = bar.querySelector('[data-action="add-to-cart-sticky"]');
    if (add) {
      add.classList.add('calc-sticky-add--cart');
      var span = add.querySelector('span');
      if (span) span.textContent = UI.saveConfig;
    }
  }

  function cleanLabel (txt) {
    return String(txt || '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/:$/, '');
  }

  function isGlassRailingPage () {
    return /\/products\/glass-railing\//i.test(location.pathname || '') ||
      !!document.getElementById('price-calculator-glass-railing-balcony') ||
      !!document.getElementById('price-calculator-glass-railing-staircase');
  }

  function getGlassRailingCalculatorInstance () {
    var ids = ['glass-railing-balcony', 'glass-railing-staircase'];
    for (var i = 0; i < ids.length; i++) {
      var inst = window['calculator_' + ids[i]];
      if (inst && typeof inst.getQuoteSnapshot === 'function') return inst;
    }
    return null;
  }

  function readGlassRailingQuoteSnapshot () {
    if (!isGlassRailingPage()) return null;
    var inst = getGlassRailingCalculatorInstance();
    if (!inst || typeof inst.getQuoteSnapshot !== 'function') return null;
    return inst.getQuoteSnapshot();
  }

  var MIRROR_MODE_LABELS = {
    'round-touch': 'Round touch LED mirror',
    'square-touch': 'Rectangular / square touch LED mirror',
    'round-slim': 'Round slim LED mirror profile',
    'wooden-round': 'Wooden finish round LED mirror',
    'imported-motion': 'Imported profile motion sensor mirror',
    'rect-led': 'Rectangular LED backlit mirror',
    'backlit-touch': 'Backlit touch mirror (imported profile)',
    'custom-rect-led': 'Custom rectangular LED mirror',
    'half-round': 'Half-round LED mirror',
    'bevel-modular': 'Bevel modular mirror line',
    'luxury-glass': 'Luxury dual-glass mirror'
  };

  function mirrorColorLabel (id) {
    var cfg = (typeof window !== 'undefined' && window.WM_MIRROR_RATES && window.WM_MIRROR_RATES.profileColors) || {};
    var labels = cfg.labels || {
      'matt-black': 'Matt Black',
      'matt-grey': 'Matt Grey',
      'matt-gold': 'Matt Gold',
      'brush-gold': 'Brush Gold',
      'rose-gold': 'Rose Gold'
    };
    return labels[id] || id || '—';
  }

  function mirrorGlassLabel (id) {
    if (id === 'gold-plus') return 'Gold Plus';
    if (id === 'saint-gobain') return 'Saint Gobain';
    return id || '—';
  }

  function mirrorCalcSnapshotFromMeta (meta) {
    if (!meta) return null;
    if (meta.dims && meta.opts) return meta;
    if (!meta.qty && !meta.perPiece) return null;
    return {
      pageTitle: meta.pageTitle,
      slug: meta.slug,
      dims: meta.dims,
      opts: meta.opts || {},
      qty: meta.qty || 1,
      perPiece: meta.perPiece,
      orderTotal: meta.orderTotal,
      mode: meta.mode,
      ratePerSqft: meta.ratePerSqft,
      packingAmt: meta.packingAmt || 0,
      hardwareList: meta.hardwareList || []
    };
  }

  function buildMirrorCalcDetails (c) {
    if (!c) return [];
    var o = c.opts || {};
    var dims = c.dims || {};
    var sqft = dims.sqft || (dims.w > 0 && dims.h > 0 ? dims.w * dims.h : 0);
    var packAmt = c.packingAmt || (o.packing ? 500 : 0);
    var qty = c.qty || 1;
    var mode = c.mode || '';
    var rows = [];

    rows.push({
      label: 'Mirror type',
      value: c.pageTitle || MIRROR_MODE_LABELS[mode] || mode || '—'
    });
    if (dims.w > 0 && dims.h > 0) {
      rows.push({
        label: 'Size',
        value: dims.w + ' × ' + dims.h + ' ft' + (sqft > 0 ? ' (' + sqft.toFixed(2) + ' sq.ft)' : '')
      });
    }
    rows.push({ label: 'Quantity', value: String(qty) + ' piece(s)' });
    rows.push({ label: 'Profile colour', value: mirrorColorLabel(o.color) });
    rows.push({ label: 'Mirror glass', value: mirrorGlassLabel(o.glassBrand) });

    if (mode === 'bevel-modular') {
      rows.push({ label: 'Profile add-on', value: o.profile ? 'Yes' : 'No' });
      rows.push({ label: 'LED V120 add-on', value: o.ledV120 ? 'Yes' : 'No' });
      rows.push({ label: 'LED V220 add-on', value: o.ledV220 ? 'Yes' : 'No' });
    } else if (mode === 'luxury-glass') {
      rows.push({ label: 'LED strip', value: (o.led || 'v120').toUpperCase() });
      if (o.sensor === 'motion') {
        rows.push({ label: 'Sensor', value: 'Motion — ' + (o.glassCount || 2) + ' glass panel(s)' });
      } else if (o.sensor === 'touch') {
        rows.push({ label: 'Sensor', value: 'Touch sensor' });
      } else {
        rows.push({ label: 'Sensor', value: 'None' });
      }
    } else if (mode) {
      rows.push({ label: 'LED strip', value: (o.led || 'v120').toUpperCase() });
      rows.push({
        label: 'Touch sensor',
        value: o.touchAmp === '5' ? '5A upgrade' : '3A standard'
      });
      rows.push({ label: 'LED driver', value: (o.driver || '5') + 'A' });
    }

    rows.push({
      label: 'Export packing',
      value: o.packing
        ? ('Yes — ' + fmtINR(packAmt) + '/pc × ' + qty + ' = ' + fmtINR(packAmt * qty))
        : 'No'
    });

    if (c.ratePerSqft > 0) {
      rows.push({ label: 'Base rate (LED/profile)', value: fmtINR(c.ratePerSqft) + '/sq.ft' });
    }
    if (c.hardwareList && c.hardwareList.length) {
      rows.push({ label: 'Hardware bundle', value: c.hardwareList.join('; ') });
    }
    if (c.perPiece > 0) rows.push({ label: 'Per piece', value: fmtINR(c.perPiece) });
    if (c.orderTotal > 0) rows.push({ label: 'Line total', value: fmtINR(c.orderTotal) });

    return rows;
  }

  function buildMirrorMetaPayload (mc) {
    if (!mc) return null;
    return {
      pageTitle: mc.pageTitle,
      slug: mc.slug,
      dims: mc.dims,
      opts: mc.opts,
      qty: mc.qty || 1,
      perPiece: mc.perPiece,
      orderTotal: mc.orderTotal,
      mode: mc.mode,
      ratePerSqft: mc.ratePerSqft,
      packing: !!(mc.opts && mc.opts.packing),
      packingAmt: mc.packingAmt || 0,
      hardwareList: mc.hardwareList || []
    };
  }

  function buildShowerCalcDetails (calc, exact) {
    if (!calc) calc = getCalcContainer();
    var rows = [];
    var leftW = $('#calc-left-width', calc) || document.getElementById('calc-left-width');
    var rightW = $('#calc-right-width', calc) || document.getElementById('calc-right-width');
    var h = $('#calc-height', calc) || document.getElementById('calc-height');
    var unitSel = $('#calc-unit', calc) || document.getElementById('calc-unit');
    var unitLabel = unitSel && unitSel.options && unitSel.selectedIndex >= 0
      ? cleanLabel(unitSel.options[unitSel.selectedIndex].textContent)
      : 'ft';
    if (leftW && leftW.value) {
      var sizeParts = [leftW.value.trim()];
      if (rightW && rightW.value && rightW.offsetParent !== null) sizeParts.push(rightW.value.trim());
      if (h && h.value) sizeParts.push(h.value.trim());
      rows.push({ label: 'Size (W × H)', value: sizeParts.join(' × ') + ' ' + unitLabel });
    } else {
      var w = $('#calc-width', calc);
      if (w && w.value && h && h.value) {
        rows.push({ label: 'Size (W × H)', value: w.value.trim() + ' × ' + h.value.trim() + ' ' + unitLabel });
      }
    }
    var areaEl = $('#calc-area-display', calc) || document.getElementById('calc-area-display');
    if (areaEl && cleanLabel(areaEl.textContent)) {
      rows.push({ label: 'Area', value: cleanLabel(areaEl.textContent) });
    }
    var dimEl = $('#calc-dimension-display', calc) || document.getElementById('calc-dimension-display');
    if (dimEl && cleanLabel(dimEl.textContent)) {
      rows.push({ label: 'Dimensions', value: cleanLabel(dimEl.textContent) });
    }
    [
      ['calc-shower-type', 'Shower configuration'],
      ['calc-profile-finish', 'Profile finish'],
      ['calc-glass-type', 'Glass type'],
      ['calc-glass-color', 'Glass colour'],
      ['calc-door-type', 'Door type'],
      ['calc-hardware-finish', 'Hardware finish'],
      ['calc-door-count', 'Number of doors']
    ].forEach(function (p) {
      var d = calcSelectDetail(p[0], p[1]);
      if (d) rows.push(d);
    });
    var numEl = $('#calc-number', calc) || $('#calc-quantity', calc) || document.getElementById('calc-quantity');
    if (numEl && numEl.value) rows.push({ label: 'Quantity', value: String(numEl.value) });
    if (exact > 0) rows.push({ label: 'Line total', value: fmtINR(exact) });
    return rows;
  }

  function buildStandardWindowCalcDetails (calc, exact) {
    if (!calc) return [];
    if (isShowerCalcDom()) return buildShowerCalcDetails(calc, exact);
    var rows = [];
    var w = $('#calc-width', calc);
    var h = $('#calc-height', calc);
    var unitSel = $('#calc-unit', calc);
    var unitLabel = unitSel && unitSel.options && unitSel.selectedIndex >= 0
      ? cleanLabel(unitSel.options[unitSel.selectedIndex].textContent)
      : 'ft';
    if (w && w.value && h && h.value) {
      rows.push({ label: 'Size (W × H)', value: w.value.trim() + ' × ' + h.value.trim() + ' ' + unitLabel });
    }
    var areaEl = $('#calc-area-display', calc);
    if (areaEl && (areaEl.textContent || '').trim()) {
      rows.push({ label: 'Area', value: cleanLabel(areaEl.textContent) });
    }
    var numEl = $('#calc-number', calc) || $('#calc-quantity', calc);
    if (numEl && numEl.value) {
      rows.push({ label: 'Quantity', value: String(numEl.value) });
    }
    var piecesEl = $('#calc-pieces-display', calc);
    if (piecesEl && cleanLabel(piecesEl.textContent)) {
      rows.push({ label: 'Louver pieces', value: cleanLabel(piecesEl.textContent) });
    }
    var panel = calcSelectDetail('calc-panel-config', 'Door / fold set');
    if (panel) rows.push(panel);
    var glass = calcSelectDetail('calc-glass', 'Glass type');
    if (glass) rows.push(glass);
    var coat = calcSelectDetail('calc-color', 'Coating') || calcSelectDetail('calc-coating', 'Coating');
    if (coat) rows.push(coat);
    var profile = calcSelectDetail('calc-profile', 'Profile');
    if (profile) rows.push(profile);
    var track = calcSelectDetail('calc-track', 'Track');
    if (track) rows.push(track);
    var system = calcSelectDetail('calc-system', 'System');
    if (system) rows.push(system);
    var hardware = calcSelectDetail('calc-hardware', 'Hardware');
    if (hardware) rows.push(hardware);
    var lock = calcSelectDetail('calc-lock', 'Lock');
    if (lock) rows.push(lock);
    var mesh = calcCheckboxDetail('calc-mesh', 'Mesh');
    if (mesh) rows.push(mesh);
    var mainEl = $('#calc-result-main', calc);
    if (mainEl && readExactInr(mainEl) > 0) {
      rows.push({ label: 'Panel / base cost', value: fmtINR(readExactInr(mainEl)) });
    }
    var wastageEl = $('#calc-result-wastage', calc);
    if (wastageEl && readExactInr(wastageEl) > 0) {
      rows.push({ label: 'Wastage cost', value: fmtINR(readExactInr(wastageEl)) });
    }
    var cuttingEl = $('#calc-cutting-details', calc);
    if (cuttingEl && cleanLabel(cuttingEl.textContent)) {
      rows.push({ label: 'Cutting plan', value: cleanLabel(cuttingEl.textContent) });
    }
    if (exact > 0) rows.push({ label: 'Line total', value: fmtINR(exact) });
    return rows;
  }

  function readGrillQuoteSnapshot () {
    var calc = document.querySelector('[data-grill-calculator]');
    if (!calc || !calc._wmGrillsCalc) return null;
    var inst = calc._wmGrillsCalc;
    var r = inst.lastResults;
    if (!r || !(r.grandTotal > 0)) return null;

    var meta = readProductMeta();
    var qty = r.qty || 1;
    var perArea = r.totalAreaSqFt || 0;
    if (!(perArea > 0) && r.wInches > 0 && r.hInches > 0) {
      perArea = (r.wInches * r.hInches) / 144;
    }
    var specR = Object.assign({}, r, {
      colorName: inst.selectedColor ? inst.selectedColor.name : '',
      gap1: inst.numVal('grill-gap1'),
      gap2: inst.numVal('grill-gap2'),
      gap3: inst.numVal('grill-gap3')
    });
    var details = injectGrillAreaIntoDetails(
      buildGrillSpecDetails(specR, meta, inst),
      perArea,
      qty,
      r.perSqftRate || 0
    );

    return {
      key: (location.pathname || 'grill').replace(/[^\w-]+/g, '-'),
      productName: productNameFromCalc(calc, meta),
      name: productNameFromCalc(calc, meta),
      category: 'Safety Grills',
      amount: fmtINR(r.grandTotal),
      exactAmount: Math.round(r.grandTotal),
      grillPerAreaSqFt: perArea,
      grillPerSqftRate: r.perSqftRate || 0,
      grillTotalAreaSqFt: perArea * qty,
      wInches: r.wInches,
      hInches: r.hInches,
      width: r.width,
      height: r.height,
      unit: r.unit,
      area: grillAreaSummaryLine(perArea, qty) || grillSizeLine(r.width, r.height, r.unit, qty),
      details: details,
      specs: details.map(function (d) { return d.label + ': ' + d.value; })
    };
  }

  function readPriceInr () {
    var rowSnaps = readAllRowSnapshots();
    if (rowSnaps.length) {
      var sum = 0;
      rowSnaps.forEach(function (s) { sum += s.exactAmount; });
      return sum;
    }
    var grillGrand = readExactInr($('#grill-result-grand'));
    if (grillGrand) return grillGrand;
    var exact = readExactInr($('#calc-result-total'));
    if (exact) return exact;
    var catalog = $('#wmCatalogCalc');
    if (catalog && catalog._lastCalc) {
      var c = catalog._lastCalc;
      return c.orderTotal || c.perPiece || 0;
    }
    var est = window.__pergolaLastEstimate;
    if (est && est.estimatedTotal > 0) return est.estimatedTotal;
    return 0;
  }

  function trackLiveCalcIfNeeded () {
    var inr = readPriceInr();
    if (!inr || inr <= 0 || inr === lastTrackedLiveInr) return;
    lastTrackedLiveInr = inr;
    if (typeof window.trackLiveEstimateCalculated !== 'function') return;
    var meta = readProductMeta();
    var areaText = readArea();
    var areaMatch = String(areaText).match(/([\d.]+)\s*sq\.?\s*ft/i);
    var areaSqft = areaMatch ? parseFloat(areaMatch[1]) : 0;
    window.trackLiveEstimateCalculated(inr, areaSqft, (meta && meta.key) || location.pathname);
  }

  function readPrice () {
    var rowSnaps = readAllRowSnapshots();
    if (rowSnaps.length) {
      var sum = 0;
      rowSnaps.forEach(function (s) { sum += s.exactAmount; });
      return fmtINR(sum);
    }
    var grillGrand = readExactInr($('#grill-result-grand'));
    if (grillGrand) return fmtINR(grillGrand);
    var el = $('#calc-result-total');
    var exact = readExactInr(el);
    if (exact) return fmtINR(exact);
    var catalog = $('#wmCatalogCalc');
    if (catalog && catalog._lastCalc) {
      var c = catalog._lastCalc;
      var tot = c.orderTotal || c.perPiece;
      if (tot > 0) return fmtINR(tot);
    }
    var est = window.__pergolaLastEstimate;
    if (est && est.estimatedTotal > 0) return fmtINR(est.estimatedTotal);
    return null;
  }

  function readArea () {
    var el = $('#calc-area-display');
    if (el) {
      var t = (el.textContent || '').trim();
      if (t) return t.replace(/^Total Area:\s*/i, '').replace(/^Glass Area\s*/i, '').trim();
    }
    var catalog = $('#wmCatalogCalc');
    if (catalog && catalog._lastCalc && catalog._lastCalc.dims) {
      var d = catalog._lastCalc.dims;
      return d.w + ' × ' + d.h + ' ft (' + d.sqft.toFixed(2) + ' sq.ft)';
    }
    var est = window.__pergolaLastEstimate;
    if (est) return est.width + ' × ' + est.depth + ' ft (' + est.area + ' sq.ft)';
    if (isGlassRailingPage()) {
      var railInst = getGlassRailingCalculatorInstance();
      if (railInst && typeof railInst.getTotalLengthFt === 'function') {
        var rft = railInst.getTotalLengthFt();
        if (rft > 0) return rft.toFixed(2) + ' rft running';
      }
    }
    return '';
  }

  function readLabeledFields (root) {
    var details = [];
    if (!root) return details;
    var seen = {};

    function push (label, value) {
      label = cleanLabel(label);
      value = cleanLabel(value);
      if (!label || !value || /^select/i.test(value)) return;
      var key = label + '::' + value;
      if (seen[key]) return;
      seen[key] = true;
      details.push({ label: label, value: value });
    }

    $$('.calc-group', root).forEach(function (group) {
      var labelEl = group.querySelector('label');
      var label = labelEl ? labelEl.textContent : '';
      var sel = group.querySelector('select');
      if (sel && sel.options && sel.selectedIndex >= 0) {
        push(label, sel.options[sel.selectedIndex].textContent);
      }
      var cb = group.querySelector('input[type="checkbox"]');
      if (cb && cb.checked) {
        var lbl = group.querySelector('label[for="' + cb.id + '"]') || labelEl;
        push(lbl ? lbl.textContent : label, 'Yes');
      }
    });

    $$('.catalog-calc-field', root).forEach(function (field) {
      var lab = field.querySelector('label');
      var label = lab ? lab.textContent : '';
      var sel = field.querySelector('select');
      var inp = field.querySelector('input[type="number"], input[type="text"], input[type="tel"], input[type="email"]');
      if (sel && sel.options) push(label, sel.options[sel.selectedIndex].textContent);
      else if (inp && inp.value) push(label, inp.value + (inp.id === 'catalogCalcQty' ? ' pc(s)' : ''));
    });

    $$('input[name="catalogCalcColor"]:checked', root).forEach(function (r) {
      var lbl = document.querySelector('label[for="' + r.id + '"]');
      push('Profile colour', lbl ? lbl.textContent : r.value);
    });

    ['#select-material', '#select-glazing', '#select-coating', '#select-fitting',
     '#select-pillar-type', '#select-motor-package', '#input-width', '#input-depth'].forEach(function (sel) {
      var el = $(sel, root) || $(sel);
      if (!el) return;
      var lab = el.closest('label');
      var label = lab ? lab.querySelector('small') : null;
      var name = label ? label.textContent : el.id.replace(/^input-|^select-/, '').replace(/-/g, ' ');
      if (el.tagName === 'SELECT' && el.options) push(name, el.options[el.selectedIndex].textContent);
      else if (el.value) push(name, el.value + (el.id.indexOf('width') >= 0 || el.id.indexOf('depth') >= 0 ? ' ft' : ''));
    });

    var pillarCnt = $('#input-pillar-count');
    if (pillarCnt && pillarCnt.value) push('Pillar qty', pillarCnt.value);

    $$('.calc-size-row', root).forEach(function (row, i) {
      var w = row.querySelector('[data-size-w], .calc-size-w, input[data-field="width"]');
      var h = row.querySelector('[data-size-h], .calc-size-h, input[data-field="height"]');
      var qty = row.querySelector('[data-size-qty], .calc-size-qty, input[data-field="qty"]');
      var parts = [];
      if (w && w.value) parts.push('W ' + w.value);
      if (h && h.value) parts.push('H ' + h.value);
      if (qty && qty.value) parts.push('Qty ' + qty.value);
      if (!parts.length) {
        var txt = (row.textContent || '').replace(/\s+/g, ' ').trim();
        if (txt.length > 4 && txt.length < 120) parts.push(txt);
      }
      if (parts.length) push('Opening #' + (i + 1), parts.join(' · '));
    });

    var dimEl = $('#calc-dimension-display');
    if (dimEl && (dimEl.textContent || '').trim()) {
      push('Dimensions', dimEl.textContent);
    }

    return details;
  }

  function readProductMeta () {
    var calc = getCalcContainer();
    var kind = getCalcKind();
    if (kind === 'catalog' && calc) {
      return {
        key: calc.getAttribute('data-page-slug') || 'mirror',
        name: calc.getAttribute('data-page-title') || (document.title || 'Mirror').split('|')[0].trim(),
        category: 'Mirror Profiles'
      };
    }
    if (kind === 'pergola' || isPergolaPage()) {
      var est = window.__pergolaLastEstimate;
      return {
        key: (est && est.pergolaLineId) || 'pergola',
        name: (est && est.pergolaLineLabel) || (document.title || 'Pergola').split('|')[0].trim(),
        category: 'Pergolas'
      };
    }
    if (!calc) return { key: 'product', name: 'Product', category: 'Products' };
    var cat = 'Aluminium Windows';
    if (calc.getAttribute('data-grill-calculator') != null || (location.pathname || '').indexOf('/grills/') >= 0) {
      cat = 'Safety Grills';
    }
    if ((location.pathname || '').indexOf('/pergola/') >= 0) cat = 'Pergolas';
    if ((location.pathname || '').indexOf('shower-partitions') >= 0) cat = 'Shower Partitions';
    if ((location.pathname || '').indexOf('metal-louvers') >= 0) cat = 'Metal Louvers';
    if ((location.pathname || '').indexOf('folding-systems') >= 0) cat = 'Folding Systems';
    if ((location.pathname || '').indexOf('telescope-windows') >= 0) cat = 'Telescopic Doors';
    if (isGlassRailingPage()) cat = 'Glass Railing';
    var calcKey = calc.getAttribute('data-product');
    if (!calcKey && isGlassRailingPage()) {
      if (document.getElementById('price-calculator-glass-railing-staircase')) calcKey = 'glass-railing-staircase';
      else if (document.getElementById('price-calculator-glass-railing-balcony')) calcKey = 'glass-railing-balcony';
    }
    var meta = {
      key: calcKey || 'product',
      name: shortProductName(calc, {
        key: calc.getAttribute('data-product') || 'product',
        name: calc.getAttribute('data-product-name') || (document.title || 'Product').split('|')[0].trim()
      }),
      category: cat
    };
    return meta;
  }

  function readQuoteSnapshot () {
    var grillSnap = readGrillQuoteSnapshot();
    if (grillSnap) return grillSnap;

    var railingSnap = readGlassRailingQuoteSnapshot();
    if (railingSnap) return railingSnap;

    var rowSnaps = readAllRowSnapshots();
    if (rowSnaps.length === 1) return rowSnaps[0];
    if (rowSnaps.length > 1) return null;

    var calc = getCalcContainer();
    var meta = readProductMeta();
    var exact = readExactInr($('#calc-result-total'));
    if (!exact && calc) {
      var rowAmt = calc.querySelector('.row-amount-text');
      exact = readExactInr(rowAmt);
    }
    if (!exact) {
      var catalog = $('#wmCatalogCalc');
      if (catalog && catalog._lastCalc) exact = catalog._lastCalc.orderTotal || catalog._lastCalc.perPiece;
      if (window.__pergolaLastEstimate) exact = window.__pergolaLastEstimate.estimatedTotal;
    }
    if (!exact) return null;

    var details = readLabeledFields(calc);
    var catalog = $('#wmCatalogCalc');
    var calcKind = getCalcKind();
    var mirrorLive = (calcKind === 'catalog' && catalog && catalog._lastCalc) ? catalog._lastCalc : null;
    if (mirrorLive) {
      details = buildMirrorCalcDetails(catalog._lastCalc);
    }
    var est = window.__pergolaLastEstimate;
    if (est && (calcKind === 'pergola' || isPergolaPage())) {
      details = buildPergolaCalcDetails(est);
    }
    var calcWin = getCalcContainer();
    if (calcWin && calcWin.getAttribute('data-grill-calculator') == null && !isGlassRailingPage() &&
        !mirrorLive && calcKind !== 'pergola' && calcKind !== 'catalog' && !isPergolaPage()) {
      var pname = productNameFromCalc(calcWin, meta);
      var calcSnap = buildCalcSnapshotFromDom(calcWin, meta, exact);
      if (calcSnap && calcSnap.details.length) {
        details = calcSnap.details;
      } else {
        var stdWin = isShowerCalcDom()
          ? buildShowerCalcDetails(calcWin, exact)
          : buildStandardWindowCalcDetails(calcWin, exact);
        details = stdWin.length
          ? mergeDetailRows(pageLevelWindowDetails(meta, calcWin, pname), stdWin)
          : mergeDetailRows(pageLevelWindowDetails(meta, calcWin, pname), details);
      }
    }

    var snap = attachCartItemIdentity({
      productKey: meta.key,
      productName: (mirrorLive && mirrorLive.pageTitle) ||
        (est && est.pergolaLineLabel) ||
        productNameFromCalc(calcWin, meta),
      category: inferCategoryFromPageUrl(typeof location !== 'undefined' ? location.href : '') ||
        meta.category || 'Products',
      details: details,
      specs: details.map(function (d) { return d.label + ': ' + d.value; }),
      area: readArea(),
      exactAmount: exact,
      amount: fmtINR(exact),
      range: { min: exact, max: exact },
      pageUrl: location.href,
      ts: Date.now()
    }, meta, calcWin);
    if (mirrorLive) {
      snap.mirrorMeta = buildMirrorMetaPayload(catalog._lastCalc);
    }
    if (est && (calcKind === 'pergola' || isPergolaPage())) {
      snap.pergolaMeta = buildPergolaMetaPayload(est);
    }
    if (!mirrorLive && calcKind !== 'pergola' && calcKind !== 'catalog' && calcWin && !isPergolaPage()) {
      snap.calcSnapshot = buildCalcSnapshotFromDom(calcWin, meta, exact);
    }
    return snap;
  }

  function isMirrorCartItem (it) {
    if (!it) return false;
    return !!(it.category && /mirror profiles/i.test(String(it.category)));
  }

  function isCartAllMirror (cart) {
    if (window.WoodenMaxRazorpay && window.WoodenMaxRazorpay.isCartAllMirror) {
      return window.WoodenMaxRazorpay.isCartAllMirror(cart);
    }
    return cart.length > 0 && cart.every(isMirrorCartItem);
  }

  function isCartMixed (cart) {
    if (window.WoodenMaxRazorpay && window.WoodenMaxRazorpay.isCartMixed) {
      return window.WoodenMaxRazorpay.isCartMixed(cart);
    }
    if (!cart.length) return false;
    var hm = cart.some(isMirrorCartItem);
    var ho = cart.some(function (it) { return !isMirrorCartItem(it); });
    return hm && ho;
  }

  function getCartPaymentPlan (cart, payChoice) {
    if (window.WoodenMaxRazorpay && typeof window.WoodenMaxRazorpay.buildPaymentPlan === 'function') {
      return window.WoodenMaxRazorpay.buildPaymentPlan(cart, payChoice || 'booking');
    }
    return {
      mode: 'booking',
      amountInr: 1000,
      amountPaise: 100000,
      label: 'Book order — Pay ₹1,000',
      description: 'Order confirmation',
      cartKind: 'other'
    };
  }

  function sumMirrorPackingInr (items) {
    var total = 0;
    (items || []).forEach(function (it) {
      if (!it.mirrorMeta) return;
      if (it.mirrorMeta.packing) {
        total += (it.mirrorMeta.packingAmt || 500) * (it.mirrorMeta.qty || 1);
      }
    });
    return total;
  }

  function buildOrderTimelineRows (paymentMode, items) {
    var allMirror = isCartAllMirror(items || []);
    var mixed = isCartMixed(items || []);

    if (paymentMode === 'mirror_full') {
      return [
        { label: 'Day 0', value: 'Full order payment received — manufacturing queued (your exact calculator sizes)' },
        { label: 'Day 1–2', value: 'Order confirmation call · verify width, height, LED, sensor & packing' },
        { label: 'Day 3–10', value: 'Fabrication at Hyderabad factory strictly as per sizes you entered (custom, not ready stock)' },
        { label: 'Day 8–12', value: 'QC · export packing (if ticked) · dispatch paperwork' },
        { label: 'Dispatch', value: 'Typically 10–15 days from order date — pack & dispatch from factory, then transit to your city' },
        { label: 'Refund', value: 'Full order amount: non-refundable after 3 days (processing starts). Only products supplied — no cash refund after that.' },
        { label: 'GST', value: '18% on basic value — extra unless already included in paid amount' }
      ];
    }

    if (allMirror && !mixed) {
      return [
        { label: 'Day 0', value: '₹1,000 booking received — mirror order slot reserved' },
        { label: 'Day 1–2', value: 'Confirmation call · exact calculator sizes noted for production' },
        { label: 'Before production', value: 'Balance (order total − ₹1,000) + GST as applicable — then manufacturing starts' },
        { label: 'Manufacturing', value: 'Made to your exact sizes entered (custom fabrication)' },
        { label: 'Dispatch', value: '10–15 days after balance clearance — pack & dispatch from Hyderabad, then transit' },
        { label: 'Note', value: 'Booking does not start factory until balance is received unless agreed in writing' },
        { label: 'Refund', value: '₹1,000 booking is RETURNABLE before production starts. Balance/order payment: non-refundable after 3 days once processing begins.' }
      ];
    }

    return [
      { label: 'Day 0', value: '₹1,000 booking received — project slot reserved (mixed estimate: booking terms apply to entire order)' },
      { label: 'Day 1–3', value: 'Site visit scheduled · final measurements on site' },
      { label: 'Day 3–5', value: 'Final site approval · binding BOQ for all saved configurations' },
      { label: 'Day 5–7', value: '50% advance against approved BOQ · production starts' },
      { label: 'Week 3–4', value: 'Factory completion · 40% before dispatch' },
      { label: 'Week 4+', value: '10% on installation completion · balance as per approved BOQ' }
    ];
  }

  function buildOrderPolicyRows (items, subtotalExact, paymentMeta) {
    var freeTransport = subtotalExact >= 1500000;
    var packingTotal = sumMirrorPackingInr(items);
    var mixed = isCartMixed(items);
    var allMirror = isCartAllMirror(items);
    var isFullMirror = paymentMeta && paymentMeta.payment_mode === 'mirror_full';

    var rows = [
      { label: 'Quote validity', value: '7 days from payment / receipt date' },
      { label: 'GST @ 18%', value: 'Always extra on basic value unless explicitly marked incl. GST' },
      { label: 'Transportation', value: freeTransport
        ? 'FREE — order ≥ ₹15 L & site within 1,000 km road from Hyderabad'
        : 'Extra at actuals — becomes FREE when order ≥ ₹15 L & within 1,000 km of Hyderabad' },
      { label: 'Warranty', value: 'Mirror hardware 1 yr · profiles as per page policy · windows 10/5/2 yr where applicable' }
    ];

    if (mixed) {
      rows.unshift(
        { label: 'Mixed estimate rule', value: 'Only ₹1,000 booking online. Full BOQ, site approval & balance for ALL items (mirror + windows) together.' },
        { label: 'Site approval', value: 'Mandatory site visit & final approval before factory release for non-mirror items; mirror sizes from calculator noted in BOQ.' },
        { label: 'Payment terms (balance)', value: '50% advance on approved BOQ · 40% before dispatch · 10% on install completion' }
      );
    } else if (allMirror && isFullMirror) {
      rows.unshift(
        { label: 'Mirror order', value: 'Paid amount = calculator exact sizes (pre-GST). Production only for dimensions you entered.' },
        { label: 'Dispatch lead time', value: '10–15 days from order date for pack & dispatch (custom fabrication, not stock)' },
        { label: 'Balance due', value: 'GST @ 18% extra · transit per policy above' }
      );
    } else if (allMirror) {
      rows.unshift(
        { label: 'Mirror booking', value: '₹1,000 reserves slot · balance + GST before production · or pay full order amount instead' },
        { label: 'Dispatch lead time', value: '10–15 days after balance received — made to your exact sizes, then pack & dispatch' },
        { label: 'Sizes binding', value: 'Supply as per calculator inputs unless site visit requested and sizes revised in writing' }
      );
    } else {
      rows.unshift(
        { label: 'Site approval', value: 'Final sizes confirmed on site before factory release' },
        { label: 'Payment terms (balance)', value: '50% advance on approved BOQ · 40% before dispatch · 10% on install completion' }
      );
    }

    if (packingTotal > 0 && isFullMirror) {
      rows.unshift({ label: 'Export packing', value: fmtINR(packingTotal) + ' included in order amount paid' });
    } else if (allMirror && !isFullMirror) {
      rows.push({ label: 'Export packing', value: packingTotal > 0
        ? fmtINR(packingTotal) + ' in calculator total — payable with balance'
        : 'Not selected — tick in calculator (₹500/pc) if needed' });
    }

    return rows;
  }

  /** Cancellation & refund — booking returnable; full order non-refundable after 3 days. */
  function buildRefundPolicyRows (paymentMode) {
    var isFullOrder = paymentMode === 'mirror_full';
    if (!isFullOrder) {
      return [
        { label: '₹1,000 booking fee', value: 'RETURNABLE — refundable if you cancel before WoodenMax starts order processing / production for your project. Quote Payment ID when requesting refund.' },
        { label: 'Full order amount (later)', value: 'When you pay balance or full order: NON-REFUNDABLE after 3 calendar days from that payment (material cutting & processing starts). After 3 days only product supply — no cash refund.' },
        { label: 'Contact', value: '+91 78953 28080 · info@woodenmax.com · mention Receipt / Payment ID' }
      ];
    }
    return [
      { label: 'Full order payment', value: 'NON-REFUNDABLE after 3 calendar days from payment date. Within 3 days: cancellation only if factory work (material cutting, fabrication, etc.) has NOT started — contact us immediately with Payment ID.' },
      { label: 'Why 3 days', value: 'Order processing usually begins within 3 days — custom sizes to your exact dimensions; materials cannot be reused or resold.' },
      { label: 'After 3 days', value: 'No return of money — only supply of products as per confirmed order. Cash refund not available.' },
      { label: '₹1,000 booking (if paid earlier)', value: 'Booking amount remains RETURNABLE only before production starts; adjusted in order or refunded if entire order cancelled before processing.' },
      { label: 'Contact', value: '+91 78953 28080 · info@woodenmax.com' }
    ];
  }

  function makeReceiptNumber () {
    var d = new Date();
    var ymd = '' + d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');
    return 'WMX/RCPT/' + ymd + '/' + Math.floor(1000 + Math.random() * 9000);
  }

  function buildPaymentReceiptHtml (lead, items, paymentMeta) {
    var today = new Date();
    var dateStr = today.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
    var subtotalExact = 0;
    items.forEach(function (it) { subtotalExact += itemExactAmount(it); });
    var gstExact = Math.round(subtotalExact * 0.18);
    var paidInr = paymentMeta.paid_amount_inr || paymentMeta.paidAmountInr || 1000;
    var isMirror = paymentMeta.payment_mode === 'mirror_full';
    var rows = items.map(function (it, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + escapeHtml(displayProductName(it)) +
        '<br><small>' + escapeHtml((it.details || []).map(function (d) {
          return d.label + ': ' + d.value;
        }).join(' · ')) + '</small></td><td class="is-numeric">' + fmtINR(itemExactAmount(it)) + '</td></tr>';
    }).join('');

    var timeline = buildOrderTimelineRows(paymentMeta.payment_mode, items).map(function (r) {
      return '<li><strong>' + escapeHtml(r.label) + '</strong> — ' + escapeHtml(r.value) + '</li>';
    }).join('');

    return (
      '<div class="pdf-doc wm-receipt-doc">' +
        '<div class="pdf-header">' +
          '<div class="pdf-brand-text"><strong>WoodenMax</strong><br>Payment Receipt</div>' +
          '<div class="pdf-meta-block">' +
            '<div class="row"><span class="label">Receipt No.</span><span class="value">' + escapeHtml(paymentMeta.receipt_no || '—') + '</span></div>' +
            '<div class="row"><span class="label">Date</span><span class="value">' + escapeHtml(dateStr) + '</span></div>' +
            '<div class="row"><span class="label">Payment ID</span><span class="value">' + escapeHtml(paymentMeta.payment_id || '—') + '</span></div>' +
          '</div>' +
        '</div>' +
        '<p><strong>Bill to:</strong> ' + escapeHtml(lead.name || '—') + ' · ' + escapeHtml(lead.mobile || '—') +
          (lead.city ? ' · ' + escapeHtml(lead.city) : '') + '</p>' +
        '<table class="pdf-spec-mini"><thead><tr><th>#</th><th>Item</th><th>Amount</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<p><strong>Amount paid online:</strong> ' + fmtINR(paidInr) +
          (isMirror ? ' (calculator total · pre-GST)' : ' (booking fee · balance after site approval)') + '</p>' +
        (!isMirror
          ? '<p>Calculator subtotal reference: ' + fmtINR(subtotalExact) + ' · GST extra: ' + fmtINR(gstExact) + '</p>'
          : '<p>GST @ 18% extra: ' + fmtINR(gstExact) + ' · Grand incl. GST: ' + fmtINR(subtotalExact + gstExact) + '</p>') +
        '<h3>Order timeline</h3><ol class="wm-receipt-timeline">' + timeline + '</ol>' +
        '<h3>Cancellation &amp; refund</h3><ul class="wm-receipt-timeline">' +
          buildRefundPolicyRows(paymentMeta.payment_mode).map(function (r) {
            return '<li><strong>' + escapeHtml(r.label) + '</strong> — ' + escapeHtml(r.value) + '</li>';
          }).join('') +
        '</ul>' +
        '<p class="cart-foot-note">WoodenMax Architectural Elements · GSTIN 36ARWPA9740L1Z3 · +91 78953 28080</p>' +
      '</div>'
    );
  }

  function ensurePaymentReceiptStage () {
    var stage = document.getElementById('wmPaymentReceiptStage');
    if (!stage) {
      stage = document.createElement('div');
      stage.id = 'wmPaymentReceiptStage';
      stage.setAttribute('aria-hidden', 'true');
      stage.className = 'wm-payment-receipt-stage';
      document.body.appendChild(stage);
    }
    return stage;
  }

  function printPaymentReceipt (lead, items, paymentMeta) {
    var html = buildPaymentReceiptHtml(lead, items, paymentMeta);
    var stage = ensurePaymentReceiptStage();
    stage.innerHTML = html;
    printHtmlInIframe({
      title: 'WoodenMax Payment Receipt',
      containerId: 'wmPaymentReceiptStage',
      containerClass: 'wm-payment-receipt-stage',
      innerHtml: html,
      trackKind: 'payment_receipt',
      itemCount: (items && items.length) || 0,
      totalInr: paymentMeta && paymentMeta.paid_amount_inr
    });
  }

  // ---------- Sticky bar ----------
  function updateStickyBar (bar) {
    if (!bar) return;
    var priceEl  = bar.querySelector('.calc-sticky-price');
    var labelEl  = bar.querySelector('.calc-sticky-label');
    var exactBtn = bar.querySelector('.calc-sticky-exact');
    var addSticky = bar.querySelector('[data-action="add-to-cart-sticky"]');
    var buySticky = bar.querySelector('[data-action="buy-booking"]');
    var price = readPrice();
    var isGrill = isGrillCalcPage();

    if (isGrill) configureGrillStickyBar(bar);

    if (price) {
      priceEl.textContent = price;
      priceEl.classList.remove(PLACEHOLDER_CLS);
      if (labelEl) labelEl.textContent = 'Live Total';
      if (isGrill) {
        if (exactBtn) exactBtn.hidden = true;
        if (addSticky) {
          addSticky.hidden = false;
          addSticky.classList.add('calc-sticky-add--cart');
          var addLabel = addSticky.querySelector('span');
          if (addLabel) addLabel.textContent = UI.saveConfig;
        }
        if (buySticky) buySticky.hidden = true;
      } else {
        if (exactBtn) exactBtn.hidden = false;
        if (addSticky) addSticky.hidden = false;
        if (buySticky) buySticky.hidden = getCalcKind() !== 'catalog';
      }
    } else {
      priceEl.textContent = 'Enter sizes to see price';
      priceEl.classList.add(PLACEHOLDER_CLS);
      if (labelEl) labelEl.textContent = 'Live Estimate';
      if (exactBtn) exactBtn.hidden = true;
      if (addSticky) addSticky.hidden = true;
      if (buySticky) buySticky.hidden = true;
    }

    syncCartBadges();
    trackLiveCalcIfNeeded();
  }
  function syncAddToCartRow () {
    var row = $('#calcActionRow');
    if (!row) return;
    row.hidden = readPrice() === null;
  }

  function syncGrillAddButton () {
    var btn = document.getElementById('grill-add-to-quote');
    if (!btn) return;
    var hasPrice = readPrice() !== null;
    btn.disabled = !hasPrice;
    btn.setAttribute('aria-disabled', hasPrice ? 'false' : 'true');
    btn.style.opacity = hasPrice ? '' : '0.55';
    btn.style.pointerEvents = hasPrice ? '' : 'none';
  }

  // ---------- Cart ----------
  function addCurrentToCart () {
    var snaps = readAllRowSnapshots();
    if (!snaps.length) {
      var single = readQuoteSnapshot();
      if (single) snaps = [single];
    }
    if (!snaps.length) return null;
    var cart = readCart();
    snaps.forEach(function (snap) {
      if (snap.category === 'Safety Grills') {
        addGrillSnapToCart(cart, snap);
      } else {
        cart.push(Object.assign({ id: uid() }, snap));
      }
    });
    writeCart(cart);
    return snaps[snaps.length - 1];
  }

  function removeFromCart (id) {
    var cart = readCart().filter(function (it) { return it.id !== id; });
    writeCart(cart);
    try {
      if (typeof window.trackEstimateItemRemoved === 'function') {
        window.trackEstimateItemRemoved(cart.length);
      }
    } catch (eRem) { /* optional */ }
    return cart;
  }

  function cartGrandTotal (cart) {
    var exact = 0;
    cart.forEach(function (it) {
      exact += itemExactAmount(it);
    });
    return { min: exact, max: exact, exact: exact };
  }

  // ---------- Sheet rendering ----------
  function ensureCartSheetLayout () {
    var panel = document.querySelector('#calcBottomSheet .calc-sheet-panel');
    if (!panel || panel.querySelector('#calcSheetActions')) return;
    var body = document.getElementById('calcSheetBody');
    if (!body || body.closest('.calc-sheet-scroll')) return;

    var actions = document.createElement('div');
    actions.className = 'calc-sheet-actions';
    actions.id = 'calcSheetActions';
    actions.hidden = true;

    var scroll = document.createElement('div');
    scroll.className = 'calc-sheet-scroll';
    scroll.id = 'calcSheetScroll';

    panel.insertBefore(actions, body);
    panel.replaceChild(scroll, body);
    scroll.appendChild(body);
  }

  function buildCartActionsHtml (cart) {
    var total = cartGrandTotal(cart);
    var subExact = total.exact;
    var allMirror = isCartAllMirror(cart);
    var mixed = isCartMixed(cart);
    var mirrorExact = getCartPaymentPlan(cart, 'mirror_full');

    var html =
      '<div class="cart-actions-bar">' +
        '<div class="cart-actions-summary">' +
          '<span class="cart-actions-summary-label">Subtotal · ' + cart.length + ' item' + (cart.length === 1 ? '' : 's') + '</span>' +
          '<span class="cart-actions-summary-value">' + fmtINR(subExact) + '</span>' +
        '</div>' +
        '<div class="cart-actions-grid">';

    html +=
          '<button type="button" class="cart-action-btn cart-action-btn--pdf" data-cart-action="export-pdf">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>' +
            '<span>Download PDF</span>' +
          '</button>';

    if (allMirror && !mixed) {
      html +=
          '<button type="button" class="cart-action-btn cart-action-btn--buy" data-cart-action="book-order" data-pay-choice="mirror_full">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' +
            '<span>' + escapeHtml(mirrorExact.label) + '</span>' +
          '</button>' +
        '</div>' +
        '<button type="button" class="cart-action-btn cart-action-btn--slot cart-action-btn--full" data-cart-action="book-order" data-pay-choice="booking">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
          '<span>Book a Slot — Pay ₹1,000</span>' +
        '</button>';
    } else {
      html +=
          '<button type="button" class="cart-action-btn cart-action-btn--slot" data-cart-action="book-order" data-pay-choice="booking">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
            '<span>Book a Slot — Pay ₹1,000</span>' +
          '</button>' +
        '</div>';
    }

    html +=
        '<div class="cart-actions-share">' +
          '<button type="button" class="cart-share-wa cart-share-wa--compact" data-cart-action="share-whatsapp">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.11.547 4.091 1.507 5.818L0 24l6.335-1.662A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>' +
            'WhatsApp' +
          '</button>' +
          '<button type="button" class="cart-share-email cart-share-email--compact" data-cart-action="share-email">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
            'Email' +
          '</button>' +
          '<button type="button" class="cart-action-btn cart-action-btn--ghost cart-action-btn--mini" data-cart-action="add-more">' + UI.addMore + '</button>' +
        '</div>' +
      '</div>';

    return html;
  }

  function renderSheet () {
    ensureCartSheetLayout();
    var sheet = $('#calcBottomSheet');
    if (!sheet) return;
    var body = document.getElementById('calcSheetBody');
    var actionsEl = document.getElementById('calcSheetActions');
    var count = sheet.querySelector('#calcSheetCount');
    var cart = readCart();

    if (count) count.textContent = '(' + cart.length + ')';

    if (!cart.length) {
      if (actionsEl) {
        actionsEl.hidden = true;
        actionsEl.innerHTML = '';
      }
      if (!body) return;
      body.innerHTML =
        '<div class="cart-empty">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>' +
          '<strong>' + UI.emptyTitle + '</strong>' +
          '<p>' + UI.emptyBody + '</p>' +
        '</div>' +
        '<div class="cart-cta-stack cart-cta-stack--empty">' +
          '<button type="button" class="cart-cta-secondary" data-cart-action="close">Continue Configuring</button>' +
        '</div>';
      return;
    }

    if (actionsEl) {
      actionsEl.hidden = false;
      actionsEl.innerHTML = buildCartActionsHtml(cart);
    }

    if (!body) return;

    var html = '<div class="cart-items-heading">' + UI.savedHeading + '</div>';
    cart.forEach(function (it) {
      var details = it.details || (it.specs || []).map(function (s) {
        var p = String(s).split(':');
        return { label: (p[0] || '').trim(), value: (p.slice(1).join(':') || '').trim() };
      });
      html += '<div class="cart-item" data-cart-id="' + escapeHtml(it.id) + '">' +
        '<div class="cart-item-head">' +
          '<div class="cart-item-title">' + escapeHtml(displayProductName(it)) + '</div>' +
          (it.category ? '<span class="cart-item-cat">' + escapeHtml(it.category) + '</span>' : '') +
        '</div>' +
        '<div class="cart-item-amount">' + escapeHtml(it.amount) + '</div>' +
        (it.area ? '<div class="cart-item-area"><strong>' + (it.category === 'Glass Railing' ? 'Run length:' : 'Area / size:') + '</strong> ' + escapeHtml(it.area) + '</div>' : '') +
        '<dl class="cart-item-details">' +
          details.slice(0, 20).map(function (d) {
            return '<div class="cart-detail-row"><dt>' + escapeHtml(d.label) + '</dt><dd>' + escapeHtml(d.value) + '</dd></div>';
          }).join('') +
        '</dl>' +
        '<div class="cart-item-actions">' +
          '<button type="button" data-cart-action="remove" data-cart-id="' + escapeHtml(it.id) + '">Remove</button>' +
        '</div>' +
      '</div>';
    });

    var total = cartGrandTotal(cart);
    var subExact = total.exact;
    var freeTransport = subExact >= 1500000;
    var gstMid = Math.round(subExact * 0.18);
    var allMirror = isCartAllMirror(cart);
    var mixed = isCartMixed(cart);

    html += '<div class="cart-policy-block">' +
              '<div class="cart-policy-row">' +
                '<span class="cart-policy-key">GST @ 18% <em>(always extra)</em></span>' +
                '<span class="cart-policy-val">+ ' + fmtINR(gstMid) + ' (mid)</span>' +
              '</div>' +
              '<div class="cart-policy-row">' +
                '<span class="cart-policy-key">Transportation</span>' +
                '<span class="cart-policy-val ' + (freeTransport ? 'is-free' : 'is-extra') + '">' +
                  (freeTransport
                    ? '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:3px"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>FREE (this order)'
                    : 'At actuals') +
                '</span>' +
              '</div>' +
              '<p class="cart-policy-note">' +
                (freeTransport
                  ? 'Free delivery applies because your order is ≥ <strong>₹15 Lakh</strong>. Site must be within <strong>1,000 km</strong> by road from our Hyderabad branch.'
                  : 'Transport becomes <strong>FREE</strong> when (a) order ≥ <strong>₹15 Lakh</strong> AND (b) site is within <strong>1,000 km</strong> of Hyderabad branch.') +
              '</p>' +
            '</div>';

    html += '<p class="cart-foot-note">' +
            (mixed
              ? '<strong>Mixed estimate:</strong> only ₹1,000 booking online — site visit &amp; BOQ for all items. '
              : (allMirror
                ? '<strong>Mirror:</strong> full order pay (no refund after 3 days) or ₹1,000 booking (<em>returnable</em> before production). Dispatch 10–15 days. '
                : '<strong>₹1,000 booking</strong> returnable before production — balance non-refundable after 3 days once factory starts. ')) +
            'Receipt + timeline emailed to you &amp; WoodenMax. ' +
            '<a href="/policies/gst-transport-policy" target="_blank" rel="noopener">Policy →</a></p>';

    body.innerHTML = html;
  }

  // ---------- Sheet open/close ----------
  function releaseDialogFocus (container, fallbackEl) {
    if (!container) return;
    var active = document.activeElement;
    if (!active || !container.contains(active)) return;
    var target = sheetReturnFocusEl || fallbackEl || document.getElementById('wmGlobalQuoteCart');
    if (target && typeof target.focus === 'function') {
      try { target.focus({ preventScroll: true }); } catch (e1) { target.focus(); }
    } else {
      active.blur();
    }
  }

  function openSheet () {
    var sheet = $('#calcBottomSheet');
    if (!sheet) return;
    sheetReturnFocusEl = document.activeElement;
    renderSheet();
    sheet.classList.add(SHEET_OPEN);
    sheet.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    try {
      if (typeof window.trackEstimateOpened === 'function') {
        window.trackEstimateOpened(readCart().length);
      }
    } catch (eTrack) { /* optional */ }
    if (typeof ensureRazorpayModule === 'function') {
      ensureRazorpayModule().catch(function () {});
    }
    setTimeout(function () {
      var closeBtn = sheet.querySelector('.calc-sheet-close');
      if (closeBtn && typeof closeBtn.focus === 'function') closeBtn.focus({ preventScroll: true });
    }, 80);
  }
  function closeSheet () {
    var sheet = $('#calcBottomSheet');
    if (!sheet) return;
    sheet.classList.remove(SHEET_OPEN);
    releaseDialogFocus(sheet);
    sheet.setAttribute('aria-hidden', 'true');
    sheetReturnFocusEl = null;
    if (!$('#calcFormModal.is-open')) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }

  // ---------- Form modal ----------
  function payHelpHtmlLive () {
    return (
      '<strong class="calc-pay-help-mode">Live payment</strong>' +
      '<p class="calc-pay-help-note">Asli paise cut honge. Success ke baad receipt + email.</p>' +
      '<ul>' +
        '<li><strong>UPI:</strong> Laptop par QR scan (PhonePe / Google Pay / Paytm). Mobile par UPI app.</li>' +
        '<li><strong>Card / Netbanking:</strong> Indian debit, credit, aur bank login.</li>' +
        '<li>Problem ho to Payment ID ke sath <strong>+91 78953 28080</strong> par call/WhatsApp.</li>' +
      '</ul>'
    );
  }

  function payHelpHtmlTest () {
    return (
      '<strong class="calc-pay-help-mode">Test mode</strong>' +
      '<p class="calc-pay-help-note">Paisa cut nahi hota (test keys).</p>' +
      '<ul>' +
        '<li><strong>Netbanking / Card:</strong> reliable — test card <code>5267 3181 8797 5449</code>.</li>' +
        '<li><strong>UPI QR + PhonePe:</strong> test par fail — live keys par chalega.</li>' +
      '</ul>'
    );
  }

  function syncPayHelpContent (mode) {
    var payHelp = $('#calcPayHelp');
    if (!payHelp) return;
    var isLive = mode === 'live';
    payHelp.innerHTML = isLive ? payHelpHtmlLive() : payHelpHtmlTest();
    payHelp.classList.toggle('calc-pay-help--live', isLive);
    payHelp.classList.toggle('calc-pay-help--test', !isLive);
  }

  function syncBookOrderFormUi (payChoice) {
    var modal = $('#calcFormModal');
    var cart = readCart();
    var mixed = isCartMixed(cart);
    var allMirror = isCartAllMirror(cart);
    var choice = mixed ? 'booking' : (payChoice || 'booking');
    if (modal) modal.setAttribute('data-pay-choice', choice);

    var block = $('#calcPayChoiceBlock');
    if (block) {
      block.hidden = !allMirror || mixed;
      if (!block.hidden) {
        var radios = block.querySelectorAll('input[name="pay_choice"]');
        Array.prototype.forEach.call(radios, function (r) {
          r.checked = r.value === choice;
        });
      }
    }

    var plan = getCartPaymentPlan(cart, choice);
    var title = $('#calcFormTitle');
    var intro = $('#calcFormIntro');
    var payHelp = $('#calcPayHelp');
    if (payHelp) {
      payHelp.hidden = false;
      syncPayHelpContent('test');
      if (window.WoodenMaxRazorpay && typeof window.WoodenMaxRazorpay.fetchPaymentsHealth === 'function') {
        window.WoodenMaxRazorpay.fetchPaymentsHealth().then(function (h) {
          syncPayHelpContent(h && h.razorpay_mode === 'live' ? 'live' : 'test');
        });
      }
    }
    var submitLabel = $('#calcFormSubmit') && $('#calcFormSubmit').querySelector('.calc-form-submit-label');

    if (plan.mode === 'mirror_full' || plan.mode === 'order_full') {
      if (title) title.textContent = plan.mode === 'mirror_full' ? 'Confirm Mirror Order' : 'Confirm Order — Full Payment';
      if (intro) intro.textContent = 'Pay ' + fmtINR(plan.amountInr) + ' for your configured sizes. Refund: not possible after 3 days once factory processing starts. GST & transport extra. Receipt + policy emailed to you & WoodenMax.';
      if (submitLabel) submitLabel.textContent = 'Pay ' + fmtINR(plan.amountInr) + ' & Get Receipt';
    } else if (allMirror) {
      if (title) title.textContent = 'Book Mirror Order — ₹1,000';
      if (intro) intro.textContent = '₹1,000 booking is RETURNABLE if you cancel before production starts. Balance + GST before factory. Full order amount: non-refundable after 3 days once processing begins.';
      if (submitLabel) submitLabel.textContent = 'Pay ₹1,000 Booking';
    } else if (mixed) {
      if (title) title.textContent = 'Book Order (Mixed Estimate) — ₹1,000';
      if (intro) intro.textContent = 'Mixed estimate: ₹1,000 booking only (RETURNABLE before production). Site visit & BOQ for all items. Full order payments: non-refundable after 3 days once processing starts.';
      if (submitLabel) submitLabel.textContent = 'Pay ₹1,000 Booking';
    } else {
      if (title) title.textContent = 'Book Order — Pay ₹1,000';
      if (intro) intro.textContent = 'Pay ₹1,000 to confirm your slot. Balance after site visit & final site approval. Secure Razorpay payment.';
      if (submitLabel) submitLabel.textContent = 'Pay ₹1,000 & Confirm Order';
    }
  }

  function openForm (intent, payChoice) {
    var modal = $('#calcFormModal');
    if (!modal) return;
    var title  = $('#calcFormTitle');
    var intro  = $('#calcFormIntro');
    var submit = $('#calcFormSubmit');
    var submitLabel = submit && submit.querySelector('.calc-form-submit-label');

    modal.setAttribute('data-intent', intent);

    if (intent === 'exact') {
      var payBlock = $('#calcPayChoiceBlock');
      if (payBlock) payBlock.hidden = true;
      var payHelpHide = $('#calcPayHelp');
      if (payHelpHide) payHelpHide.hidden = true;
      if (title)       title.textContent  = 'Get Exact Price';
      if (intro)       intro.textContent  = 'Share quick details and we will reveal the exact price for your configuration. No spam, we promise.';
      if (submitLabel) submitLabel.textContent = 'Show Exact Price';
    } else if (intent === 'book-order') {
      syncBookOrderFormUi(payChoice);
    } else {
      var payBlock2 = $('#calcPayChoiceBlock');
      if (payBlock2) payBlock2.hidden = true;
      var payHelpHide2 = $('#calcPayHelp');
      if (payHelpHide2) payHelpHide2.hidden = true;
      if (title)       title.textContent  = 'Save & Export Quote PDF';
      if (intro)       intro.textContent  = 'Fill your details to download a branded WoodenMax quote PDF. We will email a copy too if you share an email.';
      if (submitLabel) submitLabel.textContent = 'Download Quote PDF';
    }

    // Prefill from previous lead capture
    var lead = readLead();
    if (lead) {
      var form = $('#calcLeadForm');
      if (form) {
        ['name','mobile','city','email','role'].forEach(function (k) {
          var f = form.elements[k];
          if (f && lead[k]) f.value = lead[k];
        });
      }
    }

    modal.classList.add(MODAL_OPEN);
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Focus first empty field for nicer UX
    setTimeout(function () {
      var form = $('#calcLeadForm');
      if (!form) return;
      var first = form.querySelector('input:not([disabled]), select:not([disabled])');
      if (first) first.focus();
    }, 320);
  }

  function closeForm () {
    var modal = $('#calcFormModal');
    if (!modal) return;
    modal.classList.remove(MODAL_OPEN);
    releaseDialogFocus(modal);
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  // ---------- Form submit handlers ----------
  function collectLead (form) {
    var data = {};
    ['name','mobile','city','email','role'].forEach(function (k) {
      var f = form.elements[k];
      data[k] = f ? (f.value || '').trim() : '';
    });
    return data;
  }

  /**
   * Capture the live calculator on this page (if any) as a single
   * virtual quote item.  Marked with `_virtual:true` so the email
   * formatter labels it "live calc snapshot, not yet added to cart".
   */
  function snapshotLiveCalc () {
    var snap = readQuoteSnapshot();
    if (!snap) return null;
    return Object.assign({ id: uid(), _virtual: true }, snap);
  }

  /**
   * Returns the array of "quote items" representing what the lead is
   * asking for.  Behaviour depends on intent:
   *
   *   intent = 'export-pdf'
   *     → user is in the cart sheet → use the full cart (multi-page,
   *       multi-item).  Falls back to live calc if cart is empty (which
   *       shouldn't happen because the button is hidden, but be safe).
   *
   *   intent = 'exact' (the default)
   *     → user clicked "Get Exact" next to the live price → they want
   *       the price for THIS configuration.  Use the live calc state as
   *       the primary item; append cart items afterwards as additional
   *       context so the sales rep sees the whole project.
   */
  function snapshotItems (intent) {
    var cart = readCart();
    var live = snapshotLiveCalc();

    if (intent === 'export-pdf' || intent === 'book-order') {
      if (cart.length) return collapseGrillCartLines(cart).map(enrichCartItemForPrint);
      return live ? enrichCartItemForPrint(live) : [];
    }

    // intent === 'exact'
    if (live && cart.length) {
      // De-dup: drop cart entries that perfectly match the live snapshot
      // (same product key + specs + area), otherwise stack live first.
      var sig = function (it) {
        return [it.productKey, it.area, (it.specs || []).join('|')].join('::');
      };
      var liveSig = sig(live);
      var extras = cart.filter(function (it) { return sig(it) !== liveSig; });
      return [live].concat(extras);
    }
    if (live)        return [live];
    if (cart.length) return cart;
    return [];
  }

  /**
   * Build a plain-text email body listing every item the lead asked
   * about, with sizes / glass / coating / lock / mesh etc.
   *
   * Uses window.EmailSubmitter.buildStructuredPlainText when available
   * (consistent with the legacy contact forms); falls back to a hand-
   * rolled formatter so this still works if email-submitter.js fails
   * to load.
   */
  function quoteEmailItemRows (it) {
    var rows = [
      { label: 'Product', value: displayProductName(it) },
      { label: 'Area', value: it.area || '—' }
    ];
    if (it.details && it.details.length) {
      it.details.forEach(function (d) {
        if (d.label === 'Area' && it.area) return;
        rows.push({ label: d.label, value: d.value });
      });
    } else if (it.specs && it.specs.length) {
      it.specs.forEach(function (s) {
        if (it.area && /^Area:/i.test(String(s))) return;
        rows.push({ label: 'Detail', value: s });
      });
    }
    if (it.category) rows.push({ label: 'Category', value: it.category });
    rows.push({ label: 'Amount', value: fmtINR(itemExactAmount(it)) });
    return rows;
  }

  function buildLeadEmailBody (lead, items, intent, paymentMeta) {
    var pageUrl = (typeof location !== 'undefined') ? location.href : '';
    var pageTitle = (typeof document !== 'undefined' && document.title) ? document.title : '';

    var subtotalExact = 0;
    items.forEach(function (it) {
      subtotalExact += itemExactAmount(it);
    });
    var gstExact        = Math.round(subtotalExact * 0.18);
    var grandExact      = subtotalExact + gstExact;
    var freeTransport = subtotalExact >= 1500000;

    if (window.EmailSubmitter &&
        typeof window.EmailSubmitter.buildStructuredPlainText === 'function') {
      var sections = [];

      sections.push({
        title: 'Request type',
        rows: [
          { label: 'Intent',          value: intent === 'order-booking'
                                              ? (paymentMeta && paymentMeta.payment_mode === 'mirror_full'
                                                  ? ('Mirror order paid — ' + fmtINR(paymentMeta.paid_amount_inr || 0))
                                                  : 'Order booking paid (₹1,000)')
                                              : intent === 'export-pdf'
                                                ? 'Quote PDF download'
                                                : intent === 'book-order'
                                                  ? 'Order booking (checkout)'
                                                  : 'Get-Exact-Price enquiry' },
          { label: 'Source page',     value: pageTitle || pageUrl || '—' },
          { label: 'Page URL',        value: pageUrl || '—' },
          { label: 'Items submitted', value: items.length + ' configuration' + (items.length === 1 ? '' : 's') }
        ]
      });

      sections.push({
        title: 'Lead details',
        rows: [
          { label: 'Name',    value: lead.name   || '—' },
          { label: 'Mobile',  value: lead.mobile || '—' },
          { label: 'City',    value: lead.city   || '—' },
          { label: 'Email',   value: lead.email  || '—' },
          { label: 'Role',    value: lead.role   || '—' }
        ]
      });

      items.forEach(function (it, idx) {
        sections.push({
          title: 'Item #' + (idx + 1) + (it._virtual ? '  (live calc snapshot, not yet added to cart)' : ''),
          rows: quoteEmailItemRows(it)
        });
      });

      sections.push({
        title: 'Totals',
        rows: [
          { label: 'Subtotal (calculator)',      value: fmtINR(subtotalExact) },
          { label: 'GST @ 18% (always extra)',   value: '+ ' + fmtINR(gstExact) },
          { label: 'Transportation',             value: freeTransport
                                                          ? 'FREE  (≥ ₹15 L within 1,000 km of Hyderabad)'
                                                          : 'Extra at actuals  (order < ₹15 L or > 1,000 km)' },
          { label: 'Grand total (incl. GST)', value: fmtINR(grandExact) }
        ]
      });

      if (paymentMeta && paymentMeta.payment_id) {
        var paidLbl = paymentMeta.payment_mode === 'mirror_full'
          ? fmtINR(paymentMeta.paid_amount_inr || 0) + ' (calculator exact · pre-GST)'
          : '₹1,000 (booking fee)';
        sections.push({
          title: 'Razorpay payment',
          rows: [
            { label: 'Receipt no.', value: paymentMeta.receipt_no || '—' },
            { label: 'Paid online', value: paidLbl },
            { label: 'Payment ID', value: paymentMeta.payment_id },
            { label: 'Order ID', value: paymentMeta.order_id || '—' },
            { label: 'Balance due', value: paymentMeta.payment_mode === 'mirror_full'
              ? 'GST @ 18% extra · transit per policy below'
              : 'Payable after site visit & final site approval (per BOQ)' }
          ]
        });
      }

      if (intent === 'order-booking') {
        sections.push({
          title: 'Order timeline (indicative)',
          rows: buildOrderTimelineRows(paymentMeta && paymentMeta.payment_mode, items)
        });
        sections.push({
          title: 'Terms · GST · Transportation · Packing',
          rows: buildOrderPolicyRows(items, subtotalExact, paymentMeta)
        });
        sections.push({
          title: 'Cancellation & refund policy',
          rows: buildRefundPolicyRows(paymentMeta && paymentMeta.payment_mode)
        });
      }

      sections.push({
        title: 'Notes',
        rows: [
          { label: 'Validity', value: '7 days from this email' },
          { label: 'Disclaimer', value: 'Indicative calculator pricing. Final BOQ after site visit & final site approval where applicable.' }
        ]
      });

      var title = intent === 'order-booking'
        ? (paymentMeta && paymentMeta.payment_mode === 'mirror_full'
          ? ('WoodenMax — Mirror Order Paid ' + fmtINR(paymentMeta.paid_amount_inr || 0))
          : 'WoodenMax — Order Booking Paid ₹1,000')
        : intent === 'export-pdf'
          ? 'WoodenMax — Quote PDF Request'
          : 'WoodenMax — Get-Exact-Price Enquiry';

      return window.EmailSubmitter.buildStructuredPlainText(title, sections);
    }

    // Fallback if EmailSubmitter helper is unavailable
    var L = [];
    L.push('WoodenMax — ' + (intent === 'order-booking'
      ? 'Order Booking Paid ₹1,000'
      : intent === 'export-pdf' ? 'Quote PDF Request' : 'Get-Exact-Price Enquiry'));
    if (paymentMeta && paymentMeta.payment_id) {
      L.push('Payment ID: ' + paymentMeta.payment_id);
      L.push('Order ID:   ' + (paymentMeta.order_id || '—'));
    }
    L.push('================================================');
    L.push('Lead: ' + (lead.name || '—') + ' · ' + (lead.mobile || '—') + ' · ' + (lead.city || '—'));
    if (lead.email) L.push('Email: ' + lead.email);
    if (lead.role)  L.push('Role:  ' + lead.role);
    L.push('Source: ' + (pageTitle || pageUrl || '—'));
    L.push('URL:    ' + (pageUrl || '—'));
    L.push('');
    items.forEach(function (it, idx) {
      L.push('--- Item #' + (idx + 1) + ' --------------------------------');
      quoteEmailItemRows(it).forEach(function (row) {
        L.push('  ' + row.label + (row.label.length < 12 ? ' ' : '') + ': ' + row.value);
      });
      L.push('');
    });
    L.push('Subtotal (calculator)  : ' + fmtINR(subtotalExact));
    L.push('GST @ 18% (extra)      : + ' + fmtINR(gstExact));
    L.push('Transportation         : ' + (freeTransport ? 'FREE' : 'Extra at actuals'));
    L.push('Grand total (incl GST) : ' + fmtINR(grandExact));
    return L.join('\n');
  }

  /**
   * Submit the lead + cart snapshot via EmailSubmitter.  Returns a
   * Promise that resolves whether or not the email succeeded — we
   * never want to block the PDF print on a transport failure.
   */
  function sendLeadEmail (lead, items, intent, paymentMeta) {
    return new Promise(function (resolve) {
      if (!window.EmailSubmitter || typeof window.EmailSubmitter.submit !== 'function') {
        resolve({ ok: false, reason: 'EmailSubmitter unavailable' });
        return;
      }
      if (!items || !items.length) {
        resolve({ ok: false, reason: 'No items to quote' });
        return;
      }

      var subject = intent === 'order-booking'
        ? (paymentMeta && paymentMeta.payment_mode === 'mirror_full'
          ? ('MIRROR ORDER PAID · ' + fmtINR(paymentMeta.paid_amount_inr || 0) + ' · ' + (lead.name || 'Lead') + ' · ' + (lead.mobile || '—'))
          : ('ORDER BOOKED · ₹1,000 paid · ' + (lead.name || 'Lead') + ' · ' + (lead.mobile || '—')))
        : intent === 'export-pdf'
          ? 'New Quote PDF Request · ' + (lead.name || 'Lead') + ' · ' + (lead.city || '—')
          : 'Get-Exact-Price Enquiry · ' + (lead.name || 'Lead') + ' · ' + (lead.city || '—');

      var body = buildLeadEmailBody(lead, items, intent, paymentMeta);

      window.EmailSubmitter.submit({
        subject: subject,
        message: body,
        userDetails: {
          name:   lead.name || '',
          email:  lead.email || '',
          city:   lead.city || '',
          mobile: lead.mobile || ''
        },
        ccEmail: leadCcEmail(lead),
        onSuccess: function () {
          try {
            if (typeof window.trackMobileLeadSubmit === 'function') {
              window.trackMobileLeadSubmit(intent, items.length);
            }
          } catch (e) { /* optional */ }
          resolve({ ok: true });
        },
        onError:   function (err) { resolve({ ok: false, reason: (err && err.message) || 'Submit failed' }); }
      });

      // Safety: don't let a slow/hung transport block the PDF print for
      // more than 4s.  EmailSubmitter usually resolves in <1s.
      setTimeout(function () { resolve({ ok: false, reason: 'timeout' }); }, 4000);
    });
  }

  /**
   * Show a tiny non-blocking toast in the corner.  Used to confirm
   * that the BOQ email actually went out (or didn't).
   */
  function showToast (kind, html) {
    var id = 'wmCalcToast';
    var prev = document.getElementById(id);
    if (prev) prev.remove();

    var t = document.createElement('div');
    t.id = id;
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    t.style.cssText = [
      'position:fixed', 'left:50%', 'top:24px', 'transform:translateX(-50%)',
      'z-index:10001', 'max-width:92vw',
      'background:' + (kind === 'success' ? '#065F46' : kind === 'warn' ? '#9A3412' : '#0F172A'),
      'color:#fff', 'padding:11px 16px', 'border-radius:10px',
      'box-shadow:0 10px 32px rgba(0,0,0,.28)',
      'font:600 13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif',
      'display:flex', 'gap:10px', 'align-items:center',
      'opacity:0', 'transition:opacity .25s ease'
    ].join(';');
    t.innerHTML =
      (kind === 'success'
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>') +
      '<div>' + html + '</div>';
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.style.opacity = '1'; });
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function(){ t.remove(); }, 300); }, 4200);
  }

  function showExactPriceInline (lead) {
    var calc = getCalcContainer();
    if (!calc) return;
    var price = readPrice();
    if (!price) return;

    var exact = readExactInr($('#calc-result-total'));
    if (!exact) {
      var rowSnaps = readAllRowSnapshots();
      if (rowSnaps.length) {
        exact = 0;
        rowSnaps.forEach(function (s) { exact += s.exactAmount; });
      }
    }
    if (!exact) {
      var range = parsePriceRange(price);
      exact = Math.round((range.min + range.max) / 2);
    }

    var existing = $('#calcExactBlock');
    if (existing) existing.remove();

    var block = document.createElement('div');
    block.id = 'calcExactBlock';
    block.style.cssText = [
      'margin: 1.5rem 0',
      'padding: 1.25rem 1.5rem',
      'background: linear-gradient(135deg, #ECFDF5 0%, #DBEAFE 100%)',
      'border: 1px solid #10B981',
      'border-radius: 12px',
      'box-shadow: 0 4px 14px -6px rgba(16, 185, 129, 0.35)'
    ].join(';');
    block.innerHTML =
      '<div style="font-size: 0.75rem; font-weight: 700; color: #047857; letter-spacing: 0.6px; text-transform: uppercase;">Exact Price for ' + escapeHtml(lead.name || 'You') + '</div>' +
      '<div style="font-size: 1.7rem; font-weight: 800; color: #0F172A; margin: 0.35rem 0;">' + fmtINR(exact) + '</div>' +
      '<p style="margin: 0; font-size: 0.85rem; color: #475569;">A WoodenMax specialist will reach you on <strong>' + escapeHtml(lead.mobile) + '</strong> within 2 working hours to schedule site visit and final site approval. GST extra.</p>';

    // Insert after the price display so it visually replaces it.
    var priceDisplay = calc.querySelector('.calc-price-display');
    if (priceDisplay && priceDisplay.parentNode) {
      priceDisplay.parentNode.insertBefore(block, priceDisplay.nextSibling);
    } else {
      calc.appendChild(block);
    }
    setTimeout(function () {
      block.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 220);
  }

  // ---------- Indian number → words (₹) ----------
  function numToIndianWords (num) {
    num = Math.round(Number(num) || 0);
    if (num === 0) return 'Zero Rupees Only';
    var a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
             'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
             'Seventeen', 'Eighteen', 'Nineteen'];
    var b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function under1000 (n) {
      if (n === 0) return '';
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + under1000(n % 100) : '');
    }
    var parts = [];
    var crore   = Math.floor(num / 10000000); num %= 10000000;
    var lakh    = Math.floor(num / 100000);   num %= 100000;
    var thousand= Math.floor(num / 1000);     num %= 1000;
    var hundred = num;
    if (crore)    parts.push(under1000(crore)    + ' Crore');
    if (lakh)     parts.push(under1000(lakh)     + ' Lakh');
    if (thousand) parts.push(under1000(thousand) + ' Thousand');
    if (hundred)  parts.push(under1000(hundred));
    return parts.join(' ') + ' Rupees Only';
  }

  function buildPrintStage (lead, items) {
    var stage = $('#calcPrintStage');
    if (!stage) return;
    var cart = collapseGrillCartLines((items && items.length) ? items : readCart())
      .map(enrichCartItemForPrint);
    if (!cart.length) return;
    stage.removeAttribute('aria-hidden');

    // ----- Document meta -----
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yy = today.getFullYear();
    var dateStr   = dd + ' ' + today.toLocaleString('en-IN', { month: 'short' }) + ' ' + yy;
    var validTill = new Date(today.getTime() + 7 * 86400000)
                      .toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
    var ymd = '' + yy + mm + dd;
    var quoteNum = 'WMX/' + ymd + '/' + Math.floor(1000 + Math.random() * 9000);

    // ----- Totals: sum exact calculator amounts (matches on-screen row prices) -----
    var subtotalExact = 0;
    cart.forEach(function (it) {
      subtotalExact += itemExactAmount(it);
    });
    var gstMid   = Math.round(subtotalExact * 0.18);
    var grandMid = subtotalExact + gstMid;

    // ----- Build itemised rows -----
    var rowsHtml = cart.map(function (it, i) {
      var lineExact = itemExactAmount(it);
      var details = it.details || [];
      var specBlock = '';
      if (it.area) {
        var areaLbl = it.category === 'Glass Railing' ? 'Run length:' : 'Area / size:';
        specBlock += '<div class="pdf-spec-line"><strong>' + areaLbl + '</strong> ' + escapeHtml(it.area) + '</div>';
      }
      if (details.length) {
        specBlock += '<table class="pdf-spec-mini"><tbody>' +
          details.map(function (d) {
            return '<tr><td class="pdf-spec-k">' + escapeHtml(d.label) + '</td><td class="pdf-spec-v">' + escapeHtml(d.value) + '</td></tr>';
          }).join('') +
        '</tbody></table>';
      } else if (it.specs && it.specs.length) {
        specBlock += '<div class="pdf-specs">' + it.specs.map(escapeHtml).join('<br>') + '</div>';
      }
      return '<tr>' +
        '<td class="is-center">' + (i + 1) + '</td>' +
        '<td>' +
          '<div class="pdf-row-title">' + escapeHtml(displayProductName(it)) + '</div>' +
          (it.category ? '<div class="pdf-row-cat">' + escapeHtml(it.category) + '</div>' : '') +
          specBlock +
        '</td>' +
        '<td class="is-center">' + escapeHtml(cartItemQtyLabel(it)) + '</td>' +
        '<td class="is-numeric"><strong>' + fmtINR(lineExact) + '</strong></td>' +
      '</tr>';
    }).join('');

    var logoImg = brandLogoUrl();
    var founderImg = pdfAssetUrl('images/Founder-Naseem.webp');

    // ----- Render -----
    stage.innerHTML =
      '<div class="pdf-doc">' +

        '<section class="pdf-block pdf-block--quote">' +

        // === Header ===
        '<div class="pdf-header">' +
          '<div class="pdf-brand-block">' +
            '<div class="pdf-brand-mark">' +
              '<img class="pdf-brand-logo" src="' + escapeHtml(logoImg) + '" alt="WoodenMax" width="120" height="40">' +
            '</div>' +
            '<div class="pdf-brand-text">' +
              '<strong>WoodenMax</strong>' +
              '<span class="pdf-tagline">Premium Aluminium Windows · Facade · Shower Partitions · Pergolas</span>' +
              '<span class="pdf-addr">Manufacturing &amp; HO: 5-6-411/413, Aaghapura, Nampally, Hyderabad 500001<br>' +
                '+91 78953 28080 · info@woodenmax.com · www.woodenmax.in</span>' +
            '</div>' +
          '</div>' +
          '<div class="pdf-meta-block">' +
            '<div class="pdf-meta-doctype">Budget Quotation</div>' +
            '<div class="pdf-meta-table">' +
              '<div class="row"><span class="label">Quote No.</span><span class="value">' + quoteNum + '</span></div>' +
              '<div class="row"><span class="label">Date</span><span class="value">' + dateStr + '</span></div>' +
              '<div class="row"><span class="label">Valid Till</span><span class="value">' + validTill + '</span></div>' +
              '<div class="row"><span class="label">GSTIN</span><span class="value">36ARWPA9740L1Z3</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // === Parties (Bill To + Site) ===
        '<div class="pdf-parties">' +
          '<div class="pdf-party">' +
            '<h2>Bill To</h2>' +
            '<div class="pdf-party-row"><span class="v">' + escapeHtml(lead.name || '—') + '</span></div>' +
            '<div class="pdf-party-row"><span class="k">Mobile:</span> <span class="v">' + escapeHtml(lead.mobile || '—') + '</span></div>' +
            '<div class="pdf-party-row"><span class="k">Email:</span> <span class="v">' + escapeHtml(lead.email || '—') + '</span></div>' +
            '<div class="pdf-party-row"><span class="k">Profile:</span> <span class="v">' + escapeHtml(lead.role || '—') + '</span></div>' +
          '</div>' +
          '<div class="pdf-party">' +
            '<h2>Project / Site</h2>' +
            '<div class="pdf-party-row"><span class="k">City:</span> <span class="v">' + escapeHtml(lead.city || '—') + '</span></div>' +
            '<div class="pdf-party-row"><span class="k">Items:</span> <span class="v">' + cart.length + ' configuration' + (cart.length > 1 ? 's' : '') + '</span></div>' +
            '<div class="pdf-party-row"><span class="k">Site visit:</span> <span class="v">Scheduled · final approval on site</span></div>' +
            '<div class="pdf-party-row"><span class="k">Lead time:</span> <span class="v">3–4 weeks from approval</span></div>' +
          '</div>' +
        '</div>' +

        // === Itemised quote table ===
        '<h3 class="pdf-section-title">Itemised Estimate (Calculator)</h3>' +
        '<table class="pdf-table">' +
          '<thead><tr>' +
            '<th class="is-center" style="width:5%">#</th>' +
            '<th style="width:58%">Item &amp; Specifications</th>' +
            '<th class="is-center" style="width:10%">Qty</th>' +
            '<th class="is-numeric" style="width:27%">Amount (₹)</th>' +
          '</tr></thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +

        // === Totals ===
        '<div class="pdf-totals">' +
          '<table class="pdf-totals-table">' +
            '<tr><td class="label">Subtotal (calculator)</td><td class="value">' + fmtINR(subtotalExact) + '</td></tr>' +
            '<tr><td class="label">GST @ 18% <span style="color:#B45309;font-weight:600">(always extra)</span></td><td class="value">' + fmtINR(gstMid) + '</td></tr>' +
            '<tr><td class="label">Transportation</td><td class="value">' +
              (grandMid >= 1500000
                ? '<span style="color:#047857;font-weight:700">FREE *</span>'
                : '<span style="color:#B45309">At actuals</span>')
            + '</td></tr>' +
            '<tr class="grand"><td class="label">Grand Total (incl. GST)</td><td class="value">' + fmtINR(grandMid) + '</td></tr>' +
          '</table>' +
        '</div>' +

        // === GST + Transport policy notice (always shown) ===
        '<div class="pdf-policy-notice">' +
          '<div class="pdf-policy-row">' +
            '<strong>GST:</strong> 18% is <strong>always extra</strong> on the basic value above. Quoted prices are pre-tax unless explicitly noted.' +
          '</div>' +
          '<div class="pdf-policy-row">' +
            '<strong>Transportation:</strong> ' +
            (grandMid >= 1500000
              ? '<strong style="color:#047857">FREE</strong> for this order — value is above the &#8377;15 Lakh threshold. ' +
                'Applicable only if the site is within <strong>1000 km</strong> by road from the Hyderabad branch. Beyond 1000 km the actual freight cost will be added at confirmation.'
              : '<strong>Extra at actuals</strong> for this order. Charged at confirmation based on actual road freight from the Hyderabad branch. ' +
                'Transport becomes <strong style="color:#047857">FREE</strong> when (a) order value is &#8805; <strong>&#8377;15 Lakh</strong> AND (b) the delivery site is within <strong>1000 km</strong> by road from the Hyderabad branch.') +
          '</div>' +
        '</div>' +

        // === Amount in words ===
        '<div class="pdf-amount-words"><strong>Amount in words:</strong> ' + numToIndianWords(grandMid) + ' (inclusive of GST · indicative).</div>' +

        '</section>' +

        '<section class="pdf-block pdf-block--legal">' +

        // === Terms + Bank ===
        '<div class="pdf-grid-2">' +
          '<div class="pdf-card">' +
            '<h3>Terms &amp; Conditions</h3>' +
            '<ol class="pdf-terms-list">' +
              '<li>This is a <strong>budgetary estimate</strong> from calculator inputs. After <strong>site visit</strong>, <strong>final site approval</strong> is taken on site by our technical team; only then is a binding quotation issued.</li>' +
              '<li><strong>Calculator sizes:</strong> If the customer places the order using sizes entered in this calculator, supply will be for those exact sizes only. If actual site openings differ from calculator inputs, WoodenMax is <strong>not responsible</strong> for resizing, rework, or extra cost.</li>' +
              '<li>Prices are valid for <strong>7 days</strong> from the date above (valid till ' + escapeHtml(validTill) + ') and are subject to revision based on actual aluminium &amp; glass market rates at order time.</li>' +
              '<li><strong>GST @ 18% is always extra</strong> on the basic value. All quoted prices in this document are pre-tax unless explicitly marked "incl. GST".</li>' +
              '<li><strong>Transportation policy:</strong> Delivery is <strong>FREE</strong> when both conditions are met &mdash; (a) total order value &#8805; <strong>&#8377;15 Lakh</strong> (basic, pre-tax), AND (b) the delivery site is within <strong>1,000 km by road</strong> from our Hyderabad branch. For orders below either threshold, road freight is charged at actuals at the time of confirmation.</li>' +
              '<li>Payment terms: <strong>50% advance</strong> with order confirmation, <strong>40%</strong> before dispatch from factory, <strong>10%</strong> on installation completion.</li>' +
              '<li>Standard lead time is <strong>3&ndash;4 weeks</strong> from final measurement &amp; advance receipt; expedited delivery available on request.</li>' +
              '<li>Installation, hardware (handles, locks, rollers), EPDM gaskets and silicone sealant are included unless otherwise noted.</li>' +
              '<li>Civil work (chipping, plastering, painting around the opening), high-rise scaffolding, electrical points and motorisation power supply are <strong>not included</strong>.</li>' +
              '<li>Warranty: <strong>10 years</strong> on aluminium profile against manufacturing defects, <strong>5 years</strong> on hardware, <strong>2 years</strong> on rubber gaskets. Glass breakage in transit or post-installation is not covered.</li>' +
              '<li>Jurisdiction: All disputes are subject to <strong>Hyderabad jurisdiction</strong> only.</li>' +
            '</ol>' +
          '</div>' +
          '<div class="pdf-card">' +
            '<h3>Payment Details</h3>' +
            '<div class="pdf-bank-row"><span class="k">Account Name</span><span class="v">WoodenMax Architectural Elements</span></div>' +
            '<div class="pdf-bank-row"><span class="k">Bank</span><span class="v">HDFC Bank</span></div>' +
            '<div class="pdf-bank-row"><span class="k">Account No.</span><span class="v">50200092938110</span></div>' +
            '<div class="pdf-bank-row"><span class="k">IFSC</span><span class="v">HDFC0001996</span></div>' +
            '<div class="pdf-bank-row"><span class="k">Branch</span><span class="v">Nampally, Hyderabad</span></div>' +
            '<div class="pdf-bank-row"><span class="k">UPI</span><span class="v">' + escapeHtml(COMPANY_UPI_ID) + '</span></div>' +
            '<div class="pdf-bank-row"><span class="k">GSTIN</span><span class="v">36ARWPA9740L1Z3</span></div>' +
            '<div class="pdf-bank-row"><span class="k">PAN</span><span class="v">ARWPA9740L</span></div>' +
            '<h3 style="margin-top:8pt">Contact Sales</h3>' +
            '<div class="pdf-bank-row"><span class="k">Phone</span><span class="v">+91 78953 28080</span></div>' +
            '<div class="pdf-bank-row"><span class="k">Email</span><span class="v">info@woodenmax.com</span></div>' +
            '<div class="pdf-bank-row"><span class="k">Web</span><span class="v">woodenmax.in</span></div>' +
          '</div>' +
        '</div>' +

        '</section>' +

        '<section class="pdf-block pdf-block--closing">' +

        // === Signatures ===
        '<div class="pdf-signatures">' +
          '<div class="pdf-sign-box">' +
            '<strong>Customer Acceptance</strong>' +
            'Signature, Name &amp; Date' +
          '</div>' +
          '<div class="pdf-sign-box" style="text-align:right">' +
            '<strong>For WoodenMax Architectural Elements</strong>' +
            'Authorised Signatory' +
          '</div>' +
        '</div>' +

        // === EEAT trust strip ===
        '<div class="pdf-eeat">' +
          '<div class="pdf-eeat-title">Why WoodenMax — Manufacturer, Not a Reseller</div>' +
          '<div class="pdf-eeat-grid">' +
            '<div class="pdf-eeat-item"><strong>Own Factory</strong><span>In-house CNC fabrication &amp; powder coating in Hyderabad — full control on quality &amp; lead time.</span></div>' +
            '<div class="pdf-eeat-item"><strong>10+ Years · 1,000+ Projects</strong><span>Operating since 2014 from Hyderabad — currently 10–12 live projects across India, managed in-house with our family + partner crews.</span></div>' +
            '<div class="pdf-eeat-item"><strong>Premium Systems</strong><span>Genuine 1.5–2.0 mm profiles, 5–13.52 mm DGU/lami glass, German hardware &amp; EPDM seals.</span></div>' +
            '<div class="pdf-eeat-item"><strong>Warranty &amp; Service</strong><span>10-yr profile, 5-yr hardware, 2-yr gasket warranty with pan-India service network.</span></div>' +
          '</div>' +
          // Real-human accountability line — printed on every quote so
          // the lead knows there is a named owner standing behind the
          // numbers above.  The avatar is the same Founder-Naseem.webp
          // used across the website (SEO + EEAT consistency).
          '<div class="pdf-eeat-founder">' +
            '<img class="pdf-eeat-founder-photo" src="' + escapeHtml(founderImg) + '" alt="Naseem Ahmad — Founder of WoodenMax" width="46" height="46">' +
            '<div class="pdf-eeat-founder-text">' +
              '<strong>Personally backed by Naseem Ahmad</strong>' +
              '<span>Founder &amp; Managing Partner · WoodenMax Architectural Elements · Hyderabad · 2014</span>' +
              '<em>Friday calls 4–6 PM IST · info@woodenmax.com · +91 78953 28080</em>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // === Foot ===
        '<div class="pdf-foot">' +
          '<div class="left">' +
            '<img class="pdf-foot-logo" src="' + escapeHtml(logoImg) + '" alt="WoodenMax" width="100" height="32">' +
            '<strong>WoodenMax Architectural Elements</strong><br>5-6-411/413, Aaghapura,<br>Nampally, Hyderabad 500001</div>' +
          '<div class="center">Thank you for choosing WoodenMax · Quote ' + quoteNum + '</div>' +
          '<div class="right">+91 78953 28080<br>info@woodenmax.com<br>www.woodenmax.in</div>' +
        '</div>' +

        '</section>' +

      '</div>';
  }

  function pdfAssetUrl (relPath) {
    var clean = String(relPath || '').replace(/^\//, '');
    var pathname = (location.pathname || '').replace(/\\/g, '/');
    var parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    if (parts.length && /^[a-zA-Z]:$/.test(parts[0])) parts.shift();
    var last = parts[parts.length - 1] || '';
    var depth = (last && last.indexOf('.') !== -1) ? parts.length - 1 : parts.length;
    var prefix = depth <= 0 ? '' : new Array(depth + 1).join('../');
    var rel = prefix + clean;
    try {
      if (/^https?:$/i.test(location.protocol) && location.href) {
        return new URL(rel, location.href).href;
      }
    } catch (e) {}
    return rel;
  }

  /** Original full-colour WoodenMax logo — reliable in print iframe on mobile */
  function brandLogoUrl () {
    var resolved = pdfAssetUrl('images/woodenmax-logo.webp');
    if (/^https?:\/\//i.test(resolved)) return resolved;
    try {
      var origin = (location.origin || '').replace(/\/$/, '');
      if (origin && origin !== 'null') return origin + '/images/woodenmax-logo.webp';
    } catch (e) { /* ignore */ }
    return 'https://woodenmax.in/images/woodenmax-logo.webp';
  }

  var _wmPrintFrame = null;

  var WM_RECEIPT_INLINE_PRINT_CSS =
    '@page{size:A4 portrait;margin:8mm}' +
    'html,body{margin:0!important;padding:0!important;width:100%!important;background:#fff;color:#0f172a;font:400 10pt/1.45 -apple-system,Segoe UI,Roboto,sans-serif}' +
    '#wmPaymentReceiptStage,#calcPrintStage{display:block!important;position:static!important;width:100%!important;max-width:100%!important;height:auto!important;overflow:visible!important}' +
    '.pdf-doc{width:100%!important;max-width:100%!important;box-sizing:border-box;padding:0}' +
    '.pdf-header,.pdf-parties,.pdf-foot,.pdf-table{width:100%!important;max-width:100%!important;box-sizing:border-box}' +
    '.pdf-table{table-layout:fixed}' +
    '.pdf-brand-logo,.pdf-foot-logo{filter:none!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;object-fit:contain}' +
    '.pdf-brand-mark{width:auto!important;min-width:52pt;height:auto!important;max-height:40pt;border:none;background:transparent;box-shadow:none}' +
    '.pdf-foot-logo{display:block;max-height:28pt;width:auto;margin:0 0 6pt}' +
    '.pdf-header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1pt solid #0f172a;padding-bottom:8pt;margin-bottom:10pt}' +
    '.pdf-brand-text strong{font-size:14pt}' +
    '.pdf-meta-block .row{display:flex;justify-content:space-between;gap:12pt;font-size:9pt;margin:2pt 0}' +
    '.pdf-meta-block .label{color:#64748b}' +
    '.pdf-spec-mini{width:100%;border-collapse:collapse;margin:8pt 0;font-size:9pt}' +
    '.pdf-spec-mini th,.pdf-spec-mini td{border:0.5pt solid #cbd5e1;padding:5pt 6pt;text-align:left}' +
    '.pdf-spec-mini th{background:#f1f5f9}' +
    '.pdf-spec-mini .is-numeric{text-align:right;white-space:nowrap}' +
    '.wm-receipt-timeline{margin:6pt 0 10pt;padding-left:14pt;font-size:9pt}' +
    '.cart-foot-note{margin-top:12pt;font-size:8pt;color:#64748b}' +
    'h3{font-size:10pt;margin:10pt 0 4pt}';

  function printHtmlInIframe (opts) {
    opts = opts || {};
    var title = opts.title || 'WoodenMax';
    var containerId = opts.containerId || 'wmPrintDoc';
    var containerClass = opts.containerClass || '';
    var innerHtml = opts.innerHtml || '';
    if (!innerHtml.trim()) {
      window.print();
      return;
    }

    if (_wmPrintFrame && _wmPrintFrame.parentNode) {
      _wmPrintFrame.parentNode.removeChild(_wmPrintFrame);
    }

    var iframe = document.createElement('iframe');
    iframe.setAttribute('title', title);
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    _wmPrintFrame = iframe;

    var cssHref = pdfAssetUrl('css/calculator-mobile-ux.css');
    var docHtml =
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
      '<title>' + escapeHtml(title) + '</title>' +
      '<link rel="stylesheet" href="' + cssHref.replace(/"/g, '%22') + '">' +
      '<style>' + WM_RECEIPT_INLINE_PRINT_CSS + (opts.extraStyle || '') + '</style>' +
      '</head><body>' +
      '<div id="' + escapeHtml(containerId) + '" class="' + escapeHtml(containerClass) + '">' + innerHtml + '</div>' +
      '</body></html>';

    document.body.appendChild(iframe);

    var iwin = iframe.contentWindow;
    var idoc = iwin.document;
    idoc.open();
    idoc.write(docHtml);
    idoc.close();

    var printed = false;
    function runPrint () {
      if (printed) return;
      printed = true;
      try {
        iwin.focus();
        var cleanup = function () {
          iwin.removeEventListener('afterprint', cleanup);
          try {
            if (typeof window.trackEstimatePrint === 'function') {
              window.trackEstimatePrint(opts.trackKind || 'quote_pdf', opts.itemCount || 0, opts.totalInr || 0);
            }
          } catch (eTr) { /* optional */ }
          setTimeout(function () {
            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
            _wmPrintFrame = null;
          }, 200);
        };
        iwin.addEventListener('afterprint', cleanup);
        iwin.print();
      } catch (err) {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        _wmPrintFrame = null;
        window.print();
      }
    }

    function waitForImages (then) {
      var imgs = idoc.images;
      if (!imgs || !imgs.length) {
        then();
        return;
      }
      var pending = imgs.length;
      var done = false;
      function tick () {
        if (done) return;
        pending -= 1;
        if (pending <= 0) {
          done = true;
          setTimeout(then, 60);
        }
      }
      Array.prototype.forEach.call(imgs, function (img) {
        if (img.complete && img.naturalWidth > 0) tick();
        else {
          img.addEventListener('load', tick);
          img.addEventListener('error', tick);
        }
      });
      setTimeout(function () {
        if (!done) {
          done = true;
          then();
        }
      }, 2500);
    }

    function waitForCss (then) {
      var links = idoc.querySelectorAll('link[rel="stylesheet"]');
      if (!links.length) {
        waitForImages(then);
        return;
      }
      var left = links.length;
      var finished = false;
      function tick () {
        if (finished) return;
        left -= 1;
        if (left <= 0) {
          finished = true;
          setTimeout(function () { waitForImages(then); }, 80);
        }
      }
      Array.prototype.forEach.call(links, function (link) {
        if (link.sheet) tick();
        else {
          link.addEventListener('load', tick);
          link.addEventListener('error', tick);
        }
      });
      setTimeout(function () {
        if (!finished) {
          finished = true;
          waitForImages(then);
        }
      }, 1200);
    }

    iframe.onload = function () { waitForCss(runPrint); };
    setTimeout(function () { waitForCss(runPrint); }, 50);
  }

  function printQuotePdf () {
    var stage = document.getElementById('calcPrintStage');
    var cart = readCart();
    var total = cartGrandTotal(cart).exact;
    try {
      if (typeof window.trackEstimatePdfDownload === 'function') {
        window.trackEstimatePdfDownload(cart.length, total);
      } else if (typeof gtag === 'function') {
        gtag('event', 'estimate_pdf_download', {
          event_category: 'Project Estimate',
          estimate_item_count: cart.length,
          total_amount: total,
          value: Math.round(total || 0),
          non_interaction: false
        });
      }
    } catch (ePdf) { /* optional */ }
    if (!stage || !stage.innerHTML.trim()) {
      window.print();
      return;
    }
    printHtmlInIframe({
      title: 'WoodenMax Budget Quotation',
      containerId: 'calcPrintStage',
      containerClass: 'calc-print-stage',
      innerHtml: stage.innerHTML,
      trackKind: 'quote_pdf',
      itemCount: cart.length,
      totalInr: total
    });
  }

  function jsPathPrefix () {
    var s = document.querySelector('script[src*="calculator-mobile-ux.js"]');
    if (s && s.src) {
      return s.src.replace(/calculator-mobile-ux\.js(?:\?.*)?$/i, '');
    }
    var pathname = window.location.pathname.replace(/\\/g, '/');
    var parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    var last = parts[parts.length - 1] || '';
    var depth = (last && last.indexOf('.') !== -1) ? parts.length - 1 : parts.length;
    if (depth < 0) depth = 0;
    return (depth === 0 ? '' : new Array(depth + 1).join('../')) + 'js/';
  }

  function ensureRazorpayModule () {
    return new Promise(function (resolve, reject) {
      if (window.WoodenMaxRazorpay && typeof window.WoodenMaxRazorpay.startCheckout === 'function') {
        resolve();
        return;
      }
      if (!document.querySelector('script[src*="razorpay-checkout.js"]')) {
        var tag = document.createElement('script');
        tag.src = jsPathPrefix() + 'razorpay-checkout.js';
        tag.defer = true;
        tag.onload = tag.onerror = function () {
          if (window.WoodenMaxRazorpay) resolve();
          else reject(new Error('Payment script could not load'));
        };
        document.body.appendChild(tag);
        return;
      }
      var tries = 0;
      var wait = setInterval(function () {
        tries += 1;
        if (window.WoodenMaxRazorpay) {
          clearInterval(wait);
          resolve();
        } else if (tries > 100) {
          clearInterval(wait);
          reject(new Error('Payment module timeout'));
        }
      }, 50);
    });
  }

  function handleBookOrderPayment (lead, items, submit) {
    ensureRazorpayModule().then(function () {
      runBookOrderPayment(lead, items, submit);
    }).catch(function () {
      if (submit) submit.classList.remove('is-loading');
      showToast('warn', 'Payment module not loaded. Refresh the page (Ctrl+F5) or call <strong>+91 78953 28080</strong>.');
    });
  }

  function runBookOrderPayment (lead, items, submit) {
    if (!window.WoodenMaxRazorpay || typeof window.WoodenMaxRazorpay.startBookingCheckout !== 'function') {
      if (submit) submit.classList.remove('is-loading');
      showToast('warn', 'Payment module not loaded. Refresh the page or call <strong>+91 78953 28080</strong>.');
      return;
    }

    var checkoutFn = window.WoodenMaxRazorpay.startCheckout || window.WoodenMaxRazorpay.startBookingCheckout;
    var modal = $('#calcFormModal');
    var payChoice = 'booking';
    if (modal) {
      payChoice = modal.getAttribute('data-pay-choice') || 'booking';
      var picked = modal.querySelector('input[name="pay_choice"]:checked');
      if (picked && !isCartMixed(items)) payChoice = picked.value;
    }
    if (isCartMixed(items)) payChoice = 'booking';

    checkoutFn({
      lead: lead,
      items: items,
      payChoice: payChoice,
      onStatus: function (_phase, msg) {
        var label = submit && submit.querySelector('.calc-form-submit-label');
        if (label && msg) label.textContent = msg;
      }
    }).then(function (result) {
      var plan = result.plan || getCartPaymentPlan(items, payChoice);
      var paymentMeta = {
        payment_id: result.payment && result.payment.razorpay_payment_id,
        order_id: result.payment && result.payment.razorpay_order_id,
        payment_mode: plan.mode,
        paid_amount_inr: plan.amountInr,
        paid_amount_paise: plan.amountPaise,
        receipt_no: makeReceiptNumber()
      };
      return sendLeadEmail(lead, items, 'order-booking', paymentMeta).then(function (emailRes) {
        if (submit) submit.classList.remove('is-loading');
        closeForm();
        closeSheet();
        printPaymentReceipt(lead, items, paymentMeta);
        var paidMsg = plan.mode === 'mirror_full'
          ? ('<strong>Mirror order confirmed.</strong> ' + fmtINR(plan.amountInr) + ' received. Receipt opened — save or print. ')
          : ('<strong>Order confirmed.</strong> ₹1,000 received. Receipt opened. Balance after site size check. ');
        showToast(
          'success',
          paidMsg + 'Details emailed to you' +
            (lead.email ? ' (<strong>' + escapeHtml(lead.email) + '</strong>)' : '') +
            ' &amp; WoodenMax. Payment ID: <strong>' + escapeHtml(paymentMeta.payment_id || '—') + '</strong>.'
        );
        if (!emailRes || !emailRes.ok) {
          showToast(
            'warn',
            'Payment succeeded but email failed — keep your receipt print &amp; WhatsApp +91 78953 28080.'
          );
        }
      });
    }).catch(function (err) {
      if (submit) submit.classList.remove('is-loading');
      var msg = (err && err.message) ? err.message : 'Payment could not be completed';
      if (window.WoodenMaxRazorpay && window.WoodenMaxRazorpay.formatPaymentError) {
        msg = window.WoodenMaxRazorpay.formatPaymentError(err || msg);
      }
      if (/cancel/i.test(msg)) {
        showToast('warn', 'Payment cancelled. You can try again when ready.');
      } else if (/international/i.test(msg) || /authentication failed|keys galat/i.test(msg)) {
        showToast('warn', msg);
      } else {
        showToast('warn', escapeHtml(msg) + ' — call <strong>+91 78953 28080</strong> if amount was debited.');
      }
    });
  }

  function handleFormSubmit (e) {
    e.preventDefault();
    var form = e.target;
    if (!form.reportValidity()) return;

    var lead = collectLead(form);
    writeLead(lead);

    var modal = $('#calcFormModal');
    var intent = modal ? modal.getAttribute('data-intent') : 'exact';
    var submit = $('#calcFormSubmit');
    if (submit) submit.classList.add('is-loading');

    var items = snapshotItems(intent);

    if (intent === 'book-order') {
      if (!items.length) {
        if (submit) submit.classList.remove('is-loading');
        showToast('warn', '<strong>Estimate is empty.</strong> Save configurations from the calculator, then book order.');
        return;
      }
      handleBookOrderPayment(lead, items, submit);
      return;
    }

    var emailPromise = sendLeadEmail(lead, items, intent);

    emailPromise.then(function (result) {
      if (submit) submit.classList.remove('is-loading');
      closeForm();

      if (intent === 'export-pdf') {
        closeSheet();
        if (!items.length) {
            showToast('warn', '<strong>Estimate is empty.</strong> Save calculator configurations first, then download PDF again.');
          return;
        }
        buildPrintStage(lead, items);
        setTimeout(function () { printQuotePdf(); }, 400);
      } else {
        showExactPriceInline(lead);
      }

      if (result && result.ok) {
        showToast(
          'success',
          'Quote details emailed to <strong>info@woodenmax.com</strong>' +
            (lead.email ? ' with a copy to <strong>' + escapeHtml(lead.email) + '</strong>' : '') +
            '. Our team will reach you on <strong>' + escapeHtml(lead.mobile || '—') + '</strong> within 2 working hours.'
        );
      } else {
        var reason = (result && result.reason) ? result.reason : 'unknown';
        showToast(
          'warn',
          'Network hiccup — we saved your quote locally but couldn\'t email it (' + escapeHtml(reason) + '). ' +
          'Please WhatsApp / call <strong>+91 78953 28080</strong> with screenshot, we\'ll match the price.'
        );
      }
    });
  }

  // ---------- Add-to-Cart button feedback ----------
  function flashAddedFeedback (btn, count) {
    if (!btn) return;
    var label = btn.querySelector('span');
    var orig = label ? label.textContent : '';
    btn.classList.add('is-success');
    if (label) {
      label.textContent = (count && count > 1)
        ? ('✓ ' + count + ' added')
        : '✓ Saved';
    }
    setTimeout(function () {
      btn.classList.remove('is-success');
      if (label) label.textContent = orig;
    }, 1500);
  }

  function buildCartShareText (cart) {
    var lead = readLead() || { name: 'Customer', mobile: '', city: '' };
    var lines = [
      'WoodenMax — Quote Summary',
      'Quote for: ' + (lead.name || 'Customer') + (lead.city ? ' · ' + lead.city : ''),
      ''
    ];
    cart.forEach(function (it, i) {
      lines.push((i + 1) + '. ' + displayProductName(it));
      if (it.area) lines.push('   Size: ' + it.area);
      (it.details || []).forEach(function (d) {
        lines.push('   ' + d.label + ': ' + d.value);
      });
      lines.push('   Amount: ' + fmtINR(itemExactAmount(it)));
      lines.push('');
    });
    var total = cartGrandTotal(cart);
    lines.push('Subtotal: ' + fmtINR(total.exact));
    lines.push('GST 18% extra · Transport per policy');
    lines.push('woodenmax.in');
    return lines.join('\n');
  }

  function shareCartWhatsApp () {
    var cart = readCart();
    if (!cart.length) return;
    var lead = readLead();
    var text = buildCartShareText(cart);
    var phone = '917895328080';
    try {
      if (typeof window.trackEstimateShare === 'function') {
        window.trackEstimateShare('whatsapp', cart.length);
      }
    } catch (eWa) { /* optional */ }
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    if (lead && lead.mobile) {
      showToast('success', 'Opening WhatsApp with your full quote breakdown. Our team: <strong>+91 78953 28080</strong>');
    }
  }

  function shareCartEmail () {
    var cart = readCart();
    if (!cart.length) return;
    var lead = readLead() || {};
    try {
      if (typeof window.trackEstimateShare === 'function') {
        window.trackEstimateShare('email', cart.length);
      }
    } catch (eEm) { /* optional */ }
    var body = buildLeadEmailBody(lead, cart, 'export-pdf');
    var subject = 'WoodenMax Quote — ' + (lead.name || 'Customer') + ' — ' + cart.length + ' item(s)';
    var to = lead.email || 'info@woodenmax.com';
    window.location.href = 'mailto:' + encodeURIComponent(to) +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }

  function injectCalcActionRow () {
    if ($('#calcActionRow')) return;
    if (document.getElementById('grill-add-to-quote')) return;
    var calc = getCalcContainer();
    if (!calc) return;
    var priceDisplay = calc.querySelector('.calc-price-display') ||
      $('#catalogCalcResult') ||
      $('#pricing-output');
    if (!priceDisplay) return;
    var row = document.createElement('div');
    row.className = 'calc-action-row';
    row.id = 'calcActionRow';
    row.hidden = true;
    row.innerHTML =
      '<button type="button" class="calc-add-cart-btn" data-action="add-to-cart">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>' +
        '<span>' + UI.saveInline + '</span>' +
      '</button>' +
      '<p class="calc-action-note">Same details as Get Exact Price — save each opening, then open Project Estimate for PDF, WhatsApp or email.</p>';
    var grillCart = calc.querySelector('#grill-quotation-cart');
    if (grillCart) {
      grillCart.insertAdjacentElement('afterend', row);
    } else {
      priceDisplay.insertAdjacentElement('afterend', row);
    }
  }

  // ---------- Auto-injected scaffolding ----------
  // On real product pages the sticky bar / cart sheet / form modal /
  // print stage are not authored in the HTML. We inject them once if
  // they're missing so every calculator page gets the new UX without
  // requiring per-page HTML edits.
  function bindAddToCartClick (btn, bar) {
    if (!btn || btn._wmCartBound) return;
    btn._wmCartBound = true;
    btn.addEventListener('click', function () {
      var before = readCart().length;
      var item = null;
      var grillEl = document.querySelector('[data-grill-calculator]');
      var grillInst = grillEl && grillEl._wmGrillsCalc;
      if (grillInst && typeof grillInst.addToQuotationAndGlobalCart === 'function') {
        grillInst.addToQuotationAndGlobalCart();
        if (readCart().length > before) {
          item = readCart()[readCart().length - 1];
        }
      } else {
        item = addCurrentToCart();
      }
      if (item) {
        var added = readCart().length - before;
        flashAddedFeedback(btn, added);
        try {
          if (typeof window.trackEstimateItemSaved === 'function') {
            var meta = readProductMeta();
            window.trackEstimateItemSaved(added, {
              totalItems: readCart().length,
              productName: displayProductName(item),
              amount: itemExactAmount(item)
            });
          } else if (typeof gtag === 'function') {
            gtag('event', 'estimate_item_saved', {
              event_category: 'Project Estimate',
              items_added: added,
              non_interaction: false
            });
          }
        } catch (eSave) { /* optional */ }
        if (bar) updateStickyBar(bar);
        var sheet = $('#calcBottomSheet');
        if (sheet && sheet.classList.contains(SHEET_OPEN)) renderSheet();
        showToast(
          'success',
          '<strong>' + (added > 1 ? added + ' configurations saved' : UI.toastSaved) + '</strong> ' + UI.toastOpenEstimate
        );
      }
    });
  }

  var CART_SHEET_HTML =
      // Bottom sheet (Project Estimate)
      '<div class="calc-bottom-sheet" id="calcBottomSheet" aria-hidden="true" role="dialog" aria-label="Your project estimate">' +
        '<div class="calc-sheet-backdrop"></div>' +
        '<div class="calc-sheet-panel">' +
          '<div class="calc-sheet-grabber" aria-hidden="true"></div>' +
          '<div class="calc-sheet-header">' +
            '<h3>' + UI.sheetTitle + ' <span class="calc-sheet-count" id="calcSheetCount">(0)</span></h3>' +
            '<button type="button" class="calc-sheet-close" aria-label="Close estimate">&times;</button>' +
          '</div>' +
          '<div class="calc-sheet-actions" id="calcSheetActions" hidden></div>' +
          '<div class="calc-sheet-scroll" id="calcSheetScroll">' +
            '<div class="calc-sheet-body" id="calcSheetBody"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Gated lead form modal (Get-Exact / PDF)
      '<div class="calc-form-modal" id="calcFormModal" aria-hidden="true" role="dialog" aria-labelledby="calcFormTitle">' +
        '<div class="calc-form-backdrop"></div>' +
        '<div class="calc-form-panel">' +
          '<div class="calc-form-header">' +
            '<h3 id="calcFormTitle">Save &amp; Export PDF</h3>' +
            '<button type="button" class="calc-form-close" aria-label="Close form">&times;</button>' +
          '</div>' +
          '<form id="calcLeadForm" class="calc-form-body" onsubmit="return false;">' +
            '<p class="calc-form-intro" id="calcFormIntro">Fill your details to download a branded quote PDF. We will email a copy too if you share it.</p>' +
            '<div class="calc-pay-choice-block" id="calcPayChoiceBlock" hidden>' +
              '<p class="calc-pay-choice-title">Mirror payment option</p>' +
              '<label class="calc-pay-choice-opt"><input type="radio" name="pay_choice" value="mirror_full"> Pay full order (exact total) — <strong>non-refundable after 3 days</strong></label>' +
              '<label class="calc-pay-choice-opt"><input type="radio" name="pay_choice" value="booking" checked> ₹1,000 booking — <strong>returnable</strong> before production starts</label>' +
            '</div>' +
            '<div class="calc-pay-help calc-pay-help--loading" id="calcPayHelp" hidden>Loading payment mode…</div>' +
            '<div class="calc-form-grid">' +
              '<div class="calc-form-row"><label>Name <em>*</em></label><input type="text" name="name" placeholder="Your full name" required autocomplete="name"></div>' +
              '<div class="calc-form-row"><label>Mobile <em>*</em></label><input type="tel" name="mobile" placeholder="10-digit mobile" pattern="[0-9]{10}" required autocomplete="tel"></div>' +
              '<div class="calc-form-row"><label>City / Pincode <em>*</em></label><input type="text" name="city" placeholder="e.g. Hyderabad / 500001" required autocomplete="address-level2"></div>' +
              '<div class="calc-form-row"><label>Email <small>(optional)</small></label><input type="email" name="email" placeholder="To receive the PDF copy" autocomplete="email"></div>' +
              '<div class="calc-form-row calc-form-row-full"><label>I am a <em>*</em></label>' +
                '<select name="role" required>' +
                  '<option value="">Select\u2026</option>' +
                  '<option>Home Owner</option>' +
                  '<option>Architect</option>' +
                  '<option>Interior Designer</option>' +
                  '<option>Builder / Developer</option>' +
                  '<option>Project Engineer</option>' +
                '</select>' +
              '</div>' +
            '</div>' +
            '<button type="submit" class="calc-form-submit" id="calcFormSubmit"><span class="calc-form-submit-label">Download Quote PDF</span></button>' +
            '<p class="calc-form-trust">' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
              ' Your details are used only for this quote. No spam, no third-party sharing.' +
            '</p>' +
          '</form>' +
        '</div>' +
      '</div>' +

      '<button type="button" class="wm-global-quote-cart" id="wmGlobalQuoteCart" aria-label="Open project estimate">' +
        '<span class="wm-quote-cart-total" id="wmQuoteCartTotal" hidden></span>' +
        '<span class="wm-quote-cart-fab-main">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' +
          '</svg>' +
          '<span class="wm-global-quote-cart-label">' + UI.fabLabel + '</span>' +
          '<span class="wm-global-quote-cart-count">0</span>' +
        '</span>' +
      '</button>';

  function ensurePrintStage () {
    var stage = document.getElementById('calcPrintStage');
    if (!stage) {
      stage = document.createElement('div');
      stage.id = 'calcPrintStage';
      stage.className = 'calc-print-stage';
      stage.setAttribute('aria-hidden', 'true');
      document.body.appendChild(stage);
      return;
    }
    if (stage.parentElement !== document.body) {
      document.body.appendChild(stage);
    }
  }

  function buildCartScaffolding () {
    ensurePrintStage();
    if (document.getElementById('calcBottomSheet')) {
      ensureCartSheetLayout();
      return;
    }
    var holder = document.createElement('div');
    holder.setAttribute('data-calc-mobile-ux-scaffold', 'cart');
    holder.innerHTML = CART_SHEET_HTML;
    document.body.appendChild(holder);
    ensureCartSheetLayout();
  }

  function buildCalcStickyBar () {
    if (!getCalcContainer()) return;
    var existingBar = document.getElementById('calcStickyBar');
    if (existingBar) {
      configureGrillStickyBar(existingBar);
      injectCalcActionRow();
      return;
    }

    var grillPage = isGrillCalcPage();
    var cartSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>';
    var addLabel = grillPage ? UI.saveConfig : UI.saveShort;
    var addClass = grillPage ? 'calc-sticky-add calc-sticky-add--cart' : 'calc-sticky-add';
    var exactBtnHtml = grillPage ? '' :
      '<button type="button" class="calc-sticky-exact" data-form-open="exact" hidden>' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>' +
        '<span>Get Exact</span>' +
      '</button>';

    var holder = document.createElement('div');
    holder.setAttribute('data-calc-mobile-ux-scaffold', 'sticky');
    holder.innerHTML =
      '<div class="calc-sticky-bar" id="calcStickyBar">' +
        '<div class="calc-sticky-bar-content">' +
          '<div class="calc-sticky-info">' +
            '<span class="calc-sticky-label">Live Estimate</span>' +
            '<span class="calc-sticky-price is-placeholder">Enter sizes to see price</span>' +
          '</div>' +
          (grillPage ? '' :
            '<button type="button" class="calc-sticky-buy" data-action="buy-booking" hidden title="Buy online with Razorpay">' +
              '<span>Buy — ₹1,000</span>' +
            '</button>') +
          '<button type="button" class="' + addClass + '" data-action="add-to-cart-sticky" hidden title="Save configuration to project estimate">' +
            cartSvg +
            '<span>' + addLabel + '</span>' +
          '</button>' +
          exactBtnHtml +
        '</div>' +
      '</div>';

    document.body.appendChild(holder);
    configureGrillStickyBar(document.getElementById('calcStickyBar'));
    injectCalcActionRow();
  }

  function buildScaffolding () {
    buildCartScaffolding();
    buildCalcStickyBar();
  }

  var cartUiWired = false;

  function wireGlobalCartUi () {
    if (cartUiWired) return;
    cartUiWired = true;

    var sheet = $('#calcBottomSheet');
    var modal = $('#calcFormModal');

    var globalBtn = document.getElementById('wmGlobalQuoteCart');
    if (globalBtn) {
      globalBtn.addEventListener('click', function () {
        if (sheet && sheet.classList.contains(SHEET_OPEN)) closeSheet(); else openSheet();
      });
    }

    if (sheet) {
      var bd = sheet.querySelector('.calc-sheet-backdrop');
      if (bd) bd.addEventListener('click', closeSheet);
      var cl = sheet.querySelector('.calc-sheet-close');
      if (cl) cl.addEventListener('click', closeSheet);

      sheet.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('[data-cart-action]');
        if (!t) return;
        var action = t.getAttribute('data-cart-action');
        var bar = $('#calcStickyBar');
        if (action === 'remove') {
          removeFromCart(t.getAttribute('data-cart-id'));
          if (bar) updateStickyBar(bar);
          renderSheet();
        } else if (action === 'add-more' || action === 'close') {
          closeSheet();
          var c = getCalcContainer();
          if (c) setTimeout(function () { c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 350);
        } else if (action === 'export-pdf') {
          try {
            if (typeof window.trackEstimateEvent === 'function') {
              window.trackEstimateEvent('estimate_pdf_request', {
                event_label: 'Download PDF Clicked',
                estimate_item_count: readCart().length,
                non_interaction: false
              });
            }
          } catch (ePdfReq) { /* optional */ }
          openForm('export-pdf');
        } else if (action === 'book-order') {
          var cartItems = readCart();
          if (!cartItems.length) {
            showToast('warn', '<strong>Estimate is empty.</strong> Configure the calculator and save configurations first.');
            return;
          }
          if (isCartMixed(cartItems)) {
            openForm('book-order', 'booking');
            return;
          }
          openForm('book-order', t.getAttribute('data-pay-choice') || 'booking');
        } else if (action === 'share-whatsapp') {
          shareCartWhatsApp();
        } else if (action === 'share-email') {
          shareCartEmail();
        }
      });

      var grabber = sheet.querySelector('.calc-sheet-grabber');
      var panel   = sheet.querySelector('.calc-sheet-panel');
      if (grabber && panel) {
        var sy = null, dy = 0;
        grabber.addEventListener('touchstart', function (e) {
          if (!e.touches || !e.touches[0]) return;
          sy = e.touches[0].clientY; dy = 0;
          panel.style.transition = 'none';
        }, { passive: true });
        grabber.addEventListener('touchmove', function (e) {
          if (sy == null || !e.touches || !e.touches[0]) return;
          dy = Math.max(0, e.touches[0].clientY - sy);
          panel.style.transform = 'translateY(' + dy + 'px)';
        }, { passive: true });
        grabber.addEventListener('touchend', function () {
          panel.style.transition = ''; panel.style.transform = '';
          if (dy > 80) closeSheet();
          sy = null;
        });
      }
    }

    if (modal) {
      var fbd = modal.querySelector('.calc-form-backdrop');
      if (fbd) fbd.addEventListener('click', closeForm);
      var fcl = modal.querySelector('.calc-form-close');
      if (fcl) fcl.addEventListener('click', closeForm);
      var form = $('#calcLeadForm');
      if (form && !form._wmLeadBound) {
        form._wmLeadBound = true;
        form.addEventListener('submit', handleFormSubmit);
      }
      var payRadios = modal && modal.querySelectorAll('input[name="pay_choice"]');
      if (payRadios && !modal._wmPayChoiceBound) {
        modal._wmPayChoiceBound = true;
        Array.prototype.forEach.call(payRadios, function (r) {
          r.addEventListener('change', function () {
            syncBookOrderFormUi(r.value);
          });
        });
      }
    }

    if (!window._wmCartEscapeBound) {
      window._wmCartEscapeBound = true;
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var m = $('#calcFormModal');
        var s = $('#calcBottomSheet');
        if (m && m.classList.contains(MODAL_OPEN)) { closeForm(); return; }
        if (s && s.classList.contains(SHEET_OPEN)) { closeSheet(); }
      });
    }

    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY) syncCartBadges();
    });
    window.addEventListener('pageshow', function () {
      syncCartBadges();
      var b = $('#calcStickyBar');
      if (b) updateStickyBar(b);
    });
  }

  function initGlobalCart () {
    try { ensurePrintStage(); } catch (e0) {}
    try { buildCartScaffolding(); } catch (e) {}
    try { wireGlobalCartUi(); } catch (e2) {}
    syncCartBadges();
  }

  // ---------- Init ----------
  function init () {
    initGlobalCart();

    try { buildCalcStickyBar(); } catch (e) {}
    try { injectCalcActionRow(); } catch (e2) {}

    var bar   = $('#calcStickyBar') || $('.calc-sticky-bar');
    var sheet = $('#calcBottomSheet');
    var calc  = getCalcContainer();

    if (!calc) return;
    if (!bar) {
      try { buildCalcStickyBar(); } catch (e3) {}
      bar = $('#calcStickyBar');
    }
    if (!bar) return;
    document.body.classList.add(BODY_FLAG);
    syncCartBadges();

    updateStickyBar(bar);
    syncAddToCartRow();
    setTimeout(function () { bar.classList.add(BAR_VISIBLE); }, 350);

    try {
      if (typeof trackCalculatorPageView === 'function') {
        var meta = readProductMeta();
        trackCalculatorPageView(meta.key || calc.id || location.pathname, meta.name || document.title);
      }
    } catch (ePv) { /* optional */ }

    var debounceTimer = null;
    function scheduleUpdate () {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        updateStickyBar(bar);
        syncAddToCartRow();
      }, 150);
    }
    ['input','change','click'].forEach(function (evt) {
      calc.addEventListener(evt, scheduleUpdate, true);
    });
    document.addEventListener('wm-quote-price-update', scheduleUpdate);
    document.addEventListener('wm-catalog-calc-updated', scheduleUpdate);
    var totalEl = $('#calc-result-total');
    if (totalEl && typeof MutationObserver !== 'undefined') {
      new MutationObserver(scheduleUpdate).observe(totalEl, {
        childList: true, characterData: true, subtree: true
      });
    }
    var grillGrandEl = $('#grill-result-grand');
    if (grillGrandEl && typeof MutationObserver !== 'undefined') {
      new MutationObserver(scheduleUpdate).observe(grillGrandEl, {
        childList: true, characterData: true, subtree: true
      });
    }

    $$('[data-action="add-to-cart"]').forEach(function (addBtn) {
      bindAddToCartClick(addBtn, bar);
    });
    var addSticky = bar.querySelector('[data-action="add-to-cart-sticky"]');
    bindAddToCartClick(addSticky, bar);

    var buySticky = bar.querySelector('[data-action="buy-booking"]');
    if (buySticky && !buySticky._wmBuyBound) {
      buySticky._wmBuyBound = true;
      buySticky.addEventListener('click', function () {
        if (window.WoodenMaxQuote && window.WoodenMaxQuote.openBookOrder) {
          window.WoodenMaxQuote.openBookOrder('booking');
        }
      });
    }

    var exactBtn = bar.querySelector('[data-form-open="exact"]');
    if (exactBtn && !isGrillCalcPage()) {
      exactBtn.addEventListener('click', function () { openForm('exact'); });
    }

    configureGrillStickyBar(bar);

    if (document.querySelector('[data-grill-calculator]')) {
      setTimeout(function () {
        try { injectCalcActionRow(); } catch (eGrill) {}
        syncAddToCartRow();
        syncGrillAddButton();
        updateStickyBar(bar);
        $$('[data-action="add-to-cart"]').forEach(function (addBtn) {
          bindAddToCartClick(addBtn, bar);
        });
      }, 120);
    }
  }

  // ============================================================
  // SITE-WIDE CLEANUP MODULE
  //
  // Run on every page that loads this script. Cleans up the legacy
  // CTAs and dark sections that conflict with the new unified
  // "Get Exact" funnel, and injects the EEAT strip + tighter FAB
  // visibility so all product pages behave identically without
  // touching individual HTML files.
  // ============================================================

  function isInsideNavOrFooter (el) {
    if (!el || !el.closest) return false;
    return !!(
      el.closest('nav') ||
      el.closest('footer') ||
      el.closest('.navbar') ||
      el.closest('.nav-menu') ||
      el.closest('.mobile-menu') ||
      el.closest('.footer') ||
      el.closest('.footer-links') ||
      el.closest('.footer-content') ||
      el.closest('.demo-nav') ||         // demo only
      el.closest('.demo-mini-footer')    // demo only
    );
  }

  /**
   * Hide every body-level Contact-Us / WhatsApp / "Get Free Quote"
   * CTA link. Navbar and footer instances are kept (they are
   * legitimate navigation, not conversion CTAs). Phone (tel:) links
   * are intentionally kept everywhere — owner said only WhatsApp +
   * Contact are removed.
   */
  function cleanupBodyCtas () {
    var selectors = [
      'a[href*="wa.me"]',
      'a[href*="whatsapp.com"]',
      'a[href*="api.whatsapp"]',
      'a[href$="contact.html"]',
      'a[href*="contact?"]',
      'a[href$="/contact"]',
      'a[href*="/contact?"]',
      'a[href*="contact?product"]'
    ];
    var ctaTextPatterns = /(^|\s)(get\s+free\s+quote|request\s+(free\s+)?quote|free\s+(site\s+)?quote|book\s+(free\s+)?(site\s+visit|consultation)|free\s+consultation|request\s+callback)(\s|$)/i;

    var links = document.querySelectorAll(selectors.join(','));
    Array.prototype.forEach.call(links, function (a) {
      if (isInsideNavOrFooter(a)) return;
      a.style.display = 'none';
      a.setAttribute('data-cta-removed', '1');
    });

    // Also hide standalone text buttons matching the conversion-CTA
    // phrases even if their href isn't /contact (some pages use
    // mailto: or onclick handlers).
    var allButtons = document.querySelectorAll('a, button');
    Array.prototype.forEach.call(allButtons, function (el) {
      if (isInsideNavOrFooter(el)) return;
      if (el.hasAttribute('data-cta-removed')) return;
      var txt = (el.textContent || '').trim();
      if (!txt || txt.length > 60) return;
      if (ctaTextPatterns.test(txt)) {
        el.style.display = 'none';
        el.setAttribute('data-cta-removed', '1');
      }
    });
  }

  /**
   * Hide the final dark "Want a … / Free Site Visit / Get Free Quote"
   * section that appears at the bottom of most product pages.
   * Identified by a heading that starts with "Want a" or contains
   * "Free Site Visit" + at least one removed Contact CTA inside.
   */
  function removeFinalCtaSection () {
    var sections = document.querySelectorAll('section');
    Array.prototype.forEach.call(sections, function (sec) {
      if (sec.hasAttribute('data-final-cta-removed')) return;
      var heading = sec.querySelector('h2, h3');
      var hText = heading ? (heading.textContent || '').trim() : '';
      var bodyText = (sec.textContent || '').toLowerCase();
      var looksLikeFinalCta =
        /^want\s+a\b/i.test(hText) ||
        /free\s+site\s+visit/.test(bodyText) ||
        /book\s+free\s+site\s+visit/.test(bodyText);
      if (!looksLikeFinalCta) return;

      // Must contain (or have contained) a Contact / Quote CTA.
      var hasGoneCta = sec.querySelector('[data-cta-removed]') ||
                       /get\s+free\s+quote|book\s+free\s+site\s+visit/i.test(bodyText);
      if (!hasGoneCta) return;

      sec.style.display = 'none';
      sec.setAttribute('data-final-cta-removed', '1');
    });
  }

  /**
   * Inject the 4-card EEAT manufacturer trust strip directly above
   * the calculator container, but only on pages that don't already
   * carry an `.eeat-block` (e.g. the demo page).
   */
  function isMirrorContext () {
    if (document.body.classList.contains('silo-mirror-profiles')) return true;
    return /\/products\/mirror-profiles\//i.test(location.pathname || '');
  }

  function injectEeatBlock () {
    if (document.querySelector('[data-grill-calculator]')) return;
    if (document.querySelector('.eeat-block')) return;
    if (document.body.classList.contains('catalog-seo-page') && document.body.classList.contains('silo-mirror-profiles')) {
      return;
    }
    var calc = getCalcContainer();
    if (!calc) return;
    var section = calc.closest('section') || calc.parentElement;
    if (!section || !section.parentElement) return;

    var mirrorCtx = isMirrorContext();
    var wrap = document.createElement('section');
    wrap.className = 'eeat-block';
    wrap.setAttribute('data-eeat-injected', '1');
    wrap.innerHTML =
      '<div class="container">' +
        '<div class="eeat-strip">' +
          eeatCard(
            '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>',
            'Own Manufacturing Unit',
            'Not a reseller \u2014 we fabricate &amp; install ourselves'
          ) +
          eeatCard(
            '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
            '15+ Years \u2022 Since 2008',
            '500+ residential &amp; commercial projects delivered'
          ) +
          eeatCard(
            '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
            '100+ Live Metro Projects',
            'Hyderabad \u2022 Delhi \u2022 Mumbai \u2022 Bangalore \u2022 Pune \u2022 Jaipur \u2022 Lucknow'
          ) +
          eeatCard(
            '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="m9 14-2 7 5-3 5 3-2-7"/></svg>',
            '10-Year Profile Warranty',
            'ISO 9001 fabrication \u2022 Qualicoat Class 1 paint'
          ) +
        '</div>' +
        // Compact trust-bar below the 4 cards — converts CTR by hitting
        // free-visit / speed / pricing-transparency / social-proof objections.
        '<div class="eeat-trust-bar" role="note">' +
          (mirrorCtx ? '' : '<span class="eeat-trust-sitevisit"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg> <strong>Site visit</strong> \u2014 <strong>final approval on site</strong></span>') +
          '<span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 11 3 3 11 3"/><line x1="3" y1="3" x2="11" y2="11"/><polyline points="21 13 21 21 13 21"/><line x1="21" y1="21" x2="13" y2="13"/></svg> <strong>GST 18%</strong> extra, transparently shown</span>' +
          '<span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> <strong>Free transport</strong> on \u20b915L+ orders <em>(\u2264 1,000 km from HYD)</em></span>' +
          '<span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> <strong>4.8/5</strong> from 500+ clients</span>' +
        '</div>' +
      '</div>';

    section.insertAdjacentElement('afterend', wrap);
  }

  function eeatCard (svgHtml, title, sub) {
    return '<div class="eeat-strip-item">' +
      '<span class="eeat-strip-icon" aria-hidden="true">' + svgHtml + '</span>' +
      '<div><strong>' + title + '</strong><small>' + sub + '</small></div>' +
    '</div>';
  }

  /**
   * Stricter "hide FAB when calculator is in view" logic.
   * Existing js/floating-calc-button.js uses a 200px buffer which
   * makes the FAB disappear too early. We attach an IntersectionObserver
   * that triggers the hide/show only when at least 25% of the calculator
   * is visible — giving the user the FAB right up until they reach the
   * calc, and re-showing it the moment they scroll past.
   */
  function enforceStrictFabHide () {
    var fab = document.querySelector('.floating-calc-button');
    var calc = getCalcContainer();
    if (!fab || !calc || typeof IntersectionObserver === 'undefined') return;

    // Mark the FAB so the old scroll-based logic in floating-calc-button.js
    // can detect this and back off. (We also forcefully apply visibility
    // here every observer fire — last-write-wins.)
    fab.setAttribute('data-strict-hide', '1');

    function setHidden (hidden) {
      fab.style.transition = 'opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.45s';
      if (hidden) {
        fab.style.opacity = '0';
        fab.style.visibility = 'hidden';
        fab.style.pointerEvents = 'none';
        fab.style.transform = 'translateY(12px) scale(0.97)';
      } else {
        fab.style.opacity = '1';
        fab.style.visibility = 'visible';
        fab.style.pointerEvents = 'auto';
        fab.style.transform = 'translateY(0) scale(1)';
      }
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // FAB hides when the calculator is meaningfully on screen.
        var inView = entry.isIntersecting && entry.intersectionRatio > 0.2;
        requestAnimationFrame(function () { setHidden(inView); });
      });
    }, { root: null, rootMargin: '0px', threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.75, 1] });

    io.observe(calc);
  }

  // ---------- Site-wide cleanup bootstrap ----------
  function hideLegacyInlineCalcForm () {
    if (!document.body.classList.contains(BODY_FLAG)) return;
    var legacy = document.getElementById('calc-user-form');
    if (legacy) {
      legacy.style.display = 'none';
      legacy.setAttribute('aria-hidden', 'true');
    }
  }

  function siteCleanupInit () {
    try { cleanupBodyCtas(); } catch (e) {}
    try { removeFinalCtaSection(); } catch (e) {}
    try { injectEeatBlock(); } catch (e) {}
    try { enforceStrictFabHide(); } catch (e) {}
    try { hideLegacyInlineCalcForm(); } catch (e) {}
  }

  window.WoodenMaxQuote = {
    addCurrent: addCurrentToCart,
    readCart: readCart,
    syncGrillQuotation: syncGrillQuotationToCart,
    openCart: openSheet,
    openExactForm: function () { openForm('exact'); },
    openPdfForm: function () { openForm('export-pdf'); },
    openBookOrder: function (payChoice) {
      var cart = readCart();
      if (!cart.length) {
        var added = addCurrentToCart();
        if (!added) {
          showToast('warn', '<strong>Add sizes first.</strong> Configure the calculator, then tap Save Configuration.');
          return;
        }
        syncCartBadges();
      }
      openForm('book-order', payChoice || 'booking');
    },
    readSnapshot: readQuoteSnapshot,
    refresh: function () {
      try { injectCalcActionRow(); } catch (e) {}
      syncCartBadges();
      syncAddToCartRow();
      syncGrillAddButton();
      var bar = $('#calcStickyBar');
      if (bar) updateStickyBar(bar);
      if (bar) {
        $$('[data-action="add-to-cart"]').forEach(function (addBtn) {
          bindAddToCartClick(addBtn, bar);
        });
        bindAddToCartClick(bar.querySelector('[data-action="add-to-cart-sticky"]'), bar);
      }
    },
    ensureCalcActions: function () {
      try { injectCalcActionRow(); } catch (e) {}
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); siteCleanupInit(); });
  } else {
    init();
    siteCleanupInit();
  }
})();
