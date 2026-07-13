'use strict';

/**
 * Content-Security-Policy for public pages (ncconsulting.ma).
 * Served via vercel.json — keep in sync with scripts/print-csp-header.js output.
 *
 * Domains inventory (verified against HTML/JS):
 * - script-src: self, googletagmanager.com (GTM+gtag), google.com (reCAPTCHA),
 *   gstatic.com, recaptcha.net, instagram.com + cdninstagram.com (embed.js)
 * - style-src: self unsafe-inline (embeds + theme), fonts.googleapis.com
 * - font-src: self, fonts.gstatic.com, data:
 * - img-src: self, data:, https: (social CDNs, OG images)
 * - connect-src: self (/api/*), Google reCAPTCHA/analytics/GTM, Instagram API
 * - frame-src: google.com/recaptcha.net (reCAPTCHA), linkedin.com, instagram.com, GTM noscript
 * - media-src: self (hero video)
 */
const CSP_PUBLIC = [
  "default-src 'self'",
  "media-src 'self'",
  "script-src 'self' https://www.googletagmanager.com https://tagmanager.google.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://www.instagram.com https://static.cdninstagram.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self' https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://www.instagram.com https://api.instagram.com https://graph.instagram.com https://www.googletagmanager.com https://tagmanager.google.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://region1.google-analytics.com https://stats.g.doubleclick.net",
  "frame-src https://www.google.com https://www.recaptcha.net https://www.linkedin.com https://www.instagram.com https://www.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

module.exports = { CSP_PUBLIC };
