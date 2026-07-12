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

  /* Hero background video — plays once, freezes on last frame */
  var heroVid = document.getElementById('ncHeroVideo');
  var heroVideoWrap = document.querySelector('.nc-hero-video');
  if (heroVid && heroVideoWrap) {
    heroVid.muted = true;
    heroVid.defaultMuted = true;
    heroVid.playsInline = true;
    heroVid.setAttribute('playsinline', '');
    heroVid.setAttribute('webkit-playsinline', '');

    heroVid.addEventListener('ended', function () {
      heroVid.pause();
      heroVideoWrap.classList.add('is-ended');
    });

    if (reduce) {
      heroVid.addEventListener('loadedmetadata', function () {
        if (heroVid.duration && isFinite(heroVid.duration)) {
          heroVid.currentTime = Math.max(0, heroVid.duration - 0.05);
        }
        heroVid.pause();
        heroVideoWrap.classList.add('is-ended');
      }, { once: true });
    } else {
      var tryPlayHero = function () {
        var p = heroVid.play();
        if (p && typeof p.catch === 'function') {
          p.catch(function () {
            document.documentElement.addEventListener('pointerdown', function once() {
              heroVid.play().catch(function () {});
            }, { once: true, passive: true });
          });
        }
      };
      if (heroVid.readyState >= 2) tryPlayHero();
      else heroVid.addEventListener('loadeddata', tryPlayHero, { once: true });
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
    if (meta) meta.setAttribute('content', '#0E1116');
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

  /* Instagram embeds — process when script loads and when section is visible */
  function processIgEmbeds() {
    if (window.instgrm && window.instgrm.Embeds) {
      window.instgrm.Embeds.process();
    }
  }
  processIgEmbeds();
  window.addEventListener('load', processIgEmbeds);
  var reelsEl = document.getElementById('reels');
  if (reelsEl && 'IntersectionObserver' in window) {
    var igIo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          processIgEmbeds();
          igIo.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    igIo.observe(reelsEl);
  }

})();
