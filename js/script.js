(function () {
  'use strict';

  /* =========================================================
     Theme toggle (dark default, saved to localStorage)
     ========================================================= */
  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');
  var THEME_KEY = 'napoleao-dev-theme';

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    }
  }

  var storedTheme = null;
  try { storedTheme = localStorage.getItem(THEME_KEY); } catch (e) { /* storage unavailable */ }
  applyTheme(storedTheme === 'light' ? 'light' : 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var isLight = root.getAttribute('data-theme') === 'light';
      var next = isLight ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable */ }
    });
  }

  /* =========================================================
     Mobile menu
     ========================================================= */
  var menuToggle = document.getElementById('menu-toggle');
  var mainNav = document.getElementById('main-nav');

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menu');
        document.body.style.overflow = '';
      });
    });
  }

  /* =========================================================
     Header scroll state
     ========================================================= */
  var header = document.getElementById('site-header');
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* =========================================================
     Back to top button
     ========================================================= */
  var backToTop = document.getElementById('back-to-top');
  function onScrollBackToTop() {
    if (!backToTop) return;
    backToTop.classList.toggle('is-visible', window.scrollY > 600);
  }
  window.addEventListener('scroll', onScrollBackToTop, { passive: true });
  onScrollBackToTop();
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =========================================================
     Typewriter — single orchestrated hero moment
     ========================================================= */
  var typewriterEl = document.getElementById('typewriter');
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typewriterEl) {
    var phrase = 'Software Developer';
    if (prefersReducedMotion) {
      typewriterEl.textContent = phrase;
    } else {
      var i = 0;
      var typeSpeed = 55;
      (function type() {
        if (i <= phrase.length) {
          typewriterEl.textContent = phrase.slice(0, i);
          i++;
          setTimeout(type, typeSpeed);
        }
      })();
    }
  }

  /* =========================================================
     Scroll reveal — IntersectionObserver
     ========================================================= */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* =========================================================
     Scroll hint — jump to About
     ========================================================= */
  var scrollHint = document.getElementById('scroll-hint');
  if (scrollHint) {
    scrollHint.addEventListener('click', function () {
      var target = document.getElementById('sobre');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* =========================================================
     Footer year
     ========================================================= */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

})();
