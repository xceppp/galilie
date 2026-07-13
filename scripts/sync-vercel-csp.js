'use strict';

const fs = require('fs');
const path = require('path');
const {
  CSP_PUBLIC,
  REPORT_TO_HEADER,
  REPORTING_ENDPOINTS_HEADER,
} = require('../config/csp-policy');

const vercelPath = path.join(__dirname, '..', 'vercel.json');
const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));

const publicBlock = vercel.headers.find(function (h) {
  return h.source === '/((?!admin|api).*)';
});

if (!publicBlock) {
  console.error('Public headers block not found in vercel.json');
  process.exit(1);
}

function upsertHeader(key, value) {
  const idx = publicBlock.headers.findIndex(function (h) {
    return h.key === key;
  });
  if (idx === -1) {
    publicBlock.headers.push({ key, value });
  } else {
    publicBlock.headers[idx].value = value;
  }
}

upsertHeader('Content-Security-Policy-Report-Only', CSP_PUBLIC);
upsertHeader('Report-To', REPORT_TO_HEADER);
upsertHeader('Reporting-Endpoints', REPORTING_ENDPOINTS_HEADER);

fs.writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + '\n');
console.log('Synced vercel.json public security headers from config/csp-policy.js');
console.log('CSP length:', CSP_PUBLIC.length);
