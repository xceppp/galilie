/* Nouveau detail — préparation Bac → formulaire */
(function () {
  'use strict';

  var FALLBACK = [
    {
      id: 'nv-bac-seg',
      type: 'seg',
      title: 'Sciences Économiques & Gestion',
      summary:
        'Pack National ou À la carte — Économie, Comptabilité, EOAE, Mathématiques.',
      status: 'Places ouvertes',
      etab: 'NC Consulting',
      deadline: 'Sur rendez-vous',
      ville: 'Meknès & à distance',
      facts:
        'Filière :: 2è BAC SEG\nOptions :: Pack National | À la carte\nLieu :: Meknès ou à distance\nMotto :: Confiance, Méthode, Résultat',
      body:
        'Préparation à l’examen national — Cours de soutien · Méthode · Exercices · Examens nationaux. Pour les deux options du Bac : Sciences Économiques | Sciences de Gestion Comptable.',
      nc_angle:
        'Encadrement par professeur agrégé & docteur · Préparation ciblée Bac marocain · Exercices & examens nationaux corrigés.',
      cta_url: '/form.html?intent=concours&programme=seg',
      active: true,
      order: 1,
    },
    {
      id: 'nv-bac-sma',
      type: 'sma',
      title: 'Sciences Mathématiques A & B',
      summary:
        'Deux parcours, un même objectif : votre réussite ! Maths, Physique-Chimie, SVT ou SI, Anglais, Philosophie.',
      status: 'Places ouvertes',
      etab: 'NC Consulting',
      deadline: 'Sur rendez-vous',
      ville: 'Meknès & à distance',
      facts:
        'Parcours :: Sciences Mathématiques A & B\nOffre :: Cours, fiches, sujets corrigés\nLieu :: Meknès ou à distance\nFormat :: Groupes réduits',
      body:
        'Programme de l’examen national — Sciences Mathématiques A (SVT) et B (Sciences de l’Ingénieur). Plus qu’un soutien, un vrai accompagnement !',
      nc_angle:
        'Cours clairs et structurés · Fiches de cours et résumés · Sujets des années précédentes corrigés · Conseils d’orientation.',
      cta_url: '/form.html?intent=concours&programme=sma',
      active: true,
      order: 2,
    },
    {
      id: 'nv-bac-exp',
      type: 'exp',
      title: 'Sciences Expérimentales',
      summary:
        'Mathématiques, Physique et Chimie, SVT, Anglais, Philosophie — petits groupes, suivi personnalisé.',
      status: 'Places ouvertes',
      etab: 'NC Consulting',
      deadline: 'Sur rendez-vous',
      ville: 'Meknès & à distance',
      facts:
        'Au programme :: 5 matières\nOffre :: Cours, fiches, examens corrigés\nLieu :: Meknès ou à distance\nMotto :: Confiance Méthode Résultats',
      body:
        'Un accompagnement complet pour un excellent résultat ! Mathématiques, Physique et Chimie, Sciences de la Vie et de la Terre, Anglais, Philosophie.',
      nc_angle:
        'Cours clairs et structurés · Fiches de cours et résumés · Exercices et sujets d’examens corrigés · Petits groupes pour un meilleur encadrement.',
      cta_url: '/form.html?intent=concours&programme=exp',
      active: true,
      order: 3,
    },
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getId() {
    try {
      return new URLSearchParams(location.search).get('id') || '';
    } catch (e) {
      return '';
    }
  }

  function ctaFor(n) {
    if (n.cta_url) return n.cta_url;
    var type = n.type || '';
    if (type === 'seg') return '/form.html?intent=concours&programme=seg';
    if (type === 'sma') return '/form.html?intent=concours&programme=sma';
    if (type === 'exp') return '/form.html?intent=concours&programme=exp';
    return '/form.html?intent=concours';
  }

  function factsHtml(facts) {
    if (!facts) return '';
    return (
      '<ul class="nc-ann-detail__facts">' +
      String(facts)
        .split('\n')
        .filter(Boolean)
        .map(function (line) {
          var parts = line.split('::');
          if (parts.length > 1) {
            return (
              '<li><b>' +
              esc(parts[0].trim()) +
              '</b> ' +
              esc(parts.slice(1).join('::').trim()) +
              '</li>'
            );
          }
          return '<li>' + esc(line) + '</li>';
        })
        .join('') +
      '</ul>'
    );
  }

  function render(n) {
    if (!n) {
      document.getElementById('nvDetail').innerHTML =
        '<p><a href="/form.html?intent=concours">Aller au formulaire</a> · <a href="/#nouveau">Retour à la préparation Bac</a></p>';
      return;
    }
    document.title = (n.title || 'Préparation Bac') + ' — NC Consulting';
    var root = document.getElementById('nvDetail');
    if (!root) return;
    root.innerHTML =
      '<article class="nc-ann-detail__card">' +
      '<div class="nc-ann-detail__meta">' +
      '<span class="nc-nouveau-type">' +
      esc(n.type || 'Bac') +
      '</span>' +
      (n.status ? '<span class="nc-nouveau-status">' + esc(n.status) + '</span>' : '') +
      '</div>' +
      '<h1>' +
      esc(n.title || 'Préparation Bac') +
      '</h1>' +
      (n.summary ? '<p class="lead">' + esc(n.summary) + '</p>' : '') +
      factsHtml(n.facts) +
      (n.body ? '<div class="nc-ann-detail__body"><p>' + esc(n.body) + '</p></div>' : '') +
      (n.nc_angle
        ? '<div class="nc-ann-detail__nc"><h3>Notre approche</h3><p>' +
          esc(n.nc_angle) +
          '</p></div>'
        : '') +
      '<div class="nc-ann-detail__cta">' +
      '<h3>Rejoindre la préparation Bac</h3>' +
      '<a class="btn btn-gold btn-lg" href="' +
      esc(ctaFor(n)) +
      '">Aller au formulaire →</a>' +
      '</div>' +
      '</article>';
  }

  function boot(list) {
    var id = getId();
    var items = (list && list.length ? list : FALLBACK).filter(function (x) {
      return x && x.active !== false;
    });
    var found = items.find(function (x) {
      return x.id === id;
    });
    render(found || items[0] || null);
  }

  fetch('/api/content', { credentials: 'same-origin' })
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (data) {
      boot(data && data.nouveau);
    })
    .catch(function () {
      boot(FALLBACK);
    });
})();
