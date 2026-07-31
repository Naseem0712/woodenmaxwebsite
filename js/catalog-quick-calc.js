/**
 * Mirror profile live calculator + inquiry form
 */
(function () {
  'use strict';

  var WA = '917895328080';
  var RATES = (typeof window !== 'undefined' && window.WM_MIRROR_RATES) || {};
  var HW = RATES.hardware || {};
  var COLOR_CFG = RATES.profileColors || {};
  var PREMIUM_COLOR_PER_SQFT = COLOR_CFG.premiumPerSqft || 45;
  var PREMIUM_COLOR_IDS = COLOR_CFG.premiumIds || ['rose-gold', 'brush-gold'];
  var COLOR_LABELS = COLOR_CFG.labels || {
    'matt-black': 'Matt Black',
    'matt-grey': 'Matt Grey',
    'matt-gold': 'Matt Gold',
    'brush-gold': 'Brush Gold',
    'rose-gold': 'Rose Gold',
  };
  var GLASS_LABELS = { 'saint-gobain': 'Saint Gobain', 'gold-plus': 'Gold Plus' };
  var TOUCH_5A = HW.touch5AUpgrade || 250;
  var DRIVER_7A = HW.driver7AUpgrade || 350;
  var DRIVER_10A = HW.driver10AUpgrade || 450;

  function fmt(n) {
    var s = String(Math.round(n));
    var last = s.slice(-3);
    var rest = s.slice(0, -3);
    if (rest) last = ',' + last;
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return '₹' + rest + last;
  }

  function parseConfig(root) {
    try {
      return JSON.parse(root.getAttribute('data-calc-config') || '{}');
    } catch (e) {
      return {};
    }
  }

  function getDims(wEl, hEl) {
    var w = parseFloat(wEl.value, 10);
    var h = parseFloat(hEl.value, 10);
    if (!w || !h || w <= 0 || h <= 0) return null;
    return { w: w, h: h, sqft: w * h };
  }

  function ledRate(cfg, led) {
    if (led === 'v220') {
      if (cfg.v220 != null) return cfg.v220;
      return (cfg.v120 || 0) + (cfg.v220Extra || 0);
    }
    return cfg.v120 || 0;
  }

  function getSelectedColor() {
    var el = document.querySelector('input[name="catalogCalcColor"]:checked');
    return el ? el.value : 'matt-black';
  }

  function colorLabel(id) {
    return COLOR_LABELS[id] || id;
  }

  function isPremiumColor(id) {
    return PREMIUM_COLOR_IDS.indexOf(id) !== -1;
  }

  function getGlassBrand() {
    var el = document.getElementById('catalogCalcGlassBrand');
    return el ? el.value : 'saint-gobain';
  }

  function glassBrandLabel(id) {
    return GLASS_LABELS[id] || id;
  }

  function hardwareAddons(opts, cfg, mode) {
    var add = 0;
    var list = [];
    var packingAmt = 0;
    if (mode !== 'bevel-modular' && mode !== 'luxury-glass') {
      list.push('Touch sensor ' + (opts.touchAmp === '5' ? '5A (+₹' + TOUCH_5A + ')' : '3A (standard)'));
      if (opts.touchAmp === '5') add += TOUCH_5A;
      list.push('LED driver ' + opts.driver + 'A' + (opts.driver === '5' ? ' (standard)' : opts.driver === '7' ? ' (+₹' + DRIVER_7A + ')' : ' (+₹' + DRIVER_10A + ')'));
      if (opts.driver === '7') add += DRIVER_7A;
      if (opts.driver === '10') add += DRIVER_10A;
    }
    if (opts.packing) {
      packingAmt = cfg.packing || HW.packingPerPiece || 500;
      add += packingAmt;
      list.push('Export packing — ' + fmt(packingAmt) + '/pc');
    }
    list.push('Profile colour — ' + colorLabel(opts.color));
    if (opts.colorPremium > 0) {
      list.push('Premium colour — +' + fmt(opts.colorPremium) + ' (' + PREMIUM_COLOR_PER_SQFT + '/sq.ft)');
    }
    list.push('Mirror glass — ' + glassBrandLabel(opts.glassBrand));
    return { add: add, list: list, packingAmt: packingAmt };
  }

  function calcBase(mode, cfg, dims, opts) {
    var sqft = dims.sqft;
    var led = opts.led;
    var base = 0;
    var ratePerSqft = 0;

    if (mode === 'round-touch' || mode === 'square-touch') {
      ratePerSqft = ledRate(cfg, led);
      base = sqft * ratePerSqft;
    } else if (mode === 'round-slim') {
      ratePerSqft = ledRate(cfg, led);
      base = sqft * ratePerSqft;
    } else if (mode === 'wooden-round') {
      ratePerSqft = ledRate(cfg, led);
      base = sqft * ratePerSqft;
    } else if (mode === 'imported-motion') {
      ratePerSqft = ledRate(cfg, led);
      base = sqft * ratePerSqft;
    } else if (mode === 'rect-led' || mode === 'backlit-touch') {
      ratePerSqft = ledRate(cfg, led);
      base = sqft * ratePerSqft;
    } else if (mode === 'custom-rect-led') {
      if (dims.w < (cfg.minWidth || 2)) return { error: 'Minimum width ' + (cfg.minWidth || 2) + ' ft.' };
      if (dims.h > (cfg.maxHeight || 7)) return { error: 'Maximum height ' + (cfg.maxHeight || 7) + ' ft.' };
      ratePerSqft = ledRate(cfg, led);
      base = sqft * ratePerSqft;
    } else if (mode === 'half-round') {
      ratePerSqft = ledRate(cfg, led);
      base = sqft * ratePerSqft;
    } else if (mode === 'bevel-modular') {
      ratePerSqft = cfg.bevel || 850;
      base = sqft * ratePerSqft;
      if (opts.profile) base += sqft * (cfg.profileAdd || 250);
      if (opts.ledV120) base += sqft * (cfg.ledV120 || 120);
      if (opts.ledV220) base += sqft * (cfg.ledV220 || 200);
    } else if (mode === 'luxury-glass') {
      var bill = sqft * (cfg.wastage || 1.5);
      ratePerSqft = ledRate(cfg, led);
      base = bill * ratePerSqft;
      if (opts.sensor === 'touch') base += cfg.touchPc || 850;
      if (opts.sensor === 'motion') {
        var gc = opts.glassCount || 2;
        base += gc * (cfg.motionPerGlass || 1220);
      }
    } else {
      return null;
    }

    var colorPremium = isPremiumColor(opts.color) ? sqft * PREMIUM_COLOR_PER_SQFT : 0;
    base += colorPremium;

    return { base: base, sqft: sqft, ratePerSqft: ratePerSqft, colorPremium: colorPremium };
  }

  function buildHardwareTable(opts, mode) {
    var rows = [
      ['Mirror glass', glassBrandLabel(opts.glassBrand) + ' · ' + opts.w + '×' + opts.h + ' ft', '—'],
      ['Profile colour', colorLabel(opts.color) + (opts.colorPremium ? ' (premium)' : ''), '—'],
      ['LED strip', opts.led ? opts.led.toUpperCase() : 'V120', '1 yr'],
    ];
    if (mode !== 'bevel-modular' && mode !== 'luxury-glass') {
      rows.push(['Touch sensor', opts.touchAmp === '5' ? '5A' : '3A', '1 yr']);
      rows.push(['LED driver', opts.driver + 'A', '1 yr']);
    }
    if (opts.packing) rows.push(['Export packing', fmt(opts.packingAmt || HW.packingPerPiece || 500) + '/pc', '—']);
    if (mode === 'luxury-glass' && opts.sensor === 'motion') {
      rows.push(['Motion sensor', (opts.glassCount || 2) + ' glass', '1 yr']);
    }
    return rows;
  }

  function renderHwTable(rows) {
    var html = '<table class="cluster-table catalog-hw-mini"><thead><tr><th>Item</th><th>Spec</th><th>Warranty</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>';
    });
    return html + '</tbody></table>';
  }

  function collectOpts(root) {
    var ledEl = document.getElementById('catalogCalcLed');
    var color = getSelectedColor();
    return {
      led: ledEl ? ledEl.value : 'v120',
      touchAmp: document.getElementById('catalogCalcTouchAmp') ? document.getElementById('catalogCalcTouchAmp').value : '3',
      driver: document.getElementById('catalogCalcDriver') ? document.getElementById('catalogCalcDriver').value : '5',
      packing: document.getElementById('catalogCalcPacking') ? document.getElementById('catalogCalcPacking').checked : false,
      profile: document.getElementById('catalogCalcProfile') ? document.getElementById('catalogCalcProfile').checked : false,
      ledV120: document.getElementById('catalogCalcLedV120') ? document.getElementById('catalogCalcLedV120').checked : false,
      ledV220: document.getElementById('catalogCalcLedV220') ? document.getElementById('catalogCalcLedV220').checked : false,
      sensor: document.getElementById('catalogCalcSensor') ? document.getElementById('catalogCalcSensor').value : 'none',
      glassCount: document.getElementById('catalogCalcGlassCount') ? parseInt(document.getElementById('catalogCalcGlassCount').value, 10) || 2 : 2,
      color: color,
      glassBrand: getGlassBrand(),
    };
  }

  function buildInquiryMessage(snap, name, phone, email, city, notes) {
    var o = snap.opts;
    var lines = [
      'Mirror profile inquiry — ' + snap.pageTitle,
      'Page: woodenmax.in/products/mirror-profiles/' + (snap.slug || ''),
      '',
      'Size: ' + snap.dims.w + ' × ' + snap.dims.h + ' ft (' + snap.dims.sqft.toFixed(2) + ' sq.ft)',
      'Qty: ' + snap.qty + ' piece(s)',
      'Rate (LED/base): ₹' + Math.round(snap.ratePerSqft || 0) + '/sq.ft',
      'Profile colour: ' + colorLabel(o.color) + (o.colorPremium ? ' (+₹' + PREMIUM_COLOR_PER_SQFT + '/sq.ft premium)' : ''),
      'Mirror glass: ' + glassBrandLabel(o.glassBrand),
      'LED: ' + (o.led || 'v120').toUpperCase(),
    ];
    if (snap.mode !== 'bevel-modular' && snap.mode !== 'luxury-glass') {
      lines.push('Touch sensor: ' + (o.touchAmp === '5' ? '5A upgrade' : '3A standard'));
      lines.push('LED driver: ' + o.driver + 'A');
    }
    if (o.packing) lines.push('Packing: Yes — ' + fmt(snap.packingAmt || HW.packingPerPiece || 500) + '/pc');
    else lines.push('Packing: No');
    lines.push('');
    lines.push('Hardware: ' + (snap.hardwareList || []).join('; '));
    lines.push('Per piece (calc): ' + fmt(snap.perPiece));
    lines.push('Order total (calc): ' + fmt(snap.orderTotal));
    lines.push('');
    lines.push('Name: ' + (name || '—'));
    lines.push('Mobile: ' + phone);
    lines.push('Email: ' + (email || '—'));
    lines.push('City: ' + (city || '—'));
    if (notes) lines.push('Notes: ' + notes);
    return lines.join('\n');
  }

  function whenQuoteReady(fn, attempt) {
    attempt = attempt || 0;
    if (window.WoodenMaxQuote && typeof window.WoodenMaxQuote.openBookOrder === 'function') {
      fn();
      return;
    }
    if (attempt > 50) {
      window.alert('Payment is still loading. Please wait a few seconds and try again.');
      return;
    }
    setTimeout(function () { whenQuoteReady(fn, attempt + 1); }, 120);
  }

  function openCatalogCheckout(payChoice) {
    var root = document.getElementById('wmCatalogCalc');
    if (!root || !root._lastCalc) {
      window.alert('Enter width and height in the calculator first, then use Buy online.');
      return;
    }
    whenQuoteReady(function () {
      window.WoodenMaxQuote.openBookOrder(payChoice || 'booking');
    });
  }

  function ensureCatalogBuyActions(root) {
    var result = document.getElementById('catalogCalcResult');
    if (!result) return null;
    var box = document.getElementById('catalogBuyActions');
    if (!box) {
      box = document.createElement('div');
      box.id = 'catalogBuyActions';
      box.className = 'catalog-buy-actions';
      box.setAttribute('role', 'group');
      box.setAttribute('aria-label', 'Buy online');
      box.innerHTML =
        '<p class="catalog-buy-lead"><strong>Buy online</strong> — secure checkout via Razorpay (UPI, card, netbanking). ' +
        '₹1,000 booking reserves your slot; full mirror order can be paid from cart.</p>' +
        '<div class="catalog-buy-btns">' +
          '<button type="button" class="catalog-buy-btn catalog-buy-btn--primary" data-catalog-pay="booking">' +
            'Buy online — Pay ₹1,000' +
          '</button>' +
          '<button type="button" class="catalog-buy-btn" data-catalog-pay="mirror_full">' +
            'Buy now — pay full calculator total' +
          '</button>' +
          '<button type="button" class="catalog-buy-btn catalog-buy-btn--ghost" data-catalog-pay="cart">' +
            'Add to cart' +
          '</button>' +
        '</div>' +
        '<p class="catalog-buy-policy">Refund before production · <a href="/policies/cancellation-refund-policy">Cancellation policy</a></p>';
      result.insertAdjacentElement('afterend', box);
      box.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('[data-catalog-pay]');
        if (!btn) return;
        var mode = btn.getAttribute('data-catalog-pay');
        if (mode === 'cart') {
          whenQuoteReady(function () {
            if (window.WoodenMaxQuote.addCurrent) {
              var item = window.WoodenMaxQuote.addCurrent();
              if (item && window.WoodenMaxQuote.openCart) window.WoodenMaxQuote.openCart();
            }
          });
          return;
        }
        openCatalogCheckout(mode === 'mirror_full' ? 'mirror_full' : 'booking');
      });
    }
    return box;
  }

  function syncCatalogBuyVisibility(root) {
    var box = ensureCatalogBuyActions(root);
    if (!box) return;
    var ready = !!(root && root._lastCalc && (root._lastCalc.orderTotal || root._lastCalc.perPiece));
    box.hidden = !ready;
    var fullBtn = box.querySelector('[data-catalog-pay="mirror_full"]');
    if (fullBtn) {
      var tot = root._lastCalc.orderTotal || root._lastCalc.perPiece;
      fullBtn.textContent = 'Buy now — Pay ' + fmt(tot);
      fullBtn.hidden = !(tot >= 1);
    }
    try {
      document.dispatchEvent(new CustomEvent('wm-catalog-calc-updated'));
    } catch (err) { /* optional */ }
  }

  function injectHeroBuyCta() {
    var heroCta = document.querySelector('.cluster-hero-cta');
    if (!heroCta || heroCta.querySelector('[data-catalog-hero-buy]')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cluster-cta-primary catalog-hero-buy';
    btn.setAttribute('data-catalog-hero-buy', '1');
    btn.textContent = 'Buy online — Pay ₹1,000';
    heroCta.insertBefore(btn, heroCta.firstChild);
    btn.addEventListener('click', function () {
      var calc = document.getElementById('wmCatalogCalc');
      if (calc) calc.scrollIntoView({ behavior: 'smooth', block: 'start' });
      openCatalogCheckout('booking');
    });
  }

  function runCalc(root) {
    var mode = root.getAttribute('data-calc-mode');
    var cfg = parseConfig(root);
    var wEl = document.getElementById('catalogCalcWidth');
    var hEl = document.getElementById('catalogCalcHeight');
    var qtyEl = document.getElementById('catalogCalcQty');
    var result = document.getElementById('catalogCalcResult');
    var hwBox = document.getElementById('catalogCalcHwSummary');
    var waLink = document.getElementById('catalogCalcWa');
    if (!wEl || !hEl || !result) return;

    var dims = getDims(wEl, hEl);
    if (!dims) {
      result.classList.add('is-visible');
      result.innerHTML = '<p>Enter valid width and height.</p>';
      return;
    }

    var opts = collectOpts(root);
    opts.w = dims.w;
    opts.h = dims.h;
    var qty = qtyEl ? Math.max(1, parseInt(qtyEl.value, 10) || 1) : 1;

    var out = calcBase(mode, cfg, dims, opts);
    if (!out) return;
    if (out.error) {
      result.innerHTML = '<p>' + out.error + '</p>';
      result.classList.add('is-visible');
      return;
    }

    opts.colorPremium = out.colorPremium;
    var hw = hardwareAddons(opts, cfg, mode);
    opts.colorPremium = out.colorPremium;
    var perPiece = Math.round(out.base + hw.add);
    var orderTotal = perPiece * qty;

    result.classList.add('is-visible');
    result.innerHTML =
      '<strong>Per piece: ' + fmt(perPiece) + '</strong>' +
      (qty > 1 ? '<p>Order total (' + qty + ' pcs): <strong>' + fmt(orderTotal) + '</strong></p>' : '') +
      '<p>Size ' + dims.w + '×' + dims.h + ' ft · ' + colorLabel(opts.color) +
      ' · ' + glassBrandLabel(opts.glassBrand) + ' · LED ' + (opts.led || 'v120').toUpperCase() +
      ' · Qty ' + qty + '. GST &amp; transit extra.</p>';

    if (hwBox) {
      var rows = buildHardwareTable(opts, mode);
      hwBox.innerHTML = '<h3 class="catalog-hw-title">Your hardware list</h3>' + renderHwTable(rows);
    }

    root._lastCalc = {
      pageTitle: root.getAttribute('data-page-title'),
      slug: root.getAttribute('data-page-slug'),
      dims: dims,
      qty: qty,
      opts: opts,
      perPiece: perPiece,
      orderTotal: orderTotal,
      mode: mode,
      ratePerSqft: out.ratePerSqft,
      packingAmt: hw.packingAmt,
      hardwareList: hw.list,
    };

    if (waLink) {
      var name = (document.getElementById('catalogInqName') || {}).value || '';
      var phone = (document.getElementById('catalogInqPhone') || {}).value || '';
      var email = (document.getElementById('catalogInqEmail') || {}).value || '';
      var city = (document.getElementById('catalogInqCity') || {}).value || '';
      waLink.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(
        buildInquiryMessage(root._lastCalc, name, phone, email, city, '')
      );
    }

    if (root.getAttribute('data-calc-mode')) {
      trackCatalogCalcRun(root, root._lastCalc);
    }
    syncCatalogBuyVisibility(root);
  }

  function bindLive(root) {
    var ids = ['catalogCalcWidth', 'catalogCalcHeight', 'catalogCalcQty', 'catalogCalcLed',
      'catalogCalcTouchAmp', 'catalogCalcDriver', 'catalogCalcPacking', 'catalogCalcProfile',
      'catalogCalcLedV120', 'catalogCalcLedV220', 'catalogCalcSensor', 'catalogCalcGlassCount',
      'catalogCalcPreset', 'catalogCalcGlassBrand'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function () { runCalc(root); });
      el.addEventListener('input', function () { runCalc(root); });
    });
    document.querySelectorAll('input[name="catalogCalcColor"]').forEach(function (el) {
      el.addEventListener('change', function () { runCalc(root); });
    });
    ['catalogInqName', 'catalogInqPhone', 'catalogInqEmail', 'catalogInqCity'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { runCalc(root); });
    });
    var preset = document.getElementById('catalogCalcPreset');
    var wEl = document.getElementById('catalogCalcWidth');
    var hEl = document.getElementById('catalogCalcHeight');
    if (preset && wEl && hEl) {
      preset.addEventListener('change', function () {
        if (!preset.value) return;
        var p = preset.value.split(',');
        wEl.value = p[0];
        hEl.value = p[1];
        runCalc(root);
      });
    }
    runCalc(root);
  }

  function submitInquiry(root) {
    var status = document.getElementById('catalogInqStatus');
    var name = (document.getElementById('catalogInqName') || {}).value || '';
    var phone = (document.getElementById('catalogInqPhone') || {}).value || '';
    var email = (document.getElementById('catalogInqEmail') || {}).value || '';
    var city = (document.getElementById('catalogInqCity') || {}).value || '';
    var notes = (document.getElementById('catalogInqNotes') || {}).value || '';
    var snap = root._lastCalc;

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      if (status) status.textContent = 'Please enter a valid mobile number.';
      return;
    }
    if (!snap) {
      if (status) status.textContent = 'Enter mirror size first so we can attach calculator details.';
      return;
    }

    var msg = buildInquiryMessage(snap, name, phone, email, city, notes);

    if (window.EmailSubmitter) {
      window.EmailSubmitter.submit({
        subject: 'Mirror calculator inquiry — ' + snap.pageTitle,
        message: msg,
        userDetails: {
          name: name,
          email: email,
          mobile: phone,
          city: city,
        },
        onSuccess: function () {
          if (status) status.textContent = 'Thank you — we will email/WhatsApp your formal quote within 24 hours.';
          try {
            if (typeof window.trackMirrorInquirySubmit === 'function') {
              window.trackMirrorInquirySubmit(snap);
            } else if (typeof window.trackCalculatorFormSubmit === 'function') {
              window.trackCalculatorFormSubmit('mirror_catalog', !!(snap && snap.orderTotal));
            }
          } catch (e) { /* optional */ }
        },
        onError: function () {
          if (status) status.textContent = 'Could not send — opening WhatsApp with your quote details.';
          window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank');
        },
      });
    } else {
      window.location.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
    }
  }

  function trackCatalogCalcRun(root, snap) {
    try {
      if (typeof window.trackMirrorCalculatorRun === 'function' && snap) {
        window.trackMirrorCalculatorRun(snap);
        return;
      }
      if (typeof window.trackCalculatorCalculation === 'function' && snap) {
        window.trackCalculatorCalculation(snap.orderTotal || snap.perPiece, snap.dims ? snap.dims.w * snap.dims.h : 0, {
          glass: snap.opts && snap.opts.glassBrand,
          coating: snap.opts && snap.opts.color,
          lock: snap.mode || 'mirror',
          mesh: false
        });
      } else if (typeof gtag === 'function') {
        gtag('event', 'calculator_calculation', {
          event_category: 'Calculator',
          event_label: root.getAttribute('data-page-slug') || 'mirror_catalog',
          total_cost: snap ? snap.orderTotal || snap.perPiece : 0,
          non_interaction: true
        });
      }
    } catch (e) { /* optional */ }
  }

  function initMirror(root) {
    ensureCatalogBuyActions(root);
    injectHeroBuyCta();
    bindLive(root);
    try {
      if (typeof window.trackCalculatorPageView === 'function') {
        window.trackCalculatorPageView(
          root.getAttribute('data-page-slug') || 'mirror',
          root.getAttribute('data-page-title') || document.title
        );
      }
    } catch (e) { /* optional */ }
    var btn = document.getElementById('catalogInqSubmit');
    if (btn) btn.addEventListener('click', function () { submitInquiry(root); });
  }

  function loadStandardSizePackages() {
    function mount() {
      if (window.WMStandardPackages && typeof window.WMStandardPackages.mountAll === 'function') {
        try { window.WMStandardPackages.mountAll(); } catch (eMount) { /* ignore */ }
      }
    }
    if (window.WMStandardPackages) {
      mount();
      return;
    }
    if (document.getElementById('wm-std-pkg-script')) {
      document.getElementById('wm-std-pkg-script').addEventListener('load', mount);
      return;
    }
    var s = document.createElement('script');
    s.id = 'wm-std-pkg-script';
    s.src = '/js/standard-size-packages.js?v=20260801a';
    s.defer = true;
    s.onload = mount;
    document.head.appendChild(s);
  }

  function init() {
    var root = document.getElementById('wmCatalogCalc');
    if (!root) return;
    if (root.getAttribute('data-calc-mode')) initMirror(root);
    loadStandardSizePackages();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
