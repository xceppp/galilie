'use strict';

const { readCmsPublic } = require('../lib/cmsStore');
const { isProduction } = require('../lib/http');

/** Public content endpoint consumed by cms.js on the live site. Edge-cached. */
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }
  try {
    const data = await readCmsPublic();
    const ttl = Number(process.env.CMS_CACHE_SECONDS || '60');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Cache-Control',
      `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=300`
    );
    res.end(JSON.stringify({ ok: true, ...data }));
  } catch (err) {
    console.error('[api/content]', err && err.stack ? err.stack : err);
    // Fail soft: the site falls back to its built-in markup.
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const payload = { ok: false, error: 'server_error' };
    if (!isProduction) payload.detail = String(err && err.message).slice(0, 300);
    res.end(JSON.stringify(payload));
  }
};
