# NC Consulting

Site web officiel du cabinet **NC Consulting** — conseil, coaching exécutif et accompagnement premium à Meknès, Maroc.

**Production :** https://www.ncconsulting.ma

## Stack

- HTML / CSS / JavaScript statique
- API serverless Vercel (`api/lead.js`)
- Google Sheets pour la capture des leads
- reCAPTCHA v3

## Structure du projet

```
├── index.html          # Page d'accueil
├── nc-theme.css        # Thème principal + dark mode
├── nc-form.css         # Styles du formulaire wizard
├── nc.js               # Navigation, animations, pôles, FAQ
├── main.js             # Formulaire lead + reCAPTCHA
├── api/
│   ├── lead.js         # Endpoint POST /api/lead
│   └── lib/            # Validation + Google Sheets
├── assets/             # Logo, favicons
├── cgu.html            # Pages légales
├── confidentialite.html
├── mentions-legales.html
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── vercel.json         # Redirects + headers sécurité
└── docs/seo-setup.md   # Guide Google Search Console
```

## Développement local

```bash
npm install
npx vercel dev
```

Ouvrir `http://localhost:3000`

## Variables d'environnement (Vercel)

| Variable | Description |
|----------|-------------|
| `GOOGLE_SHEETS_ID` | ID du Google Sheet |
| `GOOGLE_CLIENT_EMAIL` | Email du compte de service |
| `GOOGLE_PRIVATE_KEY` | Clé privée PEM (`\n` échappés) |
| `RECAPTCHA_SECRET_KEY` | Clé secrète reCAPTCHA v3 |
| `RECAPTCHA_MIN_SCORE` | Score minimum (ex. `0.5`) |
| `RECAPTCHA_ALLOWED_HOSTNAMES` | `www.ncconsulting.ma,ncconsulting.ma` |

## Google Sheet — onglets

Le backend route les leads vers 3 onglets :

| Profil formulaire | Onglet |
|-------------------|--------|
| Dirigeant, Cadre, Professionnel, Transition | `Conseil` |
| Formation professionnelle | `Formation` |
| Autre | `General` |

Scripts Apps Script dans `scripts/` pour initialiser le classeur.

## Contact

- **Site :** https://www.ncconsulting.ma
- **Email :** contact@ncconsulting.ma
- **Téléphone :** 06 06 11 11 99
