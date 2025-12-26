/**
 * Extension for Telescopic Slim Profile Sliding Door
 * Imported soft-close hardware with panel configurations
 * Profile options: Ultra Slim, Slim, Regular Slim
 */

if (typeof PriceCalculatorBase !== 'undefined') {
  class PriceCalculatorTelescopicSlimSlidingDoor extends PriceCalculatorBase {
    constructor(productId, productConfig, containerId) {
      super(productId, productConfig, containerId);
      
      // Base rate per sqft (includes 8mm clear tuff glass)
      this.BASE_RATE_PER_SQFT = productConfig.rates.baseRate || 1250;
      
      // Panel configuration hardware costs (from JSON)
      this.PANEL_CONFIG_COSTS = productConfig.rates.panelConfig || {
        '1+1': 4500,
        '2+1': 6500,
        '3+1': 9500,
        '4+1': 12500
      };
      
      // Profile options (from JSON) - currently no additional cost
      this.PROFILE_RATES = productConfig.rates.profiles || {};
      
      // Glass options (from JSON)
      this.GLASS_RATES = productConfig.rates.glass || {};
      
      // Premium colors (Rose Gold, Copper Gold) - hidden charge (from JSON)
      this.PREMIUM_COLOR_RATES = productConfig.rates.premiumColors || {};
    }
    
    setupEventListeners() {
      super.setupEventListeners();
      
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
      
      // Panel config listener
      const panelSelect = document.getElementById('calc-panel-config');
      if (panelSelect) {
        panelSelect.addEventListener('change', () => this.calculate());
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
      
      // Color option listener
      const colorSelect = document.getElementById('calc-color');
      if (colorSelect) {
        colorSelect.addEventListener('change', () => this.calculate());
      }
    }
    
    getPanelConfig() {
      const panelSelect = document.getElementById('calc-panel-config');
      return panelSelect ? panelSelect.value : '1+1';
    }
    
    getProfileOption() {
      const profileSelect = document.getElementById('calc-profile');
      return profileSelect ? profileSelect.value : 'ultra-slim-12x35';
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
      const numberOfDoors = parseInt(document.getElementById('calc-number')?.value || '1', 10);
      
      if (areaSqft <= 0) {
        this.displayResults(0, 0, 0, 0, 0, 0, 0);
        return;
      }
      
      // Base cost per sqft (includes 8mm clear tuff glass)
      let baseCostPerSqft = this.BASE_RATE_PER_SQFT;
      
      // Glass add-ons (per sqft)
      let addOnsPerSqft = 0;
      const glassOption = this.getGlassOption();
      
      if (this.GLASS_RATES[glassOption]) {
        addOnsPerSqft += Number(this.GLASS_RATES[glassOption]) || 0;
      }
      
      // Premium color hidden charge (Rose Gold / Copper Gold)
      const colorOption = this.getColorOption();
      if (this.PREMIUM_COLOR_RATES[colorOption]) {
        addOnsPerSqft += Number(this.PREMIUM_COLOR_RATES[colorOption]) || 0;
      }
      
      // Profile option (currently no additional cost, but structure ready for future)
      const profileOption = this.getProfileOption();
      if (this.PROFILE_RATES[profileOption]) {
        addOnsPerSqft += Number(this.PROFILE_RATES[profileOption]) || 0;
      }
      
      // Calculate per sqft cost
      const costPerSqft = baseCostPerSqft + addOnsPerSqft;
      
      // Hardware cost based on panel configuration
      const panelConfig = this.getPanelConfig();
      const hardwareCost = Number(this.PANEL_CONFIG_COSTS[panelConfig]) || 4500;
      
      // Cost per door = (area × rate per sqft) + hardware cost
      const costPerDoor = (areaSqft * costPerSqft) + hardwareCost;
      
      // Calculate range (+/- 20%)
      const perDoorPlus20 = costPerDoor * 1.2;
      const perDoorMinus20 = costPerDoor * 0.8;
      const subtotal = costPerDoor * numberOfDoors;
      const totalPlus20 = subtotal * 1.2;
      const totalMinus20 = subtotal * 0.8;
      
      // Store calculated amounts for email
      this.lastCalculatedAmounts = {
        perWindowCost: costPerDoor,
        subtotal: subtotal,
        hardwareCost: hardwareCost
      };
      
      // Display results
      this.displayResults(costPerDoor, perDoorPlus20, perDoorMinus20, subtotal, totalPlus20, totalMinus20, areaSqft);
    }
    
    getCalculatorSelections() {
      return {
        panelConfig: this.getPanelConfig(),
        profile: this.getProfileOption(),
        glass: this.getGlassOption(),
        color: this.getColorOption()
      };
    }
    
    sendEmail(userDetails) {
      const selections = this.getCalculatorSelections();
      const widthInput = document.getElementById('calc-width');
      const heightInput = document.getElementById('calc-height');
      const unitSelect = document.getElementById('calc-unit');
      const unit = unitSelect?.value || 'ft';
      const numberOfDoors = parseInt(document.getElementById('calc-number')?.value || '1', 10);
      
      const width = parseFloat(widthInput?.value || 0);
      const height = parseFloat(heightInput?.value || 0);
      
      let areaSqft = this.getArea();
      let perDoorCost = this.lastCalculatedAmounts?.perWindowCost || 0;
      let subtotal = this.lastCalculatedAmounts?.subtotal || 0;
      let hardwareCost = this.lastCalculatedAmounts?.hardwareCost || 0;
      
      const panelNames = {
        '1+1': '1+1 (1 Sliding + 1 Fixed)',
        '2+1': '2+1 (2 Sliding + 1 Fixed)',
        '3+1': '3+1 (3 Sliding + 1 Fixed)',
        '4+1': '4+1 (4 Sliding + 1 Fixed)'
      };
      
      const profileNames = {
        'ultra-slim-12x35': 'Ultra Slim 12X35mm (Imported)',
        'slim-16x35': 'Slim 16X35mm (Imported)',
        'regular-slim-16x45': 'Regular Slim 16X45mm (Imported)'
      };
      
      const glassNames = {
        '8mm-clear': '8mm Clear Tuff Glass (Included)',
        '8mm-clear-fluted': '8mm Clear Fluted Glass (Imported)',
        '8mm-grey-fluted': '8mm Grey Fluted Glass (Imported)',
        '8mm-brown-fluted': '8mm Brown Fluted Glass (Imported)'
      };
      
      const colorNames = {
        'matt-black': 'Matt Black',
        'gold': 'Gold',
        'rose-gold': 'Rose Gold',
        'copper-gold': 'Copper Gold'
      };
      
      const message = `Telescopic Slim Profile Sliding Door Quote Request

Dimensions:
- Width: ${width} ${unit}
- Height: ${height} ${unit}
- Area per door: ${areaSqft.toFixed(2)} sqft
- Number of doors: ${numberOfDoors}

Selections:
- Panel Configuration: ${panelNames[selections.panelConfig] || selections.panelConfig}
- Profile Type: ${profileNames[selections.profile] || selections.profile}
- Glass Type: ${glassNames[selections.glass] || selections.glass}
- Color: ${colorNames[selections.color] || selections.color}

Calculated Amounts:
- Hardware Cost (${selections.panelConfig}): ₹${Math.round(hardwareCost).toLocaleString('en-IN')}
- Cost per door: ₹${Math.round(perDoorCost).toLocaleString('en-IN')}
- Total cost: ₹${Math.round(subtotal).toLocaleString('en-IN')}

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
      formData.append('_subject', `Telescopic Slim Sliding Door Quote - ${userDetails.name}`);
      formData.append('_captcha', 'false');
      
      this.submitEmailForm(formData);
    }
    
  }
  
  // Register the extension class
  if (typeof window !== 'undefined') {
    window.PriceCalculatorTelescopicSlimSlidingDoor = PriceCalculatorTelescopicSlimSlidingDoor;
  }
  
  // Override initCalculator to use this extension class
  if (typeof createExtensionInitCalculator === 'function') {
    createExtensionInitCalculator('telescopic-slim-sliding-door', PriceCalculatorTelescopicSlimSlidingDoor, 'TelescopicSlimSlidingDoor');
  }
}

