/**
 * Galilie Scholar — mise en forme professionnelle du classeur leads
 * -----------------------------------------------------------------
 * 1) Ouvrez le Google Sheet concerné (même fichier que le backend).
 * 2) Extensions > Apps Script — collez tout ce fichier.
 * 3) Enregistrez, puis exécutez `setupProfessionalLeadsSheets`.
 * 4) Autorisez l’accès au classeur.
 *
 * Les onglets correspondent au routage backend (Bac, Prepa, Concours, …).
 */

var LEAD_TAB_NAMES = [
  'Bac',
  'Prepa',
  'Concours',
  'Langues',
  'Coaching',
  'BacPlus',
  'Professionnels',
  'Parents',
  'General'
];

/** Même ordre que api/lib/sheets.js — ne pas réordonner sans changer le backend. */
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

var HEADER_BG = '#0d2818';
var HEADER_FG = '#f4e5b8';

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

/** Ligne 1 = toujours alignée sur LEAD_HEADERS (ne modifie pas les lignes de données). */
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
  var widths = [152, 158, 100, 120, 120, 220, 120, 150, 160, 120, 100, 120, 130, 150, 280];
  for (var c = 0; c < widths.length; c++) {
    sh.setColumnWidth(c + 1, widths[c]);
  }
}

function applyFilter_(sh) {
  var filt = sh.getFilter();
  if (filt !== null) {
    filt.remove();
  }
  var numCols = LEAD_HEADERS.length;
  var lastRow = Math.max(sh.getLastRow(), 500);
  sh.getRange(1, 1, lastRow, numCols).createFilter();
}

function applyValidations_(sh) {
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

  sh.getRange(2, COL_STATUT, lastRow, COL_STATUT).setDataValidation(dvStatut);
  sh.getRange(2, COL_MARQUEUR, lastRow, COL_MARQUEUR).setDataValidation(dvMarqueur);
  sh.getRange(2, COL_NOTES, lastRow, COL_NOTES).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
}
