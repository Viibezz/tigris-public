class ScrollbarModule {
  constructor(scrollId) {
    this.scrollContainer = document.querySelector(`.scroll-container[data-scrollbar-id="${scrollId}"]`);
    this.fakeScrollbar   = document.querySelector(`.fake-scrollbar[data-scrollbar-id="${scrollId}"]`);
    this.fakeThumb       = this.fakeScrollbar?.querySelector('.fake-thumb');

    if (!this.scrollContainer || !this.fakeScrollbar || !this.fakeThumb) return;

    // flags & state
    this.isDragging = false;              // thumb dragging
    this.isContainerDragging = false;     // container drag gesture started
    this.hasExceededDragThreshold = false;// actually dragging (moved past threshold)
    this.isScrolling = false;

    this.startX = 0;
    this.startScrollLeft = 0;
    this.containerDragStartX = 0;
    this.containerStartScrollLeft = 0;

    this.velocity = 0;
    this.lastClientX = 0;
    this.lastTimestamp = 0;
    this.momentumFrame = null;
    this.thumbAnimFrame = null;
    this.bounceTimeout = null;

    this.totalMomentumScrolled = 0;
    this.totalDragDistance = 0;

    // tuning
    this.SENSITIVITY   = 0.45;
    this.MAX_VELOCITY  = 0.6;
    this.FRICTION      = 0.6;
    this.DRAG_THRESHOLD = 6; // px before we consider it a drag and suppress clicks

    this.init();
  }

  clampVelocity(v, max) {
    if (Math.abs(v) <= max) return v;
    return v > 0 ? max + (v - max) * 0.1 : -max + (v + max) * 0.1;
  }

  init() {
    this.scrollContainer.addEventListener('scroll', () => this.onScroll());
    window.addEventListener('resize', () => this.handleResize());

    // Thumb drag
    this.fakeThumb.addEventListener('mousedown', (e) => this.startThumbDrag(e));
    document.addEventListener('mousemove', (e) => this.thumbDrag(e));
    document.addEventListener('mouseup',   ()  => this.endThumbDrag());

    this.fakeThumb.addEventListener('touchstart', (e) => this.startThumbDrag(e), { passive: false });
    document.addEventListener('touchmove',  (e) => this.thumbDrag(e), { passive: false });
    document.addEventListener('touchend',   ()  => this.endThumbDrag());

    // Container drag (do NOT preventDefault on start)
    this.scrollContainer.addEventListener('mousedown', (e) => this.startContainerDrag(e));
    document.addEventListener('mousemove', (e) => this.containerDrag(e));
    document.addEventListener('mouseup',   ()  => this.endContainerDrag());

    this.scrollContainer.addEventListener('touchstart', (e) => this.startContainerDrag(e), { passive: true });
    document.addEventListener('touchmove',  (e) => this.containerDrag(e), { passive: false });
    document.addEventListener('touchend',   ()  => this.endContainerDrag());

    // Suppress clicks only if we actually dragged past the threshold
    this.scrollContainer.addEventListener('click', (e) => {
      if (this.hasExceededDragThreshold) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    this.updateThumb();
    this.toggleScrollbar();
  }

  onScroll() {
    this.isScrolling = true;
    this.updateThumb();
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => (this.isScrolling = false), 80);
  }

  triggerBounce(direction) {
    const className = direction === 'left' ? 'bounce-left' : 'bounce-right';
    this.fakeThumb.classList.remove('bounce-left', 'bounce-right');
    this.fakeThumb.classList.add(className);
    clearTimeout(this.bounceTimeout);
    this.bounceTimeout = setTimeout(() => {
      this.fakeThumb.classList.remove(className);
    }, 300);
  }

  normalizeScroll(dx) {
    const scrollWidth   = this.scrollContainer.scrollWidth;
    const clientWidth   = this.scrollContainer.clientWidth;
    const maxScrollLeft = scrollWidth - clientWidth;

    const scrollbarWidth = this.fakeScrollbar.clientWidth;
    const thumbWidth     = this.fakeThumb.offsetWidth;
    const maxThumbLeft   = scrollbarWidth - thumbWidth;

    return (dx / maxThumbLeft) * maxScrollLeft;
  }

  // ===== Container dragging / swiping =====
  startContainerDrag(e) {
    this.totalMomentumScrolled = 0;
    this.totalDragDistance = 0;
    this.isContainerDragging = true;
    this.hasExceededDragThreshold = false;

    this.containerDragStartX = e.touches?.[0]?.clientX ?? e.clientX;
    this.containerStartScrollLeft = this.scrollContainer.scrollLeft;
    this.lastClientX = this.containerDragStartX;
    this.lastTimestamp = performance.now();
    this.velocity = 0;

    cancelAnimationFrame(this.momentumFrame);
  }

  containerDrag(e) {
    if (!this.isContainerDragging) return;

    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const dx = clientX - this.containerDragStartX;
    this.totalDragDistance = Math.abs(dx);

    // If we’ve moved enough, flip into "dragging" mode
    if (!this.hasExceededDragThreshold && Math.abs(dx) >= this.DRAG_THRESHOLD) {
      this.hasExceededDragThreshold = true;
      // prevent scroll-jank & accidental clicks while dragging
      document.body.style.userSelect = 'none';
      this.scrollContainer.classList.add('dragging');
    }

    // Only scroll & prevent default once we're truly dragging
    if (this.hasExceededDragThreshold) {
      e.preventDefault(); // needed for touch to stop native scroll
      const adjustedDx = dx * this.SENSITIVITY;
      const delta = this.normalizeScroll(adjustedDx);
      const newScrollLeft = this.containerStartScrollLeft - delta;

      const scrollWidth = this.scrollContainer.scrollWidth;
      const clientWidth = this.scrollContainer.clientWidth;
      const maxScrollLeft = scrollWidth - clientWidth;

      if (newScrollLeft <= 0) {
        this.scrollContainer.scrollLeft = 0;
        this.triggerBounce('left');
      } else if (newScrollLeft >= maxScrollLeft) {
        this.scrollContainer.scrollLeft = maxScrollLeft;
        this.triggerBounce('right');
      } else {
        this.scrollContainer.scrollLeft = newScrollLeft;
      }
    }

    // velocity for momentum
    const now = performance.now();
    const dt = now - this.lastTimestamp || 16;
    this.velocity = (this.lastClientX - clientX) / dt;
    this.lastClientX = clientX;
    this.lastTimestamp = now;
  }

  endContainerDrag() {
    if (!this.isContainerDragging) return;
    this.isContainerDragging = false;

    // cleanup UI
    document.body.style.userSelect = '';
    this.scrollContainer.classList.remove('dragging');

    // If we didn’t drag past threshold, do nothing—native click will fire
    if (!this.hasExceededDragThreshold) return;

    // Momentum only after an actual drag
    const maxMomentumDistance = Math.min(300, this.totalDragDistance);
    this.velocity = this.clampVelocity(this.velocity, this.MAX_VELOCITY);
    this.momentumDistanceCap = maxMomentumDistance;

    if (Math.abs(this.velocity) > 0.01) {
      this.momentumScroll();
    }

    // After click phase has passed, clear suppression
    setTimeout(() => (this.hasExceededDragThreshold = false), 0);
  }

  momentumScroll() {
    const maxScrollLeft = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;
    const now = performance.now();
    const dt = now - this.lastTimestamp || 16;
    this.lastTimestamp = now;

    this.velocity *= Math.pow(this.FRICTION, dt / 16);
    const scrollDelta = this.velocity * dt;
    this.totalMomentumScrolled += Math.abs(scrollDelta);

    if (this.totalMomentumScrolled >= this.momentumDistanceCap || Math.abs(scrollDelta) < 0.5) {
      this.velocity = 0;
    }

    let newScrollLeft = this.scrollContainer.scrollLeft + scrollDelta;
    if (newScrollLeft < 0) {
      newScrollLeft = 0; this.velocity = 0;
    } else if (newScrollLeft > maxScrollLeft) {
      newScrollLeft = maxScrollLeft; this.velocity = 0;
    }

    this.scrollContainer.scrollLeft = newScrollLeft;

    if (Math.abs(this.velocity) > 0.02) {
      this.momentumFrame = requestAnimationFrame(() => this.momentumScroll());
    } else {
      this.momentumFrame = null;
      this.totalMomentumScrolled = 0;
    }
  }

  // ===== Thumb dragging =====
  startThumbDrag(e) {
    e.preventDefault();
    this.isDragging = true;
    this.startX = e.touches?.[0]?.clientX ?? e.clientX;
    this.startScrollLeft = this.scrollContainer.scrollLeft;
    document.body.style.userSelect = 'none';
  }

  thumbDrag(e) {
    if (!this.isDragging) return;
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const dx = clientX - this.startX;
    const delta = this.normalizeScroll(dx);

    const maxScrollLeft = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;
    const newScrollLeft = this.startScrollLeft + delta;

    if (newScrollLeft <= 0) {
      this.scrollContainer.scrollLeft = 0; this.triggerBounce('left');
    } else if (newScrollLeft >= maxScrollLeft) {
      this.scrollContainer.scrollLeft = maxScrollLeft; this.triggerBounce('right');
    } else {
      this.scrollContainer.scrollLeft = newScrollLeft;
    }
  }

  endThumbDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;
    document.body.style.userSelect = '';
  }

  updateThumb() {
    cancelAnimationFrame(this.thumbAnimFrame);

    const scrollWidth   = this.scrollContainer.scrollWidth;
    const clientWidth   = this.scrollContainer.clientWidth;
    const scrollLeft    = this.scrollContainer.scrollLeft;
    const scrollbarWidth= this.fakeScrollbar.clientWidth;

    const scaleFactor = 0.3;
    const minWidth = 100;
    const rawWidth = (clientWidth / scrollWidth) * clientWidth;
    const thumbWidth = Math.max(rawWidth * scaleFactor, minWidth);
    this.fakeThumb.style.width = `${thumbWidth}px`;

    const maxScrollLeft = scrollWidth - clientWidth;
    const maxThumbLeft  = Math.max(scrollbarWidth - thumbWidth, 0);
    const targetLeft    = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * maxThumbLeft : 0;
    const clampedLeft   = Math.min(Math.max(targetLeft, 0), maxThumbLeft);

    this.fakeThumb.classList.remove('bounce-left', 'bounce-right');
    clearTimeout(this.bounceTimeout);

    const isUserInteracting = this.isDragging || this.isContainerDragging;

    if (isUserInteracting) {
      if (clampedLeft === 0) {
        this.fakeThumb.classList.add('bounce-left');
        this.bounceTimeout = setTimeout(() => this.fakeThumb.classList.remove('bounce-left'), 300);
      } else if (clampedLeft === maxThumbLeft) {
        this.fakeThumb.classList.add('bounce-right');
        this.bounceTimeout = setTimeout(() => this.fakeThumb.classList.remove('bounce-right'), 300);
      }
    }

    const animate = () => {
      const currentLeft = parseFloat(this.fakeThumb.style.left) || 0;
      const diff = clampedLeft - currentLeft;
      const easedLeft = currentLeft + diff * 0.15;
      this.fakeThumb.style.left = `${easedLeft}px`;

      if (Math.abs(diff) > 0.5 && (this.isDragging || this.isScrolling)) {
        this.thumbAnimFrame = requestAnimationFrame(animate);
      } else {
        this.fakeThumb.style.left = `${clampedLeft}px`;
      }
    };

    this.thumbAnimFrame = requestAnimationFrame(animate);
  }

  toggleScrollbar() {
    const shouldShow = this.scrollContainer.scrollWidth > this.scrollContainer.clientWidth;
    this.fakeScrollbar.style.display = shouldShow ? 'block' : 'none';
  }

  handleResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.updateThumb();
      this.toggleScrollbar();
    }, 100);
  }
}

// init
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.scroll-container[data-scrollbar-id]').forEach((el) => {
    const id = el.getAttribute('data-scrollbar-id');
    const instance = new ScrollbarModule(id);
    requestAnimationFrame(() => setTimeout(() => instance.updateThumb(), 50));
  });
});
