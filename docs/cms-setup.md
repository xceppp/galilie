# CMS Admin Panel — Setup Guide

The admin panel lives at `/admin`. You sign in with your Google account, and edit
site content that is stored in your existing Google Sheet (the same spreadsheet
used for leads, in new `cms_*` tabs). Changes appear on the live site within a
minute (edge cache), no redeploy needed.

## 6. Aligner le Sheet après déploiement (form.html + heures extra)

Après une mise à jour site qui change les CTA ou le CMS par défaut :

1. Ouvrez le Google Sheet → **Extensions → Apps Script**.
2. Ajoutez un fichier **CmsAlign.gs** : copiez le contenu de  
   `scripts/google-sheet-cms-align-2026.gs` (généré par `node scripts/generate-cms-align-gs.js`).
3. Si vous utilisez déjà `scripts/google-sheet-ncconsulting-leads-setup.gs`, le menu  
   **NC Consulting → Aligner CMS (form + heures extra)** appelle la même fonction.
4. Exécutez **alignNcConsultingCmsWithSite2026** une fois (autorisez l’accès si demandé).
5. Rechargez le site (Ctrl+F5).

Cela met à jour `cms_content`, `cms_formations`, `cms_nouveau`, `cms_announcements` et remplace `/#formulaire` par `/form.html` dans tout le classeur. Les onglets **cms_blog** et **leads** ne sont pas écrasés.


## 1. Google OAuth Web Client ID (for admin sign-in)

This is separate from the service account (which reads/writes Sheets). It only
identifies *who is logging in* to the admin panel.

1. Go to <https://console.cloud.google.com/apis/credentials> (same project as the
   service account is fine).
2. Click **Create Credentials → OAuth client ID**.
3. Application type: **Web application**.
4. **Authorized JavaScript origins** — add:
   - `https://www.ncconsulting.ma`
   - `http://localhost:3000` (for local `vercel dev` testing)
5. Leave "Authorized redirect URIs" empty (Google Identity Services uses the
   origins only).
6. Create, then copy the **Client ID** (looks like `xxxx.apps.googleusercontent.com`).

## 2. Environment variables

Set these in **Vercel → Project Settings → Environment Variables** (Production +
Preview + Development), and in a local `.env` file for `vercel dev`.

| Variable | Value | Notes |
| --- | --- | --- |
| `GOOGLE_OAUTH_CLIENT_ID` | the Web Client ID from step 1 | required for login |
| `ADMIN_EMAILS` | `you@gmail.com,other@gmail.com` | comma-separated allowlist of Google accounts allowed in |
| `SESSION_SECRET` | a long random string | signs the session cookie — generate with `openssl rand -hex 32` |

Already-existing variables that are **reused** (do not change):

- `GOOGLE_SHEETS_ID` — the spreadsheet the CMS writes to
- `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY` (or `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS[_B64]`)

Optional:

- `CMS_CACHE_SECONDS` — public content edge cache TTL (default `60`).

## 3. Local `.env` template

Create a file named `.env` in the project root (it is gitignored):

```
GOOGLE_OAUTH_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
ADMIN_EMAILS=you@gmail.com
SESSION_SECRET=replace-with-openssl-rand-hex-32

# Reused (copy from your Vercel project / existing setup)
GOOGLE_SHEETS_ID=...
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 4. Run locally

The admin panel needs the serverless functions, so a plain static server will not
work. Use the Vercel CLI:

```
npm i -g vercel        # once
vercel dev             # serves site + /api on http://localhost:3000
```

Then open <http://localhost:3000/admin>, sign in with an allowlisted Google
account, and edit content. Refresh the homepage to see changes.

## 5. Deploy

Push to `main`; Vercel deploys automatically. Make sure the three new env vars
above are set in Production before using `/admin` on the live domain.
