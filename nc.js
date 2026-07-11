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
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* Hero cursor glow */
  var hero = document.querySelector('.nc-hero');
  var glow = document.getElementById('ncHeroGlow');
  if (hero && glow && window.matchMedia('(hover:hover)').matches) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      glow.style.transform = 'translate(' + (e.clientX - r.left - 210) + 'px,' + (e.clientY - r.top - 210) + 'px)';
    });
  }

  /* Service + program cards: cursor-follow radial glow */
  document.querySelectorAll('.nc-svc-card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

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
