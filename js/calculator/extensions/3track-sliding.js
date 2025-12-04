/**
 * Extension for 3 Track Sliding Window (27MM Domal Series)
 * Extends PriceCalculatorBase with track selection and height validation
 */

if (typeof PriceCalculatorBase !== 'undefined') {
  // Create extended class for 3-track sliding window
  class PriceCalculator3Track extends PriceCalculatorBase {
    constructor(productId, productConfig, containerId) {
      super(productId, productConfig, containerId);
      
      // Track selection rates from config
      this.TRACK_RATES = productConfig.rates.trackOptions || {
        "2track": 0,
        "3track": 100
      };
      
      // Glass rates from config
      this.GLASS_RATES = productConfig.rates.glass || {
        "6mm": 15,
        "8mm": 20
      };
      
      // Height limits
      this.HEIGHT_RECOMMENDED = 6; // feet
      this.HEIGHT_MAXIMUM = 8; // feet
    }
    
    setupEventListeners() {
      // Call parent setup
      super.setupEventListeners();
      
      // Add track selection listener
      const trackSelect = document.getElementById('calc-track');
      if (trackSelect) {
        trackSelect.addEventListener('change', () => this.calculate());
      }
      
      // Add glass option listener
      const glassSelect = document.getElementById('calc-glass');
      if (glassSelect) {
        glassSelect.addEventListener('change', () => this.calculate());
      }
      
      // Add height validation on height input change
      const heightInput = document.getElementById('calc-height');
      if (heightInput) {
        heightInput.addEventListener('change', () => {
          this.validateHeight();
        });
        heightInput.addEventListener('input', () => {
          this.validateHeight();
        });
      }
      
      // Validate height on initialization
      this.validateHeight();
    }
    
    getTrackOption() {
      const select = document.getElementById('calc-track');
      return select?.value || '2track';
    }
    
    validateHeight() {
      const heightInput = document.getElementById('calc-height');
      const unitSelect = document.getElementById('calc-unit');
      const heightWarning = document.getElementById('calc-height-warning');
      
      if (!heightInput || !unitSelect || !heightWarning) return;
      
      const unit = unitSelect.value || 'ft';
      let heightInFeet;
      
      if (unit === 'ft-in') {
        heightInFeet = this.parseFeetInches(heightInput.value);
      } else {
        const heightValue = parseFloat(heightInput.value) || 0;
        heightInFeet = this.convertLengthToFeet(heightValue, unit);
      }
      
      if (heightInFeet > this.HEIGHT_MAXIMUM) {
        heightWarning.textContent = `❌ Height exceeds ${this.HEIGHT_MAXIMUM} feet maximum. Not recommended - doors may not remain stable and could shake/vibrate significantly during sliding.`;
        heightWarning.style.color = '#ff6b6b';
        heightWarning.style.display = 'block';
      } else if (heightInFeet > this.HEIGHT_RECOMMENDED) {
        heightWarning.textContent = `⚠️ Maximum recommended height is ${this.HEIGHT_RECOMMENDED} feet for stable doors. You can go up to ${this.HEIGHT_MAXIMUM} feet at your own risk - doors won't break but may shake/vibrate during sliding.`;
        heightWarning.style.color = '#ffa500';
        heightWarning.style.display = 'block';
      } else {
        heightWarning.style.display = 'none';
      }
    }
    
    getGlassOption() {
      const select = document.getElementById('calc-glass');
      return select?.value || '5mm';
    }
    
    calculate() {
      if (!document.getElementById(this.containerId)) {
        return;
      }
      
      const areaSqft = this.getArea();
      const numberOfWindows = this.getNumberOfWindows();
      const trackOption = this.getTrackOption();
      const glassOption = this.getGlassOption();
      
      // Update area display
      const areaEl = document.getElementById('calc-area-display');
      if (areaEl) {
        areaEl.textContent = areaSqft > 0 ? areaSqft.toFixed(2) + ' sq.ft' : '0.00 sq.ft';
      }
      
      if (areaSqft <= 0) {
        this.displayResults(0, 0, 0, 0, 0, 0, 0);
        return;
      }
      
      // Calculate base rate based on track selection
      let baseRatePerSqft = this.BASE_RATE_PER_SQFT;
      if (trackOption === '3track' && this.TRACK_RATES['3track']) {
        // 3 track = base rate + mesh rate (₹100/sqft) = ₹500 + ₹100 = ₹600/sqft
        baseRatePerSqft = baseRatePerSqft + this.TRACK_RATES['3track'];
      }
      // 2 track = base rate only (₹500/sqft)
      
      // Base cost per window
      const baseCostPerWindow = (baseRatePerSqft * areaSqft) + this.BASE_HARDWARE_COST;
      
      // Glass add-ons (per sqft)
      let glassAdditionPerSqft = 0;
      if (glassOption === '6mm' && this.GLASS_RATES['6mm']) {
        glassAdditionPerSqft = this.GLASS_RATES['6mm']; // ₹15/sqft
      } else if (glassOption === '8mm' && this.GLASS_RATES['8mm']) {
        glassAdditionPerSqft = this.GLASS_RATES['8mm']; // ₹20/sqft
      }
      // 5mm is included in base rate
      
      // Calculate per window cost
      const glassCost = glassAdditionPerSqft * areaSqft;
      const perWindowCost = baseCostPerWindow + glassCost;
      
      // Total cost for all windows
      const subtotal = perWindowCost * numberOfWindows;
      
      // Calculate 20% add and 20% less for per window
      const perWindowPlus20 = perWindowCost * 1.2;
      const perWindowMinus20 = perWindowCost * 0.8;
      
      // Calculate 20% add and 20% less for total
      const totalPlus20 = subtotal * 1.2;
      const totalMinus20 = subtotal * 0.8;
      
      // Display results
      this.displayResults(perWindowCost, perWindowPlus20, perWindowMinus20, subtotal, totalPlus20, totalMinus20, areaSqft);
    }
    
    getCalculatorSelections() {
      const widthInput = document.getElementById('calc-width');
      const heightInput = document.getElementById('calc-height');
      const unitSelect = document.getElementById('calc-unit');
      const numberOfWindows = document.getElementById('calc-windows');
      const trackSelect = document.getElementById('calc-track');
      const glassSelect = document.getElementById('calc-glass');
      const colorSelect = document.getElementById('calc-color');
      
      return {
        width: widthInput?.value || '',
        height: heightInput?.value || '',
        unit: unitSelect?.options[unitSelect?.selectedIndex]?.text || '',
        numberOfWindows: numberOfWindows?.value || '1',
        track: trackSelect?.options[trackSelect?.selectedIndex]?.text || '',
        glass: glassSelect?.options[glassSelect?.selectedIndex]?.text || '',
        color: colorSelect?.options[colorSelect?.selectedIndex]?.text || '',
        area: document.getElementById('calc-area-display')?.textContent || '0.00 sq.ft'
      };
    }
    
    sendEmail(userDetails) {
      const selections = this.getCalculatorSelections();
      const areaSqft = this.getArea();
      const numberOfWindows = this.getNumberOfWindows();
      const trackOption = this.getTrackOption();
      const glassOption = this.getGlassOption();
      
      // Calculate amounts with track selection
      let baseRate = this.BASE_RATE_PER_SQFT;
      if (trackOption === '3track' && this.TRACK_RATES['3track']) {
        baseRate += this.TRACK_RATES['3track']; // ₹500 + ₹100 = ₹600/sqft
      }
      
      // Glass add-on
      let glassAdditionPerSqft = 0;
      if (glassOption === '6mm' && this.GLASS_RATES['6mm']) {
        glassAdditionPerSqft = this.GLASS_RATES['6mm']; // ₹15/sqft
      } else if (glassOption === '8mm' && this.GLASS_RATES['8mm']) {
        glassAdditionPerSqft = this.GLASS_RATES['8mm']; // ₹20/sqft
      }
      
      const baseCostPerWindow = (baseRate * areaSqft) + this.BASE_HARDWARE_COST;
      const glassCost = glassAdditionPerSqft * areaSqft;
      const perWindowCost = baseCostPerWindow + glassCost;
      const totalCost = perWindowCost * numberOfWindows;
      
      // Email body
      const emailBody = `
New Quote Request - ${this.config.name || this.productId}

User Details:
- Name: ${userDetails.name}
- City: ${userDetails.city}
- Mobile: ${userDetails.mobile}
${userDetails.email ? `- Email: ${userDetails.email}` : ''}

Product: ${this.config.name || this.productId}
Size: ${selections.width} × ${selections.height} ${selections.unit}
Area: ${selections.area}
Number of Windows: ${selections.numberOfWindows}

Selected Options:
- Track Option: ${selections.track}
- Glass Type: ${selections.glass}
- Color: ${selections.color}

Calculated Amount:
- Per Window: ₹${Math.round(perWindowCost).toLocaleString('en-IN')}
- Total Cost: ₹${Math.round(totalCost).toLocaleString('en-IN')}

---
Generated from Live Price Calculator
      `.trim();
      
      // Override submitEmailForm to include 3-track specific fields
      this.submitEmailFormCustom(emailBody, userDetails, selections, {
        perWindow: perWindowCost,
        total: totalCost
      });
    }
    
    submitEmailFormCustom(emailBody, userDetails, selections, amounts) {
      console.log('📧 Submitting email via FormSubmit.co...');
      
      const formData = new FormData();
      formData.append('_subject', `New Quote Request - ${this.config.name || this.productId}`);
      formData.append('_template', 'box');
      formData.append('_captcha', 'false');
      formData.append('_next', window.location.href);
      formData.append('message', emailBody);
      formData.append('Name', userDetails.name);
      formData.append('City', userDetails.city);
      formData.append('Mobile', userDetails.mobile);
      if (userDetails.email) {
        formData.append('Email', userDetails.email);
      }
      formData.append('Product', this.config.name || this.productId);
      formData.append('Size', `${selections.width} × ${selections.height} ${selections.unit}`);
      formData.append('Area', selections.area);
      formData.append('Number of Windows', selections.numberOfWindows);
      formData.append('Track Option', selections.track);
      formData.append('Glass Type', selections.glass);
      formData.append('Color', selections.color);
      formData.append('Per Window Cost', `₹${Math.round(amounts.perWindow).toLocaleString('en-IN')}`);
      formData.append('Total Cost', `₹${Math.round(amounts.total).toLocaleString('en-IN')}`);
      
      // Try AJAX first
      fetch('https://formsubmit.co/info@woodenmax.com', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success === true || data.success === 'true') {
          console.log('✅ Email sent successfully via FormSubmit.co (AJAX)');
          this.showSuccessMessage();
        } else {
          console.log('⚠️ FormSubmit.co AJAX failed:', data.message);
          // Fallback would be handled by base class if needed
          this.showSuccessMessage();
        }
      })
      .catch(error => {
        console.error('❌ Error submitting email:', error);
        this.showSuccessMessage();
      });
    }
    
    showSuccessMessage() {
      const form = document.getElementById('calc-user-form');
      const successMsg = document.getElementById('calc-success-message');
      
      if (form) form.style.display = 'none';
      if (successMsg) {
        successMsg.style.display = 'block';
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }
  
  // Use helper function to create initCalculator override
  if (typeof createExtensionInitCalculator !== 'undefined') {
    createExtensionInitCalculator('3track-sliding', PriceCalculator3Track, '3track-sliding');
  } else {
    // Fallback if helper not loaded
    const originalInitCalculator = window.initCalculator;
    window.initCalculator = async function(productId, containerId = null) {
      if (productId === '3track-sliding') {
        try {
          if (typeof PriceCalculatorBase === 'undefined' || typeof productManager === 'undefined') {
            console.error('Required dependencies not found');
            return null;
          }
          const productData = await productManager.getProduct(productId);
          if (!productData) return null;
          const calcContainerId = containerId || `price-calculator-${productId}`;
          const container = document.getElementById(calcContainerId);
          if (!container) return null;
          const calculator = new PriceCalculator3Track(productId, productData, calcContainerId);
          window[`calculator_${productId}`] = calculator;
          return calculator;
        } catch (error) {
          console.error(`Error initializing 3-track calculator:`, error);
          return null;
        }
      } else if (originalInitCalculator) {
        return originalInitCalculator(productId, containerId);
      }
      return null;
    };
  }
  
  // Export
  window.PriceCalculator3Track = PriceCalculator3Track;
}

