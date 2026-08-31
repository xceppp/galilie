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
