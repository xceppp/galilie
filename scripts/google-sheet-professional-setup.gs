/**
 * NC Consulting — mise en forme professionnelle du classeur leads
 * -----------------------------------------------------------------
 * 1) Ouvrez le Google Sheet utilisé par le backend.
 * 2) Extensions > Apps Script — collez tout ce fichier.
 * 3) Exécutez `setupProfessionalLeadsSheets`.
 * 4) Autorisez l'accès au classeur.
 *
 * Onglets : Conseil (profils consulting), Formation, General.
 */

var LEAD_TAB_NAMES = [
  'Conseil',
  'Formation',
  'General'
];

/** Même ordre que api/lib/sheets.js */
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

var COL_STATUT = 13;
var COL_MARQUEUR = 14;
var COL_NOTES = 15;
var MAX_ROWS_VALIDATION = 3000;

var HEADER_BG = '#0E1116';
var HEADER_FG = '#E2C06A';

function setupProfessionalLeadsSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  for (var i = 0; i < LEAD_TAB_NAMES.length; i++) {
    var name = LEAD_TAB_NAMES[i];
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
    }
    writeHeadersRow_(sh);
    styleHeaderRow_(sh);
    freezeAndColumnWidths_(sh);
    applyValidations_(sh);
    applyFilter_(sh);
  }
}

function writeHeadersRow_(sh) {
  sh.getRange(1, 1, 1, LEAD_HEADERS.length).setValues([LEAD_HEADERS]);
}

function styleHeaderRow_(sh) {
  var n = LEAD_HEADERS.length;
  var hdr = sh.getRange(1, 1, 1, n);
  hdr.setFontWeight('bold');
  hdr.setBackground(HEADER_BG);
  hdr.setFontColor(HEADER_FG);
  hdr.setWrap(true);
  hdr.setVerticalAlignment('middle');
}

function freezeAndColumnWidths_(sh) {
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 160);
  sh.setColumnWidth(2, 160);
  sh.setColumnWidth(3, 110);
  sh.setColumnWidth(4, 110);
  sh.setColumnWidth(5, 130);
  sh.setColumnWidth(6, 200);
  sh.setColumnWidth(7, 140);
  sh.setColumnWidth(8, 180);
  sh.setColumnWidth(9, 200);
  sh.setColumnWidth(10, 120);
  sh.setColumnWidth(11, 90);
  sh.setColumnWidth(12, 120);
  sh.setColumnWidth(13, 120);
  sh.setColumnWidth(14, 110);
  sh.setColumnWidth(15, 240);
}

function applyValidations_(sh) {
  var statutRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Nouveau', 'En cours', 'Contacté', 'Qualifié', 'Perdu', 'Gagné'], true)
    .setAllowInvalid(false)
    .build();
  sh.getRange(2, COL_STATUT, MAX_ROWS_VALIDATION, 1).setDataValidation(statutRule);
}

function applyFilter_(sh) {
  var range = sh.getRange(1, 1, Math.max(2, sh.getLastRow()), LEAD_HEADERS.length);
  if (!sh.getFilter()) {
    range.createFilter();
  }
}
