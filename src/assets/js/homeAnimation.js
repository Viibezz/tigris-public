// === Home page motion/perf helpers ===
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLarge = () => window.matchMedia('(min-width: 992px)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    if (!prefersReduced && isLarge() && window.jarallax) {
      document.querySelectorAll('.jarallax').forEach(el => {
        window.jarallax(el, { speed: 0.3, imgPosition: '50% 50%', disableParallax: /iPad|iPhone|iPod|Android/ });
      });
    }

    // Pause hero video if user prefers reduced motion
    const heroVideo = document.querySelector('.hero .hero-video');
    if (heroVideo && prefersReduced) {
      heroVideo.pause();
    }
  });
})();

const appearElements = document.querySelectorAll(".scroll-animate");
const cb3 = function (entries, observer) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("inview");
      observer.unobserve(entry.target);
    }
  });
};
const io3 = new IntersectionObserver(cb3);
appearElements.forEach((element) => io3.observe(element));

// Scroll progress bar
(function () {
  const fill = document.querySelector('.scroll-progress-fill');
  if (!fill) return;
  const html = document.documentElement;
  window.addEventListener('scroll', function () {
    const pct = html.scrollTop / (html.scrollHeight - html.clientHeight) * 100;
    fill.style.width = (pct || 0) + '%';
  }, { passive: true });
})();
