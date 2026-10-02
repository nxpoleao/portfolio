(function () {
  'use strict';

  /* =========================================================
     Bit — mascote interativo
     Olha para o cursor, comenta cada seção, reage ao que o
     visitante faz (rodar o código, trocar o tema, copiar o
     e-mail…), pode ser arrastado e faz um tour pela página.
     ========================================================= */
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var smooth = function () { return reduceMotion.matches ? 'auto' : 'smooth'; };
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- montagem ---------- */
  var wrap = document.createElement('div');
  wrap.className = 'bit-wrap is-arriving';
  wrap.innerHTML =
    '<div class="bit-bubble" role="status" aria-live="polite"><span class="bit-name">bit</span><p class="bit-msg"></p><div class="bit-actions"></div></div>' +
    '<button class="bit" type="button" data-face="normal" aria-label="Bit, o mascote. Abrir atalhos" aria-haspopup="true">' +
    '<svg viewBox="0 0 64 76" aria-hidden="true">' +
      '<g class="bit-body">' +
        '<line class="bit-ant" x1="32" y1="8" x2="32" y2="16"/>' +
        '<rect class="bit-tip" x="28.5" y="2" width="7" height="7" rx="1.5"/>' +
        '<rect class="bit-arm bit-arm-l" x="3" y="34" width="7" height="14" rx="3.5"/>' +
        '<rect class="bit-arm bit-arm-r" x="54" y="34" width="7" height="14" rx="3.5"/>' +
        '<rect class="bit-foot" x="18" y="62" width="9" height="8" rx="3"/>' +
        '<rect class="bit-foot" x="37" y="62" width="9" height="8" rx="3"/>' +
        '<rect class="bit-shell" x="8" y="15" width="48" height="50" rx="13"/>' +
        '<rect class="bit-screen" x="14" y="22" width="36" height="27" rx="8"/>' +
        '<g class="bit-look">' +
          '<g class="bit-eyes-open"><rect class="bit-eye" x="22" y="29" width="6" height="9" rx="2"/><rect class="bit-eye" x="36" y="29" width="6" height="9" rx="2"/></g>' +
          '<g class="bit-eyes-happy"><path d="M21 36l4-5 4 5"/><path d="M35 36l4-5 4 5"/></g>' +
          '<g class="bit-eyes-sleep"><path d="M21 34h7"/><path d="M36 34h7"/></g>' +
          '<path class="bit-mouth-smile" d="M28.5 42.5q3.5 2.6 7 0"/>' +
          '<rect class="bit-mouth-o" x="30" y="40.5" width="4" height="5" rx="2"/>' +
        '</g>' +
        '<text class="bit-code" x="32" y="59.5" text-anchor="middle">&lt;/&gt;</text>' +
      '</g>' +
      '<g class="bit-zzz"><text x="52" y="12">z</text><text x="58" y="5">z</text></g>' +
    '</svg></button>';
  document.body.appendChild(wrap);
  root.classList.add('has-bit');

  var bit = $('.bit', wrap);
  var bubble = $('.bit-bubble', wrap);
  var msgEl = $('.bit-msg', wrap);
  var actionsEl = $('.bit-actions', wrap);
  setTimeout(function () { wrap.classList.remove('is-arriving'); }, 1000);

  /* ---------- rosto e gestos ---------- */
  var faceTimer;
  function face(f, ms) {
    clearTimeout(faceTimer);
    bit.setAttribute('data-face', f);
    if (ms) faceTimer = setTimeout(function () { if (!sleeping) bit.setAttribute('data-face', 'normal'); }, ms);
  }
  function gesture(cls) {
    if (reduceMotion.matches) return;
    bit.classList.remove(cls);
    void bit.offsetWidth;
    bit.classList.add(cls);
    setTimeout(function () { bit.classList.remove(cls); }, 900);
  }
  (function blink() {
    setTimeout(function () {
      if (bit.getAttribute('data-face') === 'normal') {
        bit.classList.add('is-blink');
        setTimeout(function () { bit.classList.remove('is-blink'); }, 130);
      }
      blink();
    }, 2600 + Math.random() * 3200);
  })();

  /* ---------- balão ---------- */
  var hideTimer, lastSaid = {}, spot = null;
  function clearSpot() { if (spot) { spot.classList.remove('bit-spot'); spot = null; } }
  function say(text, opts) {
    opts = opts || {};
    if (opts.key) {
      var now = Date.now();
      if (lastSaid[opts.key] && now - lastSaid[opts.key] < (opts.cooldown || 8000)) return;
      lastSaid[opts.key] = now;
    }
    if (sleeping && !opts.wake) return;
    msgEl.textContent = text;
    actionsEl.textContent = '';
    (opts.actions || []).forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = a.label;
      b.addEventListener('click', function (e) { e.stopPropagation(); a.fn(); });
      actionsEl.appendChild(b);
    });
    clearSpot();
    if (opts.spot) { spot = opts.spot; spot.classList.add('bit-spot'); }
    placeBubble();
    bubble.classList.add('is-open');
    if (opts.face) face(opts.face, opts.faceMs || 2200);
    if (opts.gesture) gesture(opts.gesture);
    clearTimeout(hideTimer);
    if (!opts.sticky) hideTimer = setTimeout(hide, opts.ms || (opts.actions ? 9000 : 5200));
  }
  function hide() { bubble.classList.remove('is-open'); clearSpot(); }
  bubble.addEventListener('pointerenter', function () { clearTimeout(hideTimer); });
  bubble.addEventListener('pointerleave', function () { if (!touring) hideTimer = setTimeout(hide, 2500); });
  function placeBubble() {
    var r = wrap.getBoundingClientRect();
    wrap.classList.toggle('is-left', r.left + r.width / 2 < window.innerWidth / 2);
    wrap.classList.toggle('is-below', r.top < 200);
  }

  /* ---------- olhar ---------- */
  var lookRaf = 0, target = null;
  function lookAt(x, y) {
    target = { x: x, y: y };
    if (lookRaf) return;
    lookRaf = requestAnimationFrame(function () {
      lookRaf = 0;
      var r = bit.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height * 0.45;
      var dx = target.x - cx, dy = target.y - cy;
      var d = Math.hypot(dx, dy) || 1;
      var k = Math.min(1, d / 220);
      bit.style.setProperty('--lx', (dx / d * 3.2 * k).toFixed(2) + 'px');
      bit.style.setProperty('--ly', (dy / d * 2.6 * k).toFixed(2) + 'px');
      if (d < 90 && bit.getAttribute('data-face') === 'normal' && !dragging) face('happy', 900);
    });
  }
  document.addEventListener('pointermove', function (e) { lookAt(e.clientX, e.clientY); }, { passive: true });
  function lookAtEl(el) {
    var r = el.getBoundingClientRect();
    lookAt(r.left + r.width / 2, r.top + r.height / 2);
  }

  /* ---------- sono ---------- */
  var sleeping = false, idleTimer;
  function wakeUp() {
    clearTimeout(idleTimer);
    if (sleeping) {
      sleeping = false;
      face('surprised', 1200);
      gesture('is-shake');
      say('Hã? Tô acordado! Tava só compilando.', { wake: true, key: 'wake', cooldown: 1000 });
    }
    idleTimer = setTimeout(function () {
      sleeping = true;
      hide();
      face('sleep');
    }, 25000);
  }
  ['pointermove', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, wakeUp, { passive: true });
  });
  wakeUp();

  /* ---------- arrastar e clicar ---------- */
  var POS_KEY = 'napoleao-dev-bit-pos';
  var dragging = false, dragMoved = false, start = null, lastX = 0, lastT = 0;
  function clampPos(x, y) {
    var w = wrap.offsetWidth, h = wrap.offsetHeight;
    return {
      x: Math.max(8, Math.min(window.innerWidth - w - 8, x)),
      y: Math.max(72, Math.min(window.innerHeight - h - 8, y))
    };
  }
  function setPos(x, y) {
    var p = clampPos(x, y);
    wrap.style.left = p.x + 'px';
    wrap.style.top = p.y + 'px';
    wrap.style.right = 'auto';
    wrap.style.bottom = 'auto';
    return p;
  }
  try {
    var saved = JSON.parse(localStorage.getItem(POS_KEY) || 'null');
    if (saved && typeof saved.x === 'number') setPos(saved.x * window.innerWidth, saved.y * window.innerHeight);
  } catch (e) { /* sem storage */ }
  window.addEventListener('resize', function () {
    if (wrap.style.left) { var r = wrap.getBoundingClientRect(); setPos(r.left, r.top); }
  });

  bit.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    var r = wrap.getBoundingClientRect();
    start = { x: e.clientX, y: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top };
    dragMoved = false;
    lastX = e.clientX; lastT = performance.now();
    bit.setPointerCapture(e.pointerId);
  });
  bit.addEventListener('pointermove', function (e) {
    if (!start) return;
    if (!dragMoved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return;
    if (!dragMoved) {
      dragMoved = dragging = true;
      wrap.classList.add('is-dragging');
      face('surprised');
      say('Uaaa! Pra onde a gente vai?', { key: 'drag', cooldown: 15000 });
    }
    var now = performance.now();
    var vx = (e.clientX - lastX) / Math.max(1, now - lastT) * 1000;
    lastX = e.clientX; lastT = now;
    wrap.style.setProperty('--tilt', Math.max(-28, Math.min(28, -vx / 40)).toFixed(1) + 'deg');
    setPos(e.clientX - start.ox, e.clientY - start.oy);
    placeBubble();
  });
  function endDrag() {
    start = null;
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove('is-dragging');
    face('happy', 1400);
    gesture('is-land');
    var r = wrap.getBoundingClientRect();
    try { localStorage.setItem(POS_KEY, JSON.stringify({ x: r.left / window.innerWidth, y: r.top / window.innerHeight })); } catch (e) { /* sem storage */ }
    placeBubble();
  }
  bit.addEventListener('pointerup', endDrag);
  bit.addEventListener('pointercancel', endDrag);

  var clicks = [];
  bit.addEventListener('click', function () {
    if (dragMoved) { dragMoved = false; return; }
    var now = Date.now();
    clicks = clicks.filter(function (t) { return now - t < 1800; });
    clicks.push(now);
    if (clicks.length >= 4) {
      clicks = [];
      gesture('is-spin');
      say('Ei! Faz cócegas.', { face: 'squint', faceMs: 1500, key: 'tickle', cooldown: 3000 });
      return;
    }
    if (bubble.classList.contains('is-open') && actionsEl.childElementCount && !touring) { hide(); return; }
    menu();
  });

  /* ---------- atalhos ---------- */
  function go(sel) {
    var el = $(sel);
    if (el) el.scrollIntoView({ behavior: smooth(), block: 'start' });
  }
  function menu() {
    stopTour();
    gesture('is-wave');
    say('Oi! Quer que eu te mostre alguma coisa?', {
      face: 'happy',
      actions: [
        { label: 'Fazer um tour', fn: startTour },
        { label: 'Projetos', fn: function () { go('#projetos'); hide(); } },
        { label: 'Falar com o Enzo', fn: function () { go('#contato'); hide(); } },
        { label: 'Trocar tema', fn: function () { var t = $('#theme-toggle'); if (t) t.click(); } }
      ]
    });
  }

  /* ---------- tour ---------- */
  var TOUR = [
    { sel: '#sobre', spot: '.about-lead', text: 'O Enzo é backend com Python, mas faz o sistema inteiro: do banco à interface.' },
    { sel: '#experiencia', spot: '.milestone.is-current', text: 'Ele começou na Qualidade. Cada cargo somou uma camada, até chegar em sistemas.' },
    { sel: '#case-cofrinho', spot: '.phone', text: 'Esse é o Cofrinho rodando de verdade. O código está aberto no GitHub.' },
    { sel: '#stack', spot: '.layer-core', text: 'Python no centro de tudo. Passa o mouse nas tecnologias que eu acendo os projetos delas.' },
    { sel: '#contato', spot: '.contact-email', text: 'Fim do tour! Se tiver um processo manual sobrando, é por aqui.' }
  ];
  var touring = false, tourIdx = 0;
  function startTour() { touring = true; tourIdx = 0; tourStep(); }
  function stopTour() { touring = false; }
  function tourStep() {
    if (!touring) return;
    var s = TOUR[tourIdx];
    go(s.sel);
    hide();
    setTimeout(function () {
      if (!touring) return;
      var el = $(s.spot);
      if (el) lookAtEl(el);
      var last = tourIdx === TOUR.length - 1;
      say(s.text, {
        spot: el,
        sticky: true,
        face: last ? 'happy' : 'normal',
        gesture: last ? 'is-jump' : 'is-wave',
        actions: last
          ? [{ label: 'Copiar e-mail', fn: copyEmail }, { label: 'Fechar', fn: function () { stopTour(); hide(); } }]
          : [{ label: 'Próximo  →', fn: function () { tourIdx++; tourStep(); } }, { label: 'Sair', fn: function () { stopTour(); hide(); } }]
      });
      if (last) touring = false;
    }, reduceMotion.matches ? 50 : 750);
  }
  function copyEmail() {
    var btn = $('#copy-email');
    if (btn && !btn.hidden) { btn.click(); return; }
    say('ennapoleao@gmail.com — pode selecionar e copiar daqui.', { sticky: true });
  }

  /* ---------- comentários por seção (uma vez cada) ---------- */
  var SECTION_LINES = {
    sobre: 'Ele veio da Qualidade. Por isso mapeia o processo antes de escrever código.',
    experiencia: 'Quatro cargos, uma direção: de processos a sistemas.',
    projetos: 'Passa o mouse nos projetos. Eu conto um segredo de cada um.',
    stack: 'Passa o mouse numa tecnologia: eu acendo onde ela foi usada.',
    contato: 'Chegamos! O e-mail tá logo ali. Eu entrego pessoalmente.'
  };
  var seen = {};
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var id = en.target.id;
        if (!en.isIntersecting || seen[id] || touring) return;
        seen[id] = true;
        if (SECTION_LINES[id]) say(SECTION_LINES[id], { key: 'sec-' + id });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { if (s.id !== 'top') io.observe(s); });
  }
  setTimeout(function () {
    if (window.scrollY < 200) say('Oi! Eu sou o Bit. Pode me clicar ou me arrastar por aí.', { face: 'happy', gesture: 'is-wave', key: 'hello' });
  }, 1600);

  /* ---------- reações ao que acontece na página ---------- */
  function hover(sel, fn) {
    $$(sel).forEach(function (el) {
      el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && !touring) fn(el); });
    });
  }

  var runBtn = $('#run-btn');
  var output = $('#code-output');
  if (runBtn && output) {
    runBtn.addEventListener('click', function () { say('Rodando enzo.py…', { face: 'surprised', faceMs: 1500, key: 'run', cooldown: 2000 }); });
    new MutationObserver(function () {
      if ($('.ok', output)) say('exit 0! Funcionou de primeira.', { face: 'happy', gesture: 'is-jump', key: 'ran', cooldown: 2000 });
    }).observe(output, { childList: true });
  }

  var themeBtn = $('#theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    setTimeout(function () {
      if (root.getAttribute('data-theme') === 'light') say('Ai, luz! Meus olhos de LED…', { face: 'squint', faceMs: 2400 });
      else say('Ahh, bem melhor no escuro.', { face: 'happy' });
    }, 30);
  });

  var copyBtn = $('#copy-email');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    setTimeout(function () {
      if (copyBtn.classList.contains('is-done')) say('Copiado! Agora é só colar e mandar.', { face: 'happy', gesture: 'is-jump' });
    }, 120);
  });

  hover('.hero-title', function () { say('Esse é o Enzo. Eu sou só o assistente.', { face: 'happy', key: 'title' }); });
  hover('.hero-actions .btn-ghost', function () { say('Boa escolha. Ele responde rápido.', { face: 'happy', key: 'talk' }); });
  hover('.redacted', function () { say('Shhh… isso aí é confidencial.', { face: 'squint', key: 'secret' }); });
  hover('.phone', function () { say('Esse print é do app de verdade.', { key: 'phone' }); });
  hover('.milestone.is-current', function () { say('Esse é o cargo atual!', { face: 'happy', key: 'current' }); });

  var CASE_LINES = {
    '#case-atlas': 'ATLAS é confidencial. Nem eu sei o que tem dentro.',
    '#case-cofrinho': 'Cofrinho: Firebase, tempo real e zero build.',
    '#case-brysa': 'Uma loja inteira em Flask, com painel de admin.',
    '#case-rapanui': 'As fotos desse foram feitas dentro da própria loja.'
  };
  hover('.case-index a', function (a) {
    var href = a.getAttribute('href');
    if (CASE_LINES[href]) say(CASE_LINES[href], { key: href, cooldown: 4000 });
  });

  var CASE_NAMES = { atlas: 'ATLAS', brysa: 'BRYSA', cofrinho: 'Cofrinho' };
  hover('.layer-tech li', function (li) {
    var name = li.textContent.trim();
    if (name === 'Python') { say('Python! Minha linguagem favorita.', { face: 'happy', gesture: 'is-jump', key: 'py' }); return; }
    var cases = (li.getAttribute('data-cases') || '').split(' ').filter(Boolean).map(function (c) { return CASE_NAMES[c]; });
    var text = cases.length
      ? name + ' aparece em ' + cases.join(' e ') + '.'
      : name + ' faz parte da stack, ainda sem projeto público aqui.';
    say(text, { key: 'tech-' + name, cooldown: 4000 });
  });

  var CHANNEL_LINES = {
    GitHub: 'No GitHub tem o código do Cofrinho.',
    LinkedIn: 'A trajetória completa está no LinkedIn.',
    Instagram: 'No Instagram ele mostra os bastidores.'
  };
  hover('.channels a', function (a) {
    var n = $('.ch-name', a);
    if (n && CHANNEL_LINES[n.textContent]) say(CHANNEL_LINES[n.textContent], { key: 'ch-' + n.textContent, cooldown: 4000 });
  });

  /* rolagem rápida e fim da página */
  var lastY = window.scrollY, lastS = performance.now(), endShown = false;
  window.addEventListener('scroll', function () {
    var now = performance.now(), y = window.scrollY;
    var v = Math.abs(y - lastY) / Math.max(1, now - lastS) * 1000;
    lastY = y; lastS = now;
    if (v > 6000 && !touring) say('Uou, devagar! Tô ficando tonto.', { face: 'surprised', gesture: 'is-shake', key: 'fast', cooldown: 20000 });
    var bottom = window.innerHeight + y >= document.documentElement.scrollHeight - 4;
    if (bottom && !endShown && !touring) {
      endShown = true;
      say('Fim da página. Voltamos pro topo?', {
        actions: [{ label: 'Bora ↑', fn: function () { window.scrollTo({ top: 0, behavior: smooth() }); say('Lá vamos nós!', { face: 'happy', gesture: 'is-jump' }); } }]
      });
    }
  }, { passive: true });
})();
