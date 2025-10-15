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
