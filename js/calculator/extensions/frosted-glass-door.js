/**
 * Frosted Glass Fold & Slide Door Calculator
 * 
 * Features:
 * - Fold & Slide mechanism (95% opening)
 * - 2 doors always (fold and slide system)
 * - Slim profiles: Regular 16x45mm, Ultra Slim 16x35mm
 * - Glass: 8mm Clear or 8mm Frosted (+₹25/sqft)
 * - Includes: Gasket, Track, Rollers, Handle, Seals
 * - Hardware Colors: White, Matt Black, Gold (no extra charge)
 * - Optional Lock: +₹2500 per set
 * - Uses: Bathroom, Staircase, Entrance, Public Toilet, Mall
 */

class FrostedGlassDoorCalculator {
  constructor(productId, productConfig, containerId) {
    this.productId = productId;
    this.config = productConfig;
    this.containerId = containerId || `price-calculator-${productId}`;
    
    // Rates from config
    this.BASE_RATE = productConfig.rates.baseRate || 1250;
    this.FROSTING_EXTRA = productConfig.rates.frostingExtra || 25;
    this.HARDWARE_PER_SET = productConfig.rates.hardwarePerSet || 9500;
    this.LOCK_EXTRA = productConfig.rates.lockExtra || 2500;
    
    // User details
    this.userDetailsSubmitted = false;
    this.userDetails = null;
    this.isSubmittingEmail = false;
    
    // Store calculated amounts
    this.lastCalculatedAmounts = {
      glassCost: 0,
      hardwareCost: 0,
      lockCost: 0,
      totalCost: 0,
      area: 0
    };
    
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
    const width = document.getElementById('calc-width');
    const height = document.getElementById('calc-height');
    const unit = document.getElementById('calc-unit');
    const quantity = document.getElementById('calc-quantity');
    
    // Options
    const profileType = document.getElementById('calc-profile-type');
    const glassType = document.getElementById('calc-glass-type');
    const hardwareColor = document.getElementById('calc-hardware-color');
    const lockOption = document.getElementById('calc-lock-option');
    
    // Add event listeners
    if (width) width.addEventListener('input', () => this.calculate());
    if (height) height.addEventListener('input', () => this.calculate());
    if (unit) unit.addEventListener('change', () => this.calculate());
    if (quantity) quantity.addEventListener('input', () => this.calculate());
    if (profileType) profileType.addEventListener('change', () => this.calculate());
    if (glassType) glassType.addEventListener('change', () => this.calculate());
    if (hardwareColor) hardwareColor.addEventListener('change', () => this.calculate());
    if (lockOption) lockOption.addEventListener('change', () => this.calculate());
    
    this.setupFormSubmission();
  }
  
  convertToFeet(value, unit) {
    if (!value || isNaN(value)) return 0;
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return 0;
    
    switch(unit) {
      case 'mm': return numValue / 304.8;
      case 'cm': return numValue / 30.48;
      case 'inch': return numValue / 12;
      case 'ft': return numValue;
      case 'm': return numValue * 3.28084;
      default: return numValue;
    }
  }
  
  getInputValues() {
    const widthInput = document.getElementById('calc-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    const quantityInput = document.getElementById('calc-quantity');
    const profileTypeSelect = document.getElementById('calc-profile-type');
    const glassTypeSelect = document.getElementById('calc-glass-type');
    const hardwareColorSelect = document.getElementById('calc-hardware-color');
    const lockOptionSelect = document.getElementById('calc-lock-option');
    
    const unit = unitSelect?.value || 'ft';
    const width = this.convertToFeet(parseFloat(widthInput?.value) || 0, unit);
    const height = this.convertToFeet(parseFloat(heightInput?.value) || 0, unit);
    const quantity = Math.max(1, parseInt(quantityInput?.value) || 1);
    const profileType = profileTypeSelect?.value || 'regular-slim';
    const glassType = glassTypeSelect?.value || '8mm-clear';
    const hardwareColor = hardwareColorSelect?.value || 'matt-black';
    const lockOption = lockOptionSelect?.value || 'no';
    
    return { width, height, unit, quantity, profileType, glassType, hardwareColor, lockOption };
  }
  
  calculate() {
    if (!document.getElementById(this.containerId)) return;
    
    const { width, height, quantity, profileType, glassType, hardwareColor, lockOption } = this.getInputValues();
    
    // Calculate area for one unit
    const areaSqft = width * height;
    
    // Update area display
    const areaEl = document.getElementById('calc-area-display');
    if (areaEl) {
      const totalArea = areaSqft * quantity;
      areaEl.textContent = totalArea > 0 ? totalArea.toFixed(2) + ' sq.ft' : '0.00 sq.ft';
    }
    
    // Update dimension display
    const dimensionEl = document.getElementById('calc-dimension-display');
    if (dimensionEl) {
      const profileLabel = profileType === 'ultra-slim' ? 'Ultra Slim 16x35mm' : 'Regular Slim 16x45mm';
      const glassLabel = glassType === '8mm-frosted' ? 'Frosted' : 'Clear';
      dimensionEl.textContent = `${width.toFixed(1)}' × ${height.toFixed(1)}' | ${profileLabel} | ${glassLabel} Glass`;
      if (quantity > 1) {
        dimensionEl.textContent += ` × ${quantity} units`;
      }
    }
    
    if (width <= 0 || height <= 0) {
      this.displayResults(0);
      return;
    }
    
    // Determine glass rate (Frosted has extra cost)
    let glassRate = this.BASE_RATE;
    if (glassType === '8mm-frosted') {
      glassRate += this.FROSTING_EXTRA;
    }
    
    // Calculate costs for one unit
    const glassCostPerUnit = areaSqft * glassRate;
    const hardwareCostPerUnit = this.HARDWARE_PER_SET; // 1 set per door unit
    const lockCostPerUnit = lockOption === 'yes' ? this.LOCK_EXTRA : 0;
    const totalCostPerUnit = glassCostPerUnit + hardwareCostPerUnit + lockCostPerUnit;
    
    // Total cost with quantity
    const totalCost = totalCostPerUnit * quantity;
    
    this.lastCalculatedAmounts = {
      glassCost: glassCostPerUnit * quantity,
      hardwareCost: hardwareCostPerUnit * quantity,
      lockCost: lockCostPerUnit * quantity,
      totalCost,
      area: areaSqft * quantity,
      profileType,
      glassType,
      hardwareColor,
      lockOption,
      quantity
    };
    
    this.displayResults(totalCost);
  }
  
  displayResults(totalCost) {
    const formatCurrency = (amount) => '₹' + Math.round(amount).toLocaleString('en-IN');
    const showActual = this.userDetailsSubmitted;
    
    const totalEl = document.getElementById('calc-result-total');
    if (totalEl) {
      if (showActual) {
        totalEl.textContent = formatCurrency(totalCost);
      } else {
        totalEl.textContent = totalCost > 0 ? formatCurrency(totalCost * 0.85) + ' - ' + formatCurrency(totalCost * 1.15) : '₹0';
      }
    }
  }
  
  setupFormSubmission() {
    const form = document.getElementById('calc-user-form');
    if (!form) return;
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (this.isSubmittingEmail) return false;
      
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
      
      this.submitUserDetails({ name, city, mobile, email: email || '' });
      return false;
    });
  }
  
  submitUserDetails(userDetails) {
    if (this.isSubmittingEmail) return;
    
    this.isSubmittingEmail = true;
    this.userDetailsSubmitted = true;
    this.userDetails = userDetails;
    
    this.calculate();
    this.sendEmail(userDetails);
    
    setTimeout(() => { this.isSubmittingEmail = false; }, 10000);
  }
  
  sendEmail(userDetails) {
    const { width, height, quantity, profileType, glassType, hardwareColor, lockOption } = this.getInputValues();
    const amounts = this.lastCalculatedAmounts;
    
    const colorNames = {
      'white': 'White',
      'matt-black': 'Matt Black',
      'gold': 'Gold'
    };
    
    const profileNames = {
      'regular-slim': 'Regular Slim (16x45mm)',
      'ultra-slim': 'Ultra Slim (16x35mm)'
    };
    
    const glassNames = {
      '8mm-clear': '8mm Clear Toughened',
      '8mm-frosted': '8mm Frosted Toughened'
    };
    
    const emailBody = `
New Quote Request - Frosted Glass Fold & Slide Door

User Details:
- Name: ${userDetails.name}
- City: ${userDetails.city}
- Mobile: ${userDetails.mobile}
${userDetails.email ? `- Email: ${userDetails.email}` : ''}

Product: Frosted Glass Fold & Slide Door
Door Type: Fold & Slide (2 Doors, 95% Opening)

Configuration:
- Width: ${width.toFixed(2)} ft
- Height: ${height.toFixed(2)} ft
- Total Area: ${amounts.area.toFixed(2)} sq.ft
- Quantity: ${quantity} unit${quantity > 1 ? 's' : ''}

Specifications:
- Profile: ${profileNames[profileType]}
- Glass: ${glassNames[glassType]}
- Hardware Color: ${colorNames[hardwareColor]}
- Lock Option: ${lockOption === 'yes' ? 'Yes (Included)' : 'No'}

Hardware Includes: Fold & Slide Track, Rollers, Gasket, Handle, Seals

Total Package Cost: ₹${Math.round(amounts.totalCost).toLocaleString('en-IN')}

---
Generated from Frosted Glass Door Calculator
    `.trim();
    
    const formData = new FormData();
    formData.append('_subject', 'New Quote - Frosted Glass Fold & Slide Door');
    formData.append('_template', 'box');
    formData.append('_captcha', 'false');
    formData.append('_next', window.location.href);
    formData.append('message', emailBody);
    formData.append('Name', userDetails.name);
    formData.append('City', userDetails.city);
    formData.append('Mobile', userDetails.mobile);
    if (userDetails.email) formData.append('Email', userDetails.email);
    
    fetch('https://formsubmit.co/info@woodenmax.com', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (response.ok) this.showSuccessMessage();
      else throw new Error(`HTTP ${response.status}`);
    })
    .catch(() => this.showSuccessMessage());
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

// Override initCalculator
(function() {
  const originalInitCalculator = window.initCalculator;
  
  window.initCalculator = async function(productId, containerId = null) {
    if (productId === 'frosted-glass-bathroom-door') {
      try {
        if (typeof productManager === 'undefined') return null;
        
        const productData = await productManager.getProduct(productId);
        if (!productData) return null;
        
        const calcContainerId = containerId || `price-calculator-${productId}`;
        const container = document.getElementById(calcContainerId);
        if (!container) return null;
        
        const calculator = new FrostedGlassDoorCalculator(productId, productData, calcContainerId);
        window[`calculator_${productId}`] = calculator;
        return calculator;
      } catch (error) {
        return null;
      }
    } else if (originalInitCalculator) {
      return originalInitCalculator(productId, containerId);
    }
    return null;
  };
  
  // Auto-initialize
  const initFrostedGlassCalculator = async () => {
    const productId = 'frosted-glass-bathroom-door';
    const container = document.getElementById(`price-calculator-${productId}`);
    
    if (!container) return;
    
    if (typeof productManager === 'undefined') {
      setTimeout(initFrostedGlassCalculator, 200);
      return;
    }
    
    const existingCalc = window[`calculator_${productId}`];
    if (existingCalc && existingCalc instanceof FrostedGlassDoorCalculator) return;
    
    try {
      const productData = await productManager.getProduct(productId);
      if (!productData) return;
      
      const calculator = new FrostedGlassDoorCalculator(productId, productData, `price-calculator-${productId}`);
      window[`calculator_${productId}`] = calculator;
    } catch (error) {
      // Silent fail
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initFrostedGlassCalculator, 300));
  } else {
    setTimeout(initFrostedGlassCalculator, 300);
  }
})();

if (typeof window !== 'undefined') {
  window.FrostedGlassDoorCalculator = FrostedGlassDoorCalculator;
}

