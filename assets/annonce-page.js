/* Announcement detail page — loads by ?id= from CMS or local defaults */
(function () {
  'use strict';

  var FALLBACK = [
    {
      id: 'semaine-gratuite',
      title: "Semaine gratuite — Licences d'Excellence",
      text: 'Cette session (juillet 2026) est terminée. Réservez un premier échange pour un accompagnement personnalisé.',
      status: 'Terminée',
      date_day: '23',
      date_month: 'Juil',
      image: 'assets/annonce-semaine-gratuite.png',
      body:
        'La semaine gratuite de préparation (début 23 juillet 2026) est terminée. Pour un accompagnement concours, coaching ou conseil, réservez un premier échange de 20 minutes — Meknès ou à distance, sans engagement.',
      details:
        'Statut :: Session terminée\nAlternative :: Premier échange 20 min\nLieu :: Meknès ou à distance\nEngagement :: Aucun',
      cta_label: 'Réserver un échange →',
      cta_url: '/#formulaire',
      active: false,
      order: 99,
    },
    {
      id: 'nouveaux-creneaux',
      title: 'Premier échange de 20 min — Meknès ou à distance',
      text: 'Confidentiel, sans engagement. On clarifie votre besoin et la meilleure façon d\'avancer.',
      status: 'Sur rendez-vous',
      date_day: '—',
      date_month: 'Échange',
      image: '',
      body:
        "Réservez un premier échange confidentiel avec NC Consulting. On clarifie votre besoin (coaching, conseil ou préparation concours) et on définit la meilleure façon d'avancer — sans engagement.",
      details:
        'Durée :: 20 minutes\nLieu :: Meknès ou à distance\nEngagement :: Aucun\nRéponse :: Sous 24h',
      cta_label: 'Demander un échange →',
      cta_url: '/#formulaire',
      active: true,
      order: 1,
    },
  ];

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getId() {
    try {
      return new URLSearchParams(window.location.search).get('id') || '';
    } catch (e) {
      return '';
    }
  }

  function parseDetails(detailsStr) {
    return String(detailsStr || '')
      .split('\n')
      .map(function (l) { return l.trim(); })
      .filter(Boolean)
      .map(function (line) {
        var parts = line.split('::');
        if (parts.length >= 2) {
          return { label: parts[0].trim(), value: parts.slice(1).join('::').trim() };
        }
        return { label: '', value: line };
      });
  }

  function render(a) {
    var mount = document.getElementById('ncAnnDetailMount');
    if (!mount) return;

    if (!a) {
      mount.innerHTML =
        '<div class="nc-ann-detail__missing">' +
        '<p>Cette annonce est introuvable ou n’est plus disponible.</p>' +
        '<p><a href="/#annonces">Retour aux annonces</a></p>' +
        '</div>';
      document.title = 'Annonce introuvable — NC Consulting';
      return;
    }

    var title = a.title || a.text || 'Annonce';
    document.title = title + ' — NC Consulting';
    var desc = document.querySelector('meta[name="description"]');
    if (desc && (a.text || a.body)) {
      desc.setAttribute('content', String(a.text || a.body).slice(0, 160));
    }

    var facts = parseDetails(a.details);
    var factsHtml = facts.length
      ? '<ul class="nc-ann-detail__facts">' +
        facts
          .map(function (f) {
            return (
              '<li>' +
              (f.label ? '<b>' + esc(f.label) + '</b>' : '') +
              '<span>' +
              esc(f.value) +
              '</span></li>'
            );
          })
          .join('') +
        '</ul>'
      : '';

    var mediaHtml = a.image
      ? '<div class="nc-ann-detail__media">' +
        '<img src="' +
        esc(a.image) +
        '" alt="' +
        esc(title) +
        '" width="900" height="1125" decoding="async">' +
        '</div>'
      : '<div class="nc-ann-detail__media"><div class="nc-ann-detail__media-empty">Aucune affiche pour cette annonce</div></div>';

    var ctaLabel = a.cta_label || 'En savoir plus →';
    var ctaUrl = a.cta_url || '/#formulaire';

    mount.innerHTML =
      '<div class="nc-ann-detail__grid">' +
      mediaHtml +
      '<div class="nc-ann-detail__copy">' +
      '<div class="nc-ann-detail__meta">' +
      (a.date_day || a.date_month
        ? '<div class="nc-ann-detail__date-pill">' +
          esc(a.date_day || '') +
          (a.date_month ? ' <span>' + esc(a.date_month) + '</span>' : '') +
          '</div>'
        : '') +
      (a.status
        ? '<span class="nc-ann-detail__status">' + esc(a.status) + '</span>'
        : '') +
      '</div>' +
      '<h1>' +
      esc(title) +
      '</h1>' +
      (a.text ? '<p class="nc-ann-detail__lead">' + esc(a.text) + '</p>' : '') +
      (a.body ? '<p class="nc-ann-detail__body">' + esc(a.body) + '</p>' : '') +
      factsHtml +
      '<div class="nc-ann-detail__actions">' +
      '<a class="btn btn-gold" href="' +
      esc(ctaUrl) +
      '">' +
      esc(ctaLabel) +
      '</a>' +
      '<a class="btn btn-ghost-dark" href="/#annonces">Toutes les annonces</a>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function findIn(list, id) {
    if (!list || !id) return null;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === String(id) && list[i].active !== false) {
        return list[i];
      }
    }
    return null;
  }

  function boot() {
    var id = getId();
    if (!id) {
      render(null);
      return;
    }

    var local = findIn(FALLBACK, id);
    if (local) render(local);

    fetch('/api/content', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || !data.ok || !data.announcements) return;
        var found = findIn(data.announcements, id);
        if (found) render(found);
        else if (!local) render(null);
      })
      .catch(function () {
        if (!local) render(null);
      });
  }

  /* Theme toggle (same pattern as site) */
  var toggle = document.getElementById('ncThemeToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var root = document.documentElement;
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (next === 'dark') root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
      try { localStorage.setItem('nc-theme', next); } catch (e) {}
      toggle.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    });
  }

  boot();
})();
