'use strict';

const SITE_ORIGIN = String(process.env.SITE_URL || 'https://www.ncconsulting.ma').replace(
  /\/$/,
  ''
);
const CSP_REPORT_GROUP = 'csp-endpoint';
const CSP_REPORT_URL = `${SITE_ORIGIN}/api/csp-report`;

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "media-src 'self'",
  "script-src 'self' https://www.googletagmanager.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://www.instagram.com https://static.cdninstagram.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self' https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://www.instagram.com https://api.instagram.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://region1.google-analytics.com",
  "frame-src https://www.google.com https://www.recaptcha.net https://www.linkedin.com https://www.instagram.com https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
  `report-uri ${CSP_REPORT_URL}`,
  `report-to ${CSP_REPORT_GROUP}`,
];

/** Full policy string (Report-Only header value today; same directives when enforced). */
const CSP_PUBLIC = CSP_DIRECTIVES.join('; ');

/** Legacy Reporting API header (Chrome, older browsers). */
const REPORT_TO_HEADER = JSON.stringify({
  group: CSP_REPORT_GROUP,
  max_age: 10886400,
  endpoints: [{ url: CSP_REPORT_URL }],
});

/** Reporting API v1 header (modern browsers). */
const REPORTING_ENDPOINTS_HEADER = `${CSP_REPORT_GROUP}="${CSP_REPORT_URL}"`;

module.exports = {
  CSP_PUBLIC,
  CSP_REPORT_GROUP,
  CSP_REPORT_URL,
  REPORT_TO_HEADER,
  REPORTING_ENDPOINTS_HEADER,
};
