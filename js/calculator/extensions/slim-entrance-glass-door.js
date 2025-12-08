/**
 * Extension for Luxury Slim Entrance Glass Door (40mm Super Luxury Slim Series)
 * Extends PriceCalculatorBase with special hardware cost logic based on glass selection
 */

if (typeof PriceCalculatorBase !== 'undefined') {
  // Create extended class for slim-entrance-glass-door
  class PriceCalculatorSlimEntranceGlassDoor extends PriceCalculatorBase {
    constructor(productId, productConfig, containerId) {
      super(productId, productConfig, containerId);
      
      // Hardware costs from config
      this.BASE_HARDWARE_COST = productConfig.rates.hardwareCost || 1800;
      this.MULTIPOINT_HARDWARE_COST = productConfig.rates.hardwareCostMultiPoint || 2200;
      
      // Security mesh rate
      this.MESH_RATE = productConfig.rates.mesh?.security || 280;
      
      // Max height validation (10 feet)
      this.MAX_HEIGHT_FT = productConfig.maxHeight || 10;
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
      console.log('🔧 Setting up Slim Entrance Glass Door extension event listeners...');
      
      // Add glass option listener
      const glassSelect = document.getElementById('calc-glass');
      if (glassSelect) {
        glassSelect.addEventListener('change', () => this.calculate());
        console.log('✅ Glass select listener added');
      }
      
      // Add coating option listener
      const coatingSelect = document.getElementById('calc-coating');
      if (coatingSelect) {
        coatingSelect.addEventListener('change', () => this.calculate());
        console.log('✅ Coating select listener added');
      }
      
      // Add mesh checkbox listener
      this.setupMeshCheckbox();
      
      // Add height validation
      const heightInput = document.getElementById('calc-height');
      if (heightInput) {
        heightInput.addEventListener('input', () => this.validateHeight());
        heightInput.addEventListener('change', () => {
          this.validateHeight();
          this.calculate();
        });
      }
    }
    
    setupMeshCheckbox() {
      const meshCheckbox = document.getElementById('calc-mesh');
      if (!meshCheckbox) {
        console.warn('⚠️ Mesh checkbox not found');
        return;
      }
      
      console.log('✅ Mesh checkbox found, adding listeners, Rate:', this.MESH_RATE);
      
      // Remove existing listeners by cloning
      const newCheckbox = meshCheckbox.cloneNode(true);
      meshCheckbox.parentNode.replaceChild(newCheckbox, meshCheckbox);
      
      // Add change event
      newCheckbox.addEventListener('change', () => {
        console.log('🔄 Mesh checkbox changed:', newCheckbox.checked);
        this.calculate();
      });
      
      // Add click event (for label clicks)
      newCheckbox.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      // Also listen to label clicks
      const meshLabel = newCheckbox.closest('label') || document.querySelector('label[for="calc-mesh"]');
      if (meshLabel) {
        meshLabel.addEventListener('click', (e) => {
          setTimeout(() => {
            console.log('🔄 Mesh label clicked, checked:', newCheckbox.checked);
            this.calculate();
          }, 10);
        });
      }
    }
    
    validateHeight() {
      const heightInput = document.getElementById('calc-height');
      const unitSelect = document.getElementById('calc-unit');
      
      if (!heightInput || !unitSelect) return;
      
      const height = parseFloat(heightInput.value);
      const unit = unitSelect.value;
      
      if (isNaN(height) || height <= 0) return;
      
      // Convert to feet for validation
      let heightInFeet = height;
      if (unit === 'mm') heightInFeet = height * 0.00328084;
      else if (unit === 'cm') heightInFeet = height * 0.0328084;
      else if (unit === 'inch') heightInFeet = height / 12;
      else if (unit === 'm') heightInFeet = height * 3.28084;
      
      if (heightInFeet > this.MAX_HEIGHT_FT) {
        const errorMsg = `Maximum height is ${this.MAX_HEIGHT_FT} feet. Please reduce the height.`;
        alert(errorMsg);
        heightInput.value = '';
        this.calculate();
      }
    }
    
    getMeshOption() {
      const meshCheckbox = document.getElementById('calc-mesh');
      return meshCheckbox ? meshCheckbox.checked : false;
    }
    
    getCoatingOption() {
      const coatingSelect = document.getElementById('calc-coating');
      return coatingSelect ? coatingSelect.value : 'texture';
    }
    
    calculate() {
      // Get inputs
      const widthInput = document.getElementById('calc-width');
      const heightInput = document.getElementById('calc-height');
      const unitSelect = document.getElementById('calc-unit');
      const numberOfWindowsInput = document.getElementById('calc-windows');
      const glassSelect = document.getElementById('calc-glass');
      const coatingSelect = document.getElementById('calc-coating');
      const lockSelect = document.getElementById('calc-lock');
      
      if (!widthInput || !heightInput || !unitSelect || !numberOfWindowsInput || !glassSelect || !coatingSelect || !lockSelect) {
        this.displayResults(0, 0, 0, 0, 0, 0, 0);
        return;
      }
      
      const width = parseFloat(widthInput.value);
      const height = parseFloat(heightInput.value);
      const unit = unitSelect.value;
      const numberOfWindows = parseInt(numberOfWindowsInput.value) || 1;
      const glassOption = glassSelect.value;
      const coatingOption = coatingSelect.value;
      const lockOption = lockSelect.value;
      const hasMesh = this.getMeshOption();
      
      // Validate inputs
      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        this.displayResults(0, 0, 0, 0, 0, 0, 0);
        return;
      }
      
      // Validate height (max 10 feet)
      let heightInFeet = height;
      if (unit === 'mm') heightInFeet = height * 0.00328084;
      else if (unit === 'cm') heightInFeet = height * 0.0328084;
      else if (unit === 'inch') heightInFeet = height / 12;
      else if (unit === 'm') heightInFeet = height * 3.28084;
      
      if (heightInFeet > this.MAX_HEIGHT_FT) {
        this.displayResults(0, 0, 0, 0, 0, 0, 0);
        return;
      }
      
      // Convert to sqft
      const areaSqft = (width * height) * (this.unitConversions[unit] || 1);
      
      // Base rate per sqft
      const baseRate = isNaN(this.BASE_RATE_PER_SQFT) ? 0 : Number(this.BASE_RATE_PER_SQFT);
      
      // Determine hardware cost based on glass selection
      // IMPORTANT: Heavy glass (12mm, DGU, Safety) requires stronger hardware
      // So hardware cost automatically changes from BASE (1800) to MULTIPOINT (2200) per window
      let hardwareCostPerWindow = isNaN(this.BASE_HARDWARE_COST) ? 0 : Number(this.BASE_HARDWARE_COST);
      if (glassOption === '12mm' || glassOption === 'dgu' || glassOption === 'safety') {
        // Heavy glass selected - upgrade hardware cost to 2200 per window
        hardwareCostPerWindow = isNaN(this.MULTIPOINT_HARDWARE_COST) ? 0 : Number(this.MULTIPOINT_HARDWARE_COST);
      }
      
      // If user explicitly selects multipoint lock, also upgrade hardware cost
      if (lockOption === 'multi' && this.LOCK_RATES && this.LOCK_RATES.multiPoint) {
        hardwareCostPerWindow = isNaN(this.MULTIPOINT_HARDWARE_COST) ? 0 : Number(this.MULTIPOINT_HARDWARE_COST);
      }
      
      // Base cost per window (base rate * area + hardware cost)
      const baseCostPerWindow = (baseRate * areaSqft) + hardwareCostPerWindow;
      
      // Add-ons (per sqft)
      let addOnsPerSqft = 0;
      
      // Glass add-ons (8mm is base, so only add for upgrades)
      if (glassOption !== '8mm' && this.GLASS_RATES && this.GLASS_RATES[glassOption]) {
        const glassRate = isNaN(this.GLASS_RATES[glassOption]) ? 0 : Number(this.GLASS_RATES[glassOption]);
        addOnsPerSqft += glassRate;
      }
      
      // Coating add-ons (wooden coating per sqft)
      if (coatingOption === 'wooden' && this.COATING_RATES && this.COATING_RATES.wooden) {
        const coatingRate = isNaN(this.COATING_RATES.wooden) ? 0 : Number(this.COATING_RATES.wooden);
        addOnsPerSqft += coatingRate;
      }
      
      // Security mesh add-on (per sqft)
      if (hasMesh && this.MESH_RATE) {
        const meshRate = isNaN(this.MESH_RATE) ? 0 : Number(this.MESH_RATE);
        addOnsPerSqft += meshRate;
      }
      
      // Lock add-ons (per window)
      let lockAdditionPerWindow = 0;
      if (lockOption === 'multi' && this.LOCK_RATES && this.LOCK_RATES.multiPoint) {
        // Only add if glass didn't already trigger multipoint hardware
        if (!(glassOption === '12mm' || glassOption === 'dgu' || glassOption === 'safety')) {
          const lockRate = isNaN(this.LOCK_RATES.multiPoint) ? 0 : Number(this.LOCK_RATES.multiPoint);
          lockAdditionPerWindow = lockRate;
        }
      } else if (lockOption === 'mortice' && this.LOCK_RATES && this.LOCK_RATES.mortice) {
        const lockRate = isNaN(this.LOCK_RATES.mortice) ? 0 : Number(this.LOCK_RATES.mortice);
        lockAdditionPerWindow = lockRate;
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
      const coatingSelect = document.getElementById('calc-coating');
      const colorSelect = document.getElementById('calc-color');
      const lockSelect = document.getElementById('calc-lock');
      const meshCheckbox = document.getElementById('calc-mesh');
      
      return {
        width: widthInput?.value || '',
        height: heightInput?.value || '',
        unit: unitSelect?.options[unitSelect?.selectedIndex]?.text || '',
        numberOfWindows: numberOfWindows?.value || '1',
        glass: glassSelect?.options[glassSelect?.selectedIndex]?.text || '',
        coating: coatingSelect?.options[coatingSelect?.selectedIndex]?.text || '',
        color: colorSelect?.options[colorSelect?.selectedIndex]?.text || '',
        lock: lockSelect?.options[lockSelect?.selectedIndex]?.text || '',
        mesh: meshCheckbox?.checked ? 'Yes' : 'No',
        area: document.getElementById('calc-area-display')?.textContent || '0.00 sq.ft'
      };
    }
    
    sendEmail(userDetails) {
      console.log('📧 Preparing email (Extension - slim-entrance-glass-door)...');
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
      let finalPerWindow = 0;
      let finalTotal = 0;
      
      if (this.lastCalculatedAmounts && this.lastCalculatedAmounts.perWindowCost > 0) {
        finalPerWindow = Math.round(this.lastCalculatedAmounts.perWindowCost);
        finalTotal = Math.round(this.lastCalculatedAmounts.subtotal);
        console.log('✅ Using stored amounts from calculate() method:', {
          perWindow: finalPerWindow,
          total: finalTotal,
          areaSqft,
          numberOfWindows
        });
      } else {
        console.warn('⚠️ Stored amounts not available, calculating...');
        
        const glassOption = this.getGlassOption();
        const coatingOption = this.getCoatingOption();
        const lockOption = this.getLockOption();
        const hasMesh = this.getMeshOption();
        
        const baseRate = isNaN(this.BASE_RATE_PER_SQFT) ? 0 : this.BASE_RATE_PER_SQFT;
        const baseHardware = isNaN(this.BASE_HARDWARE_COST) ? 0 : this.BASE_HARDWARE_COST;
        const multipointHardware = isNaN(this.MULTIPOINT_HARDWARE_COST) ? 0 : this.MULTIPOINT_HARDWARE_COST;
        
        // Determine hardware cost based on glass selection
        let hardwareCostPerWindow = baseHardware;
        if (glassOption === '12mm' || glassOption === 'dgu' || glassOption === 'safety') {
          hardwareCostPerWindow = multipointHardware;
        }
        
        if (lockOption === 'multi' && this.LOCK_RATES && this.LOCK_RATES.multiPoint) {
          hardwareCostPerWindow = multipointHardware;
        }
        
        const baseCostPerWindow = (baseRate * areaSqft) + hardwareCostPerWindow;
        
        let addOnsPerSqft = 0;
        
        // Glass add-ons
        if (glassOption !== '8mm' && this.GLASS_RATES && this.GLASS_RATES[glassOption]) {
          addOnsPerSqft += this.GLASS_RATES[glassOption];
        }
        
        // Coating add-ons (wooden coating)
        if (coatingOption === 'wooden' && this.COATING_RATES && this.COATING_RATES.wooden) {
          const coatingRate = isNaN(this.COATING_RATES.wooden) ? 0 : this.COATING_RATES.wooden;
          addOnsPerSqft += coatingRate;
        }
        
        // Security mesh add-on
        if (hasMesh && this.MESH_RATE) {
          const meshRate = isNaN(this.MESH_RATE) ? 0 : this.MESH_RATE;
          addOnsPerSqft += meshRate;
        }
        
        let lockAdditionPerWindowEmail = 0;
        if (lockOption === 'multi' && this.LOCK_RATES && this.LOCK_RATES.multiPoint) {
          if (!(glassOption === '12mm' || glassOption === 'dgu' || glassOption === 'safety')) {
            const lockRate = isNaN(this.LOCK_RATES.multiPoint) ? 0 : this.LOCK_RATES.multiPoint;
            lockAdditionPerWindowEmail = lockRate;
          }
        } else if (lockOption === 'mortice' && this.LOCK_RATES && this.LOCK_RATES.mortice) {
          const lockRate = isNaN(this.LOCK_RATES.mortice) ? 0 : this.LOCK_RATES.mortice;
          lockAdditionPerWindowEmail = lockRate;
        }
        
        const validAreaSqft = isNaN(areaSqft) || areaSqft <= 0 ? 0 : areaSqft;
        const validNumberOfWindows = isNaN(numberOfWindows) || numberOfWindows <= 0 ? 1 : numberOfWindows;
        const validBaseCostPerWindow = isNaN(baseCostPerWindow) ? 0 : baseCostPerWindow;
        const validAddOnsPerSqft = isNaN(addOnsPerSqft) ? 0 : addOnsPerSqft;
        const validLockAddition = isNaN(lockAdditionPerWindowEmail) ? 0 : lockAdditionPerWindowEmail;
        
        const addOnsCost = validAddOnsPerSqft * validAreaSqft;
        const perWindowCost = validBaseCostPerWindow + addOnsCost + validLockAddition;
        const totalCost = perWindowCost * validNumberOfWindows;
        
        finalPerWindow = isNaN(perWindowCost) || perWindowCost <= 0 ? 0 : Math.round(perWindowCost);
        finalTotal = isNaN(totalCost) || totalCost <= 0 ? 0 : Math.round(totalCost);
      }
      
      console.log('💰 Extension email amounts calculated (slim-entrance-glass-door):', {
        areaSqft,
        numberOfWindows,
        perWindowCost: finalPerWindow,
        totalCost: finalTotal
      });
      
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
Number of Doors: ${selections.numberOfWindows}

Selected Options:
- Glass Type: ${selections.glass}
- Coating Type: ${selections.coating}
- Color: ${selections.color}
- Lock Type: ${selections.lock}
- Security Mesh: ${selections.mesh}

Calculated Amount:
- Per Door: ₹${finalPerWindow.toLocaleString('en-IN')}
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
      
      console.log('📧 Submitting email via FormSubmit.co...', {
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
          onSuccess: () => {
            this.showSuccessMessage();
            this.isSubmittingEmail = false;
          },
          onError: () => {
            this.showSuccessMessage();
            this.isSubmittingEmail = false;
          }
        });
      } else {
        this.showSuccessMessage();
        this.isSubmittingEmail = false;
      }
    }
    
    submitEmailViaFormSubmitFallback(emailBody, userDetails, selections, amounts) {
      // Legacy method - now uses EmailSubmitter
      this.submitEmailForm(emailBody, userDetails, selections, amounts);
    }
    
    _submitEmailViaFormSubmitFallbackOld(emailBody, userDetails, selections, amounts) {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://formsubmit.co/info@woodenmax.com';
      form.target = '_blank';
      form.style.display = 'none';
      
      const iframe = document.createElement('iframe');
      iframe.name = 'hidden_iframe';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      form.target = 'hidden_iframe';
      
      const fields = {
        '_subject': `New Quote Request - ${this.config.name || this.productId}`,
        '_template': 'box',
        '_captcha': 'false',
        'message': emailBody,
        'Name': userDetails.name,
        'City': userDetails.city,
        'Mobile': userDetails.mobile
      };
      
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
      
      document.body.appendChild(form);
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
    createExtensionInitCalculator('slim-entrance-glass-door', PriceCalculatorSlimEntranceGlassDoor, 'slim-entrance-glass-door');
  } else {
    // Fallback if helper not loaded
    const originalInitCalculator = window.initCalculator;
    window.initCalculator = async function(productId, containerId = null) {
      if (productId === 'slim-entrance-glass-door') {
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
          const calculator = new PriceCalculatorSlimEntranceGlassDoor(productId, productData, calcContainerId);
          window[`calculator_${productId}`] = calculator;
          return calculator;
        } catch (error) {
          console.error(`Error initializing slim-entrance-glass-door calculator:`, error);
          return null;
        }
      } else if (originalInitCalculator) {
        return originalInitCalculator(productId, containerId);
      }
      return null;
    };
  }
  
  // Export
  window.PriceCalculatorSlimEntranceGlassDoor = PriceCalculatorSlimEntranceGlassDoor;
}

