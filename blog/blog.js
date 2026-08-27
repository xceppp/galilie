/* Blog hub — hydrate from CMS + filters/search + sticky CTA + article progress */
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

  function normalize(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso + 'T12:00:00');
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return iso;
    }
  }

  function imgSrc(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.charAt(0) === '/') return path;
    return '../' + path.replace(/^\.\.\//, '');
  }

  function pillClass(cat) {
    if (cat === 'concours') return 'nc-blog-pill nc-blog-pill--concours';
    if (cat === 'reprise') return 'nc-blog-pill nc-blog-pill--reprise';
    if (cat === 'coaching') return 'nc-blog-pill nc-blog-pill--coaching';
    return 'nc-blog-pill';
  }

  function postHref(slug) {
    var s = String(slug || '').replace(/\.html$/i, '');
    return '/blog/' + encodeURIComponent(s) + '.html';
  }

  function renderHub(posts) {
    var featuredMount = document.getElementById('ncBlogFeaturedMount');
    var listMount = document.querySelector('[data-blog-list]');
    if (!listMount) return;

    var featured =
      posts.filter(function (p) { return p.featured; })[0] || posts[0] || null;
    var rest = posts.filter(function (p) {
      return !featured || p.slug !== featured.slug;
    });

    if (featuredMount && featured) {
      var fImg = imgSrc(featured.image);
      featuredMount.innerHTML =
        '<article class="nc-blog-featured" data-blog-cat="' +
        esc(featured.category || '') +
        '" data-blog-slug="' +
        esc(featured.slug) +
        '" data-blog-search="' +
        esc(
          (featured.title || '') +
            ' ' +
            (featured.excerpt || '') +
            ' ' +
            (featured.category || '')
        ) +
        '">' +
        (fImg
          ? '<a class="nc-blog-featured-visual" href="' +
            postHref(featured.slug) +
            '" tabindex="-1" aria-hidden="true"><img src="' +
            esc(fImg) +
            '" width="180" height="120" alt="" decoding="async"></a>'
          : '') +
        '<div class="nc-blog-featured-body">' +
        '<span class="nc-blog-badge-une">À la une</span>' +
        '<span class="' +
        pillClass(featured.category) +
        '">' +
        esc(CAT_LABELS[featured.category] || featured.category || '') +
        '</span>' +
        '<h2><a href="' +
        postHref(featured.slug) +
        '">' +
        esc(featured.title) +
        '</a></h2>' +
        (featured.excerpt ? '<p>' + esc(featured.excerpt) + '</p>' : '') +
        '<div class="nc-blog-card-meta">' +
        (featured.read_min
          ? '<span>' + esc(featured.read_min) + ' min de lecture</span>'
          : '') +
        (featured.date
          ? '<span class="nc-blog-meta-sep" aria-hidden="true">·</span><time datetime="' +
            esc(featured.date) +
            '">' +
            esc(formatDate(featured.date)) +
            '</time>'
          : '') +
        '</div></div></article>';
    }

    listMount.innerHTML = rest
      .map(function (p) {
        var img = imgSrc(p.image);
        var noart = img ? '' : ' nc-blog-card--noart';
        return (
          '<article class="nc-blog-card' +
          noart +
          '" data-blog-slug="' +
          esc(p.slug) +
          '" data-blog-cat="' +
          esc(p.category || '') +
          '" data-blog-search="' +
          esc((p.title || '') + ' ' + (p.excerpt || '') + ' ' + (p.category || '')) +
          '">' +
          (img
            ? '<a class="nc-blog-card-art" href="' +
              postHref(p.slug) +
              '" tabindex="-1" aria-hidden="true"><img src="' +
              esc(img) +
              '" alt="" width="800" height="800" loading="lazy" decoding="async"></a>'
            : '') +
          '<div class="nc-blog-card-body">' +
          '<span class="' +
          pillClass(p.category) +
          '">' +
          esc(CAT_LABELS[p.category] || p.category || '') +
          '</span>' +
          '<h2 class="nc-blog-card-title"><a href="' +
          postHref(p.slug) +
          '">' +
          esc(p.title) +
          '</a></h2>' +
          (p.excerpt
            ? '<p class="nc-blog-card-excerpt">' + esc(p.excerpt) + '</p>'
            : '') +
          '<div class="nc-blog-card-foot">' +
          (p.read_min ? '<span>' + esc(p.read_min) + ' min</span>' : '') +
          (p.date
            ? '<time datetime="' +
              esc(p.date) +
              '">' +
              esc(formatDate(p.date)) +
              '</time>'
            : '') +
          '</div></div></article>'
        );
      })
      .join('');

    wireFilters();
  }

  var activeFilter = 'all';
  var filterBtns;
  var searchInput;

  function matchesSearch(el, q) {
    if (!q) return true;
    var hay =
      (el.getAttribute('data-blog-search') || '') + ' ' + (el.textContent || '');
    return normalize(hay).indexOf(q) !== -1;
  }

  function applyFilters() {
    var cards = document.querySelectorAll('[data-blog-list] .nc-blog-card');
    var featured = document.querySelector('.nc-blog-featured');
    var q = searchInput ? normalize(searchInput.value.trim()) : '';
    cards.forEach(function (c) {
      var cat = c.getAttribute('data-blog-cat') || '';
      var okCat = activeFilter === 'all' || cat === activeFilter;
      c.classList.toggle('is-hidden', !(okCat && matchesSearch(c, q)));
    });
    if (featured) {
      var fc = featured.getAttribute('data-blog-cat') || '';
      var okFeatCat = activeFilter === 'all' || fc === activeFilter;
      featured.classList.toggle(
        'is-hidden',
        !(okFeatCat && matchesSearch(featured, q))
      );
    }
  }

  function wireFilters() {
    filterBtns = document.querySelectorAll('.nc-blog-filters [data-filter]');
    searchInput = document.getElementById('ncBlogSearch');
    filterBtns.forEach(function (btn) {
      btn.onclick = function () {
        filterBtns.forEach(function (b) {
          b.classList.toggle('is-on', b === btn);
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        activeFilter = btn.getAttribute('data-filter') || 'all';
        applyFilters();
      };
    });
    if (searchInput) {
      searchInput.oninput = applyFilters;
    }
    applyFilters();
  }

  /* Sticky conversion dock */
  var dock = document.getElementById('ncBlogCtaDock');
  var banner = document.getElementById('ncBlogCtaBanner');
  if (dock && banner) {
    function updateDock() {
      var sc = window.scrollY || document.documentElement.scrollTop;
      var br = banner.getBoundingClientRect();
      var nearBanner = br.top < window.innerHeight * 0.92 && br.bottom > 0;
      var show = sc > 380 && !nearBanner;
      dock.hidden = !show;
      dock.classList.toggle('is-on', show);
    }
    window.addEventListener('scroll', updateDock, { passive: true });
    window.addEventListener('resize', updateDock);
    updateDock();
  }

  /* Article reading progress */
  var bar = document.querySelector('.nc-blog-read-progress');
  var article = document.querySelector('.nc-blog-article');
  if (bar && article) {
    function update() {
      var rect = article.getBoundingClientRect();
      var top = window.scrollY + rect.top;
      var h = article.offsetHeight - window.innerHeight;
      var y = window.scrollY - top;
      var p = h > 0 ? Math.max(0, Math.min(100, (y / h) * 100)) : 0;
      if (window.scrollY < top) p = 0;
      bar.style.width = p + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* Hub hydration */
  if (document.querySelector('[data-blog-list]') || document.getElementById('ncBlogFeaturedMount')) {
    fetch('/api/content', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.ok && Array.isArray(data.blog) && data.blog.length) {
          renderHub(data.blog);
        } else {
          wireFilters();
        }
      })
      .catch(function () {
        wireFilters();
      });
  }
})();
