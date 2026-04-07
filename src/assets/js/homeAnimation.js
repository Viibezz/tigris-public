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
    if (!entry.isIntersecting) return;
    entry.target.classList.add("inview");
    observer.unobserve(entry.target);

    // If this is a trio col, reveal its value heading after the parent fades in
    const heading = entry.target.querySelector('.value-heading');
    if (heading) {
      const siblings = entry.target.parentElement
        ? Array.from(entry.target.parentElement.children)
        : [];
      const idx = Math.max(siblings.indexOf(entry.target), 0);
      // Desktop: start wipe immediately alongside parent fade (no blank period), staggered
      // Mobile: cols appear one at a time so wait until parent is mostly visible
      const isDesktop = window.matchMedia('(min-width: 992px)').matches;
      const delay = isDesktop ? idx * 200 : 600;
      setTimeout(() => heading.classList.add('inview'), delay);
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

