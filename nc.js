/* NC Consulting — interactions du thème (chargé en plus de main.js pour le formulaire) */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll progress + navbar shadow + floating widgets */
  var progress = document.getElementById('ncProgress');
  var nav = document.getElementById('ncNav');
  var floatCta = document.getElementById('ncFloat');
  var wa = document.getElementById('ncWa');
  function onScroll() {
    var h = document.documentElement;
    var sc = h.scrollTop || document.body.scrollTop;
    var max = h.scrollHeight - h.clientHeight;
    if (progress) progress.style.width = (max > 0 ? (sc / max * 100) : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', sc > 10);
    var show = sc > 620;
    if (floatCta) floatCta.classList.toggle('show', show);
    if (wa) wa.classList.toggle('show', sc > 320);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Reveal on scroll */
  var revEls = document.querySelectorAll('.reveal:not(.in)');
  if ('IntersectionObserver' in window && revEls.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14 });
    revEls.forEach(function (el) { io.observe(el); });
  } else {
    revEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* Animated counters — static values in HTML for no-JS; animate only when scrolling into view */
  function runCount(el) {
    var to = parseInt(el.getAttribute('data-to'), 10) || 0;
    if (reduce) { el.textContent = to; return; }
    el.textContent = '0';
    var cur = 0, step = Math.max(1, Math.round(to / 60));
    var t = setInterval(function () {
      cur += step;
      if (cur >= to) { cur = to; clearInterval(t); }
      el.textContent = cur;
    }, 22);
  }
  var counters = document.querySelectorAll('.nc-count');
  var hero = document.querySelector('.nc-hero');
  var initiallyVisible = new Set();
  counters.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) initiallyVisible.add(el);
  });

  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          if (!e.target.dataset.counted) {
            e.target.dataset.counted = '1';
            if (initiallyVisible.has(e.target)) return;
            runCount(e.target);
          }
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else if (!reduce) {
    counters.forEach(function (el) {
      if (!initiallyVisible.has(el)) runCount(el);
    });
  }

  /* Hero cursor / touch glow */
  var glow = document.getElementById('ncHeroGlow');
  if (hero && glow && window.matchMedia('(min-width:769px)').matches) {
    function moveHeroGlow(clientX, clientY) {
      var r = hero.getBoundingClientRect();
      glow.style.transform = 'translate(' + (clientX - r.left - 240) + 'px,' + (clientY - r.top - 240) + 'px)';
    }
    if (window.matchMedia('(hover:hover)').matches) {
      hero.addEventListener('mousemove', function (e) { moveHeroGlow(e.clientX, e.clientY); });
    }
  }

  /* Pôles : onglets Formation / Accompagnement / Conseil */
  var polesRoot = document.getElementById('ncPoles');
  if (polesRoot) {
    var polTabs = Array.prototype.slice.call(polesRoot.querySelectorAll('.nc-poles-tab'));
    var polPanels = Array.prototype.slice.call(polesRoot.querySelectorAll('.nc-poles-panel'));
    function activatePole(idx) {
      polTabs.forEach(function (t, i) {
        var on = i === idx;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      polPanels.forEach(function (p, i) {
        var on = i === idx;
        p.classList.toggle('is-active', on);
        p.hidden = !on;
      });
    }
    polTabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activatePole(i); });
      tab.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          var ni = (i + 1) % polTabs.length; activatePole(ni); polTabs[ni].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          var pi = (i - 1 + polTabs.length) % polTabs.length; activatePole(pi); polTabs[pi].focus();
        }
      });
    });
  }

  /* Theme toggle (light / dark) */
  var themeBtns = [document.getElementById('ncThemeToggle'), document.getElementById('ncThemeToggleM')].filter(Boolean);
  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function syncThemeBtns() {
    themeBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', isDark() ? 'true' : 'false');
      b.setAttribute('title', isDark() ? 'Passer au thème clair' : 'Passer au thème sombre');
    });
  }
  function toggleTheme() {
    var dark = !isDark();
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('nc-theme', dark ? 'dark' : 'light'); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0f131a' : '#0E1116');
    syncThemeBtns();
  }
  themeBtns.forEach(function (b) { b.addEventListener('click', toggleTheme); });
  syncThemeBtns();

  /* FAQ accordion */
  document.querySelectorAll('.nc-faq-item .nc-faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var it = q.parentElement;
      var open = it.classList.contains('open');
      document.querySelectorAll('.nc-faq-item').forEach(function (x) { x.classList.remove('open'); });
      if (!open) it.classList.add('open');
    });
  });

  /* Mobile drawer */
  var drawer = document.getElementById('ncDrawer');
  var overlay = document.getElementById('ncOverlay');
  var hamb = document.getElementById('ncHamb');
  var closeBtn = document.getElementById('ncDrawerClose');
  function openD() { if (drawer) drawer.classList.add('open'); if (overlay) overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeD() { if (drawer) drawer.classList.remove('open'); if (overlay) overlay.classList.remove('open'); document.body.style.overflow = ''; }
  if (hamb) hamb.addEventListener('click', openD);
  if (closeBtn) closeBtn.addEventListener('click', closeD);
  if (overlay) overlay.addEventListener('click', closeD);
  if (drawer) drawer.querySelectorAll('[data-close]').forEach(function (a) { a.addEventListener('click', closeD); });
  window.addEventListener('resize', function () { if (drawer && !drawer.classList.contains('open')) document.body.style.overflow = ''; });

})();
