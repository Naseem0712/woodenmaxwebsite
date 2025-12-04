/**
 * Black Profile Shower Glass Partition Calculator
 * 
 * Features:
 * - Sliding Only (Soft-Close)
 * - Slim profiles: Regular 16x45mm, Ultra Slim 16x35mm
 * - Glass: 8mm toughened only
 * - Soft-close top track + wheels system
 * - Hardware: Towel Handle, Seals (no hinges - uses track/wheels)
 * - Colors: Matt Black, Gold (₹6500), Mill Finish (₹5500), Rose Gold (₹7500 + ₹100/sqft)
 * - Straight: Single sliding door only
 * - L-Corner: Single or Dual sliding doors
 */

class BlackProfileSlidingCalculator {
  constructor(productId, productConfig, containerId) {
    this.productId = productId;
    this.config = productConfig;
    this.containerId = containerId || `price-calculator-${productId}`;
    
    // Rates from config
    this.BASE_GLASS_RATE = productConfig.rates.baseGlassRate || 650;
    this.ROSE_GOLD_EXTRA = productConfig.rates.roseGoldExtraPerSqft || 100;
    this.HARDWARE_RATES = {
      'matt-black': 6500,
      'gold': 6500,
      'mill-finish': 5500,
      'rose-gold': 7500
    };
    this.MAX_HEIGHT = 8;
    this.STANDARD_HEIGHT = 7;
    
    // User details
    this.userDetailsSubmitted = false;
    this.userDetails = null;
    this.isSubmittingEmail = false;
    
    // Store calculated amounts
    this.lastCalculatedAmounts = {
      glassCost: 0,
      hardwareCost: 0,
      totalCost: 0,
      area: 0,
      isLCorner: false
    };
    
    this.initializeCalculator();
  }
  
  initializeCalculator() {
    const init = () => {
      setTimeout(() => {
        if (document.getElementById(this.containerId)) {
          this.setupEventListeners();
          this.updateShowerTypeUI();
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
    const leftWidth = document.getElementById('calc-left-width');
    const rightWidth = document.getElementById('calc-right-width');
    const height = document.getElementById('calc-height');
    const unit = document.getElementById('calc-unit');
    const quantity = document.getElementById('calc-quantity');
    
    // Options
    const showerType = document.getElementById('calc-shower-type');
    const profileType = document.getElementById('calc-profile-type');
    const doorCount = document.getElementById('calc-door-count');
    const hardwareFinish = document.getElementById('calc-hardware-finish');
    
    // Add event listeners
    if (leftWidth) leftWidth.addEventListener('input', () => this.calculate());
    if (rightWidth) rightWidth.addEventListener('input', () => this.calculate());
    if (height) height.addEventListener('input', () => this.validateHeight());
    if (unit) unit.addEventListener('change', () => this.calculate());
    if (quantity) quantity.addEventListener('input', () => this.calculate());
    if (showerType) showerType.addEventListener('change', () => this.updateShowerTypeUI());
    if (profileType) profileType.addEventListener('change', () => this.calculate());
    if (doorCount) doorCount.addEventListener('change', () => this.calculate());
    if (hardwareFinish) hardwareFinish.addEventListener('change', () => this.calculate());
    
    this.setupFormSubmission();
  }
  
  updateShowerTypeUI() {
    const showerType = document.getElementById('calc-shower-type');
    const rightWidthGroup = document.getElementById('right-width-group');
    const leftWidthLabel = document.getElementById('left-width-label');
    const doorCountSelect = document.getElementById('calc-door-count');
    const dualDoorOption = document.getElementById('dual-door-option');
    
    if (!showerType || !rightWidthGroup) return;
    
    const isLCorner = showerType.value === 'l-corner';
    
    if (isLCorner) {
      rightWidthGroup.style.display = 'block';
      if (leftWidthLabel) leftWidthLabel.textContent = 'Left Side Width';
      // Enable dual door option for L-corner
      if (dualDoorOption) dualDoorOption.style.display = 'block';
    } else {
      rightWidthGroup.style.display = 'none';
      if (leftWidthLabel) leftWidthLabel.textContent = 'Width';
      const rightWidth = document.getElementById('calc-right-width');
      if (rightWidth) rightWidth.value = '';
      // Force single door for straight
      if (doorCountSelect) doorCountSelect.value = '1';
      // Hide dual door option for straight
      if (dualDoorOption) dualDoorOption.style.display = 'none';
    }
    
    this.calculate();
  }
  
  validateHeight() {
    const heightInput = document.getElementById('calc-height');
    const heightWarning = document.getElementById('height-warning');
    const unit = document.getElementById('calc-unit')?.value || 'ft';
    
    if (!heightInput) return;
    
    let heightFt = this.convertToFeet(parseFloat(heightInput.value) || 0, unit);
    
    if (heightFt > this.MAX_HEIGHT) {
      if (heightWarning) {
        heightWarning.style.display = 'block';
        heightWarning.textContent = `⚠️ Maximum height is ${this.MAX_HEIGHT} feet. Contact us for custom sizes.`;
      }
    } else {
      if (heightWarning) heightWarning.style.display = 'none';
    }
    
    this.calculate();
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
    const leftWidthInput = document.getElementById('calc-left-width');
    const rightWidthInput = document.getElementById('calc-right-width');
    const heightInput = document.getElementById('calc-height');
    const unitSelect = document.getElementById('calc-unit');
    const quantityInput = document.getElementById('calc-quantity');
    const showerTypeSelect = document.getElementById('calc-shower-type');
    const profileTypeSelect = document.getElementById('calc-profile-type');
    const doorCountSelect = document.getElementById('calc-door-count');
    const hardwareFinishSelect = document.getElementById('calc-hardware-finish');
    
    const unit = unitSelect?.value || 'ft';
    const leftWidth = this.convertToFeet(parseFloat(leftWidthInput?.value) || 0, unit);
    const rightWidth = this.convertToFeet(parseFloat(rightWidthInput?.value) || 0, unit);
    const height = this.convertToFeet(parseFloat(heightInput?.value) || 0, unit);
    const quantity = Math.max(1, parseInt(quantityInput?.value) || 1);
    const showerType = showerTypeSelect?.value || 'straight';
    const profileType = profileTypeSelect?.value || 'regular-slim';
    const doorCount = parseInt(doorCountSelect?.value) || 1;
    const hardwareFinish = hardwareFinishSelect?.value || 'matt-black';
    
    return { leftWidth, rightWidth, height, unit, quantity, showerType, profileType, doorCount, hardwareFinish };
  }
  
  calculate() {
    if (!document.getElementById(this.containerId)) return;
    
    const { leftWidth, rightWidth, height, quantity, showerType, profileType, doorCount, hardwareFinish } = this.getInputValues();
    
    // Calculate total width based on shower type
    let totalWidth = leftWidth;
    let isLCorner = false;
    
    if (showerType === 'l-corner' && rightWidth > 0) {
      totalWidth = leftWidth + rightWidth;
      isLCorner = true;
    }
    
    // Calculate area for one unit
    const areaSqft = totalWidth * height;
    
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
      if (isLCorner) {
        dimensionEl.textContent = `L-Corner: ${leftWidth.toFixed(1)}' + ${rightWidth.toFixed(1)}' × ${height.toFixed(1)}' | ${profileLabel}`;
      } else {
        dimensionEl.textContent = `Straight: ${leftWidth.toFixed(1)}' × ${height.toFixed(1)}' | ${profileLabel}`;
      }
      if (quantity > 1) {
        dimensionEl.textContent += ` × ${quantity} units`;
      }
    }
    
    if (totalWidth <= 0 || height <= 0) {
      this.displayResults(0);
      return;
    }
    
    // Determine glass rate (Rose Gold has extra cost)
    let glassRate = this.BASE_GLASS_RATE;
    if (hardwareFinish === 'rose-gold') {
      glassRate += this.ROSE_GOLD_EXTRA;
    }
    
    // Calculate costs for one unit
    const glassCostPerUnit = areaSqft * glassRate;
    const hardwareCostPerUnit = this.HARDWARE_RATES[hardwareFinish] * doorCount;
    const totalCostPerUnit = glassCostPerUnit + hardwareCostPerUnit;
    
    // Total cost with quantity
    const totalCost = totalCostPerUnit * quantity;
    
    this.lastCalculatedAmounts = {
      glassCost: glassCostPerUnit * quantity,
      hardwareCost: hardwareCostPerUnit * quantity,
      totalCost,
      area: areaSqft * quantity,
      isLCorner,
      doorCount,
      profileType,
      hardwareFinish,
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
    const { leftWidth, rightWidth, height, quantity, showerType, profileType, doorCount, hardwareFinish } = this.getInputValues();
    const amounts = this.lastCalculatedAmounts;
    
    const finishNames = {
      'matt-black': 'Matt Black',
      'gold': 'Gold',
      'mill-finish': 'Mill Finish',
      'rose-gold': 'Rose Gold'
    };
    
    const profileNames = {
      'regular-slim': 'Regular Slim (16x45mm)',
      'ultra-slim': 'Ultra Slim (16x35mm)'
    };
    
    const emailBody = `
New Quote Request - Black Profile Soft-Close Sliding Shower

User Details:
- Name: ${userDetails.name}
- City: ${userDetails.city}
- Mobile: ${userDetails.mobile}
${userDetails.email ? `- Email: ${userDetails.email}` : ''}

Product: Black Profile Shower Glass Partition
Door Type: Soft-Close Sliding

Configuration:
- Shower Type: ${showerType === 'l-corner' ? 'L-Corner' : 'Straight'}
${showerType === 'l-corner' ? `- Left Width: ${leftWidth.toFixed(2)} ft\n- Right Width: ${rightWidth.toFixed(2)} ft` : `- Width: ${leftWidth.toFixed(2)} ft`}
- Height: ${height.toFixed(2)} ft
- Total Area: ${amounts.area.toFixed(2)} sq.ft
- Quantity: ${quantity} unit${quantity > 1 ? 's' : ''}

Specifications:
- Profile: ${profileNames[profileType]}
- Glass: 8mm Clear Toughened
- Hardware Finish: ${finishNames[hardwareFinish]}
- Sliding Doors: ${doorCount} door${doorCount > 1 ? 's' : ''} (Soft-Close)

Hardware Includes: Top Track, Soft-Close Wheels, Towel Handle, Seals

Total Package Cost: ₹${Math.round(amounts.totalCost).toLocaleString('en-IN')}

---
Generated from Black Profile Sliding Shower Calculator
    `.trim();
    
    const formData = new FormData();
    formData.append('_subject', 'New Quote - Black Profile Soft-Close Sliding Shower');
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
    if (productId === 'black-profile-shower-partition') {
      try {
        if (typeof productManager === 'undefined') return null;
        
        const productData = await productManager.getProduct(productId);
        if (!productData) return null;
        
        const calcContainerId = containerId || `price-calculator-${productId}`;
        const container = document.getElementById(calcContainerId);
        if (!container) return null;
        
        const calculator = new BlackProfileSlidingCalculator(productId, productData, calcContainerId);
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
  const initSlidingCalculator = async () => {
    const productId = 'black-profile-shower-partition';
    const container = document.getElementById(`price-calculator-${productId}`);
    
    if (!container) return;
    
    if (typeof productManager === 'undefined') {
      setTimeout(initSlidingCalculator, 200);
      return;
    }
    
    const existingCalc = window[`calculator_${productId}`];
    if (existingCalc && existingCalc instanceof BlackProfileSlidingCalculator) return;
    
    try {
      const productData = await productManager.getProduct(productId);
      if (!productData) return;
      
      const calculator = new BlackProfileSlidingCalculator(productId, productData, `price-calculator-${productId}`);
      window[`calculator_${productId}`] = calculator;
    } catch (error) {
      // Silent fail
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initSlidingCalculator, 300));
  } else {
    setTimeout(initSlidingCalculator, 300);
  }
})();

if (typeof window !== 'undefined') {
  window.BlackProfileSlidingCalculator = BlackProfileSlidingCalculator;
}

