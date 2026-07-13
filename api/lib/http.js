'use strict';

/** Shared HTTP helpers for the serverless handlers. */

function sendJson(res, statusCode, payload, extraHeaders) {
  const body = JSON.stringify(payload);
  try {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    if (extraHeaders) {
      Object.entries(extraHeaders).forEach(([k, v]) => res.setHeader(k, v));
    }
    res.end(body);
  } catch (_) {
    /* ignore */
  }
}

function parseRequestBody(req) {
  let b = req.body;
  const isPlainObj =
    b != null &&
    typeof b === 'object' &&
    !Buffer.isBuffer(b) &&
    !(b instanceof Uint8Array) &&
    !(b instanceof ArrayBuffer);
  if (isPlainObj) return { ok: true, obj: b };
  if (typeof b === 'string') {
    try {
      return { ok: true, obj: JSON.parse(b || '{}') };
    } catch (_) {
      return { ok: false, obj: {} };
    }
  }
  if (Buffer.isBuffer(b) || b instanceof Uint8Array) {
    try {
      return { ok: true, obj: JSON.parse(Buffer.from(b).toString('utf8') || '{}') };
    } catch (_) {
      return { ok: false, obj: {} };
    }
  }
  return { ok: true, obj: {} };
}

const isProduction =
  process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

module.exports = { sendJson, parseRequestBody, isProduction };
