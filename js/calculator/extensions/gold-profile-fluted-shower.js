/**
 * Slim Gold Profile Fluted Shower Glass Calculator
 * 
 * Features:
 * - Gold or Rose Gold PVD Coated Profile
 * - Fluted (Reeded) Textured Glass
 * - Glass Colors: Clear, Grey, Black, Brown
 * - Door Type: Openable (Hinged) or Sliding
 * - Soft-close hardware included
 */

class GoldProfileFlutedCalculator {
  constructor(productId, productConfig, containerId) {
    this.productId = productId;
    this.config = productConfig;
    this.containerId = containerId || `price-calculator-${productId}`;
    
    // Rates
    this.BASE_RATE = 850;
    this.FLUTED_EXTRA = 100; // Per sqft extra for fluted glass
    this.HARDWARE_PER_DOOR = 7500;
    this.ROSE_GOLD_EXTRA = 50; // Extra per sqft for rose gold profile
    
    // User details
    this.userDetailsSubmitted = false;
    this.userDetails = null;
    this.isSubmittingEmail = false;
    
    // Store calculated amounts
    this.lastCalculatedAmounts = {
      glassCost: 0,
      hardwareCost: 0,
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
    const profileFinish = document.getElementById('calc-profile-finish');
    const glassType = document.getElementById('calc-glass-type');
    const glassColor = document.getElementById('calc-glass-color');
    const doorType = document.getElementById('calc-door-type');
    const doorCount = document.getElementById('calc-door-count');
    
    // Add event listeners
    if (leftWidth) leftWidth.addEventListener('input', () => this.calculate());
    if (rightWidth) rightWidth.addEventListener('input', () => this.calculate());
    if (height) height.addEventListener('input', () => this.calculate());
    if (unit) unit.addEventListener('change', () => this.calculate());
    if (quantity) quantity.addEventListener('input', () => this.calculate());
    if (showerType) showerType.addEventListener('change', () => this.updateShowerTypeUI());
    if (profileFinish) profileFinish.addEventListener('change', () => this.calculate());
    if (glassType) glassType.addEventListener('change', () => this.calculate());
    if (glassColor) glassColor.addEventListener('change', () => this.calculate());
    if (doorType) doorType.addEventListener('change', () => this.calculate());
    if (doorCount) doorCount.addEventListener('change', () => this.calculate());
    
    this.setupFormSubmission();
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
      const rightWidth = document.getElementById('calc-right-width');
      if (rightWidth) rightWidth.value = '';
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
    const profileFinishSelect = document.getElementById('calc-profile-finish');
    const glassTypeSelect = document.getElementById('calc-glass-type');
    const glassColorSelect = document.getElementById('calc-glass-color');
    const doorTypeSelect = document.getElementById('calc-door-type');
    const doorCountSelect = document.getElementById('calc-door-count');
    
    const unit = unitSelect?.value || 'ft';
    const leftWidth = this.convertToFeet(parseFloat(leftWidthInput?.value) || 0, unit);
    const rightWidth = this.convertToFeet(parseFloat(rightWidthInput?.value) || 0, unit);
    const height = this.convertToFeet(parseFloat(heightInput?.value) || 0, unit);
    const quantity = Math.max(1, parseInt(quantityInput?.value) || 1);
    const showerType = showerTypeSelect?.value || 'straight';
    const profileFinish = profileFinishSelect?.value || 'gold';
    const glassType = glassTypeSelect?.value || 'fluted';
    const glassColor = glassColorSelect?.value || 'clear';
    const doorType = doorTypeSelect?.value || 'sliding';
    const doorCount = parseInt(doorCountSelect?.value) || 1;
    
    return { leftWidth, rightWidth, height, unit, quantity, showerType, profileFinish, glassType, glassColor, doorType, doorCount };
  }
  
  calculate() {
    if (!document.getElementById(this.containerId)) return;
    
    const { leftWidth, rightWidth, height, quantity, showerType, profileFinish, glassType, glassColor, doorType, doorCount } = this.getInputValues();
    
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
      const profileLabel = profileFinish === 'rose-gold' ? 'Rose Gold' : 'Gold';
      const glassLabel = glassType === 'fluted' ? 'Fluted' : 'Clear';
      if (isLCorner) {
        dimensionEl.textContent = `L-Corner: ${leftWidth.toFixed(1)}' + ${rightWidth.toFixed(1)}' × ${height.toFixed(1)}' | ${profileLabel} | ${glassLabel}`;
      } else {
        dimensionEl.textContent = `Straight: ${leftWidth.toFixed(1)}' × ${height.toFixed(1)}' | ${profileLabel} | ${glassLabel}`;
      }
      if (quantity > 1) {
        dimensionEl.textContent += ` × ${quantity} units`;
      }
    }
    
    if (totalWidth <= 0 || height <= 0) {
      this.displayResults(0);
      return;
    }
    
    // Calculate glass rate
    let glassRate = this.BASE_RATE;
    if (glassType === 'fluted') {
      glassRate += this.FLUTED_EXTRA;
    }
    if (profileFinish === 'rose-gold') {
      glassRate += this.ROSE_GOLD_EXTRA;
    }
    
    // Calculate costs for one unit
    const glassCostPerUnit = areaSqft * glassRate;
    const hardwareCostPerUnit = this.HARDWARE_PER_DOOR * doorCount;
    const totalCostPerUnit = glassCostPerUnit + hardwareCostPerUnit;
    
    // Total cost with quantity
    const totalCost = totalCostPerUnit * quantity;
    
    this.lastCalculatedAmounts = {
      glassCost: glassCostPerUnit * quantity,
      hardwareCost: hardwareCostPerUnit * quantity,
      totalCost,
      area: areaSqft * quantity,
      isLCorner,
      profileFinish,
      glassType,
      glassColor,
      doorType,
      doorCount,
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
    const { leftWidth, rightWidth, height, quantity, showerType, profileFinish, glassType, glassColor, doorType, doorCount } = this.getInputValues();
    const amounts = this.lastCalculatedAmounts;
    
    const profileNames = { 'gold': 'Gold PVD', 'rose-gold': 'Rose Gold PVD' };
    const glassNames = { 'fluted': 'Fluted (Reeded)', 'clear': 'Clear' };
    const colorNames = { 'clear': 'Clear', 'grey': 'Grey', 'black': 'Black', 'brown': 'Brown' };
    const doorNames = { 'openable': 'Openable (Hinged)', 'sliding': 'Sliding' };
    
    const emailBody = `
New Quote Request - Slim Gold Profile Fluted Shower

User Details:
- Name: ${userDetails.name}
- City: ${userDetails.city}
- Mobile: ${userDetails.mobile}
${userDetails.email ? `- Email: ${userDetails.email}` : ''}

Product: Slim Gold Profile Fluted Shower Glass
Door Type: ${doorNames[doorType]}

Configuration:
- Shower Type: ${showerType === 'l-corner' ? 'L-Corner' : 'Straight'}
${showerType === 'l-corner' ? `- Left Width: ${leftWidth.toFixed(2)} ft\n- Right Width: ${rightWidth.toFixed(2)} ft` : `- Width: ${leftWidth.toFixed(2)} ft`}
- Height: ${height.toFixed(2)} ft
- Total Area: ${amounts.area.toFixed(2)} sq.ft
- Quantity: ${quantity} unit${quantity > 1 ? 's' : ''}

Specifications:
- Profile: ${profileNames[profileFinish]}
- Glass Type: ${glassNames[glassType]}
- Glass Color: ${colorNames[glassColor]}
- Number of Doors: ${doorCount}

Hardware Includes: Soft-Close Track/Hinges, Handle, Seals, Connectors

Total Package Cost: ₹${Math.round(amounts.totalCost).toLocaleString('en-IN')}

---
Generated from Gold Profile Fluted Shower Calculator
    `.trim();
    
    if (window.EmailSubmitter) {
      window.EmailSubmitter.submit({
        subject: 'New Quote - Gold Profile Fluted Shower',
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
    if (productId === 'slim-gold-profile-fluted-shower') {
      try {
        if (typeof productManager === 'undefined') return null;
        
        const productData = await productManager.getProduct(productId);
        if (!productData) return null;
        
        const calcContainerId = containerId || `price-calculator-${productId}`;
        const container = document.getElementById(calcContainerId);
        if (!container) return null;
        
        const calculator = new GoldProfileFlutedCalculator(productId, productData, calcContainerId);
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
  const initGoldProfileCalculator = async () => {
    const productId = 'slim-gold-profile-fluted-shower';
    const container = document.getElementById(`price-calculator-${productId}`);
    
    if (!container) return;
    
    if (typeof productManager === 'undefined') {
      setTimeout(initGoldProfileCalculator, 200);
      return;
    }
    
    const existingCalc = window[`calculator_${productId}`];
    if (existingCalc && existingCalc instanceof GoldProfileFlutedCalculator) return;
    
    try {
      const productData = await productManager.getProduct(productId);
      if (!productData) return;
      
      const calculator = new GoldProfileFlutedCalculator(productId, productData, `price-calculator-${productId}`);
      window[`calculator_${productId}`] = calculator;
    } catch (error) {
      // Silent fail
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initGoldProfileCalculator, 300));
  } else {
    setTimeout(initGoldProfileCalculator, 300);
  }
})();

if (typeof window !== 'undefined') {
  window.GoldProfileFlutedCalculator = GoldProfileFlutedCalculator;
}

