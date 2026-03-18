/**
 * Calculator Loader
 * Lazy loads and initializes calculators
 * Marketplace-ready architecture
 */

/**
 * Initialize calculator for a product
 * @param {string} productId - Product ID
 * @param {string} containerId - Optional container ID (default: price-calculator-{productId})
 */
// Only create initCalculator if it doesn't already exist (glass-railing.js may have set it)
if (typeof window.initCalculator === 'undefined') {
  window.initCalculator = async function(productId, containerId = null) {
  // Prevent duplicate initialization
  const instanceKey = `calculator_${productId}`;
  if (window[instanceKey]) {
    return window[instanceKey];
  }
  
  try {
    // Check if base class is loaded
    if (typeof PriceCalculatorBase === 'undefined') {
      await loadScript('/js/calculator/base.js');
    }
    
    // Check if ProductManager is loaded
    if (typeof productManager === 'undefined') {
      await loadScript('/js/calculator/configs.js');
    }
    
    // Get product config
    const productData = await productManager.getProduct(productId);
    
    if (!productData) {
      return null;
    }
    
    // Get container ID
    const calcContainerId = containerId || `price-calculator-${productId}`;
    const container = document.getElementById(calcContainerId);
    
    if (!container) {
      return null;
    }
    
    // Check if this is a glass railing product - skip base initialization
    if (productId === 'glass-railing-balcony' || productId === 'glass-railing-staircase') {
      return null; // Let glass-railing.js handle it
    }
    
    // Create calculator instance
    const calculator = new PriceCalculatorBase(productId, productData, calcContainerId);
    
    // Store instance globally for access
    window[instanceKey] = calculator;
    return calculator;
  } catch (error) {
    return null;
  }
  };
}

/**
 * Load script dynamically
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// Track initialized calculators to prevent duplicates
const initializedCalculators = new Set();

/**
 * Auto-initialize calculators on page load
 * Looks for elements with data-product attribute
 */
function autoInitCalculators() {
  const calculatorContainers = document.querySelectorAll('[data-product]');
  
  calculatorContainers.forEach(container => {
    const productId = container.getAttribute('data-product');
    const containerId = container.id || `price-calculator-${productId}`;
    
    if (productId && !initializedCalculators.has(containerId)) {
      initializedCalculators.add(containerId);
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        initCalculator(productId, containerId);
      }, 100);
    }
  });
}

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(autoInitCalculators, 200);
  });
} else {
  setTimeout(autoInitCalculators, 200);
}

// Also try after a delay in case elements load later
setTimeout(autoInitCalculators, 500);
setTimeout(autoInitCalculators, 1000);

// Export functions - but don't override if glass railing extension has already set it
if (typeof window !== 'undefined') {
  // Check if glass railing extension has already overridden initCalculator
  const currentInitCalc = window.initCalculator;
  const isGlassRailingFunction = currentInitCalc && (
    currentInitCalc.toString().includes('glass-railing-balcony') ||
    currentInitCalc.toString().includes('glassRailingInitCalculator') ||
    currentInitCalc.name === 'glassRailingInitCalculator'
  );
  
  if (isGlassRailingFunction) {
    /* Glass railing extension already set initCalculator */
  } else {
    window.initCalculator = initCalculator;
  }
  window.autoInitCalculators = autoInitCalculators;
}

