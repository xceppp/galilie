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
  'concours.label': 'Préparation Bac',
  'concours.title_html': 'Préparation à l’<em>examen national</em>',
  'concours.subtitle_html': 'Cours de soutien · Méthode · Exercices · Examens nationaux — présentiel à Meknès ou à distance (tout le Maroc).',
  'promo.badge': 'Confiance, Méthode, Résultat',
  'promo.urgency': 'Groupes réduits',
  'promo.title': 'Plus qu’un soutien, un vrai accompagnement',
  'promo.title_highlight': 'accompagnement',
  'promo.places_reserved': '7',
  'promo.places_total': '10',
  'promo.updated_label': 'Encadrement par professeur agrégé & docteur · Préparation ciblée Bac marocain',
  'promo.cta_label': 'S’inscrire via le formulaire →',
  'promo.cta_url': '/form.html?intent=concours',
  'proof.1_value': 'Meknès',
  'proof.1_label': 'présentiel',
  'proof.2_value': 'Distance',
  'proof.2_label': 'tout le Maroc',
  'proof.3_value': 'Groupes',
  'proof.3_label': 'réduits',
  'proof.4_value': 'Suivi',
  'proof.4_label': 'personnalisé'
};

var FORMATIONS_ROWS = [
['f1','2è BAC SEG','Sciences Économiques & Gestion','Préparation à l’examen national — Pack National ou À la carte.','Économie générale & Statistique\nComptabilité & Mathématiques financières\nÉconomie & Organisation Administrative des Entreprises (EOAE)\nMathématiques\nPrésentiel Meknès · À distance — tout le Maroc','/form.html?intent=concours&programme=seg','true','1','S’inscrire — 2è BAC SEG →'],
['f2','Mathématiques A & B','Sciences Mathématiques A & B','Deux parcours, un même objectif : votre réussite !','Mathématiques · Physique et Chimie\nSVT (parcours A) ou Sciences de l’Ingénieur (parcours B)\nAnglais · Philosophie\nSujets des années précédentes corrigés\nGroupes réduits · Suivi personnalisé','/form.html?intent=concours&programme=sma','true','2','S’inscrire — Mathématiques A & B →'],
['f3','Sciences Expérimentales','Sciences Expérimentales','Un accompagnement complet pour un excellent résultat !','Mathématiques — Consolider les bases et maîtriser les techniques\nPhysique et Chimie — Comprendre, s’entraîner, réussir\nSVT — Des explications claires et des schémas simplifiés\nAnglais — Méthodes, exercices et entraînement\nPhilosophie — Analyser, argumenter, réussir la dissertation','/form.html?intent=concours&programme=exp','true','3','S’inscrire — Sciences Expérimentales →']
];

var NOUVEAU_ROWS = [
['nv-bac-seg','seg','Sciences Économiques & Gestion','Pack National ou À la carte — Économie, Comptabilité, EOAE, Mathématiques.','Places ouvertes','NC Consulting','Sur rendez-vous','Meknès & à distance','Filière :: 2è BAC SEG\nOptions :: Pack National | À la carte\nLieu :: Meknès ou à distance\nMotto :: Confiance, Méthode, Résultat','Préparation à l’examen national — Cours de soutien · Méthode · Exercices · Examens nationaux. Pour les deux options du Bac : Sciences Économiques | Sciences de Gestion Comptable.','Encadrement par professeur agrégé & docteur · Préparation ciblée Bac marocain · Exercices & examens nationaux corrigés.','','','true','1','/form.html?intent=concours&programme=seg'],
['nv-bac-sma','sma','Sciences Mathématiques A & B','Deux parcours, un même objectif : votre réussite ! Maths, Physique-Chimie, SVT ou SI, Anglais, Philosophie.','Places ouvertes','NC Consulting','Sur rendez-vous','Meknès & à distance','Parcours :: Sciences Mathématiques A & B\nOffre :: Cours, fiches, sujets corrigés\nLieu :: Meknès ou à distance\nFormat :: Groupes réduits','Programme de l’examen national — Sciences Mathématiques A (SVT) et B (Sciences de l’Ingénieur). Plus qu’un soutien, un vrai accompagnement !','Cours clairs et structurés · Fiches de cours et résumés · Sujets des années précédentes corrigés · Conseils d’orientation.','','','true','2','/form.html?intent=concours&programme=sma'],
['nv-bac-exp','exp','Sciences Expérimentales','Mathématiques, Physique et Chimie, SVT, Anglais, Philosophie — petits groupes, suivi personnalisé.','Places ouvertes','NC Consulting','Sur rendez-vous','Meknès & à distance','Au programme :: 5 matières\nOffre :: Cours, fiches, examens corrigés\nLieu :: Meknès ou à distance\nMotto :: Confiance Méthode Résultats','Un accompagnement complet pour un excellent résultat ! Mathématiques, Physique et Chimie, Sciences de la Vie et de la Terre, Anglais, Philosophie.','Cours clairs et structurés · Fiches de cours et résumés · Exercices et sujets d’examens corrigés · Petits groupes pour un meilleur encadrement.','','','true','3','/form.html?intent=concours&programme=exp']
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
