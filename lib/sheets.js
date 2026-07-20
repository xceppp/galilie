const DEFAULT_TABS = {
  consulting: 'Conseil',
  formation: 'Formation',
  general: 'General',
};

/** Libellés affichés dans le Sheet (alignés sur le formulaire index.html / main.js). */
const NIVEAU_LABELS = {
  candidat_lex: "Candidat Licence d'Excellence",
  candidat_lpro: 'Candidat Licence Pro',
  candidat_master: 'Candidat Master',
  etudiant: 'Étudiant / Autre filière',
  coaching: 'Coaching / conseil exécutif',
  autre: 'Autre profil',
};

/** En-têtes visibles (colonnes remplies par l’API jusqu’à anti-spam ; le reste pour le conseiller). */
const HEADERS = [
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
  'Notes conseiller',
];

const COL_COUNT = HEADERS.length;

function endColumnLetter() {
  let n = COL_COUNT;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

let sheetsClientPromise = null;

function getEnvTabName(key) {
  const envName = `SHEET_TAB_${key.toUpperCase()}`;
  return process.env[envName] || DEFAULT_TABS[key];
}

function getTabForNiveau(niveau = '') {
  const map = {
    candidat_lex: 'formation',
    candidat_lpro: 'formation',
    candidat_master: 'formation',
    etudiant: 'formation',
    coaching: 'consulting',
    autre: 'general',
  };
  const key = map[niveau] || 'general';
  return getEnvTabName(key);
}

function getSheetsId() {
  const id = (process.env.GOOGLE_SHEETS_ID || '').trim();
  if (!id) throw new Error('Missing GOOGLE_SHEETS_ID');
  return id;
}

/**
 * Si tu colles la valeur telle qu’elle apparaît dans credentials.json
 * (chaîne entre guillemets avec \\n littéraux), JSON.parse peut la convertir
 * en PEM avec de vrais retours ligne.
 */
function unwrapJsonQuotedCredentialString(raw) {
  const t = String(raw || '').replace(/^\uFEFF/, '').trim();
  if (t.startsWith('"') && t.endsWith('"') && t.length > 2) {
    try {
      const decoded = JSON.parse(t);
      if (typeof decoded === 'string') return decoded;
    } catch (_) {
      /* not valid JSON fragment; fall through */
    }
  }
  return t;
}

/**
 * PEM attendu pour Google JWT. Erreurs OpenSSL DECODER unsupported = souvent
 * clé sur une ligne/cassée dans Vercel ou \n littéraux mal interprétés.
 */
function normalizePrivateKeyPem(raw) {
  let s = unwrapJsonQuotedCredentialString(String(raw || '').replace(/^\uFEFF/, '').trim());
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/\\r\\n/g, '\n').replace(/\\r/g, '\n').replace(/\\n/g, '\n');
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const variants = [
    ['-----BEGIN PRIVATE KEY-----', '-----END PRIVATE KEY-----'],
    ['-----BEGIN RSA PRIVATE KEY-----', '-----END RSA PRIVATE KEY-----'],
  ];
  for (const [beg, ending] of variants) {
    if (!s.includes(beg) || !s.includes(ending)) continue;
    let start = s.indexOf(beg) + beg.length;
    let end = s.indexOf(ending, start);
    if (end === -1) continue;
    const body = s.slice(start, end).replace(/[\s\n\r]/g, '');
    if (!body) continue;
    const chunks = body.match(/.{1,64}/g) || [body];
    return `${beg}\n${chunks.join('\n')}\n${ending}\n`;
  }
  throw new Error(
    'Clé PEM invalide : elle doit contenir -----BEGIN PRIVATE KEY----- … -----END PRIVATE KEY----- (copie depuis credentials.json, champ private_key)'
  );
}

/** JSON collé dans Vercel avec de vrais retours à la ligne dans private_key → JSON invalide. */
function tryRepairPrivateKeyMultiline(jsonText) {
  const re = /"private_key"\s*:\s*"/;
  const m = jsonText.match(re);
  if (!m || m.index === undefined) return jsonText;
  const valueStart = m.index + m[0].length;
  const endMarker = '-----END PRIVATE KEY-----';
  const endIdx = jsonText.indexOf(endMarker, valueStart);
  if (endIdx === -1) return jsonText;
  const closeIdx = jsonText.indexOf('"', endIdx + endMarker.length);
  if (closeIdx === -1) return jsonText;
  const inner = jsonText.slice(valueStart, closeIdx);
  if (!/[\r\n]/.test(inner)) return jsonText;
  const fixed = inner.replace(/\r\n/g, '\n').replace(/\n/g, '\\n');
  return jsonText.slice(0, valueStart) + fixed + jsonText.slice(closeIdx);
}

function tryStripTrailingCommas(s) {
  return s.replace(/,\s*([}\]])/g, '$1');
}

/** Si la variable est une chaîne JSON doublement encodée (rare). */
function tryUnwrapQuotedJson(s) {
  const t = s.trim();
  if (t.length < 2) return s;
  if (t.startsWith('"') && t.endsWith('"')) {
    try {
      const inner = JSON.parse(t);
      if (typeof inner === 'string' && inner.trim().startsWith('{')) {
        return inner.trim();
      }
    } catch (_) {
      /* ignore */
    }
  }
  if (t.startsWith("'") && t.endsWith("'")) {
    const inner = t.slice(1, -1);
    if (inner.trim().startsWith('{')) return inner.trim();
  }
  return s;
}

function parseJsonCredentials(jsonText) {
  let t = String(jsonText || '')
    .replace(/^\uFEFF/, '')
    .trim();
  if (!t) throw new Error('Empty credentials JSON');
  t = tryUnwrapQuotedJson(t);
  const attempts = [
    t,
    tryStripTrailingCommas(t),
    tryRepairPrivateKeyMultiline(t),
    tryRepairPrivateKeyMultiline(tryStripTrailingCommas(t)),
  ];
  let lastErr = null;
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch (e) {
      lastErr = e;
    }
  }
  const hint =
    'Utilisez GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_B64 (JSON encodé en base64), ou un JSON sur une ligne : ' +
    'dans private_key uniquement des \\n (backslash + n), jamais de vrais retours à la ligne.';
  throw new Error(
    lastErr && lastErr.message
      ? `Invalid credentials JSON (${lastErr.message}). ${hint}`
      : `Invalid credentials JSON. ${hint}`
  );
}

function parseServiceAccount() {
  const simpleEmail = String(process.env.GOOGLE_CLIENT_EMAIL || '').trim();
  const simpleKeyRaw = unwrapJsonQuotedCredentialString(
    String(process.env.GOOGLE_PRIVATE_KEY || '').trim()
  ).trim();
  const simpleProjectId = String(process.env.GOOGLE_PROJECT_ID || '').trim();
  if (simpleEmail && simpleKeyRaw) {
    let privateKeyNormalized;
    try {
      privateKeyNormalized = normalizePrivateKeyPem(simpleKeyRaw);
    } catch (e) {
      throw new Error(
        `${e.message} Vérifiez GOOGLE_PRIVATE_KEY : une seule variable, valeur du champ "private_key" du fichier JSON téléchargé.`
      );
    }
    return {
      type: 'service_account',
      project_id: simpleProjectId || undefined,
      client_email: simpleEmail,
      private_key: privateKeyNormalized,
      token_uri: 'https://oauth2.googleapis.com/token',
    };
  }

  const b64 = String(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_B64 || '').trim();
  let jsonText = '';
  if (b64) {
    try {
      jsonText = Buffer.from(b64, 'base64').toString('utf8');
    } catch (_) {
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_B64 (base64)');
    }
  } else {
    jsonText = String(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || '').trim();
  }
  if (!jsonText) {
    throw new Error(
      'Missing credentials: set GOOGLE_SERVICE_ACCOUNT_CREDENTIALS (JSON) or GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_B64 (base64 du JSON)'
    );
  }
  const creds = parseJsonCredentials(jsonText);
  if (!creds.private_key || typeof creds.private_key !== 'string') {
    throw new Error('JSON credentials: champ private_key manquant ou invalide');
  }
  creds.private_key = normalizePrivateKeyPem(creds.private_key.replace(/\\n/g, '\n'));
  return creds;
}

async function getSheetsClient() {
  if (sheetsClientPromise) return sheetsClientPromise;
  sheetsClientPromise = (async () => {
    const { google } = require('googleapis');
    const credentials = parseServiceAccount();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
  })().catch((err) => {
    sheetsClientPromise = null;
    const msg = String(err && err.message ? err.message : err);
    if (/DECODER|unsupported:/i.test(msg)) {
      throw new Error(
        `Clé privée Google illisible (OpenSSL). Vérifiez GOOGLE_PRIVATE_KEY : copie du champ "private_key" du JSON, ou définissez GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_B64. Détail technique : ${msg.slice(0, 120)}`
      );
    }
    throw err;
  });
  return sheetsClientPromise;
}

function safeCell(value) {
  let s = String(value == null ? '' : value).trim().slice(0, 500);
  /** USER_ENTERED : évite l’interprétation formule (=+−@). */
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return s;
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
  const esc = tabName.replace(/'/g, "''");
  const getResp = await sheets.spreadsheets.values
    .get({
      spreadsheetId,
      range: `'${esc}'!1:1`,
    })
    .catch(() => ({ data: {} }));
  const firstRow = getResp.data.values && getResp.data.values[0];
  const needWrite =
    !Array.isArray(firstRow) ||
    !firstRow.length ||
    firstRow.length < COL_COUNT ||
    String(firstRow[0] || '').toLowerCase() === 'timestamp_iso';
  if (!needWrite) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${esc}'!A1`,
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
    safeCell(NIVEAU_LABELS[lead.niveau] || lead.niveau),
    safeCell(lead.filiere),
    safeCell(lead.service),
    safeCell(lead.mode),
    safeCell(recaptcha && recaptcha.score != null ? recaptcha.score : ''),
    safeCell(recaptcha && recaptcha.action ? recaptcha.action : ''),
    'Nouveau',
    '',
    safeCell(lead.situation),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: a1Range(tabName, endColumnLetter()),
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  return { tabName };
}

module.exports = {
  appendLeadRow,
  getSheetsClient,
  getSheetsId,
  ensureTabExists,
  safeCell,
  a1Range,
};
