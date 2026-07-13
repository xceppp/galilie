'use strict';

const { sendJson } = require('../lib/http');
const { readSession } = require('../lib/adminAuth');

/**
 * Public-ish admin bootstrap config. Exposes only the Google OAuth *client id*
 * (which is public by design) so the static admin page can initialise the
 * "Sign in with Google" button without hardcoding it. Also reports whether the
 * current request already has a valid admin session.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
  }
  const clientId = String(process.env.GOOGLE_OAUTH_CLIENT_ID || '').trim();
  let session = null;
  try {
    session = readSession(req);
  } catch (_) {
    session = null;
  }
  return sendJson(res, 200, {
    ok: true,
    clientId,
    configured: Boolean(clientId),
    authenticated: Boolean(session),
    user: session ? { email: session.email, name: session.name } : null,
  });
};
