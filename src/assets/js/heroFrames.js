/**
 * heroFrames.js
 * Scroll-driven JPEG frame sequence for the home hero.
 * Requires GSAP + ScrollTrigger loaded before this script.
 */
(function () {
  'use strict';

  var FRAME_COUNT = 145;
  var FRAME_BASE  = (window.__SITE_URL__ || '/') + 'assets/images/hero/frames/frame-';

  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d', { alpha: false });
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Sizing ----------------------------------------------------------------
  // Set initial dimensions immediately so the canvas occupies space.
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  var currentFrame = 0;

  function coverDraw(img) {
    if (!img || !img.complete || !img.naturalWidth) return;
    var cw = canvas.width,  ch = canvas.height;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var scale = Math.max(cw / iw, ch / ih);
    var w = iw * scale, h = ih * scale;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  function drawCurrent() { coverDraw(images[currentFrame]); }

  function onResize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    drawCurrent();
  }

  window.addEventListener('resize', onResize, { passive: true });

  // ── Frame preloading ------------------------------------------------------
  var images = new Array(FRAME_COUNT);

  function pad(i) { return String(i + 1).padStart(4, '0'); }

  function loadFrame(i) {
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      images[i] = img;
      if (i === 0) coverDraw(img); // draw first frame as soon as it arrives
    };
    img.src = FRAME_BASE + pad(i) + '.jpeg';
  }

  // Frame 0 — high priority, starts immediately.
  loadFrame(0);

  // Remaining frames — defer to keep bandwidth free for frame 0 + critical assets.
  var idle = window.requestIdleCallback || function (cb) { setTimeout(cb, 150); };
  idle(function () {
    for (var i = 1; i < FRAME_COUNT; i++) loadFrame(i);
  });

  // ── Reduced motion: static frame 0, no animation -------------------------
  if (prefersReduced) return;

  // ── GSAP ScrollTrigger ----------------------------------------------------
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('heroFrames: GSAP / ScrollTrigger not found.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    trigger : '.hero-scroll-track',
    start   : 'top top',
    end     : 'bottom bottom',
    scrub   : 0.5,

    // Snap to the very start or very end of the sequence so a partial
    // scroll doesn't strand the user mid-animation.
    snap: {
      snapTo   : [0, 1],
      duration : 0.4,
      ease     : 'power2.out', // matches cubic-bezier(.16, 1, .3, 1)
      delay    : 0.08,
    },

    onUpdate: function (self) {
      var idx = Math.min(
        FRAME_COUNT - 1,
        Math.round(self.progress * (FRAME_COUNT - 1))
      );
      if (idx !== currentFrame) {
        currentFrame = idx;
        coverDraw(images[idx]);
      }
    },
  });
})();
