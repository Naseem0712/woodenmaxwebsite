/**
 * WeOS public package calculator — 3-track sliding (29mm_premium).
 * Shows customer package price (2× cost) + live SVG preview only.
 * Loaded only on the 3-track page; does not change other product calculators.
 */
(function () {
  'use strict';

  var WEOS_BASE = (window.WEOS_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
  var PRODUCT_ID = '29mm_premium';
  var STORAGE_KEY = 'wm_weos_pkg_quote_3track';
  var debounceTimer = null;
  var lastQuoteId = null;
  var requestSeq = 0;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function formatInr(n) {
    var v = Math.round(Number(n) || 0);
    try {
      return '₹' + v.toLocaleString('en-IN');
    } catch (e) {
      return '₹' + v;
    }
  }

  function radioValue(name, root) {
    var el = (root || document).querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function buildPanelHtml() {
    return [
      '<section id="wm-weos-package-calc" class="wm-weos-pkg" aria-label="WeOS live package calculator">',
      '  <div class="wm-weos-pkg__head">',
      '    <h3 class="wm-weos-pkg__title">29mm Series · 3-Track Package Quote</h3>',
      '    <p class="wm-weos-pkg__sub">Live WeOS design + package price (fabricator cost + 100% markup). GST extra.</p>',
      '  </div>',
      '  <div class="wm-weos-pkg__grid">',
      '    <div class="wm-weos-pkg__form">',
      '      <div class="wm-weos-pkg__row wm-weos-pkg__row--dims">',
      '        <label>Width (mm)<input type="number" id="weos-w" min="400" max="6000" step="1" value="1500"></label>',
      '        <label>Height (mm)<input type="number" id="weos-h" min="400" max="3600" step="1" value="1200"></label>',
      '      </div>',
      '      <fieldset class="wm-weos-pkg__fieldset">',
      '        <legend>Mesh / Mosquito shutter</legend>',
      '        <label class="wm-weos-pkg__radio"><input type="radio" name="weos-mesh" value="0"> No Mesh</label>',
      '        <label class="wm-weos-pkg__radio"><input type="radio" name="weos-mesh" value="1" checked> Mesh 1</label>',
      '      </fieldset>',
      '      <fieldset class="wm-weos-pkg__fieldset">',
      '        <legend>Glass thickness</legend>',
      '        <label class="wm-weos-pkg__radio"><input type="radio" name="weos-glass" value="5mm"> 5mm</label>',
      '        <label class="wm-weos-pkg__radio"><input type="radio" name="weos-glass" value="6mm"> 6mm</label>',
      '        <label class="wm-weos-pkg__radio"><input type="radio" name="weos-glass" value="8mm"> 8mm</label>',
      '        <label class="wm-weos-pkg__radio"><input type="radio" name="weos-glass" value="10mm" checked> 10mm</label>',
      '      </fieldset>',
      '      <fieldset class="wm-weos-pkg__fieldset">',
      '        <legend>Locking system</legend>',
      '        <label class="wm-weos-pkg__radio"><input type="radio" name="weos-lock" value="single_point"> Single Point</label>',
      '        <label class="wm-weos-pkg__radio"><input type="radio" name="weos-lock" value="multipoint" checked> Multipoint</label>',
      '      </fieldset>',
      '      <fieldset class="wm-weos-pkg__fieldset">',
      '        <legend>Frame colour</legend>',
      '        <label class="wm-weos-pkg__radio"><input type="radio" name="weos-colour" value="Matte Black" checked> Matte Black</label>',
      '        <label class="wm-weos-pkg__radio"><input type="radio" name="weos-colour" value="White"> White</label>',
      '        <label class="wm-weos-pkg__radio"><input type="radio" name="weos-colour" value="Wood Finish"> Wood Finish</label>',
      '      </fieldset>',
      '      <div class="wm-weos-pkg__live">',
      '        <h4>Live Calculation</h4>',
      '        <div class="wm-weos-pkg__meta" id="weos-meta">Configuring…</div>',
      '        <div class="wm-weos-pkg__price-row">',
      '          <span>Total Package Price</span>',
      '          <strong id="weos-package-price">—</strong>',
      '        </div>',
      '        <p class="wm-weos-pkg__note" id="weos-status">Connecting to WeOS…</p>',
      '        <div class="wm-weos-pkg__actions">',
      '          <button type="button" id="weos-open-quote" class="wm-weos-pkg__btn">View package quote</button>',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <div class="wm-weos-pkg__preview-wrap">',
      '      <div class="wm-weos-pkg__preview-label">Live window preview</div>',
      '      <div id="weos-preview" class="wm-weos-pkg__preview" role="img" aria-label="Window elevation preview"></div>',
      '    </div>',
      '  </div>',
      '</section>',
      '<div id="weos-quote-modal" class="wm-weos-pkg__modal" hidden>',
      '  <div class="wm-weos-pkg__modal-card" role="dialog" aria-modal="true" aria-labelledby="weos-modal-title">',
      '    <button type="button" class="wm-weos-pkg__modal-close" id="weos-modal-close" aria-label="Close">×</button>',
      '    <h3 id="weos-modal-title">Package Quotation</h3>',
      '    <div id="weos-modal-body"></div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  function injectStyles() {
    if ($('#wm-weos-pkg-css')) return;
    var css = document.createElement('style');
    css.id = 'wm-weos-pkg-css';
    css.textContent = [
      '.wm-weos-pkg{margin:1.25rem 0 1.75rem;padding:1.25rem;border-radius:12px;background:#0b0f14;color:#f5f5f5;border:1px solid rgba(212,175,55,.25)}',
      '.wm-weos-pkg__title{margin:0 0 .35rem;font-size:1.25rem;color:#d4af37}',
      '.wm-weos-pkg__sub{margin:0 0 1rem;color:#b0b0b0;font-size:.88rem}',
      '.wm-weos-pkg__grid{display:grid;grid-template-columns:1.1fr .9fr;gap:1.25rem}',
      '@media(max-width:900px){.wm-weos-pkg__grid{grid-template-columns:1fr}}',
      '.wm-weos-pkg__row--dims{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.85rem}',
      '.wm-weos-pkg label{display:block;font-size:.85rem;color:#e5e5e5}',
      '.wm-weos-pkg input[type=number]{width:100%;margin-top:.35rem;padding:.65rem .75rem;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:#111827;color:#fff}',
      '.wm-weos-pkg__fieldset{border:0;margin:0 0 .85rem;padding:0}',
      '.wm-weos-pkg__fieldset legend{font-size:.85rem;color:#d4af37;margin-bottom:.4rem;font-weight:600}',
      '.wm-weos-pkg__radio{display:inline-flex;align-items:center;gap:.4rem;margin:0 .9rem .35rem 0;font-size:.9rem;cursor:pointer}',
      '.wm-weos-pkg__live{margin-top:1rem;padding:1rem;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(212,175,55,.2)}',
      '.wm-weos-pkg__live h4{margin:0 0 .5rem;color:#d4af37}',
      '.wm-weos-pkg__meta{font-size:.85rem;color:#c7c7c7;line-height:1.45;margin-bottom:.75rem}',
      '.wm-weos-pkg__price-row{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;font-size:1.05rem}',
      '.wm-weos-pkg__price-row strong{font-size:1.45rem;color:#86efac}',
      '.wm-weos-pkg__note{margin:.65rem 0 0;font-size:.8rem;color:#9ca3af}',
      '.wm-weos-pkg__actions{margin-top:.85rem}',
      '.wm-weos-pkg__btn{padding:.65rem 1rem;border:0;border-radius:8px;background:linear-gradient(135deg,#b8893d,#d4b170);color:#111;font-weight:700;cursor:pointer}',
      '.wm-weos-pkg__preview-wrap{min-height:280px}',
      '.wm-weos-pkg__preview-label{font-size:.8rem;color:#9ca3af;margin-bottom:.5rem}',
      '.wm-weos-pkg__preview{background:#fff;border-radius:10px;min-height:280px;padding:.5rem;display:flex;align-items:center;justify-content:center;overflow:hidden}',
      '.wm-weos-pkg__preview svg{max-width:100%;max-height:420px;height:auto}',
      '.wm-weos-pkg__modal{position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem}',
      '.wm-weos-pkg__modal[hidden]{display:none!important}',
      '.wm-weos-pkg__modal-card{position:relative;background:#111827;color:#f5f5f5;border-radius:12px;max-width:520px;width:100%;padding:1.25rem 1.25rem 1.5rem;border:1px solid rgba(212,175,55,.35)}',
      '.wm-weos-pkg__modal-close{position:absolute;top:.5rem;right:.75rem;background:transparent;border:0;color:#fff;font-size:1.5rem;cursor:pointer}',
      '.wm-weos-pkg__modal-card dl{display:grid;grid-template-columns:auto 1fr;gap:.35rem .75rem;margin:1rem 0;font-size:.92rem}',
      '.wm-weos-pkg__modal-card dt{color:#9ca3af}',
      '.wm-weos-pkg__modal-card dd{margin:0}',
      '.wm-weos-pkg__modal-price{font-size:1.5rem;color:#86efac;font-weight:700}'
    ].join('');
    document.head.appendChild(css);
  }

  function readForm(root) {
    var mesh = radioValue('weos-mesh', root) === '1';
    return {
      product: PRODUCT_ID,
      width: Number($('#weos-w', root).value) || 1500,
      height: Number($('#weos-h', root).value) || 1200,
      qty: 1,
      mesh: mesh,
      meshChoice: mesh ? 'mesh1' : 'no_mesh',
      meshShutters: mesh ? 1 : 0,
      trackCount: mesh ? 3 : 2,
      glassShutters: 2,
      glass: radioValue('weos-glass', root) || '10mm',
      locking: radioValue('weos-lock', root) || 'multipoint',
      colour: radioValue('weos-colour', root) || 'Matte Black',
      quoteId: lastQuoteId || undefined,
      source: 'woodenmax-3track'
    };
  }

  function renderResult(data, root) {
    var meta = $('#weos-meta', root);
    var price = $('#weos-package-price', root);
    var status = $('#weos-status', root);
    var preview = $('#weos-preview', root);
    if (!data || !data.ok) {
      if (status) status.textContent = (data && data.error) || 'Quote unavailable';
      return;
    }
    lastQuoteId = data.quoteId || lastQuoteId;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quoteId: lastQuoteId, at: Date.now() }));
    } catch (e) {}

    if (meta) {
      meta.innerHTML = [
        '<div><strong>' + (data.productName || '29mm SERIES Premium') + '</strong></div>',
        '<div>' + data.widthMm + ' × ' + data.heightMm + ' mm · qty ' + (data.qty || 1) + '</div>',
        '<div>' + (data.trackCount || '—') + '-track · ' + (data.meshLabel || '') + ' · glass ' + (data.glassLabel || '') + '</div>',
        '<div>' + (data.lockingLabel || '') + ' · ' + (data.finishLabel || '') + ' · HW ' + (data.hardwareBrand || '') + '</div>',
        '<div>Area ' + (data.areaSqft || '—') + ' sq.ft</div>',
        '<div style="opacity:.7;font-size:.78rem;margin-top:.25rem">quoteId: ' + (data.quoteId || '—') + '</div>'
      ].join('');
    }
    if (price) price.textContent = formatInr(data.packagePrice);
    if (status) status.textContent = (data.gstNote || 'GST extra') + ' · Package only (no cost breakup)';
    if (preview) {
      if (data.preview && data.preview.svg) {
        preview.innerHTML = data.preview.svg;
      } else {
        preview.innerHTML = '<span style="color:#6b7280">Preview unavailable</span>';
      }
    }
    window.__wmWeosLastPackage = data;
  }

  function openModal(data) {
    var modal = $('#weos-quote-modal');
    var body = $('#weos-modal-body');
    if (!modal || !body || !data) return;
    body.innerHTML = [
      '<p class="wm-weos-pkg__modal-price">' + formatInr(data.packagePrice) + '</p>',
      '<dl>',
      '<dt>Product</dt><dd>' + (data.productName || '') + '</dd>',
      '<dt>Size</dt><dd>' + data.widthMm + ' × ' + data.heightMm + ' mm</dd>',
      '<dt>Qty</dt><dd>' + (data.qty || 1) + '</dd>',
      '<dt>Track / mesh</dt><dd>' + (data.trackCount || '') + '-track · ' + (data.meshLabel || '') + '</dd>',
      '<dt>Glass</dt><dd>' + (data.glassLabel || '') + '</dd>',
      '<dt>Locking</dt><dd>' + (data.lockingLabel || '') + '</dd>',
      '<dt>Finish</dt><dd>' + (data.finishLabel || '') + '</dd>',
      '<dt>Hardware brand</dt><dd>' + (data.hardwareBrand || '') + '</dd>',
      '<dt>Area</dt><dd>' + (data.areaSqft || '') + ' sq.ft</dd>',
      '<dt>Quote ref</dt><dd>' + (data.quoteId || '') + '</dd>',
      '</dl>',
      '<p style="font-size:.8rem;color:#9ca3af">' + (data.gstNote || '') + '</p>'
    ].join('');
    modal.hidden = false;
  }

  function fetchQuote(root) {
    var seq = ++requestSeq;
    var status = $('#weos-status', root);
    if (status) status.textContent = 'Calculating…';
    var payload = readForm(root);
    return fetch(WEOS_BASE + '/api/public/package-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (j) {
          if (!res.ok) throw new Error((j && (j.detail || j.error)) || ('HTTP ' + res.status));
          return j;
        });
      })
      .then(function (data) {
        if (seq !== requestSeq) return;
        renderResult(data, root);
      })
      .catch(function (err) {
        if (seq !== requestSeq) return;
        if (status) status.textContent = 'WeOS error: ' + (err && err.message ? err.message : err);
        var price = $('#weos-package-price', root);
        if (price) price.textContent = '—';
      });
  }

  function schedule(root) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      fetchQuote(root);
    }, 280);
  }

  function syncFromLegacyCalc(root) {
    var track = document.getElementById('calc-track');
    var glass = document.getElementById('calc-glass');
    var color = document.getElementById('calc-color');
    if (track) {
      var meshOn = track.value === '3track';
      var meshRadio = root.querySelector('input[name="weos-mesh"][value="' + (meshOn ? '1' : '0') + '"]');
      if (meshRadio) meshRadio.checked = true;
    }
    if (glass) {
      var g = (glass.value || '5mm').replace(/[^0-9]/g, '');
      if (g === '5' || g === '6' || g === '8') {
        var gr = root.querySelector('input[name="weos-glass"][value="' + g + 'mm"]');
        if (gr) gr.checked = true;
      }
    }
    if (color) {
      var map = { black: 'Matte Black', white: 'White', brown: 'Wood Finish', grey: 'Matte Black', offwhite: 'White' };
      var c = map[color.value] || null;
      if (c) {
        var cr = root.querySelector('input[name="weos-colour"][value="' + c + '"]');
        if (cr) cr.checked = true;
      }
    }
  }

  function bind(root) {
    ['#weos-w', '#weos-h'].forEach(function (sel) {
      var el = $(sel, root);
      if (el) {
        el.addEventListener('input', function () {
          schedule(root);
        });
        el.addEventListener('change', function () {
          schedule(root);
        });
      }
    });
    $all('input[type=radio]', root).forEach(function (el) {
      el.addEventListener('change', function () {
        schedule(root);
      });
    });
    var openBtn = $('#weos-open-quote', root);
    if (openBtn) {
      openBtn.addEventListener('click', function () {
        openModal(window.__wmWeosLastPackage);
      });
    }
    var closeBtn = $('#weos-modal-close');
    var modal = $('#weos-quote-modal');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', function () {
        modal.hidden = true;
      });
      modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.hidden = true;
      });
    }

    ['calc-track', 'calc-glass', 'calc-color'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', function () {
          syncFromLegacyCalc(root);
          schedule(root);
        });
      }
    });
  }

  function restoreQuoteId() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && parsed.quoteId) lastQuoteId = parsed.quoteId;
    } catch (e) {}
  }

  function mount() {
    var host = document.getElementById('price-calculator-3track-sliding');
    if (!host || host.getAttribute('data-weos-pkg') === '1') return;
    host.setAttribute('data-weos-pkg', '1');
    injectStyles();
    restoreQuoteId();

    var anchor = host.querySelector('.calc-header');
    var wrap = document.createElement('div');
    wrap.innerHTML = buildPanelHtml();
    var panel = wrap.firstElementChild;
    var modal = wrap.lastElementChild;
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(panel, anchor.nextSibling);
    } else {
      host.insertBefore(panel, host.firstChild);
    }
    document.body.appendChild(modal);

    // Soft-hide legacy rate range so customer focus is package price
    var legacyPrice = host.querySelector('.calc-price-display');
    if (legacyPrice) {
      legacyPrice.style.opacity = '0.45';
      legacyPrice.title = 'Legacy planning range — use WeOS package price above for live quotation';
    }

    syncFromLegacyCalc(panel);
    bind(panel);
    fetchQuote(panel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
