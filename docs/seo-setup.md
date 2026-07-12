# SEO & indexation Google — NC Consulting (ncconsulting.ma)

Site canonique : **https://www.ncconsulting.ma**

> **Objectif** : apparaître en première position pour les recherches de marque (`NC Consulting`, `ncconsulting`, `ncconsulting.ma`) et bien se positionner sur les requêtes locales (`conseil Meknès`, `coaching exécutif Maroc`).

---

## 1. Déjà en place sur le site (technique)

| Élément | Statut |
|---------|--------|
| URL canonique `www.ncconsulting.ma` | ✅ |
| Redirection 301 `ncconsulting.ma` → `www` | ✅ `vercel.json` |
| Redirection 301 `/index.html` → `/` | ✅ |
| `robots.txt` + `sitemap.xml` | ✅ |
| Meta title / description optimisés (marque + ville) | ✅ |
| Open Graph + Twitter cards | ✅ |
| `hreflang` fr-MA | ✅ |
| JSON-LD : Organization, WebSite, LocalBusiness, FAQPage | ✅ |
| `llms.txt` (référencement IA) | ✅ |
| Pages légales indexables | ✅ |
| API `/api/*` en `noindex` | ✅ |

---

## 2. Actions obligatoires (à faire manuellement)

### A. Google Search Console
1. [search.google.com/search-console](https://search.google.com/search-console)
2. Ajouter la propriété **Domaine** : `ncconsulting.ma` (recommandé) ou préfixe `https://www.ncconsulting.ma/`
3. Vérifier via enregistrement DNS TXT (Vercel / registrar)
4. Soumettre le sitemap : `https://www.ncconsulting.ma/sitemap.xml`
5. **Inspection d'URL** → `https://www.ncconsulting.ma/` → **Demander une indexation**

### B. Balise de vérification Google (si méthode HTML)
Ajouter dans `<head>` de `index.html` (remplacer `VOTRE_CODE`) :
```html
<meta name="google-site-verification" content="VOTRE_CODE" />
```

### C. Google Business Profile (critique pour le local)
1. [business.google.com](https://business.google.com)
2. Créer / revendiquer **NC Consulting** à Meknès
3. Catégorie : *Consultant en management* ou *Coach professionnel*
4. Site web : `https://www.ncconsulting.ma`
5. Téléphone : `+212 6 06 11 11 99`
6. Mêmes horaires que le JSON-LD (lun–ven 9h–19h)
7. Photos logo + bureau, lien Instagram

### D. Bing Webmaster Tools
1. [bing.com/webmasters](https://www.bing.com/webmasters)
2. Importer depuis Search Console ou vérifier le domaine
3. Soumettre le même sitemap

### E. Cohérence NAP (Name, Address, Phone)
Partout identique :
- **NC Consulting**
- Meknès, Maroc
- `+212606111199` / `06 06 11 11 99`
- `contact@ncconsulting.ma`
- `https://www.ncconsulting.ma`

Mettre à jour : Instagram bio, Facebook, WhatsApp Business, signatures email.

---

## 3. Vercel — variables d'environnement

| Variable | Valeur |
|----------|--------|
| `RECAPTCHA_ALLOWED_HOSTNAMES` | `www.ncconsulting.ma,ncconsulting.ma` |

Domaines reCAPTCHA Google Admin : `www.ncconsulting.ma`, `ncconsulting.ma`

---

## 4. Validation après déploiement

- [Rich Results Test](https://search.google.com/test/rich-results) → FAQ + Local Business
- [PageSpeed Insights](https://pagespeed.web.dev/) → mobile ≥ 90 SEO
- `https://www.ncconsulting.ma/robots.txt`
- `https://www.ncconsulting.ma/sitemap.xml`
- `https://www.ncconsulting.ma/llms.txt`
- Test redirection : `http://ncconsulting.ma` → `https://www.ncconsulting.ma/`

---

## 5. Réseaux sociaux (signaux de marque)

| Plateforme | URL |
|------------|-----|
| Instagram | https://www.instagram.com/ncconsulting2 |
| Facebook | https://www.facebook.com/share/14n6ep56JPi/ |
| LinkedIn | *à créer et ajouter dans `sameAs` + footer* |

Bio Instagram / Facebook : inclure **ncconsulting.ma** et « NC Consulting Meknès ».

---

## 6. Levier organique (moyen terme)

Pour dépasser les concurrents sur des requêtes non-marque :
- Articles ciblés : *coaching exécutif Meknès*, *consultant dirigeant Maroc*
- Avis clients Google Business (authentiques)
- Backlinks locaux (annuaires pro Maroc, partenaires, presse locale)
- Publier régulièrement sur Instagram avec lien bio vers le site

---

## 7. Délais réalistes

| Requête | Délai typique après configuration |
|---------|-------------------------------------|
| `ncconsulting.ma` / `NC Consulting` (marque) | 1–14 jours |
| `conseil Meknès` / `coaching exécutif Maroc` | 2–6 mois + contenu |

L'indexation technique ne garantit pas la 1ère place : Google Business Profile + avis + backlinks sont décisifs pour le local.

---

## 8. Contact cabinet

- Tél. : 06 06 11 11 99 (`+212606111199`)
- Email : contact@ncconsulting.ma
