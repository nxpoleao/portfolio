(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* =========================================================
     Tema (escuro por padrão; preferência salva em localStorage)
     O atributo inicial é aplicado no <head> para não piscar.
     ========================================================= */
  var THEME_KEY = 'napoleao-dev-theme';
  var themeToggle = document.getElementById('theme-toggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    var light = theme === 'light';
    if (light) root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    if (themeToggle) themeToggle.setAttribute('aria-pressed', light ? 'true' : 'false');
    if (themeMeta) themeMeta.setAttribute('content', light ? '#f6f6f3' : '#0b0d11');
  }

  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage indisponível */ }
    });
  }

  /* =========================================================
     Menu mobile — Esc fecha, foco volta ao botão,
     o restante da página fica inerte enquanto aberto.
     ========================================================= */
  var menuToggle = document.getElementById('menu-toggle');
  var menuLabel = document.getElementById('menu-toggle-label');
  var mainNav = document.getElementById('main-nav');
  var inertTargets = [document.getElementById('main'), document.querySelector('.site-footer')];

  function setMenu(open, returnFocus) {
    if (!menuToggle || !mainNav) return;
    mainNav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (menuLabel) menuLabel.textContent = open ? 'Fechar menu' : 'Abrir menu';
    document.body.style.overflow = open ? 'hidden' : '';
    inertTargets.forEach(function (el) { if (el) el.inert = open; });
    if (open) {
      var first = mainNav.querySelector('a');
      if (first) first.focus();
    } else if (returnFocus) {
      menuToggle.focus();
    }
  }

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function () {
      setMenu(!mainNav.classList.contains('is-open'), false);
    });
    mainNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false, false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) setMenu(false, true);
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (mq) {
      if (mq.matches) setMenu(false, false);
    });
  }

  /* =========================================================
     Header + botão "voltar ao topo" (um único listener de scroll)
     ========================================================= */
  var header = document.getElementById('site-header');
  var backToTop = document.getElementById('back-to-top');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (backToTop) backToTop.classList.toggle('is-visible', y > 900);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  }

  /* =========================================================
     Scrollspy — destaca a seção atual no menu e mostra o
     "caminho" dela ao lado do logo (~/projetos, ~/stack…)
     ========================================================= */
  var brandPath = document.getElementById('brand-path');
  var navLinks = mainNav ? Array.prototype.slice.call(mainNav.querySelectorAll('a')) : [];
  var spySections = Array.prototype.slice.call(document.querySelectorAll('main section[data-path]'));

  function setCurrent(section) {
    var id = section ? section.id : null;
    navLinks.forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    if (brandPath) brandPath.textContent = section ? section.getAttribute('data-path') : '~/';
  }

  if ('IntersectionObserver' in window && spySections.length) {
    var visible = new Map();
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.set(entry.target, entry.intersectionRatio);
        else visible.delete(entry.target);
      });
      var current = null;
      spySections.forEach(function (s) { if (visible.has(s)) current = current || s; });
      setCurrent(current);
    }, { rootMargin: '-45% 0px -50% 0px' });
    spySections.forEach(function (s) { spy.observe(s); });
  }

  /* =========================================================
     Revelação ao rolar
     ========================================================= */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* =========================================================
     Hero — "Executar" enzo.py
     A saída é o repr real que a dataclass imprimiria.
     ========================================================= */
  var runBtn = document.getElementById('run-btn');
  var output = document.getElementById('code-output');
  var REPR = "Engineer(name='Enzo Napoleão', role='Software Engineer', focus=('backend', 'python', 'sistemas', 'automação'))";
  var running = false;

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function renderOutput(partial, done) {
    output.textContent = '';
    output.appendChild(el('span', 'prompt', '$ '));
    output.appendChild(document.createTextNode('python enzo.py\n'));
    var body = el('span', done ? '' : 'cursor', partial);
    output.appendChild(body);
    if (done) {
      output.appendChild(document.createTextNode('\n'));
      output.appendChild(el('span', 'ok', '✓ exit 0'));
    }
  }

  if (runBtn && output) {
    runBtn.addEventListener('click', function () {
      if (running) return;
      running = true;
      runBtn.setAttribute('aria-busy', 'true');
      output.hidden = false;

      if (reduceMotion.matches) {
        renderOutput(REPR, true);
        running = false;
        runBtn.removeAttribute('aria-busy');
        return;
      }

      var i = 0;
      renderOutput('', false);
      setTimeout(function step() {
        i = Math.min(REPR.length, i + 3);
        renderOutput(REPR.slice(0, i), i === REPR.length);
        if (i < REPR.length) setTimeout(step, 16);
        else { running = false; runBtn.removeAttribute('aria-busy'); }
      }, 280);
    });
  }

  /* =========================================================
     Stack → projetos: passar o mouse numa tecnologia acende
     os projetos em que ela aparece.
     ========================================================= */
  var layers = document.getElementById('layers');
  if (layers) {
    var caseLinks = layers.querySelectorAll('.layer-cases a[data-case]');
    function light(ids) {
      caseLinks.forEach(function (a) {
        a.classList.toggle('is-lit', ids.indexOf(a.getAttribute('data-case')) !== -1);
      });
    }
    layers.addEventListener('pointerover', function (e) {
      var li = e.target.closest('li[data-cases]');
      light(li ? li.getAttribute('data-cases').split(' ') : []);
    });
    layers.addEventListener('pointerleave', function () { light([]); });
  }

  /* =========================================================
     Copiar e-mail (só aparece se a Clipboard API existir)
     ========================================================= */
  var copyBtn = document.getElementById('copy-email');
  var copyStatus = document.getElementById('copy-status');
  if (copyBtn && navigator.clipboard && window.isSecureContext) {
    copyBtn.hidden = false;
    var copyLabel = copyBtn.querySelector('.copy-label');
    var resetTimer;
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(copyBtn.getAttribute('data-copy')).then(function () {
        copyBtn.classList.add('is-done');
        copyLabel.textContent = 'Copiado';
        copyStatus.textContent = 'E-mail copiado para a área de transferência.';
      }, function () {
        copyLabel.textContent = 'Não foi possível copiar';
        copyStatus.textContent = 'Não foi possível copiar o e-mail.';
      });
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () {
        copyBtn.classList.remove('is-done');
        copyLabel.textContent = 'Copiar e-mail';
        copyStatus.textContent = '';
      }, 2400);
    });
  }

  /* =========================================================
     Ano do rodapé
     ========================================================= */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* =========================================================
     Para quem abre o DevTools
     ========================================================= */
  if (window.console && console.log) {
    console.log(
      '%c<N>%c napoleao.dev\n%cVocê abriu o console, então fala a minha língua.\nhttps://github.com/nxpoleao',
      'color:#5b8fff;font:600 16px monospace',
      'color:#eceef2;font:500 14px monospace',
      'color:#a3a9b7;font:12px monospace'
    );
  }
})();
