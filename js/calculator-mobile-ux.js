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

  // ---------- Constants ----------
  var STORAGE_KEY     = 'woodenmax_quote_cart_v1';
  var LEAD_STORAGE    = 'woodenmax_lead_cache_v1';
  var BODY_FLAG       = 'has-calc-sticky-bar';
  var BAR_VISIBLE     = 'is-visible';
  var SHEET_OPEN      = 'is-open';
  var MODAL_OPEN      = 'is-open';
  var PLACEHOLDER_CLS = 'is-placeholder';

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

  // ---------- Storage ----------
  function readCart () {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function writeCart (items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
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

  // ---------- Calculator state readers ----------
  function getCalcContainer () {
    return $('.price-calculator-container') || $('[id^="price-calculator"]');
  }

  function readPrice () {
    var el = $('#calc-result-total');
    if (!el) return null;
    var txt = (el.textContent || '').trim();
    if (!txt) return null;
    var digits = txt.replace(/[^0-9]/g, '');
    if (!digits || /^0+$/.test(digits)) return null;
    return txt;
  }

  function readArea () {
    var el = $('#calc-area-display');
    if (!el) return '';
    return (el.textContent || '').replace(/^Total Area:\s*/i, '').trim();
  }

  function readSpecs () {
    // Aggregate visible select / checkbox labels inside the calculator.
    var calc = getCalcContainer();
    if (!calc) return [];
    var specs = [];

    // Size summary
    var sizeRows = $$('.calc-size-row', calc);
    if (sizeRows.length) {
      specs.push(sizeRows.length + ' size' + (sizeRows.length === 1 ? '' : 's'));
    }

    // Selects → pick currently-selected option text
    $$('select.calc-select', calc).forEach(function (sel) {
      if (!sel.options || !sel.value) return;
      var opt = sel.options[sel.selectedIndex];
      if (!opt) return;
      var txt = (opt.textContent || '').replace(/\s*\([^)]*\)\s*/g, '').trim();
      if (txt && !/^Select/i.test(txt)) specs.push(txt);
    });

    // Checked checkboxes
    $$('input[type="checkbox"]', calc).forEach(function (cb) {
      if (!cb.checked) return;
      var lbl = calc.querySelector('label[for="' + cb.id + '"]');
      var txt = lbl ? (lbl.textContent || '').replace(/\s*\([^)]*\)\s*/g, '').trim() : '';
      if (txt) specs.push(txt);
    });

    return specs.slice(0, 6); // keep card compact
  }

  function readProductMeta () {
    var calc = getCalcContainer();
    if (!calc) return { key: 'product', name: 'Product' };
    return {
      key:  calc.getAttribute('data-product') || 'product',
      name: calc.getAttribute('data-product-name') ||
            (document.title || 'Product').split('|')[0].trim()
    };
  }

  // ---------- Sticky bar ----------
  function updateStickyBar (bar) {
    if (!bar) return;
    var priceEl  = bar.querySelector('.calc-sticky-price');
    var labelEl  = bar.querySelector('.calc-sticky-label');
    var exactBtn = bar.querySelector('.calc-sticky-exact');
    var cartCnt  = bar.querySelector('.calc-sticky-cart-count');

    var price = readPrice();
    if (price) {
      priceEl.textContent = price;
      priceEl.classList.remove(PLACEHOLDER_CLS);
      if (labelEl) labelEl.textContent = 'Live Total';
      if (exactBtn) exactBtn.hidden = false;
    } else {
      priceEl.textContent = 'Enter sizes to see price';
      priceEl.classList.add(PLACEHOLDER_CLS);
      if (labelEl) labelEl.textContent = 'Live Estimate';
      if (exactBtn) exactBtn.hidden = true;
    }

    var cart = readCart();
    if (cartCnt) {
      cartCnt.textContent = String(cart.length);
      cartCnt.classList.toggle('is-active', cart.length > 0);
    }
  }

  // Toggle the inline "Add to Cart" action row visibility based on price.
  function syncAddToCartRow () {
    var row = $('#calcActionRow');
    if (!row) return;
    row.hidden = readPrice() === null;
  }

  // ---------- Cart ----------
  function addCurrentToCart () {
    var price = readPrice();
    if (!price) return;
    var meta = readProductMeta();
    var item = {
      id: uid(),
      productKey:  meta.key,
      productName: meta.name,
      specs: readSpecs(),
      area:  readArea(),
      amount: price,
      range: parsePriceRange(price),
      ts: Date.now()
    };
    var cart = readCart();
    cart.push(item);
    writeCart(cart);
    return item;
  }

  function removeFromCart (id) {
    var cart = readCart().filter(function (it) { return it.id !== id; });
    writeCart(cart);
    return cart;
  }

  function cartGrandTotal (cart) {
    var min = 0, max = 0;
    cart.forEach(function (it) {
      var r = it.range || parsePriceRange(it.amount);
      min += r.min;
      max += r.max;
    });
    return { min: min, max: max };
  }

  // ---------- Sheet rendering ----------
  function renderSheet () {
    var sheet = $('#calcBottomSheet');
    if (!sheet) return;
    var body  = sheet.querySelector('.calc-sheet-body');
    var count = sheet.querySelector('#calcSheetCount');
    var cart = readCart();

    if (count) count.textContent = '(' + cart.length + ')';

    if (!cart.length) {
      body.innerHTML =
        '<div class="cart-empty">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>' +
          '<strong>Your quote cart is empty</strong>' +
          '<p>Configure a window in the calculator above, then tap "Add to Cart" to start building your quote.</p>' +
        '</div>' +
        '<div class="cart-cta-stack">' +
          '<button type="button" class="cart-cta-secondary" data-cart-action="close">Continue Configuring</button>' +
        '</div>';
      return;
    }

    var html = '';
    cart.forEach(function (it) {
      html += '<div class="cart-item" data-cart-id="' + escapeHtml(it.id) + '">' +
        '<div class="cart-item-title">' + escapeHtml(it.productName) + '</div>' +
        '<div class="cart-item-amount">' + escapeHtml(it.amount) + '</div>' +
        '<div class="cart-item-specs">' +
          (it.area ? '<span>' + escapeHtml(it.area) + '</span>' : '') +
          it.specs.map(function (s) { return '<span>' + escapeHtml(s) + '</span>'; }).join('') +
        '</div>' +
        '<div class="cart-item-actions">' +
          '<button type="button" data-cart-action="remove" data-cart-id="' + escapeHtml(it.id) + '">Remove</button>' +
        '</div>' +
      '</div>';
    });

    var total = cartGrandTotal(cart);
    var mid = Math.round((total.min + total.max) / 2);
    var freeTransport = mid >= 1500000; // ≥ ₹15 Lakh basic
    var gstMid = Math.round(mid * 0.18);
    html += '<div class="cart-total-row">' +
              '<span class="cart-total-label">Subtotal (' + cart.length + ' item' + (cart.length === 1 ? '' : 's') + ')</span>' +
              '<span class="cart-total-value">' + fmtINR(total.min) + ' – ' + fmtINR(total.max) + '</span>' +
            '</div>';

    // GST + Transport policy block — explicit, every cart open
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

    html += '<div class="cart-cta-stack">' +
              '<button type="button" class="cart-cta-secondary" data-cart-action="add-more">Add More Items</button>' +
              '<button type="button" class="cart-cta-primary"   data-cart-action="export-pdf">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>' +
                'Save &amp; Export PDF' +
              '</button>' +
            '</div>';

    html += '<p class="cart-foot-note">Indicative ranges only. Final binding quote after site measurement. ' +
            '<a href="/policies/gst-transport-policy" target="_blank" rel="noopener">Read full GST &amp; transport policy →</a></p>';

    body.innerHTML = html;
  }

  // ---------- Sheet open/close ----------
  function openSheet () {
    var sheet = $('#calcBottomSheet');
    if (!sheet) return;
    renderSheet();
    sheet.classList.add(SHEET_OPEN);
    sheet.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  function closeSheet () {
    var sheet = $('#calcBottomSheet');
    if (!sheet) return;
    sheet.classList.remove(SHEET_OPEN);
    sheet.setAttribute('aria-hidden', 'true');
    if (!$('#calcFormModal.is-open')) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  }

  // ---------- Form modal ----------
  function openForm (intent) {
    var modal = $('#calcFormModal');
    if (!modal) return;
    var title  = $('#calcFormTitle');
    var intro  = $('#calcFormIntro');
    var submit = $('#calcFormSubmit');
    var submitLabel = submit && submit.querySelector('.calc-form-submit-label');

    modal.setAttribute('data-intent', intent);

    if (intent === 'exact') {
      if (title)       title.textContent  = 'Get Exact Price';
      if (intro)       intro.textContent  = 'Share quick details and we will reveal the exact price for your configuration. No spam, we promise.';
      if (submitLabel) submitLabel.textContent = 'Show Exact Price';
    } else {
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
    var price = readPrice();
    if (!price) return null;
    var meta = readProductMeta();
    return {
      id: uid(),
      productKey:  meta.key,
      productName: meta.name,
      specs:       readSpecs(),
      area:        readArea(),
      amount:      price,
      range:       parsePriceRange(price),
      ts:          Date.now(),
      _virtual:    true
    };
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

    if (intent === 'export-pdf') {
      if (cart.length) return cart;
      return live ? [live] : [];
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
  function buildLeadEmailBody (lead, items, intent) {
    var pageUrl = (typeof location !== 'undefined') ? location.href : '';
    var pageTitle = (typeof document !== 'undefined' && document.title) ? document.title : '';

    var subtotalMid = 0;
    var totalRange  = { min: 0, max: 0 };
    items.forEach(function (it) {
      var r = it.range || parsePriceRange(it.amount);
      subtotalMid    += midpoint(it);
      totalRange.min += r.min;
      totalRange.max += r.max;
    });
    var gstMid        = Math.round(subtotalMid * 0.18);
    var grandMid      = subtotalMid + gstMid;
    var freeTransport = subtotalMid >= 1500000;

    if (window.EmailSubmitter &&
        typeof window.EmailSubmitter.buildStructuredPlainText === 'function') {
      var sections = [];

      sections.push({
        title: 'Request type',
        rows: [
          { label: 'Intent',          value: intent === 'export-pdf'
                                              ? 'Quote PDF download'
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
        var r = it.range || parsePriceRange(it.amount);
        var rows = [
          { label: 'Product',  value: it.productName || '—' },
          { label: 'Area',     value: it.area        || '—' }
        ];
        (it.specs || []).forEach(function (s, i) {
          rows.push({ label: 'Spec ' + (i + 1), value: s });
        });
        rows.push({ label: 'Live estimate', value: it.amount });
        rows.push({ label: 'Range (basic)', value: fmtINR(r.min) + ' – ' + fmtINR(r.max) });
        rows.push({ label: 'Midpoint',      value: fmtINR(midpoint(it)) });
        sections.push({
          title: 'Item #' + (idx + 1) + (it._virtual ? '  (live calc snapshot, not yet added to cart)' : ''),
          rows: rows
        });
      });

      sections.push({
        title: 'Totals',
        rows: [
          { label: 'Subtotal (mid, basic)',      value: fmtINR(subtotalMid) },
          { label: 'Estimate range (basic)',     value: fmtINR(totalRange.min) + ' – ' + fmtINR(totalRange.max) },
          { label: 'GST @ 18% (always extra)',   value: '+ ' + fmtINR(gstMid) },
          { label: 'Transportation',             value: freeTransport
                                                          ? 'FREE  (≥ ₹15 L within 1,000 km of Hyderabad)'
                                                          : 'Extra at actuals  (order < ₹15 L or > 1,000 km)' },
          { label: 'Grand total (mid, incl GST)', value: fmtINR(grandMid) }
        ]
      });

      sections.push({
        title: 'Notes',
        rows: [
          { label: 'Validity', value: '30 days from this email' },
          { label: 'Disclaimer', value: 'Indicative ₹/sq.ft from live WoodenMax calculator. Final BOQ after free physical site verification.' }
        ]
      });

      var title = intent === 'export-pdf'
        ? 'WoodenMax — Quote PDF Request'
        : 'WoodenMax — Get-Exact-Price Enquiry';

      return window.EmailSubmitter.buildStructuredPlainText(title, sections);
    }

    // Fallback if EmailSubmitter helper is unavailable
    var L = [];
    L.push('WoodenMax — ' + (intent === 'export-pdf' ? 'Quote PDF Request' : 'Get-Exact-Price Enquiry'));
    L.push('================================================');
    L.push('Lead: ' + (lead.name || '—') + ' · ' + (lead.mobile || '—') + ' · ' + (lead.city || '—'));
    if (lead.email) L.push('Email: ' + lead.email);
    if (lead.role)  L.push('Role:  ' + lead.role);
    L.push('Source: ' + (pageTitle || pageUrl || '—'));
    L.push('URL:    ' + (pageUrl || '—'));
    L.push('');
    items.forEach(function (it, idx) {
      var r = it.range || parsePriceRange(it.amount);
      L.push('--- Item #' + (idx + 1) + ' --------------------------------');
      L.push('  Product : ' + (it.productName || '—'));
      L.push('  Area    : ' + (it.area || '—'));
      (it.specs || []).forEach(function (s, i) { L.push('  Spec ' + (i + 1) + '  : ' + s); });
      L.push('  Amount  : ' + it.amount);
      L.push('  Range   : ' + fmtINR(r.min) + ' – ' + fmtINR(r.max));
      L.push('  Mid     : ' + fmtINR(midpoint(it)));
      L.push('');
    });
    L.push('Subtotal (mid)         : ' + fmtINR(subtotalMid));
    L.push('Estimate range (basic) : ' + fmtINR(totalRange.min) + ' – ' + fmtINR(totalRange.max));
    L.push('GST @ 18% (extra)      : + ' + fmtINR(gstMid));
    L.push('Transportation         : ' + (freeTransport ? 'FREE' : 'Extra at actuals'));
    L.push('Grand total (mid+GST)  : ' + fmtINR(grandMid));
    return L.join('\n');
  }

  /**
   * Submit the lead + cart snapshot via EmailSubmitter.  Returns a
   * Promise that resolves whether or not the email succeeded — we
   * never want to block the PDF print on a transport failure.
   */
  function sendLeadEmail (lead, items, intent) {
    return new Promise(function (resolve) {
      if (!window.EmailSubmitter || typeof window.EmailSubmitter.submit !== 'function') {
        resolve({ ok: false, reason: 'EmailSubmitter unavailable' });
        return;
      }
      if (!items || !items.length) {
        resolve({ ok: false, reason: 'No items to quote' });
        return;
      }

      var subject = intent === 'export-pdf'
        ? 'New Quote PDF Request · ' + (lead.name || 'Lead') + ' · ' + (lead.city || '—')
        : 'Get-Exact-Price Enquiry · ' + (lead.name || 'Lead') + ' · ' + (lead.city || '—');

      var body = buildLeadEmailBody(lead, items, intent);

      // GA4 funnel event
      try {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'wm_lead_submit', {
            wm_intent: intent,
            wm_items: items.length,
            wm_has_email: lead.email ? 1 : 0
          });
        }
      } catch (e) {}

      window.EmailSubmitter.submit({
        subject: subject,
        message: body,
        userDetails: {
          name:   lead.name || '',
          email:  lead.email || '',
          city:   lead.city || '',
          mobile: lead.mobile || ''
        },
        ccEmail: lead.email || '',
        onSuccess: function () { resolve({ ok: true }); },
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

    // Compute "exact" as the upper bound of the range, presented as a single number
    var range = parsePriceRange(price);
    var exact = Math.round((range.min * 0.6) + (range.max * 0.4));

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
      '<p style="margin: 0; font-size: 0.85rem; color: #475569;">A WoodenMax specialist will reach you on <strong>' + escapeHtml(lead.mobile) + '</strong> within 2 working hours to confirm site measurements. GST extra.</p>';

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

  function midpoint (it) {
    var r = parsePriceRange(it.amount);
    return Math.round((r.min + r.max) / 2);
  }

  function buildPrintStage (lead) {
    var stage = $('#calcPrintStage');
    if (!stage) return;
    var cart = readCart();
    if (!cart.length) return;

    // ----- Document meta -----
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yy = today.getFullYear();
    var dateStr   = dd + ' ' + today.toLocaleString('en-IN', { month: 'short' }) + ' ' + yy;
    var validTill = new Date(today.getTime() + 30 * 86400000)
                      .toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
    var ymd = '' + yy + mm + dd;
    var quoteNum = 'WMX/' + ymd + '/' + Math.floor(1000 + Math.random() * 9000);

    // ----- Compute totals using midpoint (clean GST math) -----
    var subtotalMid = 0, totalRange = { min: 0, max: 0 };
    cart.forEach(function (it) {
      var r = parsePriceRange(it.amount);
      subtotalMid    += midpoint(it);
      totalRange.min += r.min;
      totalRange.max += r.max;
    });
    var gstMid   = Math.round(subtotalMid * 0.18);
    var grandMid = subtotalMid + gstMid;

    // ----- Build itemised rows -----
    var rowsHtml = cart.map(function (it, i) {
      var r = parsePriceRange(it.amount);
      var mid = midpoint(it);
      return '<tr>' +
        '<td class="is-center">' + (i + 1) + '</td>' +
        '<td>' +
          '<div class="pdf-row-title">' + escapeHtml(it.productName) + '</div>' +
          (it.specs.length || it.area
            ? '<div class="pdf-specs">' +
                (it.area ? '<strong>Size:</strong> ' + escapeHtml(it.area) + (it.specs.length ? ' &nbsp;|&nbsp; ' : '') : '') +
                it.specs.map(escapeHtml).join(' &nbsp;·&nbsp; ') +
              '</div>'
            : '') +
        '</td>' +
        '<td class="is-center">1 set</td>' +
        '<td class="is-numeric">' + fmtINR(r.min) + ' – ' + fmtINR(r.max) + '</td>' +
        '<td class="is-numeric"><strong>' + fmtINR(mid) + '</strong></td>' +
      '</tr>';
    }).join('');

    // ----- Render -----
    stage.innerHTML =
      '<div class="pdf-doc">' +

        // === Header ===
        '<div class="pdf-header">' +
          '<div class="pdf-brand-block">' +
            '<div class="pdf-brand-mark">W</div>' +
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
            '<div class="pdf-party-row"><span class="k">Site visit:</span> <span class="v">Free · within 48 hrs</span></div>' +
            '<div class="pdf-party-row"><span class="k">Lead time:</span> <span class="v">3–4 weeks from approval</span></div>' +
          '</div>' +
        '</div>' +

        // === Itemised quote table ===
        '<h3 class="pdf-section-title">Itemised Estimate</h3>' +
        '<table class="pdf-table">' +
          '<thead><tr>' +
            '<th class="is-center" style="width:5%">#</th>' +
            '<th style="width:48%">Item &amp; Specifications</th>' +
            '<th class="is-center" style="width:9%">Qty</th>' +
            '<th class="is-numeric" style="width:20%">Estimate Range</th>' +
            '<th class="is-numeric" style="width:18%">Amount (Mid)</th>' +
          '</tr></thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +

        // === Totals ===
        '<div class="pdf-totals">' +
          '<table class="pdf-totals-table">' +
            '<tr><td class="label">Subtotal (mid estimate)</td><td class="value">' + fmtINR(subtotalMid) + '</td></tr>' +
            '<tr><td class="label">GST @ 18% <span style="color:#B45309;font-weight:600">(always extra)</span></td><td class="value">' + fmtINR(gstMid) + '</td></tr>' +
            '<tr><td class="label">Transportation</td><td class="value">' +
              (grandMid >= 1500000
                ? '<span style="color:#047857;font-weight:700">FREE *</span>'
                : '<span style="color:#B45309">At actuals</span>')
            + '</td></tr>' +
            '<tr><td class="label" style="font-size:7.5pt">Estimate Range (incl. GST)</td><td class="value" style="font-weight:600;color:#475569">' + fmtINR(Math.round(totalRange.min * 1.18)) + ' – ' + fmtINR(Math.round(totalRange.max * 1.18)) + '</td></tr>' +
            '<tr class="grand"><td class="label">Grand Total</td><td class="value">' + fmtINR(grandMid) + '</td></tr>' +
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

        // === Terms + Bank ===
        '<div class="pdf-grid-2">' +
          '<div class="pdf-card">' +
            '<h3>Terms &amp; Conditions</h3>' +
            '<ol class="pdf-terms-list">' +
              '<li>This is a <strong>budgetary estimate</strong> generated from on-site indicative inputs. Final quotation is issued only after a free physical site measurement by our technical team.</li>' +
              '<li>Prices are valid for <strong>30 days</strong> from the date above and are subject to revision based on actual aluminium &amp; glass market rates at order time.</li>' +
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
            '<div class="pdf-bank-row"><span class="k">Account No.</span><span class="v">5010 0123 4567 89</span></div>' +
            '<div class="pdf-bank-row"><span class="k">IFSC</span><span class="v">HDFC0001234</span></div>' +
            '<div class="pdf-bank-row"><span class="k">Branch</span><span class="v">Nampally, Hyderabad</span></div>' +
            '<div class="pdf-bank-row"><span class="k">UPI</span><span class="v">pay@woodenmax</span></div>' +
            '<div class="pdf-bank-row"><span class="k">GSTIN</span><span class="v">36ARWPA9740L1Z3</span></div>' +
            '<div class="pdf-bank-row"><span class="k">PAN</span><span class="v">ARWPA9740L</span></div>' +
            '<h3 style="margin-top:8pt">Contact Sales</h3>' +
            '<div class="pdf-bank-row"><span class="k">Phone</span><span class="v">+91 78953 28080</span></div>' +
            '<div class="pdf-bank-row"><span class="k">Email</span><span class="v">info@woodenmax.com</span></div>' +
            '<div class="pdf-bank-row"><span class="k">Web</span><span class="v">woodenmax.in</span></div>' +
          '</div>' +
        '</div>' +

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
        '</div>' +

        // === Foot ===
        '<div class="pdf-foot">' +
          '<div class="left"><strong>WoodenMax Architectural Elements</strong><br>5-6-411/413, Aaghapura,<br>Nampally, Hyderabad 500001</div>' +
          '<div class="center">Thank you for choosing WoodenMax · Quote ' + quoteNum + '</div>' +
          '<div class="right">+91 78953 28080<br>info@woodenmax.com<br>www.woodenmax.in</div>' +
        '</div>' +

      '</div>';
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

    // Capture exactly what the lead is asking for — for "Export PDF"
    // we use the full cart; for "Get Exact" we lead with the live
    // calc state on this page and append other cart entries as context.
    var items = snapshotItems(intent);

    // Fire the email in the background.  We deliberately don't make
    // the user wait — the PDF / exact-price reveal proceeds as soon as
    // the email round-trips OR after the 4-second safety timeout,
    // whichever comes first.
    var emailPromise = sendLeadEmail(lead, items, intent);

    emailPromise.then(function (result) {
      if (submit) submit.classList.remove('is-loading');
      closeForm();

      if (intent === 'export-pdf') {
        closeSheet();
        buildPrintStage(lead);
        setTimeout(function () { window.print(); }, 250);
      } else {
        // intent === 'exact'
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
  function flashAddedFeedback (btn) {
    if (!btn) return;
    var label = btn.querySelector('span');
    var orig = label ? label.textContent : '';
    btn.classList.add('is-success');
    if (label) label.textContent = '✓ Added to cart';
    setTimeout(function () {
      btn.classList.remove('is-success');
      if (label) label.textContent = orig;
    }, 1500);
  }

  // ---------- Auto-injected scaffolding ----------
  // On real product pages the sticky bar / cart sheet / form modal /
  // print stage are not authored in the HTML. We inject them once if
  // they're missing so every calculator page gets the new UX without
  // requiring per-page HTML edits.
  function buildScaffolding () {
    if (!getCalcContainer()) return; // no calculator on this page
    if (document.getElementById('calcStickyBar')) return; // already present

    var fragment = document.createDocumentFragment();
    var holder = document.createElement('div');
    holder.setAttribute('data-calc-mobile-ux-scaffold', '1');
    holder.innerHTML =
      // Sticky bottom price bar
      '<div class="calc-sticky-bar" id="calcStickyBar">' +
        '<div class="calc-sticky-bar-content">' +
          '<div class="calc-sticky-info">' +
            '<span class="calc-sticky-label">Live Estimate</span>' +
            '<span class="calc-sticky-price is-placeholder">Enter sizes to see price</span>' +
          '</div>' +
          '<button type="button" class="calc-sticky-exact" data-form-open="exact" hidden>' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>' +
            '<span>Get Exact</span>' +
          '</button>' +
          '<button type="button" class="calc-sticky-cart" data-sheet-toggle aria-label="Open quote cart">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>' +
            '<span class="calc-sticky-cart-count" id="calcCartCount">0</span>' +
          '</button>' +
        '</div>' +
      '</div>' +

      // Bottom sheet (Quote Cart)
      '<div class="calc-bottom-sheet" id="calcBottomSheet" aria-hidden="true" role="dialog" aria-label="Your quote cart">' +
        '<div class="calc-sheet-backdrop"></div>' +
        '<div class="calc-sheet-panel">' +
          '<div class="calc-sheet-grabber" aria-hidden="true"></div>' +
          '<div class="calc-sheet-header">' +
            '<h3>Your Quote Cart <span class="calc-sheet-count" id="calcSheetCount">(0)</span></h3>' +
            '<button type="button" class="calc-sheet-close" aria-label="Close cart">&times;</button>' +
          '</div>' +
          '<div class="calc-sheet-body" id="calcSheetBody"></div>' +
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

      // Hidden print stage (filled just before window.print())
      '<div id="calcPrintStage" class="calc-print-stage" aria-hidden="true"></div>';

    while (holder.firstChild) fragment.appendChild(holder.firstChild);
    document.body.appendChild(fragment);
  }

  // ---------- Init ----------
  function init () {
    try { buildScaffolding(); } catch (e) {}

    var bar   = $('#calcStickyBar') || $('.calc-sticky-bar');
    var sheet = $('#calcBottomSheet');
    var modal = $('#calcFormModal');
    var calc  = getCalcContainer();

    if (!bar || !calc) return;
    document.body.classList.add(BODY_FLAG);

    updateStickyBar(bar);
    syncAddToCartRow();
    setTimeout(function () { bar.classList.add(BAR_VISIBLE); }, 350);

    // Live updates as the user interacts
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
    var totalEl = $('#calc-result-total');
    if (totalEl && typeof MutationObserver !== 'undefined') {
      new MutationObserver(scheduleUpdate).observe(totalEl, {
        childList: true, characterData: true, subtree: true
      });
    }

    // Inline "Add to Cart" button (inside calculator)
    var addBtn = $('[data-action="add-to-cart"]');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var item = addCurrentToCart();
        if (item) {
          flashAddedFeedback(addBtn);
          updateStickyBar(bar);
          if (sheet && sheet.classList.contains(SHEET_OPEN)) renderSheet();
        }
      });
    }

    // Sticky bar — Get Exact button
    var exactBtn = bar.querySelector('[data-form-open="exact"]');
    if (exactBtn) exactBtn.addEventListener('click', function () { openForm('exact'); });

    // Sticky bar — Cart toggle
    var cartBtn = bar.querySelector('[data-sheet-toggle]');
    if (cartBtn) cartBtn.addEventListener('click', function () {
      if (sheet && sheet.classList.contains(SHEET_OPEN)) closeSheet(); else openSheet();
    });

    // Sheet: backdrop / close
    if (sheet) {
      var bd = sheet.querySelector('.calc-sheet-backdrop');
      if (bd) bd.addEventListener('click', closeSheet);
      var cl = sheet.querySelector('.calc-sheet-close');
      if (cl) cl.addEventListener('click', closeSheet);

      // Delegated cart actions
      sheet.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('[data-cart-action]');
        if (!t) return;
        var action = t.getAttribute('data-cart-action');
        if (action === 'remove') {
          removeFromCart(t.getAttribute('data-cart-id'));
          updateStickyBar(bar);
          renderSheet();
        } else if (action === 'add-more' || action === 'close') {
          closeSheet();
          var c = getCalcContainer();
          if (c) setTimeout(function () { c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 350);
        } else if (action === 'export-pdf') {
          openForm('export-pdf');
        }
      });

      // Swipe-down to close (touch)
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

    // Form modal: backdrop / close
    if (modal) {
      var fbd = modal.querySelector('.calc-form-backdrop');
      if (fbd) fbd.addEventListener('click', closeForm);
      var fcl = modal.querySelector('.calc-form-close');
      if (fcl) fcl.addEventListener('click', closeForm);

      var form = $('#calcLeadForm');
      if (form) form.addEventListener('submit', handleFormSubmit);
    }

    // Escape key — close in order: form → sheet
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (modal && modal.classList.contains(MODAL_OPEN)) { closeForm(); return; }
      if (sheet && sheet.classList.contains(SHEET_OPEN)) { closeSheet(); }
    });
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
      'a[href*="contact.html?"]',
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
  function injectEeatBlock () {
    if (document.querySelector('.eeat-block')) return;
    var calc = getCalcContainer();
    if (!calc) return;
    var section = calc.closest('section') || calc.parentElement;
    if (!section || !section.parentElement) return;

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
          '<span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg> <strong>Free</strong> site visit \u2014 within <strong>48 hrs</strong></span>' +
          '<span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 11 3 3 11 3"/><line x1="3" y1="3" x2="11" y2="11"/><polyline points="21 13 21 21 13 21"/><line x1="21" y1="21" x2="13" y2="13"/></svg> <strong>GST 18%</strong> extra, transparently shown</span>' +
          '<span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> <strong>Free transport</strong> on \u20b915L+ orders <em>(\u2264 1,000 km from HYD)</em></span>' +
          '<span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> <strong>4.8/5</strong> from 500+ clients</span>' +
        '</div>' +
      '</div>';

    section.parentElement.insertBefore(wrap, section);
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
  function siteCleanupInit () {
    try { cleanupBodyCtas(); } catch (e) {}
    try { removeFinalCtaSection(); } catch (e) {}
    try { injectEeatBlock(); } catch (e) {}
    try { enforceStrictFabHide(); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); siteCleanupInit(); });
  } else {
    init();
    siteCleanupInit();
  }
})();
