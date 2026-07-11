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

  /* Animated counters */
  function runCount(el) {
    var to = parseInt(el.getAttribute('data-to'), 10) || 0;
    if (reduce) { el.textContent = to; return; }
    var cur = 0, step = Math.max(1, Math.round(to / 60));
    var t = setInterval(function () {
      cur += step;
      if (cur >= to) { cur = to; clearInterval(t); }
      el.textContent = cur;
    }, 22);
  }
  var counters = document.querySelectorAll('.nc-count');
  var hero = document.querySelector('.nc-hero');

  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          if (!e.target.dataset.counted) {
            e.target.dataset.counted = '1';
            runCount(e.target);
          }
          cio.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCount);
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

  /* Service + program cards: cursor-follow radial glow */
  document.querySelectorAll('.nc-svc-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* Pôle detail modal */
  var poleModal = document.getElementById('ncPoleModal');
  var poleModalBg = document.getElementById('ncPoleModalBg');
  var poleModalClose = document.getElementById('ncPoleModalClose');
  var polePanels = poleModal ? poleModal.querySelectorAll('.nc-pole-panel') : [];
  var poleCards = document.querySelectorAll('.nc-svc-card[data-pole]');
  var lastPoleTrigger = null;

  function openPoleModal(id, trigger) {
    if (!poleModal || !id) return;
    lastPoleTrigger = trigger || null;
    polePanels.forEach(function (panel) {
      var match = panel.getAttribute('data-pole') === id;
      panel.hidden = !match;
      if (match) {
        var title = panel.querySelector('.nc-pole-title');
        if (title) poleModal.setAttribute('aria-labelledby', title.id);
      }
    });
    poleModal.classList.add('open');
    poleModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (poleModalClose) poleModalClose.focus();
  }

  function closePoleModal() {
    if (!poleModal) return;
    poleModal.classList.remove('open');
    poleModal.setAttribute('aria-hidden', 'true');
    polePanels.forEach(function (panel) { panel.hidden = true; });
    document.body.style.overflow = '';
    if (lastPoleTrigger) lastPoleTrigger.focus();
    lastPoleTrigger = null;
  }

  poleCards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      openPoleModal(card.getAttribute('data-pole'), card);
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPoleModal(card.getAttribute('data-pole'), card);
      }
    });
  });

  if (poleModalClose) poleModalClose.addEventListener('click', closePoleModal);
  if (poleModalBg) poleModalBg.addEventListener('click', closePoleModal);
  if (poleModal) {
    poleModal.querySelectorAll('[data-pole-close]').forEach(function (link) {
      link.addEventListener('click', closePoleModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && poleModal.classList.contains('open')) closePoleModal();
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

  /* Live social-proof toast (FOMO) */
  var people = [
    ['R', 'Rachid', 'un appel découverte'],
    ['S', 'Sanae', 'une consultation 1-à-1'],
    ['N', 'Nadia', 'un coaching exécutif'],
    ['K', 'Khadija', 'un accompagnement conseil'],
    ['M', 'Mehdi', 'un appel découverte']
  ];
  var toast = document.getElementById('ncToast');
  if (toast && !reduce) {
    var tAv = document.getElementById('ncToastAv');
    var tBody = document.getElementById('ncToastBody');
    var tTime = document.getElementById('ncToastTime');
    var idx = 0;
    function showToast() {
      var p = people[idx % people.length]; idx++;
      if (tAv) tAv.textContent = p[0];
      if (tBody) tBody.innerHTML = '<b>' + p[1] + '</b> vient de réserver ' + p[2];
      var mins = Math.floor(Math.random() * 9) + 1;
      if (tTime) tTime.textContent = 'il y a ' + mins + ' min · Meknès';
      toast.classList.add('show');
      setTimeout(function () { toast.classList.remove('show'); }, 5000);
    }
    setTimeout(showToast, 4500);
    setInterval(showToast, 14000);
  }
})();
