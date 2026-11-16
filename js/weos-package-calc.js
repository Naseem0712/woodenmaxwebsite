/**
 * WeOS public package calculator — 3-track sliding (29mm_premium).
 * Compact white WoodenMax card: package price (2× cost) + live SVG + quote save/export.
 */
(function () {
  'use strict';

  var WEOS_BASE = (window.WEOS_API_BASE || 'http://127.0.0.1:8000').replace(/\/$/, '');
  var PRODUCT_ID = '29mm_premium';
  var STORAGE_KEY = 'wm_weos_pkg_quote_3track';
  var debounceTimer = null;
  var lastQuoteId = null;
  var lastProjectId = null;
  var requestSeq = 0;

  var GLASS_OPTIONS = [
    { id: '5mm_clear_toughened', label: '5mm clear' },
    { id: '6mm_toughened', label: '6mm clear' },
    { id: '8mm_toughened', label: '8mm clear' },
    { id: '10mm_toughened', label: '10mm clear' },
    { id: 'dgu_5_8_5', label: 'DGU 5+8A+5' },
    { id: 'dgu_5_8_5_argon', label: 'DGU 5+8A+5 argon' },
    { id: 'dgu_6_8_6', label: 'DGU 6+8A+6' },
    { id: 'dgu_6_8_6_argon', label: 'DGU 6+8A+6 argon' },
    { id: 'dgu_5_12_5', label: 'DGU 5+12A+5' },
    { id: 'dgu_5_12_5_argon', label: 'DGU 5+12A+5 argon' },
    { id: 'lam_5_152_5', label: 'Lam 5+1.52+5' },
    { id: 'lam_5_152_6', label: 'Lam 5+1.52+6' },
    { id: 'lam_6_152_5', label: 'Lam 6+1.52+5' },
    { id: 'lam_6_152_6', label: 'Lam 6+1.52+6' }
  ];

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

  function glassSelectHtml() {
    return GLASS_OPTIONS.map(function (g, i) {
      return '<option value="' + g.id + '"' + (g.id === '10mm_toughened' ? ' selected' : '') + '>' + g.label + '</option>';
    }).join('');
  }

  function buildPanelHtml() {
    return [
      '<section id="wm-weos-package-calc" class="wm-weos-pkg" aria-label="WeOS live package calculator">',
      '  <header class="wm-weos-pkg__head">',
      '    <div>',
      '      <p class="wm-weos-pkg__eyebrow">WoodenMax · WeOS live</p>',
      '      <h3 class="wm-weos-pkg__title">29mm package quote</h3>',
      '    </div>',
      '    <p class="wm-weos-pkg__sub">Fabricator cost + 100% markup · GST extra</p>',
      '  </header>',
      '  <div class="wm-weos-pkg__layout">',
      '    <div class="wm-weos-pkg__form">',
      '      <div class="wm-weos-pkg__row">',
      '        <label>W mm<input type="number" id="weos-w" min="400" max="6000" step="1" value="1500"></label>',
      '        <label>H mm<input type="number" id="weos-h" min="400" max="3600" step="1" value="1200"></label>',
      '        <label>Glass<select id="weos-glass">' + glassSelectHtml() + '</select></label>',
      '      </div>',
      '      <div class="wm-weos-pkg__chips">',
      '        <fieldset class="wm-weos-pkg__chipset">',
      '          <legend>Shutters</legend>',
      '          <label><input type="radio" name="weos-glass-n" value="3" checked> 3 glass · side</label>',
      '          <label><input type="radio" name="weos-glass-n" value="4"> 4 glass · center</label>',
      '        </fieldset>',
      '        <fieldset class="wm-weos-pkg__chipset" id="weos-mesh-set">',
      '          <legend>Mesh</legend>',
      '          <label><input type="radio" name="weos-mesh" value="0" checked> None</label>',
      '          <label id="weos-mesh-2-wrap"><input type="radio" name="weos-mesh" value="2"> 2 mesh</label>',
      '        </fieldset>',
      '        <fieldset class="wm-weos-pkg__chipset">',
      '          <legend>Lock</legend>',
      '          <label><input type="radio" name="weos-lock" value="single_point"> Single</label>',
      '          <label><input type="radio" name="weos-lock" value="multipoint" checked> Multi</label>',
      '        </fieldset>',
      '        <fieldset class="wm-weos-pkg__chipset">',
      '          <legend>Colour</legend>',
      '          <label><input type="radio" name="weos-colour" value="Matte Black" checked> Black</label>',
      '          <label><input type="radio" name="weos-colour" value="White"> White</label>',
      '          <label><input type="radio" name="weos-colour" value="Wood Finish"> Wood</label>',
      '        </fieldset>',
      '      </div>',
      '      <div class="wm-weos-pkg__live">',
      '        <div class="wm-weos-pkg__price-row">',
      '          <div>',
      '            <div class="wm-weos-pkg__price-label">Package price</div>',
      '            <div class="wm-weos-pkg__meta" id="weos-meta">Configuring…</div>',
      '          </div>',
      '          <strong id="weos-package-price">—</strong>',
      '        </div>',
      '        <p class="wm-weos-pkg__note" id="weos-status">Connecting…</p>',
      '        <div class="wm-weos-pkg__actions">',
      '          <button type="button" id="weos-save-quote" class="wm-weos-pkg__btn">Add / save quote</button>',
      '          <button type="button" id="weos-export-quote" class="wm-weos-pkg__btn wm-weos-pkg__btn--ghost">Export</button>',
      '          <button type="button" id="weos-open-quote" class="wm-weos-pkg__btn wm-weos-pkg__btn--ghost">Details</button>',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <div class="wm-weos-pkg__preview-wrap">',
      '      <div id="weos-preview" class="wm-weos-pkg__preview" role="img" aria-label="Window elevation preview"></div>',
      '    </div>',
      '  </div>',
      '</section>',
      '<div id="weos-quote-modal" class="wm-weos-pkg__modal" hidden>',
      '  <div class="wm-weos-pkg__modal-card" role="dialog" aria-modal="true" aria-labelledby="weos-modal-title">',
      '    <button type="button" class="wm-weos-pkg__modal-close" id="weos-modal-close" aria-label="Close">×</button>',
      '    <h3 id="weos-modal-title">Package quotation</h3>',
      '    <div id="weos-modal-body"></div>',
      '  </div>',
      '</div>',
      '<div id="weos-save-modal" class="wm-weos-pkg__modal" hidden>',
      '  <div class="wm-weos-pkg__modal-card" role="dialog" aria-modal="true" aria-labelledby="weos-save-title">',
      '    <button type="button" class="wm-weos-pkg__modal-close" id="weos-save-close" aria-label="Close">×</button>',
      '    <h3 id="weos-save-title">Save quote</h3>',
      '    <form id="weos-save-form" class="wm-weos-pkg__save-form">',
      '      <label>Customer name<input id="weos-cust-name" required placeholder="Name"></label>',
      '      <label>Mobile<input id="weos-cust-mobile" required inputmode="tel" placeholder="10-digit mobile"></label>',
      '      <label>Address<textarea id="weos-cust-address" rows="2" placeholder="Optional"></textarea></label>',
      '      <button type="submit" class="wm-weos-pkg__btn">Save &amp; get export links</button>',
      '      <p class="wm-weos-pkg__note" id="weos-save-status"></p>',
      '    </form>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  function injectStyles() {
    if ($('#wm-weos-pkg-css')) return;
    var css = document.createElement('style');
    css.id = 'wm-weos-pkg-css';
    css.textContent = [
      '.wm-weos-pkg{margin:1rem 0 1.25rem;padding:1rem 1.1rem;border-radius:14px;background:#fff;color:#0b0b0b;border:1px solid #e5e7eb;box-shadow:0 1px 2px rgba(15,23,42,.04)}',
      '.wm-weos-pkg__head{display:flex;justify-content:space-between;align-items:flex-end;gap:.75rem;margin-bottom:.75rem;flex-wrap:wrap}',
      '.wm-weos-pkg__eyebrow{margin:0;font-size:.72rem;letter-spacing:.04em;text-transform:uppercase;color:#8a6321;font-weight:600}',
      '.wm-weos-pkg__title{margin:0;font-size:1.15rem;color:#0a0e17;font-family:var(--font-serif,Georgia,serif);font-weight:600}',
      '.wm-weos-pkg__sub{margin:0;color:#6b7280;font-size:.78rem}',
      '.wm-weos-pkg__layout{display:grid;grid-template-columns:1.15fr .85fr;gap:1rem;align-items:stretch}',
      '@media(max-width:900px){.wm-weos-pkg__layout{grid-template-columns:1fr}}',
      '.wm-weos-pkg__row{display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:.55rem;margin-bottom:.65rem}',
      '@media(max-width:640px){.wm-weos-pkg__row{grid-template-columns:1fr 1fr}}',
      '.wm-weos-pkg label{display:block;font-size:.72rem;color:#3b4252;font-weight:600}',
      '.wm-weos-pkg input[type=number],.wm-weos-pkg select,.wm-weos-pkg input[type=text],.wm-weos-pkg textarea{width:100%;margin-top:.28rem;padding:.55rem .65rem;border-radius:8px;border:1px solid #d1d5db;background:#fff;color:#0b0b0b;font-size:.9rem}',
      '.wm-weos-pkg__chips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem .75rem;margin-bottom:.7rem}',
      '@media(min-width:1100px){.wm-weos-pkg__chips{grid-template-columns:repeat(4,minmax(0,1fr))}}',
      '.wm-weos-pkg__chipset{border:0;margin:0;padding:0}',
      '.wm-weos-pkg__chipset legend{font-size:.72rem;color:#8a6321;margin-bottom:.25rem;font-weight:700}',
      '.wm-weos-pkg__chipset label{display:inline-flex;align-items:center;gap:.3rem;margin:0 .55rem .2rem 0;font-size:.82rem;font-weight:500;color:#0b0b0b;cursor:pointer}',
      '.wm-weos-pkg__chipset input{accent-color:#b8893d}',
      '.wm-weos-pkg__chipset.is-disabled{opacity:.45;pointer-events:none}',
      '.wm-weos-pkg__live{padding:.75rem .85rem;border-radius:10px;background:#fbf8f1;border:1px solid rgba(184,137,61,.28)}',
      '.wm-weos-pkg__price-row{display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem}',
      '.wm-weos-pkg__price-label{font-size:.75rem;color:#8a6321;font-weight:700;text-transform:uppercase;letter-spacing:.03em}',
      '.wm-weos-pkg__meta{font-size:.78rem;color:#475569;line-height:1.35;margin-top:.2rem}',
      '.wm-weos-pkg__price-row strong{font-size:1.45rem;color:#166534;white-space:nowrap;line-height:1}',
      '.wm-weos-pkg__note{margin:.45rem 0 0;font-size:.75rem;color:#6b7280}',
      '.wm-weos-pkg__actions{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.65rem}',
      '.wm-weos-pkg__btn{padding:.5rem .85rem;border:0;border-radius:8px;background:linear-gradient(135deg,#b8893d,#d4b170);color:#111;font-weight:700;cursor:pointer;font-size:.82rem}',
      '.wm-weos-pkg__btn--ghost{background:#fff;border:1px solid #d1d5db;color:#0f172a}',
      '.wm-weos-pkg__preview-wrap{min-height:260px}',
      '.wm-weos-pkg__preview{background:#fff;border:1px solid #e5e7eb;border-radius:10px;min-height:260px;max-height:420px;padding:.5rem;display:flex;align-items:center;justify-content:center;overflow:auto}',
      '.wm-weos-pkg__preview svg{max-width:100%;max-height:400px;width:auto;height:auto;display:block}',
      '.wm-weos-pkg__modal{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem}',
      '.wm-weos-pkg__modal[hidden]{display:none!important}',
      '.wm-weos-pkg__modal-card{position:relative;background:#fff;color:#0b0b0b;border-radius:12px;max-width:520px;width:100%;padding:1.1rem 1.15rem 1.25rem;border:1px solid #e5e7eb;box-shadow:0 18px 40px rgba(15,23,42,.18)}',
      '.wm-weos-pkg__modal-close{position:absolute;top:.35rem;right:.55rem;background:transparent;border:0;color:#334155;font-size:1.4rem;cursor:pointer}',
      '.wm-weos-pkg__modal-card h3{margin:0 1.5rem .35rem 0;font-family:var(--font-serif,Georgia,serif)}',
      '.wm-weos-pkg__modal-card dl{display:grid;grid-template-columns:auto 1fr;gap:.3rem .7rem;margin:.75rem 0;font-size:.9rem}',
      '.wm-weos-pkg__modal-card dt{color:#6b7280}',
      '.wm-weos-pkg__modal-card dd{margin:0}',
      '.wm-weos-pkg__modal-price{font-size:1.4rem;color:#166534;font-weight:700}',
      '.wm-weos-pkg__save-form{display:grid;gap:.55rem;margin-top:.6rem}',
      '.wm-weos-pkg__export-links{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.65rem}',
      '.wm-weos-pkg__export-links a{font-size:.82rem;color:#1e40af;font-weight:600}'
    ].join('');
    document.head.appendChild(css);
  }

  function syncMeshUi(root) {
    var glassN = radioValue('weos-glass-n', root) || '3';
    var meshSet = $('#weos-mesh-set', root);
    var meshNone = root.querySelector('input[name="weos-mesh"][value="0"]');
    if (glassN === '3') {
      if (meshSet) meshSet.classList.add('is-disabled');
      if (meshNone) meshNone.checked = true;
    } else if (meshSet) {
      meshSet.classList.remove('is-disabled');
    }
  }

  function readForm(root) {
    var glassN = Number(radioValue('weos-glass-n', root) || 3);
    if (glassN !== 3 && glassN !== 4) glassN = glassN >= 4 ? 4 : 3;
    var meshVal = radioValue('weos-mesh', root) || '0';
    // 3 glass → mesh forced off + side opening (matches WeOS 3-track rules)
    if (glassN === 3) meshVal = '0';
    var meshOn = glassN === 4 && meshVal === '2';
    var opening = glassN === 4 ? 'center' : 'side';
    return {
      product: PRODUCT_ID,
      width: Number($('#weos-w', root).value) || 1500,
      height: Number($('#weos-h', root).value) || 1200,
      qty: 1,
      glassShutters: glassN,
      mesh: meshOn,
      meshChoice: meshOn ? 'mesh2' : 'no_mesh',
      meshShutters: meshOn ? 2 : 0,
      meshType: meshOn ? 'standard' : undefined,
      // 3-track page: 3g side / 4g+mesh center stay on trackCount=3
      // (4-track only for side+4g with no mesh — not offered in this UI)
      trackCount: 3,
      opening: opening,
      openingExplicit: true,
      system: 'sliding',
      sectionSeries: PRODUCT_ID,
      glass: ($('#weos-glass', root) && $('#weos-glass', root).value) || '10mm_toughened',
      locking: radioValue('weos-lock', root) || 'multipoint',
      colour: radioValue('weos-colour', root) || 'Matte Black',
      quoteId: lastQuoteId || undefined,
      projectId: lastProjectId || undefined,
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        quoteId: lastQuoteId,
        projectId: lastProjectId,
        at: Date.now()
      }));
    } catch (e) {}

    if (meta) {
      meta.textContent = [
        (data.widthMm || '') + '×' + (data.heightMm || '') + ' mm',
        (data.glassShutters || (data.shutters && data.shutters.glass) || '') + ' glass',
        data.openingLabel || data.opening || '',
        data.meshLabel || '',
        data.glassLabel || '',
        data.lockingLabel || '',
        data.finishLabel || ''
      ].filter(Boolean).join(' · ');
    }
    if (price) price.textContent = formatInr(data.packagePrice);
    if (status) status.textContent = (data.gstNote || 'GST extra') + ' · package only';
    if (preview) {
      if (data.preview && data.preview.svg) {
        preview.innerHTML = data.preview.svg;
      } else {
        preview.innerHTML = '<span style="color:#9ca3af;font-size:.85rem">Preview unavailable</span>';
      }
    }
    window.__wmWeosLastPackage = data;
  }

  function openModal(data) {
    var modal = $('#weos-quote-modal');
    var body = $('#weos-modal-body');
    if (!modal || !body || !data) return;
    var links = '';
    if (data.scanUrl || data.pdfUrl) {
      links = '<div class="wm-weos-pkg__export-links">' +
        (data.scanUrl ? '<a href="' + data.scanUrl + '" target="_blank" rel="noopener">Open scanner / share</a>' : '') +
        (data.pdfUrl ? '<a href="' + data.pdfUrl + '" target="_blank" rel="noopener">Export PDF</a>' : '') +
        '</div>';
    }
    body.innerHTML = [
      '<p class="wm-weos-pkg__modal-price">' + formatInr(data.packagePrice) + '</p>',
      '<dl>',
      '<dt>Product</dt><dd>' + (data.productName || '') + '</dd>',
      '<dt>Size</dt><dd>' + data.widthMm + ' × ' + data.heightMm + ' mm</dd>',
      '<dt>Shutters</dt><dd>' + (data.glassShutters || '') + ' glass · ' + (data.openingLabel || '') + '</dd>',
      '<dt>Mesh</dt><dd>' + (data.meshLabel || '') + '</dd>',
      '<dt>Glass</dt><dd>' + (data.glassLabel || '') + '</dd>',
      '<dt>Locking</dt><dd>' + (data.lockingLabel || '') + '</dd>',
      '<dt>Finish</dt><dd>' + (data.finishLabel || '') + '</dd>',
      '<dt>Area</dt><dd>' + (data.areaSqft || '') + ' sq.ft</dd>',
      '<dt>Quote ref</dt><dd>' + (data.quoteId || '') + '</dd>',
      '</dl>',
      links,
      '<p class="wm-weos-pkg__note">' + (data.gstNote || '') + '</p>'
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

  function saveQuote(root) {
    var status = $('#weos-save-status');
    var payload = readForm(root);
    payload.customerName = ($('#weos-cust-name') && $('#weos-cust-name').value) || '';
    payload.customerMobile = ($('#weos-cust-mobile') && $('#weos-cust-mobile').value) || '';
    payload.customerAddress = ($('#weos-cust-address') && $('#weos-cust-address').value) || '';
    if (status) status.textContent = 'Saving…';
    return fetch(WEOS_BASE + '/api/public/package-quote/save', {
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
        lastQuoteId = data.quoteId || lastQuoteId;
        lastProjectId = data.projectId || lastProjectId;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            quoteId: lastQuoteId,
            projectId: lastProjectId,
            scanUrl: data.scanUrl,
            pdfUrl: data.pdfUrl,
            at: Date.now()
          }));
        } catch (e) {}
        window.__wmWeosLastPackage = Object.assign({}, window.__wmWeosLastPackage || {}, data);
        if (status) status.textContent = 'Saved. Export links ready.';
        var saveModal = $('#weos-save-modal');
        if (saveModal) saveModal.hidden = true;
        openModal(Object.assign({}, window.__wmWeosLastPackage, data));
        return data;
      })
      .catch(function (err) {
        if (status) status.textContent = 'Save failed: ' + (err && err.message ? err.message : err);
      });
  }

  function exportQuote() {
    var data = window.__wmWeosLastPackage || {};
    if (data.pdfUrl) {
      window.open(data.pdfUrl, '_blank', 'noopener');
      return;
    }
    if (data.scanUrl) {
      window.open(data.scanUrl, '_blank', 'noopener');
      return;
    }
    var saveModal = $('#weos-save-modal');
    var status = $('#weos-save-status');
    if (status) status.textContent = 'Save the quote with customer details first to export PDF / scanner.';
    if (saveModal) saveModal.hidden = false;
  }

  function bind(root) {
    ['#weos-w', '#weos-h', '#weos-glass'].forEach(function (sel) {
      var el = $(sel, root);
      if (!el) return;
      el.addEventListener('input', function () { schedule(root); });
      el.addEventListener('change', function () { schedule(root); });
    });
    $all('input[type=radio]', root).forEach(function (el) {
      el.addEventListener('change', function () {
        if (el.name === 'weos-glass-n' || el.name === 'weos-mesh') syncMeshUi(root);
        schedule(root);
      });
    });
    syncMeshUi(root);

    var openBtn = $('#weos-open-quote', root);
    if (openBtn) openBtn.addEventListener('click', function () {
      openModal(window.__wmWeosLastPackage);
    });
    var saveBtn = $('#weos-save-quote', root);
    if (saveBtn) saveBtn.addEventListener('click', function () {
      var m = $('#weos-save-modal');
      if (m) m.hidden = false;
    });
    var exportBtn = $('#weos-export-quote', root);
    if (exportBtn) exportBtn.addEventListener('click', exportQuote);

    var closeBtn = $('#weos-modal-close');
    var modal = $('#weos-quote-modal');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', function () { modal.hidden = true; });
      modal.addEventListener('click', function (e) { if (e.target === modal) modal.hidden = true; });
    }
    var saveClose = $('#weos-save-close');
    var saveModal = $('#weos-save-modal');
    if (saveClose && saveModal) {
      saveClose.addEventListener('click', function () { saveModal.hidden = true; });
      saveModal.addEventListener('click', function (e) { if (e.target === saveModal) saveModal.hidden = true; });
    }
    var form = $('#weos-save-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        saveQuote(root);
      });
    }
  }

  function restoreQuoteId() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && parsed.quoteId) lastQuoteId = parsed.quoteId;
      if (parsed && parsed.projectId) lastProjectId = parsed.projectId;
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
    var panel = wrap.children[0];
    var modal = wrap.children[1];
    var saveModal = wrap.children[2];
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(panel, anchor.nextSibling);
    } else {
      host.insertBefore(panel, host.firstChild);
    }
    document.body.appendChild(modal);
    document.body.appendChild(saveModal);

    var legacyPrice = host.querySelector('.calc-price-display');
    if (legacyPrice) {
      legacyPrice.style.opacity = '0.45';
      legacyPrice.title = 'Legacy planning range — use WeOS package price above for live quotation';
    }

    bind(panel);
    fetchQuote(panel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
