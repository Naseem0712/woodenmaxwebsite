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
        const getJsonPath = () => {
          try {
            const pathname = window.location.pathname || window.location.href;
            
            // Remove filename and get directory parts
            const parts = pathname.split('/').filter(p => p && !p.endsWith('.html'));
            
            // Count directory levels (excluding empty strings)
            // products/aluminium-windows/ = 2 levels, need ../../data/products.json
            const levelsUp = parts.length;
            
            // Build relative path
            return '../'.repeat(levelsUp) + 'data/products.json';
          } catch (e) {
            // Fallback: assume 2 levels deep (most common case)
            return '../../data/products.json';
          }
        };
        
        const jsonPath = getJsonPath();
        
        // Check if we're using file:// protocol (won't work with fetch)
        if (window.location.protocol === 'file:') {
          console.warn('⚠️ File:// protocol detected. Please use a web server (e.g., Live Server) for the calculator to work.');
          console.warn('📁 Attempted path:', jsonPath);
          throw new Error('File:// protocol not supported. Please use a web server (http:// or https://)');
        }
        
        const response = await fetch(jsonPath);
        if (!response.ok) {
          throw new Error(`Failed to load products: ${response.status} - ${jsonPath}`);
        }
        const data = await response.json();
        this.products = data.products || [];
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
      console.error('Error loading products:', error);
      return [];
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
      console.error(`Error loading product ${productId}:`, error);
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
}

// Create global instance
const productManager = new ProductManager();

// Export for use
if (typeof window !== 'undefined') {
  window.ProductManager = ProductManager;
  window.productManager = productManager;
}

