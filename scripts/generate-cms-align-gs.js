'use strict';

/**
 * Generates CMS seed data for Google Apps Script.
 * Run: node scripts/generate-cms-align-gs.js
 *
 * Updates:
 * - scripts/google-sheet-cms-align-2026.gs (standalone align, optional)
 * - scripts/google-sheet-ncconsulting-leads-setup.gs (@generated-cms-seeds block)
 */

const fs = require('fs');
const path = require('path');
const defaults = require('../lib/cmsDefaults');

const OUT = path.join(__dirname, 'google-sheet-cms-align-2026.gs');
const LEADS = path.join(__dirname, 'google-sheet-ncconsulting-leads-setup.gs');

const CONTENT_PATCH_KEYS = [
  'concours.label',
  'concours.title_html',
  'concours.subtitle_html',
  'promo.badge',
  'promo.urgency',
  'promo.title',
  'promo.title_highlight',
  'promo.places_reserved',
  'promo.places_total',
  'promo.updated_label',
  'promo.cta_label',
  'promo.cta_url',
  'proof.1_value',
  'proof.1_label',
  'proof.2_value',
  'proof.2_label',
  'proof.3_value',
  'proof.3_label',
  'proof.4_value',
  'proof.4_label',
];

const SEEDS_START = '// @generated-cms-seeds-start';
const SEEDS_END = '// @generated-cms-seeds-end';

function escGs(str) {
  return String(str == null ? '' : str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '\\n');
}

function rowFromFields(fields) {
  return "['" + fields.map(escGs).join("','") + "']";
}

function rowFormation(f) {
  return rowFromFields([
    f.id,
    f.tag,
    f.title,
    f.subtitle,
    f.items,
    f.cta_url,
    f.active ? 'true' : 'false',
    String(f.order),
    f.cta_label || '',
  ]);
}

function rowNouveau(n) {
  return rowFromFields([
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
    n.source_label || '',
    n.source_url || '',
    n.active ? 'true' : 'false',
    String(n.order),
    n.cta_url || '',
  ]);
}

function rowAnnouncement(a) {
  return rowFromFields([
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
    String(a.order),
  ]);
}

function rowTrust(t) {
  return rowFromFields([t.id, t.bold, t.text, t.active ? 'true' : 'false', String(t.order)]);
}

function rowFaq(q) {
  return rowFromFields([
    q.id,
    q.question,
    q.answer,
    q.active ? 'true' : 'false',
    String(q.order),
  ]);
}

function rowCase(c) {
  return rowFromFields([
    c.id,
    c.tag,
    c.title,
    c.description,
    c.outcome,
    c.active ? 'true' : 'false',
    String(c.order),
  ]);
}

function rowClient(c) {
  return rowFromFields([c.id, c.label, c.active ? 'true' : 'false', String(c.order)]);
}

function rowBlog(b) {
  return rowFromFields([
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
    String(b.order),
  ]);
}

function rowsBlock(varName, rows) {
  return 'var ' + varName + ' = [\n' + rows.join(',\n') + '\n];';
}

const contentPatch = CONTENT_PATCH_KEYS.map(function (k) {
  return "  '" + escGs(k) + "': '" + escGs(defaults.content[k] || '') + "'";
}).join(',\n');

const cmsSeedsBlock = [
  SEEDS_START,
  "/** Généré par node scripts/generate-cms-align-gs.js — ne pas éditer à la main */",
  "var CMS_SETUP_VERSION = '2026-08-31-full';",
  "var CMS_ALIGN_VERSION = '2026-08-31-form-heures-extra';",
  '',
  'var CMS_CONTENT_PATCH = {',
  contentPatch,
  '};',
  '',
  rowsBlock(
    'CMS_CONTENT_ROWS',
    Object.entries(defaults.content).map(function (entry) {
      return rowFromFields([entry[0], entry[1]]);
    })
  ),
  '',
  rowsBlock('CMS_TRUST_ROWS', defaults.trust.map(rowTrust)),
  '',
  rowsBlock('CMS_FAQ_ROWS', defaults.faq.map(rowFaq)),
  '',
  rowsBlock('CMS_CASES_ROWS', defaults.cases.map(rowCase)),
  '',
  rowsBlock('CMS_CLIENTS_ROWS', defaults.clients.map(rowClient)),
  '',
  rowsBlock('CMS_BLOG_ROWS', defaults.blog.map(rowBlog)),
  '',
  rowsBlock('CMS_FORMATIONS_ROWS', defaults.formations.map(rowFormation)),
  '',
  rowsBlock('CMS_NOUVEAU_ROWS', defaults.nouveau.map(rowNouveau)),
  '',
  rowsBlock('CMS_ANNOUNCEMENT_ROWS', defaults.announcements.map(rowAnnouncement)),
  SEEDS_END,
].join('\n');

const formationsBlock =
  'var FORMATIONS_ROWS = [\n' +
  defaults.formations.map(rowFormation).join(',\n') +
  '\n];';

const nouveauBlock =
  'var NOUVEAU_ROWS = [\n' +
  defaults.nouveau.map(rowNouveau).join(',\n') +
  '\n];';

const announceBlock =
  'var ANNOUNCEMENT_ROWS = [\n' +
  defaults.announcements.map(rowAnnouncement).join(',\n') +
  '\n];';

const gs = `/**
 * NC Consulting — Aligner le CMS (standalone — optionnel)
 * Utilisez plutôt scripts/google-sheet-ncconsulting-leads-setup.gs (tout-en-un).
 * Généré par: node scripts/generate-cms-align-gs.js
 */

var CMS_ALIGN_VERSION = '2026-08-31-form-heures-extra';

var FORMATIONS_HEADERS = [
  'id', 'tag', 'title', 'subtitle', 'items', 'cta_url', 'active', 'order', 'cta_label'
];

var NOUVEAU_HEADERS = [
  'id', 'type', 'title', 'summary', 'status', 'etab', 'deadline', 'ville',
  'facts', 'body', 'nc_angle', 'source_label', 'source_url', 'active', 'order', 'cta_url'
];

var ANNOUNCE_HEADERS = [
  'id', 'title', 'text', 'status', 'date_day', 'date_month', 'image', 'body',
  'details', 'cta_label', 'cta_url', 'active', 'order'
];

var CONTENT_PATCH = {
${contentPatch}
};

${formationsBlock}

${nouveauBlock}

${announceBlock}

function alignNcConsultingCmsWithSite2026() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    'Aligner le CMS NC Consulting',
    'Version: ' + CMS_ALIGN_VERSION + '\\n\\nContinuer ?',
    ui.ButtonSet.OK_CANCEL
  );
  if (confirm !== ui.Button.OK) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var report = [];
  report.push(patchCmsContent_(ss));
  report.push(writeFormationsTab_(ss));
  report.push(writeNouveauTab_(ss));
  report.push(writeAnnouncementsTab_(ss));
  report.push(replaceFormulaireUrlsInWorkbook_(ss));
  ui.alert('CMS aligné', report.join('\\n\\n'), ui.ButtonSet.OK);
}

function patchCmsContent_(ss) {
  var sh = ensureSheetWithHeaders_(ss, 'cms_content', ['key', 'value']);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) {
    writeTable_(sh, ['key', 'value'], objectToRows_(CONTENT_PATCH));
    return 'cms_content: créé.';
  }
  var data = sh.getRange(2, 1, lastRow, 2).getValues();
  var keyCol = {};
  for (var i = 0; i < data.length; i++) {
    keyCol[String(data[i][0] || '').trim()] = i + 2;
  }
  var updated = 0;
  var keys = Object.keys(CONTENT_PATCH);
  for (var k = 0; k < keys.length; k++) {
    var key = keys[k];
    var val = CONTENT_PATCH[key];
    if (keyCol[key]) {
      sh.getRange(keyCol[key], 2).setValue(val);
    } else {
      var newRow = sh.getLastRow() + 1;
      sh.getRange(newRow, 1, newRow, 2).setValues([[key, val]]);
    }
    updated++;
  }
  return 'cms_content: ' + updated + ' clé(s).';
}

function writeFormationsTab_(ss) {
  var sh = ensureSheetWithHeaders_(ss, 'cms_formations', FORMATIONS_HEADERS);
  writeTable_(sh, FORMATIONS_HEADERS, FORMATIONS_ROWS);
  return 'cms_formations: ' + FORMATIONS_ROWS.length + ' cartes.';
}

function writeNouveauTab_(ss) {
  var sh = ensureSheetWithHeaders_(ss, 'cms_nouveau', NOUVEAU_HEADERS);
  writeTable_(sh, NOUVEAU_HEADERS, NOUVEAU_ROWS);
  return 'cms_nouveau: ' + NOUVEAU_ROWS.length + ' entrées.';
}

function writeAnnouncementsTab_(ss) {
  var sh = ensureSheetWithHeaders_(ss, 'cms_announcements', ANNOUNCE_HEADERS);
  writeTable_(sh, ANNOUNCE_HEADERS, ANNOUNCEMENT_ROWS);
  return 'cms_announcements: ' + ANNOUNCEMENT_ROWS.length + ' annonces.';
}

function replaceFormulaireUrlsInWorkbook_(ss) {
  var sheets = ss.getSheets();
  var cells = 0;
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    var range = sh.getDataRange();
    var values = range.getValues();
    var changed = false;
    for (var r = 0; r < values.length; r++) {
      for (var c = 0; c < values[r].length; c++) {
        var v = values[r][c];
        if (typeof v !== 'string') continue;
        var nv = v.replace(/\\/#formulaire/g, '/form.html').replace(/#formulaire/g, '/form.html');
        if (nv !== v) {
          values[r][c] = nv;
          cells++;
          changed = true;
        }
      }
    }
    if (changed) range.setValues(values);
  }
  return 'URLs: ' + cells + ' cellule(s).';
}

function ensureSheetWithHeaders_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  return sh;
}

function writeTable_(sh, headers, rows) {
  var lastRow = sh.getLastRow();
  if (lastRow > 1) {
    sh.getRange(2, 1, lastRow, headers.length).clearContent();
  }
  if (!rows || !rows.length) return;
  sh.getRange(2, 1, rows.length + 1, headers.length).setValues(rows);
}

function objectToRows_(obj) {
  var keys = Object.keys(obj);
  var out = [];
  for (var i = 0; i < keys.length; i++) {
    out.push([keys[i], obj[keys[i]]]);
  }
  return out;
}
`;

fs.writeFileSync(OUT, gs, 'utf8');
console.log('Wrote', OUT);

let leads = fs.readFileSync(LEADS, 'utf8');
const seedsRe = new RegExp(
  SEEDS_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '[\\s\\S]*?' +
    SEEDS_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
);

if (!seedsRe.test(leads)) {
  console.error('Leads setup: @generated-cms-seeds markers not found');
  process.exit(1);
}

leads = leads.replace(seedsRe, cmsSeedsBlock);
fs.writeFileSync(LEADS, leads, 'utf8');
console.log('Updated', LEADS, '(CMS seeds block)');
