/**
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
  'concours.label': 'Rejoignez-nous — Heures extra',
  'concours.title_html': 'Préparez votre <em>Licence</em> ou votre <em>Master</em>.',
  'concours.subtitle_html': 'Vous visez une <strong>Licence d\'Excellence, Licence Pro ou Master</strong> ? Rejoignez NC Consulting pour des <strong>heures extra</strong> de coaching 1-à-1 — oral, bases et méthode — à Meknès ou à distance. Ensuite, inscrivez-vous via le formulaire.',
  'promo.badge': 'Places limitées',
  'promo.urgency': 'Coaching 1-à-1',
  'promo.title': 'Rejoignez les prochains créneaux d\'heures extra',
  'promo.title_highlight': 'prochains créneaux',
  'promo.places_reserved': '7',
  'promo.places_total': '10',
  'promo.updated_label': 'Créneaux mis à jour régulièrement',
  'promo.cta_label': 'Rejoindre la préparation →',
  'promo.cta_url': '/form.html?intent=concours',
  'proof.1_value': '1-à-1',
  'proof.1_label': 'heures dédiées',
  'proof.2_value': 'Suivi',
  'proof.2_label': 'jusqu\'aux résultats',
  'proof.3_value': 'Oral',
  'proof.3_label': '& bases renforcées',
  'proof.4_value': '0 DH',
  'proof.4_label': 'premier échange'
};

var FORMATIONS_ROWS = [
['f1','Licence','Heures extra — Licence','Renforcez votre préparation avant le concours Licence d\'Excellence ou Licence Pro.','Oral & posture sous pression\nCompta · économie · management\nAnglais concours\nPlan de révision réaliste\nSuivi jusqu\'aux résultats','/form.html?intent=concours&programme=licence','true','1','Rejoindre — Licence →'],
['f2','Master','Heures extra — Master','Ajoutez des heures ciblées pour réussir l\'accès Master (dossier, oral, projet pro).','Projet professionnel & oral\nFinance · audit · management\nAnglais & argumentaire\nMéthode dossier / entretien\nSuivi jusqu\'à l\'admission','/form.html?intent=concours&programme=master','true','2','Rejoindre — Master →'],
['f3','Temps aménagé','Heures extra — en travaillant','Vous reprisez Licence / Master en parallèle du boulot ? On calibre des heures compatibles.','Planning compatible emploi\nSessions courtes & régulières\nLicence ou Master aménagé\nMeknès ou visio\nPremier échange 20 min','/form.html?intent=concours','true','3','Rejoindre — Formulaire →']
];

var NOUVEAU_ROWS = [
['nv-heures-master','master','Heures extra — Master','Ajoutez des heures 1-à-1 pour préparer votre accès Master : oral, projet pro, finance / management.','Places ouvertes','NC Consulting','Sur rendez-vous','Meknès & visio','Format :: Coaching 1-à-1\nObjectif :: Accès Master\nLieu :: Meknès ou à distance\nEntrée :: Formulaire NC','Vous visez un Master ? Rejoignez NC Consulting pour des heures extra ciblées — dossier, oral et argumentaire — puis inscrivez-vous via le formulaire.','On calibre le volume d’heures selon votre calendrier et votre filière, puis on enchaîne sur un plan concret jusqu’à l’admission.','','','true','1','/form.html?intent=concours&programme=master'],
['nv-heures-licence','lex','Heures extra — Licence d’Excellence','Renforcez oral, bases et méthode avant le concours Licence — sessions dédiées avec NC Consulting.','Places ouvertes','NC Consulting','Sur rendez-vous','Meknès & visio','Format :: Coaching 1-à-1\nObjectif :: Concours Licence\nLieu :: Meknès ou à distance\nEntrée :: Formulaire NC','Vous préparez une Licence d’Excellence ou Licence Pro ? Rejoignez les heures extra NC : oral, compta, éco, management, anglais — puis le formulaire pour réserver votre créneau.','Même exigence qu’à l’oral du concours : clarté, bases solides, tenue sous pression — avec un suivi jusqu’aux résultats.','','','true','2','/form.html?intent=concours&programme=licence'],
['nv-heures-amenage','lpro','Heures extra — temps aménagé','Vous travaillez et visez Licence / Master aménagé ? On calibre des heures compatibles avec votre emploi.','Sur rendez-vous','NC Consulting','Flexible','Meknès & visio','Format :: Sessions courtes\nPublic :: Salariés / reprise\nLieu :: Meknès ou à distance\nEntrée :: Formulaire NC','Planning réaliste, sessions courtes et régulières, suivi jusqu’au concours — sans quitter votre activité.','Un premier échange de 20 min suffit pour voir si le volume d’heures est tenable avec votre emploi du temps.','','','true','3','/form.html?intent=concours']
];

var ANNOUNCEMENT_ROWS = [
['semaine-gratuite','Semaine gratuite — Licences d\'Excellence','Cette session (juillet 2026) est terminée. Réservez un premier échange pour un accompagnement personnalisé.','Terminée','23','Juil','assets/annonce-semaine-gratuite.png','La semaine gratuite de préparation (début 23 juillet 2026) est terminée. Pour un accompagnement concours, coaching ou conseil, réservez un premier échange de 20 minutes — Meknès ou à distance, sans engagement.','Statut :: Session terminée\nAlternative :: Premier échange 20 min\nLieu :: Meknès ou à distance\nEngagement :: Aucun','Réserver un échange →','/form.html','false','99'],
['nouveaux-creneaux','Premier échange de 20 min — Meknès ou à distance','Confidentiel, sans engagement. On clarifie votre besoin et la meilleure façon d\'avancer.','Sur rendez-vous','—','Échange','','Réservez un premier échange confidentiel avec NC Consulting. On clarifie votre besoin (coaching, conseil ou préparation concours) et on définit la meilleure façon d\'avancer — sans engagement.','Durée :: 20 minutes\nLieu :: Meknès ou à distance\nEngagement :: Aucun\nRéponse :: Sous 24h','Demander un échange →','/form.html','true','1']
];

function alignNcConsultingCmsWithSite2026() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    'Aligner le CMS NC Consulting',
    'Version: ' + CMS_ALIGN_VERSION + '\n\nContinuer ?',
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
  ui.alert('CMS aligné', report.join('\n\n'), ui.ButtonSet.OK);
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
        var nv = v.replace(/\/#formulaire/g, '/form.html').replace(/#formulaire/g, '/form.html');
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
