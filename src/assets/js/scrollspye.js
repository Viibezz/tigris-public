/* Function to scroll to a section based on sectionId */
export function scrollToSection(sectionId) {
  const targetSection = document.getElementById(sectionId);
  if (!targetSection) return;

  const scrollWithOffset = () => {
    const mainNavHeight = document.querySelector("header")?.offsetHeight || 0;
    const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
    const offsetTop = targetSection.getBoundingClientRect().top + window.pageYOffset - navHeight + mainNavHeight - (mainNavHeight * 0.40);

    window.scrollTo({
      top: offsetTop,
      behavior: "smooth"
    });
  };

  // First scroll: slight delay to wait for event bubbling/layout
  setTimeout(() => {
    scrollWithOffset();

    // Second scroll: gives time for layout shifts (e.g. images/fonts)
    setTimeout(() => {
      scrollWithOffset(); // recalculate position
    }, 500); // tweak this if needed
  }, 50);
}

export function scrollspyeHighlight() {
  /* Highlight Active Item in Scrollspy */
  const navItems = document.querySelectorAll("#menu-nav li");
  const sections = document.querySelectorAll("section");
  const scrollToMenuElements = document.getElementsByClassName("scrollToMenu");
  // Highlight the salads category by default
  // if (navItems[0]) {
  //   navItems[0].classList.add("active");
  // }
  // Check if URL contains a scrollTo parameter to navigate to a specific section
  const params = new URLSearchParams(window.location.search);
  const sectionId = params.get('scrollTo');
  if (sectionId) {
    setTimeout(() => scrollToSection(sectionId), 300);
  }

  /* Element Listeners */
  // onclick element listener to scroll down to category section
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetId = item.getAttribute("data-target");
      scrollToSection(targetId);
    });
  });
  Array.from(scrollToMenuElements).forEach(el => {
    el.addEventListener("click", () => scrollToSection("salads"));
  });

  /* Scrollspy Intersection Observer: Highlight the active nav item */
  const navHeight = document.querySelector('.navbar').offsetHeight;
  const observerOptions = {
    root: null,
    rootMargin: `-${navHeight}px 0px 0px 0px`,                // Offset by the navbar height since it's fixed
                                                              // negative top margin ensures intersection considers 
                                                              // the visible area below the navbar.
    threshold: Array.from({ length: 101 }, (_, i) => i / 100) // 0.00, 0.01 ..., 1.00
                                                              // the observer triggers continuously
                                                              // and we get smooth intersection changes.
  };

  let visibleSections = {};   // track category sections currently in view and their intersection info
                              // visibleSections  {category-SALADS: {intersectionRatio: 9, top: 30 }}
  let currentActiveId = null; // track which category section is currently active

  const observer = new IntersectionObserver((entries) => {
    // for each section that enters/exits the viewport
    entries.forEach(entry => {
      // if section is intersecting
      const id = entry.target.id;
      if (entry.isIntersecting) {
        // track the visible section's:
        visibleSections[id] = {
          ratio: entry.intersectionRatio,   // intersectionRatio (how much the section is visible from 0 to 1)
          top: entry.boundingClientRect.top // top position in the viewport (0 = at top; >0 = below; <0 = above)
        };
      }
      // if section is not in viewport anymore, remove it from tracking
      else {
        delete visibleSections[id];
      }
    });

    // to batch updates smoothly
    window.requestAnimationFrame(() => {
      // wait until next animation frame before processing the
      // visible sections to prevent flickering of active nav item
      const visibleList = Object.entries(visibleSections); // [ ["category-SALADS", { intersectionRatio: 9, top: 30 }] ]
      if (visibleList.length === 0) return;

      // Sort visible sections by:
      // 1. Highest ratio (Primary sort)
      // 2. Closest to top of viewport (fallback sort, if ratio is similar)
      visibleList.sort((a, b) => {
        const ratioDiff = b[1].ratio - a[1].ratio;
        if (Math.abs(ratioDiff) > 1) return ratioDiff;
        // visiblity is similar since difference < 1,
        // use the section closest to the top
        return Math.abs(a[1].top) - Math.abs(b[1].top);
      });

      // if navitem not change then activate it
      const topVisibleId = visibleList[0][0];
      if (topVisibleId !== currentActiveId) {
        currentActiveId = topVisibleId;

        navItems.forEach(item => {
          const isActive = item.getAttribute("data-target") === topVisibleId;
          item.classList.toggle("active", isActive);
          if (isActive) {
            item.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        });
      }
    });
  }, observerOptions);
  // Observe each category section, highlighting the active nav item when scrolling
  sections.forEach(section => observer.observe(section));
 }
