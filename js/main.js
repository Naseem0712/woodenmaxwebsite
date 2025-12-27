/* ============================================
   WOODENMAX - MAIN JAVASCRIPT
   All Interactions & Animations
   ============================================ */

// Enable browser's scroll position restoration on page refresh
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'auto';
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  
  // ============================================
  // NAVBAR SCROLL EFFECT (Optimized with RAF)
  // ============================================
  const navbar = document.getElementById('navbar');
  let ticking = false;
  
  function handleNavbarScroll() {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    ticking = false;
  }
  
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(handleNavbarScroll);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', onScroll, { passive: true });
  handleNavbarScroll(); // Check on load
  
  // ============================================
  // CATEGORY CAROUSEL IN HEADER (Infinite Wheel)
  // ============================================
  const categoryCarousel = document.getElementById('categoryCarousel');
  const catPrev = document.getElementById('catPrev');
  const catNext = document.getElementById('catNext');
  
  if (categoryCarousel && catPrev && catNext) {
    const originalItems = Array.from(categoryCarousel.querySelectorAll('.cat-item'));
    const totalCategories = originalItems.length;
    
    // Clone items for infinite scroll effect (add clones before and after)
    const clonesBefore = [];
    const clonesAfter = [];
    
    // Create clones
    originalItems.forEach((item, index) => {
      const cloneBefore = item.cloneNode(true);
      const cloneAfter = item.cloneNode(true);
      cloneBefore.classList.add('clone');
      cloneAfter.classList.add('clone');
      cloneBefore.dataset.originalIndex = index;
      cloneAfter.dataset.originalIndex = index;
      clonesBefore.push(cloneBefore);
      clonesAfter.push(cloneAfter);
    });
    
    // Add clones to carousel
    clonesBefore.reverse().forEach(clone => {
      categoryCarousel.insertBefore(clone, categoryCarousel.firstChild);
    });
    clonesAfter.forEach(clone => {
      categoryCarousel.appendChild(clone);
    });
    
    // Get all items including clones
    const allItems = Array.from(categoryCarousel.querySelectorAll('.cat-item'));
    
    // Detect current page and set initial active category
    const currentPath = window.location.pathname.toLowerCase();
    let currentCatIndex = 0;
    let isAnimating = false;
    
    // Category mapping based on URL path
    const categoryMap = {
      'upvc': 0,
      'aluminium': 0,
      'telescope': 1,
      'folding': 2,
      'louver': 3,
      'metal-louver': 3,
      'shower': 4,
      'elevation': 5,
      'cladding': 5,
      'glass': 6
    };
    
    // Find matching category from URL
    for (const [keyword, index] of Object.entries(categoryMap)) {
      if (currentPath.includes(keyword)) {
        currentCatIndex = index;
        break;
      }
    }
    
    // Wheel rotation easing - very smooth, like a spinning wheel slowing down
    function easeOutQuint(t) {
      return 1 - Math.pow(1 - t, 5);
    }
    
    // Smooth scroll to position with wheel rotation effect
    function smoothScrollTo(targetPos, duration, callback) {
      const startPos = categoryCarousel.scrollLeft;
      const distance = targetPos - startPos;
      const startTime = performance.now();
      
      // Cancel any existing animation
      if (categoryCarousel.animationId) {
        cancelAnimationFrame(categoryCarousel.animationId);
      }
      
      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuint(progress);
        
        categoryCarousel.scrollLeft = startPos + (distance * easedProgress);
        
        if (progress < 1) {
          categoryCarousel.animationId = requestAnimationFrame(animate);
        } else {
          isAnimating = false;
          categoryCarousel.animationId = null;
          if (callback) callback();
        }
      }
      
      categoryCarousel.animationId = requestAnimationFrame(animate);
    }
    
    // Update visual states of all items
    function updateItemStates() {
      allItems.forEach((item) => {
        item.classList.remove('active', 'near');
        
        // Get the original index of this item
        const itemIndex = item.classList.contains('clone') 
          ? parseInt(item.dataset.originalIndex) 
          : originalItems.indexOf(item);
        
        // Calculate relative position
        let diff = itemIndex - currentCatIndex;
        
        // Handle wrap-around for visual state
        if (diff > totalCategories / 2) diff -= totalCategories;
        if (diff < -totalCategories / 2) diff += totalCategories;
        
        if (diff === 0) {
          item.classList.add('active');
        } else if (Math.abs(diff) === 1) {
          item.classList.add('near');
        }
      });
    }
    
    // Scroll to specific index (in the middle set)
    function scrollToIndex(index, animate = true, duration = 1000) {
      // Find the original item (not clone) at this index
      const targetItem = originalItems[index];
      if (!targetItem) return;
      
      const containerWidth = categoryCarousel.offsetWidth;
      const itemLeft = targetItem.offsetLeft;
      const itemWidth = targetItem.offsetWidth;
      const targetScroll = itemLeft - (containerWidth / 2) + (itemWidth / 2);
      
      if (animate) {
        smoothScrollTo(targetScroll, duration);
      } else {
        categoryCarousel.scrollLeft = targetScroll;
        isAnimating = false;
      }
    }
    
    // Handle infinite loop - reset position when reaching clones
    function checkInfiniteLoop() {
      const scrollLeft = categoryCarousel.scrollLeft;
      const containerWidth = categoryCarousel.offsetWidth;
      const totalWidth = categoryCarousel.scrollWidth;
      const singleSetWidth = totalWidth / 3; // 3 sets: clones + originals + clones
      
      // If scrolled too far left (into left clones), jump to right side
      if (scrollLeft < singleSetWidth * 0.3) {
        categoryCarousel.scrollLeft = scrollLeft + singleSetWidth;
      }
      // If scrolled too far right (into right clones), jump to left side
      else if (scrollLeft > singleSetWidth * 1.7) {
        categoryCarousel.scrollLeft = scrollLeft - singleSetWidth;
      }
    }
    
    function updateCarousel(direction) {
      if (isAnimating) return;
      isAnimating = true;
      
      // Update visual states
      updateItemStates();
      
      // Scroll to the target item with smooth animation
      scrollToIndex(currentCatIndex, true, 1000);
    }
    
    // Arrow navigation - infinite loop
    catNext.addEventListener('click', function() {
      if (isAnimating) return;
      currentCatIndex = (currentCatIndex + 1) % totalCategories;
      updateCarousel('right');
    });
    
    catPrev.addEventListener('click', function() {
      if (isAnimating) return;
      currentCatIndex = (currentCatIndex - 1 + totalCategories) % totalCategories;
      updateCarousel('left');
    });
    
    // Click on any item (original or clone)
    allItems.forEach((item) => {
      item.addEventListener('click', function(e) {
        if (isAnimating) return;
        
        // Get original index
        const clickedIndex = item.classList.contains('clone') 
          ? parseInt(item.dataset.originalIndex) 
          : originalItems.indexOf(item);
        
        if (clickedIndex === currentCatIndex) return;
        
        isAnimating = true;
        currentCatIndex = clickedIndex;
        
        // Update visual states
        updateItemStates();
        
        // Scroll to the CLICKED item directly (not the original)
        // This ensures wheel rotates in the direction user clicked
        const containerWidth = categoryCarousel.offsetWidth;
        const itemLeft = item.offsetLeft;
        const itemWidth = item.offsetWidth;
        const targetScroll = itemLeft - (containerWidth / 2) + (itemWidth / 2);
        
        // Smooth scroll to clicked item
        smoothScrollTo(targetScroll, 1000, function() {
          // After animation, silently reset to original item position if needed
          checkInfiniteLoop();
        });
      });
    });
    
    // Initialize - NO animation on page load, instant positioning
    // Disable all transitions temporarily
    categoryCarousel.style.scrollBehavior = 'auto';
    allItems.forEach(item => {
      item.style.transition = 'none';
    });
    
    // Set initial state instantly
    updateItemStates();
    scrollToIndex(currentCatIndex, false);
    
    // Re-enable transitions after a brief delay (after browser renders)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        allItems.forEach(item => {
          item.style.transition = '';
        });
      });
    });
    
    // Check for infinite loop on scroll end
    categoryCarousel.addEventListener('scroll', function() {
      if (!isAnimating) {
        checkInfiniteLoop();
      }
    });
  }
  
  // ============================================
  // MOBILE MENU TOGGLE - Fixed for all pages
  // ============================================
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuIcon = document.getElementById('menuIcon');
  const closeIcon = document.getElementById('closeIcon');
  
  let isMobileMenuOpen = false;
  
  // Always ensure menu is closed on page load
  function initializeMobileMenu() {
    isMobileMenuOpen = false;
    if (mobileMenu) {
      mobileMenu.classList.remove('active');
    }
    if (menuIcon) {
      menuIcon.style.display = 'block';
    }
    if (closeIcon) {
      closeIcon.style.display = 'none';
    }
    // Reset body overflow and remove menu-open class
    document.body.classList.remove('menu-open');
    document.documentElement.classList.remove('menu-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.documentElement.style.overflow = '';
    delete document.body.dataset.scrollY;
  }
  
  // Initialize on page load
  initializeMobileMenu();
  
  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
    
    if (isMobileMenuOpen) {
      // Open menu
      if (mobileMenu) mobileMenu.classList.add('active');
      if (menuIcon) menuIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'block';
      
      // Prevent body scroll - multiple methods for compatibility
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      document.body.classList.add('menu-open');
      document.documentElement.classList.add('menu-open');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.left = '0';
      document.body.style.right = '0';
      
      // Store scroll position
      document.body.dataset.scrollY = scrollY;
    } else {
      // Close menu
      if (mobileMenu) mobileMenu.classList.remove('active');
      if (menuIcon) menuIcon.style.display = 'block';
      if (closeIcon) closeIcon.style.display = 'none';
      
      // Restore body scroll
      const scrollY = document.body.dataset.scrollY || '0';
      document.body.classList.remove('menu-open');
      document.documentElement.classList.remove('menu-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.left = '';
      document.body.style.right = '';
      
      // Restore scroll position
      window.scrollTo(0, parseInt(scrollY || '0', 10));
      delete document.body.dataset.scrollY;
    }
  }
  
  function closeMobileMenu() {
    if (!isMobileMenuOpen) return;
    
    isMobileMenuOpen = false;
    if (mobileMenu) mobileMenu.classList.remove('active');
    if (menuIcon) menuIcon.style.display = 'block';
    if (closeIcon) closeIcon.style.display = 'none';
    
    // Restore body scroll
    const scrollY = document.body.dataset.scrollY || '0';
    document.body.classList.remove('menu-open');
    document.documentElement.classList.remove('menu-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.left = '';
    document.body.style.right = '';
    
    // Restore scroll position
    window.scrollTo(0, parseInt(scrollY || '0', 10));
    delete document.body.dataset.scrollY;
  }
  
  // Toggle button event - works even if mobileMenu doesn't exist yet
  if (mobileToggle) {
    mobileToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMobileMenu();
    });
    
    // Also handle touch events for better mobile support
    mobileToggle.addEventListener('touchend', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMobileMenu();
    });
  }
  
  // Menu interactions - only if menu exists
  if (mobileMenu) {
    // Close menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        closeMobileMenu();
      });
    });
    
    // Close on background click (outside content)
    mobileMenu.addEventListener('click', function(e) {
      if (e.target === mobileMenu || e.target.classList.contains('mobile-menu-bg')) {
        closeMobileMenu();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu();
      }
    });
  }
  
  // Close menu on window resize (if resizing to desktop)
  window.addEventListener('resize', function() {
    if (window.innerWidth >= 1024 && isMobileMenuOpen) {
      closeMobileMenu();
    }
  });
  
  // Ensure menu is closed when page unloads
  window.addEventListener('beforeunload', function() {
    closeMobileMenu();
  });
  
  // ============================================
  // MOBILE ACCORDION (Products)
  // ============================================
  const accordions = document.querySelectorAll('.mobile-accordion');
  
  accordions.forEach(function(accordion) {
    const trigger = accordion.querySelector('.mobile-accordion-trigger');
    
    if (trigger) {
      trigger.addEventListener('click', function() {
        accordion.classList.toggle('open');
      });
    }
  });
  
  // ============================================
  // HERO SLIDER
  // ============================================
  const heroSlider = document.getElementById('heroSlider');
  
  if (heroSlider) {
    const slides = heroSlider.querySelectorAll('.slide');
    const dots = heroSlider.querySelectorAll('.slider-dot');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    
    let currentSlide = 0;
    let isAnimating = false;
    let autoPlayInterval;
    
    function goToSlide(index) {
      if (isAnimating) return;
      isAnimating = true;
      
      // Remove active class from all slides and dots
      slides.forEach(function(slide) {
        slide.classList.remove('active');
      });
      dots.forEach(function(dot) {
        dot.classList.remove('active');
      });
      
      // Add active class to current slide and dot
      currentSlide = index;
      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
      
      // Reset animation lock after transition
      setTimeout(function() {
        isAnimating = false;
      }, 1000);
    }
    
    function nextSlide() {
      const next = (currentSlide + 1) % slides.length;
      goToSlide(next);
    }
    
    function prevSlide() {
      const prev = (currentSlide - 1 + slides.length) % slides.length;
      goToSlide(prev);
    }
    
    // Arrow button events
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        nextSlide();
        resetAutoPlay();
      });
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        prevSlide();
        resetAutoPlay();
      });
    }
    
    // Dot click events
    dots.forEach(function(dot, index) {
      dot.addEventListener('click', function() {
        goToSlide(index);
        resetAutoPlay();
      });
    });
    
    // Auto-play (Optimized with requestAnimationFrame)
    let autoPlayAnimationId = null;
    let lastAutoPlayTime = performance.now();
    const autoPlayInterval = 6000;
    
    function autoPlayLoop(currentTime) {
      if (currentTime - lastAutoPlayTime >= autoPlayInterval) {
        nextSlide();
        lastAutoPlayTime = currentTime;
      }
      autoPlayAnimationId = requestAnimationFrame(autoPlayLoop);
    }
    
    function startAutoPlay() {
      if (!autoPlayAnimationId) {
        lastAutoPlayTime = performance.now();
        autoPlayAnimationId = requestAnimationFrame(autoPlayLoop);
      }
    }
    
    function stopAutoPlay() {
      if (autoPlayAnimationId) {
        cancelAnimationFrame(autoPlayAnimationId);
        autoPlayAnimationId = null;
      }
    }
    
    function resetAutoPlay() {
      stopAutoPlay();
      startAutoPlay();
      clearInterval(autoPlayInterval);
      startAutoPlay();
    }
    
    startAutoPlay();
  }
  
  // ============================================
  // MOBILE FILTER DRAWER (Catalog Page)
  // ============================================
  const mobileFilterBtn = document.getElementById('mobileFilterBtn');
  const mobileFilterDrawer = document.getElementById('mobileFilterDrawer');
  const mobileFilterClose = document.getElementById('mobileFilterClose');
  const mobileFilterBackdrop = document.querySelector('.mobile-filter-backdrop');
  
  if (mobileFilterBtn && mobileFilterDrawer) {
    mobileFilterBtn.addEventListener('click', function() {
      mobileFilterDrawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    function closeFilterDrawer() {
      mobileFilterDrawer.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    if (mobileFilterClose) {
      mobileFilterClose.addEventListener('click', closeFilterDrawer);
    }
    
    if (mobileFilterBackdrop) {
      mobileFilterBackdrop.addEventListener('click', closeFilterDrawer);
    }
  }
  
  // ============================================
  // CATEGORY FILTER (Catalog Page)
  // ============================================
  const categoryBtns = document.querySelectorAll('.category-btn');
  const categorySections = document.querySelectorAll('.category-section-wrapper');
  
  if (categoryBtns.length > 0) {
    categoryBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        const category = this.dataset.category;
        
        // Update active button
        categoryBtns.forEach(function(b) {
          b.classList.remove('active');
        });
        this.classList.add('active');
        
        // Update URL without reload
        if (category === 'all') {
          history.pushState({}, '', 'catalog.html');
        } else {
          history.pushState({}, '', 'catalog.html?category=' + category);
        }
        
        // Show/hide sections
        if (category === 'all') {
          categorySections.forEach(function(section) {
            section.style.display = 'block';
          });
        } else {
          categorySections.forEach(function(section) {
            if (section.dataset.category === category) {
              section.style.display = 'block';
            } else {
              section.style.display = 'none';
            }
          });
        }
        
        // Close mobile filter if open
        if (mobileFilterDrawer) {
          mobileFilterDrawer.classList.remove('active');
          document.body.style.overflow = '';
        }
        
        // Scroll to top of catalog
        window.scrollTo({ top: 200, behavior: 'smooth' });
      });
    });
    
    // Check URL params on load
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    if (categoryParam) {
      const targetBtn = document.querySelector('.category-btn[data-category="' + categoryParam + '"]');
      if (targetBtn) {
        targetBtn.click();
      }
    }
  }
  
  // ============================================
  // SEARCH FILTER (Catalog Page)
  // ============================================
  const searchInput = document.getElementById('catalogSearch');
  const productCards = document.querySelectorAll('.product-card');
  
  if (searchInput && productCards.length > 0) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase().trim();
      
      productCards.forEach(function(card) {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('.product-description').textContent.toLowerCase();
        const category = card.querySelector('.product-category-badge').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm)) {
          card.closest('.product-card').style.display = 'block';
        } else {
          card.closest('.product-card').style.display = 'none';
        }
      });
    });
  }
  
  // ============================================
  // CONTACT FORM HANDLING
  // ============================================
  const contactForm = document.getElementById('contactForm');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(contactForm);
      const name = formData.get('name');
      const phone = formData.get('phone');
      const product = formData.get('product');
      const message = formData.get('message');
      
      // Create WhatsApp message
      const whatsappMessage = `Hello WoodenMax!%0A%0AName: ${name}%0APhone: ${phone}%0AProduct Interest: ${product}%0AMessage: ${message}`;
      
      // Open WhatsApp
      window.open(`https://wa.me/917895328080?text=${whatsappMessage}`, '_blank');
      
      // Reset form
      contactForm.reset();
      
      // Show success message (optional)
      alert('Thank you for your enquiry! We will contact you soon.');
    });
  }
  
  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
  
  // ============================================
  // INTERSECTION OBSERVER FOR ANIMATIONS
  // ============================================
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe elements with data-animate attribute
  document.querySelectorAll('[data-animate]').forEach(function(el) {
    el.style.opacity = '0';
    observer.observe(el);
  });

});

