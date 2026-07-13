'use strict';

const {
  CSP_PUBLIC,
  CSP_REPORT_URL,
  REPORT_TO_HEADER,
  REPORTING_ENDPOINTS_HEADER,
} = require('../config/csp-policy');

console.log('Content-Security-Policy-Report-Only:');
console.log(CSP_PUBLIC);
console.log('\nReport-To:');
console.log(REPORT_TO_HEADER);
console.log('\nReporting-Endpoints:');
console.log(REPORTING_ENDPOINTS_HEADER);
console.log('\nReport URL:', CSP_REPORT_URL);
