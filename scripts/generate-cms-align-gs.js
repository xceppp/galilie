'use strict';

/**
 * Generates scripts/google-sheet-cms-align-2026.gs from lib/cmsDefaults.js
 * Run: node scripts/generate-cms-align-gs.js
 */

const fs = require('fs');
const path = require('path');
const defaults = require('../lib/cmsDefaults');

const OUT = path.join(__dirname, 'google-sheet-cms-align-2026.gs');

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
    .replace(/\r/g, '\n');
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

const contentPatch = CONTENT_PATCH_KEYS.map(function (k) {
  return "  '" + escGs(k) + "': '" + escGs(defaults.content[k] || '') + "'";
}).join(',\n');

const gs = `/**
 * NC Consulting — Aligner le CMS Google Sheet (form.html + heures extra)
 * ========================================================================
 * Généré par: node scripts/generate-cms-align-gs.js
 * Ne pas éditer à la main — regénérer depuis lib/cmsDefaults.js si besoin.
 *
 * INSTALLATION
 * 1) Ouvrez le Google Sheet NC Consulting (GOOGLE_SHEETS_ID sur Vercel).
 * 2) Extensions → Apps Script.
 * 3) Fichier → + → Script → collez CE fichier (ou fusionnez le menu onOpen).
 * 4) Enregistrez → Actualisez le Sheet → menu « NC Consulting ».
 * 5) Exécutez: alignNcConsultingCmsWithSite2026
 *
 * CE QUE ÇA FAIT
 * - Met à jour cms_content (concours, promo, proof → heures extra + form.html)
 * - Remplace cms_formations (3 cartes Licence / Master / temps aménagé)
 * - Remplace cms_nouveau (heures extra, sans Almaster)
 * - Met à jour cms_announcements (CTA → /form.html)
 * - Remplace /#formulaire et #formulaire par /form.html dans tout le classeur
 * - Crée les onglets cms_* manquants (headers alignés lib/cmsStore.js)
 *
 * NE MODIFIE PAS: cms_blog, cms_faq, cms_cases, cms_clients, cms_trust, onglets leads.
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

var FORMATIONS_ROWS = [
${defaults.formations.map(rowFormation).join(',\n')}
];

var NOUVEAU_ROWS = [
${defaults.nouveau.map(rowNouveau).join(',\n')}
];

var ANNOUNCEMENT_ROWS = [
${defaults.announcements.map(rowAnnouncement).join(',\n')}
];

function onOpenCmsAlignMenu_() {
  SpreadsheetApp.getUi()
    .createMenu('NC Consulting')
    .addItem('Aligner CMS (form + heures extra)', 'alignNcConsultingCmsWithSite2026')
    .addToUi();
}

/**
 * Point d'entrée — demande confirmation puis aligne le CMS.
 */
function alignNcConsultingCmsWithSite2026() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    'Aligner le CMS NC Consulting',
    'Version: ' + CMS_ALIGN_VERSION + '\\n\\n' +
      'Cette action va:\\n' +
      '• Mettre à jour concours / promo / proof dans cms_content\\n' +
      '• Remplacer cms_formations et cms_nouveau\\n' +
      '• Mettre à jour cms_announcements (CTA form.html)\\n' +
      '• Remplacer /#formulaire → /form.html partout\\n\\n' +
      'cms_blog et les onglets leads ne sont PAS écrasés.\\n\\nContinuer ?',
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

  ui.alert(
    'CMS aligné',
    report.join('\\n\\n') + '\\n\\nRechargez ncconsulting.ma (Ctrl+F5) pour voir les changements.',
    ui.ButtonSet.OK
  );
}

function patchCmsContent_(ss) {
  var sh = ensureSheetWithHeaders_(ss, 'cms_content', ['key', 'value']);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) {
    writeTable_(sh, ['key', 'value'], objectToRows_(CONTENT_PATCH));
    return 'cms_content: créé avec ' + Object.keys(CONTENT_PATCH).length + ' clés.';
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
      updated++;
    } else {
      var newRow = sh.getLastRow() + 1;
      sh.getRange(newRow, 1, 1, 2).setValues([[key, val]]);
      keyCol[key] = newRow;
      updated++;
    }
  }
  return 'cms_content: ' + updated + ' clé(s) concours/promo/proof mises à jour.';
}

function writeFormationsTab_(ss) {
  var sh = ensureSheetWithHeaders_(ss, 'cms_formations', FORMATIONS_HEADERS);
  writeTable_(sh, FORMATIONS_HEADERS, FORMATIONS_ROWS);
  return 'cms_formations: ' + FORMATIONS_ROWS.length + ' cartes heures extra écrites.';
}

function writeNouveauTab_(ss) {
  var sh = ensureSheetWithHeaders_(ss, 'cms_nouveau', NOUVEAU_HEADERS);
  writeTable_(sh, NOUVEAU_HEADERS, NOUVEAU_ROWS);
  return 'cms_nouveau: ' + NOUVEAU_ROWS.length + ' entrées heures extra (sans sources externes).';
}

function writeAnnouncementsTab_(ss) {
  var sh = ensureSheetWithHeaders_(ss, 'cms_announcements', ANNOUNCE_HEADERS);
  writeTable_(sh, ANNOUNCE_HEADERS, ANNOUNCEMENT_ROWS);
  return 'cms_announcements: ' + ANNOUNCEMENT_ROWS.length + ' annonces (CTA form.html).';
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
        var nv = v
          .replace(/\\/#formulaire/g, '/form.html')
          .replace(/#formulaire/g, '/form.html');
        if (nv !== v) {
          values[r][c] = nv;
          cells++;
          changed = true;
        }
      }
    }
    if (changed) range.setValues(values);
  }
  return 'URLs: ' + cells + ' cellule(s) corrigées (#formulaire → form.html).';
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
  if (!rows.length) return;
  sh.getRange(2, 1, rows.length, headers.length).setValues(rows);
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
