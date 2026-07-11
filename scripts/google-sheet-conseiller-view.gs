/**
 * NC Consulting — vue conseiller : filtre léger + colonnes techniques masquées
 * ----------------------------------------------------------------------------
 * À coller dans Extensions > Apps Script (même fichier que l’autre script si
 * vous voulez), puis exécutez `setupConseillerFriendlySheets`.
 *
 * Comportement :
 * - Filtre automatique uniquement sur le tableau des leads : colonnes A→O
 *   (nombre de colonnes = en-têtes), et lignes jusqu’à la dernière ligne
 *   remplie + une petite marge — pas jusqu’à des centaines de lignes vides
 *   ni jusqu’aux colonnes Z, etc.
 * - Colonnes « tech » masquées (toujours en base dans le fichier pour l’API) :
 *   « Reçu le (serveur) », score / action anti-spam. Pas d’IP dans le backend
 *   actuel ; si vous ajoutez une colonne IP, élargissez LEAD_HEADERS et
 *   ajoutez son index (1-based) dans TECH_COLUMN_INDEXES_1BASE.
 *
 * Remarque Sheets : un seul filtre automatique par feuille = un rectangle
 * contigu. Les colonnes masquées restent dans ce rectangle mais ne s’affichent
 * pas ; le conseiller voit surtout les infos saisies par les clients + suivi.
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

/** Indices 1-based, alignés sur LEAD_HEADERS — à ajuster si l’API change. */
var TECH_COLUMN_INDEXES_1BASE = [
  2, // Reçu le (serveur)
  11, // Score anti-spam
  12 // Action anti-spam
  // ex. 16 si vous ajoutez « IP » en colonne P : décommentez / complétez
];

/** Ligne de marge sous les données pour filtres/tri sans étendre toute la page. */
var FILTER_ROW_BUFFER_BELOW_DATA = 12;

var COL_STATUT = 13;
var COL_MARQUEUR = 14;
var COL_NOTES = 15;
var MAX_ROWS_VALIDATION = 3000;

var HEADER_BG = '#0d2818';
var HEADER_FG = '#f4e5b8';

function setupConseillerFriendlySheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  for (var i = 0; i < LEAD_TAB_NAMES.length; i++) {
    var name = LEAD_TAB_NAMES[i];
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
    }
    unhideLeadColumns_(sh);
    writeHeadersRow_(sh);
    styleHeaderRow_(sh);
    freezeAndColumnWidths_(sh);
    applyValidations_(sh);
    hideTechColumns_(sh);
    applyFilterOnLeadTableOnly_(sh);
  }
}

function unhideLeadColumns_(sh) {
  var n = Math.max(LEAD_HEADERS.length, sh.getLastColumn());
  try {
    sh.showColumns(1, n);
  } catch (e) {
    /* ignore */
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
  var widths = [152, 158, 100, 120, 120, 220, 120, 150, 160, 120, 100, 120, 130, 150, 280];
  for (var c = 0; c < widths.length; c++) {
    sh.setColumnWidth(c + 1, widths[c]);
  }
}

/** Dernière ligne utile pour filtre / mise en forme : pas une grille « pleine page ». */
function dataLastRowForFilter_(sh) {
  var lr = Math.max(sh.getLastRow(), 2);
  return lr + FILTER_ROW_BUFFER_BELOW_DATA;
}

function applyFilterOnLeadTableOnly_(sh) {
  var filt = sh.getFilter();
  if (filt !== null) {
    filt.remove();
  }
  var numCols = LEAD_HEADERS.length;
  var lastRow = dataLastRowForFilter_(sh);
  sh.getRange(1, 1, lastRow, numCols).createFilter();
}

function hideTechColumns_(sh) {
  var sorted = TECH_COLUMN_INDEXES_1BASE.slice().sort(function (a, b) {
    return b - a;
  });
  for (var i = 0; i < sorted.length; i++) {
    var col = sorted[i];
    try {
      sh.hideColumns(col, 1);
    } catch (e2) {
      /* ignore colonne inexistante */
    }
  }
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

/** Si besoin : réaffiche toutes les colonnes du tableau (ex. audit admin). */
function showAllTechColumnsOnLeadTabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  for (var i = 0; i < LEAD_TAB_NAMES.length; i++) {
    var sh = ss.getSheetByName(LEAD_TAB_NAMES[i]);
    if (sh) {
      unhideLeadColumns_(sh);
    }
  }
}
