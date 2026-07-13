'use strict';

/**
 * Receives CSP violation reports (Report-Only or enforced).
 * Logs structured JSON to Vercel function logs — search "[csp-report]" in dashboard.
 */

function send(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(body ? JSON.stringify(body) : '');
}

function parseBody(req) {
  let raw = req.body;
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }
  if (Buffer.isBuffer(raw) || raw instanceof Uint8Array) {
    try {
      return JSON.parse(Buffer.from(raw).toString('utf8'));
    } catch (_) {
      return null;
    }
  }
  if (typeof raw === 'object') return raw;
  return null;
}

function normalizeReports(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload['csp-report']) return [payload];
  if (payload.body && payload.type) return [payload];
  return [payload];
}

function extractViolation(report) {
  const legacy = report && report['csp-report'];
  const body = report && report.body;

  return {
    type: report.type || 'csp-violation',
    document:
      (body && body.documentURL) ||
      (legacy && legacy['document-uri']) ||
      (legacy && legacy.documentURI) ||
      '',
    blocked:
      (body && body.blockedURL) ||
      (legacy && legacy['blocked-uri']) ||
      (legacy && legacy.blockedURI) ||
      '',
    directive:
      (body && body.effectiveDirective) ||
      (legacy && legacy['violated-directive']) ||
      (legacy && legacy.violatedDirective) ||
      '',
    originalPolicy:
      (body && body.originalPolicy) ||
      (legacy && legacy['original-policy']) ||
      (legacy && legacy.originalPolicy) ||
      '',
    disposition: (body && body.disposition) || (legacy && legacy.disposition) || '',
    sourceFile: (body && body.sourceFile) || (legacy && legacy['source-file']) || '',
    lineNumber: (body && body.lineNumber) || (legacy && legacy['line-number']) || '',
    sample: (body && body.sample) || '',
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.end();
  }

  if (req.method !== 'POST') {
    return send(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  const payload = parseBody(req);
  const reports = normalizeReports(payload);

  if (!reports.length) {
    return send(res, 400, { ok: false, error: 'invalid_report' });
  }

  const ts = new Date().toISOString();
  reports.forEach(function (report) {
    const v = extractViolation(report);
    console.log(
      '[csp-report]',
      JSON.stringify({
        ts,
        document: v.document,
        blocked: v.blocked,
        directive: v.directive,
        disposition: v.disposition,
        sourceFile: v.sourceFile,
        lineNumber: v.lineNumber,
        sample: v.sample,
        originalPolicy: v.originalPolicy ? v.originalPolicy.slice(0, 200) : '',
      })
    );
  });

  res.statusCode = 204;
  res.setHeader('Cache-Control', 'no-store');
  return res.end();
};
