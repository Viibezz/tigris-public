class TigrisGallery {
  constructor() {
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.setupScrollAnimations();
    this.setupHoverEffects();
    this.setupAccessibility();
    this.setupPerformanceOptimizations();
  }

  // Lazy loading with intersection observer
  setupLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const card = img.closest('.gallery-card');
          
          img.addEventListener('load', () => {
            card.classList.add('image-loaded');
          });
          
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });

    document.querySelectorAll('.gallery-image').forEach(img => {
      imageObserver.observe(img);
    });
  }

  // Scroll-based reveal animations
  setupScrollAnimations() {
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px'
    });

    // Animate gallery items
    document.querySelectorAll('.gallery-item').forEach((item, index) => {
      item.style.setProperty('--animation-delay', `${index * 0.05}s`);
      scrollObserver.observe(item);
    });

    // Animate hero section
    const heroContent = document.querySelector('.gallery-hero-content');
    if (heroContent) {
      scrollObserver.observe(heroContent);
    }
  }

  // Enhanced hover effects with parallax
  setupHoverEffects() {
    document.querySelectorAll('.gallery-card').forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        this.activateHover(card);
      });

      card.addEventListener('mouseleave', (e) => {
        this.deactivateHover(card);
      });

      card.addEventListener('mousemove', (e) => {
        this.handleMouseMove(e, card);
      });
    });
  }

  activateHover(card) {
    card.classList.add('hovered');
    const image = card.querySelector('.gallery-image');
    const overlay = card.querySelector('.gallery-overlay');
    
    if (image) {
      image.style.willChange = 'transform';
    }
    
    if (overlay) {
      overlay.style.willChange = 'transform, opacity';
    }
  }

  deactivateHover(card) {
    card.classList.remove('hovered');
    const image = card.querySelector('.gallery-image');
    const overlay = card.querySelector('.gallery-overlay');
    
    if (image) {
      image.style.transform = '';
      image.style.willChange = 'auto';
    }
    
    if (overlay) {
      overlay.style.transform = '';
      overlay.style.willChange = 'auto';
    }
  }

  handleMouseMove(e, card) {
    if (!card.classList.contains('hovered')) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const image = card.querySelector('.gallery-image');
    const overlay = card.querySelector('.gallery-overlay');
    
    // Subtle parallax effect
    const moveX = (x - 0.5) * 10;
    const moveY = (y - 0.5) * 10;
    
    if (image) {
      image.style.transform = `scale(1.1) translate(${moveX}px, ${moveY}px)`;
    }
    
    if (overlay) {
      overlay.style.transform = `translate(${-moveX * 0.5}px, ${-moveY * 0.5}px)`;
    }
  }

  // Accessibility enhancements
  setupAccessibility() {
    // Keyboard navigation
    document.querySelectorAll('.gallery-link').forEach(link => {
      link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          link.click();
        }
      });
    });

    // Screen reader improvements
    document.querySelectorAll('.gallery-item').forEach((item, index) => {
      const link = item.querySelector('.gallery-link');
      if (link) {
        link.setAttribute('aria-describedby', `gallery-item-${index}`);
      }
    });
  }

  // Performance optimizations
  setupPerformanceOptimizations() {
    // Throttle scroll events
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Add any scroll-based effects here
          ticking = false;
        });
        ticking = true;
      }
    };

    // Passive event listeners for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Preload next images on hover
    document.querySelectorAll('.gallery-link').forEach(link => {
      link.addEventListener('mouseenter', () => {
        const fullImage = link.getAttribute('href');
        if (fullImage && !link.dataset.preloaded) {
          const img = new Image();
          img.src = fullImage;
          link.dataset.preloaded = 'true';
        }
      }, { once: true });
    });
  }

  // Handle reduced motion preferences
  respectReducedMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('reduce-motion');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const gallery = new TigrisGallery();
  gallery.respectReducedMotion();
  // Access the inlined gallery data
  const galleryItems = window.tigrisGalleryItems;

  if (galleryItems) {
    // console.log('Gallery data accessed from inlined script:', galleryItems);
  } else {
    console.warn('Inlined gallery data (window.tigrisGalleryItems) not found.');
  }

  // Fancybox initialization
  if (typeof Fancybox !== 'undefined') {
    Fancybox.bind("[data-fancybox='gallery']", {
      Toolbar: {
        display: {
          left: ["infobar"],
          middle: [
            "zoomIn",
            "zoomOut",
            "toggle1to1",
            "rotateCCW",
            "rotateCW",
            "flipX",
            "flipY",
          ],
          right: ["slideshow", "thumbs", "close"],
        },
      },
      Thumbs: {
        autoStart: false,
      },
      animated: true,
      hideScrollbar: false,
    });
    console.log('Fancybox initialized for gallery.');
  } else {
    console.warn('Fancybox not loaded.');
  }
});

// Export for global access
window.TigrisGallery = TigrisGallery;