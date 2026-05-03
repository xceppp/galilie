/* Galilie Scholar — site scripts (linked from index.html; DOM-ready at end of <body>) */

// Google Sheet connection
// ⚠️ REQUIRED: Replace with your Google Apps Script Web App URL before launch
const SHEET_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";

// Navbar shadow on scroll
const navbar = document.getElementById('navbar');
function onScroll(){
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
  const fc = document.getElementById('floatCta');
  if (fc) fc.classList.toggle('visible', window.scrollY > 500);
  const wa = document.getElementById('waFloat');
  if (wa) wa.classList.toggle('visible', window.scrollY > 300);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Floating CTA scroll to form
const floatCta = document.getElementById('floatCta');
if (floatCta) {
  floatCta.addEventListener('click', () => {
    const c = document.getElementById('contact');
    if (c) c.scrollIntoView({ behavior: 'smooth' });
  });
}

// Drawer
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
const hamb = document.getElementById('hamb');
const drawerClose = document.getElementById('drawerClose');
function openDrawer(){
  drawer.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer(){
  drawer.classList.remove('open');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
hamb.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);
drawer.querySelectorAll('[data-close]').forEach(a => a.addEventListener('click', closeDrawer));

// Custom cursor (desktop only)
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
let mx = -100, my = -100, rx = -100, ry = -100;
document.addEventListener('mousemove', (e) => {
  mx = e.clientX; my = e.clientY;
  cursorDot.style.left = mx + 'px';
  cursorDot.style.top = my + 'px';
});
(function follow(){
  rx += (mx - rx) * 0.18;
  ry += (my - ry) * 0.18;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top = ry + 'px';
  requestAnimationFrame(follow);
})();

// Scroll reveal + gold lines
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('on');
    revealObserver.unobserve(e.target);
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// FAQ accordion (one open at a time)
const faqItems = Array.from(document.querySelectorAll('.faq-item'));
faqItems.forEach((item) => {
  const btn = item.querySelector('.faq-q');
  btn.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    faqItems.forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// ── SPOTS COUNTER (localStorage) ─────────────────────────────────────
const SPOTS_KEY   = 'gs_spots';
const SPOTS_TIME  = 'gs_spots_ts';
const RESET_HOURS = 72;

function getSpots() {
  const ts    = parseInt(localStorage.getItem(SPOTS_TIME) || '0', 10);
  const now   = Date.now();
  const hours = (now - ts) / 3600000;
  if (!localStorage.getItem(SPOTS_KEY) || hours > RESET_HOURS) {
    const fresh = Math.floor(Math.random() * 5) + 8; // 8–12
    localStorage.setItem(SPOTS_KEY, String(fresh));
    localStorage.setItem(SPOTS_TIME, String(now));
    return fresh;
  }
  const spots = Math.max(3, (parseInt(localStorage.getItem(SPOTS_KEY) || '8', 10) - 1));
  localStorage.setItem(SPOTS_KEY, String(spots));
  return spots;
}

const spotsLeft = getSpots();

const heroUrgMobile = document.getElementById('heroUrgMobile');
if (heroUrgMobile) {
  heroUrgMobile.textContent = spotsLeft + ' places restantes';
}

// BAC capacités affichées (1ère & 2ème année — même logique 25 / 45)
const BAC_PLACES_LEFT = 25;
const BAC_PLACES_TOTAL = 45;
const bacBarPct =
  Math.round((BAC_PLACES_LEFT / BAC_PLACES_TOTAL) * 1000) / 10;

function animateBacScarcityBar(el, targetPct) {
  if (!el) return;
  el.style.width = '100%';
  setTimeout(() => { el.style.width = targetPct + '%'; }, 150);
}

const scarPctBac1 = document.getElementById('scarPctBac1');
const scarPctBac2 = document.getElementById('scarPctBac2');
if (scarPctBac1) {
  scarPctBac1.textContent =
    BAC_PLACES_LEFT + ' / ' + BAC_PLACES_TOTAL + ' places restantes';
}
if (scarPctBac2) {
  scarPctBac2.textContent =
    BAC_PLACES_LEFT + ' / ' + BAC_PLACES_TOTAL + ' places restantes';
}

animateBacScarcityBar(document.getElementById('scarBarBac1'), bacBarPct);
animateBacScarcityBar(document.getElementById('scarBarBac2'), bacBarPct);

// 1ère année mise en avant, puis transition, puis 2ème année (+ flash du ratio) — bannière or + carte programme
(function initBacYearSpotlightCycle() {
  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function pauseCycle() {
    document.body.classList.add('bac-cycle-paused');
  }
  const r1 = document.getElementById('bacScarcityRow1');
  const r2 = document.getElementById('bacScarcityRow2');
  const s1 = document.getElementById('bacStripRow1');
  const s2 = document.getElementById('bacStripRow2');
  const stripNum2 = s2 && s2.querySelector('.bac-strip-num');

  if (!r1 || !r2 || !s1 || !s2 || !stripNum2) return;

  if (reduceMq.matches) {
    pauseCycle();
    return;
  }

  const HOLD_MS = 4000;
  let tick = 0;

  function apply(showFirstSpotlight) {
    if (showFirstSpotlight) {
      r1.classList.add('bac-row--spotlight');
      r2.classList.remove('bac-row--spotlight');
      r2.classList.remove('bac-row--flash-reveal');

      s1.classList.add('bac-strip-active');
      s2.classList.remove('bac-strip-active');

      stripNum2.classList.remove('bac-num-burst');
      return;
    }
    r2.classList.add('bac-row--spotlight');
    r1.classList.remove('bac-row--spotlight');

    r2.classList.remove('bac-row--flash-reveal');
    void r2.offsetWidth;
    r2.classList.add('bac-row--flash-reveal');

    s2.classList.add('bac-strip-active');
    s1.classList.remove('bac-strip-active');

    stripNum2.classList.remove('bac-num-burst');
    void stripNum2.offsetWidth;
    stripNum2.classList.add('bac-num-burst');
  }

  const iv = setInterval(() => {
    tick += 1;
    apply(tick % 2 === 0);
  }, HOLD_MS);

  reduceMq.addEventListener?.('change', (e) => {
    if (e.matches) {
      clearInterval(iv);
      pauseCycle();
      r1.classList.add('bac-row--spotlight');
      r2.classList.add('bac-row--spotlight');
      s1.classList.add('bac-strip-active');
      s2.classList.add('bac-strip-active');
    }
  });
})();

const spotsFormText = document.getElementById('spotsFormText');
if (spotsFormText) {
  spotsFormText.innerHTML =
    'Il reste <strong>' +
    BAC_PLACES_LEFT +
    ' / ' +
    BAC_PLACES_TOTAL +
    '</strong> places pour la <strong>1ère année BAC</strong> et <strong>' +
    BAC_PLACES_LEFT +
    ' / ' +
    BAC_PLACES_TOTAL +
    '</strong> pour la <strong>2ème année BAC</strong> (session sept. 2026).';
}

// Floating CTA urgency mode
if (spotsLeft <= 5) {
  const fc = document.getElementById('floatCta');
  if (fc) {
    fc.textContent = '⚡ Dernières places — Réserver';
    fc.classList.add('float-cta--urgent');
  }
}

// ── COUNTDOWN TIMER ───────────────────────────────────────────────────
function updateCountdown() {
  const target = new Date('2026-09-01T00:00:00').getTime();
  const now    = Date.now();
  const diff   = Math.max(0, target - now);
  const days   = Math.floor(diff / 86400000);
  const hours  = Math.floor((diff % 86400000) / 3600000);
  const mins   = Math.floor((diff % 3600000)  / 60000);
  const secs   = Math.floor((diff % 60000)    / 1000);
  const pad    = n => String(n).padStart(2, '0');
  const d = document.getElementById('cd-days');
  const h = document.getElementById('cd-hours');
  const m = document.getElementById('cd-mins');
  const s = document.getElementById('cd-secs');
  if (d) d.textContent = String(days);
  if (h) h.textContent = pad(hours);
  if (m) m.textContent = pad(mins);
  if (s) s.textContent = pad(secs);
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ── FORM SUBMIT (Google Sheet via Apps Script) ───────────────────────
const leadForm = document.getElementById('leadForm');
const formWrap = document.getElementById('formWrap');
const successState = document.getElementById('successState');
const niveauSelect = document.getElementById('niveau');
const filiereSelect = document.getElementById('filiere');
const serviceSelect = document.getElementById('service');

const dependentOptions = {
  bac1: {
    filieres: ['Sciences Maths', 'Sciences PC', 'Sciences SVT', 'Sciences Éco'],
    services: ['Cours de soutien (sur site)', 'Cours à distance', 'Capsule personnalisée', 'Langues', 'Coaching & Développement']
  },
  bac2: {
    filieres: ['Sciences Maths', 'Sciences PC', 'Sciences SVT', 'Sciences Éco'],
    services: ['Cours de soutien (sur site)', 'Cours à distance', 'Capsule personnalisée', 'Langues', 'Coaching & Développement']
  },
  prepa_sci: {
    filieres: ['MP', 'PCSI', 'Maths niveau prépa', 'Physique niveau prépa'],
    services: ['Classes Préparatoires', 'Langues', 'Coaching & Développement']
  },
  prepa_eco: {
    filieres: ['ECG', 'ECT', 'Économie', 'Gestion', 'Culture générale'],
    services: ['Classes Préparatoires', 'Langues', 'Coaching & Développement']
  },
  concours_public: {
    filieres: ['Technicien', 'Administrateur', 'Ingénieur', 'Cadre A', 'Cadre B', 'Cadre C', 'Autre grade'],
    services: ['Concours Emploi Public', 'Coaching & Développement', 'Langues']
  },
  langues: {
    filieres: ['Français', 'Anglais', 'Français + Anglais'],
    services: ['Langues', 'Coaching & Développement']
  },
  coaching: {
    filieres: ['Coaching mental', 'Communication professionnelle', 'Construction de caractère'],
    services: ['Coaching & Développement']
  },
  bacplus: {
    filieres: ['Sciences', 'Économie', 'Langues', 'Autre'],
    services: ['Cours à distance', 'Langues', 'Concours Emploi Public', 'Coaching & Développement', 'Plusieurs services']
  },
  pro: {
    filieres: ['Concours', 'Évolution professionnelle', 'Communication', 'Autre'],
    services: ['Concours Emploi Public', 'Langues', 'Coaching & Développement', 'Plusieurs services']
  },
  parent: {
    filieres: ['Enfant en 1ère BAC', 'Enfant en 2ème BAC', 'Prépa', 'Concours', 'Autre situation'],
    services: ['Cours de soutien (sur site)', 'Cours à distance', 'Capsule personnalisée', 'Classes Préparatoires', 'Concours Emploi Public', 'Langues', 'Coaching & Développement', 'Club parascolaire', 'Plusieurs services']
  }
};

function fillSelect(selectEl, values, placeholder){
  if (!selectEl) return;
  selectEl.innerHTML = '';
  const first = document.createElement('option');
  first.value = '';
  first.textContent = placeholder;
  first.disabled = true;
  first.selected = true;
  selectEl.appendChild(first);
  values.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });
}

function updateDependentSelects(){
  const key = niveauSelect ? niveauSelect.value : '';
  const cfg = dependentOptions[key];
  if (!cfg){
    fillSelect(filiereSelect, [], 'Choisissez d\'abord le profil');
    fillSelect(serviceSelect, [], 'Choisissez d\'abord le profil');
    return;
  }
  fillSelect(filiereSelect, cfg.filieres, 'Sélectionnez une option');
  fillSelect(serviceSelect, cfg.services, 'Sélectionnez un service');
}

if (niveauSelect){
  niveauSelect.addEventListener('change', updateDependentSelects);
  updateDependentSelects();
}

function val(id){
  const el = document.getElementById(id);
  return el ? String(el.value || '').trim() : '';
}

function showSuccess(){
  if (formWrap) formWrap.style.display = 'none';
  if (successState) successState.style.display = 'block';
}

// Form progress tracker
const formFields = ['prenom','nom','telephone','email','niveau','filiere','service','mode'];
function updateProgress(){
  const filled = formFields.filter((id) => {
    const el = document.getElementById(id);
    return el && el.value && String(el.value).trim() !== '';
  }).length;
  const pct = Math.round((filled / formFields.length) * 100);
  const bar = document.getElementById('formProgressBar');
  const lbl = document.getElementById('formProgressLabel');
  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = filled + ' / ' + formFields.length + ' champs remplis';
}
if (leadForm) {
  leadForm.addEventListener('input', updateProgress);
  leadForm.addEventListener('change', updateProgress);
  updateProgress();
}

leadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    timestamp: new Date().toISOString(),
    prenom: val('prenom'),
    nom: val('nom'),
    telephone: val('telephone'),
    email: val('email'),
    niveau: val('niveau'),
    filiere: val('filiere'),
    service: val('service'),
    mode: val('mode')
  };

  const required = ['prenom','nom','telephone','email','niveau','filiere','service','mode'];
  const ok = required.every(k => payload[k] && payload[k].length > 0);
  if (!ok){
    alert('Veuillez remplir tous les champs.');
    return;
  }

  showSuccess();

  // Non-blocking UX: attempt send, ignore errors
  try{
    if (SHEET_URL && SHEET_URL !== "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
      fetch(SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }
  }catch(_){}
});

// Programmes — onglets (#svcLayoutRoot + services-layout.css)
(function initSvcLayout() {
  const root = document.getElementById('svcLayoutRoot');
  if (!root) return;

  window.showSvcTab = function (panelKey, btn) {
    const panelId = panelKey === 'concours' ? 'concours' : 'tab-' + panelKey;
    const panel = document.getElementById(panelId);
    root.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    root.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    if (panel) panel.classList.add('active');
    if (btn) btn.classList.add('active');
  };

  function applyConcoursHash() {
    if (location.hash !== '#concours') return;
    const tabBtn = root.querySelector('.tab-btn[data-svc-tab="concours"]');
    window.showSvcTab('concours', tabBtn);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const el = document.getElementById('concours');
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: reduce.matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  }

  window.addEventListener('hashchange', applyConcoursHash);
  applyConcoursHash();
})();

// Nav active state (sections + carte Concours)
const navObserveEls = [
  ...document.querySelectorAll('section[id]'),
  document.getElementById('concours')
].filter(Boolean);
const navScrollLinks = document.querySelectorAll('.nav-links a[href^="#"]');
if (navObserveEls.length && navScrollLinks.length) {
  const navIo = new IntersectionObserver((entries) => {
    const hit = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!hit || !hit.target.id) return;
    const id = hit.target.id;
    navScrollLinks.forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
  }, { threshold: [0.08, 0.14, 0.22, 0.35], rootMargin: '-10% 0px -48% 0px' });
  navObserveEls.forEach((el) => navIo.observe(el));
}
