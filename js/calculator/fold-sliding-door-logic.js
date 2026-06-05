/**
 * Fold / sliding / telescopic door — panel configuration + pricing logic.
 * Frame ₹1050/sqft + glass (area × rate) + hardware (set or per-door) + coating.
 */
(function (global) {
  'use strict';

  var FRAME_RATE = 1050;
  var PER_DOOR_HARDWARE = 8500;
  var MIN_PANEL_FT = 2.5;
  var MAX_PANEL_FT = 3.25;

  var HARDWARE_SET = {
    '2+1': 25000,
    '3+1': 30000,
    '5+1': 45000,
    '2+2': 35000,
    '3+3': 40000
  };

  /** Telescopic sliding — +1 panel is fixed for everyday opening. */
  var CONFIG_META_TELESCOPIC = {
    '2+1': {
      label: '2+1 — 2 sliding + 1 fixed (~75% clear opening · fixed for regular use)',
      type: 'fixed-plus-slide'
    },
    '3+1': {
      label: '3+1 — 3 sliding + 1 fixed (~75% clear opening · fixed for regular use)',
      type: 'fixed-plus-slide'
    },
    '5+1': {
      label: '5+1 — 5 sliding + 1 fixed (~75% clear opening · fixed for regular use)',
      type: 'fixed-plus-slide'
    },
    '2+2': {
      label: '2+2 — center opening (50% one side · 100% both sides)',
      type: 'center'
    },
    '3+3': {
      label: '3+3 — center opening (50% one side · 100% both sides)',
      type: 'center'
    },
    custom: {
      label: 'Custom multi-panel (center opening · ₹8,500 per door hardware)',
      type: 'custom'
    }
  };

  /** Fold / bi-fold / fold-sliding — all panels open; no fixed panel. */
  var CONFIG_META_FOLD = {
    '2+1': {
      label: '2+1 — 3 folding panels (all open · ~95% clear opening)',
      type: 'asymmetric-fold'
    },
    '3+1': {
      label: '3+1 — 4 folding panels (all open · ~95% clear opening)',
      type: 'asymmetric-fold'
    },
    '5+1': {
      label: '5+1 — 6 folding panels (all open · ~95% clear opening)',
      type: 'asymmetric-fold'
    },
    '2+2': {
      label: '2+2 — center fold (50% one side · 100% both sides · all panels open)',
      type: 'center'
    },
    '3+3': {
      label: '3+3 — center fold (50% one side · 100% both sides · all panels open)',
      type: 'center'
    },
    custom: {
      label: 'Custom multi-panel fold (center opening)',
      type: 'custom'
    }
  };

  var CONFIG_META = CONFIG_META_TELESCOPIC;

  function getConfigMeta(mode) {
    return mode === 'fold' ? CONFIG_META_FOLD : CONFIG_META_TELESCOPIC;
  }

  var DEFAULT_GLASS_RATES = {
    '6mm-clear': 350,
    '8mm-clear': 450,
    '10mm-clear': 550,
    '12mm-clear': 650,
    'laminated-5+5': 780
  };

  var TELESCOPIC_COATING_RATES = {
    'rose-gold': 65,
    'copper-gold': 65
  };

  var FOLD_COATING_RATES = {
    plain: 0,
    texture: 0,
    wooden: 68
  };

  var COATING_RATES = TELESCOPIC_COATING_RATES;

  function getWidthInFeet(calc) {
    var widthInput = document.getElementById('calc-width');
    var unitSelect = document.getElementById('calc-unit');
    if (!widthInput || !calc) return 0;
    var unit = unitSelect ? unitSelect.value : 'ft';
    var width;
    if (unit === 'ft-in') {
      width = calc.parseFeetInches(widthInput.value);
    } else {
      width = parseFloat(widthInput.value) || 0;
      width = calc.convertLengthToFeet(width, unit);
    }
    return width > 0 ? width : 0;
  }

  /** Width bands → allowed standard configs (user picks one). */
  function getAllowedConfigs(widthFt) {
    if (widthFt <= 0) return [];
    if (widthFt < 5) return ['2+1'];
    if (widthFt <= 6) return ['2+1'];
    if (widthFt <= 8.5) return ['3+1'];
    if (widthFt <= 10) return ['2+2', '3+1'];
    if (widthFt <= 12) return ['2+2', '3+1'];
    if (widthFt <= 15) return ['3+3', '5+1'];
    if (widthFt <= 20) return ['5+1', 'custom'];
    return ['custom'];
  }

  function countPanelsForConfig(config) {
    if (config === 'custom') return 0;
    var parts = String(config).split('+');
    if (parts.length !== 2) return 0;
    return (parseInt(parts[0], 10) || 0) + (parseInt(parts[1], 10) || 0);
  }

  /** Divide width into panels between 2.5–3.25 ft; prefer even count for center opening. */
  function calcCustomPanels(widthFt, mode) {
    var best = null;
    var n;
    for (n = Math.ceil(widthFt / MAX_PANEL_FT); n <= Math.floor(widthFt / MIN_PANEL_FT); n++) {
      var panelW = widthFt / n;
      if (panelW >= MIN_PANEL_FT && panelW <= MAX_PANEL_FT) {
        best = { doorCount: n, panelWidthFt: panelW };
        break;
      }
    }
    if (!best) {
      var target = Math.max(2, Math.round(widthFt / 3));
      best = { doorCount: target, panelWidthFt: widthFt / target };
    }
    var half = Math.floor(best.doorCount / 2);
    var centerLabel = mode === 'fold' ? ' center fold' : ' center opening';
    var suffix = mode === 'fold' ? ' · all open)' : ')';
    var label = best.doorCount % 2 === 0
      ? half + '+' + half + centerLabel + ' (' + best.doorCount + ' panels · ~' + best.panelWidthFt.toFixed(2) + ' ft each' + suffix
      : (mode === 'fold'
        ? best.doorCount + ' fold panels · ~' + best.panelWidthFt.toFixed(2) + ' ft each (all open)'
        : best.doorCount + ' panels · ~' + best.panelWidthFt.toFixed(2) + ' ft each (center stack)');
    return {
      doorCount: best.doorCount,
      panelWidthFt: best.panelWidthFt,
      hardwareCost: best.doorCount * PER_DOOR_HARDWARE,
      label: label
    };
  }

  function getHardwareDetail(config, widthFt, mode) {
    var meta = getConfigMeta(mode);
    if (config === 'custom' || widthFt > 15) {
      if (config !== 'custom' && HARDWARE_SET[config] && widthFt <= 20) {
        return {
          config: config,
          hardwareCost: HARDWARE_SET[config],
          doorCount: countPanelsForConfig(config),
          label: meta[config].label
        };
      }
      var custom = calcCustomPanels(widthFt, mode);
      return {
        config: 'custom',
        hardwareCost: custom.hardwareCost,
        doorCount: custom.doorCount,
        panelWidthFt: custom.panelWidthFt,
        label: custom.label
      };
    }
    return {
      config: config,
      hardwareCost: HARDWARE_SET[config] || 0,
      doorCount: countPanelsForConfig(config),
      label: (meta[config] && meta[config].label) || config
    };
  }

  function getWidthBandHint(widthFt, mode) {
    if (widthFt <= 0) return 'Enter width to see recommended door set options.';
    if (mode === 'fold') {
      if (widthFt >= 5 && widthFt <= 6) return 'Width ' + widthFt.toFixed(1) + ' ft → 2+1 fold set (3 panels · all open).';
      if (widthFt <= 8.5) return 'Width ' + widthFt.toFixed(1) + ' ft → 3+1 fold set recommended (all panels open).';
      if (widthFt <= 10) return 'Width ' + widthFt.toFixed(1) + ' ft → choose 2+2 (center fold) or 3+1 (asymmetric fold).';
      if (widthFt <= 12) return 'Width ' + widthFt.toFixed(1) + ' ft → choose 2+2 or 3+1 fold sets.';
      if (widthFt <= 15) return 'Width ' + widthFt.toFixed(1) + ' ft → choose 3+3 (center fold) or 5+1 (asymmetric fold).';
      if (widthFt <= 20) return 'Width ' + widthFt.toFixed(1) + ' ft → 5+1 fold set or custom multi-panel.';
      return 'Width ' + widthFt.toFixed(1) + ' ft → large opening: custom multi-panel fold set suggested.';
    }
    if (widthFt >= 5 && widthFt <= 6) return 'Width ' + widthFt.toFixed(1) + ' ft → use 2+1 (2 slide + 1 fixed for regular opening).';
    if (widthFt <= 8.5) return 'Width ' + widthFt.toFixed(1) + ' ft → 3+1 recommended (3 slide + 1 fixed).';
    if (widthFt <= 10) return 'Width ' + widthFt.toFixed(1) + ' ft → choose 2+2 (center) or 3+1 (fixed+slide).';
    if (widthFt <= 12) return 'Width ' + widthFt.toFixed(1) + ' ft → choose 2+2 or 3+1.';
    if (widthFt <= 15) return 'Width ' + widthFt.toFixed(1) + ' ft → choose 3+3 (center) or 5+1 (fixed+slide).';
    if (widthFt <= 20) return 'Width ' + widthFt.toFixed(1) + ' ft → 5+1 set or custom multi-panel.';
    return 'Width ' + widthFt.toFixed(1) + ' ft → large opening: panels split at 2.5–3.25 ft · ₹8,500 hardware per door.';
  }

  function ensurePanelConfigUI(container) {
    if (!container || document.getElementById('calc-panel-config')) return;
    var numberGroup = document.getElementById('calc-number');
    var anchor = numberGroup ? numberGroup.closest('.calc-group') : null;
    if (!anchor) {
      anchor = container.querySelector('.calc-group');
    }
    var wrap = document.createElement('div');
    wrap.className = 'calc-group';
    wrap.id = 'calc-panel-config-group';
    wrap.innerHTML =
      '<label for="calc-panel-config">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>' +
      ' Door set configuration</label>' +
      '<select id="calc-panel-config" class="calc-select" aria-label="Door set configuration">' +
      '<option value="">Select width first…</option></select>' +
      '<div id="calc-panel-config-hint" class="calc-panel-config-hint" style="color:#64748b;font-size:0.82rem;margin-top:0.5rem;line-height:1.5;"></div>' +
      '<div id="calc-price-breakdown" class="calc-price-breakdown" style="display:none;margin-top:0.75rem;padding:0.75rem;background:rgba(59,130,246,0.06);border-radius:0.5rem;font-size:0.82rem;color:#334155;line-height:1.6;"></div>';
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
    } else {
      container.insertBefore(wrap, container.firstChild);
    }
  }

  function updatePanelConfigDropdown(widthFt, preserveValue, mode) {
    var select = document.getElementById('calc-panel-config');
    var hint = document.getElementById('calc-panel-config-hint');
    if (!select) return;
    var meta = getConfigMeta(mode);
    var allowed = getAllowedConfigs(widthFt);
    var prev = preserveValue !== false ? select.value : '';
    select.innerHTML = '';
    if (!allowed.length) {
      select.innerHTML = '<option value="">Enter width first…</option>';
      if (hint) hint.textContent = getWidthBandHint(widthFt, mode);
      return;
    }
    allowed.forEach(function (key) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = key === 'custom' ? meta.custom.label : meta[key].label;
      select.appendChild(opt);
    });
    if (prev && allowed.indexOf(prev) !== -1) {
      select.value = prev;
    } else {
      select.value = allowed[0];
    }
    if (hint) hint.textContent = getWidthBandHint(widthFt, mode);
  }

  function calculateQuote(opts) {
    var areaSqft = opts.areaSqft || 0;
    var widthFt = opts.widthFt || 0;
    var config = opts.panelConfig || '';
    var glassKey = opts.glassKey || '8mm-clear';
    var colorKey = opts.colorKey || 'matt-black';
    var units = opts.units || 1;
    var frameRate = opts.frameRate != null ? opts.frameRate : FRAME_RATE;
    var glassRates = opts.glassRates || DEFAULT_GLASS_RATES;

    if (areaSqft <= 0 || !config) {
      return null;
    }

    var mode = opts.mode || 'telescopic';
    var coatingRates = opts.coatingRates || (mode === 'fold' ? FOLD_COATING_RATES : TELESCOPIC_COATING_RATES);
    var hw = getHardwareDetail(config, widthFt, mode);
    var glassRate = Number(glassRates[glassKey]) || DEFAULT_GLASS_RATES['8mm-clear'];
    var coatingRate = Number(coatingRates[colorKey]) || 0;

    var frameCost = areaSqft * frameRate;
    var glassCost = areaSqft * glassRate;
    var coatingCost = areaSqft * coatingRate;
    var hardwareCost = hw.hardwareCost;
    var perUnit = frameCost + glassCost + coatingCost + hardwareCost;
    var subtotal = perUnit * units;

    return {
      frameCost: frameCost,
      glassCost: glassCost,
      coatingCost: coatingCost,
      hardwareCost: hardwareCost,
      perUnit: perUnit,
      subtotal: subtotal,
      perUnitMin: perUnit * 0.8,
      perUnitMax: perUnit * 1.2,
      totalMin: subtotal * 0.8,
      totalMax: subtotal * 1.2,
      panelConfig: hw.config,
      panelLabel: hw.label,
      doorCount: hw.doorCount,
      panelWidthFt: hw.panelWidthFt,
      glassKey: glassKey,
      colorKey: colorKey
    };
  }

  function renderBreakdown(el, quote) {
    if (!el || !quote) {
      if (el) el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    el.innerHTML =
      '<strong>Selected configuration</strong><br>' +
      quote.panelLabel +
      (quote.doorCount ? ' (' + quote.doorCount + ' panels · all open)' : '');
  }

  function bindWidthSync(calc, onChange, mode) {
    ['calc-width', 'calc-height', 'calc-unit'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        updatePanelConfigDropdown(getWidthInFeet(calc), true, mode);
        if (onChange) onChange();
      });
      el.addEventListener('change', function () {
        updatePanelConfigDropdown(getWidthInFeet(calc), true, mode);
        if (onChange) onChange();
      });
    });
    var panelSelect = document.getElementById('calc-panel-config');
    if (panelSelect) {
      panelSelect.addEventListener('change', function () {
        if (onChange) onChange();
      });
    }
  }

  global.FoldSlidingDoorLogic = {
    FRAME_RATE: FRAME_RATE,
    HARDWARE_SET: HARDWARE_SET,
    CONFIG_META: CONFIG_META,
    CONFIG_META_FOLD: CONFIG_META_FOLD,
    CONFIG_META_TELESCOPIC: CONFIG_META_TELESCOPIC,
    getConfigMeta: getConfigMeta,
    DEFAULT_GLASS_RATES: DEFAULT_GLASS_RATES,
    COATING_RATES: COATING_RATES,
    FOLD_COATING_RATES: FOLD_COATING_RATES,
    TELESCOPIC_COATING_RATES: TELESCOPIC_COATING_RATES,
    getWidthInFeet: getWidthInFeet,
    getAllowedConfigs: getAllowedConfigs,
    getHardwareDetail: getHardwareDetail,
    getWidthBandHint: getWidthBandHint,
    ensurePanelConfigUI: ensurePanelConfigUI,
    updatePanelConfigDropdown: updatePanelConfigDropdown,
    calculateQuote: calculateQuote,
    renderBreakdown: renderBreakdown,
    bindWidthSync: bindWidthSync
  };
})(typeof window !== 'undefined' ? window : globalThis);
