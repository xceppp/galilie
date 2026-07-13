'use strict';

/**
 * Admin authentication for the CMS panel.
 *
 *  - verifyGoogleCredential(): validates a Google Identity Services ID token
 *    (from the "Sign in with Google" button), checks the email against the
 *    ADMIN_EMAILS allowlist.
 *  - createSessionCookie() / readSession(): a stateless HMAC-signed session
 *    cookie (no DB). Payload = base64url(JSON) + "." + base64url(HMAC-SHA256).
 */

const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const COOKIE_NAME = 'nc_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getClientId() {
  const id = String(process.env.GOOGLE_OAUTH_CLIENT_ID || '').trim();
  if (!id) throw new Error('Missing GOOGLE_OAUTH_CLIENT_ID');
  return id;
}

function getSessionSecret() {
  const s = String(process.env.SESSION_SECRET || '').trim();
  if (!s || s.length < 16) {
    throw new Error('Missing or too-short SESSION_SECRET (min 16 chars)');
  }
  return s;
}

function getAdminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedEmail(email) {
  const allow = getAdminEmails();
  const e = String(email || '').trim().toLowerCase();
  return Boolean(e) && allow.includes(e);
}

let oauthClient = null;
function getOAuthClient() {
  if (!oauthClient) oauthClient = new OAuth2Client(getClientId());
  return oauthClient;
}

/**
 * Verify a Google ID token (credential from GSI). Returns the verified payload
 * (email, name, picture) if the token is valid, from Google, for our client id,
 * and the email is allowlisted. Throws otherwise.
 */
async function verifyGoogleCredential(credential) {
  if (!credential || typeof credential !== 'string') {
    throw new Error('missing_credential');
  }
  const client = getOAuthClient();
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: getClientId(),
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('invalid_token');
  if (payload.email_verified === false) throw new Error('email_not_verified');
  if (!isAllowedEmail(payload.email)) throw new Error('not_allowed');
  return {
    email: String(payload.email).toLowerCase(),
    name: payload.name || '',
    picture: payload.picture || '',
  };
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlToBuf(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s + pad, 'base64');
}

function sign(data) {
  return b64url(
    crypto.createHmac('sha256', getSessionSecret()).update(data).digest()
  );
}

/** Build a signed session token for the given user. */
function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    email: user.email,
    name: user.name || '',
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const body = b64url(JSON.stringify(payload));
  const sig = sign(body);
  return `${body}.${sig}`;
}

/** Verify + decode a session token. Returns payload or null. */
function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(b64urlToBuf(body).toString('utf8'));
  } catch (_) {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload || typeof payload.exp !== 'number' || payload.exp < now) {
    return null;
  }
  if (!isAllowedEmail(payload.email)) return null; // revoked if removed from allowlist
  return payload;
}

function isSecureRequest(req) {
  const proto = String(
    (req.headers && (req.headers['x-forwarded-proto'] || '')) || ''
  ).toLowerCase();
  if (proto) return proto.includes('https');
  return process.env.VERCEL_ENV === 'production';
}

function buildSetCookie(token, req, { clear = false } = {}) {
  const secure = isSecureRequest(req);
  const parts = [
    `${COOKIE_NAME}=${clear ? '' : token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  if (clear) {
    parts.push('Max-Age=0');
  } else {
    parts.push(`Max-Age=${SESSION_TTL_SECONDS}`);
  }
  return parts.join('; ');
}

function parseCookies(req) {
  const header = (req.headers && req.headers.cookie) || '';
  const out = {};
  String(header)
    .split(';')
    .forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return;
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      if (k) out[k] = decodeURIComponent(v);
    });
  return out;
}

/** Read + verify the session from the request cookies. Returns payload or null. */
function readSession(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

module.exports = {
  COOKIE_NAME,
  SESSION_TTL_SECONDS,
  getAdminEmails,
  isAllowedEmail,
  verifyGoogleCredential,
  createSessionToken,
  verifySessionToken,
  buildSetCookie,
  readSession,
};
