'use strict';

/**
 * CMS storage — Google Sheet tabs (same spreadsheet as leads).
 * Singletons: cms_content
 * Lists: announcements, trust, formations, faq, cases, clients, blog, nouveau
 */

const {
  getSheetsClient,
  getSheetsId,
  ensureTabExists,
  a1Range,
} = require('./sheets');

const SITE_DEFAULTS = require('./cmsDefaults');

function safeCell(value) {
  // Sheets cell limit ~50k; leave headroom for formula-escape prefix
  let s = String(value == null ? '' : value).slice(0, 49000);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return s;
}

const TAB_CONTENT = 'cms_content';
const TAB_ANNOUNCEMENTS = 'cms_announcements';
const TAB_TRUST = 'cms_trust';
const TAB_FORMATIONS = 'cms_formations';
const TAB_FAQ = 'cms_faq';
const TAB_CASES = 'cms_cases';
const TAB_CLIENTS = 'cms_clients';
const TAB_BLOG = 'cms_blog';
const TAB_NOUVEAU = 'cms_nouveau';

const ALL_TABS = [
  TAB_CONTENT,
  TAB_ANNOUNCEMENTS,
  TAB_TRUST,
  TAB_FORMATIONS,
  TAB_FAQ,
  TAB_CASES,
  TAB_CLIENTS,
  TAB_BLOG,
  TAB_NOUVEAU,
];

const HEADERS = {
  [TAB_CONTENT]: ['key', 'value'],
  [TAB_ANNOUNCEMENTS]: [
    'id',
    'title',
    'text',
    'status',
    'date_day',
    'date_month',
    'image',
    'body',
    'details',
    'cta_label',
    'cta_url',
    'active',
    'order',
  ],
  [TAB_TRUST]: ['id', 'bold', 'text', 'active', 'order'],
  [TAB_FORMATIONS]: [
    'id', 'tag', 'title', 'subtitle', 'items', 'cta_url', 'active', 'order', 'cta_label',
  ],
  [TAB_FAQ]: ['id', 'question', 'answer', 'active', 'order'],
  [TAB_CASES]: ['id', 'tag', 'title', 'description', 'outcome', 'active', 'order'],
  [TAB_CLIENTS]: ['id', 'label', 'active', 'order'],
  [TAB_BLOG]: [
    'id',
    'slug',
    'title',
    'excerpt',
    'category',
    'body_html',
    'image',
    'date',
    'read_min',
    'featured',
    'meta_description',
    'active',
    'order',
  ],
  [TAB_NOUVEAU]: [
    'id',
    'type',
    'title',
    'summary',
    'status',
    'etab',
    'deadline',
    'ville',
    'facts',
    'body',
    'nc_angle',
    'source_label',
    'source_url',
    'active',
    'order',
    'cta_url',
  ],
};

const DEFAULTS = {
  content: { ...SITE_DEFAULTS.content },
  announcements: SITE_DEFAULTS.announcements.map((x) => ({ ...x })),
  trust: SITE_DEFAULTS.trust.map((x) => ({ ...x })),
  formations: SITE_DEFAULTS.formations.map((x) => ({ ...x })),
  faq: SITE_DEFAULTS.faq.map((x) => ({ ...x })),
  cases: SITE_DEFAULTS.cases.map((x) => ({ ...x })),
  clients: SITE_DEFAULTS.clients.map((x) => ({ ...x })),
  blog: SITE_DEFAULTS.blog.map((x) => ({ ...x })),
  nouveau: SITE_DEFAULTS.nouveau.map((x) => ({ ...x })),
};

function endColumnLetter(count) {
  let n = count;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function toBool(v) {
  const s = String(v == null ? '' : v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'oui' || s === 'yes' || s === 'x';
}

function toNum(v, fallback = 0) {
  const n = Number(String(v == null ? '' : v).trim());
  return Number.isFinite(n) ? n : fallback;
}

async function ensureCmsTab(sheets, spreadsheetId, tabName) {
  await ensureTabExists(sheets, spreadsheetId, tabName);
  const headers = HEADERS[tabName];
  const esc = tabName.replace(/'/g, "''");
  const getResp = await sheets.spreadsheets.values
    .get({ spreadsheetId, range: `'${esc}'!1:1` })
    .catch(() => ({ data: {} }));
  const firstRow = getResp.data.values && getResp.data.values[0];
  const needWrite =
    !Array.isArray(firstRow) ||
    !firstRow.length ||
    firstRow.length < headers.length;
  if (needWrite) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${esc}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }
}

async function readRows(sheets, spreadsheetId, tabName) {
  const endCol = endColumnLetter(HEADERS[tabName].length);
  const resp = await sheets.spreadsheets.values
    .get({ spreadsheetId, range: a1Range(tabName, endCol) })
    .catch(() => ({ data: {} }));
  return (resp.data.values || []).slice(1);
}

function rowsToObjects(rows, headers) {
  return rows.map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] != null ? row[i] : '';
    });
    return obj;
  });
}

async function writeTab(sheets, spreadsheetId, tabName, rows) {
  const headers = HEADERS[tabName];
  const endCol = endColumnLetter(headers.length);
  const esc = tabName.replace(/'/g, "''");
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${esc}'!A:${endCol}`,
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${esc}'!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [headers, ...rows.map((r) => r.map((c) => safeCell(c)))],
    },
  });
}

function contentObjsToMap(objs) {
  const map = {};
  objs.forEach((o) => {
    const key = String(o.key || '').trim();
    if (key) map[key] = String(o.value != null ? o.value : '');
  });
  return map;
}

function mergeContent(stored) {
  return { ...DEFAULTS.content, ...stored };
}

function shapeSimple(objs, fields) {
  return objs
    .filter((o) => fields.some((f) => String(o[f] || '').trim()))
    .map((o) => {
      const out = {};
      fields.forEach((f) => {
        out[f] = String(o[f] != null ? o[f] : '');
      });
      if ('active' in out) out.active = toBool(o.active);
      if ('order' in out) out.order = toNum(o.order, 0);
      return out;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function shapeAnnouncements(objs) {
  return objs
    .filter((o) => String(o.id || '').trim() || String(o.title || o.text || '').trim())
    .map((o) => ({
      id: String(o.id || '').trim(),
      title: String(o.title || o.text || '').trim(),
      text: String(o.text || '').trim(),
      status: String(o.status || '').trim(),
      date_day: String(o.date_day || '').trim(),
      date_month: String(o.date_month || '').trim(),
      image: String(o.image || '').trim(),
      body: String(o.body || '').trim(),
      details: String(o.details || '').trim(),
      cta_label: String(o.cta_label || '').trim(),
      cta_url: String(o.cta_url || '').trim(),
      active: toBool(o.active),
      order: toNum(o.order, 0),
    }))
    .sort((a, b) => a.order - b.order);
}

function shapeTrust(objs) {
  return shapeSimple(objs, ['id', 'bold', 'text', 'active', 'order']);
}

function shapeFormations(objs) {
  return objs
    .filter((o) => String(o.id || '').trim() || String(o.title || '').trim())
    .map((o) => ({
      id: String(o.id || '').trim(),
      tag: String(o.tag || ''),
      title: String(o.title || ''),
      subtitle: String(o.subtitle || ''),
      items: String(o.items || ''),
      cta_label: String(o.cta_label || ''),
      cta_url: String(o.cta_url || ''),
      active: toBool(o.active),
      order: toNum(o.order, 0),
    }))
    .sort((a, b) => a.order - b.order);
}

function shapeFaq(objs) {
  return shapeSimple(objs, ['id', 'question', 'answer', 'active', 'order']);
}

function shapeCases(objs) {
  return shapeSimple(objs, [
    'id', 'tag', 'title', 'description', 'outcome', 'active', 'order',
  ]);
}

function shapeClients(objs) {
  return shapeSimple(objs, ['id', 'label', 'active', 'order']);
}

function shapeBlog(objs) {
  return objs
    .filter(
      (o) =>
        String(o.id || '').trim() ||
        String(o.slug || '').trim() ||
        String(o.title || '').trim()
    )
    .map((o) => {
      const slug = String(o.slug || o.id || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return {
        id: String(o.id || slug).trim(),
        slug,
        title: String(o.title || '').trim(),
        excerpt: String(o.excerpt || '').trim(),
        category: String(o.category || 'concours').trim(),
        body_html: String(o.body_html || '').trim(),
        image: String(o.image || '').trim(),
        date: String(o.date || '').trim(),
        read_min: String(o.read_min || '').trim(),
        featured: toBool(o.featured),
        meta_description: String(o.meta_description || '').trim(),
        active: toBool(o.active),
        order: toNum(o.order, 0),
      };
    })
    .sort((a, b) => a.order - b.order);
}

function shapeNouveau(objs) {
  return objs
    .filter((o) => String(o.id || '').trim() || String(o.title || '').trim())
    .map((o) => ({
      id: String(o.id || '').trim(),
      type: String(o.type || 'master').trim(),
      title: String(o.title || '').trim(),
      summary: String(o.summary || '').trim(),
      status: String(o.status || '').trim(),
      etab: String(o.etab || '').trim(),
      deadline: String(o.deadline || '').trim(),
      ville: String(o.ville || '').trim(),
      facts: String(o.facts || '').trim(),
      body: String(o.body || '').trim(),
      nc_angle: String(o.nc_angle || '').trim(),
      source_label: String(o.source_label || '').trim(),
      source_url: String(o.source_url || '').trim(),
      cta_url: String(o.cta_url || '').trim(),
      active: toBool(o.active),
      order: toNum(o.order, 0),
    }))
    .sort((a, b) => a.order - b.order);
}

function seedRows(tabName) {
  switch (tabName) {
    case TAB_CONTENT:
      return Object.entries(DEFAULTS.content).map(([k, v]) => [k, v]);
    case TAB_ANNOUNCEMENTS:
      return DEFAULTS.announcements.map((a) => [
        a.id,
        a.title || '',
        a.text || '',
        a.status || '',
        a.date_day || '',
        a.date_month || '',
        a.image || '',
        a.body || '',
        a.details || '',
        a.cta_label || '',
        a.cta_url || '',
        a.active ? 'true' : 'false',
        a.order,
      ]);
    case TAB_TRUST:
      return DEFAULTS.trust.map((t) => [
        t.id, t.bold, t.text, t.active ? 'true' : 'false', t.order,
      ]);
    case TAB_FORMATIONS:
      return DEFAULTS.formations.map((f) => [
        f.id, f.tag, f.title, f.subtitle, f.items, f.cta_url,
        f.active ? 'true' : 'false', f.order, f.cta_label || '',
      ]);
    case TAB_FAQ:
      return DEFAULTS.faq.map((q) => [
        q.id, q.question, q.answer, q.active ? 'true' : 'false', q.order,
      ]);
    case TAB_CASES:
      return DEFAULTS.cases.map((c) => [
        c.id, c.tag, c.title, c.description, c.outcome,
        c.active ? 'true' : 'false', c.order,
      ]);
    case TAB_CLIENTS:
      return DEFAULTS.clients.map((c) => [
        c.id, c.label, c.active ? 'true' : 'false', c.order,
      ]);
    case TAB_BLOG:
      return DEFAULTS.blog.map((b) => [
        b.id,
        b.slug,
        b.title,
        b.excerpt,
        b.category,
        b.body_html,
        b.image,
        b.date,
        b.read_min,
        b.featured ? 'true' : 'false',
        b.meta_description,
        b.active ? 'true' : 'false',
        b.order,
      ]);
    case TAB_NOUVEAU:
      return DEFAULTS.nouveau.map((n) => [
        n.id,
        n.type,
        n.title,
        n.summary,
        n.status,
        n.etab,
        n.deadline,
        n.ville,
        n.facts,
        n.body,
        n.nc_angle,
        n.source_label,
        n.source_url,
        n.active ? 'true' : 'false',
        n.order,
        n.cta_url || '',
      ]);
    default:
      return [];
  }
}

function shapeTab(tabName, rows) {
  const objs = rowsToObjects(rows, HEADERS[tabName]);
  switch (tabName) {
    case TAB_CONTENT:
      return mergeContent(contentObjsToMap(objs));
    case TAB_ANNOUNCEMENTS:
      return shapeAnnouncements(objs);
    case TAB_TRUST:
      return shapeTrust(objs);
    case TAB_FORMATIONS:
      return shapeFormations(objs);
    case TAB_FAQ:
      return shapeFaq(objs);
    case TAB_CASES:
      return shapeCases(objs);
    case TAB_CLIENTS:
      return shapeClients(objs);
    case TAB_BLOG:
      return shapeBlog(objs);
    case TAB_NOUVEAU:
      return shapeNouveau(objs);
    default:
      return null;
  }
}

async function readCms() {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSheetsId();

  await Promise.all(
    ALL_TABS.map((t) => ensureCmsTab(sheets, spreadsheetId, t))
  );

  const rowSets = await Promise.all(
    ALL_TABS.map((t) => readRows(sheets, spreadsheetId, t))
  );

  for (let i = 0; i < ALL_TABS.length; i++) {
    if (!rowSets[i].length) {
      const rows = seedRows(ALL_TABS[i]);
      await writeTab(sheets, spreadsheetId, ALL_TABS[i], rows);
      rowSets[i] = rows;
    }
  }

  return {
    content: shapeTab(TAB_CONTENT, rowSets[0]),
    announcements: shapeTab(TAB_ANNOUNCEMENTS, rowSets[1]),
    trust: shapeTab(TAB_TRUST, rowSets[2]),
    formations: shapeTab(TAB_FORMATIONS, rowSets[3]),
    faq: shapeTab(TAB_FAQ, rowSets[4]),
    cases: shapeTab(TAB_CASES, rowSets[5]),
    clients: shapeTab(TAB_CLIENTS, rowSets[6]),
    blog: shapeTab(TAB_BLOG, rowSets[7]),
    nouveau: shapeTab(TAB_NOUVEAU, rowSets[8]),
  };
}

async function readCmsPublic() {
  const data = await readCms();
  const active = (list) => list.filter((x) => x.active);
  return {
    content: data.content,
    announcements: active(data.announcements),
    trust: active(data.trust),
    formations: active(data.formations),
    faq: active(data.faq),
    cases: active(data.cases),
    clients: active(data.clients),
    blog: active(data.blog),
    nouveau: active(data.nouveau),
  };
}

/** Force-write every CMS tab from built-in defaults (mirrors the live site HTML). */
async function seedFromDefaults() {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSheetsId();
  await Promise.all(
    ALL_TABS.map((t) => ensureCmsTab(sheets, spreadsheetId, t))
  );
  for (const tab of ALL_TABS) {
    await writeTab(sheets, spreadsheetId, tab, seedRows(tab));
  }
  return readCms();
}

async function writeCms(payload) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSheetsId();

  await Promise.all(
    ALL_TABS.map((t) => ensureCmsTab(sheets, spreadsheetId, t))
  );

  if (payload && payload.content && typeof payload.content === 'object') {
    const existing = await readCms();
    const merged = { ...existing.content, ...payload.content };
    const rows = Object.entries(merged)
      .filter(([k]) => String(k || '').trim())
      .map(([k, v]) => [String(k).trim(), String(v == null ? '' : v)]);
    await writeTab(sheets, spreadsheetId, TAB_CONTENT, rows);
  }

  if (Array.isArray(payload.announcements)) {
    const rows = payload.announcements
      .filter(
        (a) =>
          a &&
          (String(a.title || '').trim() ||
            String(a.text || '').trim() ||
            String(a.id || '').trim())
      )
      .map((a, i) => [
        String(a.id || `a${i + 1}`).trim(),
        String(a.title || a.text || ''),
        String(a.text || ''),
        String(a.status || ''),
        String(a.date_day || ''),
        String(a.date_month || ''),
        String(a.image || ''),
        String(a.body || ''),
        String(a.details || ''),
        String(a.cta_label || ''),
        String(a.cta_url || ''),
        a.active ? 'true' : 'false',
        toNum(a.order, i + 1),
      ]);
    await writeTab(sheets, spreadsheetId, TAB_ANNOUNCEMENTS, rows);
  }

  if (Array.isArray(payload.trust)) {
    const rows = payload.trust
      .filter((t) => t && (String(t.bold || '').trim() || String(t.text || '').trim()))
      .map((t, i) => [
        String(t.id || `t${i + 1}`).trim(),
        String(t.bold || ''),
        String(t.text || ''),
        t.active ? 'true' : 'false',
        toNum(t.order, i + 1),
      ]);
    await writeTab(sheets, spreadsheetId, TAB_TRUST, rows);
  }

  if (Array.isArray(payload.formations)) {
    const rows = payload.formations
      .filter((f) => f && (String(f.title || '').trim() || String(f.id || '').trim()))
      .map((f, i) => [
        String(f.id || `f${i + 1}`).trim(),
        String(f.tag || ''),
        String(f.title || ''),
        String(f.subtitle || ''),
        String(f.items || ''),
        String(f.cta_url || ''),
        f.active ? 'true' : 'false',
        toNum(f.order, i + 1),
        String(f.cta_label || ''),
      ]);
    await writeTab(sheets, spreadsheetId, TAB_FORMATIONS, rows);
  }

  if (Array.isArray(payload.faq)) {
    const rows = payload.faq
      .filter((q) => q && (String(q.question || '').trim() || String(q.id || '').trim()))
      .map((q, i) => [
        String(q.id || `q${i + 1}`).trim(),
        String(q.question || ''),
        String(q.answer || ''),
        q.active ? 'true' : 'false',
        toNum(q.order, i + 1),
      ]);
    await writeTab(sheets, spreadsheetId, TAB_FAQ, rows);
  }

  if (Array.isArray(payload.cases)) {
    const rows = payload.cases
      .filter((c) => c && (String(c.title || '').trim() || String(c.id || '').trim()))
      .map((c, i) => [
        String(c.id || `c${i + 1}`).trim(),
        String(c.tag || ''),
        String(c.title || ''),
        String(c.description || ''),
        String(c.outcome || ''),
        c.active ? 'true' : 'false',
        toNum(c.order, i + 1),
      ]);
    await writeTab(sheets, spreadsheetId, TAB_CASES, rows);
  }

  if (Array.isArray(payload.clients)) {
    const rows = payload.clients
      .filter((c) => c && (String(c.label || '').trim() || String(c.id || '').trim()))
      .map((c, i) => [
        String(c.id || `cl${i + 1}`).trim(),
        String(c.label || ''),
        c.active ? 'true' : 'false',
        toNum(c.order, i + 1),
      ]);
    await writeTab(sheets, spreadsheetId, TAB_CLIENTS, rows);
  }

  if (Array.isArray(payload.blog)) {
    const rows = payload.blog
      .filter(
        (b) =>
          b &&
          (String(b.title || '').trim() ||
            String(b.slug || '').trim() ||
            String(b.id || '').trim())
      )
      .map((b, i) => {
        const slug = String(b.slug || b.id || `post-${i + 1}`)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        return [
          String(b.id || slug).trim(),
          slug,
          String(b.title || ''),
          String(b.excerpt || ''),
          String(b.category || 'concours'),
          String(b.body_html || ''),
          String(b.image || ''),
          String(b.date || ''),
          String(b.read_min || ''),
          b.featured ? 'true' : 'false',
          String(b.meta_description || ''),
          b.active ? 'true' : 'false',
          toNum(b.order, i + 1),
        ];
      });
    await writeTab(sheets, spreadsheetId, TAB_BLOG, rows);
  }

  if (Array.isArray(payload.nouveau)) {
    const rows = payload.nouveau
      .filter(
        (n) =>
          n &&
          (String(n.title || '').trim() || String(n.id || '').trim())
      )
      .map((n, i) => [
        String(n.id || `nv${i + 1}`).trim(),
        String(n.type || 'master'),
        String(n.title || ''),
        String(n.summary || ''),
        String(n.status || ''),
        String(n.etab || ''),
        String(n.deadline || ''),
        String(n.ville || ''),
        String(n.facts || ''),
        String(n.body || ''),
        String(n.nc_angle || ''),
        String(n.source_label || ''),
        String(n.source_url || ''),
        n.active ? 'true' : 'false',
        toNum(n.order, i + 1),
        String(n.cta_url || ''),
      ]);
    await writeTab(sheets, spreadsheetId, TAB_NOUVEAU, rows);
  }

  return readCms();
}

module.exports = {
  readCms,
  readCmsPublic,
  writeCms,
  seedFromDefaults,
  DEFAULTS,
};
