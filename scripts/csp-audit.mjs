/**
 * CSP console audit — loads public pages and collects CSP violation messages.
 * Usage: node scripts/csp-audit.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = (process.argv[2] || 'https://www.ncconsulting.ma').replace(/\/$/, '');
const PAGES = ['/', '/methode.html', '/cabinet.html', '/concours.html'];

const violations = [];

function record(type, text, url) {
  violations.push({ type, text, url });
}

async function auditPage(page, path) {
  const url = BASE + path;
  page.on('console', (msg) => {
    const t = msg.text();
    if (
      /refused to|content security policy|csp/i.test(t) ||
      msg.type() === 'error' && /blocked|csp/i.test(t)
    ) {
      record('console', t, url);
    }
  });
  page.on('pageerror', (err) => {
    if (/csp|refused/i.test(String(err))) record('pageerror', String(err), url);
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  if (path === '/') {
    const contact = page.locator('#contact');
    if (await contact.count()) {
      await contact.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }
    for (const sel of ['#prenom', '#nom', '#telephone', '#email']) {
      const el = page.locator(sel);
      if (await el.count()) await el.fill('Test');
    }
    const next1 = page.locator('[data-wiz-next="2"]');
    if (await next1.count()) await next1.click();
    await page.waitForTimeout(800);
    const niveau = page.locator('#niveau');
    if (await niveau.count()) {
      await niveau.selectOption('dirigeant');
      await page.waitForTimeout(400);
    }
    const filiere = page.locator('#filiere');
    if (await filiere.count()) {
      const opts = await filiere.locator('option').count();
      if (opts > 1) await filiere.selectOption({ index: 1 });
    }
    const service = page.locator('#service');
    if (await service.count()) {
      const opts = await service.locator('option').count();
      if (opts > 1) await service.selectOption({ index: 1 });
    }
    const mode = page.locator('#mode');
    if (await mode.count()) await mode.selectOption({ index: 1 });
    const next2 = page.locator('[data-wiz-next="3"]');
    if (await next2.count()) await next2.click();
    await page.waitForTimeout(1500);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let cspHeader = '';
  page.on('response', (res) => {
    if (res.url() === BASE + '/' || res.url() === BASE) {
      cspHeader =
        res.headers()['content-security-policy'] ||
        res.headers()['content-security-policy-report-only'] ||
        cspHeader;
    }
  });

  for (const path of PAGES) {
    try {
      await auditPage(page, path);
    } catch (e) {
      record('navigation', String(e), BASE + path);
    }
  }

  await browser.close();

  console.log('=== CSP header (homepage) ===');
  console.log(cspHeader || '(not captured)');
  console.log('\n=== Violations / errors ===');
  if (!violations.length) {
    console.log('(none detected)');
  } else {
    violations.forEach((v, i) => {
      console.log(`\n[${i + 1}] ${v.url}\n  ${v.type}: ${v.text}`);
    });
  }
  process.exit(violations.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
