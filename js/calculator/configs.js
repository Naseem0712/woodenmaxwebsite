/**
 * Product Configuration Manager
 * Loads product data from JSON (current) or API (future)
 * Marketplace-ready architecture
 */

class ProductManager {
  constructor() {
    this.products = null;
    this.cache = new Map();
    this.dataSource = 'json'; // 'json' or 'api'
    this.apiBaseUrl = '/api'; // Future API base URL
    this.lastLoadError = null;
  }
  
  /**
   * Load all products
   * Current: From JSON file
   * Future: From API endpoint
   */
  async loadProducts() {
    if (this.products) {
      return this.products;
    }
    
    try {
      if (this.dataSource === 'json') {
        // Current: Load from JSON file
        // Calculate relative path from current page to data/products.json
        // All product pages are in products/*/ subdirectories (2 levels deep from root)
        // data/ lives at the site root; no depth arithmetic needed.
        const jsonPath = '/data/products.json';
        
        // file:// cannot verify the authoritative JSON source.
        if (window.location.protocol === 'file:') {
          throw new Error('authoritative-pricing-data-unavailable');
        }
        
        const response = await fetch(jsonPath);
        if (!response.ok) {
          throw new Error('authoritative-pricing-data-unavailable');
        }
        const data = await response.json();
        if (!data || !Array.isArray(data.products)) throw new Error('authoritative-pricing-data-unavailable');
        this.products = data.products;
        this.globalRates = data.globalRates || {};
        return this.products;
      } else {
        // Future: Load from API
        const response = await fetch(`${this.apiBaseUrl}/products`);
        if (!response.ok) {
          throw new Error(`Failed to load products: ${response.status}`);
        }
        const data = await response.json();
        this.products = data.products || data || [];
        return this.products;
      }
    } catch (error) {
      this.lastLoadError = 'authoritative-pricing-data-unavailable';
      try { console.warn('[wm-pricing] Authoritative pricing data unavailable.'); } catch (ignore) {}
      try { window.dispatchEvent(new CustomEvent('woodenmax:pricing-unavailable')); } catch (ignore) {}
      throw new Error(this.lastLoadError);
    }
  }
  
  /**
   * Get single product by ID
   * Current: From loaded JSON
   * Future: From API endpoint
   * Merges global rates with product-specific rates
   */
  async getProduct(productId) {
    // Check cache first
    if (this.cache.has(productId)) {
      return this.cache.get(productId);
    }
    
    try {
      if (this.dataSource === 'json') {
        // Current: Load all products and find by ID
        const products = await this.loadProducts();
        const product = products.find(p => p.id === productId);
        
        if (product) {
          // Merge global rates with product rates if useGlobalRates is true
          if (product.rates?.useGlobalRates && this.globalRates) {
            // Merge glass rates (skip 0 values - 0 means use global rate)
            if (this.globalRates.glass && product.rates.glass) {
              const mergedGlass = { ...this.globalRates.glass };
              Object.keys(product.rates.glass).forEach(key => {
                // Only override if product rate is not 0
                if (product.rates.glass[key] !== 0 && product.rates.glass[key] !== null && product.rates.glass[key] !== undefined) {
                  mergedGlass[key] = product.rates.glass[key];
                }
              });
              product.rates.glass = mergedGlass;
            } else if (this.globalRates.glass && !product.rates.glass) {
              product.rates.glass = { ...this.globalRates.glass };
            }
            
            // Merge coating rates (skip 0 values)
            if (this.globalRates.coating && product.rates.coating) {
              const mergedCoating = { ...this.globalRates.coating };
              Object.keys(product.rates.coating).forEach(key => {
                if (product.rates.coating[key] !== 0 && product.rates.coating[key] !== null && product.rates.coating[key] !== undefined) {
                  mergedCoating[key] = product.rates.coating[key];
                }
              });
              product.rates.coating = mergedCoating;
            } else if (this.globalRates.coating && !product.rates.coating) {
              product.rates.coating = { ...this.globalRates.coating };
            }
            
            // Merge lock rates (skip 0 values)
            if (this.globalRates.lock && product.rates.lock) {
              const mergedLock = { ...this.globalRates.lock };
              Object.keys(product.rates.lock).forEach(key => {
                if (product.rates.lock[key] !== 0 && product.rates.lock[key] !== null && product.rates.lock[key] !== undefined) {
                  mergedLock[key] = product.rates.lock[key];
                }
              });
              product.rates.lock = mergedLock;
            } else if (this.globalRates.lock && !product.rates.lock) {
              product.rates.lock = { ...this.globalRates.lock };
            }
            
            // Merge mesh rates (handle both number and object formats)
            if (this.globalRates.mesh) {
              if (typeof product.rates.mesh === 'number') {
                // If product has numeric mesh rate, keep it (for backward compatibility)
                // But also add mesh object for structured access
                product.rates.meshObject = { ...this.globalRates.mesh };
              } else if (product.rates.mesh && typeof product.rates.mesh === 'object') {
                product.rates.mesh = { ...this.globalRates.mesh, ...product.rates.mesh };
              } else {
                product.rates.mesh = { ...this.globalRates.mesh };
              }
            }
            
            // Merge grill rates
            if (this.globalRates.grill && product.rates.grill) {
              product.rates.grill = { ...this.globalRates.grill, ...product.rates.grill };
            } else if (this.globalRates.grill && !product.rates.grill) {
              product.rates.grill = { ...this.globalRates.grill };
            }
          }
          
          // Note: Product-specific rates like flutedGlass, premiumColors, etc. are NOT merged
          // They are kept as-is from the product configuration
          
          this.cache.set(productId, product);
          return product;
        }
        
        throw new Error(`Product not found: ${productId}`);
      } else {
        // Future: Direct API call
        const response = await fetch(`${this.apiBaseUrl}/products/${productId}`);
        if (!response.ok) {
          throw new Error(`Failed to load product: ${response.status}`);
        }
        const product = await response.json();
        this.cache.set(productId, product);
        return product;
      }
    } catch (error) {
      this.lastLoadError = 'authoritative-pricing-data-unavailable';
      try { console.warn('[wm-pricing] Product pricing unavailable.'); } catch (ignore) {}
      try { window.dispatchEvent(new CustomEvent('woodenmax:pricing-unavailable')); } catch (ignore) {}
      return null;
    }
  }
  
  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId) {
    const products = await this.loadProducts();
    return products.filter(p => p.category === categoryId && p.status === 'active');
  }
  
  /**
   * Search products
   */
  async searchProducts(query) {
    const products = await this.loadProducts();
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
  }
  
  /**
   * Switch data source (for future migration)
   */
  setDataSource(source) {
    if (source === 'json' || source === 'api') {
      this.dataSource = source;
      this.cache.clear(); // Clear cache when switching
    }
  }
  
  /**
   * Set API base URL (for future)
   */
  setApiBaseUrl(url) {
    this.apiBaseUrl = url;
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.products = null;
  }
  
  /**
   * Get fallback data for file:// protocol or when fetch fails
   * Contains essential product data to keep calculators working
   */
  getFallbackData() {
    return {
      "globalRates": {
        "glass": {
          "6mm": 0,
          "8mm": 32,
          "10mm": 53,
          "12mm": 85,
          "dgu": 189,
          "laminated": 231,
          "safety": 231
        },
        "coating": {
          "wooden": 68
        },
        "lock": {
          "singlePoint": 0,
          "multiPoint": 1260,
          "mortice": 1575
        },
        "mesh": {
          "standard": 127,
          "openable": 370
        },
        "grill": {
          "aluminium12mm": 295
        }
      },
      "products": [
        {"id":"29mm-sliding","name":"29mm Sliding Series Aluminium Window","slug":"29mm-sliding-window","category":"aluminium-windows","subcategory":"sliding","status":"active","rates":{"baseRate":750,"hardwareCost":2200,"useGlobalRates":true,"glass":{},"coating":{},"lock":{},"mesh":{"standard":120}},"features":["mesh"],"description":"Premium 29mm series sections with 1.2mm wall thickness, 29X65mm shutter dimensions, and slim interlock for luxury feel."},
        {"id":"system-sliding-30mm","name":"30mm System Sliding Window (India certified line)","slug":"system-sliding-30mm-window","category":"aluminium-windows","subcategory":"sliding","status":"active","rates":{"baseRate":825,"hardwareCost":2480,"useGlobalRates":true,"glass":{},"coating":{},"lock":{},"mesh":{"standard":120}},"features":["mesh"],"description":"30mm system sliding for premium Indian system-window BOQ."},
        {"id":"system-sliding-31mm","name":"31mm System Sliding Window","slug":"system-sliding-31mm-window","category":"aluminium-windows","subcategory":"sliding","status":"active","rates":{"baseRate":838,"hardwareCost":2492,"useGlobalRates":true,"glass":{},"coating":{},"lock":{},"mesh":{"standard":120}},"features":["mesh"],"description":"31mm system sliding line."},
        {"id":"system-sliding-35mm-gulf","name":"35mm Gulf System Sliding Window","slug":"system-sliding-35mm-gulf-window","category":"aluminium-windows","subcategory":"sliding","status":"active","rates":{"baseRate":858,"hardwareCost":2510,"useGlobalRates":true,"glass":{},"coating":{},"lock":{},"mesh":{"standard":120}},"features":["mesh"],"description":"35mm Gulf interlock system sliding."},
        {"id":"system-sliding-40mm-minimal","name":"40mm Minimal / Slimline System Sliding","slug":"system-sliding-40mm-minimal-window","category":"aluminium-windows","subcategory":"sliding","status":"active","rates":{"baseRate":878,"hardwareCost":2535,"useGlobalRates":true,"glass":{},"coating":{},"lock":{},"mesh":{"standard":120}},"features":["mesh"],"description":"40mm minimal-sightline system sliding."},
        {"id":"system-sliding-31mm-glass","name":"31mm System Sliding (glass / IGU focus)","slug":"system-sliding-31mm-glass-window","category":"aluminium-windows","subcategory":"sliding","status":"active","rates":{"baseRate":848,"hardwareCost":2505,"useGlobalRates":true,"glass":{},"coating":{},"lock":{},"mesh":{"standard":120}},"features":["mesh"],"description":"31mm system sliding for glass build-up guides."},
        {"id":"2track-french","name":"2 Track French Sliding Door","slug":"2-track-french-sliding-door","category":"aluminium-windows","subcategory":"sliding","status":"active","rates":{"baseRate":750,"hardwareCost":2200,"useGlobalRates":true,"glass":{},"coating":{},"lock":{},"mesh":{"standard":120}},"features":["mesh","morticeLock","topFixed"],"description":"2 Track 4 Doors System - Side 2 doors fixed, middle 2 doors sliding. Optional mesh available."},
        {"id":"3track-sliding","name":"3 Track Sliding Window (27MM Domal Series)","slug":"3-track-sliding-window","category":"aluminium-windows","subcategory":"sliding","status":"active","rates":{"baseRate":500,"hardwareCost":800,"mesh":100,"glass":{"6mm":15,"8mm":30},"trackOptions":{"2track":0,"3track":100}},"features":["trackSelection","heightValidation","colorOptions"],"description":"27MM Domal Series - 2 Track (without mesh) or 3 Track (with mesh). Recommended height 6 feet, maximum 8 feet. Includes 5mm clear tuff glass, single point touch type lock, regular wheels, regular coating."},
        {"id":"top-hung-casement","name":"Top Hung Casement Window","slug":"top-hung-casement-window","category":"aluminium-windows","subcategory":"casement","status":"active","rates":{"baseRate":650,"hardwareCost":650,"hardwareCostMultiPoint":1400,"useGlobalRates":true,"glass":{"6mm":0,"8mm":0,"10mm":0,"12mm":0,"dgu":0,"laminated":0},"grill":{"aluminium12mm":280},"mesh":{"openable":350},"lock":{"singlePoint":0,"multiPoint":0}},"features":["mesh","grill","multiPointLock"],"description":"40mm casement profile with 6mm clear toughened glass, single point lock (handle type), friction stay. Optional inside aluminium 12mm hollow pipes grills and openable mesh available."},
        {"id":"system-casement-50mm-euro-guide","name":"50mm Euro System Casement (explainer / guide stack)","slug":"system-casement-50mm-euro-guide","category":"aluminium-windows","subcategory":"casement","status":"active","rates":{"baseRate":748,"hardwareCost":748,"hardwareCostMultiPoint":1605,"useGlobalRates":true,"glass":{"6mm":0,"8mm":0,"10mm":0,"12mm":0,"dgu":0,"laminated":0},"grill":{"aluminium12mm":280},"mesh":{"openable":350},"lock":{"singlePoint":0,"multiPoint":0}},"features":["mesh","grill","multiPointLock"],"description":"50mm Euro system casement — guide stack."},
        {"id":"system-casement-52mm-gulf-brands","name":"52mm Gulf System Casement (brands & comparison)","slug":"system-casement-52mm-gulf-brands","category":"aluminium-windows","subcategory":"casement","status":"active","rates":{"baseRate":762,"hardwareCost":755,"hardwareCostMultiPoint":1620,"useGlobalRates":true,"glass":{"6mm":0,"8mm":0,"10mm":0,"12mm":0,"dgu":0,"laminated":0},"grill":{"aluminium12mm":280},"mesh":{"openable":350},"lock":{"singlePoint":0,"multiPoint":0}},"features":["mesh","grill","multiPointLock"],"description":"52mm Gulf system casement."},
        {"id":"system-casement-50mm-euro","name":"50mm Euro System Casement (standard quote)","slug":"system-casement-50mm-euro","category":"aluminium-windows","subcategory":"casement","status":"active","rates":{"baseRate":754,"hardwareCost":751,"hardwareCostMultiPoint":1617,"useGlobalRates":true,"glass":{"6mm":0,"8mm":0,"10mm":0,"12mm":0,"dgu":0,"laminated":0},"grill":{"aluminium12mm":280},"mesh":{"openable":350},"lock":{"singlePoint":0,"multiPoint":0}},"features":["mesh","grill","multiPointLock"],"description":"50mm Euro system casement — standard quote."},
        {"id":"system-casement-52mm-gulf-slim","name":"52mm Gulf System Casement (slim / luxury stack)","slug":"system-casement-52mm-gulf-slim","category":"aluminium-windows","subcategory":"casement","status":"active","rates":{"baseRate":768,"hardwareCost":760,"hardwareCostMultiPoint":1625,"useGlobalRates":true,"glass":{"6mm":0,"8mm":0,"10mm":0,"12mm":0,"dgu":0,"laminated":0},"grill":{"aluminium12mm":280},"mesh":{"openable":350},"lock":{"singlePoint":0,"multiPoint":0}},"features":["mesh","grill","multiPointLock"],"description":"52mm Gulf casement — slim luxury stack."},
        {"id":"system-casement-50mm-euro-villa","name":"50mm Euro System Casement (villa & large vent)","slug":"system-casement-50mm-euro-villa","category":"aluminium-windows","subcategory":"casement","status":"active","rates":{"baseRate":778,"hardwareCost":765,"hardwareCostMultiPoint":1635,"useGlobalRates":true,"glass":{"6mm":0,"8mm":0,"10mm":0,"12mm":0,"dgu":0,"laminated":0},"grill":{"aluminium12mm":280},"mesh":{"openable":350},"lock":{"singlePoint":0,"multiPoint":0}},"features":["mesh","grill","multiPointLock"],"description":"50mm Euro for villa and luxury homes."},
        {"id":"georgian-bar-openable","name":"Georgian Bar Openable Window","slug":"georgian-grill-casement-door","category":"aluminium-windows","subcategory":"casement","status":"active","rates":{"baseRate":900,"hardwareCost":650,"hardwareCostMultiPoint":1400,"useGlobalRates":true,"glass":{"6mm":0,"8mm":0,"10mm":0,"12mm":0,"dgu":0,"laminated":0},"grill":{"aluminium12mm":280},"mesh":{"openable":350},"lock":{"singlePoint":0,"multiPoint":0}},"features":["mesh","grill","multiPointLock"],"description":"Georgian Bar Openable Window with 40mm casement profile, golden Georgian bar design, 6mm clear toughened glass, single point lock (handle type), friction stay. Optional inside aluminium 12mm hollow pipes grills and openable mesh available."},
        {"id":"french-georgian-bar","name":"French Aluminium Door with Georgian Bar","slug":"french-door-georgian-bar","category":"aluminium-windows","subcategory":"french-door","status":"active","rates":{"baseRate":950,"hardwareCost":1800,"hardwareCostMultiPoint":2200,"useGlobalRates":true,"glass":{"8mm":0,"10mm":0,"12mm":0,"dgu":0,"safety":0},"coating":{"texture":0,"smooth":0,"wooden":0},"lock":{"singlePoint":0,"multiPoint":0,"mortice":0},"mesh":{"security":280}},"features":["mesh","multiPointLock","morticeLock","heightValidation"],"maxHeight":9,"description":"Premium 35mm slim profile series French Aluminium Door with golden Georgian bar design. Includes 8mm toughened glass in base rate. Maximum height 9 feet. Optional security mesh, multipoint lock, and mortice lock available."},
        {"id":"slim-entrance-glass-door","name":"Luxury Slim Entrance Glass Door","slug":"slim-entrance-glass-door","category":"aluminium-windows","subcategory":"entrance-door","status":"active","rates":{"baseRate":1250,"hardwareCost":1800,"hardwareCostMultiPoint":2200,"useGlobalRates":true,"glass":{"8mm":0,"10mm":0,"12mm":0,"dgu":0,"safety":0},"coating":{"texture":0,"smooth":0,"wooden":0},"lock":{"singlePoint":0,"multiPoint":0,"mortice":0},"mesh":{"security":280}},"features":["mesh","multiPointLock","morticeLock","heightValidation","coating","colorOptions"],"maxHeight":10,"description":"Premium 40mm super luxury slim series entrance glass door. Includes 8mm toughened glass and slim interlock in base rate. Maximum height 10 feet. Optional security mesh, multipoint lock, mortice lock, coating, and color options available."},
        {"id":"full-elevation-villa-facade","name":"Full Elevation Aluminium Windows & Doors","slug":"full-elevation-villa-facade","category":"aluminium-windows","subcategory":"full-elevation","status":"active","rates":{"baseRate":500,"hardwareCost":0,"useGlobalRates":true,"glass":{"6mm":0,"8mm":0,"10mm":0,"12mm":0,"dgu":0,"safety":0,"5mm":0},"flutedGlass":{"6mm-clear-fluted":65,"8mm-clear-fluted":85,"6mm-brown-fluted":85,"8mm-brown-fluted":115,"6mm-grey-fluted":85,"8mm-grey-fluted":115},"flutedMaxHeights":{"clear":10,"brown":8,"grey":8},"premiumColors":{"rose-gold":65,"copper-gold":65}},"features":["heightValidation","colorOptions","flutedGlass","premiumColors"],"maxHeight":12,"description":"Full Elevation Aluminium Windows & Doors with fixed glass for luxury full glass view. Imported slim profiles with premium finishes. Base rate includes 6mm clear glass. Maximum height 12 feet. Options for Safety glass, DGU glass, 5mm-12mm clear glass, and imported fluted glass (6mm & 8mm in clear/brown/grey). Fluted glass height limits: Clear (10 ft), Brown/Grey (8 ft). Ready stock colors: Matt Black, Gold, Brush Gold, Grey, Mill Finish, Rose Gold, Copper Gold. Custom RAL colors available on order."},
        {"id":"telescopic-slim-sliding-door","name":"Telescopic Slim Profile Sliding Door","slug":"telescopic-slim-sliding-door","category":"telescope-windows","subcategory":"telescopic","status":"active","rates":{"baseRate":1250,"useGlobalRates":false,"profiles":{"ultra-slim-12x35":0,"slim-16x35":0,"regular-slim-16x45":0},"panelConfig":{"1+1":4500,"2+1":6500,"3+1":9500,"4+1":12500},"glass":{"8mm-clear":0,"8mm-clear-fluted":85,"8mm-grey-fluted":115,"8mm-brown-fluted":115},"premiumColors":{"rose-gold":65,"copper-gold":65}},"features":["panelConfig","profileOptions","colorOptions","flutedGlass","premiumColors"],"warranty":{"hardware":"2 years","service":"1 year free"},"description":"Telescopic Slim Profile Sliding Door with imported soft-close hardware. Panel configurations: 1+1, 2+1, 3+1, 4+1. Profile options: Ultra Slim 12X35, Slim 16X35, Regular Slim 16X45. Base rate includes 8mm clear tuff glass. Premium colors: Rose Gold, Copper Gold. Premium glass: Clear Fluted, Grey Fluted, Brown Fluted."},
        {"id":"fold-bifold-aluminium-doors","name":"Fold & Bi-Fold Aluminium Glass Doors","slug":"fold-bifold-aluminium-doors","category":"folding-systems","subcategory":"bifold","status":"active","rates":{"baseRate":1750,"useGlobalRates":false,"profiles":{"50mm":0,"52mm":0},"glass":{"8mm-clear":0,"6mm-clear":-20,"10mm-clear":35,"12mm-clear":65,"safety":180,"dgu":200}},"features":["profileOptions","glassOptions","ralColors"],"description":"Fold & Bi-Fold Aluminium Glass Doors with 50mm and 52mm profiles. Base rate includes 8mm clear tuff glass and mortice lock. RAL color powder coating available. Perfect for balcony doors, window openings, living room partitions, office cabins, showroom fronts. 95% opening with safety glass."},
        {"id":"fold-sliding-window-system","name":"Fold & Sliding Window System","slug":"fold-sliding-window-system","category":"folding-systems","subcategory":"fold-sliding","status":"active","rates":{"baseRate":2250,"useGlobalRates":false,"glass":{"8mm-clear":0,"10mm-clear":35,"8mm-clear-fluted":85,"8mm-grey-fluted":115,"8mm-brown-fluted":115},"premiumColors":{"rose-gold":65,"copper-gold":65}},"features":["glassOptions","colorOptions","premiumColors","morticeLock"],"description":"Fold & Sliding Window System with imported slim profiles. 2-door configuration for gates and windows. Base rate includes 8mm clear tuff glass and mortice lock. Imported hardware for slim look with security. Premium colors: Rose Gold, Copper Gold. Premium glass: Clear Fluted, Grey Fluted, Brown Fluted."},
        {"id":"wooden-finish-aluminium-louvers","name":"Wooden Finish Aluminium Louvers","slug":"wooden-finish-aluminium-louvers","category":"metal-louvers","subcategory":"wooden-finish","status":"active","rates":{"baseRate":450,"useGlobalRates":false,"profileSize":"100x50x1.2MM","profileGap":12,"profileLengths":[12,16],"profileWeight12ft":5.5,"aluminiumRatePerKg":330,"coatingRatePerFt":50},"features":["louverCalculation","wastageCalculation","colorOptions"],"description":"Premium wooden finish aluminium louvers with 100x50x1.2MM profiles. Installed every 12 inches gap. Available in 12ft and 16ft sections. Multiple wooden texture colors available. Same rates apply for pergola."},
        {"id":"curved-architectural-louvers","name":"Architectural Curved Aluminium Louvers","slug":"curved-architectural-louvers","category":"metal-louvers","subcategory":"sleek-curved","status":"active","rates":{"baseRate":490,"useGlobalRates":false,"profileSize":"60x40x1.2MM","profileGap":8,"profileLengths":[12,16],"profileWeight12ft":4.8,"aluminiumRatePerKg":330,"coatingRatePerFt":50,"extraWastagePercent":10},"features":["louverCalculation","wastageCalculation","colorOptions","sleekDesign"],"description":"Premium sleek design curved aluminium louvers with 60x40x1.2MM profiles. Installed every 8 inches gap. Available in 12ft and 16ft sections. All coating options included. Package rate includes all hardware, coating, profiles."},
        {"id":"ceiling-pergola-louvers","name":"Ceiling Aluminium Louvers Pergola","slug":"ceiling-pergola-louvers","category":"metal-louvers","subcategory":"ceiling-pergola","status":"active","rates":{"baseRate":480,"useGlobalRates":false,"profileSize":"25x75MM","profileGap":6,"profileLengths":[12,16],"profileWeight12ft":3.7,"aluminiumRatePerKg":330,"coatingRatePerFt":50},"features":["louverCalculation","wastageCalculation","colorOptions","pergolaDesign"],"description":"Premium ceiling aluminium louvers pergola with 25x75MM profiles. Installed every 6 inches gap. Available in 12ft and 16ft sections. All coating options included. Perfect for backyard, terrace, farmhouse, poolside."},
        {"id":"louver-canopy-facade","name":"Aluminium Louver Canopy Sunshade","slug":"louver-canopy-facade","category":"metal-louvers","subcategory":"canopy-sunshade","status":"active","rates":{"baseRate":520,"useGlobalRates":false,"profileSize":"50x50x1.5MM","profileGap":8,"profileLengths":[12,16],"profileWeight12ft":4.2,"aluminiumRatePerKg":330,"coatingRatePerFt":50},"features":["louverCalculation","wastageCalculation","colorOptions","canopyDesign"],"description":"Premium aluminium louver canopy sunshade with 50x50x1.5MM profiles. Installed every 8 inches gap. Available in 12ft and 16ft sections. All coating options included. Perfect for entry canopy, terrace roof, balcony sunshade."},
        {"id":"frameless-shower-partition","name":"Frameless Shower Glass Door","slug":"frameless-shower-partition","category":"shower-partitions","subcategory":"frameless","status":"active","rates":{"useGlobalRates":false,"glassType":"10mm Clear Toughened","maxHeight":8,"standardHeight":7,"hinged":{"glassRate":350,"hardware":{"mill-finish":4500,"black":5500,"gold":5500,"rose-gold":7500},"sealTypes":["T-seal","F-seal","Magnetic","D-type"],"sealColors":["Black","Clear"]},"sliding":{"glassRate":450,"hardware":{"mill-finish":5500,"black":6500,"gold":6500},"includes":["D-seal","Bottom Guide","Round Knob Handle","Top Track"]}},"features":["lCornerSupport","hardwareSelection","sealOptions","heightLimit","slidingOption"],"description":"Premium frameless shower glass door with 10mm clear toughened glass. Hinged and Sliding options. L-corner and straight configurations. Max height 8ft."},
        {"id":"premium-black-profile-shower","name":"Premium Black Profile Shower Glass","slug":"premium-black-profile-shower","category":"shower-partitions","subcategory":"black-profile","status":"active","rates":{"useGlobalRates":false,"glassRate":650,"profiles":{"regular-slim":"16x45mm","ultra-slim":"16x35mm"},"glassOptions":["8mm"],"hardwarePerDoor":4500,"hardwareFinishes":["matt-black","gold","mill-finish"],"hardwareIncludes":["Towel Handle","3pc Hinges","Seals"]},"features":["lCornerSupport","profileSelection","importedHardware","openableOnly"],"description":"Premium black profile shower glass with imported slim profiles (16x45mm Regular, 16x35mm Ultra Slim). Openable doors with towel handle, 3pc hinges. 8mm toughened glass."},
        {"id":"black-profile-shower-partition","name":"Black Profile Shower Glass Partition","slug":"black-profile-shower-partition","category":"shower-partitions","subcategory":"black-profile-sliding","status":"active","rates":{"useGlobalRates":false,"baseGlassRate":650,"roseGoldExtraPerSqft":100,"profiles":{"regular-slim":"16x45mm","ultra-slim":"16x35mm"},"glassOptions":["8mm"],"hardware":{"sliding":{"matt-black":6500,"gold":6500,"mill-finish":5500,"rose-gold":7500}},"hardwareIncludes":["Top Track","Soft-Close Wheels","Towel Handle","Seals"]},"features":["lCornerSupport","profileSelection","importedHardware","softCloseSliding","dualDoorLCorner"],"description":"Black profile shower glass partition with soft-close sliding doors. Imported slim profiles (16x45mm Regular, 16x35mm Ultra Slim). Top track with wheels. Single door for straight, dual sliding for L-corner. 8mm toughened glass."},
        {"id":"frosted-glass-bathroom-door","name":"Frosted Glass Fold & Slide Door","slug":"frosted-glass-bathroom-door","category":"shower-partitions","subcategory":"fold-slide-door","status":"active","rates":{"useGlobalRates":false,"baseRate":1250,"frostingExtra":25,"hardwarePerSet":9500,"lockExtra":2500,"profiles":{"regular-slim":"16x45mm","ultra-slim":"16x35mm"},"glassOptions":["8mm-clear","8mm-frosted"],"hardwareColors":["white","matt-black","gold"],"hardwareIncludes":["Fold & Slide Track","Rollers","Gasket","Handle","Seals"]},"features":["foldAndSlide","95percentOpening","lockOption","multiUse"],"description":"Frosted glass fold & slide door with 95% opening. Imported slim profiles (16x45mm Regular, 16x35mm Ultra Slim). 8mm clear or frosted glass. 2-door fold & slide mechanism. Optional lock. Perfect for bathroom, staircase, entrance, public toilet, mall."},
        {"id":"slim-gold-profile-fluted-shower","name":"Slim Gold Profile Fluted Shower Glass","slug":"slim-frame-shower-partition","category":"shower-partitions","subcategory":"gold-profile","status":"active","rates":{"useGlobalRates":false,"baseRate":850,"flutedGlassExtra":100,"hardwarePerDoor":7500,"profiles":{"gold":"Gold PVD Coated","rose-gold":"Rose Gold PVD Coated"},"glassColors":["clear","grey","black","brown"],"doorTypes":["openable","sliding"],"hardwareIncludes":["Soft-Close Track/Hinges","Handle","Seals","Connectors"]},"features":["goldProfile","flutedGlass","softClose","multipleGlassColors"],"description":"Slim gold profile fluted shower glass partition with imported PVD coated aluminium. Fluted textured glass in Grey, Black, Brown, Clear. Soft-close openable & sliding options."},
        {"id":"hpl-exterior-cladding","name":"HPL Exterior Cladding & Ceiling","slug":"hpl-exterior-cladding","category":"elevation-cladding","subcategory":"hpl-cladding","status":"active","rates":{"useGlobalRates":false,"wastagePercent":5,"brands":{"fundermax":{"name":"FunderMax (Imported)","sheetWidthMM":1300,"sheetHeightMM":3050,"ratePerSqft":488,"colors":"30+ Plain & Wooden"},"greenlam":{"name":"Greenlam (Indian)","sheetWidthMM":1300,"sheetHeightMM":3050,"ratePerSqft":368,"colors":"30+ Plain"},"newmika":{"name":"Newmika (Budget)","sheetWidthMM":1220,"sheetHeightMM":2440,"ratePerSqft":310,"colors":"30+ Plain & Wooden"}},"installation":{"ceiling":{"ratePerSqft":173,"frameGap":"16-18 inches"},"facade":{"ratePerSqft":152,"frameGap":"22-24 inches"}},"framework":{"pipe":"50x25mm aluminium rectangle","fixings":"Rivets + 75x10mm screws with gitti","coating":"Powder coating matching HPL color"}},"features":["brandSelection","sheetCalculation","wastageCalculation","installationOptions"],"description":"Premium HPL exterior cladding with FunderMax, Greenlam, Newmika brands. 30+ color options. 6mm thickness. Includes aluminium framework installation with powder coating."},
        {"id":"acp-elevation","name":"ACP Elevation Cladding","slug":"acp-elevation-cladding","category":"elevation-cladding","subcategory":"acp-cladding","status":"active","rates":{"useGlobalRates":false,"wastagePercent":5,"standardSheetSqft":48,"sheetSizes":["4x8ft","4x10ft","4x12ft"],"commercial":{"3mm":{"plain":284,"wooden":336},"4mm":{"plain":326,"wooden":399},"6mm":{"plain":410,"wooden":473}},"frGradeB":{"4mm":{"plain":546},"brackets":{"gi":"75x75x6mm GI with 10x100mm anchor bolts","aluminium":"50x50x50mm angles with screws"},"applications":["railways","airports","metro","government"]},"coating":"PVDF on both wooden and plain colors","framework":{"pattern":"4x4 grid","profile":"Aluminium profile frame","fixings":"Wooden screws + Silicon sealant","note":"No rivets - concealed fixing"}},"features":["projectTypeSelection","colorTypeSelection","thicknessSelection","sheetCalculation","wastageCalculation","frGradeOption"],"description":"Premium ACP elevation cladding for commercial buildings. Aluminium coil both sides with PVDF coating. 3mm, 4mm, 6mm thickness. FR Grade B available for Railways/Airports/Govt projects. Includes 4x4 grid aluminium framework installation."},
        {"id":"aluminium-sliding-window","name":"Aluminium Sliding Window","slug":"aluminium-sliding-window","category":"aluminium-windows","subcategory":"sliding","status":"active","rates":{"baseRate":790,"hardwareCost":2310,"useGlobalRates":true,"glass":{},"coating":{},"lock":{},"mesh":{"standard":127}},"features":["mesh"],"description":"Premium aluminium sliding window with mesh options."}
      ]
    };
  }
}

// Create a non-price fallback state rather than silently substituting rates.
function showPricingUnavailableState() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('[data-product], #product-pricing-root').forEach((container) => {
    if (container.querySelector('[data-pricing-unavailable]')) return;
    const status = document.createElement('p');
    status.setAttribute('data-pricing-unavailable', '1');
    status.setAttribute('role', 'status');
    status.textContent = 'Pricing temporarily unavailable / being updated.';
    container.appendChild(status);
    container.querySelectorAll('[data-action="pkg-quote"], [data-action="pkg-buy"], button[type="submit"]').forEach((button) => {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    });
  });
}

// Create global instance
const productManager = new ProductManager();

// Export for use
if (typeof window !== 'undefined') {
  window.ProductManager = ProductManager;
  window.productManager = productManager;
  window.addEventListener('woodenmax:pricing-unavailable', showPricingUnavailableState);
}

