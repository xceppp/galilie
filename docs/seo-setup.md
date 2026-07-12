# SEO & Google Search Console — NC Consulting

Site canonique : **https://www.ncconsulting.ma**

## 1. Vercel — variables d'environnement

Dans **Vercel → Project → Settings → Environment Variables**, vérifier :

| Variable | Valeur recommandée |
|----------|-------------------|
| `RECAPTCHA_ALLOWED_HOSTNAMES` | `www.ncconsulting.ma,ncconsulting.ma` |

Dans **Google reCAPTCHA Admin**, ajouter les domaines :
- `www.ncconsulting.ma`
- `ncconsulting.ma`

## 2. Domaine canonique (www)

Le site utilise **`https://www.ncconsulting.ma`** comme URL canonique.

Les redirections 301 sont configurées dans `vercel.json` :
- `ncconsulting.ma` → `www.ncconsulting.ma`

Dans **Vercel → Domains**, attacher les deux domaines (`ncconsulting.ma` et `www.ncconsulting.ma`) au projet.

## 3. Google Search Console

1. Aller sur [Google Search Console](https://search.google.com/search-console)
2. **Ajouter une propriété** → type **Domaine** : `ncconsulting.ma` (recommandé) ou **Préfixe d'URL** : `https://www.ncconsulting.ma/`
3. **Vérifier la propriété** (TXT DNS ou balise HTML)
4. Une fois vérifié :
   - **Sitemaps** → soumettre : `https://www.ncconsulting.ma/sitemap.xml`
   - **Inspection d'URL** → saisir `https://www.ncconsulting.ma/` → **Demander une indexation**

## 4. Validation technique

Après déploiement, vérifier :

- [Rich Results Test](https://search.google.com/test/rich-results) sur la page d'accueil (JSON-LD `ProfessionalService`)
- `https://www.ncconsulting.ma/robots.txt` — doit référencer le sitemap
- `https://www.ncconsulting.ma/sitemap.xml` — 4 URLs publiques
- Redirection : `http://ncconsulting.ma` et `https://ncconsulting.ma` → `https://www.ncconsulting.ma`

## 5. Lighthouse (mobile)

Exécuter un audit Lighthouse dans Chrome DevTools (mode mobile) et viser ≥ 90 sur Performance, Accessibilité, SEO et Bonnes pratiques.

## 6. Réseaux sociaux

Profils configurés sur le site :
- Instagram : https://www.instagram.com/ncconsulting2
- Facebook : https://www.facebook.com/share/14n6ep56JPi/

**LinkedIn** : non fourni — ajouter l'URL dès qu'un profil professionnel est créé.

## 7. Contact

- Téléphone : 06 06 11 11 99 (`+212606111199`)
- Email : contact@ncconsulting.ma

## 8. Contenu organique (recommandation)

Publier 3–5 articles ciblant des requêtes longue traîne (ex. « coaching exécutif Meknès », « accompagnement dirigeant Maroc ») est le levier organique le plus important à moyen terme. Aucune section blog n'existe encore sur le site.
