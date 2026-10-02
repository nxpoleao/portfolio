(function () {
  'use strict';

  /* =========================================================
     FX — camada extra de movimento
     Depende de script.js (que marca .reveal com .is-visible).
     Tudo é desligável: sem a classe .fx no <html>, nada anima.
     ========================================================= */
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  function on() { return root.classList.contains('fx'); }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- Embaralhar texto até resolver (efeito "decode") ---------- */
  var GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789<>/{}[]=+*_';
  function scramble(el, to, dur, from) {
    if (from == null) from = el.textContent;
    var len = Math.max(from.length, to.length);
    var start = performance.now();
    cancelAnimationFrame(el._fxRaf);
    function frame(now) {
      var t = Math.min(1, (now - start) / dur);
      var out = '';
      for (var i = 0; i < len; i++) {
        var th = 0.2 + 0.8 * (i / len);
        if (t >= th) out += to.charAt(i);
        else if (to.charAt(i) === ' ') out += ' ';
        else if (t >= th - 0.3) out += GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
        else out += from.charAt(i);
      }
      if (t >= 1) out = to;
      el.textContent = out;
      el._fxLast = out;
      if (t < 1) el._fxRaf = requestAnimationFrame(frame);
    }
    el._fxRaf = requestAnimationFrame(frame);
  }

  /* ---------- Barra de leitura ---------- */
  var header = $('#site-header');
  var progress = document.createElement('span');
  progress.className = 'fx-progress';
  progress.setAttribute('aria-hidden', 'true');
  if (header) header.appendChild(progress);
  var pTick = false;
  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
    pTick = false;
  }
  window.addEventListener('scroll', function () {
    if (!pTick) { pTick = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();

  /* ---------- Caminho no header: decodifica ao trocar de seção ---------- */
  var brandPath = $('#brand-path');
  if (brandPath && 'MutationObserver' in window) {
    var lastPath = brandPath.textContent;
    new MutationObserver(function () {
      var now = brandPath.textContent;
      if (now === brandPath._fxLast) return;
      if (on()) scramble(brandPath, now, 420, lastPath);
      lastPath = now;
    }).observe(brandPath, { childList: true, characterData: true, subtree: true });
  }

  /* ---------- Hero: nome dividido em letras ---------- */
  var title = $('.hero-title');
  if (title) {
    var idx = 0;
    $$(':scope > span', title).forEach(function (line) {
      var text = line.textContent;
      line.textContent = '';
      var sr = document.createElement('span');
      sr.className = 'visually-hidden';
      sr.textContent = text;
      var mask = document.createElement('span');
      mask.className = 'fx-mask';
      mask.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(text, function (ch) {
        var c = document.createElement('span');
        c.className = 'fx-char';
        var inner = document.createElement('span');
        inner.className = 'fx-ch-in';
        inner.style.setProperty('--i', idx++);
        inner.textContent = ch;
        c.appendChild(inner);
        mask.appendChild(c);
      });
      line.appendChild(sr);
      line.appendChild(mask);
    });
    title.classList.add('fx-split');
  }

  /* ---------- Hero: cargo alternando ---------- */
  var eyebrow = $('.hero-eyebrow');
  var rotator = null;
  var ROLES = ['Backend · Python', 'Fullstack', 'APIs & integrações', 'Automação de processos'];
  var roleIdx = 0;
  var roleTimer = null;
  if (eyebrow) {
    var last = eyebrow.lastChild;
    while (last && last.nodeType !== 3) last = last.previousSibling;
    if (last && last.textContent.trim()) {
      var sr2 = document.createElement('span');
      sr2.className = 'visually-hidden';
      sr2.textContent = 'Backend · Python, fullstack';
      rotator = document.createElement('span');
      rotator.className = 'fx-rotator';
      rotator.setAttribute('aria-hidden', 'true');
      rotator.textContent = ROLES[0];
      eyebrow.replaceChild(rotator, last);
      eyebrow.appendChild(sr2);
    }
  }
  function startRoles() {
    stopRoles();
    if (!rotator) return;
    roleTimer = setInterval(function () {
      if (document.hidden) return;
      roleIdx = (roleIdx + 1) % ROLES.length;
      scramble(rotator, ROLES[roleIdx], 650);
    }, 3200);
  }
  function stopRoles() {
    clearInterval(roleTimer);
    if (rotator) { cancelAnimationFrame(rotator._fxRaf); roleIdx = 0; rotator.textContent = ROLES[0]; }
  }

  /* ---------- Hero: sinais na malha (canvas) ---------- */
  var gridBg = $('.hero-grid-bg');
  var hero = $('.hero');
  var grid = null;
  if (gridBg && hero && window.HTMLCanvasElement) {
    grid = (function () {
      var STEP = 64;
      var canvas = document.createElement('canvas');
      canvas.className = 'fx-canvas';
      gridBg.appendChild(canvas);
      var ctx = canvas.getContext('2d');
      var W = 0, H = 0, dpr = 1, ox = 0;
      var packets = [];
      var mouse = null;
      var running = false, inView = true, raf = 0, lastT = 0, spawnAcc = 0;
      var accent = '#5b8fff';

      function readColor() {
        accent = getComputedStyle(root).getPropertyValue('--accent').trim() || accent;
      }
      function resize() {
        var r = gridBg.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = r.width; H = r.height;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // a malha do CSS usa background-position: center top
        ox = (((W - STEP) / 2) % STEP + STEP) % STEP;
      }
      function spawn() {
        var horizontal = Math.random() < 0.5;
        var cols = Math.floor((W - ox) / STEP), rows = Math.floor(H / STEP);
        var p = { speed: 70 + Math.random() * 90, trail: [], life: 0, max: 3 + Math.random() * 4 };
        if (horizontal) {
          p.y = STEP * (1 + Math.floor(Math.random() * Math.max(1, rows - 1)));
          p.dx = Math.random() < 0.5 ? 1 : -1; p.dy = 0;
          p.x = p.dx > 0 ? ox : ox + cols * STEP;
        } else {
          p.x = ox + STEP * Math.floor(Math.random() * Math.max(1, cols));
          p.dy = 1; p.dx = 0; p.y = 0;
        }
        p.trail.push({ x: p.x, y: p.y });
        packets.push(p);
      }
      function step(p, dt) {
        var dist = p.speed * dt;
        while (dist > 0) {
          // distância até o próximo cruzamento da malha
          var toNext;
          if (p.dx) {
            var gx = p.dx > 0 ? Math.floor((p.x - ox) / STEP + 1e-6) + 1 : Math.ceil((p.x - ox) / STEP - 1e-6) - 1;
            toNext = Math.abs(ox + gx * STEP - p.x);
          } else {
            var gy = p.dy > 0 ? Math.floor(p.y / STEP + 1e-6) + 1 : Math.ceil(p.y / STEP - 1e-6) - 1;
            toNext = Math.abs(gy * STEP - p.y);
          }
          var m = Math.min(dist, toNext);
          p.x += p.dx * m; p.y += p.dy * m;
          dist -= m;
          if (m === toNext) {
            p.trail.push({ x: p.x, y: p.y });
            if (Math.random() < 0.28) { // vira 90°
              var t = p.dx; p.dx = p.dy * (Math.random() < 0.5 ? 1 : -1); p.dy = t * (Math.random() < 0.5 ? 1 : -1);
              if (!p.dx && !p.dy) p.dy = 1;
            }
          }
        }
        if (p.trail.length > 6) p.trail.shift();
      }
      function draw(t) {
        var dt = Math.min(0.05, (t - lastT) / 1000 || 0);
        lastT = t;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = accent;
        ctx.strokeStyle = accent;

        // brilho e cruzamentos perto do cursor
        if (mouse) {
          var R = 190;
          var g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, R * 1.6);
          ctx.globalAlpha = 0.1;
          g.addColorStop(0, accent); g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.fillRect(mouse.x - R * 1.6, mouse.y - R * 1.6, R * 3.2, R * 3.2);
          ctx.fillStyle = accent;
          var c0 = Math.floor((mouse.x - R - ox) / STEP), c1 = Math.ceil((mouse.x + R - ox) / STEP);
          var r0 = Math.floor((mouse.y - R) / STEP), r1 = Math.ceil((mouse.y + R) / STEP);
          for (var c = c0; c <= c1; c++) for (var r = r0; r <= r1; r++) {
            var x = ox + c * STEP, y = r * STEP;
            var d = Math.hypot(x - mouse.x, y - mouse.y);
            if (d > R) continue;
            ctx.globalAlpha = (1 - d / R) * 0.75;
            ctx.fillRect(x - 3, y - 0.5, 7, 1);
            ctx.fillRect(x - 0.5, y - 3, 1, 7);
          }
        }

        spawnAcc += dt;
        if (spawnAcc > 0.75 && packets.length < (W < 700 ? 4 : 8)) { spawnAcc = 0; spawn(); }

        for (var i = packets.length - 1; i >= 0; i--) {
          var p = packets[i];
          step(p, dt);
          p.life += dt;
          var fade = Math.max(0, Math.min(1, p.life * 3, (p.max - p.life) * 1.5));
          if (fade <= 0 || p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10) { packets.splice(i, 1); continue; }
          var pts = p.trail.concat([{ x: p.x, y: p.y }]);
          ctx.lineWidth = 1;
          for (var s = 1; s < pts.length; s++) {
            ctx.globalAlpha = fade * 0.6 * (s / pts.length);
            ctx.beginPath();
            ctx.moveTo(pts[s - 1].x + 0.5, pts[s - 1].y + 0.5);
            ctx.lineTo(pts[s].x + 0.5, pts[s].y + 0.5);
            ctx.stroke();
          }
          ctx.globalAlpha = fade;
          ctx.fillRect(p.x - 1.5, p.y - 1.5, 4, 4);
        }
        ctx.globalAlpha = 1;
        if (running && inView && !document.hidden) raf = requestAnimationFrame(draw);
        else raf = 0;
      }
      function kick() {
        if (running && inView && !document.hidden && !raf) { lastT = performance.now(); raf = requestAnimationFrame(draw); }
      }

      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(gridBg);
      else window.addEventListener('resize', resize);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (e) { inView = e[0].isIntersecting; kick(); }).observe(hero);
      }
      document.addEventListener('visibilitychange', kick);
      new MutationObserver(readColor).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = gridBg.getBoundingClientRect();
        mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
      });
      hero.addEventListener('pointerleave', function () { mouse = null; });

      return {
        start: function () { readColor(); resize(); running = true; kick(); },
        stop: function () { running = false; cancelAnimationFrame(raf); raf = 0; packets = []; ctx.clearRect(0, 0, W, H); }
      };
    })();
  }

  /* ---------- Painel de código: índice das linhas, inclinação ---------- */
  $$('.code .ln').forEach(function (ln, i) { ln.style.setProperty('--i', i); });
  var panel = $('.code-panel');
  if (panel) {
    panel.addEventListener('animationend', function (e) {
      if (e.target === panel) panel.classList.add('fx-settled');
    });
    panel.addEventListener('pointermove', function (e) {
      if (!on() || !finePointer.matches) return;
      var r = panel.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      panel.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      panel.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      if (panel.classList.contains('fx-settled')) {
        panel.style.transform = 'perspective(1100px) rotateX(' + ((0.5 - py) * 5).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 6).toFixed(2) + 'deg)';
      }
    });
    panel.addEventListener('pointerleave', function () { panel.style.transform = ''; });
  }
  var runBtn = $('#run-btn');
  if (runBtn) runBtn.addEventListener('click', function () { runBtn.classList.add('fx-ran'); });

  /* ---------- Botões magnéticos ---------- */
  $$('.hero-actions .btn, .contact-email .btn').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      if (!on() || !finePointer.matches) return;
      var r = btn.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      btn.style.translate = (dx * 12).toFixed(1) + 'px ' + (dy * 10).toFixed(1) + 'px';
    });
    btn.addEventListener('pointerleave', function () { btn.style.translate = ''; });
  });

  /* ---------- Faixa de especificações: decodifica na abertura ---------- */
  var specTargets = $$('.spec-strip dd').map(function (dd) {
    var leaf = dd.querySelector('a') || dd;
    return { el: leaf, text: leaf.textContent };
  });
  var specTimers = [];
  function runSpecs() {
    specTimers.forEach(clearTimeout);
    specTimers = specTargets.map(function (s, i) {
      return setTimeout(function () { scramble(s.el, s.text, 900, ''); }, 900 + i * 140);
    });
  }

  /* ---------- Títulos de seção: palavra por palavra ---------- */
  $$('.section-head h2, .contact-title').forEach(function (h) {
    var n = 0;
    var walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var w = document.createElement('span');
        w.className = 'fx-w';
        var inner = document.createElement('span');
        inner.className = 'fx-w-in';
        inner.style.setProperty('--i', n++);
        inner.textContent = part;
        w.appendChild(inner);
        frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
    h.classList.add('fx-words');
  });

  /* ---------- ~/caminhos digitados ao entrar na tela ---------- */
  if ('IntersectionObserver' in window) {
    var typer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        typer.unobserve(entry.target);
        if (!on()) return;
        var el = entry.target, text = el.textContent, i = 0;
        el.textContent = '';
        el.classList.add('fx-typing');
        (function type() {
          el.textContent = text.slice(0, ++i);
          if (i < text.length) setTimeout(type, 55);
          else setTimeout(function () { el.classList.remove('fx-typing'); }, 900);
        })();
      });
    }, { threshold: 1, rootMargin: '0px 0px -60px 0px' });
    $$('.section .path').forEach(function (p) { typer.observe(p); });
  }

  /* ---------- Índices para escalonar listas ---------- */
  function indexAll(sel, prop) {
    $$(sel).forEach(function (el, i) { el.style.setProperty(prop || '--i', i); });
  }
  indexAll('.daily-list li');
  indexAll('.case-index li');
  indexAll('.channels li');
  indexAll('.layers .layer');
  $$('.chips').forEach(function (c) { $$('li', c).forEach(function (li, i) { li.style.setProperty('--i', i); }); });
  $$('.track .milestone').forEach(function (m, i) {
    m.style.setProperty('--m', i);
    $$('.diff li', m).forEach(function (li, j) { li.style.setProperty('--j', j); });
  });

  /* ---------- Pacotes nos diagramas de arquitetura ---------- */
  $$('.flow').forEach(function (flow) {
    var hosts = $$(':scope > li', flow).filter(function (li) {
      var prev = li.previousElementSibling;
      return li.classList.contains('flow-edge') || (prev && prev.classList.contains('flow-node') && li.classList.contains('flow-node'));
    });
    hosts.forEach(function (li, k) {
      var p = document.createElement('span');
      p.className = 'fx-packet';
      p.setAttribute('aria-hidden', 'true');
      p.style.setProperty('--k', k);
      p.style.setProperty('--n', hosts.length);
      li.appendChild(p);
    });
  });

  /* ---------- Stack: tecnologias que andam juntas ---------- */
  var layers = $('#layers');
  if (layers) {
    var techs = $$('.layer-tech li', layers);
    layers.addEventListener('pointerover', function (e) {
      var li = e.target.closest('li[data-cases]');
      if (!li) { layers.classList.remove('fx-focus'); techs.forEach(function (t) { t.classList.remove('fx-hot'); }); return; }
      var ids = li.getAttribute('data-cases').split(' ');
      layers.classList.add('fx-focus');
      techs.forEach(function (t) {
        var c = (t.getAttribute('data-cases') || '').split(' ');
        t.classList.toggle('fx-hot', c.some(function (x) { return x && ids.indexOf(x) !== -1; }));
      });
    });
    layers.addEventListener('pointerleave', function () {
      layers.classList.remove('fx-focus');
      techs.forEach(function (t) { t.classList.remove('fx-hot'); });
    });
  }

  /* ---------- Início ---------- */
  function enable() {
    root.classList.add('fx');
    if (grid) grid.start();
    startRoles();
  }

  if (!reduceMotion.matches) {
    enable();
    runSpecs();
  }
})();
