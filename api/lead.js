const { appendLeadRow } = require('./lib/sheets');
const { validateAndSanitizeLead } = require('./lib/leadValidation');

const isProduction =
  process.env.VERCEL_ENV === 'production' ||
  process.env.NODE_ENV === 'production';

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
  res.setHeader('X-Content-Type-Options', 'nosniff');
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
    return { ok: true, obj: b };
  }
  if (typeof b === 'string') {
    try {
      return { ok: true, obj: JSON.parse(b || '{}') };
    } catch (_) {
      return { ok: false, obj: {} };
    }
  }
  if (Buffer.isBuffer(b) || b instanceof Uint8Array) {
    try {
      return {
        ok: true,
        obj: JSON.parse(Buffer.from(b).toString('utf8') || '{}'),
      };
    } catch (_) {
      return { ok: false, obj: {} };
    }
  }
  return { ok: true, obj: {} };
}

function wantsJsonBody(req) {
  const ct = String(
    req.headers['content-type'] || req.headers['Content-Type'] || ''
  ).toLowerCase();
  return ct.includes('application/json');
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
  const scoreOk =
    data && data.success === true && Number(data.score || 0) >= minScore;
  const actionOk =
    !data ||
    data.action === undefined ||
    data.action === null ||
    data.action === '' ||
    String(data.action) === String(expectedAction || 'lead_submit');

  const hostname = data && data.hostname ? String(data.hostname).toLowerCase() : '';
  const hostRules = String(process.env.RECAPTCHA_ALLOWED_HOSTNAMES || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const hostnameOk =
    hostRules.length === 0 ||
    (hostname && hostRules.some((h) => h === hostname));

  const ok = Boolean(scoreOk && actionOk && hostnameOk);
  return { ok, data };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
    }

    if (!wantsJsonBody(req)) {
      return sendJson(res, 415, { ok: false, error: 'unsupported_media_type' });
    }

    const parsed = parseRequestBody(req);
    if (!parsed.ok) {
      return sendJson(res, 400, { ok: false, error: 'invalid_json' });
    }

    const check = validateAndSanitizeLead(parsed.obj);
    if (!check.ok) {
      return sendJson(res, 400, { ok: false, error: check.error });
    }

    const body = check.body;

    const recaptcha = await verifyRecaptcha(
      body.recaptchaToken,
      body.recaptchaAction
    );
    if (!recaptcha.ok) {
      const payload = { ok: false, error: 'recaptcha_failed' };
      if (!isProduction && recaptcha.data && recaptcha.data.score != null) {
        payload.score = recaptcha.data.score;
      }
      return sendJson(res, 403, payload);
    }

    const { tabName } = await appendLeadRow(body, recaptcha.data);
    return sendJson(res, 200, { ok: true, tab: tabName });
  } catch (err) {
    console.error('[api/lead]', err && err.stack ? err.stack : err);
    const msg = String(err && err.message ? err.message : err);
    const payload = { ok: false, error: 'server_error' };
    if (!isProduction) {
      payload.detail = msg.slice(0, 400);
    }
    return sendJson(res, 500, payload);
  }
};
