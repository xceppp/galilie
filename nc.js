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

  /* Hero counters — valeurs statiques dans le HTML (pas d'animation vers 0) */

  var hero = document.querySelector('.nc-hero');
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
