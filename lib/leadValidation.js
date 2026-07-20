/**
 * Allowlists aligned with main.js (dependentOptions + mode select).
 */

const ALLOWED_NIVEAU = new Set([
  'candidat_lex',
  'candidat_lpro',
  'candidat_master',
  'etudiant',
  'coaching',
  'autre',
]);

const DEPENDENT = {
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
      "Semaine gratuite Licences d'Excellence",
      "Demande d'information",
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
      "Semaine gratuite Licences d'Excellence",
      "Demande d'information",
      'Préparation Licence Pro',
      'Coaching individuel concours',
    ],
  },
  candidat_master: {
    filieres: ['Finance', 'Management', 'Marketing', 'Économie', 'Autre'],
    services: [
      "Semaine gratuite Licences d'Excellence",
      "Demande d'information",
      'Préparation Master',
      'Coaching individuel concours',
    ],
  },
  etudiant: {
    filieres: ['Bac+2', 'Licence', 'Master', 'Autre'],
    services: [
      "Semaine gratuite Licences d'Excellence",
      "Demande d'information",
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
      "Semaine gratuite Licences d'Excellence",
      "Demande d'information",
      'Consultation 1-à-1',
      'Autre',
    ],
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
  situation: 500,
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
    situation: trimStr(body.situation).slice(0, LIM.situation),
    timestamp: trimStr(body.timestamp).slice(0, LIM.timestamp),
    recaptchaToken: trimStr(body.recaptchaToken),
    recaptchaAction: trimStr(body.recaptchaAction || 'lead_submit').slice(0, 80),
  };

  if (!out.prenom) return { ok: false, error: 'missing_prenom' };
  if (!out.nom) return { ok: false, error: 'missing_nom' };
  if (!out.telephone) return { ok: false, error: 'missing_telephone' };
  if (!out.recaptchaToken) return { ok: false, error: 'missing_recaptchaToken' };

  if (out.email && !verifyEmail(out.email)) return { ok: false, error: 'invalid_email' };
  if (!verifyPhone(out.telephone)) return { ok: false, error: 'invalid_phone' };

  if (!isReasonableClientTimestamp(out.timestamp)) {
    return { ok: false, error: 'invalid_timestamp' };
  }

  if (out.niveau) {
    if (!ALLOWED_NIVEAU.has(out.niveau)) {
      return { ok: false, error: 'invalid_niveau' };
    }
    const dep = DEPENDENT[out.niveau];
    if (!dep) return { ok: false, error: 'invalid_niveau' };
    if (out.filiere && !dep.filieres.includes(out.filiere)) {
      return { ok: false, error: 'invalid_filiere' };
    }
    if (out.service && !dep.services.includes(out.service)) {
      return { ok: false, error: 'invalid_service' };
    }
  }

  if (out.mode && !ALLOWED_MODE.has(out.mode)) {
    return { ok: false, error: 'invalid_mode' };
  }

  return { ok: true, body: out };
}

module.exports = {
  validateAndSanitizeLead,
  trimStr,
  LIM,
};
