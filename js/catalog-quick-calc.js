/**
 * Mirror profile live calculator + inquiry form
 */
(function () {
  'use strict';

  var WA = '917895328080';
  var HW = (typeof window !== 'undefined' && window.WM_MIRROR_RATES && window.WM_MIRROR_RATES.hardware) || {};
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

  function hardwareAddons(opts, cfg, mode) {
    var add = 0;
    var list = [];
    if (mode !== 'bevel-modular' && mode !== 'luxury-glass') {
      list.push('Touch sensor ' + (opts.touchAmp === '5' ? '5A' : '3A (standard)'));
      if (opts.touchAmp === '5') add += TOUCH_5A;
      list.push('LED driver ' + opts.driver + 'A' + (opts.driver === '5' ? ' (standard)' : ''));
      if (opts.driver === '7') add += DRIVER_7A;
      if (opts.driver === '10') add += DRIVER_10A;
    }
    if (opts.packing) {
      add += cfg.packing || HW.packingPerPiece || 500;
      list.push('Packing');
    }
    return { add: add, list: list };
  }

  function calcBase(mode, cfg, dims, opts) {
    var sqft = dims.sqft;
    var led = opts.led;
    var base = 0;

    if (mode === 'round-touch' || mode === 'square-touch') {
      base = sqft * ledRate(cfg, led);
    } else if (mode === 'round-slim') {
      base = sqft * ledRate(cfg, led);
    } else if (mode === 'wooden-round') {
      base = sqft * ledRate(cfg, led);
    } else if (mode === 'imported-motion') {
      base = sqft * ledRate(cfg, led);
    } else if (mode === 'rect-led' || mode === 'backlit-touch') {
      base = sqft * ledRate(cfg, led);
    } else if (mode === 'custom-rect-led') {
      if (dims.w < (cfg.minWidth || 2)) return { error: 'Minimum width ' + (cfg.minWidth || 2) + ' ft.' };
      if (dims.h > (cfg.maxHeight || 7)) return { error: 'Maximum height ' + (cfg.maxHeight || 7) + ' ft.' };
      base = sqft * ledRate(cfg, led);
    } else if (mode === 'half-round') {
      base = sqft * ledRate(cfg, led);
    } else if (mode === 'bevel-modular') {
      base = sqft * (cfg.bevel || 850);
      if (opts.profile) base += sqft * (cfg.profileAdd || 250);
      if (opts.ledV120) base += sqft * (cfg.ledV120 || 120);
      if (opts.ledV220) base += sqft * (cfg.ledV220 || 200);
    } else if (mode === 'luxury-glass') {
      var bill = sqft * (cfg.wastage || 1.5);
      base = bill * ledRate(cfg, led);
      if (opts.sensor === 'touch') base += cfg.touchPc || 850;
      if (opts.sensor === 'motion') {
        var g = opts.glassCount || 2;
        base += g * (cfg.motionPerGlass || 1220);
      }
    } else {
      return null;
    }
    return { base: base, sqft: sqft };
  }

  function buildHardwareTable(opts, mode, cfg) {
    var rows = [
      ['Mirror glass', dimsLabel(opts), '—'],
      ['LED strip', opts.led ? opts.led.toUpperCase() : 'V120', '1 yr'],
    ];
    if (mode !== 'bevel-modular') {
      rows.push(['Touch sensor', opts.touchAmp === '5' ? '5A' : '3A', '1 yr']);
      rows.push(['LED driver', opts.driver + 'A', '1 yr']);
    }
    if (opts.packing) rows.push(['Export packing', 'Per piece', '—']);
    if (mode === 'luxury-glass' && opts.sensor === 'motion') {
      rows.push(['Motion sensor', (opts.glassCount || 2) + ' glass', '1 yr']);
    }
    return rows;
  }

  function dimsLabel(opts) {
    return opts.w + '×' + opts.h + ' ft';
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
    };
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

    var hw = hardwareAddons(opts, cfg, mode);
    var perPiece = Math.round(out.base + hw.add);
    var orderTotal = perPiece * qty;

    result.classList.add('is-visible');
    result.innerHTML =
      '<strong>Per piece: ' + fmt(perPiece) + '</strong>' +
      (qty > 1 ? '<p>Order total (' + qty + ' pcs): <strong>' + fmt(orderTotal) + '</strong></p>' : '') +
      '<p>Size ' + dims.w + '×' + dims.h + ' ft · LED ' + (opts.led || 'v120').toUpperCase() +
      ' · Qty ' + qty + '. GST, packing &amp; transit extra.</p>';

    if (hwBox) {
      var rows = buildHardwareTable(opts, mode, cfg);
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
    };

    if (waLink) {
      waLink.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(
        'Mirror quote: ' + root._lastCalc.pageTitle + '\n' +
        dims.w + 'x' + dims.h + ' ft x' + qty + ' pcs\n' +
        'Per piece: ' + fmt(perPiece) + '\nTotal: ' + fmt(orderTotal)
      );
    }
  }

  function bindLive(root) {
    var ids = ['catalogCalcWidth', 'catalogCalcHeight', 'catalogCalcQty', 'catalogCalcLed',
      'catalogCalcTouchAmp', 'catalogCalcDriver', 'catalogCalcPacking', 'catalogCalcProfile',
      'catalogCalcLedV120', 'catalogCalcLedV220', 'catalogCalcSensor', 'catalogCalcGlassCount', 'catalogCalcPreset'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function () { runCalc(root); });
      el.addEventListener('input', function () { runCalc(root); });
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

    var o = snap.opts;
    var msg = [
      'Mirror profile inquiry — ' + snap.pageTitle,
      'Page: ' + (snap.slug || ''),
      'Size: ' + snap.dims.w + ' × ' + snap.dims.h + ' ft',
      'Qty: ' + snap.qty,
      'LED: ' + (o.led || '').toUpperCase(),
      'Touch: ' + (o.touchAmp === '5' ? '5A' : '3A'),
      'Driver: ' + o.driver + 'A',
      'Per piece (calc): ' + fmt(snap.perPiece),
      'Order total (calc): ' + fmt(snap.orderTotal),
      'City: ' + city,
      'Notes: ' + notes,
    ].join('\n');

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
        },
        onError: function () {
          if (status) status.textContent = 'Could not send — please WhatsApp us or call +91 78953 28080.';
        },
      });
    } else {
      window.location.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
    }
  }

  function initMirror(root) {
    bindLive(root);
    var btn = document.getElementById('catalogInqSubmit');
    if (btn) btn.addEventListener('click', function () { submitInquiry(root); });
  }

  function init() {
    var root = document.getElementById('wmCatalogCalc');
    if (!root) return;
    if (root.getAttribute('data-calc-mode')) initMirror(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
