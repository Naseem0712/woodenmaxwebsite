/**
 * Extension for 3 Track Sliding Window (27MM Domal Series)
 * Extends PriceCalculatorBase with track selection and height validation
 */

if (typeof PriceCalculatorBase !== 'undefined') {
  // Create extended class for 3-track sliding window
  class PriceCalculator3Track extends PriceCalculatorBase {
    constructor(productId, productConfig, containerId) {
      super(productId, productConfig, containerId);
      
      this.productConfig = productConfig;
      if (!productConfig || !productConfig.rates || !window.WMPriceModels) throw new Error('authoritative-pricing-data-unavailable');
      
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
      
      const perWindowCost = window.WMPriceModels.threeTrack(this.productConfig, {
        /* The approved model is area-linear plus one hardware set. Passing
           area × 1 preserves single and multiple-size calculator behaviour. */
        width: areaSqft, height: 1, track: trackOption, glassMm: String(glassOption).replace('mm', '')
      });
      
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
      
      const perWindowCost = window.WMPriceModels.threeTrack(this.productConfig, {
        width: areaSqft, height: 1, track: trackOption, glassMm: String(glassOption).replace('mm', '')
      });
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
- Per Window: ${typeof window.formatPriceFromINR === 'function' ? window.formatPriceFromINR(Math.round(perWindowCost)) : '\u20B9' + Math.round(perWindowCost).toLocaleString('en-IN')}
- Total Cost: ${typeof window.formatPriceFromINR === 'function' ? window.formatPriceFromINR(Math.round(totalCost)) : '\u20B9' + Math.round(totalCost).toLocaleString('en-IN')}

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
      if (window.EmailSubmitter) {
        window.EmailSubmitter.submit({
          subject: `New Quote Request - ${this.config.name || this.productId}`,
          message: emailBody,
          userDetails: userDetails,
          onSuccess: () => this.showSuccessMessage(),
          onError: (e) => this.showEmailSubmitFailed(e)
        });
      } else {
        console.warn('⚠️ EmailSubmitter not loaded');
        this.showSuccessMessage();
      }
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

