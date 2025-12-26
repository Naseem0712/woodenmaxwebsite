/**
 * Fold & Bi-Fold Aluminium Glass Doors Calculator Extension
 * Extends base calculator with profile and glass options
 */

(function() {
  'use strict';
  
  class PriceCalculatorFoldBifoldAluminiumDoors extends PriceCalculatorBase {
    constructor(productId, productConfig, containerId) {
      super(productId, productConfig, containerId);
      
      // Base rate per sqft (includes 8mm clear tuff glass + mortice lock)
      this.BASE_RATE_PER_SQFT = productConfig.rates.baseRate || 1750;
      
      // Profile options (from JSON)
      this.PROFILE_RATES = productConfig.rates.profiles || {
        '50mm': 0,
        '52mm': 0
      };
      
      // Glass rates (from JSON)
      this.GLASS_RATES = productConfig.rates.glass || {
        '8mm-clear': 0,
        '6mm-clear': -20,
        '10mm-clear': 35,
        '12mm-clear': 65,
        'safety': 180,
        'dgu': 200
      };
      
      setTimeout(() => {
        this.setupExtensionEventListeners();
        this.setupFormSubmission();
      }, 150);
    }
    
    setupExtensionEventListeners() {
      // Number of doors listener
      const numberInput = document.getElementById('calc-number');
      if (numberInput) {
        numberInput.addEventListener('input', () => this.calculate());
      }
      
      // Profile option listener
      const profileSelect = document.getElementById('calc-profile');
      if (profileSelect) {
        profileSelect.addEventListener('change', () => this.calculate());
      }
      
      // Glass option listener
      const glassSelect = document.getElementById('calc-glass');
      if (glassSelect) {
        glassSelect.addEventListener('change', () => this.calculate());
      }
    }
    
    getProfileOption() {
      const profileSelect = document.getElementById('calc-profile');
      return profileSelect ? profileSelect.value : '50mm';
    }
    
    getGlassOption() {
      const glassSelect = document.getElementById('calc-glass');
      return glassSelect ? glassSelect.value : '8mm-clear';
    }
    
    calculate() {
      // Get area in sqft
      const areaSqft = this.getArea();
      const numberOfDoors = parseInt(document.getElementById('calc-number')?.value || '1', 10);
      
      if (areaSqft <= 0) {
        this.displayResults(0, 0, 0, 0, 0, 0, 0);
        return;
      }
      
      // Base cost per sqft (includes 8mm clear tuff glass + mortice lock)
      let baseCostPerSqft = this.BASE_RATE_PER_SQFT;
      
      // Glass add-ons (per sqft)
      let addOnsPerSqft = 0;
      const glassOption = this.getGlassOption();
      
      if (this.GLASS_RATES[glassOption] !== undefined) {
        addOnsPerSqft += Number(this.GLASS_RATES[glassOption]) || 0;
      }
      
      // Profile option (currently no additional cost, but structure ready)
      const profileOption = this.getProfileOption();
      if (this.PROFILE_RATES[profileOption]) {
        addOnsPerSqft += Number(this.PROFILE_RATES[profileOption]) || 0;
      }
      
      // Calculate per sqft cost
      const costPerSqft = baseCostPerSqft + addOnsPerSqft;
      
      // Cost per door = area × rate per sqft
      const costPerDoor = areaSqft * costPerSqft;
      
      // Total cost for all doors
      const totalCost = costPerDoor * numberOfDoors;
      
      // Calculate ±20% range
      const costPerDoorMinus20 = costPerDoor * 0.8;
      const costPerDoorPlus20 = costPerDoor * 1.2;
      const totalCostMinus20 = totalCost * 0.8;
      const totalCostPlus20 = totalCost * 1.2;
      
      // Display results
      this.displayResults(
        costPerDoorMinus20,
        costPerDoorPlus20,
        totalCostMinus20,
        totalCostPlus20,
        costPerDoor,
        totalCost,
        numberOfDoors
      );
    }
    
    displayResults(perDoorMin, perDoorMax, totalMin, totalMax, perDoor, total, count) {
      const formatCurrency = (num) => '₹' + Math.round(num).toLocaleString('en-IN');
      
      // Per door range
      const perDoorResult = document.getElementById('calc-result-per-window');
      if (perDoorResult) {
        perDoorResult.textContent = `${formatCurrency(perDoorMin)} - ${formatCurrency(perDoorMax)}`;
      }
      
      // Total range
      const totalResult = document.getElementById('calc-result-total');
      if (totalResult) {
        totalResult.textContent = `${formatCurrency(totalMin)} - ${formatCurrency(totalMax)}`;
      }
      
      // Update labels
      const perDoorLabel = document.getElementById('calc-label-per-window');
      if (perDoorLabel) {
        perDoorLabel.textContent = 'Per Door Cost (Range):';
      }
      
      const totalLabel = document.getElementById('calc-label-total');
      if (totalLabel) {
        totalLabel.textContent = count > 1 ? `Total Cost - ${count} Doors (Range):` : 'Total Cost (Range):';
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
        numberOfDoors: numberInput?.value || '1',
        profile: this.getProfileOption(),
        glass: this.getGlassOption(),
        area: this.getArea()
      };
    }
    
    sendEmail(userDetails) {
      const selections = this.getCalculatorSelections();
      
      const message = `
New Quote Request - Fold & Bi-Fold Aluminium Glass Doors

Door Specifications:
- Size: ${selections.width} x ${selections.height} ${selections.unit}
- Area: ${selections.area.toFixed(2)} sq.ft
- Number of Doors: ${selections.numberOfDoors}
- Profile: ${selections.profile}
- Glass: ${selections.glass}

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
      formData.append('_subject', `Fold & Bi-Fold Door Quote - ${userDetails.name}`);
      formData.append('_captcha', 'false');
      
      this.submitEmailForm(formData);
    }
  }
  
  // Register the extension class
  if (typeof window !== 'undefined') {
    window.PriceCalculatorFoldBifoldAluminiumDoors = PriceCalculatorFoldBifoldAluminiumDoors;
  }
  
  // Override initCalculator to use this extension class
  if (typeof createExtensionInitCalculator === 'function') {
    createExtensionInitCalculator('fold-bifold-aluminium-doors', PriceCalculatorFoldBifoldAluminiumDoors, 'FoldBifoldAluminiumDoors');
  }
})();

