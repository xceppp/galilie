/* Galilie Scholar — site scripts (linked from index.html; DOM-ready at end of <body>) */

// Google Sheet connection
// ⚠️ REQUIRED: Replace with your Google Apps Script Web App URL before launch
const SHEET_URL = "https://script.google.com/macros/s/AKfycby9Ba-1dp3qs_LmS3WANXynPU0cwL1ZeTHNstGyZuRtVOwJgjRIa8YdNbP4WcOCbRuFDw/exec";
const RECAPTCHA_SITE_KEY = "6LcTitwsAAAAAKuFlJuCIyeV1ugZkUxNa3GJsdye";

let lastSubmitTime = 0;
const SUBMIT_COOLDOWN_MS = 8000;

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

// Keep social section before FAQ in page flow
const socialSection = document.getElementById('social');
const faqSection = document.getElementById('faq');
if (socialSection && faqSection && faqSection.parentNode) {
  faqSection.parentNode.insertBefore(socialSection, faqSection);
}

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

function val(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  return String(el.value || '')
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .slice(0, 500);
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach((el) => el.remove());
  document.querySelectorAll('.field-err-border').forEach((el) => {
    el.classList.remove('field-err-border');
  });
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('field-err-border');
  const err = document.createElement('div');
  err.className = 'field-error';
  err.textContent = msg;
  err.setAttribute('role', 'alert');
  el.parentNode.insertBefore(err, el.nextSibling);
  const clear = () => {
    el.classList.remove('field-err-border');
    err.remove();
  };
  el.addEventListener('input', clear, { once: true });
  el.addEventListener('change', clear, { once: true });
}

function showSuccess(){
  if (formWrap) formWrap.style.display = 'none';
  if (successState) successState.style.display = 'block';
}

let recaptchaScriptPromise = null;
function isRecaptchaConfigured() {
  return Boolean(
    RECAPTCHA_SITE_KEY &&
    RECAPTCHA_SITE_KEY !== 'PASTE_RECAPTCHA_SITE_KEY_HERE' &&
    RECAPTCHA_SITE_KEY.length > 20
  );
}

function loadRecaptchaScript() {
  if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
    return Promise.resolve();
  }
  if (recaptchaScriptPromise) return recaptchaScriptPromise;
  recaptchaScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(RECAPTCHA_SITE_KEY)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('reCAPTCHA script failed to load.'));
    document.head.appendChild(script);
  });
  return recaptchaScriptPromise;
}

async function getRecaptchaToken(action = 'lead_submit') {
  if (!isRecaptchaConfigured()) {
    throw new Error('reCAPTCHA site key is not configured.');
  }
  await loadRecaptchaScript();
  if (!window.grecaptcha || typeof window.grecaptcha.execute !== 'function') {
    throw new Error('reCAPTCHA is unavailable.');
  }
  return await new Promise((resolve, reject) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action })
        .then(resolve)
        .catch(() => reject(new Error('reCAPTCHA token generation failed.')));
    });
  });
}

// Form progress + multi-step wizard
const formFields = ['prenom','nom','telephone','email','niveau','filiere','service','mode'];
const wizardStepRules = {
  1: [
    { id: 'prenom', msg: 'Veuillez entrer votre prénom.' },
    { id: 'nom', msg: 'Veuillez entrer votre nom.' },
    { id: 'telephone', msg: 'Veuillez entrer votre téléphone.' },
    { id: 'email', msg: 'Veuillez entrer votre email.' }
  ],
  2: [
    { id: 'niveau', msg: 'Veuillez sélectionner votre profil.' },
    { id: 'filiere', msg: 'Veuillez sélectionner une option.' },
    { id: 'service', msg: 'Veuillez sélectionner un service.' },
    { id: 'mode', msg: 'Veuillez sélectionner un mode.' }
  ]
};
let wizardStep = 1;

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

function validateStep(step){
  let hasError = false;
  const rules = wizardStepRules[step] || [];
  rules.forEach(({ id, msg }) => {
    const v = val(id);
    if (!v) {
      showFieldError(id, msg);
      hasError = true;
    }
  });

  if (step === 1) {
    const emailVal = val('email');
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      showFieldError('email', 'Format email invalide.');
      hasError = true;
    }
    const phoneVal = val('telephone');
    if (phoneVal && !/^[\d\s+\-()]{8,}$/.test(phoneVal)) {
      showFieldError('telephone', 'Numéro de téléphone invalide.');
      hasError = true;
    }
  }

  if (hasError) {
    const first = document.querySelector('.field-err-border');
    if (first) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
      first.scrollIntoView({
        behavior: reduce.matches ? 'auto' : 'smooth',
        block: 'center'
      });
    }
    return false;
  }
  return true;
}

function updateWizardSummary() {
  const name = `${val('prenom')} ${val('nom')}`.trim();
  const serviceMode = [val('service'), val('mode')].filter(Boolean).join(' / ');
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '—';
  };
  setText('sumName', name);
  setText('sumPhone', val('telephone'));
  setText('sumEmail', val('email'));
  setText('sumNiveau', val('niveau'));
  setText('sumFiliere', val('filiere'));
  setText('sumServiceMode', serviceMode);
}

function setWizardStep(nextStep) {
  wizardStep = Math.max(1, Math.min(3, nextStep));
  for (let i = 1; i <= 3; i++) {
    const panel = document.getElementById(`wizPanel${i}`);
    const dot = document.getElementById(`wizDot${i}`);
    const lbl = document.getElementById(`wizLbl${i}`);
    if (panel) panel.classList.toggle('active', i === wizardStep);
    if (dot) {
      dot.classList.remove('active', 'done');
      dot.textContent = String(i);
      if (i < wizardStep) {
        dot.classList.add('done');
        dot.textContent = '✓';
      } else if (i === wizardStep) {
        dot.classList.add('active');
      }
    }
    if (lbl) {
      lbl.classList.remove('active', 'done');
      if (i < wizardStep) lbl.classList.add('done');
      else if (i === wizardStep) lbl.classList.add('active');
    }
  }
  const l1 = document.getElementById('wizLine1');
  const l2 = document.getElementById('wizLine2');
  if (l1) l1.classList.toggle('done', wizardStep > 1);
  if (l2) l2.classList.toggle('done', wizardStep > 2);
  if (wizardStep === 3) updateWizardSummary();
}

if (leadForm) {
  leadForm.addEventListener('input', updateProgress);
  leadForm.addEventListener('change', updateProgress);
  updateProgress();
  setWizardStep(1);

  leadForm.querySelectorAll('[data-wiz-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearErrors();
      const target = Number(btn.getAttribute('data-wiz-next') || '1');
      if (!validateStep(wizardStep)) return;
      setWizardStep(target);
    });
  });
  leadForm.querySelectorAll('[data-wiz-prev]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearErrors();
      const target = Number(btn.getAttribute('data-wiz-prev') || '1');
      setWizardStep(target);
    });
  });

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    // Ensure all steps valid before final submit
    if (!validateStep(1)) { setWizardStep(1); return; }
    if (!validateStep(2)) { setWizardStep(2); return; }

    const hp = document.getElementById('hp_website');
    if (hp && hp.value.trim() !== '') {
      showSuccess();
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN_MS) {
      const wait = Math.ceil((SUBMIT_COOLDOWN_MS - (now - lastSubmitTime)) / 1000);
      showFieldError('prenom', `Veuillez patienter ${wait}s avant de soumettre à nouveau.`);
      setWizardStep(1);
      return;
    }
    lastSubmitTime = now;

    let recaptchaToken = '';
    try {
      recaptchaToken = await getRecaptchaToken('lead_submit');
      if (!recaptchaToken) {
        throw new Error('Empty reCAPTCHA token.');
      }
    } catch (_) {
      showFieldError('prenom', 'Vérification anti-spam indisponible. Réessayez dans quelques secondes.');
      setWizardStep(1);
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      prenom: val('prenom'),
      nom: val('nom'),
      telephone: val('telephone'),
      email: val('email'),
      niveau: val('niveau'),
      filiere: val('filiere'),
      service: val('service'),
      mode: val('mode'),
      recaptchaToken,
      recaptchaAction: 'lead_submit'
    };

    showSuccess();

    const isValidSheetUrl =
      SHEET_URL &&
      SHEET_URL !== 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' &&
      SHEET_URL.startsWith('https://script.google.com/') &&
      SHEET_URL.length < 500;

    try {
      if (isValidSheetUrl) {
        fetch(SHEET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'no-cors',
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    } catch (_) {}
  });
}

// Programmes — onglets (#svcLayoutRoot + services-layout.css)
(function initSvcLayout() {
  const root = document.getElementById('svcLayoutRoot');
  if (!root) return;

  window.showSvcTab = function (panelKey, btn) {
    const panelId = 'tab-' + panelKey;
    const panel = root.querySelector('#' + panelId) || document.getElementById(panelId);
    root.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    root.querySelectorAll('.tab-btn').forEach((b) => {
      b.classList.remove('active');
      if (b.hasAttribute('aria-selected')) b.setAttribute('aria-selected', 'false');
    });
    if (panel) panel.classList.add('active');
    if (btn) {
      btn.classList.add('active');
      if (btn.hasAttribute('aria-selected')) btn.setAttribute('aria-selected', 'true');
    }
  };

  /* CSP (nonce + script-src) bloque souvent onclick — branchement explicite */
  root.querySelectorAll('.tab-btn[data-svc-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-svc-tab');
      if (key) window.showSvcTab(key, btn);
    });
  });

  function applyConcoursHash() {
    if (location.hash !== '#concours') return;
    const tabBtn = root.querySelector('.tab-btn[data-svc-tab="concours"]');
    window.showSvcTab('concours', tabBtn);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const el = document.getElementById('tab-concours');
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

// Réseaux sociaux — onglets (#social, sans onclick inline)
(function initSocialTabs() {
  const root = document.getElementById('social');
  if (!root) return;

  function showSocialPanel(panelKey, btn) {
    root.querySelectorAll('.soc-panel').forEach((p) => {
      const on = p.id === 'soc-panel-' + panelKey;
      p.classList.toggle('on', on);
      p.hidden = !on;
    });
    root.querySelectorAll('.ptab[data-p]').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('on', on);
      if (b.hasAttribute('aria-selected')) b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  root.querySelectorAll('.ptab[data-p]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-p');
      if (key) showSocialPanel(key, tab);
    });
  });

  const initial = root.querySelector('.ptab.on[data-p]') || root.querySelector('.ptab[data-p]');
  if (initial) {
    const key = initial.getAttribute('data-p');
    if (key) showSocialPanel(key, initial);
  }
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

// Témoignages — scroll horizontal + points + glisser-déposer (desktop)
(function initTestiScrollTrack() {
  const track = document.getElementById('testiScrollTrack');
  const root = document.getElementById('temoignages');
  if (!track || !root || !root.classList.contains('testi-scroll')) return;

  const dots = () => Array.from(root.querySelectorAll('.tB-dot'));
  const prevBtn = root.querySelector('[data-testi-prev]');
  const nextBtn = root.querySelector('[data-testi-next]');
  const cards = () => Array.from(track.querySelectorAll('.tB-card'));
  let activeIdx = 0;

  function setDotsActive(idx) {
    dots().forEach((d, i) => {
      const on = i === idx;
      d.classList.toggle('on', on);
      d.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function scrollToCardCentered(card) {
    if (!card) return;
    const target =
      card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }

  function syncDotsFromScroll() {
    const c = cards();
    if (!c.length) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = Infinity;
    let idx = 0;
    c.forEach((card, i) => {
      const cardMid = card.offsetLeft + card.offsetWidth / 2;
      const d = Math.abs(cardMid - mid);
      if (d < best) {
        best = d;
        idx = i;
      }
    });
    activeIdx = idx;
    setDotsActive(idx);
  }

  let scrollRaf = 0;
  track.addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = 0;
      syncDotsFromScroll();
    });
  }, { passive: true });

  dots().forEach((dot, i) => {
    dot.addEventListener('click', () => {
      const card = cards()[i];
      if (card) scrollToCardCentered(card);
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const list = cards();
      if (!list.length) return;
      activeIdx = (activeIdx - 1 + list.length) % list.length;
      const card = list[activeIdx];
      if (!card) return;
      scrollToCardCentered(card);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const list = cards();
      if (!list.length) return;
      activeIdx = (activeIdx + 1) % list.length;
      const card = list[activeIdx];
      if (!card) return;
      scrollToCardCentered(card);
    });
  }

  let drag = false;
  let startX = 0;
  let startScroll = 0;
  track.addEventListener('mousedown', (e) => {
    drag = true;
    startX = e.pageX;
    startScroll = track.scrollLeft;
  });
  track.addEventListener('mouseleave', () => { drag = false; });
  track.addEventListener('mouseup', () => { drag = false; });
  track.addEventListener('mousemove', (e) => {
    if (!drag) return;
    track.scrollLeft = startScroll - (e.pageX - startX) * 1.2;
  });

  syncDotsFromScroll();
})();

// Lycées AEFE — mobile manual carousel (dots + arrows)
(function initLyceesMobileCycle() {
  const section = document.getElementById('lycees-francais');
  if (!section) return;

  const grid = section.querySelector('.lycees-grid');
  if (!grid) return;
  const dots = Array.from(section.querySelectorAll('.lycees-dot'));
  const prevBtn = section.querySelector('[data-lycee-prev]');
  const nextBtn = section.querySelector('[data-lycee-next]');

  const cards = Array.from(grid.querySelectorAll('.lycee-card'));
  if (cards.length <= 1) return;

  const mobileMq = window.matchMedia('(max-width: 768px)');
  let activeIdx = 0;
  let syncRaf = 0;

  function render() {
    const activeCard = cards[activeIdx];
    if (activeCard) {
      grid.style.minHeight = `${activeCard.offsetHeight}px`;
      const left = activeIdx * grid.clientWidth;
      grid.scrollTo({ left, behavior: 'smooth' });
    }
    dots.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === activeIdx);
    });
  }

  function syncActiveFromScroll() {
    const left = grid.scrollLeft;
    const width = Math.max(1, grid.clientWidth);
    activeIdx = Math.round(left / width) % cards.length;
    dots.forEach((dot, idx) => dot.classList.toggle('is-active', idx === activeIdx));
  }

  function applyMode() {
    if (mobileMq.matches) {
      grid.classList.add('is-mobile-cycle');
      render();
    } else {
      grid.classList.remove('is-mobile-cycle');
      grid.style.minHeight = '';
      grid.scrollTo({ left: 0, behavior: 'auto' });
    }
  }

  applyMode();
  window.addEventListener('resize', applyMode);
  mobileMq.addEventListener('change', applyMode);
  grid.addEventListener('scroll', () => {
    if (syncRaf) return;
    syncRaf = requestAnimationFrame(() => {
      syncRaf = 0;
      syncActiveFromScroll();
    });
  }, { passive: true });
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      activeIdx = idx;
      render();
    });
  });
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      activeIdx = (activeIdx - 1 + cards.length) % cards.length;
      render();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      activeIdx = (activeIdx + 1) % cards.length;
      render();
    });
  }
})();

// Offres — mobile manual carousel (dots + arrows)
(function initOffersMobileCycle() {
  const section = document.querySelector('.offers');
  if (!section) return;

  const grid = section.querySelector('.offers-grid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.card'));
  if (cards.length <= 1) return;

  const dots = Array.from(section.querySelectorAll('.offers-dot'));
  const prevBtn = section.querySelector('[data-offer-prev]');
  const nextBtn = section.querySelector('[data-offer-next]');
  const mobileMq = window.matchMedia('(max-width: 768px)');
  let activeIdx = 0;
  let syncRaf = 0;

  function render() {
    const activeCard = cards[activeIdx];
    if (activeCard) {
      const left = activeIdx * grid.clientWidth;
      grid.scrollTo({ left, behavior: 'smooth' });
    }
    dots.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === activeIdx);
    });
  }

  function syncActiveFromScroll() {
    const left = grid.scrollLeft;
    const width = Math.max(1, grid.clientWidth);
    activeIdx = Math.round(left / width) % cards.length;
    dots.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === activeIdx);
    });
  }

  function applyMode() {
    if (mobileMq.matches) {
      grid.classList.add('is-mobile-cycle');
      render();
    } else {
      grid.classList.remove('is-mobile-cycle');
      grid.scrollTo({ left: 0, behavior: 'auto' });
      dots.forEach((dot, idx) => dot.classList.toggle('is-active', idx === 0));
    }
  }

  applyMode();
  window.addEventListener('resize', applyMode);
  mobileMq.addEventListener('change', applyMode);
  grid.addEventListener('scroll', () => {
    if (syncRaf) return;
    syncRaf = requestAnimationFrame(() => {
      syncRaf = 0;
      syncActiveFromScroll();
    });
  }, { passive: true });
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      activeIdx = idx;
      render();
    });
  });
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      activeIdx = (activeIdx - 1 + cards.length) % cards.length;
      render();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      activeIdx = (activeIdx + 1) % cards.length;
      render();
    });
  }
})();
