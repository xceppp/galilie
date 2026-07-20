/* NC Consulting — campagne Semaine gratuite (story + lightbox) */
(function () {
  'use strict';

  var root = document.getElementById('semaine-gratuite');
  var track = document.getElementById('ncStoryTrack');
  var viewport = document.getElementById('ncStoryViewport');
  if (!root || !track || !viewport) return;

  var panels = Array.prototype.slice.call(track.querySelectorAll('.nc-story-panel'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('.nc-story-dot'));
  var prevBtn = document.getElementById('ncStoryPrev');
  var nextBtn = document.getElementById('ncStoryNext');
  var progress = document.getElementById('ncStoryProgress');
  var countEl = document.getElementById('ncStoryCount');
  var stepEl = document.getElementById('ncStoryStep');
  var total = panels.length;
  if (!total) return;

  var STEP_LABELS = ['L\'offre', 'Modalités', 'Programme', 'Objectifs', 'Inscription'];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var index = 0;
  var timer = null;
  var INTERVAL = 5000;
  var paused = false;
  var lightboxOpen = false;
  var touching = false;
  var startX = 0;
  var deltaX = 0;

  function clamp(i) {
    return (i + total) % total;
  }

  function syncMobileViewportHeight() {
    if (!viewport) return;
    var mobile = window.matchMedia('(max-width: 979px)').matches;
    if (!mobile) {
      viewport.style.height = '';
      return;
    }
    var active = panels[index];
    if (!active) return;
    viewport.style.height = active.offsetHeight + 'px';
  }

  function render(i, animate) {
    index = clamp(i);
    var offset = -index * 100;
    if (animate === false || reduce) {
      track.style.transition = 'none';
    } else {
      track.style.transition = '';
    }
    track.style.transform = 'translate3d(' + offset + '%, 0, 0)';

    for (var s = 0; s < total; s++) {
      root.classList.toggle('is-story-' + s, s === index);
    }

    panels.forEach(function (panel, n) {
      var on = n === index;
      panel.classList.toggle('is-active', on);
      panel.setAttribute('aria-hidden', on ? 'false' : 'true');
    });

    dots.forEach(function (dot, n) {
      var on = n === index;
      dot.classList.toggle('is-active', on);
      if (on) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });

    var label = STEP_LABELS[index] || '';
    if (countEl) countEl.textContent = index + 1 + ' / ' + total;
    if (stepEl) {
      stepEl.innerHTML = '<b>' + (index + 1) + ' / ' + total + '</b> · ' + label;
    }
    if (progress) {
      progress.style.transition = reduce ? 'none' : '';
      progress.style.width = ((index + 1) / total) * 100 + '%';
    }

    window.requestAnimationFrame(function () {
      syncMobileViewportHeight();
    });
  }

  function go(i) {
    render(i, true);
    restart();
  }

  function next() {
    go(index + 1);
  }

  function prev() {
    go(index - 1);
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    if (reduce || paused || touching || lightboxOpen || total < 2) return;
    stop();
    timer = window.setInterval(next, INTERVAL);
  }

  function restart() {
    stop();
    start();
  }

  if (prevBtn) prevBtn.addEventListener('click', prev);
  if (nextBtn) nextBtn.addEventListener('click', next);

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      var goto = parseInt(dot.getAttribute('data-goto'), 10);
      if (isNaN(goto)) return;
      go(goto);
    });
  });

  root.addEventListener('mouseenter', function () {
    paused = true;
    stop();
  });
  root.addEventListener('mouseleave', function () {
    if (lightboxOpen) return;
    paused = false;
    start();
  });
  root.addEventListener('focusin', function () {
    paused = true;
    stop();
  });
  root.addEventListener('focusout', function (e) {
    if (lightboxOpen) return;
    if (root.contains(e.relatedTarget)) return;
    paused = false;
    start();
  });

  function onTouchStart(e) {
    if (!e.touches || !e.touches.length) return;
    touching = true;
    stop();
    startX = e.touches[0].clientX;
    deltaX = 0;
    track.style.transition = 'none';
  }

  function onTouchMove(e) {
    if (!touching) return;
    deltaX = e.touches[0].clientX - startX;
    var pct = (deltaX / viewport.clientWidth) * 100;
    track.style.transform = 'translate3d(' + (-index * 100 + pct) + '%, 0, 0)';
  }

  function onTouchEnd() {
    if (!touching) return;
    touching = false;
    var threshold = viewport.clientWidth * 0.18;
    if (deltaX < -threshold) go(index + 1);
    else if (deltaX > threshold) go(index - 1);
    else go(index);
  }

  viewport.addEventListener('touchstart', onTouchStart, { passive: true });
  viewport.addEventListener('touchmove', onTouchMove, { passive: true });
  viewport.addEventListener('touchend', onTouchEnd, { passive: true });
  viewport.addEventListener('touchcancel', onTouchEnd, { passive: true });

  /* ── Lightbox zoom ── */
  var lightbox = document.getElementById('ncStoryLightbox');
  var openBtn = document.getElementById('ncStoryPosterOpen');
  var closeBtn = document.getElementById('ncLightboxClose');
  var stage = document.getElementById('ncLightboxStage');
  var img = document.getElementById('ncLightboxImg');
  var zoomIn = document.getElementById('ncLightboxZoomIn');
  var zoomOut = document.getElementById('ncLightboxZoomOut');
  var zoomReset = document.getElementById('ncLightboxZoomReset');
  var lastFocus = null;
  var scale = 1;
  var tx = 0;
  var ty = 0;
  var dragging = false;
  var dragX = 0;
  var dragY = 0;
  var originX = 0;
  var originY = 0;
  var pinchStartDist = 0;
  var pinchStartScale = 1;

  function applyTransform() {
    if (!img) return;
    img.style.transform =
      'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + scale + ')';
    if (zoomReset) zoomReset.textContent = Math.round(scale * 100) + '%';
  }

  function setZoom(next) {
    scale = Math.min(4, Math.max(1, next));
    if (scale === 1) {
      tx = 0;
      ty = 0;
    }
    applyTransform();
  }

  function openLightbox(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!lightbox) return;
    lastFocus = document.activeElement;
    lightboxOpen = true;
    paused = true;
    stop();
    lightbox.hidden = false;
    document.body.classList.add('nc-lightbox-open');
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform();
    if (closeBtn) closeBtn.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove('nc-lightbox-open');
    lightboxOpen = false;
    paused = false;
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    start();
  }

  if (openBtn) openBtn.addEventListener('click', openLightbox);
  root.querySelectorAll('[data-open-poster]').forEach(function (btn) {
    btn.addEventListener('click', openLightbox);
  });
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.querySelectorAll('[data-lightbox-close]').forEach(function (el) {
      el.addEventListener('click', closeLightbox);
    });
  }
  if (zoomIn) zoomIn.addEventListener('click', function () { setZoom(scale + 0.25); });
  if (zoomOut) zoomOut.addEventListener('click', function () { setZoom(scale - 0.25); });
  if (zoomReset) zoomReset.addEventListener('click', function () { setZoom(1); });

  if (stage && img) {
    stage.addEventListener('wheel', function (e) {
      if (lightbox.hidden) return;
      e.preventDefault();
      setZoom(scale + (e.deltaY < 0 ? 0.15 : -0.15));
    }, { passive: false });

    stage.addEventListener('pointerdown', function (e) {
      if (lightbox.hidden || scale <= 1) return;
      dragging = true;
      dragX = e.clientX;
      dragY = e.clientY;
      originX = tx;
      originY = ty;
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      tx = originX + (e.clientX - dragX);
      ty = originY + (e.clientY - dragY);
      applyTransform();
    });
    stage.addEventListener('pointerup', function () { dragging = false; });
    stage.addEventListener('pointercancel', function () { dragging = false; });

    stage.addEventListener('touchstart', function (e) {
      if (lightbox.hidden || e.touches.length !== 2) return;
      var a = e.touches[0];
      var b = e.touches[1];
      pinchStartDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchStartScale = scale;
    }, { passive: true });
    stage.addEventListener('touchmove', function (e) {
      if (lightbox.hidden || e.touches.length !== 2 || !pinchStartDist) return;
      var a = e.touches[0];
      var b = e.touches[1];
      var dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      setZoom(pinchStartScale * (dist / pinchStartDist));
    }, { passive: true });
    stage.addEventListener('touchend', function () {
      pinchStartDist = 0;
    }, { passive: true });
  }

  document.addEventListener('keydown', function (e) {
    if (lightboxOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(scale + 0.25);
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom(scale - 0.25);
      }
      return;
    }
    if (!root.contains(document.activeElement) && document.activeElement !== document.body) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  });

  render(0, false);
  start();
  window.addEventListener('resize', syncMobileViewportHeight, { passive: true });
})();
