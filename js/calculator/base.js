/**
 * Base Price Calculator Class
 * Reusable calculator for all products
 * Marketplace-ready architecture
 */

/**
 * Extension Helper Utility
 * Reduces code duplication in calculator extensions
 */
function createExtensionInitCalculator(productId, CalculatorClass, className) {
  const originalInitCalculator = window.initCalculator;
  
  window.initCalculator = async function(calcProductId, containerId = null) {
    if (calcProductId === productId) {
      try {
        if (typeof PriceCalculatorBase === 'undefined' || typeof productManager === 'undefined') {
          console.error('Required dependencies not found');
          return null;
        }
        const productData = await productManager.getProduct(calcProductId);
        if (!productData) return null;
        const calcContainerId = containerId || `price-calculator-${calcProductId}`;
        const container = document.getElementById(calcContainerId);
        if (!container) return null;
        const calculator = new CalculatorClass(calcProductId, productData, calcContainerId);
        window[`calculator_${calcProductId}`] = calculator;
        console.log(`✅ Extended Calculator initialized for: ${productData.name}`);
        return calculator;
      } catch (error) {
        console.error(`Error initializing ${className} calculator:`, error);
        return null;
      }
    } else if (originalInitCalculator) {
      return originalInitCalculator(calcProductId, containerId);
    }
    return null;
  };
}

// Export helper function
if (typeof window !== 'undefined') {
  window.createExtensionInitCalculator = createExtensionInitCalculator;
}

class PriceCalculatorBase {
  constructor(productId, productConfig, containerId) {
    this.productId = productId;
    this.config = productConfig;
    this.containerId = containerId || `price-calculator-${productId}`;
    
    // Rates from config
    this.BASE_RATE_PER_SQFT = productConfig.rates.baseRate || 750;
    this.BASE_HARDWARE_COST = productConfig.rates.hardwareCost || 2200;
    this.GLASS_RATES = productConfig.rates.glass || {};
    this.COATING_RATES = productConfig.rates.coating || {};
    this.LOCK_RATES = productConfig.rates.lock || {};
    // Mesh can be number (legacy) or object (new format with standard/openable)
    this.MESH_RATE = productConfig.rates.mesh || 0;
    this.MESH_RATES = typeof productConfig.rates.mesh === 'object' ? productConfig.rates.mesh : null;
    
    // Features
    this.hasMesh = productConfig.features?.includes('mesh') || false;
    this.hasMorticeLock = productConfig.features?.includes('morticeLock') || false;
    this.hasTopFixed = productConfig.features?.includes('topFixed') || false;
    
    // User details
    this.userDetailsSubmitted = false;
    this.userDetails = null;
    this.isSubmittingEmail = false;
    
    // Store calculated amounts for email
    this.lastCalculatedAmounts = {
      perWindowCost: 0,
      subtotal: 0
    };
    
    // Unit conversions
    this.unitConversions = {
      'mm': 0.010764,
      'cm': 1.0764,
      'inch': 144,
      'ft': 1,
      'm': 10.764
    };
    
    // Initialize
    this.initializeCalculator();
  }
  
  initializeCalculator() {
    const init = () => {
      setTimeout(() => {
        if (document.getElementById(this.containerId)) {
          this.setupEventListeners();
          this.calculate();
        }
      }, 100);
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
  
  setupEventListeners() {
    // Size inputs
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    
    if (widthInput) {
      widthInput.addEventListener('input', () => {
        this.updateAreaDisplay();
        this.calculate();
      });
    }
    if (heightInput) {
      heightInput.addEventListener('input', () => {
        this.updateAreaDisplay();
        this.calculate();
      });
    }
    if (unitSelect) {
      unitSelect.addEventListener('change', () => {
        this.updateUnitHints();
        this.updateAreaDisplay();
        this.calculate();
      });
    }
    
    // Number of windows/doors
    const windowsInput = document.getElementById('calc-windows');
    if (windowsInput) windowsInput.addEventListener('input', () => this.calculate());
    
    // Options
    const glassSelect = document.getElementById('calc-glass');
    const coatingSelect = document.getElementById('calc-coating');
    const lockSelect = document.getElementById('calc-lock');
    
    if (glassSelect) glassSelect.addEventListener('change', () => this.calculate());
    if (coatingSelect) coatingSelect.addEventListener('change', () => this.calculate());
    if (lockSelect) lockSelect.addEventListener('change', () => this.calculate());
    
    // Mesh checkbox (if available)
    const meshCheckbox = document.getElementById('calc-mesh');
    if (meshCheckbox) meshCheckbox.addEventListener('change', () => this.calculate());
    
    // Top fixed checkbox (if available)
    const topFixedCheckbox = document.getElementById('calc-top-fixed');
    if (topFixedCheckbox) topFixedCheckbox.addEventListener('change', () => this.calculate());
    
    // Form submission
    this.setupFormSubmission();
  }
  
  updateUnitHints() {
    const unitSelect = document.getElementById('calc-unit');
    const widthHint = document.getElementById('calc-width-hint');
    const heightHint = document.getElementById('calc-height-hint');
    
    if (!unitSelect) return;
    
    const showHints = unitSelect.value === 'ft-in';
    
    if (widthHint) widthHint.style.display = showHints ? 'block' : 'none';
    if (heightHint) heightHint.style.display = showHints ? 'block' : 'none';
  }
  
  convertLengthToFeet(value, unit) {
    if (!value || isNaN(value)) return 0;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return 0;
    
    if (!unit) return numValue;
    
    switch(unit) {
      case 'mm': return numValue / 304.8;
      case 'cm': return numValue / 30.48;
      case 'inch': return numValue / 12;
      case 'ft': return numValue;
      case 'm': return numValue * 3.28084;
      case 'ft-in': return numValue;
      default: return numValue;
    }
  }
  
  parseFeetInches(input) {
    if (!input) return 0;
    const str = input.toString().trim();
    
    const match = str.match(/(\d+)[\s']*(\d+)?/);
    if (match) {
      const feet = parseFloat(match[1]) || 0;
      const inches = parseFloat(match[2]) || 0;
      return feet + (inches / 12);
    }
    
    const decimal = parseFloat(str);
    return isNaN(decimal) ? 0 : decimal;
  }
  
  getArea() {
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    
    if (!widthInput || !heightInput || !unitSelect) return 0;
    
    const unit = unitSelect.value || 'ft';
    let width, height;
    
    try {
      if (unit === 'ft-in') {
        width = this.parseFeetInches(widthInput.value);
        height = this.parseFeetInches(heightInput.value);
      } else {
        width = parseFloat(widthInput.value) || 0;
        height = parseFloat(heightInput.value) || 0;
        width = this.convertLengthToFeet(width, unit);
        height = this.convertLengthToFeet(height, unit);
      }
      
      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        return 0;
      }
      
      return width * height;
    } catch (error) {
      console.error('Error calculating area:', error);
      return 0;
    }
  }
  
  updateAreaDisplay() {
    const areaSqft = this.getArea();
    const areaEl = document.getElementById('calc-area-display');
    if (areaEl) {
      areaEl.textContent = areaSqft > 0 ? areaSqft.toFixed(2) + ' sq.ft' : '0.00 sq.ft';
    }
  }
  
  getNumberOfWindows() {
    const input = document.getElementById('calc-windows');
    return Math.max(1, parseInt(input?.value) || 1);
  }
  
  getGlassOption() {
    const select = document.getElementById('calc-glass');
    return select?.value || '6mm';
  }
  
  getCoatingOption() {
    const select = document.getElementById('calc-coating');
    return select?.value || 'texture';
  }
  
  getLockOption() {
    const select = document.getElementById('calc-lock');
    return select?.value || 'single';
  }
  
  getMeshOption() {
    if (!this.hasMesh) return false;
    const checkbox = document.getElementById('calc-mesh');
    return checkbox?.checked || false;
  }
  
  getTopFixedOption() {
    if (!this.hasTopFixed) return false;
    const checkbox = document.getElementById('calc-top-fixed');
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
    const coatingOption = this.getCoatingOption();
    const lockOption = this.getLockOption();
    const hasMesh = this.getMeshOption();
    const hasTopFixed = this.getTopFixedOption();
    
    if (areaSqft <= 0) {
      this.displayResults(0, 0, 0, 0, 0, 0, 0);
      return;
    }
    
    // Base cost per window
    const baseCostPerWindow = (this.BASE_RATE_PER_SQFT * areaSqft) + this.BASE_HARDWARE_COST;
    
    // Add-ons (per sqft)
    let addOnsPerSqft = 0;
    
    // Glass add-ons (use global rates from config)
    if (glassOption !== '6mm') {
      let glassKey = glassOption;
      // Map glass options to config keys
      if (glassOption === '8mm') glassKey = '8mm';
      else if (glassOption === '10mm') glassKey = '10mm';
      else if (glassOption === '12mm') glassKey = '12mm';
      else if (glassOption === 'dgu' || glassOption === 'dgu-20mm') glassKey = 'dgu';
      else if (glassOption === 'laminated') glassKey = 'laminated';
      else if (glassOption === 'safety' || glassOption === 'safety-13.52mm') glassKey = 'safety';
      
      if (this.GLASS_RATES[glassKey]) {
        addOnsPerSqft += this.GLASS_RATES[glassKey];
      }
    }
    
    // Coating add-ons (use global rates from config)
    if (coatingOption === 'wooden' && this.COATING_RATES.wooden) {
      addOnsPerSqft += this.COATING_RATES.wooden;
    }
    
    // Mesh add-on (use global rates from config)
    // Handle both numeric (legacy) and object (new) formats
    // Standard mesh (120 per sqft) is only for sliding windows
    if (hasMesh) {
      if (typeof this.MESH_RATE === 'number' && this.MESH_RATE > 0) {
        addOnsPerSqft += this.MESH_RATE;
      } else if (this.MESH_RATES && typeof this.MESH_RATES === 'object') {
        // Use standard mesh for sliding windows (120 per sqft)
        if (this.MESH_RATES.standard) {
          addOnsPerSqft += this.MESH_RATES.standard;
        }
      } else if (this.config.rates.mesh && typeof this.config.rates.mesh === 'object') {
        // Fallback to config rates
        if (this.config.rates.mesh.standard) {
          addOnsPerSqft += this.config.rates.mesh.standard;
        }
      }
    }
    
    // Lock add-ons (per window) - use global rates from config
    let lockAdditionPerWindow = 0;
    if (lockOption === 'multi' && this.LOCK_RATES.multiPoint) {
      lockAdditionPerWindow = this.LOCK_RATES.multiPoint;
    } else if (lockOption === 'mortice' && this.LOCK_RATES.mortice) {
      lockAdditionPerWindow = this.LOCK_RATES.mortice;
    }
    
    // Calculate per window cost
    const addOnsCost = addOnsPerSqft * areaSqft;
    const perWindowCost = baseCostPerWindow + addOnsCost + lockAdditionPerWindow;
    
    // Total cost
    const subtotal = perWindowCost * numberOfWindows;
    
    // Calculate ranges
    const perWindowPlus20 = perWindowCost * 1.2;
    const perWindowMinus20 = perWindowCost * 0.8;
    const totalPlus20 = subtotal * 1.2;
    const totalMinus20 = subtotal * 0.8;
    
    // Display results
    this.displayResults(perWindowCost, perWindowPlus20, perWindowMinus20, subtotal, totalPlus20, totalMinus20, areaSqft);
  }
  
  displayResults(perWindowCost, perWindowPlus20, perWindowMinus20, subtotal, totalPlus20, totalMinus20, areaSqft = 0) {
    const formatCurrency = (amount) => {
      return '₹' + Math.round(amount).toLocaleString('en-IN');
    };
    
    // Store actual amounts for email (the ones shown to user)
    this.lastCalculatedAmounts = {
      perWindowCost: perWindowCost,
      subtotal: subtotal
    };
    
    const showActualAmounts = this.userDetailsSubmitted || false;
    
    try {
      const areaEl = document.getElementById('calc-area-display');
      if (areaEl) {
        areaEl.textContent = areaSqft > 0 ? areaSqft.toFixed(2) + ' sq.ft' : '0.00 sq.ft';
      }
      
      if (showActualAmounts) {
        // Show actual amounts
        const perWindowEl = document.getElementById('calc-result-per-window');
        const perWindowLabel = document.getElementById('calc-label-per-window');
        if (perWindowEl) {
          perWindowEl.textContent = formatCurrency(perWindowCost);
          perWindowEl.parentElement.style.display = 'flex';
        }
        if (perWindowLabel) {
          perWindowLabel.textContent = 'Per Window Cost:';
        }
        
        const totalEl = document.getElementById('calc-result-total');
        const totalLabel = document.getElementById('calc-label-total');
        if (totalEl) {
          totalEl.textContent = formatCurrency(subtotal);
          totalEl.parentElement.style.display = 'flex';
        }
        if (totalLabel) {
          totalLabel.textContent = 'Total Cost (All Windows):';
        }
        
        // Hide range displays
        ['calc-result-per-window-plus20', 'calc-result-per-window-minus20', 
         'calc-result-total-plus20', 'calc-result-total-minus20'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.parentElement.style.display = 'none';
        });
      } else {
        // Show range
        const perWindowEl = document.getElementById('calc-result-per-window');
        if (perWindowEl) {
          perWindowEl.textContent = formatCurrency(perWindowMinus20) + ' - ' + formatCurrency(perWindowPlus20);
          perWindowEl.parentElement.style.display = 'flex';
        }
        
        const totalEl = document.getElementById('calc-result-total');
        if (totalEl) {
          totalEl.textContent = formatCurrency(totalMinus20) + ' - ' + formatCurrency(totalPlus20);
          totalEl.parentElement.style.display = 'flex';
        }
        
        // Hide individual rows
        ['calc-result-per-window-plus20', 'calc-result-per-window-minus20', 
         'calc-result-total-plus20', 'calc-result-total-minus20'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.parentElement.style.display = 'none';
        });
      }
    } catch (error) {
      console.error('Error displaying results:', error);
    }
  }
  
  setupFormSubmission() {
    const form = document.getElementById('calc-user-form');
    const submitBtn = form?.querySelector('button[type="submit"]');
    
    if (!form || !submitBtn) return;
    
    // Remove any existing listeners to prevent duplicates
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent multiple submissions
      if (this.isSubmittingEmail) {
        console.log('⚠️ Email already being sent, please wait...');
        return false;
      }
      
      const name = newForm.querySelector('#calc-user-name')?.value?.trim();
      const city = newForm.querySelector('#calc-user-city')?.value?.trim();
      const mobile = newForm.querySelector('#calc-user-mobile')?.value?.trim();
      const email = newForm.querySelector('#calc-user-email')?.value?.trim();
      
      if (!name || !city || !mobile) {
        alert('Please fill in Name, City, and Mobile Number');
        return false;
      }
      
      if (mobile.length < 10) {
        alert('Please enter a valid mobile number');
        return false;
      }
      
      const userDetails = { name, city, mobile, email: email || '' };
      this.submitUserDetails(userDetails);
      
      return false;
    });
  }
  
  submitUserDetails(userDetails) {
    // Prevent duplicate submissions
    if (this.isSubmittingEmail) {
      console.log('⚠️ Email already being sent, please wait...');
      return;
    }
    
    // Set flag immediately to prevent multiple calls
    this.isSubmittingEmail = true;
    this.userDetailsSubmitted = true;
    this.userDetails = userDetails;
    
    // Recalculate to get latest prices
    this.calculate();
    
    console.log('📧 Sending email with user details:', userDetails);
    
    // Send email
    try {
      this.sendEmail(userDetails);
    } catch (error) {
      console.error('❌ Error in sendEmail:', error);
      this.isSubmittingEmail = false;
    }
    
    // Reset flag after 10 seconds (longer timeout for reliability)
    setTimeout(() => {
      this.isSubmittingEmail = false;
      console.log('✅ Email submission flag reset');
    }, 10000);
  }
  
  getCalculatorSelections() {
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    const numberOfWindows = document.getElementById('calc-windows');
    const glassSelect = document.getElementById('calc-glass');
    const coatingSelect = document.getElementById('calc-coating');
    const lockSelect = document.getElementById('calc-lock');
    const meshCheckbox = document.getElementById('calc-mesh');
    const topFixedCheckbox = document.getElementById('calc-top-fixed');
    
    return {
      width: widthInput?.value || '',
      height: heightInput?.value || '',
      unit: unitSelect?.options[unitSelect?.selectedIndex]?.text || '',
      numberOfWindows: numberOfWindows?.value || '1',
      glass: glassSelect?.options[glassSelect?.selectedIndex]?.text || '',
      coating: coatingSelect?.options[coatingSelect?.selectedIndex]?.text || '',
      lock: lockSelect?.options[lockSelect?.selectedIndex]?.text || '',
      mesh: meshCheckbox?.checked ? 'Yes' : 'No',
      topFixed: topFixedCheckbox?.checked ? 'Yes' : 'No',
      area: document.getElementById('calc-area-display')?.textContent || '0.00 sq.ft'
    };
  }
  
  sendEmail(userDetails) {
    console.log('📧 Preparing email (Base class)...');
    const selections = this.getCalculatorSelections();
    
    // Always get area and numberOfWindows (needed for email body and logging)
    let areaSqft = this.getArea();
    if (isNaN(areaSqft) || areaSqft <= 0) {
      console.warn('⚠️ Invalid area in sendEmail, using 0');
      areaSqft = 0;
    }
    
    let numberOfWindows = this.getNumberOfWindows();
    if (isNaN(numberOfWindows) || numberOfWindows <= 0) {
      console.warn('⚠️ Invalid number of windows in sendEmail, using 1');
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
      
      // Validate rates
      const baseRate = isNaN(this.BASE_RATE_PER_SQFT) ? 0 : Number(this.BASE_RATE_PER_SQFT);
      const baseHardware = isNaN(this.BASE_HARDWARE_COST) ? 0 : Number(this.BASE_HARDWARE_COST);
      
      // Calculate amounts with validation
      const baseCostPerWindow = (baseRate * areaSqft) + baseHardware;
      let addOnsPerSqft = 0;
      const glassOption = this.getGlassOption();
      const coatingOption = this.getCoatingOption();
      const lockOption = this.getLockOption();
      const hasMesh = this.getMeshOption();
      
      // Glass
      if (glassOption !== '6mm' && this.GLASS_RATES) {
        let glassKey = glassOption;
        // Map glass options to config keys
        if (glassOption === '8mm') glassKey = '8mm';
        else if (glassOption === '10mm') glassKey = '10mm';
        else if (glassOption === '12mm') glassKey = '12mm';
        else if (glassOption === 'dgu' || glassOption === 'dgu-20mm') glassKey = 'dgu';
        else if (glassOption === 'laminated') glassKey = 'laminated';
        else if (glassOption === 'safety' || glassOption === 'safety-13.52mm') glassKey = 'safety';
        
        if (this.GLASS_RATES[glassKey] !== undefined) {
          const glassRate = isNaN(this.GLASS_RATES[glassKey]) ? 0 : Number(this.GLASS_RATES[glassKey]);
          addOnsPerSqft += glassRate;
        }
      }
      
      // Coating
      if (coatingOption === 'wooden' && this.COATING_RATES && this.COATING_RATES.wooden) {
        const coatingRate = isNaN(this.COATING_RATES.wooden) ? 0 : Number(this.COATING_RATES.wooden);
        addOnsPerSqft += coatingRate;
      }
      
      // Mesh
      if (hasMesh && this.MESH_RATE) {
        const meshRate = isNaN(this.MESH_RATE) ? 0 : Number(this.MESH_RATE);
        addOnsPerSqft += meshRate;
      }
      
      // Lock
      let lockAdditionPerWindow = 0;
      if (lockOption === 'multi' && this.LOCK_RATES && this.LOCK_RATES.multiPoint) {
        lockAdditionPerWindow = isNaN(this.LOCK_RATES.multiPoint) ? 0 : Number(this.LOCK_RATES.multiPoint);
      } else if (lockOption === 'mortice' && this.LOCK_RATES && this.LOCK_RATES.mortice) {
        lockAdditionPerWindow = isNaN(this.LOCK_RATES.mortice) ? 0 : Number(this.LOCK_RATES.mortice);
      }
      
      const addOnsCost = addOnsPerSqft * areaSqft;
      const perWindowCost = baseCostPerWindow + addOnsCost + lockAdditionPerWindow;
      const totalCost = perWindowCost * numberOfWindows;
      
      // Validate final amounts
      finalPerWindow = isNaN(perWindowCost) || perWindowCost <= 0 ? 0 : Math.round(perWindowCost);
      finalTotal = isNaN(totalCost) || totalCost <= 0 ? 0 : Math.round(totalCost);
    }
    
    // Log amounts (conditional based on whether stored amounts were used)
    if (this.lastCalculatedAmounts && this.lastCalculatedAmounts.perWindowCost > 0) {
      console.log('💰 Base email amounts (using stored):', {
        areaSqft,
        numberOfWindows,
        perWindowCost: finalPerWindow,
        totalCost: finalTotal
      });
    } else {
      console.log('💰 Base email amounts calculated:', {
        areaSqft,
        numberOfWindows,
        baseRate,
        baseHardware,
        baseCostPerWindow,
        addOnsPerSqft,
        addOnsCost,
        lockAdditionPerWindow,
        perWindowCost: finalPerWindow,
        totalCost: finalTotal
      });
    }
    
    // Check if amounts are 0 and warn
    if (finalPerWindow === 0 || finalTotal === 0) {
      console.error('❌ ERROR: Base class calculated amounts are 0!', {
        areaSqft,
        numberOfWindows,
        'BASE_RATE_PER_SQFT': this.BASE_RATE_PER_SQFT,
        'BASE_HARDWARE_COST': this.BASE_HARDWARE_COST,
        'GLASS_RATES': this.GLASS_RATES,
        'LOCK_RATES': this.LOCK_RATES,
        'lastCalculatedAmounts': this.lastCalculatedAmounts
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
- Coating: ${selections.coating}
- Lock: ${selections.lock}
${this.hasMesh ? `- Mesh: ${selections.mesh}` : ''}
${this.hasTopFixed ? `- Top Fixed: ${selections.topFixed}` : ''}

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
    console.log('📧 Submitting email via Cloudflare Worker / Web3Forms...');
    
    // Validate amounts before creating form data
    const validPerWindow = isNaN(amounts.perWindow) || amounts.perWindow <= 0 ? 0 : Math.round(amounts.perWindow);
    const validTotal = isNaN(amounts.total) || amounts.total <= 0 ? 0 : Math.round(amounts.total);
    
    console.log('💰 Base email amounts:', { perWindow: validPerWindow, total: validTotal });
    
    // Use shared email submitter utility
    if (window.EmailSubmitter) {
      window.EmailSubmitter.submit({
        subject: `New Quote Request - ${this.config.name || this.productId}`,
        message: emailBody,
        userDetails: userDetails,
        onSuccess: () => this.showSuccessMessage(),
        onError: (error) => {
          console.error('❌ Email submission error:', error);
          this.showSuccessMessage(); // Show success anyway
        }
      });
    } else {
      // Fallback if utility not loaded
      console.warn('⚠️ EmailSubmitter utility not loaded, using direct method');
      this.submitEmailDirect(emailBody, userDetails);
    }
  }
  
  submitEmailDirect(emailBody, userDetails) {
    // Direct submission method (fallback)
    const workerEndpoint = window.EMAIL_WORKER_URL || 'https://woodenmax.in/api/submit';
    const web3formsAccessKey = window.WEB3FORMS_ACCESS_KEY;
    
    if (web3formsAccessKey && !web3formsAccessKey.includes('YOUR_')) {
      const emailData = {
        access_key: web3formsAccessKey,
        subject: `New Quote Request - ${this.config.name || this.productId}`,
        from_name: userDetails.name || 'WoodenMax Website',
        from_email: userDetails.email || 'noreply@woodenmax.in',
        to_email: 'info@woodenmax.com',
        message: emailBody,
      };
      
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('✅ Email sent via Web3Forms');
          this.showSuccessMessage();
        } else {
          throw new Error(data.message || 'Failed to send email');
        }
      })
      .catch(error => {
        console.error('❌ Error:', error);
        this.showSuccessMessage();
      });
    } else {
      this.showSuccessMessage(); // Show success anyway
    }
  }
  
  // Legacy fallback method - kept for compatibility but not used anymore
  submitEmailViaFormSubmitFallback(emailBody, userDetails, selections, amounts) {
    // This method is deprecated - using Web3Forms/Worker instead
    console.log('📧 Fallback method called - using Web3Forms...');
    const web3formsAccessKey = window.WEB3FORMS_ACCESS_KEY || 'YOUR_WEB3FORMS_ACCESS_KEY';
    if (web3formsAccessKey && !web3formsAccessKey.includes('YOUR_')) {
      this.submitViaWeb3Forms(emailBody, userDetails, selections, amounts, web3formsAccessKey);
    } else {
      this.showSuccessMessage(); // Show success anyway
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

// Export for use
if (typeof window !== 'undefined') {
  window.PriceCalculatorBase = PriceCalculatorBase;
}

