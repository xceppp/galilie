'use strict';

const { sendJson, parseRequestBody, isProduction } = require('../../lib/http');
const {
  verifyGoogleCredential,
  createSessionToken,
  buildSetCookie,
  isAdminAuthConfigured,
} = require('../../lib/adminAuth');

module.exports = async function handler(req, res) {
  try {
    if (!isAdminAuthConfigured()) {
      return sendJson(res, 503, { ok: false, error: 'not_configured' });
    }
    if (req.method !== 'POST') {
      return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
    }
    const parsed = parseRequestBody(req);
    if (!parsed.ok) {
      return sendJson(res, 400, { ok: false, error: 'invalid_json' });
    }
    const credential = parsed.obj && parsed.obj.credential;

    let user;
    try {
      user = await verifyGoogleCredential(credential);
    } catch (e) {
      const msg = String(e && e.message ? e.message : e);
      const code =
        msg === 'not_allowed'
          ? 403
          : msg === 'missing_credential'
          ? 400
          : 401;
      return sendJson(res, code, {
        ok: false,
        error: msg === 'not_allowed' ? 'not_allowed' : 'auth_failed',
      });
    }

    const token = createSessionToken(user);
    const cookie = buildSetCookie(token, req);
    return sendJson(
      res,
      200,
      { ok: true, user: { email: user.email, name: user.name, picture: user.picture } },
      { 'Set-Cookie': cookie }
    );
  } catch (err) {
    console.error('[api/admin/login]', err && err.stack ? err.stack : err);
    const payload = { ok: false, error: 'server_error' };
    if (!isProduction) payload.detail = String(err && err.message).slice(0, 300);
    return sendJson(res, 500, payload);
  }
};
