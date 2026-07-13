'use strict';

const { sendJson } = require('../../lib/http');
const { buildSetCookie } = require('../../lib/adminAuth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
  }
  const cookie = buildSetCookie('', req, { clear: true });
  return sendJson(res, 200, { ok: true }, { 'Set-Cookie': cookie });
};
