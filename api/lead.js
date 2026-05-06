const { appendLeadRow } = require('./lib/sheets');

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
  const data = await resp.json();
  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE || '0.5');
  const ok =
    data &&
    data.success === true &&
    data.action === expectedAction &&
    Number(data.score || 0) >= minScore;
  return { ok, data };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const body = req.body || {};

  for (const field of REQUIRED_FIELDS) {
    if (!String(body[field] || '').trim()) {
      return res.status(400).json({ ok: false, error: `missing_${field}` });
    }
  }

  if (!verifyEmail(body.email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }
  if (!verifyPhone(body.telephone)) {
    return res.status(400).json({ ok: false, error: 'invalid_phone' });
  }

  try {
    const recaptchaAction = body.recaptchaAction || 'lead_submit';
    const recaptcha = await verifyRecaptcha(body.recaptchaToken, recaptchaAction);
    if (!recaptcha.ok) {
      return res.status(403).json({ ok: false, error: 'recaptcha_failed' });
    }

    const { tabName } = await appendLeadRow(body, recaptcha.data);
    return res.status(200).json({ ok: true, tab: tabName });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'server_error', detail: String(err.message || err) });
  }
};
