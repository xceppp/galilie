'use strict';

const { sendJson, parseRequestBody, isProduction } = require('../../lib/http');
const { readSession, isAdminAuthConfigured } = require('../../lib/adminAuth');
const { readCms, writeCms } = require('../../lib/cmsStore');

/**
 * Admin content endpoint (auth required):
 *   GET  -> full CMS data (including inactive items) for editing
 *   POST -> save { content?, announcements?, formations? }, returns fresh data
 */
module.exports = async function handler(req, res) {
  if (!isAdminAuthConfigured()) {
    return sendJson(res, 503, { ok: false, error: 'not_configured' });
  }
  const session = readSession(req);
  if (!session) {
    return sendJson(res, 401, { ok: false, error: 'unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const data = await readCms();
      return sendJson(res, 200, { ok: true, ...data });
    }

    if (req.method === 'POST') {
      const parsed = parseRequestBody(req);
      if (!parsed.ok) {
        return sendJson(res, 400, { ok: false, error: 'invalid_json' });
      }
      const payload = parsed.obj || {};
      const data = await writeCms(payload);
      return sendJson(res, 200, { ok: true, ...data });
    }

    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
  } catch (err) {
    console.error('[api/admin/content]', err && err.stack ? err.stack : err);
    const payload = { ok: false, error: 'server_error' };
    if (!isProduction) payload.detail = String(err && err.message).slice(0, 400);
    return sendJson(res, 500, payload);
  }
};
