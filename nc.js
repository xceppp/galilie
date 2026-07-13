/* NC Consulting — interactions du thème (chargé en plus de main.js pour le formulaire) */
(function () {
  'use strict';

  if (window.location.hash === '#concours') {
    window.location.replace('concours.html');
    return;
  }

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

  /* Hero background video — plays once, freezes on last frame (mobile-friendly) */
  var heroVid = document.getElementById('ncHeroVideo');
  var heroVideoWrap = document.querySelector('.nc-hero-video');
  var heroSection = document.querySelector('.nc-hero--v2');
  if (heroVid && heroVideoWrap) {
    heroVid.muted = true;
    heroVid.defaultMuted = true;
    heroVid.playsInline = true;
    heroVid.setAttribute('muted', '');
    heroVid.setAttribute('playsinline', '');
    heroVid.setAttribute('webkit-playsinline', '');

    function primeHeroFrame() {
      heroVideoWrap.classList.add('is-ready');
      if (heroVid.duration && isFinite(heroVid.duration)) {
        heroVid.currentTime = Math.min(0.1, heroVid.duration - 0.05);
      } else if (heroVid.currentTime < 0.05) {
        heroVid.currentTime = 0.05;
      }
    }

    function showFrame() {
      primeHeroFrame();
    }

    function markPlaying() {
      heroVideoWrap.classList.add('is-playing');
    }

    function tryPlayHero() {
      if (heroVid.ended) return;
      showFrame();
      var p = heroVid.play();
      if (p && typeof p.then === 'function') {
        p.then(markPlaying).catch(function () {});
      } else if (!heroVid.paused) {
        markPlaying();
      }
    }

    heroVid.addEventListener('loadedmetadata', primeHeroFrame, { once: true });
    heroVid.addEventListener('loadeddata', primeHeroFrame, { once: true });
    setTimeout(function () { heroVideoWrap.classList.add('is-ready'); }, 1200);

    heroVid.addEventListener('ended', function () {
      heroVid.pause();
      heroVideoWrap.classList.add('is-ended');
      heroVideoWrap.classList.remove('is-playing');
    });

    heroVid.addEventListener('playing', markPlaying);

    function bindGestureFallback() {
      var unlock = function () {
        tryPlayHero();
      };
      document.documentElement.addEventListener('touchstart', unlock, { once: true, passive: true, capture: true });
      document.documentElement.addEventListener('pointerdown', unlock, { once: true, passive: true, capture: true });
      if (heroSection) {
        heroSection.addEventListener('touchstart', unlock, { once: true, passive: true });
      }
    }

    if (reduce) {
      heroVid.addEventListener('loadedmetadata', function () {
        if (heroVid.duration && isFinite(heroVid.duration)) {
          heroVid.currentTime = Math.max(0, heroVid.duration - 0.05);
        }
        heroVid.pause();
        heroVideoWrap.classList.add('is-ended', 'is-ready');
      }, { once: true });
    } else {
      bindGestureFallback();
      heroVid.addEventListener('loadeddata', tryPlayHero, { once: true });
      heroVid.addEventListener('canplay', tryPlayHero, { once: true });
      if (heroSection && 'IntersectionObserver' in window) {
        var heroIo = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) tryPlayHero();
          });
        }, { threshold: 0.1 });
        heroIo.observe(heroSection);
      }
      tryPlayHero();
      window.addEventListener('load', tryPlayHero, { once: true });
      window.addEventListener('pageshow', tryPlayHero, { once: true });
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && !heroVid.ended) tryPlayHero();
      });
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
    if (meta) meta.setAttribute('content', '#0E1116');
    syncThemeBtns();
  }
  themeBtns.forEach(function (b) { b.addEventListener('click', toggleTheme); });
  syncThemeBtns();

  /* FAQ accordion — exposed for CMS re-render */
  function initFaq() {
    document.querySelectorAll('.nc-faq-item .nc-faq-q').forEach(function (q) {
      if (q.dataset.ncBound) return;
      q.dataset.ncBound = '1';
      q.addEventListener('click', function () {
        var it = q.parentElement;
        var open = it.classList.contains('open');
        document.querySelectorAll('.nc-faq-item').forEach(function (x) {
          x.classList.remove('open');
        });
        if (!open) it.classList.add('open');
      });
    });
  }
  initFaq();
  function initTrustPicker() {
    var grid = document.getElementById('ncClientQuiz');
    if (!grid) return;
    grid.querySelectorAll('.nc-trust-card').forEach(function (card) {
      if (card.dataset.trustBound) return;
      card.dataset.trustBound = '1';
      function activate() {
        grid.querySelectorAll('.nc-trust-card').forEach(function (c) {
          c.classList.toggle('is-active', c === card);
        });
      }
      card.addEventListener('mouseenter', activate);
      card.addEventListener('focus', activate);
      card.addEventListener('touchstart', activate, { passive: true });
    });
  }
  initTrustPicker();
  window.ncReinitUi = function () {
    initFaq();
    initTrustPicker();
  };

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
