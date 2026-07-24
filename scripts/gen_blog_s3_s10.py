# -*- coding: utf-8 -*-
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "blog"
BASE = "https://www.ncconsulting.ma/blog"
S1 = "licence-master-excellence-meknes.html"
DATE = "2026-07-23"
CSS = "../nc-theme.css?v=blog8"


def esc(s):
    return html.escape(s, quote=True)


def plain(a):
    a = re.sub(r"<[^>]+>", "", a)
    return html.unescape(a)


def faq_ld(slug, faqs):
    return {
        "@type": "FAQPage",
        "@id": f"{BASE}/{slug}#faq",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": plain(a)}}
            for q, a in faqs
        ],
    }


def build_ld(a):
    slug = a["slug"]
    url = f"{BASE}/{slug}"
    art = {
        "@type": "Article",
        "@id": f"{url}#article",
        "headline": a["title"],
        "description": a["meta"],
        "datePublished": DATE,
        "dateModified": DATE,
        "inLanguage": "fr-MA",
        "author": {
            "@type": "Person",
            "name": "Nouamane Chaltoute",
            "jobTitle": "Professeur d'enseignement supérieur",
            "url": "https://www.ncconsulting.ma/#fondateur",
        },
        "publisher": {
            "@type": "Organization",
            "@id": "https://www.ncconsulting.ma/#organization",
            "name": "NC Consulting",
            "logo": {"@type": "ImageObject", "url": "https://www.ncconsulting.ma/assets/icon-512.png"},
        },
        "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "articleSection": a.get("section", "Préparation concours"),
        "keywords": a["keywords"],
        "isPartOf": {"@id": "https://www.ncconsulting.ma/blog/#page"},
    }
    if a.get("og_image"):
        art["image"] = a["og_image"]
    graph = [
        art,
        {
            "@type": "BreadcrumbList",
            "@id": f"{url}#breadcrumb",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://www.ncconsulting.ma/"},
                {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{BASE}/"},
                {"@type": "ListItem", "position": 3, "name": a["crumb"], "item": url},
            ],
        },
        faq_ld(slug, a["faqs"]),
    ]
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=2)


def body_html(blocks):
    out = []
    for b in blocks:
        if b[0] == "h2":
            out.append(f"        <h2>{b[1]}</h2>")
        else:
            out.append(f"        <p>{b[1]}</p>")
    return "\n".join(out)


def faq_html(title, faqs):
    items = []
    for q, a in faqs:
        items.append(
            f'          <details class="nc-blog-faq-item">\n'
            f"            <summary>{esc(q)}</summary>\n"
            f"            <p>{a}</p>\n"
            f"          </details>"
        )
    return (
        f'      <section class="nc-blog-faq" id="faq" aria-labelledby="faq-title" data-blog-faq>\n'
        f'        <h2 id="faq-title">{esc(title)}</h2>\n'
        f'        <div class="nc-blog-faq-list">\n'
        + "\n".join(items)
        + "\n        </div>\n      </section>"
    )


def render(a):
    slug = a["slug"]
    cover = ""
    if a.get("cover"):
        cover = (
            f'      <figure class="nc-blog-cover">\n'
            f'        <img src="{a["cover"]["src"]}" width="1200" height="1200" '
            f'alt="{esc(a["cover"]["alt"])}" decoding="async">\n'
            f"      </figure>\n"
        )
    related = "\n".join(
        f'          <a href="{h}"><small>{esc(s)}</small><strong>{esc(t)}</strong></a>'
        for h, s, t in a["related"]
    )
    og = a.get("og_image") or "https://www.ncconsulting.ma/assets/annonce-semaine-gratuite.png"
    return f"""<!DOCTYPE html>
<html lang="fr-MA">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <title>{esc(a["title"])} | NC Consulting</title>
  <meta name="description" content="{esc(a["meta"])}">
  <meta name="keywords" content="{esc(", ".join(a["keywords"]))}">
  <link rel="canonical" href="{BASE}/{slug}">
  <link rel="alternate" hreflang="fr-MA" href="{BASE}/{slug}">
  <link rel="alternate" hreflang="fr" href="{BASE}/{slug}">
  <link rel="alternate" hreflang="x-default" href="{BASE}/{slug}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{BASE}/{slug}">
  <meta property="og:title" content="{esc(a["title"])}">
  <meta property="og:description" content="{esc(a["meta"])}">
  <meta property="og:image" content="{og}">
  <meta property="og:locale" content="fr_MA">
  <meta property="article:published_time" content="{DATE}">
  <meta property="article:modified_time" content="{DATE}">
  <meta property="article:author" content="Nouamane Chaltoute">
  <meta property="article:section" content="{esc(a.get("section", "Préparation concours"))}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(a["title"])}">
  <meta name="twitter:description" content="{esc(a["meta"])}">
  <meta name="twitter:image" content="{og}">
  <link rel="icon" href="https://www.ncconsulting.ma/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" sizes="180x180" href="https://www.ncconsulting.ma/assets/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{CSS}">
  <script type="application/ld+json">
{build_ld(a)}
  </script>
</head>
<body class="nc-page-body nc-blog-alive">
  <div class="nc-blog-read-progress" aria-hidden="true"></div>
  <header class="nc-page-top">
    <div class="container nc-page-top-inner">
      <a class="nc-page-back" href="/blog/">← Blog</a>
      <a class="nc-wordmark" href="/">NC <span>Consulting</span></a>
    </div>
  </header>

  <main class="nc-page-main">
    <article
      class="container nc-blog-article"
      data-blog-slug="{slug.replace(".html", "")}"
      data-blog-pillar="{a.get("pillar", "concours")}"
      data-blog-title="{esc(a["title"])}"
    >
      <header class="nc-blog-article-head">
        <nav class="nc-blog-crumbs" aria-label="Fil d'Ariane">
          <a href="/">Accueil</a>
          <span aria-hidden="true">/</span>
          <a href="/blog/">Blog</a>
          <span aria-hidden="true">/</span>
          <span>{esc(a["crumb"])}</span>
        </nav>
        <div class="nc-blog-card-meta">
          <span class="nc-blog-pill">{esc(a["pill"])}</span>
          <time datetime="{DATE}">23 juillet 2026</time>
          <span>{esc(a["read"])}</span>
        </div>
        <h1 class="nc-page-title">{a["h1_html"]}</h1>
        <p class="nc-page-lead">{a["lead"]}</p>
        <div class="nc-blog-byline">
          <span class="nc-blog-avatar nc-blog-avatar--lg" aria-hidden="true">NC</span>
          <div class="nc-blog-byline-text">
            <div class="nc-blog-byline-name">NC Consulting</div>
            <div class="nc-blog-byline-role">Conseil · Coaching · Préparation concours — Meknès &amp; à distance</div>
          </div>
          <div class="nc-blog-byline-meta">
            <time datetime="{DATE}">23 juillet 2026</time>
            <span class="nc-blog-meta-sep" aria-hidden="true">·</span>
            <span>{esc(a["read"])}</span>
          </div>
        </div>
      </header>
{cover}
      <div class="nc-blog-prose" data-blog-body>
{body_html(a["blocks"])}
      </div>

{a["cta"]}

      <section class="nc-blog-related" aria-label="À lire ensuite">
        <h2>Continuer dans le même pilier</h2>
        <div class="nc-blog-related-grid">
{related}
        </div>
      </section>

{faq_html(a["faq_title"], a["faqs"])}

      <footer class="nc-blog-article-foot">
        <p><strong>Nouamane Chaltoute</strong> — Professeur d'enseignement supérieur, fondateur de NC Consulting (Meknès &amp; à distance).</p>
        <p>
          <a href="/blog/">← Tous les articles</a> ·
          {a["foot"]}
        </p>
      </footer>
    </article>
  </main>

  <footer class="nc-page-foot">
    <div class="container">
      <p>© 2026 NC Consulting · <a href="/">ncconsulting.ma</a> · <a href="/blog/">Blog</a></p>
    </div>
  </footer>
  <script src="blog.js" defer></script>
</body>
</html>
"""


CTA_S = """      <aside class="nc-blog-cta" aria-label="Inscription semaine gratuite">
        <h2>Semaine gratuite — inscription</h2>
        <p>Début des cours : jeudi 23 juillet 2026 · À distance · 21h–22h · 100&nbsp;% gratuit</p>
        <a class="btn btn-gold btn-lg" href="/#formulaire">Je m'inscris à la semaine gratuite →</a>
        <p class="nc-blog-cta-sub"><a href="/annonce.html?id=semaine-gratuite">Voir le programme détaillé de l'annonce →</a></p>
      </aside>"""

CTA_C = """      <aside class="nc-blog-cta" aria-label="Contacter NC Consulting">
        <h2>Passer à l'action</h2>
        <p>Premier échange confidentiel · Réponse sous 24–48&nbsp;h</p>
        <a class="btn btn-gold btn-lg" href="/#formulaire">Je contacte NC Consulting →</a>
        <p class="nc-blog-cta-sub"><a href="licence-master-excellence-meknes.html">Relire la méthode orale en 5 étapes →</a></p>
      </aside>"""


def load_articles():
    from blog_s3_s10_data import ARTICLES
    from blog_s3_s10_data_b import MORE

    arts = list(ARTICLES) + list(MORE)
    for a in arts:
        if a["cta"] == "semaine":
            a["cta"] = CTA_S
        elif a["cta"] == "contact":
            a["cta"] = CTA_C
    return arts


def main():
    arts = load_articles()
    for a in arts:
        path = ROOT / a["slug"]
        path.write_text(render(a), encoding="utf-8")
        print("wrote", path.name)


if __name__ == "__main__":
    main()
