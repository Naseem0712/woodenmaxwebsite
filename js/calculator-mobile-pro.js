/**
 * calculator-mobile-pro.js
 * Mobile-only UX for .calc-mobile-pro calculators:
 * - Toggle inline Get Exact form on button click
 * - Collapsible pricing info
 * - Wrap glass/coating/lock in options grid (DOM enhancement)
 */
(function () {
  'use strict';

  var MQ = window.matchMedia('(max-width: 768px)');

  function isMobile() {
    return MQ.matches;
  }

  var GLASS_SHORT = {
    '6mm': '6MM Clear',
    '8mm': '8MM Clear',
    '10mm': '10MM Clear',
    '12mm': '12MM Clear',
    'dgu': 'DGU 20MM',
    'dgu-20mm': 'DGU 20MM',
    'safety': 'Safety 13.52MM',
    'safety-13.52mm': 'Safety 13.52MM'
  };

  var COATING_SHORT = {
    texture: 'Standard Plain',
    wooden: 'Wooden Finish'
  };

  var LOCK_SHORT = {
    single: 'Standard',
    multi: 'Multi-Point'
  };

  function restoreSelectLabels(sel) {
    Array.prototype.forEach.call(sel.options, function (opt) {
      if (opt.dataset.fullLabel) opt.textContent = opt.dataset.fullLabel;
    });
  }

  function applyShortSelectLabel(sel, map) {
    Array.prototype.forEach.call(sel.options, function (opt) {
      if (!opt.dataset.fullLabel) opt.dataset.fullLabel = opt.textContent;
      if (map[opt.value]) opt.dataset.shortLabel = map[opt.value];
    });
    restoreSelectLabels(sel);
    var chosen = sel.options[sel.selectedIndex];
    if (chosen && chosen.dataset.shortLabel) {
      chosen.textContent = chosen.dataset.shortLabel;
    }
  }

  function setupCompactSelects() {
    var glass = document.getElementById('calc-glass');
    var coating = document.getElementById('calc-coating');
    var lock = document.getElementById('calc-lock');

    [
      { el: glass, map: GLASS_SHORT },
      { el: coating, map: COATING_SHORT },
      { el: lock, map: LOCK_SHORT }
    ].forEach(function (cfg) {
      if (!cfg.el || cfg.el.dataset.proSelect) return;
      cfg.el.dataset.proSelect = '1';

      applyShortSelectLabel(cfg.el, cfg.map);

      cfg.el.addEventListener('focus', function () {
        restoreSelectLabels(cfg.el);
      });

      cfg.el.addEventListener('blur', function () {
        applyShortSelectLabel(cfg.el, cfg.map);
      });

      cfg.el.addEventListener('change', function () {
        applyShortSelectLabel(cfg.el, cfg.map);
      });
    });
  }

  function wrapOptionsGrid(calc) {
    if (calc.querySelector('.calc-options-grid')) return;

    var ids = ['calc-glass', 'calc-coating', 'calc-mesh', 'calc-lock'];
    var groups = [];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var group = el.closest('.calc-group');
      if (group) groups.push({ id: id, group: group });
    });
    if (groups.length < 2) return;

    var grid = document.createElement('div');
    grid.className = 'calc-options-grid';

    groups.forEach(function (item) {
      grid.appendChild(item.group);
    });

    var priceDisplay = calc.querySelector('.calc-price-display');
    if (priceDisplay) {
      calc.insertBefore(grid, priceDisplay);
    } else {
      calc.appendChild(grid);
    }
  }

  function wireStickyExactOpen() {
    var stickyExact = document.querySelector('[data-form-open="exact"]');
    var form = document.getElementById('calc-user-form');
    var openBtn = document.getElementById('calcOpenUserFormBtn');
    if (!stickyExact || !form || stickyExact.dataset.proWired) return;
    stickyExact.dataset.proWired = '1';

    stickyExact.addEventListener('click', function (e) {
      if (!isMobile()) return;
      e.preventDefault();
      e.stopPropagation();
      if (!form.classList.contains('calc-user-form--open')) {
        form.classList.add('calc-user-form--open');
        if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
      }
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      var first = form.querySelector('input, select');
      if (first) setTimeout(function () { first.focus(); }, 300);
    }, true);
  }

  function injectExactCta(calc) {
    if (document.getElementById('calcMobileExactCta')) return;
    var priceDisplay = calc.querySelector('.calc-price-display');
    var form = document.getElementById('calc-user-form');
    if (!priceDisplay || !form) return;

    var wrap = document.createElement('div');
    wrap.className = 'calc-mobile-exact-cta';
    wrap.id = 'calcMobileExactCta';
    wrap.innerHTML =
      '<button type="button" class="calc-mobile-exact-btn" id="calcOpenUserFormBtn" aria-expanded="false" aria-controls="calc-user-form">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
        '<span>Get Exact Price</span>' +
      '</button>';

    priceDisplay.insertAdjacentElement('afterend', wrap);

    var btn = document.getElementById('calcOpenUserFormBtn');
    btn.addEventListener('click', function () {
      var open = form.classList.toggle('calc-user-form--open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        setTimeout(function () {
          form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          var first = form.querySelector('input, select');
          if (first) first.focus();
        }, 80);
      }
    });
  }

  function setupInfoCollapse(calc) {
    var info = calc.querySelector('.calc-info-box');
    if (!info || info.querySelector('.calc-info-toggle')) return;

    var strong = info.querySelector('strong');
    var title = strong ? strong.textContent.trim() : 'Pricing info';
    var bodyNodes = [];
    info.querySelectorAll('p').forEach(function (p) { bodyNodes.push(p); });

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'calc-info-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML =
      '<span>' + title + '</span>' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';

    var body = document.createElement('div');
    body.className = 'calc-info-body';
    bodyNodes.forEach(function (p) { body.appendChild(p); });
    if (strong) strong.remove();

    info.insertBefore(toggle, info.firstChild);
    info.appendChild(body);

    toggle.addEventListener('click', function () {
      var open = info.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function applyCompactCopy(calc) {
    if (calc.dataset.proCompact) return;
    calc.dataset.proCompact = '1';

    var headerTitle = calc.querySelector('.calc-header h2, .calc-header h3');
    if (headerTitle) headerTitle.textContent = 'Live Calculator';

    var sizesLabel = calc.querySelector('.calc-group:has(#calc-sizes-container) > label');
    if (sizesLabel) {
      var textNode = Array.prototype.slice.call(sizesLabel.childNodes).filter(function (n) {
        return n.nodeType === 3;
      })[0];
      if (textNode) textNode.textContent = ' Sizes';
    }

    var addBtn = document.getElementById('calc-add-size-btn');
    if (addBtn && !addBtn.dataset.compact) {
      addBtn.dataset.compact = '1';
      var addLabel = addBtn.querySelector('span') || addBtn.lastChild;
      if (addLabel && addLabel.nodeType === 3) addLabel.textContent = ' Add size';
      else if (addBtn.childNodes.length > 1) {
        addBtn.childNodes[addBtn.childNodes.length - 1].textContent = ' Add size';
      }
    }

    var meshLabel = document.querySelector('label[for="calc-mesh"]');
    if (meshLabel) {
      meshLabel.dataset.fullLabel = meshLabel.textContent;
      meshLabel.textContent = 'Mesh';
    }
  }

  function initCalc(calc) {
    if (!calc || !calc.classList.contains('calc-mobile-pro')) return;
    if (!isMobile()) return;

    wrapOptionsGrid(calc);
    applyCompactCopy(calc);
    setupCompactSelects();
    injectExactCta(calc);
    setupInfoCollapse(calc);
    wireStickyExactOpen();

    var form = document.getElementById('calc-user-form');
    if (form && !calc.dataset.proInit) {
      form.classList.remove('calc-user-form--open');
      calc.dataset.proInit = '1';
    }
  }

  function boot() {
    var calc = document.querySelector('.calc-mobile-pro');
    if (!calc) return;
    initCalc(calc);
    setTimeout(function () { wireStickyExactOpen(); }, 600);

    if (MQ.addEventListener) {
      MQ.addEventListener('change', function () {
        if (isMobile()) initCalc(calc);
        else {
          var form = document.getElementById('calc-user-form');
          if (form) form.classList.remove('calc-user-form--open');
          ['calc-glass', 'calc-coating', 'calc-lock'].forEach(function (id) {
            var sel = document.getElementById(id);
            if (sel) restoreSelectLabels(sel);
          });
          var meshLabel = document.querySelector('label[for="calc-mesh"]');
          if (meshLabel && meshLabel.dataset.fullLabel) {
            meshLabel.textContent = meshLabel.dataset.fullLabel;
          }
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(boot, 500);
    });
  } else {
    setTimeout(boot, 500);
  }
})();
