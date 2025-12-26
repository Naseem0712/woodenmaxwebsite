/**
 * Frameless Shower Glass Door Calculator
 * 
 * Features:
 * - Hinged and Sliding door types
 * - L-corner and straight shower configurations
 * - Hardware selection based on door type
 * - Quantity support
 * - Dual sliding only for L-corner
 */

class FramelessShowerCalculator {
  constructor(productId, productConfig, containerId) {
    this.productId = productId;
    this.config = productConfig;
    this.containerId = containerId || `price-calculator-${productId}`;
    
    // Rates from config
    this.MAX_HEIGHT = productConfig.rates.maxHeight || 8;
    this.STANDARD_HEIGHT = productConfig.rates.standardHeight || 7;
    
    // Hinged rates
    this.HINGED_GLASS_RATE = productConfig.rates.hinged?.glassRate || 350;
    this.HINGED_HARDWARE = productConfig.rates.hinged?.hardware || {
      'mill-finish': 4500,
      'black': 5500,
      'gold': 5500,
      'rose-gold': 7500
    };
    
    // Sliding rates
    this.SLIDING_GLASS_RATE = productConfig.rates.sliding?.glassRate || 450;
    this.SLIDING_HARDWARE = productConfig.rates.sliding?.hardware || {
      'mill-finish': 5500,
      'black': 6500,
      'gold': 6500
    };
    
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
          this.updateDoorTypeUI();
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
    const doorType = document.getElementById('calc-door-type');
    const showerType = document.getElementById('calc-shower-type');
    const doorCount = document.getElementById('calc-door-count');
    const hardwareFinish = document.getElementById('calc-hardware-finish');
    
    // Add event listeners
    if (leftWidth) leftWidth.addEventListener('input', () => this.calculate());
    if (rightWidth) rightWidth.addEventListener('input', () => this.calculate());
    if (height) height.addEventListener('input', () => this.validateHeight());
    if (unit) unit.addEventListener('change', () => this.calculate());
    if (quantity) quantity.addEventListener('input', () => this.calculate());
    if (doorType) doorType.addEventListener('change', () => this.updateDoorTypeUI());
    if (showerType) showerType.addEventListener('change', () => this.updateShowerTypeUI());
    if (doorCount) doorCount.addEventListener('change', () => this.calculate());
    if (hardwareFinish) hardwareFinish.addEventListener('change', () => this.calculate());
    
    this.setupFormSubmission();
  }
  
  updateDoorTypeUI() {
    const doorType = document.getElementById('calc-door-type');
    const hardwareFinishSelect = document.getElementById('calc-hardware-finish');
    const showerType = document.getElementById('calc-shower-type');
    
    if (!doorType || !hardwareFinishSelect) return;
    
    const isSliding = doorType.value === 'sliding';
    
    // Update hardware finish options based on door type
    if (isSliding) {
      // Sliding: Mill Finish, Matt Black, Gold only
      hardwareFinishSelect.innerHTML = `
        <option value="mill-finish">Mill Finish (Chrome)</option>
        <option value="black">Matt Black</option>
        <option value="gold">Gold</option>
      `;
    } else {
      // Hinged: Mill Finish, Black, Gold, Rose Gold
      hardwareFinishSelect.innerHTML = `
        <option value="mill-finish">Mill Finish (Chrome)</option>
        <option value="black">Black</option>
        <option value="gold">Gold</option>
        <option value="rose-gold">Rose Gold</option>
      `;
    }
    
    // Update door count options based on door type and shower type
    this.updateDoorCountOptions();
    this.calculate();
  }
  
  updateShowerTypeUI() {
    const showerType = document.getElementById('calc-shower-type');
    const rightWidthGroup = document.getElementById('right-width-group');
    const leftWidthLabel = document.getElementById('left-width-label');
    
    if (!showerType || !rightWidthGroup) return;
    
    const isLCorner = showerType.value === 'l-corner';
    
    if (isLCorner) {
      rightWidthGroup.style.display = 'block';
      if (leftWidthLabel) leftWidthLabel.textContent = 'Left Side Width';
    } else {
      rightWidthGroup.style.display = 'none';
      if (leftWidthLabel) leftWidthLabel.textContent = 'Width';
      // Clear right width when switching to straight
      const rightWidth = document.getElementById('calc-right-width');
      if (rightWidth) rightWidth.value = '';
    }
    
    // Update door count options
    this.updateDoorCountOptions();
    this.calculate();
  }
  
  updateDoorCountOptions() {
    const doorType = document.getElementById('calc-door-type');
    const showerType = document.getElementById('calc-shower-type');
    const doorCountSelect = document.getElementById('calc-door-count');
    
    if (!doorType || !showerType || !doorCountSelect) return;
    
    const isSliding = doorType.value === 'sliding';
    const isLCorner = showerType.value === 'l-corner';
    
    if (isSliding) {
      if (isLCorner) {
        // L-corner sliding: Single or Dual door options
        doorCountSelect.innerHTML = `
          <option value="1">Single Sliding Door</option>
          <option value="2">Dual Sliding Doors</option>
        `;
      } else {
        // Straight sliding: Only single door
        doorCountSelect.innerHTML = `
          <option value="1">Single Sliding Door</option>
        `;
      }
    } else {
      // Hinged: 1 or 2 doors
      doorCountSelect.innerHTML = `
        <option value="1">1 Door</option>
        <option value="2">2 Doors</option>
      `;
    }
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
        heightWarning.textContent = `⚠️ Maximum height is ${this.MAX_HEIGHT} feet. Please contact us for custom sizes.`;
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
    const doorTypeSelect = document.getElementById('calc-door-type');
    const showerTypeSelect = document.getElementById('calc-shower-type');
    const doorCountSelect = document.getElementById('calc-door-count');
    const hardwareFinishSelect = document.getElementById('calc-hardware-finish');
    
    const unit = unitSelect?.value || 'ft';
    const leftWidth = this.convertToFeet(parseFloat(leftWidthInput?.value) || 0, unit);
    const rightWidth = this.convertToFeet(parseFloat(rightWidthInput?.value) || 0, unit);
    const height = this.convertToFeet(parseFloat(heightInput?.value) || 0, unit);
    const quantity = Math.max(1, parseInt(quantityInput?.value) || 1);
    const doorType = doorTypeSelect?.value || 'hinged';
    const showerType = showerTypeSelect?.value || 'straight';
    const doorCount = parseInt(doorCountSelect?.value) || 1;
    const hardwareFinish = hardwareFinishSelect?.value || 'mill-finish';
    
    return { leftWidth, rightWidth, height, unit, quantity, doorType, showerType, doorCount, hardwareFinish };
  }
  
  calculate() {
    if (!document.getElementById(this.containerId)) return;
    
    const { leftWidth, rightWidth, height, quantity, doorType, showerType, doorCount, hardwareFinish } = this.getInputValues();
    
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
      const typeLabel = doorType === 'sliding' ? 'Sliding' : 'Hinged';
      if (isLCorner) {
        dimensionEl.textContent = `${typeLabel} L-Corner: ${leftWidth.toFixed(1)}' + ${rightWidth.toFixed(1)}' × ${height.toFixed(1)}'`;
      } else {
        dimensionEl.textContent = `${typeLabel} Straight: ${leftWidth.toFixed(1)}' × ${height.toFixed(1)}'`;
      }
      if (quantity > 1) {
        dimensionEl.textContent += ` × ${quantity} units`;
      }
    }
    
    if (totalWidth <= 0 || height <= 0) {
      this.displayResults(0);
      return;
    }
    
    // Get rates based on door type
    const glassRate = doorType === 'sliding' ? this.SLIDING_GLASS_RATE : this.HINGED_GLASS_RATE;
    const hardwareRates = doorType === 'sliding' ? this.SLIDING_HARDWARE : this.HINGED_HARDWARE;
    const hardwareRate = hardwareRates[hardwareFinish] || hardwareRates['mill-finish'];
    
    // Calculate costs for one unit
    const glassCostPerUnit = areaSqft * glassRate;
    const hardwareCostPerUnit = hardwareRate * doorCount;
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
      doorType,
      hardwareFinish,
      quantity
    };
    
    this.displayResults(totalCost);
  }
  
  displayResults(totalCost) {
    const formatCurrency = (amount) => '₹' + Math.round(amount).toLocaleString('en-IN');
    const showActual = this.userDetailsSubmitted;
    
    // Only show total package cost (no breakdown)
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
    const { leftWidth, rightWidth, height, quantity, doorType, showerType, doorCount, hardwareFinish } = this.getInputValues();
    const amounts = this.lastCalculatedAmounts;
    
    const finishNames = {
      'mill-finish': 'Mill Finish (Chrome)',
      'black': doorType === 'sliding' ? 'Matt Black' : 'Black',
      'gold': 'Gold',
      'rose-gold': 'Rose Gold'
    };
    
    const emailBody = `
New Quote Request - Frameless Shower Glass Door

User Details:
- Name: ${userDetails.name}
- City: ${userDetails.city}
- Mobile: ${userDetails.mobile}
${userDetails.email ? `- Email: ${userDetails.email}` : ''}

Product: Frameless Shower Glass Door
Glass: 10mm Clear Toughened
Door Type: ${doorType === 'sliding' ? 'Sliding' : 'Hinged'}

Configuration:
- Shower Type: ${showerType === 'l-corner' ? 'L-Corner' : 'Straight'}
${showerType === 'l-corner' ? `- Left Width: ${leftWidth.toFixed(2)} ft\n- Right Width: ${rightWidth.toFixed(2)} ft` : `- Width: ${leftWidth.toFixed(2)} ft`}
- Height: ${height.toFixed(2)} ft
- Total Area: ${amounts.area.toFixed(2)} sq.ft
- Quantity: ${quantity} unit${quantity > 1 ? 's' : ''}

Hardware Selection:
- Finish: ${finishNames[hardwareFinish]}
- Door Configuration: ${doorCount} ${doorType === 'sliding' ? 'sliding' : ''} door${doorCount > 1 ? 's' : ''}

Total Package Cost: ₹${Math.round(amounts.totalCost).toLocaleString('en-IN')}

---
Generated from Frameless Shower Calculator
    `.trim();
    
    if (window.EmailSubmitter) {
      window.EmailSubmitter.submit({
        subject: `New Quote - Frameless Shower (${doorType === 'sliding' ? 'Sliding' : 'Hinged'})`,
        message: emailBody,
        userDetails: userDetails,
        onSuccess: () => this.showSuccessMessage(),
        onError: () => this.showSuccessMessage()
      });
    } else {
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

// Override initCalculator
(function() {
  const originalInitCalculator = window.initCalculator;
  
  window.initCalculator = async function(productId, containerId = null) {
    if (productId === 'frameless-shower-partition') {
      try {
        if (typeof productManager === 'undefined') return null;
        
        const productData = await productManager.getProduct(productId);
        if (!productData) return null;
        
        const calcContainerId = containerId || `price-calculator-${productId}`;
        const container = document.getElementById(calcContainerId);
        if (!container) return null;
        
        const calculator = new FramelessShowerCalculator(productId, productData, calcContainerId);
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
  const initShowerCalculator = async () => {
    const productId = 'frameless-shower-partition';
    const container = document.getElementById(`price-calculator-${productId}`);
    
    if (!container) return;
    
    if (typeof productManager === 'undefined') {
      setTimeout(initShowerCalculator, 200);
      return;
    }
    
    const existingCalc = window[`calculator_${productId}`];
    if (existingCalc && existingCalc instanceof FramelessShowerCalculator) return;
    
    try {
      const productData = await productManager.getProduct(productId);
      if (!productData) return;
      
      const calculator = new FramelessShowerCalculator(productId, productData, `price-calculator-${productId}`);
      window[`calculator_${productId}`] = calculator;
    } catch (error) {
      // Silent fail
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initShowerCalculator, 300));
  } else {
    setTimeout(initShowerCalculator, 300);
  }
})();

if (typeof window !== 'undefined') {
  window.FramelessShowerCalculator = FramelessShowerCalculator;
}
