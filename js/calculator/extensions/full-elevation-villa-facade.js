/**
 * Extension for Full Elevation Aluminium Windows & Doors
 * Fixed glass system with imported slim profiles
 * Height-based validation (max 12 feet)
 */

if (typeof PriceCalculatorBase !== 'undefined') {
  class PriceCalculatorFullElevationVillaFacade extends PriceCalculatorBase {
    constructor(productId, productConfig, containerId) {
      super(productId, productConfig, containerId);
      
      // Base rate per sqft
      this.BASE_RATE_PER_SQFT = productConfig.rates.baseRate || 500;
      
      // Max height validation (12 feet)
      this.MAX_HEIGHT_FT = productConfig.maxHeight || 12;
      
      // Fluted glass rates (per sqft) - imported glass (from JSON)
      this.FLUTED_RATES = productConfig.rates.flutedGlass || {};
      
      // Fluted glass max heights (from JSON)
      this.FLUTED_MAX_HEIGHTS = productConfig.rates.flutedMaxHeights || {
        'clear': 10,
        'brown': 8,
        'grey': 8
      };
      
      // Premium colors rates (Rose Gold, Copper Gold) - hidden charge (from JSON)
      this.PREMIUM_COLOR_RATES = productConfig.rates.premiumColors || {};
    }
    
    setupEventListeners() {
      super.setupEventListeners();
      
      setTimeout(() => {
        this.setupExtensionEventListeners();
        // Setup form submission
        this.setupFormSubmission();
      }, 150);
    }
    
    setupExtensionEventListeners() {
      console.log('🔧 Setting up Full Elevation Villa Facade extension event listeners...');
      
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
      
      // Height validation
      const heightInput = document.getElementById('calc-height');
      const unitSelect = document.getElementById('calc-unit');
      if (heightInput) {
        heightInput.addEventListener('input', () => this.validateHeight());
        heightInput.addEventListener('change', () => {
          this.validateHeight();
          this.calculate();
        });
      }
      if (unitSelect) {
        unitSelect.addEventListener('change', () => {
          this.validateHeight();
          this.calculate();
        });
      }
      
    }
    
    validateHeight() {
      const heightInput = document.getElementById('calc-height');
      if (!heightInput) return;
      
      const heightValue = parseFloat(heightInput.value) || 0;
      const unitSelect = document.getElementById('calc-unit');
      const unit = unitSelect?.value || 'ft';
      
      // Convert to feet
      let heightFt = heightValue;
      if (unit === 'ft-in') {
        heightFt = this.parseFeetInches(heightInput.value);
      } else if (unit === 'm') {
        heightFt = heightValue * 3.28084;
      } else if (unit === 'cm') {
        heightFt = heightValue * 0.0328084;
      } else if (unit === 'mm') {
        heightFt = heightValue * 0.00328084;
      } else if (unit === 'inch') {
        heightFt = heightValue / 12;
      }
      
      // Check max height
      if (heightFt > this.MAX_HEIGHT_FT) {
        heightInput.style.borderColor = '#ef4444';
        const errorMsg = document.getElementById('calc-height-error');
        if (errorMsg) {
          errorMsg.textContent = `Maximum height is ${this.MAX_HEIGHT_FT} feet`;
          errorMsg.style.display = 'block';
        }
        return false;
      } else {
        heightInput.style.borderColor = '';
        const errorMsg = document.getElementById('calc-height-error');
        if (errorMsg) {
          errorMsg.style.display = 'none';
        }
      }
      
      // Check fluted glass height limits
      const glassSelect = document.getElementById('calc-glass');
      if (glassSelect) {
        const glassOption = glassSelect.value;
        
        // Clear fluted glass (6mm and 8mm) - max 10 feet
        if ((glassOption === '6mm-clear-fluted' || glassOption === '8mm-clear-fluted') && heightFt > this.FLUTED_MAX_HEIGHTS.clear) {
          heightInput.style.borderColor = '#ef4444';
          const errorMsg = document.getElementById('calc-height-error');
          if (errorMsg) {
            errorMsg.textContent = `Clear fluted glass (imported) is available up to ${this.FLUTED_MAX_HEIGHTS.clear} feet maximum`;
            errorMsg.style.display = 'block';
            errorMsg.style.color = '#ef4444';
          }
          return false;
        }
        
        // Brown/Grey fluted glass (6mm and 8mm) - max 8 feet
        if ((glassOption === '6mm-brown-fluted' || glassOption === '8mm-brown-fluted' || 
             glassOption === '6mm-grey-fluted' || glassOption === '8mm-grey-fluted') && heightFt > this.FLUTED_MAX_HEIGHTS.brown) {
          heightInput.style.borderColor = '#ef4444';
          const errorMsg = document.getElementById('calc-height-error');
          if (errorMsg) {
            errorMsg.textContent = `Brown/Grey fluted glass (imported) is available up to ${this.FLUTED_MAX_HEIGHTS.brown} feet maximum`;
            errorMsg.style.display = 'block';
            errorMsg.style.color = '#ef4444';
          }
          return false;
        }
      }
      
      
      return true;
    }
    
    getNumberOfWindows() {
      const input = document.getElementById('calc-number');
      return Math.max(1, parseInt(input?.value) || 1);
    }
    
    getGlassOption() {
      const glassSelect = document.getElementById('calc-glass');
      return glassSelect ? glassSelect.value : '6mm';
    }
    
    getColorOption() {
      const colorSelect = document.getElementById('calc-color');
      return colorSelect ? colorSelect.value : 'matt-black';
    }
    
    calculate() {
      // Use base class method for area calculation
      const areaSqft = this.getArea();
      const numberOfWindows = parseInt(document.getElementById('calc-number')?.value || '1', 10);
      
      // Get height in feet for validation
      const heightInput = document.getElementById('calc-height');
      const unitSelect = document.getElementById('calc-unit');
      const unit = unitSelect?.value || 'ft';
      const heightValue = parseFloat(heightInput?.value || 0);
      
      let heightFt = heightValue;
      if (unit === 'ft-in') {
        heightFt = this.parseFeetInches(heightInput.value);
      } else if (unit === 'm') {
        heightFt = heightValue * 3.28084;
      } else if (unit === 'cm') {
        heightFt = heightValue * 0.0328084;
      } else if (unit === 'mm') {
        heightFt = heightValue * 0.00328084;
      } else if (unit === 'inch') {
        heightFt = heightValue / 12;
      }
      
      // Validate height
      if (!this.validateHeight()) {
        this.displayResults(0, 0, 0, 0, 0, 0, 0);
        return;
      }
      
      if (areaSqft <= 0) {
        this.displayResults(0, 0, 0, 0, 0, 0, 0);
        return;
      }
      
      const totalAreaSqft = areaSqft * numberOfWindows;
      
      // Base cost (per sqft)
      let baseCostPerSqft = this.BASE_RATE_PER_SQFT;
      
      // Glass add-ons (per sqft)
      let addOnsPerSqft = 0;
      const glassOption = this.getGlassOption();
      
      // Check if it's a fluted glass option
      if (glassOption.includes('fluted')) {
        // Fluted glass options (imported)
        if (this.FLUTED_RATES[glassOption]) {
          addOnsPerSqft += Number(this.FLUTED_RATES[glassOption]) || 0;
        }
      } else {
        // Regular glass options (use global rates)
        const glassRates = this.GLASS_RATES || {};
        if (glassOption === '5mm' && glassRates['5mm']) {
          addOnsPerSqft += Number(glassRates['5mm']) || 0;
        } else if (glassOption === '8mm' && glassRates['8mm']) {
          addOnsPerSqft += Number(glassRates['8mm']) || 0;
        } else if (glassOption === '10mm' && glassRates['10mm']) {
          addOnsPerSqft += Number(glassRates['10mm']) || 0;
        } else if (glassOption === '12mm' && glassRates['12mm']) {
          addOnsPerSqft += Number(glassRates['12mm']) || 0;
        } else if (glassOption === 'dgu' && glassRates.dgu) {
          addOnsPerSqft += Number(glassRates.dgu) || 0;
        } else if (glassOption === 'safety' && glassRates.safety) {
          addOnsPerSqft += Number(glassRates.safety) || 0;
        }
      }
      
      // Premium color hidden charge (Rose Gold / Copper Gold) - from JSON
      const colorOption = this.getColorOption();
      if (this.PREMIUM_COLOR_RATES[colorOption]) {
        addOnsPerSqft += Number(this.PREMIUM_COLOR_RATES[colorOption]) || 0;
      }
      
      
      // Calculate costs
      const costPerSqft = baseCostPerSqft + addOnsPerSqft;
      const costPerWindow = areaSqft * costPerSqft;
      
      // Calculate range (+/- 20%)
      const perWindowPlus20 = costPerWindow * 1.2;
      const perWindowMinus20 = costPerWindow * 0.8;
      const subtotal = costPerWindow * numberOfWindows;
      const totalPlus20 = subtotal * 1.2;
      const totalMinus20 = subtotal * 0.8;
      
      // Store calculated amounts for email
      this.lastCalculatedAmounts = {
        perWindowCost: costPerWindow,
        subtotal: subtotal
      };
      
      // Display results
      this.displayResults(perWindowCost, perWindowPlus20, perWindowMinus20, subtotal, totalPlus20, totalMinus20, areaSqft);
    }
    
    
    getCalculatorSelections() {
      const glassOption = this.getGlassOption();
      const colorOption = this.getColorOption();
      
      const selections = {
        glass: glassOption,
        color: colorOption
      };
      
      return selections;
    }
    
    sendEmail(userDetails) {
      const selections = this.getCalculatorSelections();
      const widthInput = document.getElementById('calc-width');
      const heightInput = document.getElementById('calc-height');
      const unitSelect = document.getElementById('calc-unit');
      const unit = unitSelect?.value || 'ft';
      const numberOfWindows = parseInt(document.getElementById('calc-number')?.value || '1', 10);
      
      const width = parseFloat(widthInput?.value || 0);
      const height = parseFloat(heightInput?.value || 0);
      
      // Get stored amounts or recalculate
      let areaSqft = this.getArea();
      let perWindowCost = 0;
      let subtotal = 0;
      
      if (this.lastCalculatedAmounts) {
        perWindowCost = this.lastCalculatedAmounts.perWindowCost || 0;
        subtotal = this.lastCalculatedAmounts.subtotal || 0;
      } else {
        // Fallback calculation
        this.calculate();
        perWindowCost = this.lastCalculatedAmounts?.perWindowCost || 0;
        subtotal = this.lastCalculatedAmounts?.subtotal || 0;
        areaSqft = this.getArea();
      }
      
      // Build email message
      const glassNames = {
        '6mm': '6mm Clear Glass',
        '8mm': '8mm Clear Glass',
        '10mm': '10mm Clear Glass',
        '12mm': '12mm Clear Glass',
        '5mm': '5mm Clear Glass',
        'dgu': 'DGU Glass',
        'safety': 'Safety Glass',
        '6mm-clear-fluted': '6mm Clear Fluted Glass (Imported)',
        '8mm-clear-fluted': '8mm Clear Fluted Glass (Imported)',
        '6mm-brown-fluted': '6mm Brown Fluted Glass (Imported)',
        '8mm-brown-fluted': '8mm Brown Fluted Glass (Imported)',
        '6mm-grey-fluted': '6mm Grey Fluted Glass (Imported)',
        '8mm-grey-fluted': '8mm Grey Fluted Glass (Imported)'
      };
      
      const colorNames = {
        'matt-black': 'Matt Black',
        'gold': 'Gold',
        'brush-gold': 'Brush Gold',
        'grey': 'Grey',
        'mill-finish': 'Mill Finish',
        'rose-gold': 'Rose Gold',
        'copper-gold': 'Copper Gold',
        'custom-ral': 'Custom RAL Color'
      };
      
      const message = `Full Elevation Aluminium Windows & Doors Quote Request

Dimensions:
- Width: ${width} ${unit}
- Height: ${height} ${unit}
- Area per window: ${areaSqft.toFixed(2)} sqft
- Number of panels: ${numberOfWindows}

Selections:
- Glass Type: ${glassNames[selections.glass] || selections.glass}
- Color: ${colorNames[selections.color] || selections.color}

Calculated Amounts:
- Cost per panel: ₹${Math.round(perWindowCost).toLocaleString('en-IN')}
- Total cost: ₹${Math.round(subtotal).toLocaleString('en-IN')}

Contact Details:
- Name: ${userDetails.name}
- City: ${userDetails.city}
- Mobile: ${userDetails.mobile}
${userDetails.email ? `- Email: ${userDetails.email}` : ''}`;
      
      // Prepare form data (only name, city, mobile, email)
      const formData = new FormData();
      formData.append('Name', userDetails.name || '');
      formData.append('City', userDetails.city || '');
      formData.append('Mobile', userDetails.mobile || '');
      if (userDetails.email) {
        formData.append('Email', userDetails.email);
      }
      formData.append('message', message);
      formData.append('_subject', `Full Elevation Aluminium Windows & Doors Quote - ${userDetails.name}`);
      formData.append('_captcha', 'false');
      
      // Submit email
      this.submitEmailForm(formData);
    }
    
    initCalculator() {
      if (typeof createExtensionInitCalculator === 'function') {
        createExtensionInitCalculator('full-elevation-villa-facade', PriceCalculatorFullElevationVillaFacade);
      } else {
        super.initCalculator();
      }
    }
  }
  
  // Register the extension
  if (typeof window !== 'undefined') {
    window.PriceCalculatorFullElevationVillaFacade = PriceCalculatorFullElevationVillaFacade;
  }
}

