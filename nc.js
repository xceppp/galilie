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
  var stickyCta = document.getElementById('ncStickyCta');
  var wa = document.getElementById('ncWa');
  function onScroll() {
    var h = document.documentElement;
    var sc = h.scrollTop || document.body.scrollTop;
    var max = h.scrollHeight - h.clientHeight;
    if (progress) progress.style.width = (max > 0 ? (sc / max * 100) : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', sc > 10);
    var form = document.getElementById('formulaire');
    var nearForm = false;
    if (form) {
      var fr = form.getBoundingClientRect();
      nearForm = fr.top < window.innerHeight * 0.75 && fr.bottom > 80;
    }
    var show = sc > 420 && !nearForm;
    if (floatCta) floatCta.classList.toggle('show', show);
    if (stickyCta) stickyCta.classList.toggle('is-on', show);
    if (wa) wa.classList.toggle('show', sc > 280);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Seamless trust marquee — keep track always full (no empty gap at loop) */
  function fillTrustMarquee() {
    var track = document.getElementById('ncTrustTrack');
    if (!track) return;
    var mask = track.parentElement;
    if (!mask) return;

    var groups = track.querySelectorAll('.nc-trust-group');
    if (!groups.length) return;

    var source = groups[0];
    while (track.children.length > 1) {
      track.removeChild(track.lastChild);
    }

    var guard = 0;
    var need = Math.max(mask.clientWidth * 2, source.offsetWidth * 2);
    while (track.scrollWidth < need + 8 && guard < 12) {
      var clone = source.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
      guard++;
      need = Math.max(mask.clientWidth * 2, source.offsetWidth * 2);
    }

    /* Ensure even count so -50% lands on an identical half */
    if (track.children.length % 2 === 1) {
      var pad = source.cloneNode(true);
      pad.setAttribute('aria-hidden', 'true');
      track.appendChild(pad);
    }

    var half = Math.floor(track.children.length / 2);
    var duration = Math.max(24, half * 10);
    track.style.animationDuration = duration + 's';
  }

  fillTrustMarquee();
  window.addEventListener('load', fillTrustMarquee);
  window.addEventListener('resize', function () {
    window.clearTimeout(window.__ncTrustResize);
    window.__ncTrustResize = window.setTimeout(fillTrustMarquee, 160);
  });
  window.ncFillTrustMarquee = fillTrustMarquee;

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

  /* Hero background video — muted loop, ambient only (pauses offscreen / reduced-motion) */
  var heroVid = document.getElementById('ncHeroVideo');
  var heroVideoWrap = document.querySelector('.nc-hero-video');
  var heroSection = document.querySelector('.nc-hero--entry') || document.querySelector('.nc-hero--v2');
  if (heroVid && heroVideoWrap) {
    var heroInView = true;
    heroVid.muted = true;
    heroVid.defaultMuted = true;
    heroVid.loop = true;
    heroVid.playsInline = true;
    heroVid.setAttribute('muted', '');
    heroVid.setAttribute('loop', '');
    heroVid.setAttribute('playsinline', '');
    heroVid.setAttribute('webkit-playsinline', '');

    function markReady() {
      heroVideoWrap.classList.add('is-ready');
    }

    function markPlaying() {
      heroVideoWrap.classList.add('is-playing');
    }

    function tryPlayHero() {
      if (reduce || document.hidden || !heroInView) return;
      markReady();
      var p = heroVid.play();
      if (p && typeof p.then === 'function') {
        p.then(markPlaying).catch(function () {});
      } else if (!heroVid.paused) {
        markPlaying();
      }
    }

    function pauseHero() {
      if (!heroVid.paused) heroVid.pause();
      heroVideoWrap.classList.remove('is-playing');
    }

    heroVid.addEventListener('loadeddata', markReady, { once: true });
    heroVid.addEventListener('loadedmetadata', markReady, { once: true });
    setTimeout(markReady, 1200);
    heroVid.addEventListener('playing', markPlaying);

    if (reduce) {
      heroVid.removeAttribute('autoplay');
      heroVid.loop = false;
      heroVid.addEventListener('loadedmetadata', function () {
        heroVid.pause();
        markReady();
        heroVideoWrap.classList.add('is-ended');
      }, { once: true });
    } else {
      var unlock = function () { tryPlayHero(); };
      document.documentElement.addEventListener('touchstart', unlock, { once: true, passive: true, capture: true });
      document.documentElement.addEventListener('pointerdown', unlock, { once: true, passive: true, capture: true });
      if (heroSection) {
        heroSection.addEventListener('touchstart', unlock, { once: true, passive: true });
      }
      heroVid.addEventListener('loadeddata', tryPlayHero, { once: true });
      heroVid.addEventListener('canplay', tryPlayHero, { once: true });
      if (heroSection && 'IntersectionObserver' in window) {
        var heroIo = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            heroInView = e.isIntersecting;
            if (heroInView) tryPlayHero();
            else pauseHero();
          });
        }, { threshold: 0.08 });
        heroIo.observe(heroSection);
      }
      tryPlayHero();
      window.addEventListener('load', tryPlayHero, { once: true });
      window.addEventListener('pageshow', tryPlayHero, { once: true });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) pauseHero();
        else tryPlayHero();
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

  /* CTA → formulaire (scroll précis sous la barre fixe, sans zoom mobile) */
  function navScrollOffset() {
    var h = nav ? nav.offsetHeight : 72;
    var alertBar = document.querySelector('.nc-alert-bar');
    if (alertBar) {
      var st = window.getComputedStyle(alertBar);
      if (st.display !== 'none' && st.visibility !== 'hidden') {
        h += alertBar.offsetHeight;
      }
    }
    return h + 12;
  }

  function syncNavHeightVar() {
    if (!nav) return;
    document.documentElement.style.setProperty('--nc-nav-h', nav.offsetHeight + 'px');
  }
  syncNavHeightVar();
  window.addEventListener('resize', syncNavHeightVar, { passive: true });

  function scrollToLeadForm(opts) {
    opts = opts || {};
    var target = document.getElementById('formulaire') || document.getElementById('formWrap');
    if (!target) return;
    syncNavHeightVar();
    var top = target.getBoundingClientRect().top + window.scrollY - navScrollOffset();
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduce ? 'auto' : 'smooth',
    });
    if (opts.resetForm && typeof window.ncResetLeadForm === 'function') {
      window.ncResetLeadForm();
    }
    if (opts.campaign && typeof window.ncPrefillCampaignLead === 'function') {
      window.ncPrefillCampaignLead();
    }
    if (opts.focus && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.setTimeout(function () {
        var prenom = document.getElementById('prenom');
        if (prenom) prenom.focus({ preventScroll: true });
      }, reduce ? 0 : 380);
    }
  }

  function isCampaignInscriptionLink(link) {
    if (!link) return false;
    return (
      link.id === 'ncStoryCta' ||
      link.classList.contains('nc-story-cta') ||
      link.classList.contains('nc-nav-cta') ||
      link.classList.contains('nc-drawer-cta') ||
      link.classList.contains('nc-float')
    );
  }

  function scrollToAbout() {
    var target = document.getElementById('about');
    if (!target) return;
    syncNavHeightVar();
    var top = target.getBoundingClientRect().top + window.scrollY - navScrollOffset();
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduce ? 'auto' : 'smooth',
    });
  }

  function isAboutLink(link) {
    if (!link || link.tagName !== 'A') return false;
    var href = (link.getAttribute('href') || '').trim().toLowerCase();
    return href === '#about' || href === '#decouvrir';
  }

  function isLeadFormLink(link) {
    if (!link || link.tagName !== 'A') return false;
    var href = (link.getAttribute('href') || '').trim().toLowerCase();
    if (href === '#formulaire') return true;
    if (href !== '#contact') return false;
    return (
      link.classList.contains('btn') ||
      link.classList.contains('nc-poles-cta') ||
      link.classList.contains('nc-foot-cta') ||
      link.classList.contains('nc-float') ||
      link.classList.contains('nc-nav-cta') ||
      link.classList.contains('nc-drawer-cta') ||
      link.classList.contains('nc-hero-scroll') ||
      link.classList.contains('nc-hero-card-cta')
    );
  }

  function isDecouvrirLink(link) {
    return isAboutLink(link);
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (isAboutLink(link)) {
      e.preventDefault();
      closeD();
      if (history.replaceState) {
        history.replaceState(null, '', '#about');
      } else {
        location.hash = 'about';
      }
      scrollToAbout();
      return;
    }
    if (!isLeadFormLink(link)) return;
    e.preventDefault();
    closeD();
    if (history.replaceState) {
      history.replaceState(null, '', '#formulaire');
    } else {
      location.hash = 'formulaire';
    }
    scrollToLeadForm({
      resetForm: true,
      campaign: isCampaignInscriptionLink(link),
      focus: true,
    });
  });

  function handleFormHashOnLoad() {
    var hash = (location.hash || '').toLowerCase();
    if (hash === '#about' || hash === '#decouvrir') {
      window.requestAnimationFrame(function () {
        window.setTimeout(scrollToAbout, 80);
      });
      return;
    }
    if (hash !== '#formulaire' && hash !== '#contact') return;
    window.requestAnimationFrame(function () {
      window.setTimeout(function () {
        scrollToLeadForm({ resetForm: true, campaign: true });
      }, 80);
    });
  }
  handleFormHashOnLoad();
  window.addEventListener('hashchange', function () {
    var hash = (location.hash || '').toLowerCase();
    if (hash === '#about' || hash === '#decouvrir') {
      scrollToAbout();
      return;
    }
    if (hash === '#formulaire' || hash === '#contact') {
      scrollToLeadForm({ resetForm: true, campaign: true });
    }
  });

})();
