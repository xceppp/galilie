/**
 * Lightweight CSP console audit via puppeteer (no playwright browser bundle).
 */
import puppeteer from 'puppeteer';

const BASE = (process.argv[2] || 'https://www.ncconsulting.ma').replace(/\/$/, '');
const PAGES = ['/', '/methode.html', '/cabinet.html', '/concours.html'];
const violations = [];

async function auditPage(page, path) {
  const url = BASE + path;
  page.on('console', (msg) => {
    const t = msg.text();
    if (/content security policy|refused to/i.test(t)) {
      violations.push({ url, text: t });
    }
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3000));

  if (path === '/') {
    await page.evaluate(() => document.querySelector('#contact')?.scrollIntoView());
    await page.type('#prenom', 'Test', { delay: 20 });
    await page.type('#nom', 'CSP', { delay: 20 });
    await page.type('#telephone', '+212600000000', { delay: 20 });
    await page.type('#email', 'test@example.com', { delay: 20 });
    await page.click('[data-wiz-next="2"]');
    await new Promise((r) => setTimeout(r, 600));
    await page.select('#niveau', 'dirigeant');
    await new Promise((r) => setTimeout(r, 400));
    await page.select('#filiere', await page.$eval('#filiere option:nth-child(2)', (o) => o.value));
    await page.select('#service', await page.$eval('#service option:nth-child(2)', (o) => o.value));
    await page.select('#mode', await page.$eval('#mode option:nth-child(2)', (o) => o.value));
    await page.click('[data-wiz-next="3"]');
    await new Promise((r) => setTimeout(r, 2000));
  }
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
let header = '';
page.on('response', (res) => {
  if (res.url() === BASE + '/' || res.url() === BASE) {
    header =
      res.headers()['content-security-policy-report-only'] ||
      res.headers()['content-security-policy'] ||
      header;
  }
});

for (const path of PAGES) {
  try {
    await auditPage(page, path);
  } catch (e) {
    violations.push({ url: BASE + path, text: 'navigation: ' + e.message });
  }
}

await browser.close();

console.log('HEADER:', header.slice(0, 120) + '...');
console.log('VIOLATIONS:', violations.length);
const uniq = [...new Map(violations.map((v) => [v.text, v])).values()];
uniq.forEach((v) => console.log('-', v.url, '\n ', v.text));
process.exit(uniq.length ? 1 : 0);
