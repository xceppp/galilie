'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'site.json'), 'utf8'));
const SITE_URL = (process.env.SITE_URL || config.url).replace(/\/$/, '');

const FORBIDDEN = [/vercel\.app/i, /nconsulting\.vercel/i];
const HTML_FILES = [
  'index.html',
  'mentions-legales.html',
  'confidentialite.html',
  'cgu.html',
];

let failed = false;

function fail(message) {
  failed = true;
  console.error('SEO URL verify FAILED:', message);
}

for (const file of HTML_FILES) {
  const fullPath = path.join(ROOT, file);
  const content = fs.readFileSync(fullPath, 'utf8');

  for (const pattern of FORBIDDEN) {
    if (pattern.test(content)) {
      fail(`${file} contains forbidden URL pattern: ${pattern}`);
    }
  }

  const canonical = content.match(/<link rel="canonical" href="([^"]+)"/);
  if (canonical && !canonical[1].startsWith(SITE_URL)) {
    fail(`${file} canonical must start with ${SITE_URL} (found ${canonical[1]})`);
  }
}

if (fileExists(path.join(ROOT, 'sitemap.xml'))) {
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  if (!sitemap.includes(SITE_URL)) {
    fail('sitemap.xml must use SITE_URL from config/site.json');
  }
  for (const pattern of FORBIDDEN) {
    if (pattern.test(sitemap)) {
      fail(`sitemap.xml contains forbidden URL pattern: ${pattern}`);
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(`SEO URL verify OK — SITE_URL=${SITE_URL}`);

function fileExists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}
