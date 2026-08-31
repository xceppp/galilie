/**
 * NC Consulting — Google Sheet LEADS (formulaire site ncconsulting.ma)
 * ===================================================================
 * 1) Ouvrez le Google Sheet lié à GOOGLE_SHEETS_ID sur Vercel.
 * 2) Partagez-le en Éditeur avec l’email du compte de service Google
 *    (GOOGLE_CLIENT_EMAIL dans Vercel).
 * 3) Extensions → Apps Script → collez CE fichier entier.
 * 4) Exécutez une fois : setupNcConsultingFullFromZero  (leads + CMS, conserve les données)
 * 5) (Optionnel) setLeadNotifyEmail  (votre email de notification)
 * 6) (Optionnel) installLeadEmailTrigger
 * 7) Menu NC Consulting → Aligner CMS (form + heures extra) — écrase formations/nouveau
 *
 * Où vont les demandes du formulaire ?
 * ------------------------------------
 * | Profil (formulaire)              | Onglet Sheet |
 * |----------------------------------|--------------|
 * | Dirigeant / Entrepreneur         | Conseil      |
 * | Cadre supérieur / Manager        | Conseil      |
 * | Professionnel                    | Conseil      |
 * | En transition de carrière        | Conseil      |
 * | Montée en compétences (cadres)   | Formation    |
 * | Autre profil                     | General      |
 *
 * Colonnes A→O (alignées sur lib/sheets.js) :
 * Date demande, Reçu le, Prénom, Nom, Téléphone, Email, Profil, Option,
 * Service, Mode, Score anti-spam, Action anti-spam, Statut, Marqueur, Notes
 *
 * Si le formulaire affiche « Demande reçue » mais rien dans le Sheet :
 * - Vercel → Logs → filtrez /api/lead (erreur credentials ou GOOGLE_SHEETS_ID)
 * - Vérifiez que l’ID du classeur = GOOGLE_SHEETS_ID
 * - Vérifiez RECAPTCHA_SECRET_KEY + domaines autorisés reCAPTCHA
 */

var LEAD_TAB_NAMES = ['Conseil', 'Formation', 'General'];

/** Onglets CMS (alignés sur lib/cmsStore.js). */
var CMS_TAB_NAMES = [
  'cms_content',
  'cms_announcements',
  'cms_trust',
  'cms_formations',
  'cms_faq',
  'cms_cases',
  'cms_clients',
  'cms_blog',
  'cms_nouveau'
];

/** Onglets à conserver lors du nettoyage (leads + CMS). */
var REQUIRED_SHEET_NAMES = LEAD_TAB_NAMES.concat(CMS_TAB_NAMES);

var LEAD_HEADERS = [
  'Date demande (ISO)',
  'Reçu le (serveur)',
  'Prénom',
  'Nom',
  'Téléphone',
  'Email',
  'Profil',
  'Option',
  'Service',
  'Mode',
  'Score anti-spam',
  'Action anti-spam',
  'Statut dossier',
  'Marqueur appel',
  'Notes conseiller'
];

var COL_PRENOM = 3;
var COL_NOM = 4;
var COL_EMAIL = 6;
var COL_STATUT = 13;
var COL_MARQUEUR = 14;
var COL_NOTES = 15;
var MAX_ROWS_VALIDATION = 3000;
var TECH_COLUMN_INDEXES_1BASE = [2, 11, 12];
var FILTER_ROW_BUFFER_BELOW_DATA = 12;

var HEADER_BG = '#0E1116';
var HEADER_FG = '#E2C06A';

/** Options formulaire — référence (saisie libre dans colonnes G–J côté API). */
var FORM_PROFILS = [
  'Dirigeant / Entrepreneur',
  'Cadre supérieur / Manager',
  'Professionnel',
  'En transition de carrière',
  'Montée en compétences (cadres)',
  'Autre profil'
];

var FORM_MODES = ['Présentiel (Meknès)', 'À distance', 'Les deux'];

var CMS_HEADER_BG = '#1a2030';
var CMS_HEADER_FG = '#E2C06A';

// --- Menu + setup ---

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('NC Consulting')
    .addItem('Setup complet (conserve les données)', 'setupNcConsultingFullFromZero')
    .addItem('Configurer onglets leads seulement', 'setupNcConsultingLeadSheets')
    .addSeparator()
    .addItem('Définir email notifications', 'setLeadNotifyEmail')
    .addItem('Activer email à chaque nouvelle ligne', 'installLeadEmailTrigger')
    .addSeparator()
    .addItem('Aligner CMS (form + heures extra)', 'alignNcConsultingCmsWithSite2026')
    .addItem('Supprimer les onglets inutiles…', 'removeUnnecessarySheets')
    .addToUi();
}

/**
 * Setup complet depuis zéro : crée tous les onglets leads + CMS, applique en-têtes
 * et validations, remplit uniquement les onglets vides avec les défauts du site.
 * Les leads, blog et toute donnée existante sont conservés.
 */
function setupNcConsultingFullFromZero() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    'Setup complet NC Consulting',
    'Version: ' + CMS_SETUP_VERSION + '\n\n' +
      '• Crée / répare tous les onglets leads + CMS\n' +
      '• En-têtes, filtres, validations leads\n' +
      '• Onglets CMS vides → valeurs par défaut du site\n' +
      '• cms_content → ajoute les clés manquantes seulement\n' +
      '• Données existantes (leads, blog, etc.) → CONSERVÉES\n' +
      '• Corrige /#formulaire → /form.html partout\n\n' +
      'Continuer ?',
    ui.ButtonSet.OK_CANCEL
  );
  if (confirm !== ui.Button.OK) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var report = [];

  for (var i = 0; i < LEAD_TAB_NAMES.length; i++) {
    var leadSh = getOrCreateSheet_(ss, LEAD_TAB_NAMES[i]);
    unhideLeadColumns_(leadSh);
    writeHeadersRow_(leadSh);
    styleHeaderRow_(leadSh);
    freezeAndColumnWidths_(leadSh);
    applyLeadValidations_(leadSh);
    hideTechColumns_(leadSh);
    applyFilterOnLeadTableOnly_(leadSh);
  }
  report.push(
    'Leads (' +
      LEAD_TAB_NAMES.join(', ') +
      '): en-têtes OK — ' +
      cmsCountDataRows_(ss, LEAD_TAB_NAMES) +
      ' ligne(s) conservée(s).'
  );

  report.push(cmsSetupContentTab_(ss));
  report.push(cmsSetupListTab_(ss, 'cms_announcements', CMS_ANNOUNCE_HEADERS, CMS_ANNOUNCEMENT_ROWS));
  report.push(cmsSetupListTab_(ss, 'cms_trust', CMS_TRUST_HEADERS, CMS_TRUST_ROWS));
  report.push(cmsSetupListTab_(ss, 'cms_formations', CMS_FORMATIONS_HEADERS, CMS_FORMATIONS_ROWS));
  report.push(cmsSetupListTab_(ss, 'cms_faq', CMS_FAQ_HEADERS, CMS_FAQ_ROWS));
  report.push(cmsSetupListTab_(ss, 'cms_cases', CMS_CASES_HEADERS, CMS_CASES_ROWS));
  report.push(cmsSetupListTab_(ss, 'cms_clients', CMS_CLIENTS_HEADERS, CMS_CLIENTS_ROWS));
  report.push(cmsSetupListTab_(ss, 'cms_blog', CMS_BLOG_HEADERS, CMS_BLOG_ROWS));
  report.push(cmsSetupListTab_(ss, 'cms_nouveau', CMS_NOUVEAU_HEADERS, CMS_NOUVEAU_ROWS));
  report.push(cmsReplaceFormulaireUrls_(ss));

  var missing = listMissingRequiredSheets_(ss);
  var msg = report.join('\n\n');
  if (missing.length) {
    msg += '\n\nOnglets requis encore absents :\n' + missing.join('\n');
  }
  msg +=
    '\n\nÉtapes suivantes :\n' +
    '1) setLeadNotifyEmail + installLeadEmailTrigger\n' +
    '2) Copiez l’ID du classeur → Vercel GOOGLE_SHEETS_ID\n' +
    '3) Ctrl+F5 sur ncconsulting.ma';

  ui.alert('Setup terminé', msg, ui.ButtonSet.OK);
}

function setupNcConsultingLeadSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  for (var i = 0; i < LEAD_TAB_NAMES.length; i++) {
    var sh = getOrCreateSheet_(ss, LEAD_TAB_NAMES[i]);
    unhideLeadColumns_(sh);
    writeHeadersRow_(sh);
    styleHeaderRow_(sh);
    freezeAndColumnWidths_(sh);
    applyLeadValidations_(sh);
    hideTechColumns_(sh);
    applyFilterOnLeadTableOnly_(sh);
  }
  SpreadsheetApp.getUi().alert(
    'NC Consulting',
    'Onglets prêts : ' + LEAD_TAB_NAMES.join(', ') + '\n\n' +
      'Étapes suivantes :\n' +
      '1) setLeadNotifyEmail\n' +
      '2) installLeadEmailTrigger\n\n' +
      'Copiez l’ID du classeur dans Vercel → GOOGLE_SHEETS_ID',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Supprime tous les onglets sauf ceux requis par le site (leads + CMS).
 * Demande confirmation avant toute suppression.
 */
function removeUnnecessarySheets() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var keepSet = buildRequiredSheetSet_();
  var sheets = ss.getSheets();
  var toDelete = [];

  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    if (!keepSet[name]) {
      toDelete.push(sheets[i]);
    }
  }

  if (toDelete.length === 0) {
    ui.alert(
      'Rien à supprimer',
      'Seuls les onglets nécessaires sont présents :\n\n' +
        REQUIRED_SHEET_NAMES.join('\n'),
      ui.ButtonSet.OK
    );
    return;
  }

  if (sheets.length - toDelete.length < 1) {
    ui.alert(
      'Action annulée',
      'Impossible de supprimer tous les onglets : Google Sheets exige au moins une feuille.',
      ui.ButtonSet.OK
    );
    return;
  }

  var deleteList = [];
  for (var j = 0; j < toDelete.length; j++) {
    deleteList.push('• ' + toDelete[j].getName());
  }

  var confirm = ui.alert(
    'Supprimer ' + toDelete.length + ' onglet(s) ?',
    'Cette action est irréversible.\n\n' +
      'À SUPPRIMER :\n' +
      deleteList.join('\n') +
      '\n\nÀ CONSERVER :\n' +
      REQUIRED_SHEET_NAMES.join('\n'),
    ui.ButtonSet.OK_CANCEL
  );
  if (confirm !== ui.Button.OK) return;

  var removed = [];
  for (var k = toDelete.length - 1; k >= 0; k--) {
    removed.push(toDelete[k].getName());
    ss.deleteSheet(toDelete[k]);
  }

  var missing = listMissingRequiredSheets_(ss);
  var msg =
    removed.length + ' onglet(s) supprimé(s) :\n' + removed.join('\n');
  if (missing.length) {
    msg +=
      '\n\nOnglets requis absents (lancez « Configurer onglets leads » ou le setup CMS) :\n' +
      missing.join('\n');
  }

  ui.alert('Nettoyage terminé', msg, ui.ButtonSet.OK);
}

function buildRequiredSheetSet_() {
  var keepSet = {};
  for (var i = 0; i < REQUIRED_SHEET_NAMES.length; i++) {
    keepSet[REQUIRED_SHEET_NAMES[i]] = true;
  }
  return keepSet;
}

function listMissingRequiredSheets_(ss) {
  var missing = [];
  for (var i = 0; i < REQUIRED_SHEET_NAMES.length; i++) {
    var name = REQUIRED_SHEET_NAMES[i];
    if (!ss.getSheetByName(name)) {
      missing.push('• ' + name);
    }
  }
  return missing;
}

// --- Email quand une ligne est ajoutée (API ou manuel) ---

function setLeadNotifyEmail() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt(
    'Email de notification',
    'Adresse qui recevra un mail à chaque nouveau lead :',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var email = String(resp.getResponseText() || '').trim();
  if (!email || email.indexOf('@') === -1) {
    ui.alert('Email invalide.');
    return;
  }
  PropertiesService.getScriptProperties().setProperty('LEAD_NOTIFY_EMAIL', email);
  ui.alert('Notifications envoyées à : ' + email);
}

function installLeadEmailTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onSpreadsheetChange') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('onSpreadsheetChange')
    .forSpreadsheet(ss)
    .onChange()
    .create();
  SpreadsheetApp.getUi().alert(
    'Déclencheur installé',
    'Un email partira à chaque insertion de ligne (formulaire site ou saisie manuelle).',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function onSpreadsheetChange(e) {
  if (!e) return;
  var type = e.changeType;
  if (type !== 'INSERT_ROW' && type !== 'EDIT' && type !== 'OTHER') return;

  var to = PropertiesService.getScriptProperties().getProperty('LEAD_NOTIFY_EMAIL');
  if (!to) return;

  var ss = e.source || SpreadsheetApp.getActiveSpreadsheet();
  for (var i = 0; i < LEAD_TAB_NAMES.length; i++) {
    maybeNotifyNewRowOnSheet_(ss.getSheetByName(LEAD_TAB_NAMES[i]), to);
  }
}

function maybeNotifyNewRowOnSheet_(sheet, to) {
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var row = sheet.getRange(lastRow, 1, 1, LEAD_HEADERS.length).getValues()[0];
  var prenom = String(row[COL_PRENOM - 1] || '').trim();
  var nom = String(row[COL_NOM - 1] || '').trim();
  if (!prenom && !nom) return;

  var statut = String(row[COL_STATUT - 1] || '').trim();
  if (statut && statut !== 'Nouveau') return;

  var dedupeKey = sheet.getName() + ':' + lastRow + ':' + String(row[0] || '');
  var cache = CacheService.getScriptCache();
  if (cache.get(dedupeKey)) return;
  cache.put(dedupeKey, '1', 300);

  var body = [
    'Nouvelle demande sur ncconsulting.ma',
    '',
    'Onglet : ' + sheet.getName(),
    'Ligne : ' + lastRow,
    '',
    'Prénom : ' + prenom,
    'Nom : ' + nom,
    'Téléphone : ' + row[4],
    'Email : ' + row[5],
    'Profil : ' + row[6],
    'Option : ' + row[7],
    'Service : ' + row[8],
    'Mode : ' + row[9],
    '',
    'Ouvrez le classeur pour traiter le dossier (Statut / Marqueur / Notes).'
  ].join('\n');

  try {
    MailApp.sendEmail(
      to,
      'Nouveau lead NC Consulting — ' + prenom + ' ' + nom,
      body
    );
  } catch (err) {
    console.error('MailApp.sendEmail failed: ' + err);
  }
}

// --- Helpers mise en forme ---

function writeHeadersRow_(sh) {
  sh.getRange(1, 1, 1, LEAD_HEADERS.length).setValues([LEAD_HEADERS]);
}

function styleHeaderRow_(sh) {
  var hdr = sh.getRange(1, 1, 1, LEAD_HEADERS.length);
  hdr
    .setFontWeight('bold')
    .setBackground(HEADER_BG)
    .setFontColor(HEADER_FG)
    .setWrap(true)
    .setVerticalAlignment('middle');
}

function freezeAndColumnWidths_(sh) {
  sh.setFrozenRows(1);
  var widths = [160, 160, 110, 110, 130, 200, 180, 180, 200, 120, 100, 120, 140, 150, 240];
  for (var i = 0; i < widths.length; i++) {
    sh.setColumnWidth(i + 1, widths[i]);
  }
}

function applyLeadValidations_(sh) {
  var lastRow = Math.max(Math.max(sh.getLastRow(), 2), MAX_ROWS_VALIDATION);

  var statuts = ['Nouveau', 'Contacté', 'À rappeler', 'RDV fixé', 'Qualifié', 'Hors cible'];
  var dvStatut = SpreadsheetApp.newDataValidation()
    .requireValueInList(statuts, true)
    .setAllowInvalid(true)
    .build();

  var marqueurs = [
    '',
    '☎ Appel effectué',
    '⊘ Pas de réponse',
    '✓ Message (SMS/WhatsApp)',
    '📧 Mail envoyé'
  ];
  var dvMarqueur = SpreadsheetApp.newDataValidation()
    .requireValueInList(marqueurs, true)
    .setAllowInvalid(true)
    .build();

  sh.getRange(2, COL_STATUT, lastRow, 1).setDataValidation(dvStatut);
  sh.getRange(2, COL_MARQUEUR, lastRow, 1).setDataValidation(dvMarqueur);
  sh.getRange(2, COL_NOTES, lastRow, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  var dvMode = SpreadsheetApp.newDataValidation()
    .requireValueInList(FORM_MODES, true)
    .setAllowInvalid(true)
    .build();
  sh.getRange(2, 10, lastRow, 1).setDataValidation(dvMode);
}

function unhideLeadColumns_(sh) {
  var maxCols = Math.max(LEAD_HEADERS.length, sh.getMaxColumns());
  if (maxCols > 0) sh.showColumns(1, maxCols);
}

function hideTechColumns_(sh) {
  var sorted = TECH_COLUMN_INDEXES_1BASE.slice().sort(function (a, b) {
    return b - a;
  });
  for (var i = 0; i < sorted.length; i++) {
    try {
      sh.hideColumns(sorted[i], 1);
    } catch (e2) {}
  }
}

function applyFilterOnLeadTableOnly_(sh) {
  var existing = sh.getFilter();
  if (existing) existing.remove();
  var lastRow = Math.max(sh.getLastRow(), 1);
  sh
    .getRange(1, 1, lastRow + FILTER_ROW_BUFFER_BELOW_DATA, LEAD_HEADERS.length)
    .createFilter();
}

function getOrCreateSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

// --- CMS (headers + align) — seeds: node scripts/generate-cms-align-gs.js ---

var CMS_CONTENT_HEADERS = ['key', 'value'];

var CMS_TRUST_HEADERS = ['id', 'bold', 'text', 'active', 'order'];

var CMS_FAQ_HEADERS = ['id', 'question', 'answer', 'active', 'order'];

var CMS_CASES_HEADERS = ['id', 'tag', 'title', 'description', 'outcome', 'active', 'order'];

var CMS_CLIENTS_HEADERS = ['id', 'label', 'active', 'order'];

var CMS_BLOG_HEADERS = [
  'id', 'slug', 'title', 'excerpt', 'category', 'body_html', 'image', 'date',
  'read_min', 'featured', 'meta_description', 'active', 'order'
];

var CMS_FORMATIONS_HEADERS = [
  'id', 'tag', 'title', 'subtitle', 'items', 'cta_url', 'active', 'order', 'cta_label'
];

var CMS_NOUVEAU_HEADERS = [
  'id', 'type', 'title', 'summary', 'status', 'etab', 'deadline', 'ville',
  'facts', 'body', 'nc_angle', 'source_label', 'source_url', 'active', 'order', 'cta_url'
];

var CMS_ANNOUNCE_HEADERS = [
  'id', 'title', 'text', 'status', 'date_day', 'date_month', 'image', 'body',
  'details', 'cta_label', 'cta_url', 'active', 'order'
];

// @generated-cms-seeds-start
/** Généré par node scripts/generate-cms-align-gs.js — ne pas éditer à la main */
var CMS_SETUP_VERSION = '2026-08-31-full';
var CMS_ALIGN_VERSION = '2026-08-31-form-heures-extra';

var CMS_CONTENT_PATCH = {
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

var CMS_CONTENT_ROWS = [
['hero.eyebrow','Conseil · Coaching · Meknès & à distance'],
['hero.title_html','Prenez de meilleures décisions — atteignez vos objectifs plus vite.'],
['hero.lead','Conseil franc et coaching sur mesure pour dirigeants, cadres et profils ambitieux — des décisions claires, des résultats mesurables.'],
['hero.cta_primary','Demander un premier échange (20 min) →'],
['hero.cta_secondary','Comment ça marche'],
['hero.assure','Réponse personnalisée · Sans engagement'],
['hero.metric.1_value','1-à-1'],
['hero.metric.1_suffix',''],
['hero.metric.1_label','Accompagnement'],
['hero.metric.2_value','Meknès'],
['hero.metric.2_suffix',''],
['hero.metric.2_label','& à distance'],
['hero.metric.3_value','20'],
['hero.metric.3_suffix',' min'],
['hero.metric.3_label','Premier échange'],
['hero.card.badge','Premier échange'],
['hero.card.title','Parlons de votre objectif'],
['hero.card.sub','20 minutes, confidentiel et sans engagement. On clarifie votre besoin et on définit la meilleure façon d\'avancer.'],
['hero.card.items','Diagnostic clair de votre situation\nRecommandation ciblée, pas générique\nConfidentialité totale'],
['hero.card.cta','Demander un premier échange →'],
['hero.card.rating','Premier échange confidentiel'],
['concours.label','Rejoignez-nous — Heures extra'],
['concours.title_html','Préparez votre <em>Licence</em> ou votre <em>Master</em>.'],
['concours.subtitle_html','Vous visez une <strong>Licence d\'Excellence, Licence Pro ou Master</strong> ? Rejoignez NC Consulting pour des <strong>heures extra</strong> de coaching 1-à-1 — oral, bases et méthode — à Meknès ou à distance. Ensuite, inscrivez-vous via le formulaire.'],
['promo.badge','Places limitées'],
['promo.urgency','Coaching 1-à-1'],
['promo.title','Rejoignez les prochains créneaux d\'heures extra'],
['promo.title_highlight','prochains créneaux'],
['promo.places_reserved','7'],
['promo.places_total','10'],
['promo.updated_label','Créneaux mis à jour régulièrement'],
['promo.cta_label','Rejoindre la préparation →'],
['promo.cta_url','/form.html?intent=concours'],
['proof.1_value','1-à-1'],
['proof.1_label','heures dédiées'],
['proof.2_value','Suivi'],
['proof.2_label','jusqu\'aux résultats'],
['proof.3_value','Oral'],
['proof.3_label','& bases renforcées'],
['proof.4_value','0 DH'],
['proof.4_label','premier échange'],
['poles.label','Nos pôles'],
['poles.title_html','Trois expertises pour <em>professionnels exigeants</em>.'],
['poles.subtitle','Conseil, coaching et montée en compétences — exclusivement pour dirigeants, cadres et entrepreneurs.'],
['poles.formation.tab','Formation'],
['poles.formation.title','Montée en compétences & expertise'],
['poles.formation.desc','Programmes ciblés pour dirigeants, cadres et entrepreneurs — formats courts ou modulaires, objectifs concrets et mise en pratique immédiate. Présentiel à Meknès ou entièrement à distance.'],
['poles.formation.cta','Demander un premier échange →'],
['poles.formation.items','Prise de parole & communication\nNégociation & influence\nTransformation digitale'],
['poles.accompagnement.tab','Accompagnement'],
['poles.accompagnement.title','Coaching exécutif & accompagnement 1-à-1'],
['poles.accompagnement.desc','Programme structuré sur plusieurs semaines pour renforcer leadership, posture et performance — objectifs mesurables, suivi régulier entre les séances et bilans d\'étape. Présentiel à Meknès ou entièrement à distance.'],
['poles.accompagnement.cta','Demander un premier échange →'],
['poles.accompagnement.items','Entrepreneuriat\nRH, management & organisations\nDéveloppement personnel & carrière\nLeadership & prise de décision\nPréparation aux entretiens & oraux'],
['poles.conseil.tab','Conseil'],
['poles.conseil.title','Conseil stratégique & partenariat'],
['poles.conseil.desc','Partenariat stratégique continu pour vos transitions, projets majeurs et décisions structurantes — vision stratégique, aide à la décision et disponibilité privilégiée. Confidentialité absolue sur l\'ensemble de la mission.'],
['poles.conseil.cta','Demander un premier échange →'],
['poles.conseil.items','Stratégie & aide à la décision\nTransitions & restructuration\nOrganisation & performance\nPilotage de projets\nFinance & investissement\nDéveloppement commercial'],
['poles.note.1_html','<b>Premier échange</b> de 20 minutes'],
['poles.note.2_html','Réponse <b>sous 24 h</b>'],
['poles.note.3_html','Présentiel <b>Meknès</b> ou à distance'],
['methode.label','Comment ça marche'],
['methode.title_html','De la prise de contact aux <em>résultats</em>, en 3 étapes.'],
['methode.subtitle','Un parcours simple et cadré — vous savez exactement ce qui se passe à chaque étape.'],
['methode.quiz_lead','Où en êtes-vous dans votre parcours ? Choisissez une étape pour voir le détail.'],
['methode.1.num','01'],
['methode.1.tag','Simple & rapide'],
['methode.1.title','Prenez contact'],
['methode.1.desc','Un premier échange de 20 minutes, confidentiel et sans engagement.'],
['methode.1.chips','2 minutes,Sans engagement'],
['methode.2.num','02'],
['methode.2.tag','Sous 24 h'],
['methode.2.title','Diagnostic & recommandation'],
['methode.2.desc','Nous analysons votre situation, répondons à vos questions et proposons un plan clair — consultation, coaching ou accompagnement sur mesure.'],
['methode.2.chips','Réponse sous 24 h,Conseiller dédié'],
['methode.3.num','03'],
['methode.3.tag','Résultats'],
['methode.3.title','Passez à l\'action'],
['methode.3.desc','Suivez un accompagnement structuré avec des jalons mesurables. Des progrès visibles dès les premières semaines.'],
['methode.3.chips','Suivi réel,Exigence'],
['expert.label','Pourquoi NC Consulting'],
['expert.title_html','Un consultant <em>dédié</em>, une exigence premium.'],
['expert.text','NC Consulting place le conseil et le coaching au centre : relation directe, diagnostic franc et accompagnement sur mesure — sans intermédiaire, sans formule générique.'],
['expert.cta','Demander un premier échange →'],
['expert.pillar.1.title','Clarté stratégique'],
['expert.pillar.1.text','Décisions éclairées, priorités nettes et plans d\'action concrets dès les premiers échanges.'],
['expert.pillar.2.title','Performance durable'],
['expert.pillar.2.text','Leadership, posture et discipline de résultats pour performer dans la durée.'],
['expert.pillar.3.title','Confiance absolue'],
['expert.pillar.3.text','Échanges confidentiels, écoute exigeante et suivi réel entre chaque séance.'],
['founder.label','Mot du fondateur'],
['founder.title_html','Une exigence <em>personnelle</em>, un engagement total.'],
['founder.quote','« J\'ai créé NC Consulting pour offrir aux dirigeants et professionnels ambitieux ce que j\'aurais voulu trouver : un regard extérieur exigeant, une écoute réelle et des recommandations applicables dès le lendemain. »'],
['founder.text','Chaque accompagnement est traité avec la même rigueur — confidentialité absolue, clarté dans le diagnostic et suivi jusqu\'aux résultats. À Meknès ou à distance, la relation reste directe, sans intermédiaire.'],
['founder.name','Nouamane Chaltoute'],
['founder.credential','Professeur d\'enseignement supérieur'],
['founder.role','Fondateur · NC Consulting · Meknès'],
['founder.cta','Réserver un échange avec moi →'],
['about.label','Explorer · Meknès & à distance'],
['about.title_html','Toute NC Consulting, <em>en un arbre.</em>'],
['about.quiz_lead','Déployez les branches pour parcourir le cabinet — qui nous sommes, ce que nous faisons, comment nous travaillons. Chaque feuille mène au détail complet.'],
['about.mission_title','Notre mission'],
['about.mission_lead_html','<strong>NC Consulting</strong> accompagne dirigeants, cadres et professionnels ambitieux avec une approche directe : diagnostic franc, recommandations actionnables et suivi dans la durée.'],
['about.mission_p2','Notre expertise couvre le conseil stratégique, le coaching exécutif et l\'accompagnement sur mesure — à Meknès et à distance, via ncconsulting.ma.'],
['about.mission_note','La relation de confiance et la confidentialité sont au cœur de chaque mission.'],
['about.fact.1_num','15+'],
['about.fact.1_lbl','Ans d\'expérience'],
['about.fact.2_num','Meknès'],
['about.fact.2_lbl','Ancrage local · Maroc'],
['about.fact.3_num','2'],
['about.fact.3_lbl','Formats : présentiel & visio'],
['about.pillar.1.title','Consultation, coaching & conseil'],
['about.pillar.1.text','Conseil stratégique et coaching exécutif pour décisions claires et impact mesurable.'],
['about.pillar.2.title','Sur mesure, sans formule générique'],
['about.pillar.2.text','Chaque accompagnement est calibré sur votre contexte, vos objectifs et votre rythme.'],
['about.pillar.3.title','Professionnels exigeants uniquement'],
['about.pillar.3.text','Dirigeants, cadres et entrepreneurs qui visent l\'excellence et des résultats concrets.'],
['about.cta','Échanger avec un conseiller →'],
['about.clients_label','Pour qui'],
['reels.label','Retours terrain'],
['reels.title_html','Ils interviennent <em>avec nous</em>.'],
['reels.subtitle_html','Intervenants et partenaires du cabinet — ce qu’ils disent de nos formations.'],
['reels.note_html','Suivez nos actualités sur <a href="https://www.linkedin.com/company/nc-consulting10" target="_blank" rel="noopener noreferrer">LinkedIn</a>.'],
['faq.label','FAQ'],
['faq.title_html','Réponses rapides, <em>zéro stress</em>.'],
['contact.scarcity','Premier échange de 20 min — sans engagement'],
['contact.title_html','Réservez un <em>premier échange</em>'],
['contact.lead','Vingt minutes pour clarifier votre besoin (conseil, coaching ou préparation). Réponse personnalisée sous 24 h.'],
['contact.benefits','20 minutes · Meknès ou à distance\nConfidentiel · sans frais ni engagement\nDiagnostic franc et prochaines étapes concrètes\nRéponse sous 24 heures'],
['contact.slots_html','Réponse sous <b style="color:var(--gold-lt)">24 h</b> · Sur rendez-vous'],
['footer.tagline','Conseil, coaching exécutif & accompagnement premium — à Meknès et à distance.'],
['contact.location','Meknès, Maroc'],
['contact.phone_display','06 06 11 11 99'],
['contact.phone_tel','+212606111199'],
['contact.email','chaltoutenouamane@gmail.com'],
['footer.copyright','© 2026 NC Consulting · Meknès, Maroc']
];

var CMS_TRUST_ROWS = [
['t1','Expertise','solo premium','true','1'],
['t2','Meknès','& Maroc','true','2'],
['t3','Confidentialité','garantie','true','3'],
['t4','Approche','sur mesure','true','4'],
['t5','Résultats','mesurables','true','5'],
['t6','Présentiel','& à distance','true','6']
];

var CMS_FAQ_ROWS = [
['q1','À qui s\'adresse NC Consulting ?','Dirigeants, cadres, entrepreneurs et professionnels ambitieux qui cherchent un regard extérieur exigeant pour progresser plus vite et prendre de meilleures décisions.','true','1'],
['q2','Comment se déroule une consultation 1-à-1 ?','Une séance individuelle et confidentielle : nous cadrons votre problématique, l\'analysons ensemble, puis repartons avec un plan d\'action concret et un compte-rendu écrit.','true','2'],
['q3','Les séances à distance sont-elles aussi efficaces qu\'en présentiel ?','Oui : même exigence qu\'en présentiel lorsque le suivi est structuré et régulier. Vous choisissez le format qui vous convient — Meknès ou visio.','true','3'],
['q4','Quelle différence entre coaching exécutif et accompagnement & conseil ?','Le coaching exécutif est un programme structuré sur plusieurs semaines autour de votre leadership et performance. L\'accompagnement & conseil est un partenariat continu pour vos projets, transitions et décisions majeures.','true','4'],
['q5','Comment se passe le premier échange ?','Vingt minutes, par téléphone ou en visio, sans frais ni engagement. Il sert à qualifier votre situation et à déterminer si je suis la bonne personne — et si ce n’est pas le cas, je vous le dis.','true','5']
];

var CMS_CASES_ROWS = [
['c1','Conseil · PME','Clarifier la feuille de route d\'une PME en croissance','Un dirigeant de PME industrielle à Meknès avait besoin d\'arbitrer entre expansion commerciale et restructuration interne. En quelques semaines d\'accompagnement conseil, priorités clarifiées, comité de pilotage mis en place et décisions majeures tranchées.','✓ Feuille de route validée · Équipe alignée','true','1'],
['c2','Coaching exécutif','Renforcer le leadership d\'un manager en transition','Un cadre promu à un poste de direction peinait à prendre sa place et à déléguer. Programme de coaching exécutif sur plusieurs semaines : posture affirmée, communication structurée et indicateurs de performance suivis à chaque étape.','✓ Promotion consolidée · Équipe mobilisée','true','2']
];

var CMS_CLIENTS_ROWS = [
['cl1','Dirigeants PME','true','1'],
['cl2','Cadres supérieurs','true','2'],
['cl3','Entrepreneurs','true','3'],
['cl4','Institutions publiques','true','4'],
['cl5','Profils en transition','true','5']
];

var CMS_BLOG_ROWS = [
['licence-temps-amenage','licence-temps-amenage','Licence temps aménagé','Même diplôme, horaires compatibles avec l\'emploi.','reprise','<p>La demande « licence temps aménagé » (ou licence d\'excellence temps aménagé) revient souvent chez les salariés qui veulent un Bac+3 reconnu sans basculer en temps plein. Ce format existe notamment à Meknès (ex. <a href="/blog/fsjes-meknes-licence-master-excellence.html">FSJES Meknès</a>) : même diplôme, rythme réorganisé.</p>\n\n        <h2>Licence temps aménagé : le même diplôme, un autre rythme</h2>\n        <p>Une <strong>licence temps aménagé</strong> n\'est pas une formation courte « allégée ». C\'est le même cursus de Licence — souvent une Licence d\'Excellence — avec des cours en soirée, le week-end ou en hybride. Le contenu, les évaluations et la reconnaissance restent alignés sur le parcours classique ; seul l\'emploi du temps change.</p>\n        <p>C\'est la distinction essentielle avec certaines formations continues qui délivrent une attestation plutôt qu\'un vrai diplôme de Licence.</p>\n\n        <h2>Pour qui ce format a du sens</h2>\n        <p>Le format convient surtout aux profils qui ont déjà une stabilité pro à préserver : salarié en évolution, reconversion, ou reprise après une interruption d\'études. Le volume de cours et de travail personnel doit rester compatible avec un emploi si le planning est fixé dès le départ — et non improvisé semaine après semaine.</p>\n\n        <h2>Concours d\'accès : ne pas sous-estimer l\'oral</h2>\n        <p>Accéder à une licence d\'excellence temps aménagé passe souvent par un concours (écrit et/ou oral). L\'exigence du jury ne baisse pas parce que vous travaillez à côté : motivation, bases et tenue sous pression restent décisives. La méthode d\'entraînement est la même que pour le temps plein — voir <a href="/blog/licence-master-excellence-meknes.html">réussir l\'oral en 5 étapes</a>.</p>\n\n        <div class="nc-blog-callout">\n          <div class="nc-blog-callout-ico" aria-hidden="true">★</div>\n          <div>\n            <strong>À retenir</strong>\n            Cherchez la requête exacte <em>licence temps aménagé</em> — puis vérifiez l\'avis de concours de l\'établissement. Le pilier général : <a href="/blog/licence-master-temps-amenage-reprendre-etudes.html">reprendre Licence / Master en travaillant</a>.\n          </div>\n        </div>\n\n        <h2>Licence ou Master temps aménagé ?</h2>\n        <p>Si vous hésitez entre Licence et Master (y compris Master d\'Excellence / Master aménagé), le niveau d\'entrée et le temps de préparation diffèrent nettement. Notre guide <a href="/blog/licence-vs-master-excellence-preparation.html">Licence vs Master d\'Excellence</a> détaille délais et attentes du jury. Pour le Master seul : <a href="/blog/master-temps-amenage.html">Master temps aménagé</a>.</p>\n\n        <h2>Se préparer avec NC Consulting</h2>\n        <p>Nous accompagnons les candidats à une licence temps aménagé (et formats proches à Meknès) : concours, organisation du double rythme, présentiel ou distance. Indiquez « Licence · temps aménagé » dans le formulaire.</p>','','2026-07-28','8','false','Licence en temps aménagé à Meknès : horaires, conditions d\'accès, inscription et coût. Guide 2026 mis à jour pour les salariés qui reprennent leurs études.','true','1'],
['master-temps-amenage','master-temps-amenage','Master temps aménagé','Bac+5 sans arrêter de travailler — concours & rythme.','reprise','<p>Le <strong>master temps aménagé</strong> (parfois appelé Master aménagé ou Master d\'Excellence à temps aménagé) cible les professionnels déjà titulaires d\'une Licence qui veulent un Bac+5 sans quitter leur poste. À Meknès, la <a href="/blog/fsjes-meknes-licence-master-excellence.html">FSJES</a> propose notamment ce type de format selon les sessions.</p>\n\n        <h2>Master temps aménagé vs Master d\'Excellence classique</h2>\n        <p>Sur le fond, l\'exigence reste celle d\'un Master : spécialisation, maturité de discours, souvent un meilleur anglais, et un projet pro cohérent. Ce qui change, c\'est le rythme (soirée / week-end / hybride) — et à l\'oral, la capacité à montrer que vous tiendrez réellement le double emploi du temps, pas seulement sur le papier.</p>\n        <p>Ce n\'est pas une « version light » du Master d\'Excellence : même diplôme, même reconnaissance dans la plupart des cas — à confirmer sur l\'avis officiel de l\'établissement.</p>\n\n        <h2>Qui candidate (et qui devrait attendre)</h2>\n        <p>Profil type : Bac+3 validé, expérience (stage, projet, emploi) à valoriser, et une disponibilité réelle compatible avec un emploi sur la durée. Si votre priorité est plutôt un premier diplôme Bac+3, partez plutôt sur une <a href="/blog/licence-temps-amenage.html">licence temps aménagé</a>.</p>\n\n        <h2>Préparer le concours d\'un Master aménagé</h2>\n        <p>Prévoyez une préparation plus longue qu\'une Licence si le dossier (parcours + argumentaire) n\'est pas encore structuré. Travaillez : fil rouge de présentation, spécialisation de filière, anglais si demandé, oraux blancs chronométrés. Méthode commune : <a href="/blog/licence-master-excellence-meknes.html">oral en 5 étapes</a>. Comparatif Licence / Master : <a href="/blog/licence-vs-master-excellence-preparation.html">délais &amp; préparation</a>.</p>\n\n        <div class="nc-blog-callout">\n          <div class="nc-blog-callout-ico" aria-hidden="true">★</div>\n          <div>\n            <strong>À retenir</strong>\n            Nommez le format exact face au jury : <em>Master temps aménagé</em> / Master d\'Excellence aménagé — et le pilier général du cluster : <a href="/blog/licence-master-temps-amenage-reprendre-etudes.html">reprendre Licence / Master en travaillant</a>.\n          </div>\n        </div>\n\n        <h2>Se préparer avec NC Consulting</h2>\n        <p>Nous accompagnons les candidats Master temps aménagé et Master d\'Excellence (formats aménagés inclus) : concours, anglais, organisation du double rythme — Meknès et à distance. Indiquez « Master · temps aménagé » dans le formulaire.</p>','','2026-07-28','8','false','Master en temps aménagé à Meknès : tarifs, conditions d\'admission et déroulé des cours du soir et week-end. Rentrée 2026.','true','2'],
['est-meknes-bachelor-ingenierie-finance','est-meknes-bachelor-ingenierie-finance','Bachelor EST Meknès — IIF & Finance','Ingénierie et Innovation Financière, Finance-Comptabilité — temps normal & aménagé.','etablissements','<h2>Deux Bachelors, deux profils différents</h2>\n        <p>L\'<strong>École Supérieure de Technologie de Meknès</strong>, rattachée à l\'<strong>Université Moulay Ismaïl</strong>, propose deux parcours sélectifs particulièrement demandés. Le Bachelor <strong>Ingénierie et Innovation Financière</strong> forme sur la finance moderne, les outils d\'analyse quantitative, et une dimension d\'innovation qui le distingue d\'un cursus de finance classique — c\'est un profil hybride entre technique financière et esprit d\'ingénierie. Le Bachelor <strong>Finance, Comptabilité &amp; Systèmes de Contrôle</strong>, de son côté, va plus loin dans la comptabilité, le contrôle de gestion, l\'audit et les systèmes d\'information financière — un profil davantage orienté vers la maîtrise opérationnelle des processus financiers d\'une entreprise.</p>\n        <p>Les deux filières restent sélectives, et le concours ne récompense pas simplement le volume de révision fourni en amont. Il mesure trois choses&nbsp;: la clarté du projet professionnel du candidat, la maîtrise réelle des bases (plutôt que leur accumulation), et la capacité à tenir sous pression — un point particulièrement décisif à l\'oral, où beaucoup de candidats pourtant bien préparés sur le fond perdent des points sur la forme.</p>\n\n        <h2>Temps normal ou temps aménagé&nbsp;: un même diplôme, deux rythmes</h2>\n        <p>Certains Bachelors de l\'EST Meknès existent en temps normal, pour les étudiants disponibles à plein temps, et en temps aménagé, avec des horaires compatibles avec une activité professionnelle. Le diplôme délivré et son niveau de reconnaissance restent strictement identiques entre les deux formats — seule l\'organisation du rythme change.</p>\n        <p>Pour un candidat déjà en poste, le temps aménagé représente souvent la voie la plus réaliste, à condition de ne pas sous-estimer deux choses&nbsp;: l\'organisation rigoureuse d\'un planning hebdomadaire tenable sur la durée, et une préparation à l\'oral aussi sérieuse que si le format était classique — l\'exigence du jury ne baisse pas parce que le candidat travaille à côté. Notre <a href="/blog/licence-master-temps-amenage-reprendre-etudes.html">guide sur la reprise d\'études en temps aménagé</a> détaille le cadre général applicable à ce type de parcours.</p>\n\n        <h2>Ce qu\'évalue concrètement le concours</h2>\n        <p>Selon la filière et la session, le concours d\'entrée à l\'EST Meknès combine généralement une épreuve écrite et un oral. L\'écrit porte sur les bases de finance ou de comptabilité selon la filière visée, avec du raisonnement et parfois des questions de logique ou de culture économique générale. L\'oral, souvent l\'étape la plus redoutée, évalue la motivation du candidat, la cohérence de son projet, sa maîtrise des notions pivots de la filière, et sa capacité à structurer une réponse claire sous chrono, sans tourner autour du sujet.</p>\n        <p>Le format exact — coefficients, calendrier, nature précise des épreuves — varie d\'une session à l\'autre, et il reste indispensable de vérifier le règlement officiel publié par l\'établissement pour l\'année en cours. Ce qui ne change pas, en revanche, c\'est la méthode de préparation qui fonctionne&nbsp;: clarifier le format attendu, consolider les bases de la filière choisie, construire un fil rouge de présentation personnelle, puis enchaîner des simulations d\'oral chronométrées jusqu\'à ce que la structure devienne un réflexe. Le détail complet de cette méthode se trouve dans notre <a href="/blog/licence-master-excellence-meknes.html">article pilier sur la préparation orale en 5 étapes</a>.</p>\n\n        <div class="nc-blog-callout">\n          <div class="nc-blog-callout-ico" aria-hidden="true">★</div>\n          <div>\n            <strong>À retenir</strong>\n            Nommez votre filière exacte face au jury : <em>Ingénierie et Innovation Financière</em> ou <em>Finance, Comptabilité &amp; Systèmes de Contrôle</em> — pas « un bachelor en finance » en vague.\n          </div>\n        </div>\n\n        <h2>Pourquoi l\'accompagnement fait la différence sur ces concours</h2>\n        <p>Les candidats qui réussissent ces concours partagent presque toujours trois points communs&nbsp;: un plan de révision réellement ciblé plutôt qu\'une tentative de tout couvrir dans le manuel, des simulations d\'oral chronométrées répétées plusieurs fois avant le jour J, et un retour extérieur qui vient corriger le flou qu\'on ne perçoit jamais soi-même en préparation solitaire. En pratique, l\'erreur la plus fréquente reste de sur-investir l\'écrit par réflexe scolaire, et de sous-estimer l\'oral — alors que c\'est souvent là que se joue le classement final.</p>\n        <p>Pour les candidats en temps aménagé, l\'enjeu est double&nbsp;: tenir le rythme entre travail et préparation sans s\'épuiser, tout en sachant valoriser son expérience professionnelle à l\'oral sans perdre la rigueur disciplinaire attendue. Un accompagnement structuré évite justement de disperser un temps de préparation déjà compté.</p>\n\n        <h2>Se préparer avec NC Consulting</h2>\n        <p>NC Consulting prépare spécifiquement les candidats aux deux Bachelors de l\'EST Meknès, qu\'il s\'agisse de profils classiques en temps normal ou de professionnels actifs en temps aménagé — avec la même exigence pédagogique dans les deux cas, en présentiel à Meknès ou à distance. Si vous hésitez entre cette voie et une Licence ou un Master d\'Excellence, notamment à la FSJES Meknès, notre <a href="/blog/licence-vs-master-excellence-preparation.html">article comparatif Licence vs Master d\'Excellence</a> et notre <a href="/blog/fsjes-meknes-licence-master-excellence.html">page dédiée à la FSJES Meknès</a> vous aideront à trancher.</p>\n        <p>Indiquez clairement votre filière (IIF ou Finance-Comptabilité) et votre format (temps normal ou aménagé) dans le formulaire. Nous vous orientons vers le parcours d\'accompagnement adapté.</p>','','2026-07-27','10','false','Préparez le concours des Bachelors EST Meknès : Ingénierie et Innovation Financière, Finance Comptabilité &amp; Systèmes de Contrôle. Temps normal et temps aménagé. Coaching Meknès &amp; à distance.','true','3'],
['fsjes-meknes-licence-master-excellence','fsjes-meknes-licence-master-excellence','FSJES Meknès — Licence & Master d\'Excellence','Management, Finance, Audit, Marketing Digital — concours & formats aménagés.','etablissements','<h2>La FSJES Meknès, en clair</h2>\n        <p>La <strong>Faculté des Sciences Juridiques, Économiques et Sociales de Meknès</strong> fait partie de l\'<strong>Université Moulay Ismaïl</strong>, et elle ouvre chaque année plusieurs parcours sélectifs — Licence d\'Excellence, Master d\'Excellence, et des formats aménagés pensés pour les professionnels déjà en activité. L\'accès se fait sur concours, écrit et/ou oral selon les filières et les sessions.</p>\n        <p>Ce que peu de candidats anticipent, c\'est le volume&nbsp;: beaucoup de dossiers pour un nombre de places limité. Dans ce contexte, le jury ne cherche pas le candidat qui en sait le plus — il cherche celui qui sait le mieux articuler ce qu\'il sait. Un discours flou, une réponse récitée, ou l\'absence d\'un vrai projet derrière le choix de filière suffisent à faire baisser un classement, même avec un excellent dossier académique.</p>\n\n        <h2>Les filières que nous accompagnons</h2>\n        <p>Notre accompagnement couvre quatre filières bien précises de la FSJES Meknès, chacune avec ses propres attentes à l\'oral. En <strong>Management</strong>, le jury teste la capacité à raisonner sur l\'organisation, la décision et le leadership à travers des cas courts, souvent tirés de situations concrètes. En <strong>Finance</strong>, ce sont les bases financières et la culture économique qui priment, avec une attention particulière portée à la capacité d\'analyse plutôt qu\'à la récitation de formules. L\'<strong>Audit</strong> demande une rigueur méthodique et une aptitude à lire une situation d\'entreprise avec un œil critique. Et le <strong>Marketing Digital</strong> évalue autant la connaissance des canaux et des stratégies que la clarté de l\'argumentation face au jury — un exercice qui ressemble presque à un pitch commercial.</p>\n        <p>Un point que beaucoup de candidats sous-estiment&nbsp;: le jury veut entendre pourquoi cette filière précise, à cette faculté précise, et non un discours générique sur «&nbsp;l\'excellence&nbsp;» qui pourrait s\'appliquer à n\'importe quel concours du pays.</p>\n\n        <h2>Trois formats, trois logiques de préparation</h2>\n        <p>À la FSJES Meknès, la Licence d\'Excellence, le Master d\'Excellence et le Master Aménagé ne se préparent pas de la même façon, même s\'ils partagent un socle commun. La Licence mise sur des bases solides, une motivation qui sonne vraie, et une bonne logique de raisonnement — l\'oral y est souvent l\'élément le plus décisif du classement final. Le Master d\'Excellence relève le niveau d\'un cran&nbsp;: la spécialisation devient centrale, la maturité de discours est attendue, l\'anglais est souvent mieux maîtrisé chez les candidats qui réussissent, et une expérience concrète — stage, projet, engagement associatif — doit pouvoir être valorisée dans l\'échange. Le Master Aménagé, lui, conserve le même niveau d\'exigence académique, mais y ajoute une dimension supplémentaire&nbsp;: convaincre le jury qu\'on tiendra réellement le double rythme entre vie professionnelle et études, pas seulement sur le papier mais dans la façon de s\'exprimer et de se projeter.</p>\n        <p>Pour aller plus loin sur la comparaison entre ces deux premiers formats, notre <a href="/blog/licence-vs-master-excellence-preparation.html">article dédié</a> détaille les différences de durée de préparation et de niveau d\'exigence entre Licence et Master d\'Excellence. Et pour ceux qui envisagent la voie aménagée en général, notre <a href="/blog/licence-master-temps-amenage-reprendre-etudes.html">guide sur la reprise d\'études en travaillant</a> pose le cadre complet.</p>\n\n        <div class="nc-blog-callout">\n          <div class="nc-blog-callout-ico" aria-hidden="true">★</div>\n          <div>\n            <strong>À retenir</strong>\n            Nommez l\'établissement : <em>FSJES Meknès — Université Moulay Ismaïl</em>. Un pitch qui ne cite que « une licence d\'excellence » sonne générique face au jury.\n          </div>\n        </div>\n\n        <h2>Ce que le jury écoute vraiment</h2>\n        <p>Au-delà de la filière choisie, trois signaux reviennent systématiquement dans l\'évaluation, quelle que soit la spécialité visée. D\'abord la clarté du projet&nbsp;: pourquoi cette filière, pourquoi Meknès précisément, et surtout, quelle cohérence avec le parcours déjà suivi. Ensuite la maîtrise des bases&nbsp;: pas une accumulation de connaissances, mais des notions pivots bien comprises, un vocabulaire de filière maîtrisé, et l\'aptitude à mobiliser un exemple concret, marocain ou international, pour illustrer un propos plutôt que de rester dans l\'abstraction. Enfin, la tenue sous pression — une structure de réponse claire, la capacité à reformuler une question mal comprise sans paniquer, et une conclusion nette plutôt qu\'un discours qui s\'étiole faute de plan.</p>\n        <p>Cette méthode d\'entraînement — construire un fil rouge de présentation, enchaîner des oraux blancs, suivre une checklist les derniers jours avant l\'épreuve — est détaillée dans notre <a href="/blog/licence-master-excellence-meknes.html">article pilier sur la méthode orale en 5 étapes</a>, la base commune à toutes nos préparations.</p>\n\n        <h2>Se préparer avec NC Consulting</h2>\n        <p>Nous accompagnons les candidats à la Licence et au Master d\'Excellence de la FSJES Meknès, ainsi qu\'aux formats aménagés, sur les quatre filières mentionnées plus haut — à Meknès en présentiel, ou à distance pour ceux qui ne peuvent pas se déplacer régulièrement. Si vous hésitez plutôt vers un Bachelor à l\'École Supérieure de Technologie de Meknès, en Ingénierie et Innovation Financière ou en Finance-Comptabilité, notre <a href="/blog/est-meknes-bachelor-ingenierie-finance.html">page dédiée à l\'EST Meknès</a> couvre ce parcours en détail.</p>\n        <p>Précisez dans le formulaire&nbsp;: Licence ou Master, filière (Management / Finance / Audit / Marketing Digital), et format (classique ou aménagé). Nous vous orientons vers l\'accompagnement adapté.</p>','','2026-07-27','10','false','Licence et Master d\'Excellence à la FSJES Meknès : filières, concours et préparation. Tout ce qu\'il faut savoir pour candidater en 2026.','true','4'],
['anglais-concours-progresser-6-semaines','anglais-concours-progresser-6-semaines','Anglais aux concours : progresser en 6 semaines','Routine 15–20 min/jour, oral prioritaire.','concours','<p>L\'anglais est souvent la matière reléguée en dernier dans les plannings de révision — et c\'est généralement une erreur, parce que les progrès y sont rapides si on s\'y prend tôt, avec une méthode adaptée, très différente de celle utilisée pour les matières académiques classiques.</p>\n        <h2>Le niveau réellement attendu</h2>\n        <p>La plupart des concours d\'excellence n\'attendent pas un anglais académique parfait, mais une capacité à se présenter, à discuter de son parcours et de ses motivations, et à suivre une conversation simple sans blocage prolongé. L\'objectif réaliste est de viser la fluidité sur des sujets connus — soi-même, son parcours, son domaine — plutôt qu\'un vocabulaire encyclopédique inutile pour l\'oral d\'un concours.</p>\n        <p>Si le concours comporte un oral en anglais ou des questions posées en anglais durant l\'entretien général, mieux vaut concentrer l\'essentiel de son effort sur l\'expression orale : prononciation, aisance, fluidité, et vocabulaire directement lié à son parcours. L\'écrit se rattrape généralement plus facilement en dernière minute que l\'aisance orale, qui demande un entraînement plus long et plus régulier pour devenir naturelle.</p>\n        <h2>Pourquoi la régularité change tout en anglais</h2>\n        <p>Contrairement aux matières académiques, qui bénéficient de sessions de révision longues et concentrées, l\'anglais progresse avant tout par exposition régulière — un mécanisme d\'acquisition linguistique bien différent de la mémorisation de contenu. Quinze à vingt minutes quotidiennes, qu\'il s\'agisse d\'un podcast, d\'une vidéo courte, d\'une lecture ou d\'une pratique orale active, sur six semaines donnent généralement de meilleurs résultats que trois heures ponctuelles concentrées le week-end.</p>\n        <p>Plusieurs ressources gratuites permettent de construire cette routine facilement : des podcasts d\'actualité en anglais simplifié pour l\'écoute active, des applications de répétition espacée pour consolider un vocabulaire ciblé sur son domaine, et surtout un exercice simple mais redoutablement efficace — s\'enregistrer en train de se présenter en anglais pendant deux minutes, puis se réécouter pour identifier les points à corriger. Des vidéos courtes de vulgarisation dans son domaine, sous-titrées en anglais, aident aussi à associer vocabulaire technique et prononciation naturelle.</p>\n        <h2>Relier l\'anglais à sa présentation orale générale</h2>\n        <p>Une méthode particulièrement efficace consiste à préparer en anglais la même présentation de deux minutes déjà travaillée en français pour l\'oral général du concours. Cet exercice a un double bénéfice : il renforce l\'aisance en anglais sur un contenu déjà maîtrisé en français, et il clarifie souvent le discours français lui-même, par un effet miroir bien connu chez les personnes qui travaillent régulièrement dans deux langues.</p>\n        <p>Sur six semaines, une progression réaliste ressemble à ceci : les deux premières semaines pour consolider le vocabulaire lié au parcours et travailler la présentation personnelle, les semaines trois et quatre pour renforcer l\'exposition quotidienne et démarrer les premiers exercices d\'auto-enregistrement, et les deux dernières semaines pour enchaîner sur des simulations orales en anglais avec retour extérieur, afin d\'ajuster prononciation et fluidité avant le jour J. Le piège le plus fréquent reste de se concentrer uniquement sur le vocabulaire théorique en négligeant la pratique orale active, ou d\'attendre les deux dernières semaines pour commencer alors que l\'anglais demande justement une exposition étalée dans le temps pour progresser durablement.</p>\n        <p>L\'anglais s\'intègre dans la préparation globale proposée en <a href="/form.html">semaine gratuite</a> — pas comme une matière isolée, mais comme un pilier à part entière de la présentation orale générale. Reliez-le au cadre de <a href="/blog/licence-master-excellence-meknes.html">Réussir l\'oral en 5 étapes</a> et aux questions types de la <a href="/blog/simulation-oral-questions-concours-excellence.html">simulation d\'oral</a>.</p>','','2026-07-23','20','false','Progresser en anglais avant un concours d&#x27;excellence en 6 semaines : niveau attendu, priorité entre oral et écrit, et routine quotidienne de 15-20 minutes.','true','5'],
['apres-admission-demarrer-licence-master','apres-admission-demarrer-licence-master','Après l\'admission : bien démarrer','Habitudes dès la rentrée — temps plein ou aménagé.','reprise','<p>Réussir le concours n\'est que la première étape d\'un parcours plus long. Les habitudes prises dès les premières semaines déterminent souvent le rythme de toute l\'année, que l\'on rejoigne un parcours classique à temps plein ou un format à temps aménagé en parallèle d\'une activité professionnelle.</p>\n        <h2>Ce qui se joue dès les deux premières semaines</h2>\n        <p>Beaucoup d\'étudiants abordent la rentrée avec l\'idée qu\'ils s\'organiseront une fois le rythme pris. En pratique, les habitudes installées dès les deux premières semaines — organisation, régularité, méthode de travail — deviennent rapidement des automatismes difficiles à corriger ensuite. Mieux vaut structurer son organisation dès le départ plutôt que d\'attendre les premières difficultés académiques pour réagir, à un moment où il devient plus coûteux de rattraper le retard accumulé.</p>\n        <p>Concrètement, cela passe par un espace de travail et des créneaux fixes dès le premier jour, pas seulement à l\'approche des premiers examens, par une relecture régulière des cours au fil du semestre plutôt qu\'une découverte de tout le contenu juste avant les évaluations, et par des points d\'étape hebdomadaires pour évaluer sa progression réelle plutôt qu\'un bilan uniquement en fin de semestre, quand il est déjà trop tard pour ajuster quoi que ce soit. La construction progressive d\'un réseau, camarades et professeurs, est aussi souvent négligée en début de parcours, alors qu\'elle devient précieuse pour la suite.</p>\n        <h2>Le cas particulier du temps aménagé</h2>\n        <p>Pour ceux qui démarrent en temps aménagé tout en travaillant, la priorité absolue est de clarifier avec son employeur ses disponibilités réelles dès la première semaine, et non après avoir accumulé les premiers retards. Bloquer ses créneaux d\'études comme des rendez-vous professionnels non négociables, dès le premier jour, évite le glissement progressif où le travail prend systématiquement le pas sur les études « juste cette semaine », semaine après semaine, jusqu\'à ce que le rattrapage devienne difficile.</p>\n        <p>Une approche concrète pour bien démarrer consiste à identifier immédiatement les créneaux fixes de la semaine consacrés au travail personnel, à prendre contact avec un ou deux camarades de promotion pour constituer un premier groupe d\'entraide, et à relire chaque cours dans les quarante-huit heures suivant la séance, même brièvement, pour ancrer la mémorisation avant l\'accumulation de nouveau contenu.</p>\n        <h2>Les erreurs qui coûtent le plus cher en début de parcours</h2>\n        <p>Sous-estimer la charge de travail réelle, en pensant qu\'on rattrapera plus tard, revient très régulièrement chez les étudiants en difficulté au premier semestre. Ne pas demander d\'aide dès les premiers signes de difficulté, par fierté ou simplement par méconnaissance des ressources disponibles, aggrave souvent des problèmes qui auraient pu être résolus rapidement. Négliger le réseau construit pendant la formation, en se concentrant uniquement sur le contenu académique, prive aussi d\'un soutien précieux pour la suite du parcours et de la vie professionnelle qui suivra.</p>\n        <p>Beaucoup de candidats considèrent enfin que l\'accompagnement s\'arrête une fois le concours réussi. En réalité, les premiers mois du parcours bénéficient souvent d\'un suivi léger pour consolider la méthode de travail acquise pendant la préparation, et éviter le décrochage progressif qui touche une partie des étudiants en début de premier semestre — notamment ceux en temps aménagé, plus exposés au risque d\'épuisement cumulé entre travail et études si les périodes professionnelles chargées n\'ont pas été anticipées dans le calendrier.</p>\n        <p>Si vous souhaitez un accompagnement pour bien démarrer votre parcours après l\'admission, n\'hésitez pas à nous contacter — la réussite au concours n\'est qu\'une étape parmi d\'autres dans votre trajectoire. Pour ceux qui arrivent via le format aménagé, relisez <a href="/blog/licence-master-temps-amenage-reprendre-etudes.html">Licence / Master à temps aménagé</a>. Et si vous préparez encore l\'oral d\'admission, la base reste <a href="/blog/licence-master-excellence-meknes.html">Réussir l\'oral en 5 étapes</a>.</p>','','2026-07-23','8','false','Admis à une Licence ou Master d&#x27;Excellence ? Les habitudes concrètes à prendre dès la rentrée, en temps plein comme en temps aménagé.','true','6'],
['candidats-echec-repartir-methode','candidats-echec-repartir-methode','Échec l\'an dernier : repartir avec une vraie méthode','Diagnostic précis avant de se relancer.','concours','<p>Un échec au concours n\'est pas un jugement définitif sur sa valeur ou son potentiel. C\'est le plus souvent le symptôme d\'un déséquilibre précis dans la préparation, identifiable et corrigeable — à condition de prendre le temps du bon diagnostic avant de se relancer.</p>\n        <h2>Ce qui explique la plupart des échecs</h2>\n        <p>Le plus souvent, ce n\'est pas un manque de travail qui explique l\'échec, mais un déséquilibre entre deux dimensions : le contenu académique appris, et l\'entraînement pratique à l\'oral. Beaucoup de candidats maîtrisent parfaitement la théorie sur le papier mais craquent sur la forme — un stress mal anticipé, un discours mal structuré, une gestion approximative du temps de parole, ou une difficulté à improviser face à une question inattendue qui les prend au dépourvu.</p>\n        <p>La réaction la plus fréquente après un échec consiste à se dire qu\'il faut tout reprendre à zéro — une réaction compréhensible, mais rarement efficace. Un diagnostic précis cherche plutôt à identifier ce qui a réellement posé problème : était-ce une matière technique spécifique ? Un blocage particulier à l\'oral, entre stress, structuration ou improvisation ? Un manque de simulations en conditions réelles avant le jour J ? Ce diagnostic ciblé évite de reproduire les mêmes erreurs sous une forme différente, et surtout d\'investir du temps précieux à sur-réviser des points déjà solides pendant que le vrai point faible reste intact.</p>\n        <h2>Poser un diagnostic concret avant de se relancer</h2>\n        <p>Une démarche utile pourrait ressembler à ceci : relire ses notes de préparation de l\'an dernier pour repérer les points de faiblesse déjà identifiés à l\'époque, refaire une simulation d\'oral filmée pour observer objectivement sa posture, son débit et sa gestion du stress, puis lister précisément les questions qui avaient posé problème et vérifier si elles sont désormais maîtrisées. Même menée seul dans un premier temps, cette démarche structurée éclaire déjà bien mieux la préparation de cette année qu\'une reprise générale sans ciblage précis.</p>\n        <p>Reste la question pratique du nombre de tentatives autorisées, qui dépend des règles propres à chaque concours et à chaque établissement. Certains autorisent plusieurs tentatives sur plusieurs années, d\'autres imposent des limites précises — mieux vaut vérifier ce point tôt, directement auprès de l\'établissement visé, pour adapter sa stratégie en connaissance de cause plutôt que de le découvrir tardivement.</p>\n        <h2>Reconstruire la confiance, étape par étape</h2>\n        <p>L\'échec laisse souvent une trace psychologique plus difficile à gérer que le manque de niveau réel qui l\'a causé. Se concentrer sur des progrès mesurables et concrets — une simulation mieux réussie que la précédente, une notion enfin parfaitement claire, un retour positif sur un point précis — aide à reconstruire la confiance étape par étape. Attendre un déclic global et soudain est généralement une stratégie qui échoue à nouveau, parce qu\'elle repose sur quelque chose qu\'on ne contrôle pas.</p>\n        <p>C\'est là qu\'un regard extérieur change souvent la donne en seconde tentative : il permet de repérer des angles morts invisibles en préparation solitaire — une façon de répondre qui semble parfaitement claire dans sa tête, mais confuse une fois entendue par un tiers, ou un stress mal géré qui n\'apparaît qu\'en simulation réelle, jamais en révision silencieuse. C\'est souvent ce facteur précis, davantage que le contenu académique, qui fait la différence entre un premier échec et une seconde réussite — à condition de ne pas reprendre exactement la même méthode que l\'an dernier en espérant, cette fois, un résultat différent.</p>\n        <p>Si vous retentez cette année, la priorité n\'est pas de tout reprendre depuis le début, mais d\'identifier précisément ce qui doit changer. Un premier échange permet de poser ce diagnostic clairement et d\'orienter la préparation en conséquence. Repartez d\'une base solide avec <a href="/blog/licence-master-excellence-meknes.html">Réussir l\'oral en 5 étapes</a> et multipliez les <a href="/blog/simulation-oral-questions-concours-excellence.html">simulations d\'oral</a>.</p>','','2026-07-23','8','false','Vous avez échoué à un concours d&#x27;excellence l&#x27;an dernier ? Comment poser un diagnostic précis et repartir avec une méthode plus solide cette année.','true','7'],
['concilier-vie-pro-concours-organiser-temps','concilier-vie-pro-concours-organiser-temps','Concilier vie pro et concours','Planning réaliste quand on travaille à temps plein.','reprise','<p>Réviser un concours en étant salarié à temps plein change fondamentalement la donne par rapport à un étudiant disposant de ses journées entières. Ce n\'est ni plus facile ni plus difficile — c\'est une organisation différente, qui demande une méthode différente pour rester efficace sans s\'épuiser au passage.</p>\n        <h2>Accepter un rythme différent, pas moins efficace pour autant</h2>\n        <p>Vous n\'aurez pas six heures par jour à consacrer aux révisions, et ce n\'est pas un problème en soi. Ce qui compte n\'est pas le volume horaire brut, mais la régularité : des sessions courtes de quarante-cinq à quatre-vingt-dix minutes, répétées presque tous les jours, produisent généralement de meilleurs résultats qu\'une disponibilité large mais irrégulière, concentrée uniquement le week-end.</p>\n        <p>Encore faut-il que ces sessions soient fixées à l\'avance plutôt que dépendantes de l\'énergie du moment. « Je réviserai quand j\'aurai le temps » ne fonctionne presque jamais sur la durée, parce que la fatigue de fin de journée prend systématiquement le dessus sur une intention vague. Bloquer des créneaux fixes dans l\'agenda, par exemple vingt-et-une heures à vingt-deux heures trois à quatre soirs par semaine, crée une habitude que le cerveau finit par anticiper. Après deux à trois semaines, la résistance à s\'y mettre diminue nettement — c\'est un mécanisme d\'habitude qui s\'installe, pas une question de volonté pure qu\'il faudrait renouveler chaque soir.</p>\n        <h2>Le format à distance, un vrai atout pour les profils actifs</h2>\n        <p>Une préparation en soirée à distance évite les contraintes de déplacement après une journée de travail — souvent le facteur concret qui fait abandonner un candidat pourtant motivé mais épuisé par le trajet. Un format de vingt-et-une heures à vingt-deux heures à distance, comme celui proposé en semaine gratuite, s\'intègre directement dans une routine du soir sans ajouter de temps de transport à une journée déjà bien remplie.</p>\n        <p>Pour donner un ordre d\'idée réaliste, un planning hebdomadaire soutenable pour un salarié travaillant du lundi au vendredi pourrait ressembler à trois soirées de révision ciblée, une soirée de repos complet, et une session plus longue le samedi matin pour les simulations d\'oral ou l\'approfondissement de notions plus complexes, en laissant le dimanche entièrement libre pour éviter l\'épuisement cumulatif sur la semaine.</p>\n        <h2>Tenir la distance sur plusieurs mois</h2>\n        <p>La question des congés mérite d\'être anticipée tôt. Dans l\'idéal, poser deux à trois jours juste avant l\'oral permet de consolider les acquis et de se reposer sans la fatigue cumulée d\'une journée de travail en plus des révisions du soir. Ce n\'est pas indispensable si la préparation a été régulière tout l\'été, mais cela change souvent nettement la qualité de la dernière ligne droite, notamment sur la clarté d\'esprit le jour même.</p>\n        <p>La motivation constante, elle, n\'existe pour personne sur une durée aussi longue — et ce n\'est pas ce qu\'il faut viser. Ce qui fonctionne, c\'est la discipline sur les créneaux fixes, y compris les jours sans envie particulière, associée à des mini-objectifs hebdomadaires clairs : « cette semaine, je maîtrise telle notion » plutôt que « je révise beaucoup ». Cette façon de mesurer une progression concrète entretient la motivation bien mieux qu\'un objectif flou fixé à trois mois. À l\'inverse, compter uniquement sur le temps libre disponible au jour le jour, ou concentrer toute la préparation sur le week-end en laissant la semaine complètement vide, casse la régularité nécessaire à une bonne mémorisation.</p>\n        <p>Le format à distance en soirée de la <a href="/form.html">semaine gratuite</a> est pensé précisément pour les profils qui travaillent en journée et cherchent une organisation réaliste, pas théorique. Cette même logique s\'applique à ceux qui envisagent une reprise d\'études en temps aménagé — voir l\'<a href="/blog/licence-master-temps-amenage-reprendre-etudes.html">article dédié sur ce sujet</a>. Pour l\'oral lui-même, appuyez-vous sur <a href="/blog/licence-master-excellence-meknes.html">Réussir l\'oral en 5 étapes</a>.</p>','','2026-07-23','8','false','Préparer un concours d&#x27;excellence tout en travaillant à temps plein : planning réaliste, gestion des congés et avantages du format à distance en soirée.','true','8'],
['licence-master-temps-amenage-reprendre-etudes','licence-master-temps-amenage-reprendre-etudes','Temps aménagé : reprendre ses études en travaillant','Même diplôme, rythme compatible avec l\'emploi.','reprise','<p>Vous travaillez déjà depuis plusieurs années, mais une question revient régulièrement : reprendre des études pour valider un diplôme, changer de trajectoire, ou simplement finir ce que vous aviez commencé avant que la vie professionnelle ne prenne le dessus. Le format à temps aménagé existe précisément pour ce profil, et il fonctionne différemment de ce que la plupart des gens imaginent.</p>\n        <h2>Le même diplôme, un rythme différent (FSJES Meknès &amp; EST)</h2>\n        <p>Contrairement à une formation continue générique, souvent plus courte et plus généraliste, un cursus à temps aménagé — notamment à la <strong>FSJES Meknès</strong> ou à l\'<strong>EST Meknès</strong> — reste le même diplôme de Licence, Master d\'Excellence ou Bachelor que le parcours classique. Ce qui change, c\'est uniquement l\'organisation du temps : cours en soirée, le week-end, ou en format hybride combinant présentiel et distanciel selon les établissements. Le contenu pédagogique, les évaluations et le niveau d\'exigence restent identiques au parcours classique — c\'est un point souvent mal compris, et pourtant central : ce n\'est pas une version allégée du diplôme, seulement une version réorganisée dans le temps.</p>\n        <p>Ce format s\'adresse en pratique à trois profils qui reviennent le plus souvent. Le salarié qui souhaite valider ou compléter un diplôme pour évoluer professionnellement. La personne en reconversion, qui change complètement de secteur et a besoin d\'un diplôme reconnu pour appuyer ce virage. Et le candidat qui a interrompu ses études pour des raisons personnelles, professionnelles ou familiales, et souhaite reprendre sans tout arrêter de sa vie actuelle. Ce qui relie ces trois profils, c\'est la volonté de progresser sans sacrifier la stabilité déjà construite — un emploi, des revenus, une vie familiale organisée.</p>\n        <h2>Ce qui fait vraiment la différence entre réussite et abandon</h2>\n        <p>D\'après les retours des candidats ayant mené ce format à son terme, trois facteurs reviennent presque systématiquement. Le premier est un accord clair avec l\'employeur, dès le départ, sur les disponibilités réelles — horaires aménagés, jours de formation, éventuels congés dédiés. Le deuxième est un planning hebdomadaire fixe plutôt qu\'improvisé semaine après semaine : les parcours à temps aménagé qui échouent sont presque toujours ceux gérés « au fil de l\'eau », sans structure posée à l\'avance. Le troisième, souvent sous-estimé, est un accompagnement extérieur qui permet de ne pas perdre le fil dès qu\'une période professionnelle devient plus chargée.</p>\n        <p>À titre indicatif, un candidat en temps aménagé doit prévoir des soirées de cours, du travail personnel le week-end, et parfois une session plus longue. Ce rythme reste soutenable sur la durée s\'il est fixé à l\'avance et respecté — il devient en revanche rapidement intenable s\'il est rattrapé dans l\'urgence avant chaque évaluation.</p>\n        <h2>Reprendre des études en travaillant sans s\'épuiser</h2>\n        <p>C\'est faisable, mais rarement confortable sans un minimum de soutien extérieur. La période la plus délicate se situe généralement autour du deuxième mois, quand la nouveauté du projet s\'estompe et que la fatigue accumulée commence à peser. Un accompagnement structuré aide à anticiper ce moment plutôt que de le subir, à optimiser le peu de temps disponible, et à garder une vision claire de l\'objectif sur toute la durée du parcours plutôt que semaine après semaine sans recul.</p>\n        <p>Trois pièges reviennent souvent chez les candidats qui abandonnent en cours de route : sous-estimer le temps réellement nécessaire en pensant s\'organiser au fur et à mesure, ne pas clarifier ses disponibilités avec son employeur avant de s\'engager, et choisir un format à distance sans avoir vérifié sa propre capacité à travailler seul, sans la structure d\'un cours en présentiel.</p>\n        <p>Si vous envisagez cette voie à la <strong>FSJES Meknès</strong> ou à l\'<strong>EST Meknès</strong>, la première étape est de clarifier votre objectif réel et votre disponibilité réelle — pas celle que vous imaginez en théorie. Pages dédiées par intent : <a href="/blog/licence-temps-amenage.html">licence temps aménagé</a> · <a href="/blog/master-temps-amenage.html">master temps aménagé</a>. Voir aussi <a href="/blog/fsjes-meknes-licence-master-excellence.html">FSJES Meknès</a> et <a href="/blog/est-meknes-bachelor-ingenierie-finance.html">Bachelor EST Meknès</a>. Un premier échange permet d\'y voir clair rapidement. Cette même logique s\'applique aussi à ceux qui préparent leur concours tout en travaillant — voir <a href="/blog/concilier-vie-pro-concours-organiser-temps.html">comment concilier vie professionnelle et concours</a>. Pour structurer l\'oral, partez de la <a href="/blog/licence-master-excellence-meknes.html">méthode en 5 étapes</a>.</p>','assets/blog/temps-amenage.png','2026-07-23','10','false','Vous travaillez et souhaitez reprendre vos études ? Licence et Master en horaires aménagés (soir, week-end, hybride) à Meknès. Conditions et calendrier 2026.','true','9'],
['licence-vs-master-excellence-preparation','licence-vs-master-excellence-preparation','Licence vs Master : différences de préparation','Publics, épreuves, calendrier — choisir le bon concours.','concours','<p>Chaque été, le même malentendu revient chez les candidats : préparer son oral comme s\'il s\'agissait d\'un seul et même concours, qu\'on vise la Licence ou le Master d\'Excellence. Résultat, certains arrivent surpréparés sur des points secondaires et sous-préparés sur ce qui compte vraiment pour leur niveau. Comprendre ce qui distingue réellement les deux parcours permet d\'ajuster son temps de préparation là où il sera le plus utile.</p>\n        <h2>Deux publics, deux attentes du jury (ex. FSJES Meknès)</h2>\n        <p>À la <strong>FSJES Meknès</strong> comme ailleurs, la Licence d\'Excellence s\'adresse à des bacheliers ou des étudiants en tout début de parcours supérieur. Le jury y évalue avant tout un potentiel — logique de raisonnement, motivation sincère, capacité d\'adaptation — plutôt qu\'une expertise déjà construite. On ne demande pas à un candidat de 18 ans d\'avoir un projet professionnel ficelé, mais de montrer qu\'il sait réfléchir et s\'exprimer clairement sous pression.</p>\n        <p>Le Master d\'Excellence change de registre. Il cible des candidats ayant déjà validé une Licence, et le jury attend une maturité de raisonnement plus poussée : la capacité à relier des connaissances académiques à une expérience concrète, un stage, un projet associatif, une première expérience professionnelle, et à défendre un projet de carrière qui va au-delà du « je veux réussir dans ce domaine ». C\'est cette différence de fond, plus que la difficulté des questions elles-mêmes, qui doit orienter la préparation.</p>\n        <h2>Ce que le jury teste vraiment, épreuve par épreuve</h2>\n        <p>Pour une Licence, l\'oral reste centré sur trois axes simples : la clarté du raisonnement, une motivation qui sonne vraie plutôt que récitée, et une culture générale économique de base. Les questions techniques restent rarement pointues, parce que le jury sait qu\'il évalue un potentiel de départ, pas un savoir consolidé.</p>\n        <p>Pour un Master, deux dimensions supplémentaires s\'ajoutent presque systématiquement : une spécialisation thématique — finance, gestion, marketing selon la filière — et souvent une évaluation de l\'anglais professionnel, à l\'oral ou à l\'écrit selon les établissements. Le candidat doit pouvoir défendre ses choix avec des arguments construits : pourquoi cette spécialité précisément, pourquoi ce type de poste visé ensuite, et non se contenter de généralités qui pourraient s\'appliquer à n\'importe quel candidat.</p>\n        <h2>Combien de temps prévoir, concrètement</h2>\n        <p>Avec des bases scolaires solides, une préparation intensive et cadrée suffit souvent pour une Licence d\'Excellence : consolidation de la culture générale, entraînement à la présentation orale, travail sur la gestion du stress. Pour un Master, mieux vaut prévoir davantage de temps, surtout si le dossier — stages, projets, expériences — n\'est pas encore structuré en un vrai argumentaire cohérent. Ce temps supplémentaire ne sert pas uniquement à réviser davantage de contenu ; il sert surtout à construire un récit professionnel clair, ce qui demande une maturation qu\'on ne peut pas accélérer en dernière minute, contrairement à de la mémorisation pure.</p>\n        <p>Prenons deux exemples pour rendre ça concret. Un bachelier qui candidate à une Licence concentrera l\'essentiel de sa préparation sur la clarté de son discours et la gestion de son stress, avec plusieurs simulations d\'oral en fin de parcours. Une candidate titulaire d\'une Licence en gestion, qui vise elle un Master, démarrera plus tôt : d\'abord un travail sur la structuration de son parcours — pourquoi ce Master, quel lien avec son stage précédent — puis un travail spécifique sur l\'anglais professionnel, avant d\'enchaîner sur les simulations d\'oral. Le contenu de préparation diffère donc presque autant que le calendrier lui-même.</p>\n        <h2>Faut-il préparer les deux concours en même temps ?</h2>\n        <p>C\'est possible, mais rarement optimal. Les deux préparations partagent un socle commun — structuration du discours, gestion du stress, méthode de simulation — ce qui permet de mutualiser une partie du travail. Mais le contenu spécifique, culture générale de base d\'un côté, argumentaire de spécialisation de l\'autre, demande un temps dédié à chacun. Diluer son énergie sur les deux fronts sans avoir clarifié une priorité claire est l\'une des erreurs les plus fréquentes chez les candidats indécis, et c\'est souvent celle qui coûte le plus cher en dernière ligne droite.</p>\n        <p>Une dernière précaution, trop souvent négligée : préparer un Master avec le même niveau de généralités qu\'une Licence, sans argumentaire de spécialisation construit, ou négliger l\'anglais professionnel sous prétexte que « ce n\'est pas la matière principale ». Ce sont précisément les points sur lesquels un accompagnement extérieur repère le plus vite ce qui manque.</p>\n        <p>Que vous visiez une Licence ou un Master d\'Excellence à la <strong>FSJES Meknès</strong>, la méthode orale de base reste la même — voir le guide <a href="/blog/licence-master-excellence-meknes.html">Réussir l\'oral en 5 étapes</a>. Formats aménagés : <a href="/blog/licence-temps-amenage.html">licence temps aménagé</a> · <a href="/blog/master-temps-amenage.html">master temps aménagé</a>. Pages établissements : <a href="/blog/fsjes-meknes-licence-master-excellence.html">FSJES Meknès</a> · <a href="/blog/est-meknes-bachelor-ingenierie-finance.html">Bachelor EST Meknès</a>. L\'accompagnement NC Consulting s\'adapte ensuite au niveau précis visé. Pour l\'anglais professionnel souvent attendu en Master, voir aussi <a href="/blog/anglais-concours-progresser-6-semaines.html">progresser en anglais en 6 semaines</a>.</p>','','2026-07-23','8','false','Licence ou Master d\'Excellence : conditions d\'accès, durée, débouchés et niveau requis. Le comparatif complet pour choisir avant la rentrée 2026.','true','10'],
['revision-ete-comptabilite-economie-management','revision-ete-comptabilite-economie-management','Révision d\'été : compta, éco, management','Par où commencer sans tout lire.','concours','<p>Beaucoup de candidats ouvrent trois manuels le même jour… et abandonnent au bout d\'une semaine. La révision d\'été efficace commence par une <strong>priorisation</strong>, pas par le volume. Cet article complète notre guide <a href="/blog/licence-master-excellence-meknes.html">Réussir l\'oral : la méthode en 5 étapes</a> : ici, on parle du fond (compta, éco, management) ; là-bas, de la forme orale.</p>\n\n        <h2>1. Posez le diagnostic avant le planning</h2>\n        <p>Sur une feuille, notez pour chaque matière : niveau actuel (faible / moyen / solide) et poids probable au concours. Commencez par votre point faible le plus coûteux. Pour beaucoup, c\'est la <strong>comptabilité</strong> ; pour d\'autres, l\'économie « à expliquer à voix haute ».</p>\n        <p>Fixez ensuite un rythme réaliste, avec une journée plus légère. La régularité bat les sessions marathon du week-end.</p>\n\n        <h2>2. Comptabilité : sécuriser les bases avant les subtilités</h2>\n        <p>Objectif été : être capable de lire un bilan / compte de résultat et de traiter des exercices types sans panique.</p>\n        <ul>\n          <li>Semaine A–B : écritures de base, vocabulaire (actif, passif, charges, produits).</li>\n          <li>Semaine C–D : exercices courts quotidiens (30–45 min), correction immédiate.</li>\n          <li>Ensuite seulement : analyse financière simple (ratios, soldes utiles).</li>\n        </ul>\n        <p>Évitez la lecture linéaire du manuel. Alternez 15 minutes de rappel théorique et 30 minutes d\'exercice. C\'est ce que nous renforçons aussi dans la <a href="/form.html">semaine gratuite</a> (thème comptabilité / analyse financière).</p>\n\n        <h2>3. Économie : des fiches qui parlent à l\'oral</h2>\n        <p>L\'économie aux concours d\'excellence se joue souvent sur la <strong>clarté</strong>. Pour chaque notion clé, une fiche en trois lignes : définition, mécanisme, exemple (marocain ou international).</p>\n        <p>Deux fois par semaine, expliquez une fiche à voix haute en 2 minutes chrono. Si vous bloquez, la fiche est trop longue ou trop floue — simplifiez. Reliez toujours à votre présentation de parcours (voir la <a href="/blog/licence-master-excellence-meknes.html">méthode orale en 5 étapes</a>).</p>\n\n        <h2>4. Management : raisonner avec des cas, pas réciter</h2>\n        <p>Préparez un mini-kit : vocabulaire (organisation, décision, leadership, motivation) + 2–3 situations concrètes (stage, association, projet d\'études). À l\'oral, un exemple vaut dix slogans.</p>\n        <p>Exercice utile : prenez un cas court (« une équipe en retard sur un livrable ») et structurez en 90 secondes : diagnostic → options → décision. Chronométrez.</p>\n\n        <h2>5. Un planning type avant le concours</h2>\n        <ol>\n          <li><strong>Lundi / mercredi / vendredi</strong> — matière faible (souvent compta) : 60–90 min.</li>\n          <li><strong>Mardi / jeudi</strong> — économie ou management en alternance : 45–60 min + 10 min d\'oral.</li>\n          <li><strong>Samedi</strong> — mix exercices + 1 oral blanc court.</li>\n          <li><strong>Dimanche</strong> — reprise légère ou repos actif (anglais 15 min).</li>\n        </ol>\n        <p>Si vous travaillez à côté, divisez les blocs (45 min le soir). Le format à distance de la préparation NC Consulting (21h–22h) est pensé pour ce rythme.</p>\n\n        <h2>6. Erreurs fréquentes à éviter cet été</h2>\n        <ul>\n          <li>Changer de méthode chaque semaine.</li>\n          <li>Négliger l\'oral jusqu\'à la dernière quinzaine.</li>\n          <li>Accumuler des PDF sans jamais s\'entraîner.</li>\n          <li>Reporter l\'anglais « pour plus tard ».</li>\n        </ul>\n        <p>Un plan médiocre tenu bat un plan parfait abandonné. Tenez 14 jours d\'affilée : c\'est là que la confiance revient.</p>\n\n        <h2>Passer à l\'action avec NC Consulting</h2>\n        <p>Pour accélérer méthodes et exercices sur les thèmes clés, inscrivez-vous à la <strong>semaine gratuite</strong> Licences d\'Excellence — début des cours <strong>jeudi 23 juillet 2026</strong>, à distance, 21h–22h. Complétez ensuite avec votre planning d\'été personnel.</p>\n        <!-- expanded:revision-ete-comptabilite-economie-management -->\n\n        <div class="nc-blog-callout">\n          <div class="nc-blog-callout-ico" aria-hidden="true">∑</div>\n          <div>\n            <strong>Priorité révision d\'été</strong>\n            La <em>méthode de révision comptabilité</em> + fiches économie + cas management battent la lecture linéaire des manuels.\n          </div>\n        </div>\n        <h2>Tableau de bord matières — concours d\'excellence Maroc</h2>\n        <p>Pour une <strong>préparation concours Licence d\'Excellence</strong> ou Master, notez chaque matière : niveau actuel, poids probable, créneaux/semaine. La <strong>révision été concours Maroc</strong> efficace commence par le point faible le plus coûteux (souvent la comptabilité générale et l\'analyse financière).</p>\n        <h3>Comptabilité &amp; analyse financière</h3>\n        <p>Objectifs concrets : lire un bilan et un compte de résultat, traiter des écritures de base, calculer des ratios simples. Les <strong>exercices types concours</strong> valent mieux que 50 pages de théorie non appliquée.</p>\n        <h3>Économie</h3>\n        <p>Fiches « définition + mécanisme + exemple ». Entraînez-vous à expliquer l\'inflation, le chômage ou la politique monétaire en 2 minutes — format idéal pour l\'oral.</p>\n        <h3>Management</h3>\n        <p>Vocabulaire (organisation, décision, leadership, motivation) + 2–3 cas tirés de votre parcours. Le jury valorise le raisonnement appliqué.</p>\n        <blockquote class="nc-blog-pull">Deux à trois heures ciblées valent mieux que six heures dispersées.</blockquote>\n        <p>Reliez chaque semaine une notion à la <a href="/blog/licence-master-excellence-meknes.html">méthode orale en 5 étapes</a>. Intégrez l\'<a href="/blog/anglais-concours-progresser-6-semaines.html">anglais concours</a> dès le début (15–20 min/jour).</p>','assets/blog/revision-ete.png','2026-07-23','90','false','Par où commencer sa révision d\'été pour les concours Licence / Master d\'Excellence : comptabilité, économie, management — plan simple, priorités et erreurs à éviter.','true','11'],
['simulation-oral-questions-concours-excellence','simulation-oral-questions-concours-excellence','Simulation d\'oral : questions les plus posées','Structurer ses réponses sans réciter.','concours','<p>Se préparer aux bonnes questions ne signifie pas apprendre des réponses par cœur — c\'est même l\'inverse qui fonctionne : maîtriser une structure de réponse suffisamment solide pour s\'adapter à n\'importe quelle formulation. Voici les questions qui reviennent le plus souvent, et surtout comment les aborder pour de vrai.</p>\n        <h2>« Présentez-vous »</h2>\n        <p>C\'est la question la plus posée, et paradoxalement la moins bien préparée. Beaucoup de candidats récitent leur CV de façon chronologique, un contenu que le jury a pourtant déjà sous les yeux. Un format plus efficace tient en trois blocs courts et connectés : le parcours résumé en trente secondes, la motivation précise pour ce concours en trente secondes, puis la projection sur ce qui suit en trente secondes. Trois blocs courts, articulés logiquement, valent bien mieux qu\'un monologue de deux minutes sans fil conducteur clair.</p>\n        <h2>« Pourquoi ce parcours et pas un autre ? »</h2>\n        <p>Le jury ne cherche pas une réponse parfaite, mais une cohérence perceptible. Relier systématiquement son choix à un exemple concret — un stage, un projet personnel, une expérience marquante — fonctionne bien mieux qu\'une formule générale du type « ce domaine me passionne depuis toujours ». Une réponse construite autour de « pendant mon stage chez [entreprise], j\'ai découvert que… » convainc nettement plus qu\'une déclaration abstraite, parce qu\'elle donne au jury quelque chose de concret à se représenter.</p>\n        <p>Vient ensuite, presque systématiquement, la question du principal défaut. Le piège classique est de déguiser une qualité en défaut — « je suis trop perfectionniste », « je travaille trop » — une formule immédiatement repérée par des jurys expérimentés qui l\'entendent des dizaines de fois par session. Un défaut réel, assumé, accompagné d\'un exemple concret de la façon dont on travaille à le corriger, est bien plus convaincant et surtout plus humain.</p>\n        <h2>Les questions techniques : profondeur plutôt que quantité</h2>\n        <p>En comptabilité, économie ou management, le jury teste rarement la mémorisation pure d\'une définition. Il évalue la capacité à expliquer clairement une notion et à l\'illustrer avec un exemple concret. Mieux vaut donc maîtriser en profondeur cinq à sept notions clés de sa filière, suffisamment solides pour résister à des questions de relance, que de survoler trente notions de façon superficielle et se retrouver démuni dès la première question un peu poussée.</p>\n        <p>La question de la projection à cinq ans revient également presque toujours, avec deux pièges symétriques à éviter : une réponse trop vague qui laisse une impression de flou, et une réponse trop rigide qui manque de recul réaliste. L\'équilibre se trouve dans une direction claire et argumentée, avec une ouverture assumée sur les ajustements possibles selon les opportunités qui se présenteront.</p>\n        <h2>Face à l\'imprévu, une structure simple en trois temps</h2>\n        <p>Face à une question inattendue, une méthode simple aide à ne pas paniquer : reformuler brièvement la question à voix haute, ce qui gagne quelques secondes de réflexion sans paraître hésitant, donner une réponse directe et concise, puis l\'illustrer avec un exemple ou une nuance. Cette structure fonctionne pour la quasi-totalité des questions imprévues, et elle s\'apprend — c\'est justement l\'objet des simulations.</p>\n        <p>Trois à cinq simulations complètes suffisent généralement, à condition qu\'elles soient suivies d\'un vrai retour critique. Seul, il est très difficile de s\'auto-évaluer objectivement sur des points comme le débit de parole, les tics de langage, ou la clarté perçue par un tiers — c\'est précisément la valeur ajoutée d\'un accompagnement extérieur à ce stade de la préparation, plus encore que la révision de contenu supplémentaire.</p>\n        <p>La meilleure préparation à l\'oral reste la simulation répétée avec un retour extérieur honnête. C\'est exactement ce que propose la <a href="/form.html">accompagnement de préparation NC Consulting</a>. Pour le cadre global, relisez d\'abord <a href="/blog/licence-master-excellence-meknes.html">Réussir l\'oral en 5 étapes</a> ; pour tenir la distance mentale, voir aussi <a href="/blog/stress-charge-mentale-revision-ete.html">gérer le stress sur l\'été</a>.</p>','assets/blog/simulation-oral.png','2026-07-23','2','false','Les questions les plus fréquentes à l&#x27;oral des concours d&#x27;excellence au Maroc, et comment structurer vos réponses sans réciter.','true','12'],
['stress-charge-mentale-revision-ete','stress-charge-mentale-revision-ete','Stress & charge mentale sur tout un été','Rythme soutenable et gestion le jour de l\'oral.','concours','<p>Un été entier de révisions ressemble davantage à un marathon qu\'à un sprint. Pourtant, la plupart des candidats le préparent comme un sprint : intensité maximale les trois dernières semaines, presque rien avant. C\'est souvent ce déséquilibre, plus que le manque de niveau réel, qui explique l\'épuisement en fin de parcours et les contre-performances le jour de l\'oral.</p>\n        <h2>Repérer l\'épuisement avant qu\'il ne s\'installe</h2>\n        <p>Certains signaux reviennent systématiquement chez les candidats en surcharge : une difficulté à se concentrer plus de quinze minutes d\'affilée, une irritabilité inhabituelle envers l\'entourage, un sommeil perturbé, et cette sensation frustrante de tourner en rond sur une notion pourtant maîtrisée quelques semaines plus tôt. Ce ne sont pas des preuves de manque de sérieux — ce sont des signaux physiologiques qu\'il vaut mieux prendre au sérieux tôt plutôt que de les ignorer jusqu\'à ce qu\'ils deviennent handicapants.</p>\n        <h2>Pourquoi la régularité l\'emporte sur l\'intensité</h2>\n        <p>Le cerveau retient mieux par répétition espacée dans le temps que par accumulation massive de dernière minute — c\'est un mécanisme cognitif bien documenté, pas une question de discipline personnelle. Réviser une notion trois fois à une semaine d\'intervalle l\'ancre mieux en mémoire que la réviser neuf fois d\'affilée en une seule session. Un été réussi n\'est donc pas celui où l\'on a révisé sans limite en dernière ligne droite, mais celui où l\'on a tenu un rythme soutenable et ciblé, presque tous les jours, sur l\'ensemble de la période.</p>\n        <p>Ce rythme suppose aussi de vraies pauses, pas de simples pauses écran. Changer de fenêtre entre deux notions n\'en est pas une : c\'est une continuité de sollicitation cognitive sous une autre forme. Une vraie pause implique de sortir, de bouger, de faire quelque chose qui n\'a rien à voir avec le concours. Prévoir une journée plus légère par semaine, planifiée à l\'avance plutôt qu\'improvisée en cas de coup de fatigue, permet d\'éviter l\'épuisement cumulatif qui s\'installe généralement entre la quatrième et la sixième semaine — le moment où beaucoup de candidats commencent à décrocher sans s\'en rendre compte.</p>\n        <h2>À quoi ressemble une semaine équilibrée</h2>\n        <p>À titre indicatif, une semaine soutenable sur un été complet pourrait ressembler à plusieurs jours de révision ciblée, une journée consacrée à la simulation ou à l\'entraînement oral, et une journée de repos réel, sans aucune sollicitation liée au concours. Ce rythme, tenu sur la durée, produit généralement de meilleurs résultats qu\'une révision intensive de dernière minute suivie d\'un épuisement complet juste avant l\'oral — précisément le moment où l\'énergie devrait être la plus disponible.</p>\n        <h2>Le jour J, gérer le stress à froid</h2>\n        <p>Le stress ne se supprime pas, il se gère. Arriver vingt à trente minutes en avance évite d\'ajouter un stress de timing à celui, déjà présent, du contenu. Quelques respirations lentes et profondes juste avant d\'entrer suffisent à faire mécaniquement baisser le rythme cardiaque. Et il vaut mieux accepter à l\'avance qu\'un trou de mémoire ponctuel n\'a rien d\'éliminatoire s\'il est géré calmement — en reformulant, en prenant un instant, en reprenant le fil — plutôt que vécu dans la panique.</p>\n        <p>Un regard extérieur aide justement à faire cette distinction entre un stress normal, celui qui pousse à mieux se préparer, et un stress qui commence à nuire concrètement à la performance et à la santé. C\'est un rôle souvent sous-estimé du coaching de préparation : structurer le rythme de révision, rassurer sur les points de doute, et ajuster la charge dès les premiers signes d\'épuisement plutôt qu\'une fois le mal fait — par exemple en compensant un mois de faible avancement par une intensification extrême de dernière minute, ou en sacrifiant systématiquement le sommeil pour gagner du temps, ce qui dégrade en réalité la mémorisation plutôt que de l\'améliorer.</p>\n        <p>Si vous sentez que la charge devient difficile à gérer seul, un accompagnement structuré peut faire une vraie différence — pas seulement sur le contenu à réviser, mais sur la façon de tenir la distance sur toute la période. Ancrez votre méthode orale avec le guide <a href="/blog/licence-master-excellence-meknes.html">Réussir l\'oral en 5 étapes</a>, et entraînez-vous concrètement via la <a href="/blog/simulation-oral-questions-concours-excellence.html">simulation d\'oral</a>.</p>','assets/blog/stress-mental.png','2026-07-23','8','false','Réviser un concours d&#x27;excellence tout un été sans s&#x27;épuiser : signes d&#x27;alerte, rythme soutenable et gestion concrète du stress le jour de l&#x27;oral.','true','13'],
['coaching-executif-maroc','coaching-executif-maroc','Coaching exécutif : bien choisir','Pour qui, critères concrets, Meknès & distance.','coaching','<p>Le marché du coaching au Maroc s\'est densifié. Entre offres « développement personnel », mentorat informel et programmes structurés pour dirigeants, l\'offre est large — et la confusion aussi. Le <strong>coaching exécutif</strong> n\'est pas une conversation motivationnelle : c\'est un travail de travail, confidentiel, orienté décisions et performance durable.</p>\n        <p>Chez NC Consulting, à Meknès comme à distance, nous voyons la même question revenir : <em>est-ce adapté à mon niveau de responsabilité, et comment choisir la bonne personne ?</em> Cet article y répond sans promesse miracle.</p>\n\n        <h2>À qui s\'adresse le coaching exécutif ?</h2>\n        <p>Le coaching exécutif s\'adresse surtout aux personnes qui portent déjà une charge de décision : dirigeants, cadres dirigeants, entrepreneurs, responsables d\'équipe ou de projet structurant. Le point commun n\'est pas le titre sur la carte de visite — c\'est la pression des arbitrages.</p>\n        <p>Quelques situations typiques :</p>\n        <ul>\n          <li>Vous devez trancher plus vite, avec moins d\'informations parfaites, et le coût de l\'erreur a augmenté.</li>\n          <li>Vous avez été promu(e) et le rôle exige une autre posture (délégation, communication, présence).</li>\n          <li>Vous gérez une croissance, une restructuration ou une tension d\'équipe qui dépasse le « bon sens » habituel.</li>\n          <li>Vous êtes seul(e) au sommet : peu d\'interlocuteurs avec qui parler franchement, sans filtre politique.</li>\n        </ul>\n        <p>À l\'inverse, si vous cherchez uniquement des conseils techniques très spécialisés (fiscalité, juridique, SI), un expert métier ou un cabinet de conseil ponctuel sera souvent plus adapté. Le coach exécutif n\'est pas là pour remplacer votre expert-comptable : il vous aide à <strong>clarifier, prioriser et tenir le cap</strong>.</p>\n\n        <h2>Ce que le coaching exécutif n\'est pas</h2>\n        <p>Pour éviter les malentendus — et le sentiment de « charlatanisme » parfois associé au coaching — clarifions les frontières :</p>\n        <ul>\n          <li><strong>Ce n\'est pas de la thérapie.</strong> On travaille sur le rôle, les décisions et la performance, pas sur un traitement clinique.</li>\n          <li><strong>Ce n\'est pas du mentorat.</strong> Un mentor partage son expérience (« moi, j\'ai fait comme ça »). Un coach vous aide à construire <em>votre</em> réponse, avec méthode et accountability.</li>\n          <li><strong>Ce n\'est pas une formation générique.</strong> Une formation transmet un contenu. Le coaching part de votre situation réelle et s\'ajuste séance après séance.</li>\n        </ul>\n        <p>Quand ces frontières sont floues chez un prestataire, méfiez-vous : le flou sert rarement le client.</p>\n\n        <h2>Comment bien choisir un coach exécutif au Maroc</h2>\n        <p>Voici une grille pragmatique, utilisable dès le premier échange — y compris pour un <strong>coach dirigeant à Meknès</strong> ou un accompagnement 100 % à distance.</p>\n\n        <h3>1. Une méthode lisible, pas seulement une « écoute bienveillante »</h3>\n        <p>Demandez comment se déroule un engagement type : durée, fréquence, objectifs de départ, bilans. Un coach sérieux explique son cadre sans se cacher derrière des slogans. Chez NC Consulting, le parcours est volontairement clair : premier échange, diagnostic, puis accompagnement avec jalons mesurables — comme sur notre page <a href="/methode.html">Comment ça marche</a>.</p>\n\n        <h3>2. Une expérience du monde des décideurs</h3>\n        <p>Le coaching leadership en entreprise demande de comprendre la pression réelle : comités, conflits d\'intérêts, délais, politique interne. Posez des questions sur le type de profils déjà accompagnés (dirigeants PME, cadres, entrepreneurs) et sur la nature des sujets traités (prise de décision, posture, performance d\'équipe).</p>\n\n        <h3>3. Confidentialité absolue — et prouvée par le cadre</h3>\n        <p>Sans confidentialité, il n\'y a pas de coaching exécutif digne de ce nom. Vérifiez ce qui est dit sur le secret professionnel, le lieu des séances (présentiel ou visio sécurisée), et la règle simple : rien ne remonte à un tiers sans votre accord. C\'est non négociable.</p>\n\n        <h3>4. Des résultats formulables, pas des « vibes »</h3>\n        <p>Vous n\'avez pas besoin d\'un tableau Excel de KPI dès la minute une. Vous avez besoin d\'objectifs formulés en langage clair : « décider X d\'ici telle date », « installer une revue d\'équipe hebdomadaire », « préparer cet oral / ce comité ». Un bon coach reformule avec vous des jalons observables.</p>\n\n        <h3>5. Présentiel ou à distance : ce qui change vraiment</h3>\n        <p>À distance, l\'exigence doit être la même : préparation, structure, suivi entre les séances. Le format change le canal, pas le niveau d\'engagement. Beaucoup de cadres au Maroc combinent les deux — un premier échange en visio, puis des séances à Meknès ou l\'inverse. L\'important est la régularité, pas la salle de réunion.</p>\n\n        <h2>Cinq questions à poser avant de vous engager</h2>\n        <ol>\n          <li>Comment définissez-vous le succès d\'un coaching avec un dirigeant ?</li>\n          <li>Quelle est votre méthode de travail entre deux séances ?</li>\n          <li>Quels sujets refusez-vous (et pourquoi) ?</li>\n          <li>Comment gérez-vous la confidentialité si l\'entreprise finance le coaching ?</li>\n          <li>À quoi ressemble concrètement la première séance après le diagnostic ?</li>\n        </ol>\n        <p>Les réponses vagues sont un signal. Les réponses précises — même si elles ne correspondent pas à ce que vous attendiez — sont un meilleur départ.</p>\n\n        <h2>Quand démarrer (et quand attendre)</h2>\n        <p>Le bon moment n\'est pas « quand tout ira mieux ». C\'est souvent quand la charge de décision augmente, ou quand vous sentez que répéter les mêmes patterns ne suffit plus. En revanche, si vous êtes en crise aiguë sans filet (juridique, santé), sécurisez d\'abord les urgences avec les bons professionnels, puis revenez au coaching pour reconstruire la trajectoire.</p>\n\n        <h2>En résumé</h2>\n        <p>Le coaching exécutif au Maroc s\'adresse à ceux qui portent des décisions lourdes et veulent un regard extérieur exigeant — pas un discours générique. Choisissez un coach qui montre une méthode, respecte une confidentialité stricte, et accepte de parler résultats en termes concrets. Présentiel à Meknès ou à distance : l\'essentiel est le cadre et la tenue dans la durée.</p>\n        <p>Si vous voulez tester le fit avant tout engagement, un premier échange de 20 minutes suffit souvent à clarifier si ce type d\'accompagnement — et cette relation de travail — est le bon levier pour vous.</p>\n        <!-- expanded:coaching-executif-maroc -->\n\n        <div class="nc-blog-callout">\n          <div class="nc-blog-callout-ico" aria-hidden="true">◆</div>\n          <div>\n            <strong>Coaching exécutif Maroc</strong>\n            Pour dirigeants, cadres et entrepreneurs qui veulent un regard exigeant — méthode, confidentialité, résultats mesurables.\n          </div>\n        </div>\n        <h2>Coach dirigeant à Meknès ou à distance</h2>\n        <p>Le <strong>coaching leadership entreprise Maroc</strong> n\'est ni une thérapie ni une formation catalogue. C\'est un espace de décision : priorités, posture, arbitrages. Choisissez un coach avec cadre clair (objectifs, rythme, indicateurs), expérience du monde pro, et confidentialité stricte.</p>\n        <p>À Meknès comme en <strong>coaching cadre à distance</strong>, la qualité du suivi compte plus que le lieu. Demandez un premier échange pour tester le fit.</p>','','2026-07-22','9','false','Coaching exécutif au Maroc : pour qui, à quoi ça sert, et comment choisir un coach dirigeant sérieux à Meknès ou à distance. Critères concrets, sans jargon.','true','14'],
['licence-master-excellence-meknes','licence-master-excellence-meknes','Réussir l\'oral : la méthode en 5 étapes','Le fil rouge de présentation, les oraux blancs, la veille du jour J — le pilier du blog concours.','concours','<p>Les concours d\'accès aux <strong>Licences d\'Excellence</strong> et <strong>Masters d\'Excellence</strong> au Maroc — notamment à la <strong>FSJES Meknès</strong> (Université Moulay Ismaïl) — ne se gagnent pas seulement sur le volume de révision. L\'oral mesure votre clarté, votre maîtrise des bases et votre capacité à tenir sous pression — surtout à Meknès et dans les filières économie / gestion / finance.</p>\n        <p>Cette méthode en cinq étapes est conçue pour des candidats Bac+2 / Licence qui veulent un plan actionnable, pas une liste de conseils flous. Elle s\'aligne sur ce que nous travaillons dans la <a href="/form.html">accompagnement de préparation</a> : comptabilité, analyse financière, économie, management et anglais.</p>\n\n        <h2>Étape 1 — Clarifier le format de <em>votre</em> concours</h2>\n        <p>Avant de « tout réviser », notez précisément : écrit + oral ou oral seul ? Durée de l\'oral ? Coefficient ? Packs de spécialité (Finance, Management, Marketing…) ? Sans ce cadre, vous gaspillez du temps sur des chapitres hors cible.</p>\n        <p>Faites une fiche d\'une page : matières attendues, types de questions (motivation, culture économique, exercice court), et date du passage. C\'est votre tableau de bord.</p>\n\n        <h2>Étape 2 — Consolider les bases (pas tout le manuel)</h2>\n        <p>Sur les matières fréquentes — <strong>comptabilité</strong>, <strong>analyse financière</strong>, <strong>économie</strong>, <strong>management</strong>, <strong>anglais</strong> — visez la maîtrise des notions pivots et des exercices types, pas la lecture linéaire de 400 pages.</p>\n        <ul>\n          <li>Comptabilité : écritures de base, bilan / compte de résultat, lecture simple d\'indicateurs.</li>\n          <li>Économie : macro/micro essentielles, vocabulaire clair, un exemple marocain ou international prêt.</li>\n          <li>Management : organisation, décisions, leadership — avec un cas court préparé.</li>\n          <li>Anglais : se présenter, motiver son choix de filière, répondre à 8–10 questions courantes.</li>\n        </ul>\n        <p>Un plan intensif d\'une semaine bien tenu bat souvent trois semaines de révision dispersée.</p>\n\n        <h2>Étape 3 — Construire votre « fil rouge » de présentation</h2>\n        <p>Le jury veut comprendre qui vous êtes en 60–90 secondes : parcours, objectif (Licence / Master d\'Excellence), cohérence du projet. Préparez une structure fixe :</p>\n        <ol>\n          <li>Qui je suis (formation / expérience courte)</li>\n          <li>Pourquoi cette filière d\'excellence</li>\n          <li>Ce que j\'apporte (rigueur, curiosité, projet)</li>\n          <li>Ce que je vise après (orientation claire, même provisoire)</li>\n        </ol>\n        <p>Entraînez-vous à voix haute jusqu\'à ce que ce fil tienne sans notes. Le stress baisse quand la structure est automatisée.</p>\n\n        <h2>Étape 4 — Enchaîner des oraux blancs chronométrés</h2>\n        <p>Deux à quatre simulations suffisent souvent pour changer le niveau : chrono, questions pièges, feedback sur la voix et la posture. Enregistrez-vous au téléphone si vous n\'avez pas d\'interlocuteur.</p>\n        <p>Travaillez surtout : démarrer sans bégayer, reformuler une question mal comprise, conclure sans « voilà… ». Ce sont les moments où les candidats perdent des points sans s\'en rendre compte.</p>\n\n        <h2>Étape 5 — Gérer la veille et le jour J</h2>\n        <p>La veille : révision légère des fiches, sommeil, pas de nouveau chapitre. Le jour J : arrivez en avance, respirez, ouvrez par votre fil rouge. Si une question bloque, dites ce que vous savez avec méthode plutôt que d\'improviser un discours vide.</p>\n        <p>Le stress n\'est pas l\'ennemi : l\'absence de méthode l\'est. Plus vous avez répété le cadre, plus le stress devient de l\'énergie utile.</p>\n\n        <h2>Semaine gratuite NC Consulting — inscription ouverte</h2>\n        <p>Pour accélérer cette préparation, NC Consulting propose une <strong>semaine gratuite</strong> de préparation aux Licences d\'Excellence : à distance, 21h–22h, thèmes comptabilité / finance / économie / management / anglais. <strong>Début des cours : jeudi 23 juillet 2026</strong> — places limitées.</p>\n        <p>Inscrivez-vous via le formulaire du site pour recevoir le lien de connexion, ou consultez le détail du programme sur l\'annonce officielle.</p>\n        <!-- expanded:licence-master-excellence-meknes -->\n\n        <div class="nc-blog-callout">\n          <div class="nc-blog-callout-ico" aria-hidden="true">★</div>\n          <div>\n            <strong>Mot-clé à retenir</strong>\n            La <em>préparation orale Licence / Master d\'Excellence à Meknès</em> se gagne sur la structure, pas sur le volume de pages lues.\n          </div>\n        </div>\n        <h2>Mots du jury à la FSJES Meknès : ce que cherchent les commissions d\'excellence</h2>\n        <p>Que vous prépariez un <strong>concours Licence d\'Excellence</strong> ou un <strong>Master d\'Excellence</strong> à la <strong>FSJES Meknès</strong>, le jury écoute trois signaux : clarté du projet, maîtrise des bases (comptabilité, économie, management, anglais), et tenue sous pression. Un candidat qui « sait tout » mais bégaye sans fil rouge perd face à un candidat structuré.</p>\n        <p>Travaillez le vocabulaire de votre filière (finance, gestion, marketing…) pour l\'<strong>oral du concours d\'excellence</strong> : définitions courtes + un exemple marocain ou international. C\'est ce qui transforme une révision scolaire en performance d\'admission.</p>\n        <blockquote class="nc-blog-pull">Un plan intensif d\'une semaine bien tenu bat souvent trois semaines de révision dispersée.</blockquote>\n        <h2>Checklist J-14 avant l\'oral</h2>\n        <ul>\n          <li>Fiche d\'une page : format du concours, matières, date.</li>\n          <li>Pitch 60–90 secondes chronométré (3 passages minimum).</li>\n          <li>8–10 questions types + 1 mini-cas économie / management.</li>\n          <li>Anglais : se présenter + motiver le choix de filière.</li>\n          <li>Sommeil et révision légère la veille — pas de nouveau chapitre.</li>\n        </ul>\n        <p>Pour le fond disciplinaire, enchaînez avec le guide <a href="/blog/revision-ete-comptabilite-economie-management.html">révision d\'été comptabilité économie management</a>. Pour s\'entraîner aux questions, voir la <a href="/blog/simulation-oral-questions-concours-excellence.html">simulation d\'oral concours d\'excellence</a>. Pages établissements : <a href="/blog/fsjes-meknes-licence-master-excellence.html">FSJES Meknès</a> · <a href="/blog/est-meknes-bachelor-ingenierie-finance.html">Bachelor EST Meknès</a>.</p>','assets/blog/oral-5-etapes.png','2026-07-22','9','true','Méthode en 5 étapes pour réussir l\'oral du concours Licence et Master d\'Excellence à Meknès : format, bases, fil rouge, oraux blancs, jour J.','true','15']
];

var CMS_FORMATIONS_ROWS = [
['f1','Licence','Heures extra — Licence','Renforcez votre préparation avant le concours Licence d\'Excellence ou Licence Pro.','Oral & posture sous pression\nCompta · économie · management\nAnglais concours\nPlan de révision réaliste\nSuivi jusqu\'aux résultats','/form.html?intent=concours&programme=licence','true','1','Rejoindre — Licence →'],
['f2','Master','Heures extra — Master','Ajoutez des heures ciblées pour réussir l\'accès Master (dossier, oral, projet pro).','Projet professionnel & oral\nFinance · audit · management\nAnglais & argumentaire\nMéthode dossier / entretien\nSuivi jusqu\'à l\'admission','/form.html?intent=concours&programme=master','true','2','Rejoindre — Master →'],
['f3','Temps aménagé','Heures extra — en travaillant','Vous reprisez Licence / Master en parallèle du boulot ? On calibre des heures compatibles.','Planning compatible emploi\nSessions courtes & régulières\nLicence ou Master aménagé\nMeknès ou visio\nPremier échange 20 min','/form.html?intent=concours','true','3','Rejoindre — Formulaire →']
];

var CMS_NOUVEAU_ROWS = [
['nv-heures-master','master','Heures extra — Master','Ajoutez des heures 1-à-1 pour préparer votre accès Master : oral, projet pro, finance / management.','Places ouvertes','NC Consulting','Sur rendez-vous','Meknès & visio','Format :: Coaching 1-à-1\nObjectif :: Accès Master\nLieu :: Meknès ou à distance\nEntrée :: Formulaire NC','Vous visez un Master ? Rejoignez NC Consulting pour des heures extra ciblées — dossier, oral et argumentaire — puis inscrivez-vous via le formulaire.','On calibre le volume d’heures selon votre calendrier et votre filière, puis on enchaîne sur un plan concret jusqu’à l’admission.','','','true','1','/form.html?intent=concours&programme=master'],
['nv-heures-licence','lex','Heures extra — Licence d’Excellence','Renforcez oral, bases et méthode avant le concours Licence — sessions dédiées avec NC Consulting.','Places ouvertes','NC Consulting','Sur rendez-vous','Meknès & visio','Format :: Coaching 1-à-1\nObjectif :: Concours Licence\nLieu :: Meknès ou à distance\nEntrée :: Formulaire NC','Vous préparez une Licence d’Excellence ou Licence Pro ? Rejoignez les heures extra NC : oral, compta, éco, management, anglais — puis le formulaire pour réserver votre créneau.','Même exigence qu’à l’oral du concours : clarté, bases solides, tenue sous pression — avec un suivi jusqu’aux résultats.','','','true','2','/form.html?intent=concours&programme=licence'],
['nv-heures-amenage','lpro','Heures extra — temps aménagé','Vous travaillez et visez Licence / Master aménagé ? On calibre des heures compatibles avec votre emploi.','Sur rendez-vous','NC Consulting','Flexible','Meknès & visio','Format :: Sessions courtes\nPublic :: Salariés / reprise\nLieu :: Meknès ou à distance\nEntrée :: Formulaire NC','Planning réaliste, sessions courtes et régulières, suivi jusqu’au concours — sans quitter votre activité.','Un premier échange de 20 min suffit pour voir si le volume d’heures est tenable avec votre emploi du temps.','','','true','3','/form.html?intent=concours']
];

var CMS_ANNOUNCEMENT_ROWS = [
['semaine-gratuite','Semaine gratuite — Licences d\'Excellence','Cette session (juillet 2026) est terminée. Réservez un premier échange pour un accompagnement personnalisé.','Terminée','23','Juil','assets/annonce-semaine-gratuite.png','La semaine gratuite de préparation (début 23 juillet 2026) est terminée. Pour un accompagnement concours, coaching ou conseil, réservez un premier échange de 20 minutes — Meknès ou à distance, sans engagement.','Statut :: Session terminée\nAlternative :: Premier échange 20 min\nLieu :: Meknès ou à distance\nEngagement :: Aucun','Réserver un échange →','/form.html','false','99'],
['nouveaux-creneaux','Premier échange de 20 min — Meknès ou à distance','Confidentiel, sans engagement. On clarifie votre besoin et la meilleure façon d\'avancer.','Sur rendez-vous','—','Échange','','Réservez un premier échange confidentiel avec NC Consulting. On clarifie votre besoin (coaching, conseil ou préparation concours) et on définit la meilleure façon d\'avancer — sans engagement.','Durée :: 20 minutes\nLieu :: Meknès ou à distance\nEngagement :: Aucun\nRéponse :: Sous 24h','Demander un échange →','/form.html','true','1']
];
// @generated-cms-seeds-end

function alignNcConsultingCmsWithSite2026() {
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    'Aligner le CMS NC Consulting',
    'Version: ' + CMS_ALIGN_VERSION + '\n\n' +
      'Cette action va:\n' +
      '• Mettre à jour concours / promo / proof dans cms_content\n' +
      '• Remplacer cms_formations et cms_nouveau\n' +
      '• Mettre à jour cms_announcements (CTA form.html)\n' +
      '• Remplacer /#formulaire → /form.html partout\n\n' +
      'cms_blog et les onglets leads ne sont PAS écrasés.\n\nContinuer ?',
    ui.ButtonSet.OK_CANCEL
  );
  if (confirm !== ui.Button.OK) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var report = [];
  report.push(cmsPatchContent_(ss));
  report.push(cmsWriteFormationsTab_(ss));
  report.push(cmsWriteNouveauTab_(ss));
  report.push(cmsWriteAnnouncementsTab_(ss));
  report.push(cmsReplaceFormulaireUrls_(ss));

  ui.alert(
    'CMS aligné',
    report.join('\n\n') + '\n\nRechargez ncconsulting.ma (Ctrl+F5).',
    ui.ButtonSet.OK
  );
}

function cmsPatchContent_(ss) {
  var sh = cmsEnsureSheetWithHeaders_(ss, 'cms_content', ['key', 'value']);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) {
    cmsWriteTable_(sh, ['key', 'value'], cmsObjectToRows_(CMS_CONTENT_PATCH));
    return 'cms_content: créé avec ' + Object.keys(CMS_CONTENT_PATCH).length + ' clés.';
  }

  var data = sh.getRange(2, 1, lastRow, 2).getValues();
  var keyCol = {};
  for (var i = 0; i < data.length; i++) {
    keyCol[String(data[i][0] || '').trim()] = i + 2;
  }

  var updated = 0;
  var keys = Object.keys(CMS_CONTENT_PATCH);
  for (var k = 0; k < keys.length; k++) {
    var key = keys[k];
    var val = CMS_CONTENT_PATCH[key];
    if (keyCol[key]) {
      sh.getRange(keyCol[key], 2).setValue(val);
      updated++;
    } else {
      var newRow = sh.getLastRow() + 1;
      sh.getRange(newRow, 1, newRow, 2).setValues([[key, val]]);
      updated++;
    }
  }
  return 'cms_content: ' + updated + ' clé(s) mises à jour.';
}

function cmsWriteFormationsTab_(ss) {
  var sh = cmsEnsureSheetWithHeaders_(ss, 'cms_formations', CMS_FORMATIONS_HEADERS);
  cmsWriteTable_(sh, CMS_FORMATIONS_HEADERS, CMS_FORMATIONS_ROWS);
  return 'cms_formations: ' + CMS_FORMATIONS_ROWS.length + ' cartes.';
}

function cmsWriteNouveauTab_(ss) {
  var sh = cmsEnsureSheetWithHeaders_(ss, 'cms_nouveau', CMS_NOUVEAU_HEADERS);
  cmsWriteTable_(sh, CMS_NOUVEAU_HEADERS, CMS_NOUVEAU_ROWS);
  return 'cms_nouveau: ' + CMS_NOUVEAU_ROWS.length + ' entrées.';
}

function cmsWriteAnnouncementsTab_(ss) {
  var sh = cmsEnsureSheetWithHeaders_(ss, 'cms_announcements', CMS_ANNOUNCE_HEADERS);
  cmsWriteTable_(sh, CMS_ANNOUNCE_HEADERS, CMS_ANNOUNCEMENT_ROWS);
  return 'cms_announcements: ' + CMS_ANNOUNCEMENT_ROWS.length + ' annonces.';
}

function cmsReplaceFormulaireUrls_(ss) {
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
          .replace(/\/#formulaire/g, '/form.html')
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
  return 'URLs: ' + cells + ' cellule(s) corrigées.';
}

function cmsEnsureSheetWithHeaders_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  return sh;
}

function cmsWriteTable_(sh, headers, rows) {
  var lastRow = sh.getLastRow();
  if (lastRow > 1) {
    sh.getRange(2, 1, lastRow, headers.length).clearContent();
  }
  if (!rows || !rows.length) return;
  sh.getRange(2, 1, rows.length + 1, headers.length).setValues(rows);
}

function cmsObjectToRows_(obj) {
  var keys = Object.keys(obj);
  var out = [];
  for (var i = 0; i < keys.length; i++) {
    out.push([keys[i], obj[keys[i]]]);
  }
  return out;
}

function cmsStyleCmsHeaderRow_(sh, colCount) {
  var hdr = sh.getRange(1, 1, 1, colCount);
  hdr
    .setFontWeight('bold')
    .setBackground(CMS_HEADER_BG)
    .setFontColor(CMS_HEADER_FG)
    .setWrap(true)
    .setVerticalAlignment('middle');
}

function cmsCountDataRows_(ss, tabNames) {
  var total = 0;
  for (var i = 0; i < tabNames.length; i++) {
    var sh = ss.getSheetByName(tabNames[i]);
    if (sh && sh.getLastRow() > 1) total += sh.getLastRow() - 1;
  }
  return total;
}

function cmsSetupListTab_(ss, name, headers, rows) {
  var sh = cmsEnsureSheetWithHeaders_(ss, name, headers);
  cmsStyleCmsHeaderRow_(sh, headers.length);
  if (sh.getLastRow() >= 2) {
    return name + ': ' + (sh.getLastRow() - 1) + ' ligne(s) existantes — conservées.';
  }
  if (!rows || !rows.length) {
    return name + ': vide (aucune donnée par défaut).';
  }
  cmsWriteTable_(sh, headers, rows);
  return name + ': ' + rows.length + ' ligne(s) par défaut insérées.';
}

function cmsSetupContentTab_(ss) {
  var sh = cmsEnsureSheetWithHeaders_(ss, 'cms_content', CMS_CONTENT_HEADERS);
  cmsStyleCmsHeaderRow_(sh, CMS_CONTENT_HEADERS.length);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) {
    cmsWriteTable_(sh, CMS_CONTENT_HEADERS, CMS_CONTENT_ROWS);
    return 'cms_content: ' + CMS_CONTENT_ROWS.length + ' clés par défaut créées.';
  }

  var data = sh.getRange(2, 1, lastRow, 2).getValues();
  var existing = {};
  for (var i = 0; i < data.length; i++) {
    existing[String(data[i][0] || '').trim()] = true;
  }

  var added = 0;
  for (var r = 0; r < CMS_CONTENT_ROWS.length; r++) {
    var key = String(CMS_CONTENT_ROWS[r][0] || '').trim();
    if (!key || existing[key]) continue;
    var newRow = sh.getLastRow() + 1;
    sh.getRange(newRow, 1, newRow, 2).setValues([CMS_CONTENT_ROWS[r]]);
    added++;
  }
  return (
    'cms_content: ' +
    (lastRow - 1) +
    ' clé(s) conservées' +
    (added ? ', ' + added + ' ajoutée(s).' : '.')
  );
}
