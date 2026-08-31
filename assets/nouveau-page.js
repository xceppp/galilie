/* Nouveau detail — heures extra Licence / Master → formulaire */
(function () {
  'use strict';

  var TYPE_LABELS = {
    master: 'Master',
    lpro: 'Temps aménagé',
    lex: "Licence d'Excellence",
  };

  var FALLBACK = [
    {
      id: 'nv-heures-master',
      type: 'master',
      title: 'Heures extra — Master',
      summary:
        'Ajoutez des heures 1-à-1 pour préparer votre accès Master : oral, projet pro, finance / management.',
      status: 'Places ouvertes',
      etab: 'NC Consulting',
      deadline: 'Sur rendez-vous',
      ville: 'Meknès & visio',
      facts:
        'Format :: Coaching 1-à-1\nObjectif :: Accès Master\nLieu :: Meknès ou à distance\nEntrée :: Formulaire NC',
      body:
        'Vous visez un Master ? Rejoignez NC Consulting pour des heures extra ciblées — dossier, oral et argumentaire — puis inscrivez-vous via le formulaire.',
      nc_angle:
        'On calibre le volume d’heures selon votre calendrier et votre filière, puis on enchaîne sur un plan concret jusqu’à l’admission.',
      cta_url: '/form.html?intent=concours&programme=master',
      active: true,
    },
    {
      id: 'nv-heures-licence',
      type: 'lex',
      title: 'Heures extra — Licence d’Excellence',
      summary:
        'Renforcez oral, bases et méthode avant le concours Licence — sessions dédiées avec NC Consulting.',
      status: 'Places ouvertes',
      etab: 'NC Consulting',
      deadline: 'Sur rendez-vous',
      ville: 'Meknès & visio',
      facts:
        'Format :: Coaching 1-à-1\nObjectif :: Concours Licence\nLieu :: Meknès ou à distance\nEntrée :: Formulaire NC',
      body:
        'Vous préparez une Licence d’Excellence ou Licence Pro ? Rejoignez les heures extra NC, puis le formulaire pour réserver votre créneau.',
      nc_angle:
        'Même exigence qu’à l’oral du concours : clarté, bases solides, tenue sous pression — avec un suivi jusqu’aux résultats.',
      cta_url: '/form.html?intent=concours&programme=licence',
      active: true,
    },
    {
      id: 'nv-heures-amenage',
      type: 'lpro',
      title: 'Heures extra — temps aménagé',
      summary:
        'Vous travaillez et visez Licence / Master aménagé ? On calibre des heures compatibles avec votre emploi.',
      status: 'Sur rendez-vous',
      etab: 'NC Consulting',
      deadline: 'Flexible',
      ville: 'Meknès & visio',
      facts:
        'Format :: Sessions courtes\nPublic :: Salariés / reprise\nLieu :: Meknès ou à distance\nEntrée :: Formulaire NC',
      body:
        'Planning réaliste, sessions courtes et régulières, suivi jusqu’au concours — sans quitter votre activité.',
      nc_angle:
        'Un premier échange de 20 min suffit pour voir si le volume d’heures est tenable avec votre emploi du temps.',
      cta_url: '/form.html?intent=concours',
      active: true,
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

  function parseFacts(factsStr) {
    return String(factsStr || '')
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

  function typeClass(type) {
    if (type === 'master') return 'nc-nouveau-type--master';
    if (type === 'lex') return 'nc-nouveau-type--lex';
    return '';
  }

  function formHref(n) {
    if (n && n.cta_url) return n.cta_url;
    var type = (n && n.type) || 'master';
    if (type === 'master') return '/form.html?intent=concours&programme=master';
    if (type === 'lex' || type === 'lpro') return '/form.html?intent=concours&programme=licence';
    return '/form.html?intent=concours';
  }

  function render(n) {
    var mount = document.getElementById('ncNouveauDetailMount');
    if (!mount) return;

    if (!n) {
      mount.innerHTML =
        '<div class="nc-ann-detail__missing">' +
        '<p>Ce créneau est introuvable ou n’est plus disponible.</p>' +
        '<p><a href="/form.html?intent=concours">Aller au formulaire</a> · <a href="/#nouveau">Retour aux heures extra</a></p>' +
        '</div>';
      return;
    }

    var type = n.type || 'master';
    var facts = parseFacts(n.facts);
    if (!facts.length) {
      if (n.etab) facts.push({ label: 'Avec', value: n.etab });
      if (n.deadline) facts.push({ label: 'Disponibilité', value: n.deadline });
      if (n.ville) facts.push({ label: 'Lieu', value: n.ville });
      if (n.status) facts.push({ label: 'Statut', value: n.status });
    }

    document.title = (n.title || 'Heures extra') + ' — NC Consulting';

    var factsHtml = facts
      .map(function (f) {
        return (
          '<div class="nc-nouveau-detail__fact">' +
          (f.label ? '<span>' + esc(f.label) + '</span>' : '') +
          '<b>' +
          esc(f.value) +
          '</b></div>'
        );
      })
      .join('');

    mount.innerHTML =
      '<div class="nc-blog-card-meta" style="margin-bottom:12px">' +
      '<span class="nc-nouveau-type ' +
      typeClass(type) +
      '">' +
      esc(TYPE_LABELS[type] || type) +
      '</span>' +
      (n.status
        ? '<span class="nc-nouveau-status">' + esc(n.status) + '</span>'
        : '') +
      '</div>' +
      '<h1 class="nc-page-title">' +
      esc(n.title || 'Heures extra') +
      '</h1>' +
      (n.summary
        ? '<p class="nc-page-lead">' + esc(n.summary) + '</p>'
        : '') +
      (factsHtml
        ? '<div class="nc-nouveau-detail__facts">' + factsHtml + '</div>'
        : '') +
      (n.body
        ? '<div class="nc-ann-detail__body"><p>' +
          esc(n.body).replace(/\n/g, '</p><p>') +
          '</p></div>'
        : '') +
      (n.nc_angle
        ? '<h2 class="nc-title" style="font-size:1.25rem;margin:28px 0 10px">L’angle NC Consulting</h2><p>' +
          esc(n.nc_angle) +
          '</p>'
        : '') +
      '<div class="nc-nouveau-detail__nc">' +
      '<h3>Rejoindre les heures extra</h3>' +
      '<p>Premier échange de 20 min — on calibre Licence ou Master, le volume d’heures, et le format (Meknès ou visio).</p>' +
      '<a class="btn btn-gold" href="' +
      esc(formHref(n)) +
      '">Aller au formulaire →</a>' +
      '</div>';
  }

  function findIn(list, id) {
    if (!list || !id) return null;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === String(id)) return list[i];
    }
    return null;
  }

  var id = getId();
  fetch('/api/content', { credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var hit = data && data.ok ? findIn(data.nouveau, id) : null;
      render(hit || findIn(FALLBACK, id) || (id ? null : FALLBACK[0]));
    })
    .catch(function () {
      render(findIn(FALLBACK, id) || (id ? null : FALLBACK[0]));
    });
})();
