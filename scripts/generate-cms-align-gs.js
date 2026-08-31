'use strict';

/**
 * Generates CMS align data for Google Apps Script.
 * Run: node scripts/generate-cms-align-gs.js
 *
 * Updates:
 * - scripts/google-sheet-cms-align-2026.gs (standalone, optional)
 * - scripts/google-sheet-ncconsulting-leads-setup.gs (injects row arrays)
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

function escGs(str) {
  return String(str == null ? '' : str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n/g, '\\n');
}

function rowFormation(f) {
  return (
    "['" +
    [
      f.id,
      f.tag,
      f.title,
      f.subtitle,
      f.items,
      f.cta_url,
      f.active ? 'true' : 'false',
      String(f.order),
      f.cta_label || '',
    ]
      .map(escGs)
      .join("','") +
    "']"
  );
}

function rowNouveau(n) {
  return (
    "['" +
    [
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
    ]
      .map(escGs)
      .join("','") +
    "']"
  );
}

function rowAnnouncement(a) {
  return (
    "['" +
    [
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
    ]
      .map(escGs)
      .join("','") +
    "']"
  );
}

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

const cmsFormationsBlock =
  'var CMS_FORMATIONS_ROWS = [\n' +
  defaults.formations.map(rowFormation).join(',\n') +
  '\n];';

const cmsNouveauBlock =
  'var CMS_NOUVEAU_ROWS = [\n' +
  defaults.nouveau.map(rowNouveau).join(',\n') +
  '\n];';

const cmsAnnounceBlock =
  'var CMS_ANNOUNCEMENT_ROWS = [\n' +
  defaults.announcements.map(rowAnnouncement).join(',\n') +
  '\n];';

const contentPatch = CONTENT_PATCH_KEYS.map(function (k) {
  return "  '" + escGs(k) + "': '" + escGs(defaults.content[k] || '') + "'";
}).join(',\n');

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
const cmsRowsBlock =
  cmsFormationsBlock + '\n\n' + cmsNouveauBlock + '\n\n' + cmsAnnounceBlock;
const placeholderRe =
  /var CMS_FORMATIONS_ROWS = PLACEHOLDER_CMS_FORMATIONS_ROWS;\r?\nvar CMS_NOUVEAU_ROWS = PLACEHOLDER_CMS_NOUVEAU_ROWS;\r?\nvar CMS_ANNOUNCEMENT_ROWS = PLACEHOLDER_CMS_ANNOUNCEMENT_ROWS;/;
const existingRe =
  /var CMS_FORMATIONS_ROWS = \[[\s\S]*?\];\r?\n\r?\nvar CMS_NOUVEAU_ROWS = \[[\s\S]*?\];\r?\n\r?\nvar CMS_ANNOUNCEMENT_ROWS = \[[\s\S]*?\];/;

const before = leads;
if (placeholderRe.test(leads)) {
  leads = leads.replace(placeholderRe, cmsRowsBlock);
} else if (existingRe.test(leads)) {
  leads = leads.replace(existingRe, cmsRowsBlock);
} else {
  console.warn('Leads setup: CMS row blocks not found — skip inject');
}
if (leads !== before) {
  fs.writeFileSync(LEADS, leads, 'utf8');
  console.log('Updated', LEADS);
}
