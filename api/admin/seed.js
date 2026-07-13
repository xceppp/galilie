'use strict';

const { sendJson } = require('../../lib/http');
const { readSession } = require('../../lib/adminAuth');
const { seedFromDefaults } = require('../../lib/cmsStore');

/** POST — overwrite all CMS tabs with the built-in site defaults (current site copy). */
module.exports = async function handler(req, res) {
  if (!readSession(req)) {
    return sendJson(res, 401, { ok: false, error: 'unauthorized' });
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
  }
  try {
    const data = await seedFromDefaults();
    return sendJson(res, 200, { ok: true, ...data });
  } catch (err) {
    console.error('[api/admin/seed]', err && err.stack ? err.stack : err);
    return sendJson(res, 500, { ok: false, error: 'server_error' });
  }
};
