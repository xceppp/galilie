const { appendLeadRow } = require('./lib/sheets');

/** Réponse JSON fiable sur Node (fallback si res.status/res.json sont absents). */
function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  try {
    if (typeof res.status === 'function' && typeof res.json === 'function') {
      res.status(statusCode).json(payload);
      return;
    }
  } catch (_) {
    /* fall through */
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

/** Vercel / Node peuvent livrer req.body sous forme objet, chaîne ou Buffer. */
function parseRequestBody(req) {
  let b = req.body;
  const isPlainObj =
    b != null &&
    typeof b === 'object' &&
    !Buffer.isBuffer(b) &&
    !(b instanceof Uint8Array) &&
    !(b instanceof ArrayBuffer);
  if (isPlainObj) {
    return b;
  }
  if (typeof b === 'string') {
    try {
      return JSON.parse(b || '{}');
    } catch (_) {
      return {};
    }
  }
  if (Buffer.isBuffer(b) || b instanceof Uint8Array) {
    try {
      return JSON.parse(Buffer.from(b).toString('utf8') || '{}');
    } catch (_) {
      return {};
    }
  }
  return {};
}

const REQUIRED_FIELDS = [
  'prenom',
  'nom',
  'telephone',
  'email',
  'niveau',
  'filiere',
  'service',
  'mode',
  'recaptchaToken',
];

function verifyEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function verifyPhone(phone) {
  return /^[\d\s+\-()]{8,}$/.test(String(phone || '').trim());
}

async function verifyRecaptcha(token, expectedAction) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) throw new Error('Missing RECAPTCHA_SECRET_KEY');

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', token);

  const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const raw = await resp.text();
  let data;
  try {
    data = JSON.parse(raw || '{}');
  } catch (_) {
    return { ok: false, data: {} };
  }
  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || '0.5');
  const scoreOk = data && data.success === true && Number(data.score || 0) >= minScore;
  const actionOk =
    !data ||
    data.action === undefined ||
    data.action === null ||
    data.action === '' ||
    String(data.action) === String(expectedAction || 'lead_submit');
  const ok = Boolean(scoreOk && actionOk);
  return { ok, data };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
    }

    const body = parseRequestBody(req);

    for (const field of REQUIRED_FIELDS) {
      if (!String(body[field] || '').trim()) {
        return sendJson(res, 400, { ok: false, error: `missing_${field}` });
      }
    }

    if (!verifyEmail(body.email)) {
      return sendJson(res, 400, { ok: false, error: 'invalid_email' });
    }
    if (!verifyPhone(body.telephone)) {
      return sendJson(res, 400, { ok: false, error: 'invalid_phone' });
    }

    const recaptchaAction = body.recaptchaAction || 'lead_submit';
    const recaptcha = await verifyRecaptcha(body.recaptchaToken, recaptchaAction);
    if (!recaptcha.ok) {
      return sendJson(res, 403, {
        ok: false,
        error: 'recaptcha_failed',
        score: recaptcha.data && recaptcha.data.score != null ? recaptcha.data.score : undefined,
      });
    }

    const { tabName } = await appendLeadRow(body, recaptcha.data);
    return sendJson(res, 200, { ok: true, tab: tabName });
  } catch (err) {
    console.error('[api/lead]', err && err.stack ? err.stack : err);
    const msg = String(err && err.message ? err.message : err);
    return sendJson(res, 500, {
      ok: false,
      error: 'server_error',
      detail: msg.slice(0, 400),
    });
  }
};
