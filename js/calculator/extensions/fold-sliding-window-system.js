/**
 * Fold & Sliding Window System Calculator Extension
 * Extends base calculator with glass and color options
 */

(function() {
  'use strict';
  
  class PriceCalculatorFoldSlidingWindowSystem extends PriceCalculatorBase {
    constructor(productId, productConfig, containerId) {
      super(productId, productConfig, containerId);
      
      // Base rate per sqft (includes 8mm clear tuff glass + mortice lock + imported hardware)
      this.BASE_RATE_PER_SQFT = productConfig.rates.baseRate || 2250;
      
      // Glass rates (from JSON)
      this.GLASS_RATES = productConfig.rates.glass || {
        '8mm-clear': 0,
        '10mm-clear': 35,
        '8mm-clear-fluted': 85,
        '8mm-grey-fluted': 115,
        '8mm-brown-fluted': 115
      };
      
      // Premium color rates (from JSON)
      this.PREMIUM_COLOR_RATES = productConfig.rates.premiumColors || {
        'rose-gold': 65,
        'copper-gold': 65
      };
      
      setTimeout(() => {
        this.setupExtensionEventListeners();
        this.setupFormSubmission();
      }, 150);
    }
    
    setupExtensionEventListeners() {
      // Number of units listener
      const numberInput = document.getElementById('calc-number');
      if (numberInput) {
        numberInput.addEventListener('input', () => this.calculate());
      }
      
      // Glass option listener
      const glassSelect = document.getElementById('calc-glass');
      if (glassSelect) {
        glassSelect.addEventListener('change', () => this.calculate());
      }
      
      // Color option listener
      const colorSelect = document.getElementById('calc-color');
      if (colorSelect) {
        colorSelect.addEventListener('change', () => this.calculate());
      }
    }
    
    getGlassOption() {
      const glassSelect = document.getElementById('calc-glass');
      return glassSelect ? glassSelect.value : '8mm-clear';
    }
    
    getColorOption() {
      const colorSelect = document.getElementById('calc-color');
      return colorSelect ? colorSelect.value : 'matt-black';
    }
    
    calculate() {
      // Get area in sqft
      const areaSqft = this.getArea();
      const numberOfUnits = parseInt(document.getElementById('calc-number')?.value || '1', 10);
      
      if (areaSqft <= 0) {
        this.displayResults(0, 0, 0, 0, 0, 0, 0);
        return;
      }
      
      // Base cost per sqft (includes 8mm clear tuff glass + mortice lock + imported hardware)
      let baseCostPerSqft = this.BASE_RATE_PER_SQFT;
      
      // Glass add-ons (per sqft)
      let addOnsPerSqft = 0;
      const glassOption = this.getGlassOption();
      
      if (this.GLASS_RATES[glassOption] !== undefined) {
        addOnsPerSqft += Number(this.GLASS_RATES[glassOption]) || 0;
      }
      
      // Premium color hidden charge (Rose Gold / Copper Gold)
      const colorOption = this.getColorOption();
      if (this.PREMIUM_COLOR_RATES[colorOption]) {
        addOnsPerSqft += Number(this.PREMIUM_COLOR_RATES[colorOption]) || 0;
      }
      
      // Calculate per sqft cost
      const costPerSqft = baseCostPerSqft + addOnsPerSqft;
      
      // Cost per unit = area × rate per sqft
      const costPerUnit = areaSqft * costPerSqft;
      
      // Total cost for all units
      const totalCost = costPerUnit * numberOfUnits;
      
      // Calculate ±20% range
      const costPerUnitMinus20 = costPerUnit * 0.8;
      const costPerUnitPlus20 = costPerUnit * 1.2;
      const totalCostMinus20 = totalCost * 0.8;
      const totalCostPlus20 = totalCost * 1.2;
      
      // Display results
      this.displayResults(
        costPerUnitMinus20,
        costPerUnitPlus20,
        totalCostMinus20,
        totalCostPlus20,
        costPerUnit,
        totalCost,
        numberOfUnits
      );
    }
    
    displayResults(perUnitMin, perUnitMax, totalMin, totalMax, perUnit, total, count) {
      const formatCurrency = (num) => '₹' + Math.round(num).toLocaleString('en-IN');
      
      // Per unit range
      const perUnitResult = document.getElementById('calc-result-per-window');
      if (perUnitResult) {
        perUnitResult.textContent = `${formatCurrency(perUnitMin)} - ${formatCurrency(perUnitMax)}`;
      }
      
      // Total range
      const totalResult = document.getElementById('calc-result-total');
      if (totalResult) {
        totalResult.textContent = `${formatCurrency(totalMin)} - ${formatCurrency(totalMax)}`;
      }
      
      // Update labels
      const perUnitLabel = document.getElementById('calc-label-per-window');
      if (perUnitLabel) {
        perUnitLabel.textContent = 'Per Unit Cost (Range):';
      }
      
      const totalLabel = document.getElementById('calc-label-total');
      if (totalLabel) {
        totalLabel.textContent = count > 1 ? `Total Cost - ${count} Units (Range):` : 'Total Cost (Range):';
      }
    }
    
    getCalculatorSelections() {
      const widthInput = document.getElementById('calc-width');
      const heightInput = document.getElementById('calc-height');
      const unitSelect = document.getElementById('calc-unit');
      const numberInput = document.getElementById('calc-number');
      
      return {
        width: widthInput?.value || '',
        height: heightInput?.value || '',
        unit: unitSelect?.value || 'ft',
        numberOfUnits: numberInput?.value || '1',
        glass: this.getGlassOption(),
        color: this.getColorOption(),
        area: this.getArea()
      };
    }
    
    sendEmail(userDetails) {
      const selections = this.getCalculatorSelections();
      
      const message = `
New Quote Request - Fold & Sliding Window System

Specifications:
- Size: ${selections.width} x ${selections.height} ${selections.unit}
- Area: ${selections.area.toFixed(2)} sq.ft
- Number of Units: ${selections.numberOfUnits}
- Glass: ${selections.glass}
- Color: ${selections.color}

Contact Details:
- Name: ${userDetails.name}
- City: ${userDetails.city}
- Mobile: ${userDetails.mobile}
${userDetails.email ? `- Email: ${userDetails.email}` : ''}`;
      
      const formData = new FormData();
      formData.append('Name', userDetails.name || '');
      formData.append('City', userDetails.city || '');
      formData.append('Mobile', userDetails.mobile || '');
      if (userDetails.email) {
        formData.append('Email', userDetails.email);
      }
      formData.append('message', message);
      formData.append('_subject', `Fold & Sliding Window Quote - ${userDetails.name}`);
      formData.append('_captcha', 'false');
      
      this.submitEmailForm(formData);
    }
  }
  
  // Register the extension class
  if (typeof window !== 'undefined') {
    window.PriceCalculatorFoldSlidingWindowSystem = PriceCalculatorFoldSlidingWindowSystem;
  }
  
  // Override initCalculator to use this extension class
  if (typeof createExtensionInitCalculator === 'function') {
    createExtensionInitCalculator('fold-sliding-window-system', PriceCalculatorFoldSlidingWindowSystem, 'FoldSlidingWindowSystem');
  }
})();

