/* Dynamic blog article — ?slug= from CMS */
(function () {
  'use strict';

  var CAT_LABELS = {
    concours: 'Concours',
    reprise: "Reprise d'études",
    etablissements: 'Établissements',
    coaching: 'Coaching',
  };

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getSlug() {
    try {
      var q = new URLSearchParams(window.location.search).get('slug');
      if (q) return q;
      var parts = window.location.pathname.replace(/\/+$/, '').split('/');
      var last = parts[parts.length - 1] || '';
      if (last && last !== 'blog' && last !== 'article.html') {
        return last.replace(/\.html$/, '');
      }
    } catch (e) {}
    return '';
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso + 'T12:00:00');
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return iso;
    }
  }

  function imgSrc(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.charAt(0) === '/') return path;
    return '/' + path.replace(/^\.\.\//, '');
  }

  function pillClass(cat) {
    if (cat === 'concours') return 'nc-blog-pill nc-blog-pill--concours';
    if (cat === 'reprise') return 'nc-blog-pill nc-blog-pill--reprise';
    if (cat === 'coaching') return 'nc-blog-pill nc-blog-pill--coaching';
    return 'nc-blog-pill';
  }

  function findPost(list, slug) {
    if (!list || !slug) return null;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].slug) === String(slug) || String(list[i].id) === String(slug)) {
        return list[i];
      }
    }
    return null;
  }

  function render(post) {
    var mount = document.getElementById('ncBlogArticleMount');
    if (!mount) return;

    if (!post) {
      mount.innerHTML =
        '<article class="nc-blog-article"><p class="nc-page-lead">Article introuvable.</p>' +
        '<p><a href="/blog/">← Retour au blog</a></p></article>';
      return;
    }

    var title = post.title || 'Article';
    document.title = title + ' | NC Consulting';
    var meta = document.getElementById('metaDesc');
    if (meta) {
      meta.setAttribute(
        'content',
        post.meta_description || post.excerpt || title
      );
    }
    var canon = document.getElementById('canonicalLink');
    if (canon) {
      canon.setAttribute(
        'href',
        'https://www.ncconsulting.ma/blog/' + encodeURIComponent(post.slug)
      );
    }

    var img = imgSrc(post.image);
    mount.innerHTML =
      '<article class="nc-blog-article" data-blog-slug="' +
      esc(post.slug) +
      '">' +
      '<header class="nc-blog-article-head">' +
      '<nav class="nc-blog-crumbs" aria-label="Fil d\'Ariane">' +
      '<a href="/">Accueil</a><span aria-hidden="true">/</span>' +
      '<a href="/blog/">Blog</a><span aria-hidden="true">/</span>' +
      '<span>' +
      esc(CAT_LABELS[post.category] || post.category || '') +
      '</span></nav>' +
      '<div class="nc-blog-card-meta">' +
      '<span class="' +
      pillClass(post.category) +
      '">' +
      esc(CAT_LABELS[post.category] || post.category || '') +
      '</span>' +
      (post.date
        ? '<time datetime="' +
          esc(post.date) +
          '">' +
          esc(formatDate(post.date)) +
          '</time>'
        : '') +
      (post.read_min
        ? '<span>' + esc(post.read_min) + ' min de lecture</span>'
        : '') +
      '</div>' +
      '<h1 class="nc-page-title">' +
      esc(title) +
      '</h1>' +
      (post.excerpt
        ? '<p class="nc-page-lead">' + esc(post.excerpt) + '</p>'
        : '') +
      '</header>' +
      (img
        ? '<figure class="nc-blog-cover"><img src="' +
          esc(img) +
          '" width="1200" height="800" alt="" decoding="async"></figure>'
        : '') +
      '<div class="nc-blog-prose" data-blog-body>' +
      (post.body_html || '') +
      '</div></article>';
  }

  var slug = getSlug();
  fetch('/api/content', { credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var post =
        data && data.ok ? findPost(data.blog, slug) : null;
      render(post);
    })
    .catch(function () {
      render(null);
    });
})();
