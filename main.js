/* NC Consulting — lead form wizard, validation, reCAPTCHA */

const LEAD_API_URL = '/api/lead';
const RECAPTCHA_SITE_KEY = '6LcTitwsAAAAAKuFlJuCIyeV1ugZkUxNa3GJsdye';

let lastSubmitTime = 0;
const SUBMIT_COOLDOWN_MS = 8000;

const leadForm = document.getElementById('leadForm');
const formWrap = document.getElementById('formWrap');
const successState = document.getElementById('successState');
const niveauSelect = document.getElementById('niveau');
const filiereSelect = document.getElementById('filiere');
const serviceSelect = document.getElementById('service');

const NIVEAU_LABELS = {
  candidat_lex: "Candidat Licence d'Excellence",
  candidat_lpro: 'Candidat Licence Pro',
  candidat_master: 'Candidat Master',
  etudiant: 'Étudiant / Autre filière',
  coaching: 'Coaching / conseil exécutif',
  autre: 'Autre profil',
};

const CAMPAIGN_SERVICE = "Demande d'information";

const dependentOptions = {
  candidat_lex: {
    filieres: [
      'Finance & Comptabilité',
      'Management',
      'Marketing & Commerce',
      'Économie',
      'Ressources humaines',
      'Autre',
    ],
    services: [
      CAMPAIGN_SERVICE,
      'Préparation concours intensive',
      'Coaching individuel concours',
    ],
  },
  candidat_lpro: {
    filieres: [
      'Finance & Comptabilité',
      'Management',
      'Marketing & Commerce',
      'Logistique',
      'Autre',
    ],
    services: [
      CAMPAIGN_SERVICE,
      'Préparation Licence Pro',
      'Coaching individuel concours',
    ],
  },
  candidat_master: {
    filieres: ['Finance', 'Management', 'Marketing', 'Économie', 'Autre'],
    services: [
      CAMPAIGN_SERVICE,
      'Préparation Master',
      'Coaching individuel concours',
    ],
  },
  etudiant: {
    filieres: ['Bac+2', 'Licence', 'Master', 'Autre'],
    services: [
      CAMPAIGN_SERVICE,
      'Orientation & conseil',
      'Coaching individuel',
    ],
  },
  coaching: {
    filieres: [
      'Dirigeant / Entrepreneur',
      'Cadre / Manager',
      'Professionnel',
      'Transition de carrière',
      'Autre',
    ],
    services: [
      'Consultation 1-à-1',
      'Coaching exécutif',
      'Accompagnement & Conseil',
      'Formation sur mesure',
    ],
  },
  autre: {
    filieres: ['À préciser en échange'],
    services: [
      CAMPAIGN_SERVICE,
      'Consultation 1-à-1',
      'Autre',
    ],
  },
};

function fillSelect(selectEl, values, placeholder) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  const ph = document.createElement('option');
  ph.value = '';
  ph.disabled = true;
  ph.selected = true;
  ph.textContent = placeholder;
  selectEl.appendChild(ph);
  values.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });
}

function updateDependentSelects() {
  const key = niveauSelect ? niveauSelect.value : '';
  const dep = dependentOptions[key];
  if (!dep) {
    fillSelect(filiereSelect, [], 'Choisissez d\'abord le profil');
    fillSelect(serviceSelect, [], 'Choisissez d\'abord le profil');
    return;
  }
  fillSelect(filiereSelect, dep.filieres, 'Sélectionnez une spécialité');
  fillSelect(serviceSelect, dep.services, 'Sélectionnez une demande');
}

function val(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  return String(el.value || '').trim();
}

function clearLeadSubmitError() {
  const box = document.getElementById('leadSubmitError');
  if (!box) return;
  box.hidden = true;
  box.textContent = '';
}

function showLeadSubmitError(msg) {
  const box = document.getElementById('leadSubmitError');
  if (!box) return;
  box.hidden = false;
  box.textContent = msg;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearErrors() {
  clearLeadSubmitError();
  document.querySelectorAll('#leadForm .field-error:not(.lead-submit-error)').forEach((el) => el.remove());
  document.querySelectorAll('.field-err-border').forEach((el) => {
    el.classList.remove('field-err-border');
  });
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('field-err-border');
  const field = el.closest('.field');
  if (!field || field.querySelector('.field-error')) return;
  const err = document.createElement('div');
  err.className = 'field-error';
  err.setAttribute('role', 'alert');
  err.textContent = msg;
  field.appendChild(err);
}

function showSuccess() {
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

  const runExecute = () =>
    new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(RECAPTCHA_SITE_KEY, { action })
          .then(resolve)
          .catch(reject);
      });
    });

  try {
    const token = await runExecute();
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('Empty reCAPTCHA token.');
    }
    return token;
  } catch (firstErr) {
    await new Promise((r) => setTimeout(r, 450));
    const token = await runExecute().catch(() => {
      throw firstErr;
    });
    if (typeof token !== 'string' || !token.trim()) {
      throw firstErr;
    }
    return token;
  }
}

;(function warmRecaptchaForLeadForm() {
  if (!isRecaptchaConfigured()) return;
  const kick = () => {
    loadRecaptchaScript().catch(() => {});
  };
  const contact = document.getElementById('contact');
  if (contact && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        io.disconnect();
        kick();
      },
      { rootMargin: '320px', threshold: 0 }
    );
    io.observe(contact);
  }
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(kick, { timeout: 6000 });
  } else {
    window.setTimeout(kick, 3000);
  }
})();

const formFields = ['prenom', 'nom', 'telephone', 'email', 'niveau', 'filiere', 'service', 'mode', 'situation'];
const requiredFormFields = ['prenom', 'nom', 'telephone'];
const wizardStepRules = {
  1: [
    { id: 'prenom', msg: 'Veuillez entrer votre prénom.' },
    { id: 'nom', msg: 'Veuillez entrer votre nom.' },
    { id: 'telephone', msg: 'Veuillez entrer votre téléphone.' },
  ],
  2: [],
};
let wizardStep = 1;

function updateProgress() {
  const filled = requiredFormFields.filter((id) => {
    const el = document.getElementById(id);
    return el && el.value && String(el.value).trim() !== '';
  }).length;
  const pct = Math.round((filled / requiredFormFields.length) * 100);
  const bar = document.getElementById('formProgressBar');
  const lbl = document.getElementById('formProgressLabel');
  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = 'Seuls le nom et le téléphone sont nécessaires.';
}

function validateStep(step) {
  let hasError = false;
  const rules = wizardStepRules[step] || [];
  rules.forEach(({ id, msg }) => {
    if (!val(id)) {
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

  if (step === 2) {
    const niveauKey = val('niveau');
    if (niveauKey) {
      const dep = dependentOptions[niveauKey];
      const filiereVal = val('filiere');
      const serviceVal = val('service');
      if (filiereVal && dep && !dep.filieres.includes(filiereVal)) {
        showFieldError('filiere', 'Option invalide pour ce profil.');
        hasError = true;
      }
      if (serviceVal && dep && !dep.services.includes(serviceVal)) {
        showFieldError('service', 'Service invalide pour ce profil.');
        hasError = true;
      }
    }
    const modeVal = val('mode');
    if (modeVal && !['Présentiel (Meknès)', 'À distance', 'Les deux'].includes(modeVal)) {
      showFieldError('mode', 'Mode invalide.');
      hasError = true;
    }
  }

  if (hasError) {
    const first = document.querySelector('.field-err-border');
    if (first) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
      first.scrollIntoView({
        behavior: reduce.matches ? 'auto' : 'smooth',
        block: 'center',
      });
    }
    return false;
  }
  return true;
}

function updateWizardSummary() {
  const name = `${val('prenom')} ${val('nom')}`.trim();
  const serviceMode = [val('service'), val('mode')].filter(Boolean).join(' / ');
  const niveauKey = val('niveau');
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '—';
  };
  setText('sumName', name);
  setText('sumPhone', val('telephone'));
  setText('sumEmail', val('email'));
  setText('sumNiveau', NIVEAU_LABELS[niveauKey] || niveauKey);
  setText('sumFiliere', val('filiere'));
  setText('sumServiceMode', serviceMode);
  setText('sumSituation', val('situation'));
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

window.ncResetLeadForm = function ncResetLeadForm() {
  setWizardStep(1);
  clearErrors();
};

/** Prefill lead form for inscription CTAs (demande d'information) */
window.ncPrefillCampaignLead = function ncPrefillCampaignLead() {
  if (!niveauSelect) return;
  niveauSelect.value = 'candidat_lex';
  updateDependentSelects();
  if (serviceSelect) {
    const opts = Array.from(serviceSelect.options);
    const match = opts.find((o) => o.value === CAMPAIGN_SERVICE);
    if (match) serviceSelect.value = CAMPAIGN_SERVICE;
  }
  const modeEl = document.getElementById('mode');
  if (modeEl) modeEl.value = 'À distance';
};

if (niveauSelect) {
  niveauSelect.addEventListener('change', updateDependentSelects);
  updateDependentSelects();
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

  leadForm.querySelectorAll('[data-wiz-skip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearErrors();
      setWizardStep(Number(btn.getAttribute('data-wiz-skip') || '3'));
    });
  });

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

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

    let recaptchaToken = '';
    try {
      recaptchaToken = await getRecaptchaToken('lead_submit');
      if (!recaptchaToken) throw new Error('Empty reCAPTCHA token.');
    } catch (_) {
      showFieldError('prenom', 'Vérification anti-spam indisponible. Réessayez dans quelques secondes.');
      setWizardStep(1);
      return;
    }

    lastSubmitTime = Date.now();

    const submitBtn = document.getElementById('leadSubmitBtn');
    const prevSubmitLabel = submitBtn ? submitBtn.textContent : '';
    clearLeadSubmitError();

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
      situation: val('situation'),
      recaptchaToken,
      recaptchaAction: 'lead_submit',
    };

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours…';
      }

      let res;
      try {
        res = await fetch(LEAD_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'same-origin',
        });
      } catch (_) {
        lastSubmitTime = 0;
        showLeadSubmitError('Impossible de joindre le serveur. Vérifiez la connexion et réessayez.');
        return;
      }

      let apiJson = null;
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          apiJson = await res.json();
        }
      } catch (_) {
        apiJson = null;
      }

      if (!res.ok || !apiJson || apiJson.ok !== true) {
        lastSubmitTime = 0;
        const code = apiJson && apiJson.error ? String(apiJson.error) : '';
        let msg = 'Erreur à l’envoi. Réessayez dans quelques instants.';
        if (!apiJson) {
          msg = 'Réponse serveur invalide (HTTP ' + res.status + '). Vérifiez les logs Vercel pour /api/lead.';
        } else if (code === 'recaptcha_failed') {
          msg = 'Vérification de sécurité non validée (score faible ou configuration). Réessayez.';
        } else if (code === 'invalid_json' || code === 'unsupported_media_type') {
          msg = 'Rechargez la page et réessayez.';
        } else if (code && /^invalid_|^missing_/.test(code)) {
          msg = 'Données invalides ou incomplètes. Vérifiez le formulaire ou rechargez la page.';
        } else if (code === 'server_error') {
          msg = apiJson.detail
            ? 'Erreur serveur : ' + String(apiJson.detail).slice(0, 220) + (String(apiJson.detail).length > 220 ? '…' : '')
            : 'Une erreur serveur est survenue. Réessayez dans quelques instants.';
        } else if (code === 'misconfigured_recaptcha' || code === 'misconfigured_sheets') {
          msg = apiJson.hint || 'Configuration serveur incomplète. Le formulaire ne peut pas enregistrer les demandes pour le moment.';
        }
        if (apiJson && apiJson.tab) {
          msg += ' (onglet attendu : ' + apiJson.tab + ')';
        }
        showLeadSubmitError(msg);
        return;
      }

      showSuccess();
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = prevSubmitLabel;
      }
    }
  });
}

(function applyLeadUrlParams() {
  if (!leadForm || !niveauSelect) return;
  const params = new URLSearchParams(window.location.search);
  const intent = params.get('intent');
  const programme = params.get('programme');
  const objectif = params.get('objectif');
  const situationField = document.getElementById('situation');
  const map = {
    licence: 'candidat_lex',
    lpro: 'candidat_lpro',
    master: 'candidat_master',
    coaching: 'coaching',
  };
  const intentKey =
    map[programme] ||
    (intent === 'concours'
      ? 'candidat_lex'
      : intent === 'coaching'
        ? 'coaching'
        : intent === 'conseil'
          ? 'autre'
          : '');
  if (intentKey) {
    niveauSelect.value = intentKey;
    updateDependentSelects();
    setWizardStep(2);
  }
  if (situationField && objectif) {
    situationField.value = objectif;
  } else if (situationField && intent === 'conseil' && !situationField.value) {
    situationField.value = 'Conseil stratégique / accompagnement dirigeant';
  }
  const formSection = document.getElementById('formulaire') || document.getElementById('formWrap');
  if (formSection && (intent || window.location.pathname.endsWith('form.html'))) {
    requestAnimationFrame(() => {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
})();
