/**
 * Extension for Georgian Bar Openable Window
 * Extends PriceCalculatorBase with special hardware cost logic based on glass selection
 * Base rate: Top hung (650) + 250 = 900 per sqft
 */

if (typeof PriceCalculatorBase !== 'undefined') {
  // Create extended class for georgian-bar-openable window
  class PriceCalculatorGeorgianBarOpenable extends PriceCalculatorBase {
    constructor(productId, productConfig, containerId) {
      super(productId, productConfig, containerId);
      
      // Hardware costs from config
      this.BASE_HARDWARE_COST = productConfig.rates.hardwareCost || 650;
      this.MULTIPOINT_HARDWARE_COST = productConfig.rates.hardwareCostMultiPoint || 1400;
      
      // Grill and mesh rates
      this.GRILL_RATE = productConfig.rates.grill?.aluminium12mm || 280;
      this.MESH_RATE = productConfig.rates.mesh?.openable || 350;
    }
    
    setupEventListeners() {
      // Call parent setup first
      super.setupEventListeners();
      
      // Add delay to ensure all elements are ready
      setTimeout(() => {
        this.setupExtensionEventListeners();
      }, 150);
    }
    
    setupExtensionEventListeners() {
      console.log('🔧 Setting up extension event listeners...');
      
      // Add glass option listener
      const glassSelect = document.getElementById('calc-glass');
      if (glassSelect) {
        glassSelect.addEventListener('change', () => this.calculate());
        console.log('✅ Glass select listener added');
      } else {
        console.warn('⚠️ Glass select not found');
      }
      
      // Fresh Grill Checkbox Implementation
      this.setupGrillCheckbox();
      
      // Add mesh checkbox listener - ensure it works properly
      const meshCheckbox = document.getElementById('calc-mesh');
      if (meshCheckbox) {
        console.log('✅ Mesh checkbox found, adding listeners, Rate:', this.MESH_RATE);
        const meshChangeHandler = () => {
          console.log('🕸️ Mesh checkbox changed:', meshCheckbox.checked, 'Mesh Rate:', this.MESH_RATE);
          this.calculate();
        };
        const meshClickHandler = (e) => {
          setTimeout(() => {
            console.log('🕸️ Mesh checkbox clicked:', meshCheckbox.checked);
            this.calculate();
          }, 50);
        };
        
        meshCheckbox.addEventListener('change', meshChangeHandler);
        meshCheckbox.addEventListener('click', meshClickHandler);
        
        // Also add to label if it exists
        const meshLabel = document.querySelector('label[for="calc-mesh"]');
        if (meshLabel) {
          meshLabel.addEventListener('click', (e) => {
            setTimeout(() => {
              console.log('🕸️ Mesh label clicked, checkbox state:', meshCheckbox.checked);
              this.calculate();
            }, 50);
          });
        }
        
        // Store handlers for potential cleanup
        this._meshHandlers = { change: meshChangeHandler, click: meshClickHandler };
      } else {
        console.error('❌ Mesh checkbox NOT FOUND!');
      }
      
      // Add lock option listener
      const lockSelect = document.getElementById('calc-lock');
      if (lockSelect) {
        lockSelect.addEventListener('change', () => this.calculate());
        console.log('✅ Lock select listener added');
      } else {
        console.warn('⚠️ Lock select not found');
      }
      
      console.log('✅ Extension event listeners setup complete');
    }
    
    getGlassOption() {
      const select = document.getElementById('calc-glass');
      return select?.value || '6mm';
    }
    
    getLockOption() {
      const select = document.getElementById('calc-lock');
      return select?.value || 'single';
    }
    
    /**
     * Setup Grill Checkbox Event Listeners - Fresh Implementation
     */
    setupGrillCheckbox() {
      const grillCheckbox = document.getElementById('calc-grill');
      
      if (!grillCheckbox) {
        console.warn('⚠️ Grill checkbox element not found');
        return;
      }
      
      console.log('✅ Setting up grill checkbox, Rate:', this.GRILL_RATE);
      
      // Remove any existing listeners by cloning
      const newCheckbox = grillCheckbox.cloneNode(true);
      grillCheckbox.parentNode.replaceChild(newCheckbox, grillCheckbox);
      
      // Fresh change event listener
      newCheckbox.addEventListener('change', () => {
        const isChecked = newCheckbox.checked;
        console.log('🔥 Grill checkbox changed:', isChecked, 'Rate:', this.GRILL_RATE);
        this.calculate();
      });
      
      // Fresh click event listener
      newCheckbox.addEventListener('click', () => {
        setTimeout(() => {
          const isChecked = newCheckbox.checked;
          console.log('🔥 Grill checkbox clicked:', isChecked);
          this.calculate();
        }, 10);
      });
      
      // Also handle label clicks
      const grillLabel = document.querySelector('label[for="calc-grill"]');
      if (grillLabel) {
        grillLabel.addEventListener('click', () => {
          setTimeout(() => {
            const isChecked = newCheckbox.checked;
            console.log('🔥 Grill label clicked, state:', isChecked);
            this.calculate();
          }, 10);
        });
      }
      
      console.log('✅ Grill checkbox listeners setup complete');
    }
    
    /**
     * Get Grill Option - Fresh Implementation
     */
    getGrillOption() {
      const checkbox = document.getElementById('calc-grill');
      if (!checkbox) {
        return false;
      }
      const isChecked = checkbox.checked;
      console.log('📋 getGrillOption() called, checked:', isChecked);
      return isChecked;
    }
    
    getMeshOption() {
      const checkbox = document.getElementById('calc-mesh');
      return checkbox?.checked || false;
    }
    
    calculate() {
      if (!document.getElementById(this.containerId)) {
        return;
      }
      
      // Update area display first
      this.updateAreaDisplay();
      
      const areaSqft = this.getArea();
      const numberOfWindows = this.getNumberOfWindows();
      const glassOption = this.getGlassOption();
      const lockOption = this.getLockOption();
      const hasGrill = this.getGrillOption();
      const hasMesh = this.getMeshOption();
      
      if (areaSqft <= 0) {
        this.displayResults(0, 0, 0, 0, 0, 0, 0);
        return;
      }
      
      // Determine hardware cost based on glass selection
      // IMPORTANT: Heavy glass (10mm, 12mm, DGU, Laminated, Safety) requires stronger hardware
      // So hardware cost automatically changes from BASE (650) to MULTIPOINT (1400) per window
      let hardwareCostPerWindow = this.BASE_HARDWARE_COST;
      if (glassOption === '10mm' || glassOption === '12mm' || glassOption === 'dgu' || glassOption === 'laminated' || glassOption === 'safety') {
        // Heavy glass selected - upgrade hardware cost to 1400 per window
        hardwareCostPerWindow = this.MULTIPOINT_HARDWARE_COST;
      }
      
      // If user explicitly selects multipoint lock, also upgrade hardware cost
      if (lockOption === 'multi' && this.LOCK_RATES && this.LOCK_RATES.multiPoint) {
        hardwareCostPerWindow = this.MULTIPOINT_HARDWARE_COST;
      }
      
      // Base cost per window (base rate * area + hardware cost)
      const baseCostPerWindow = (this.BASE_RATE_PER_SQFT * areaSqft) + hardwareCostPerWindow;
      
      // Add-ons (per sqft)
      let addOnsPerSqft = 0;
      
      // Glass add-ons (use global rates from config)
      if (glassOption !== '6mm') {
        let glassKey = glassOption;
        // Map glass options to config keys
        if (glassOption === '8mm') glassKey = '8mm';
        else if (glassOption === '10mm') glassKey = '10mm';
        else if (glassOption === '12mm') glassKey = '12mm';
        else if (glassOption === 'dgu') glassKey = 'dgu';
        else if (glassOption === 'laminated') glassKey = 'laminated';
        else if (glassOption === 'safety') glassKey = 'safety';
        
        if (this.GLASS_RATES && this.GLASS_RATES[glassKey] !== undefined) {
          const glassRate = isNaN(this.GLASS_RATES[glassKey]) ? 0 : Number(this.GLASS_RATES[glassKey]);
          addOnsPerSqft += glassRate;
        }
      }
      
      // Grill add-on (per sqft) - Fresh Implementation
      if (hasGrill && this.GRILL_RATE) {
        const grillRate = isNaN(this.GRILL_RATE) ? 0 : Number(this.GRILL_RATE);
        console.log('💰 Adding grill rate:', grillRate, 'per sqft, Area:', areaSqft);
        addOnsPerSqft += grillRate;
      } else if (hasGrill) {
        console.warn('⚠️ Grill selected but GRILL_RATE not set');
      }
      
      // Mesh add-on (per sqft)
      if (hasMesh && this.MESH_RATE) {
        const meshRate = isNaN(this.MESH_RATE) ? 0 : Number(this.MESH_RATE);
        addOnsPerSqft += meshRate;
      }
      
      // Lock add-ons (per window) - use global rates from config
      // Note: Hardware cost already includes lock, so we only add if user explicitly selects multipoint
      // and glass doesn't already trigger multipoint hardware
      let lockAdditionPerWindow = 0;
      if (lockOption === 'multi' && this.LOCK_RATES && this.LOCK_RATES.multiPoint) {
        // Only add if glass didn't already trigger multipoint hardware
        if (!(glassOption === '10mm' || glassOption === '12mm' || glassOption === 'dgu' || glassOption === 'laminated' || glassOption === 'safety')) {
          // User selected multipoint but glass doesn't require it, so add the lock rate
          lockAdditionPerWindow = this.LOCK_RATES.multiPoint;
        }
      }
      
      // Calculate per window cost
      const addOnsCost = addOnsPerSqft * areaSqft;
      const perWindowCost = baseCostPerWindow + addOnsCost + lockAdditionPerWindow;
      
      // Total cost for all windows
      const subtotal = perWindowCost * numberOfWindows;
      
      // Calculate ranges (20% more and 20% less)
      const perWindowPlus20 = perWindowCost * 1.2;
      const perWindowMinus20 = perWindowCost * 0.8;
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
      const glassSelect = document.getElementById('calc-glass');
      const lockSelect = document.getElementById('calc-lock');
      const meshCheckbox = document.getElementById('calc-mesh');
      
      // Fresh grill option check
      const hasGrill = this.getGrillOption();
      
      return {
        width: widthInput?.value || '',
        height: heightInput?.value || '',
        unit: unitSelect?.options[unitSelect?.selectedIndex]?.text || '',
        numberOfWindows: numberOfWindows?.value || '1',
        glass: glassSelect?.options[glassSelect?.selectedIndex]?.text || '',
        lock: lockSelect?.options[lockSelect?.selectedIndex]?.text || '',
        grill: hasGrill ? 'Yes' : 'No',
        mesh: meshCheckbox?.checked ? 'Yes' : 'No',
        area: document.getElementById('calc-area-display')?.textContent || '0.00 sq.ft'
      };
    }
    
    sendEmail(userDetails) {
      console.log('📧 Preparing email (Extension - georgian-bar-openable)...');
      const selections = this.getCalculatorSelections();
      
      // Always get area and numberOfWindows (needed for email body and logging)
      let areaSqft = this.getArea();
      if (isNaN(areaSqft) || areaSqft <= 0) {
        console.warn('⚠️ Invalid area, using 0');
        areaSqft = 0;
      }
      
      let numberOfWindows = this.getNumberOfWindows();
      if (isNaN(numberOfWindows) || numberOfWindows <= 0) {
        console.warn('⚠️ Invalid number of windows, using 1');
        numberOfWindows = 1;
      }
      
      // Use stored amounts from calculate() method (the ones shown to user)
      // This ensures email has the exact same amounts that user sees
      let finalPerWindow = 0;
      let finalTotal = 0;
      
      if (this.lastCalculatedAmounts && this.lastCalculatedAmounts.perWindowCost > 0) {
        // Use stored amounts (actual amounts shown to user)
        finalPerWindow = Math.round(this.lastCalculatedAmounts.perWindowCost);
        finalTotal = Math.round(this.lastCalculatedAmounts.subtotal);
        console.log('✅ Using stored amounts from calculate() method:', {
          perWindow: finalPerWindow,
          total: finalTotal,
          areaSqft,
          numberOfWindows
        });
      } else {
        // Fallback: Calculate if stored amounts not available
        console.warn('⚠️ Stored amounts not available, calculating...');
        
        const glassOption = this.getGlassOption();
        const lockOption = this.getLockOption();
        const hasGrill = this.getGrillOption();
        const hasMesh = this.getMeshOption();
        
        // Validate rates
        const baseRate = isNaN(this.BASE_RATE_PER_SQFT) ? 0 : this.BASE_RATE_PER_SQFT;
        const baseHardware = isNaN(this.BASE_HARDWARE_COST) ? 0 : this.BASE_HARDWARE_COST;
        const multipointHardware = isNaN(this.MULTIPOINT_HARDWARE_COST) ? 0 : this.MULTIPOINT_HARDWARE_COST;
        
        // Determine hardware cost based on glass selection
        // IMPORTANT: Heavy glass (10mm, 12mm, DGU, Laminated, Safety) requires stronger hardware
        // So hardware cost automatically changes from BASE (650) to MULTIPOINT (1400) per window
        let hardwareCostPerWindow = baseHardware;
        if (glassOption === '10mm' || glassOption === '12mm' || glassOption === 'dgu' || glassOption === 'laminated' || glassOption === 'safety') {
          // Heavy glass selected - upgrade hardware cost to 1400 per window
          hardwareCostPerWindow = multipointHardware;
        }
        
        // If user explicitly selects multipoint lock, also upgrade hardware cost
        if (lockOption === 'multi' && this.LOCK_RATES && this.LOCK_RATES.multiPoint) {
          hardwareCostPerWindow = multipointHardware;
        }
        
        // Calculate amounts with validation
        const baseCostPerWindow = (baseRate * areaSqft) + hardwareCostPerWindow;
        
        let addOnsPerSqft = 0;
        
        // Glass add-ons (use global rates from config)
        if (glassOption !== '6mm') {
          let glassKey = glassOption;
          // Map glass options to config keys
          if (glassOption === '8mm') glassKey = '8mm';
          else if (glassOption === '10mm') glassKey = '10mm';
          else if (glassOption === '12mm') glassKey = '12mm';
          else if (glassOption === 'dgu') glassKey = 'dgu';
          else if (glassOption === 'laminated') glassKey = 'laminated';
          else if (glassOption === 'safety') glassKey = 'safety';
          
          if (this.GLASS_RATES[glassKey]) {
            addOnsPerSqft += this.GLASS_RATES[glassKey];
          }
        }
        
        // Grill add-on (per sqft) - Fresh Implementation
        if (hasGrill && this.GRILL_RATE) {
          const grillRate = isNaN(this.GRILL_RATE) ? 0 : this.GRILL_RATE;
          console.log('💰 Adding grill rate:', grillRate, 'per sqft, Area:', areaSqft);
          addOnsPerSqft += grillRate;
        } else if (hasGrill) {
          console.warn('⚠️ Grill selected but GRILL_RATE not set');
        }
        
        // Mesh add-on (per sqft)
        if (hasMesh && this.MESH_RATE) {
          const meshRate = isNaN(this.MESH_RATE) ? 0 : this.MESH_RATE;
          addOnsPerSqft += meshRate;
        }
        
        // Lock add-ons (per window) - use global rates from config
        // Note: Hardware cost already includes lock, so we only add if user explicitly selects multipoint
        // and glass doesn't already trigger multipoint hardware
        let lockAdditionPerWindowEmail = 0;
        if (lockOption === 'multi' && this.LOCK_RATES && this.LOCK_RATES.multiPoint) {
          // Only add if glass didn't already trigger multipoint hardware
          if (!(glassOption === '10mm' || glassOption === '12mm' || glassOption === 'dgu' || glassOption === 'laminated' || glassOption === 'safety')) {
            // User selected multipoint but glass doesn't require it, so add the lock rate
            const lockRate = isNaN(this.LOCK_RATES.multiPoint) ? 0 : this.LOCK_RATES.multiPoint;
            lockAdditionPerWindowEmail = lockRate;
          }
        }
        
        // Validate all values before calculation
        const validAreaSqft = isNaN(areaSqft) || areaSqft <= 0 ? 0 : areaSqft;
        const validNumberOfWindows = isNaN(numberOfWindows) || numberOfWindows <= 0 ? 1 : numberOfWindows;
        const validBaseCostPerWindow = isNaN(baseCostPerWindow) ? 0 : baseCostPerWindow;
        const validAddOnsPerSqft = isNaN(addOnsPerSqft) ? 0 : addOnsPerSqft;
        const validLockAddition = isNaN(lockAdditionPerWindowEmail) ? 0 : lockAdditionPerWindowEmail;
        
        const addOnsCost = validAddOnsPerSqft * validAreaSqft;
        const perWindowCost = validBaseCostPerWindow + addOnsCost + validLockAddition;
        const totalCost = perWindowCost * validNumberOfWindows;
        
        // Validate final amounts
        finalPerWindow = isNaN(perWindowCost) || perWindowCost <= 0 ? 0 : Math.round(perWindowCost);
        finalTotal = isNaN(totalCost) || totalCost <= 0 ? 0 : Math.round(totalCost);
      }
      
      console.log('💰 Extension email amounts calculated (georgian-bar-openable):', {
        areaSqft: validAreaSqft,
        numberOfWindows: validNumberOfWindows,
        baseRate: baseRate,
        baseHardware: baseHardware,
        multipointHardware: multipointHardware,
        hardwareCostPerWindow: hardwareCostPerWindow,
        baseCostPerWindow: validBaseCostPerWindow,
        addOnsPerSqft: validAddOnsPerSqft,
        addOnsCost: addOnsCost,
        lockAddition: validLockAddition,
        perWindowCost: finalPerWindow,
        totalCost: finalTotal
      });
      
      // Check if amounts are 0 and warn
      if (finalPerWindow === 0 || finalTotal === 0) {
        console.error('❌ ERROR: Calculated amounts are 0!', {
          areaSqft: validAreaSqft,
          baseRate,
          baseHardware,
          hardwareCostPerWindow,
          addOnsPerSqft: validAddOnsPerSqft
        });
      }
      
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
- Glass Type: ${selections.glass}
- Lock Type: ${selections.lock}
- Inside Aluminium 12mm Grills: ${selections.grill}
- Inside Openable Mesh: ${selections.mesh}

Calculated Amount:
- Per Window: ₹${finalPerWindow.toLocaleString('en-IN')}
- Total Cost: ₹${finalTotal.toLocaleString('en-IN')}

---
Generated from Live Price Calculator
      `.trim();
      
      this.submitEmailForm(emailBody, userDetails, selections, {
        perWindow: finalPerWindow,
        total: finalTotal
      });
    }
    
    submitEmailForm(emailBody, userDetails, selections, amounts) {
      // Prevent duplicate submissions
      if (this.isSubmittingEmail && this._emailSubmitted) {
        console.log('⚠️ Email already submitted, skipping duplicate');
        return;
      }
      
      // Validate amounts
      const validPerWindow = isNaN(amounts.perWindow) || amounts.perWindow <= 0 ? 0 : Math.round(amounts.perWindow);
      const validTotal = isNaN(amounts.total) || amounts.total <= 0 ? 0 : Math.round(amounts.total);
      
      console.log('📧 Submitting email via Cloudflare Worker / Web3Forms...', {
        perWindow: validPerWindow,
        total: validTotal
      });
      
      // Mark as submitted
      this._emailSubmitted = true;
      
      if (window.EmailSubmitter) {
        window.EmailSubmitter.submit({
          subject: `New Quote Request - ${this.config.name || this.productId}`,
          message: emailBody,
          userDetails: userDetails,
          onSuccess: () => this.showSuccessMessage(),
          onError: () => this.showSuccessMessage()
        });
      } else {
        console.warn('⚠️ EmailSubmitter not loaded');
        this.showSuccessMessage();
      }
    }
    
    submitEmailViaFormSubmitFallback(emailBody, userDetails, selections, amounts) {
      console.log('📧 Using fallback form submission method...');
      
      // Validate amounts
      const validPerWindow = isNaN(amounts.perWindow) || amounts.perWindow <= 0 ? 0 : Math.round(amounts.perWindow);
      const validTotal = isNaN(amounts.total) || amounts.total <= 0 ? 0 : Math.round(amounts.total);
      
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://formsubmit.co/info@woodenmax.com';
      form.style.display = 'none';
      
      const fields = {
        '_subject': `New Quote Request - ${this.config.name || this.productId}`,
        '_template': 'box',
        '_captcha': 'false',
        '_next': window.location.href,
        'message': emailBody,
        // Table format - Only basic user details (as requested)
        'Name': userDetails.name,
        'City': userDetails.city,
        'Mobile': userDetails.mobile
      };
      
      // Add email only if provided
      if (userDetails.email) {
        fields['Email'] = userDetails.email;
      }
      
      // All other details are in message format only (not in table)
      
      if (userDetails.email) {
        fields['Email'] = userDetails.email;
      }
      
      Object.keys(fields).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
      });
      
      const iframe = document.createElement('iframe');
      iframe.name = 'hidden-iframe-' + Date.now();
      iframe.style.display = 'none';
      form.target = iframe.name;
      
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      
      iframe.onload = () => {
        console.log('📧 Form submission iframe loaded - email should be sent');
        setTimeout(() => {
          this.showSuccessMessage();
          document.body.removeChild(form);
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 2000);
      };
      
      form.submit();
      
      setTimeout(() => {
        this.showSuccessMessage();
        setTimeout(() => {
          if (form.parentNode) document.body.removeChild(form);
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 3000);
      }, 3000);
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
    createExtensionInitCalculator('georgian-bar-openable', PriceCalculatorGeorgianBarOpenable, 'georgian-bar-openable');
  } else {
    // Fallback if helper not loaded
    const originalInitCalculator = window.initCalculator;
    window.initCalculator = async function(productId, containerId = null) {
      if (productId === 'georgian-bar-openable') {
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
          const calculator = new PriceCalculatorGeorgianBarOpenable(productId, productData, calcContainerId);
          window[`calculator_${productId}`] = calculator;
          return calculator;
        } catch (error) {
          console.error(`Error initializing georgian-bar-openable calculator:`, error);
          return null;
        }
      } else if (originalInitCalculator) {
        return originalInitCalculator(productId, containerId);
      }
      return null;
    };
  }
  
  // Export
  window.PriceCalculatorGeorgianBarOpenable = PriceCalculatorGeorgianBarOpenable;
}

