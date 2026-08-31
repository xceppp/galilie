/**
 * NC Consulting — Google Sheet LEADS (formulaire site ncconsulting.ma)
 * ===================================================================
 * 1) Ouvrez le Google Sheet lié à GOOGLE_SHEETS_ID sur Vercel.
 * 2) Partagez-le en Éditeur avec l’email du compte de service Google
 *    (GOOGLE_CLIENT_EMAIL dans Vercel).
 * 3) Extensions → Apps Script → collez CE fichier entier.
 * 4) Exécutez une fois : setupNcConsultingLeadSheets
 * 5) (Optionnel) removeUnnecessarySheets — supprime les onglets inutiles
 * 6) Exécutez une fois : setLeadNotifyEmail  (votre email de notification)
 * 7) Exécutez une fois : installLeadEmailTrigger
 * 8) Menu NC Consulting → Aligner CMS (form + heures extra)
 *    (ou exécutez alignNcConsultingCmsWithSite2026 dans l’éditeur)
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

// --- Menu + setup ---

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('NC Consulting')
    .addItem('Configurer onglets leads', 'setupNcConsultingLeadSheets')
    .addItem('Définir email notifications', 'setLeadNotifyEmail')
    .addItem('Activer email à chaque nouvelle ligne', 'installLeadEmailTrigger')
    .addSeparator()
    .addItem('Aligner CMS (form + heures extra)', 'alignNcConsultingCmsWithSite2026')
    .addItem('Supprimer les onglets inutiles…', 'removeUnnecessarySheets')
    .addToUi();
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

// --- CMS align (form.html + heures extra) — généré via scripts/generate-cms-align-gs.js ---

var CMS_ALIGN_VERSION = '2026-08-31-form-heures-extra';

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

/** @type {Array<Array<string>>} — régénérer avec node scripts/generate-cms-align-gs.js si cmsDefaults change */
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
