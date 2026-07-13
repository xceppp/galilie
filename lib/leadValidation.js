/**
 * Allowlists aligned with main.js (dependentOptions + mode select).
 */

const ALLOWED_NIVEAU = new Set([
  'dirigeant',
  'cadre',
  'professionnel',
  'transition',
  'formation',
  'autre',
]);

const DEPENDENT = {
  dirigeant: {
    filieres: ['PME / Startup', 'Institution', 'Croissance & scale-up', 'Autre'],
    services: ['Consultation 1-à-1', 'Coaching exécutif', 'Accompagnement & Conseil'],
  },
  cadre: {
    filieres: ['Management', 'Poste de direction', 'Performance & équipe', 'Autre'],
    services: ['Consultation 1-à-1', 'Coaching exécutif', 'Accompagnement & Conseil'],
  },
  professionnel: {
    filieres: ['Évolution de carrière', 'Communication', 'Leadership', 'Autre'],
    services: ['Consultation 1-à-1', 'Coaching exécutif', 'Formation sur mesure'],
  },
  transition: {
    filieres: ['Changement de poste', 'Reconversion', 'Création d\'activité', 'Autre'],
    services: ['Consultation 1-à-1', 'Coaching exécutif', 'Accompagnement & Conseil'],
  },
  formation: {
    filieres: ['Leadership & management', 'Finance & stratégie', 'Communication & posture', 'Gestion de projet', 'Digital & data', 'Autre'],
    services: ['Formation sur mesure', 'Consultation 1-à-1', 'Coaching exécutif'],
  },
  autre: {
    filieres: ['À préciser en échange'],
    services: ['Consultation 1-à-1', 'Coaching exécutif', 'Accompagnement & Conseil', 'Formation sur mesure'],
  },
};

const ALLOWED_MODE = new Set([
  'Présentiel (Meknès)',
  'À distance',
  'Les deux',
]);

const LIM = {
  prenom: 120,
  nom: 120,
  telephone: 40,
  email: 254,
  filiere: 200,
  service: 200,
  mode: 80,
  timestamp: 64,
};

function trimStr(v) {
  return String(v == null ? '' : v)
    .trim()
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

function verifyEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function verifyPhone(phone) {
  return /^[\d\s+\-()]{8,}$/.test(String(phone || '').trim());
}

function isReasonableClientTimestamp(iso) {
  const s = String(iso || '').trim();
  if (!s) return true;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  const skew = 7 * 24 * 60 * 60 * 1000;
  return t >= now - skew && t <= now + skew;
}

function validateAndSanitizeLead(body) {
  const out = {
    prenom: trimStr(body.prenom).slice(0, LIM.prenom),
    nom: trimStr(body.nom).slice(0, LIM.nom),
    telephone: trimStr(body.telephone).slice(0, LIM.telephone),
    email: trimStr(body.email).slice(0, LIM.email).toLowerCase(),
    niveau: trimStr(body.niveau),
    filiere: trimStr(body.filiere).slice(0, LIM.filiere),
    service: trimStr(body.service).slice(0, LIM.service),
    mode: trimStr(body.mode).slice(0, LIM.mode),
    timestamp: trimStr(body.timestamp).slice(0, LIM.timestamp),
    recaptchaToken: trimStr(body.recaptchaToken),
    recaptchaAction: trimStr(body.recaptchaAction || 'lead_submit').slice(0, 80),
  };

  if (!out.prenom) return { ok: false, error: 'missing_prenom' };
  if (!out.nom) return { ok: false, error: 'missing_nom' };
  if (!out.telephone) return { ok: false, error: 'missing_telephone' };
  if (!out.email) return { ok: false, error: 'missing_email' };
  if (!out.niveau) return { ok: false, error: 'missing_niveau' };
  if (!out.filiere) return { ok: false, error: 'missing_filiere' };
  if (!out.service) return { ok: false, error: 'missing_service' };
  if (!out.mode) return { ok: false, error: 'missing_mode' };
  if (!out.recaptchaToken) return { ok: false, error: 'missing_recaptchaToken' };

  if (!verifyEmail(out.email)) return { ok: false, error: 'invalid_email' };
  if (!verifyPhone(out.telephone)) return { ok: false, error: 'invalid_phone' };

  if (!ALLOWED_NIVEAU.has(out.niveau)) {
    return { ok: false, error: 'invalid_niveau' };
  }
  if (!isReasonableClientTimestamp(out.timestamp)) {
    return { ok: false, error: 'invalid_timestamp' };
  }

  const dep = DEPENDENT[out.niveau];
  if (!dep) return { ok: false, error: 'invalid_niveau' };

  if (!dep.filieres.includes(out.filiere)) return { ok: false, error: 'invalid_filiere' };
  if (!dep.services.includes(out.service)) return { ok: false, error: 'invalid_service' };
  if (!ALLOWED_MODE.has(out.mode)) return { ok: false, error: 'invalid_mode' };

  return { ok: true, body: out };
}

module.exports = {
  validateAndSanitizeLead,
  trimStr,
  LIM,
};
