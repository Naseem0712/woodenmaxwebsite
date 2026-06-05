/**
 * Fold & Sliding Window System — panel-set pricing (frame + glass + hardware + coating).
 */
(function () {
  'use strict';

  var L = function () { return window.FoldSlidingDoorLogic; };

  class PriceCalculatorFoldSlidingWindowSystem extends PriceCalculatorBase {
    constructor(productId, productConfig, containerId) {
      super(productId, productConfig, containerId);

      this.FRAME_RATE = productConfig.rates.frameRate || L().FRAME_RATE;
      this.GLASS_RATES = Object.assign({}, L().DEFAULT_GLASS_RATES, productConfig.rates.glass || {});
      this.COATING_RATES = Object.assign({}, L().FOLD_COATING_RATES, productConfig.rates.coating || {});
      this.CALC_MODE = 'fold';

      setTimeout(function () {
        this.setupFoldSlidingCalc();
      }.bind(this), 150);
    }

    setupFoldSlidingCalc() {
      var container = document.getElementById(this.containerId);
      L().ensurePanelConfigUI(container);
      L().updatePanelConfigDropdown(L().getWidthInFeet(this), true, this.CALC_MODE);
      L().bindWidthSync(this, function () { this.calculate(); }.bind(this), this.CALC_MODE);
      this.setupExtensionEventListeners();
      this.setupFormSubmission();
      this.calculate();
    }

    setupExtensionEventListeners() {
      var numberInput = document.getElementById('calc-number');
      if (numberInput) numberInput.addEventListener('input', function () { this.calculate(); }.bind(this));

      var glassSelect = document.getElementById('calc-glass');
      if (glassSelect) glassSelect.addEventListener('change', function () { this.calculate(); }.bind(this));

      var colorSelect = document.getElementById('calc-color');
      if (colorSelect) colorSelect.addEventListener('change', function () { this.calculate(); }.bind(this));
    }

    getGlassOption() {
      var el = document.getElementById('calc-glass');
      return el ? el.value : '8mm-clear';
    }

    getColorOption() {
      var el = document.getElementById('calc-color');
      return el ? el.value : 'plain';
    }

    getPanelConfig() {
      var el = document.getElementById('calc-panel-config');
      return el ? el.value : '';
    }

    calculate() {
      var areaSqft = this.getArea();
      var widthFt = L().getWidthInFeet(this);
      var units = parseInt(document.getElementById('calc-number')?.value || '1', 10);
      var panelConfig = this.getPanelConfig();

      if (areaSqft <= 0 || !panelConfig) {
        this.displayResults(0, 0, 0, 0, 0, 0, 0);
        L().renderBreakdown(document.getElementById('calc-price-breakdown'), null);
        return;
      }

      var quote = L().calculateQuote({
        areaSqft: areaSqft,
        widthFt: widthFt,
        panelConfig: panelConfig,
        glassKey: this.getGlassOption(),
        colorKey: this.getColorOption(),
        units: units,
        frameRate: this.FRAME_RATE,
        glassRates: this.GLASS_RATES,
        mode: this.CALC_MODE,
        coatingRates: this.COATING_RATES
      });

      if (!quote) {
        this.displayResults(0, 0, 0, 0, 0, 0, 0);
        return;
      }

      this.lastCalculatedAmounts = {
        perWindowCost: quote.perUnit,
        subtotal: quote.subtotal,
        hardwareCost: quote.hardwareCost,
        frameCost: quote.frameCost,
        glassCost: quote.glassCost,
        coatingCost: quote.coatingCost,
        panelConfig: quote.panelConfig,
        panelLabel: quote.panelLabel,
        doorCount: quote.doorCount
      };

      L().renderBreakdown(document.getElementById('calc-price-breakdown'), quote);

      this.displayResults(
        quote.perUnitMin,
        quote.perUnitMax,
        quote.totalMin,
        quote.totalMax,
        quote.perUnit,
        quote.subtotal,
        units
      );
    }

    displayResults(perUnitMin, perUnitMax, totalMin, totalMax, perUnit, total, count) {
      var formatCurrency = function (num) {
        return typeof window.formatPriceFromINR === 'function'
          ? window.formatPriceFromINR(num)
          : '\u20B9' + Math.round(num).toLocaleString('en-IN');
      };
      var formatRange = function (lo, hi) {
        return typeof window.formatPriceRangeFromINR === 'function'
          ? window.formatPriceRangeFromINR(lo, hi)
          : formatCurrency(lo) + ' - ' + formatCurrency(hi);
      };

      var perUnitResult = document.getElementById('calc-result-per-window');
      if (perUnitResult) perUnitResult.textContent = formatRange(perUnitMin, perUnitMax);

      var totalResult = document.getElementById('calc-result-total');
      if (totalResult) totalResult.textContent = formatRange(totalMin, totalMax);

      var perUnitLabel = document.getElementById('calc-label-per-window');
      if (perUnitLabel) perUnitLabel.textContent = 'Per Opening (Range):';

      var totalLabel = document.getElementById('calc-label-total');
      if (totalLabel) {
        totalLabel.textContent = count > 1 ? 'Total — ' + count + ' Openings (Range):' : 'Total Cost (Range):';
      }
    }

    getCalculatorSelections() {
      return {
        width: document.getElementById('calc-width')?.value || '',
        height: document.getElementById('calc-height')?.value || '',
        unit: document.getElementById('calc-unit')?.value || 'ft',
        numberOfUnits: document.getElementById('calc-number')?.value || '1',
        panelConfig: this.getPanelConfig(),
        panelLabel: this.lastCalculatedAmounts?.panelLabel || '',
        glass: this.getGlassOption(),
        color: this.getColorOption(),
        area: this.getArea(),
        widthFt: L().getWidthInFeet(this)
      };
    }

    sendEmail(userDetails) {
      var s = this.getCalculatorSelections();
      var a = this.lastCalculatedAmounts || {};
      var fmt = function (n) {
        return typeof window.formatPriceFromINR === 'function'
          ? window.formatPriceFromINR(Math.round(n))
          : '\u20B9' + Math.round(n).toLocaleString('en-IN');
      };

      var emailBody = [
        'New Quote — Fold & Sliding Window System',
        '',
        'Size: ' + s.width + ' × ' + s.height + ' ' + s.unit + ' (' + s.widthFt.toFixed(2) + ' ft wide)',
        'Area: ' + s.area.toFixed(2) + ' sq.ft',
        'Door set: ' + (s.panelLabel || s.panelConfig),
        'Units: ' + s.numberOfUnits,
        'Glass: ' + s.glass,
        'Coating: ' + s.color,
        '',
        'Estimated per opening: ' + fmt(a.perWindowCost || 0),
        'Estimated total: ' + fmt(a.subtotal || 0),
        '',
        'Contact: ' + userDetails.name + ' · ' + userDetails.city + ' · ' + userDetails.mobile
      ].filter(Boolean).join('\n');

      this.submitEmailForm(emailBody, userDetails, s, {
        perWindow: a.perWindowCost,
        total: a.subtotal
      });
    }
  }

  if (typeof window !== 'undefined') {
    window.PriceCalculatorFoldSlidingWindowSystem = PriceCalculatorFoldSlidingWindowSystem;
  }
  if (typeof createExtensionInitCalculator === 'function') {
    createExtensionInitCalculator('fold-sliding-window-system', PriceCalculatorFoldSlidingWindowSystem, 'FoldSlidingWindowSystem');
  }
})();
