/* ============================================
   SAI INNOVATION - MAIN JAVASCRIPT
   All Interactions & Animations
   ============================================ */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  
  // ============================================
  // NAVBAR SCROLL EFFECT
  // ============================================
  const navbar = document.getElementById('navbar');
  
  function handleNavbarScroll() {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  
  window.addEventListener('scroll', handleNavbarScroll);
  handleNavbarScroll(); // Check on load
  
  // ============================================
  // CATEGORY CAROUSEL IN HEADER (Smooth Sliding)
  // ============================================
  const categoryCarousel = document.getElementById('categoryCarousel');
  const catPrev = document.getElementById('catPrev');
  const catNext = document.getElementById('catNext');
  
  if (categoryCarousel && catPrev && catNext) {
    const catItems = categoryCarousel.querySelectorAll('.cat-item');
    const totalCategories = catItems.length;
    
    // Detect current page and set initial active category
    const currentPath = window.location.pathname.toLowerCase();
    let currentCatIndex = 0;
    let previousCatIndex = 0;
    let isAnimating = false;
    
    // Category mapping based on URL path
    const categoryMap = {
      'upvc': 0,
      'aluminium': 1,
      'telescope': 2,
      'folding': 3,
      'louver': 4,
      'metal-louver': 4,
      'shower': 5,
      'elevation': 6,
      'cladding': 6,
      'glass': 7
    };
    
    // Find matching category from URL
    for (const [keyword, index] of Object.entries(categoryMap)) {
      if (currentPath.includes(keyword)) {
        currentCatIndex = index;
        previousCatIndex = index;
        break;
      }
    }
    
    // Smooth easing function (like car brakes)
    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }
    
    // Smooth scroll to position with custom easing
    function smoothScrollTo(targetPos, duration) {
      const startPos = categoryCarousel.scrollLeft;
      const distance = targetPos - startPos;
      const startTime = performance.now();
      
      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        
        categoryCarousel.scrollLeft = startPos + (distance * easedProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          isAnimating = false;
        }
      }
      
      requestAnimationFrame(animate);
    }
    
    function updateCarousel(direction) {
      if (isAnimating) return;
      isAnimating = true;
      
      // Determine slide direction
      const slideDirection = direction || (currentCatIndex > previousCatIndex ? 'right' : 'left');
      
      catItems.forEach((item, index) => {
        // Remove all classes first
        item.classList.remove('active', 'near', 'sliding-left', 'sliding-right');
        
        // Calculate relative position
        let diff = index - currentCatIndex;
        
        // Handle wrap-around
        if (diff > totalCategories / 2) diff -= totalCategories;
        if (diff < -totalCategories / 2) diff += totalCategories;
        
        if (diff === 0) {
          item.classList.add('active');
          // Add slide animation class
          if (slideDirection === 'right') {
            item.classList.add('sliding-left');
          } else if (slideDirection === 'left') {
            item.classList.add('sliding-right');
          }
        } else if (Math.abs(diff) === 1) {
          item.classList.add('near');
        }
      });
      
      // Smooth scroll to center the active item (car brake effect)
      const activeItem = catItems[currentCatIndex];
      if (activeItem) {
        const containerWidth = categoryCarousel.offsetWidth;
        const itemLeft = activeItem.offsetLeft;
        const itemWidth = activeItem.offsetWidth;
        const targetScroll = itemLeft - (containerWidth / 2) + (itemWidth / 2);
        
        // Use custom smooth scroll with easing (600ms duration for smooth brake feel)
        smoothScrollTo(targetScroll, 600);
      }
      
      previousCatIndex = currentCatIndex;
      
      // Remove animation classes after animation completes
      setTimeout(() => {
        catItems.forEach(item => {
          item.classList.remove('sliding-left', 'sliding-right');
        });
      }, 600);
    }
    
    // Arrow navigation with direction
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
    
    // Click on item - smooth slide to that item
    catItems.forEach((item, index) => {
      item.addEventListener('click', function(e) {
        if (isAnimating || index === currentCatIndex) return;
        
        const direction = index > currentCatIndex ? 'right' : 'left';
        currentCatIndex = index;
        updateCarousel(direction);
      });
    });
    
    // Initialize with correct category selected (no animation on load)
    isAnimating = false;
    catItems.forEach((item, index) => {
      item.classList.remove('active', 'near');
      let diff = index - currentCatIndex;
      if (diff > totalCategories / 2) diff -= totalCategories;
      if (diff < -totalCategories / 2) diff += totalCategories;
      
      if (diff === 0) item.classList.add('active');
      else if (Math.abs(diff) === 1) item.classList.add('near');
    });
    
    // Initial scroll position (instant, no animation)
    const activeItem = catItems[currentCatIndex];
    if (activeItem) {
      const targetScroll = activeItem.offsetLeft - (categoryCarousel.offsetWidth / 2) + (activeItem.offsetWidth / 2);
      categoryCarousel.scrollLeft = targetScroll;
    }
  }
  
  // ============================================
  // MOBILE MENU TOGGLE
  // ============================================
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuIcon = document.getElementById('menuIcon');
  const closeIcon = document.getElementById('closeIcon');
  
  let isMobileMenuOpen = false;
  
  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
    
    if (isMobileMenuOpen) {
      if (mobileMenu) mobileMenu.classList.add('active');
      if (menuIcon) menuIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'block';
      document.body.style.overflow = 'hidden';
    } else {
      if (mobileMenu) mobileMenu.classList.remove('active');
      if (menuIcon) menuIcon.style.display = 'block';
      if (closeIcon) closeIcon.style.display = 'none';
      document.body.style.overflow = '';
    }
  }
  
  function closeMobileMenu() {
    isMobileMenuOpen = false;
    if (mobileMenu) mobileMenu.classList.remove('active');
    if (menuIcon) menuIcon.style.display = 'block';
    if (closeIcon) closeIcon.style.display = 'none';
    document.body.style.overflow = '';
  }
  
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMobileMenu();
    });
    
    // Close menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(function(link) {
      link.addEventListener('click', closeMobileMenu);
    });
    
    // Close on background click (outside content)
    mobileMenu.addEventListener('click', function(e) {
      if (e.target === mobileMenu || e.target.classList.contains('mobile-menu-bg')) {
        closeMobileMenu();
      }
    });
  }
  
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
    
    // Auto-play
    function startAutoPlay() {
      autoPlayInterval = setInterval(nextSlide, 6000);
    }
    
    function resetAutoPlay() {
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
      const whatsappMessage = `Hello Sai Innovation!%0A%0AName: ${name}%0APhone: ${phone}%0AProduct Interest: ${product}%0AMessage: ${message}`;
      
      // Open WhatsApp
      window.open(`https://wa.me/919540400034?text=${whatsappMessage}`, '_blank');
      
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
  // SCROLL TO TOP ON PAGE LOAD
  // ============================================
  window.scrollTo(0, 0);
  
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

