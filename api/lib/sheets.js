const { google } = require('googleapis');

const DEFAULT_TABS = {
  bac: 'Bac',
  prepa: 'Prepa',
  concours: 'Concours',
  langues: 'Langues',
  coaching: 'Coaching',
  bacplus: 'BacPlus',
  pro: 'Professionnels',
  parent: 'Parents',
  general: 'General',
};

const HEADERS = [
  'timestamp_iso',
  'received_at',
  'prenom',
  'nom',
  'telephone',
  'email',
  'niveau',
  'filiere',
  'service',
  'mode',
  'recaptcha_score',
  'recaptcha_action',
];

let sheetsClientPromise = null;

function getEnvTabName(key) {
  const envName = `SHEET_TAB_${key.toUpperCase()}`;
  return process.env[envName] || DEFAULT_TABS[key];
}

function getTabForNiveau(niveau = '') {
  const map = {
    bac1: 'bac',
    bac2: 'bac',
    prepa_sci: 'prepa',
    prepa_eco: 'prepa',
    concours_public: 'concours',
    langues: 'langues',
    coaching: 'coaching',
    bacplus: 'bacplus',
    pro: 'pro',
    parent: 'parent',
  };
  const key = map[niveau] || 'general';
  return getEnvTabName(key);
}

function getSheetsId() {
  const id = (process.env.GOOGLE_SHEETS_ID || '').trim();
  if (!id) throw new Error('Missing GOOGLE_SHEETS_ID');
  return id;
}

function parseServiceAccount() {
  const raw = String(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || '').trim();
  if (!raw) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_CREDENTIALS');
  let creds;
  try {
    creds = JSON.parse(raw);
  } catch (_) {
    throw new Error(
      'Invalid GOOGLE_SERVICE_ACCOUNT_CREDENTIALS JSON (vérifiez guillemets et \\n dans private_key)'
    );
  }
  if (creds.private_key) creds.private_key = creds.private_key.replace(/\\n/g, '\n');
  return creds;
}

async function getSheetsClient() {
  if (sheetsClientPromise) return sheetsClientPromise;
  sheetsClientPromise = (async () => {
    const credentials = parseServiceAccount();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
  })();
  return sheetsClientPromise;
}

function safeCell(value) {
  return String(value == null ? '' : value).trim().slice(0, 500);
}

function a1Range(tabName, endColumn = 'Z') {
  const escaped = String(tabName).replace(/'/g, "''");
  return `'${escaped}'!A:${endColumn}`;
}

async function ensureTabExists(sheets, spreadsheetId, tabName) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = (meta.data.sheets || []).some(
    (s) => s.properties && s.properties.title === tabName
  );
  if (exists) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: tabName } } }],
    },
  });
}

async function ensureHeaders(sheets, spreadsheetId, tabName) {
  const getResp = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tabName.replace(/'/g, "''")}'!A1:L1`,
  }).catch(() => ({ data: {} }));
  const firstRow = getResp.data.values && getResp.data.values[0];
  if (Array.isArray(firstRow) && firstRow.length) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName.replace(/'/g, "''")}'!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  });
}

async function appendLeadRow(lead, recaptcha) {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSheetsId();
  const tabName = getTabForNiveau(lead.niveau);

  await ensureTabExists(sheets, spreadsheetId, tabName);
  await ensureHeaders(sheets, spreadsheetId, tabName);

  const row = [
    safeCell(lead.timestamp || new Date().toISOString()),
    safeCell(new Date().toISOString()),
    safeCell(lead.prenom),
    safeCell(lead.nom),
    safeCell(lead.telephone),
    safeCell(lead.email),
    safeCell(lead.niveau),
    safeCell(lead.filiere),
    safeCell(lead.service),
    safeCell(lead.mode),
    safeCell(recaptcha && recaptcha.score != null ? recaptcha.score : ''),
    safeCell(recaptcha && recaptcha.action ? recaptcha.action : ''),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: a1Range(tabName, 'L'),
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  return { tabName };
}

module.exports = {
  appendLeadRow,
};
