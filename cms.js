'use strict';

/**
 * Hydrates CMS content from /api/content onto the public site.
 * Built-in HTML is the fallback when the API is unavailable.
 */
(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setText(key, value) {
    if (value == null || value === '') return;
    document.querySelectorAll('[data-cms="' + key + '"]').forEach(function (el) {
      el.textContent = value;
    });
  }

  function setHtml(key, value) {
    if (value == null || value === '') return;
    document.querySelectorAll('[data-cms-html="' + key + '"]').forEach(function (el) {
      el.innerHTML = value;
    });
  }

  function setHref(key, value) {
    if (!value) return;
    document.querySelectorAll('[data-cms-href="' + key + '"]').forEach(function (el) {
      el.setAttribute('href', value);
    });
  }

  function applyMetrics(content) {
    [1, 2, 3].forEach(function (i) {
      var val = content['hero.metric.' + i + '_value'];
      var suffix = content['hero.metric.' + i + '_suffix'];
      document
        .querySelectorAll('[data-cms-metric="' + i + '"]')
        .forEach(function (el) {
          if (val != null && val !== '') {
            el.textContent = val;
            el.setAttribute('data-to', val);
          }
        });
      if (suffix != null && suffix !== '') {
        document
          .querySelectorAll('[data-cms-metric-suffix="' + i + '"]')
          .forEach(function (el) {
            el.textContent = suffix;
          });
      }
    });
  }

  function applyPromoTitle(content) {
    var title = content['promo.title'];
    var highlight = content['promo.title_highlight'];
    if (!title) return;
    document.querySelectorAll('[data-cms-title="promo.title"]').forEach(function (el) {
      if (highlight && title.indexOf(highlight) !== -1) {
        var before = title.slice(0, title.indexOf(highlight));
        var after = title.slice(title.indexOf(highlight) + highlight.length);
        el.innerHTML =
          esc(before) + '<span>' + esc(highlight) + '</span>' + esc(after);
      } else {
        el.textContent = title;
      }
    });
  }

  function applyPromoBar(content) {
    var reserved = Number(content['promo.places_reserved']);
    var total = Number(content['promo.places_total']);
    var bar = document.getElementById('ncPromoBar');
    var places = document.getElementById('ncPromoPlaces');
    if (!Number.isFinite(reserved) || !Number.isFinite(total) || total <= 0) return;
    var pct = Math.min(100, Math.max(0, Math.round((reserved / total) * 100)));
    if (bar) bar.style.width = pct + '%';
    if (places) {
      places.innerHTML = esc(String(reserved)) + '&nbsp;/&nbsp;' + esc(String(total));
    }
  }

  function applyPromoCta(content) {
    var url = content['promo.cta_url'];
    var cta = document.getElementById('ncPromoCta');
    if (cta && url) cta.href = url;
  }

  function renderLinesList(container, lines, itemFn) {
    if (!container || !lines.length) return;
    container.innerHTML = lines.map(itemFn).join('');
  }

  function parseLines(str) {
    return String(str || '')
      .split('\n')
      .map(function (l) { return l.trim(); })
      .filter(Boolean);
  }

  function applyLineLists(content) {
    document.querySelectorAll('[data-cms-list]').forEach(function (el) {
      var key = el.getAttribute('data-cms-list');
      var lines = parseLines(content[key]);
      if (!lines.length) return;
      var kind = el.getAttribute('data-cms-list-type') || 'check';
      if (kind === 'pole') {
        renderLinesList(el, lines, function (line) {
          return (
            '<li><span class="nc-poles-job-dot"></span>' + esc(line) + '</li>'
          );
        });
      } else if (kind === 'check') {
        renderLinesList(el, lines, function (line) {
          return '<li><span class="chk">✓</span>' + esc(line) + '</li>';
        });
      } else {
        renderLinesList(el, lines, function (line) {
          return '<li>' + esc(line) + '</li>';
        });
      }
    });
  }

  function applyChips(content) {
    document.querySelectorAll('[data-cms-chips]').forEach(function (el) {
      var key = el.getAttribute('data-cms-chips');
      var chips = String(content[key] || '')
        .split(',')
        .map(function (c) { return c.trim(); })
        .filter(Boolean);
      if (!chips.length) return;
      el.innerHTML = chips
        .map(function (c) {
          return '<span class="nc-chip">' + esc(c) + '</span>';
        })
        .join('');
    });
  }

  function renderAnnouncements(list) {
    var track = document.getElementById('ncAlertTrack');
    if (!track || !list || !list.length) return;
    var items = list
      .map(function (a) {
        return '<span class="nc-alert-item">' + esc(a.text) + '</span>';
      })
      .join('');
    track.innerHTML = items + items;
  }

  function renderTrust(list) {
    var track = document.getElementById('ncTrustTrack');
    if (!track || !list || !list.length) return;
    var items = list
      .map(function (t) {
        return (
          '<span class="nc-trust-item"><b>' +
          esc(t.bold) +
          '</b> ' +
          esc(t.text) +
          '</span>'
        );
      })
      .join('');
    track.innerHTML = items + items;
  }

  function parseItems(itemsStr) {
    return parseLines(itemsStr);
  }

  function renderFormationCard(f) {
    var lines = parseItems(f.items);
    var hasPacks = lines.some(function (line) { return line.indexOf('::') !== -1; });
    var listClass = hasPacks ? 'nc-packs' : 'nc-filieres';
    var listHtml = lines
      .map(function (line) {
        var parts = line.split('::');
        if (parts.length >= 2) {
          return (
            '<li><span class="nc-pack-name">' +
            esc(parts[0].trim()) +
            '</span><span class="nc-pack-desc">' +
            esc(parts.slice(1).join('::').trim()) +
            '</span></li>'
          );
        }
        return '<li>' + esc(line) + '</li>';
      })
      .join('');
    var ctaUrl = f.cta_url || '#';
    return (
      '<div class="nc-concours-card">' +
      '<span class="nc-concours-card-tag">' + esc(f.tag) + '</span>' +
      '<h3>' + esc(f.title) + '</h3>' +
      '<p>' + esc(f.subtitle) + '</p>' +
      '<ul class="' + listClass + '">' + listHtml + '</ul>' +
      '<a class="btn btn-gold nc-concours-cta" href="' + esc(ctaUrl) +
      '" target="_blank" rel="noopener noreferrer">Réserver ma place →</a>' +
      '</div>'
    );
  }

  function renderFormations(list) {
    var container = document.getElementById('ncFormations');
    if (!container || !list || !list.length) return;
    container.innerHTML = list.map(renderFormationCard).join('');
  }

  function slugifyLabel(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  var TRUST_HINTS = {
    'dirigeants-pme': 'Arbitrages de croissance et feuilles de route clarifiées.',
    'cadres-superieurs': 'Leadership affirmé et coaching exécutif structuré.',
    entrepreneurs: 'Structuration de projet et priorités stratégiques.',
    'institutions-publiques': 'Montée en compétences des équipes et du pilotage.',
    'profils-en-transition': 'Reconversion et repositionnement professionnel avec suivi.',
  };

  function trustHintFor(label) {
    return TRUST_HINTS[slugifyLabel(label)] || 'Profils accompagnés par NC Consulting à Meknès et à distance.';
  }

  function renderFaq(list) {
    var container = document.getElementById('ncFaq');
    if (!container || !list || !list.length) return;
    container.innerHTML = list
      .filter(function (q) { return q.active !== false; })
      .map(function (q, i) {
        var open = i === 0 ? ' open' : '';
        return (
          '<div class="nc-faq-item' + open + '">' +
          '<button class="nc-faq-q" type="button">' +
          esc(q.question) +
          '<span class="nc-faq-ico" aria-hidden="true">+</span></button>' +
          '<div class="nc-faq-a"><p>' + esc(q.answer) + '</p></div></div>'
        );
      })
      .join('');
    if (typeof window.ncReinitUi === 'function') window.ncReinitUi();
  }

  function renderCases(list) {
    var container = document.getElementById('ncCases');
    if (!container || !list || !list.length) return;
    container.innerHTML = list
      .map(function (c) {
        return (
          '<article class="nc-case-card">' +
          '<div class="nc-case-tag">' + esc(c.tag) + '</div>' +
          '<h3>' + esc(c.title) + '</h3>' +
          '<p>' + esc(c.description) + '</p>' +
          '<span class="nc-case-outcome">' + esc(c.outcome) + '</span>' +
          '</article>'
        );
      })
      .join('');
  }

  function renderClients(list) {
    var container = document.getElementById('ncClientQuiz');
    if (!container || !list || !list.length) return;
    container.innerHTML = list
      .filter(function (c) { return c.active !== false; })
      .map(function (c) {
        var slug = slugifyLabel(c.label);
        var hint = trustHintFor(c.label);
        return (
          '<a class="nc-trust-card" href="cabinet.html#confiance-' +
          esc(slug) +
          '" role="listitem">' +
          '<span class="nc-trust-card__icon" aria-hidden="true">◆</span>' +
          '<h4 class="nc-trust-card__title">' +
          esc(c.label) +
          '</h4>' +
          '<p class="nc-trust-card__hint">' +
          esc(hint) +
          '</p>' +
          '<span class="nc-trust-card__cta">Découvrir →</span>' +
          '</a>'
        );
      })
      .join('');
    if (typeof window.ncReinitUi === 'function') window.ncReinitUi();
  }

  function applyContent(data) {
    var content = data.content || {};

    Object.keys(content).forEach(function (key) {
      if (key.indexOf('_html') === key.length - 5) return;
      if (key === 'promo.title') return;
      if (key.indexOf('hero.metric.') === 0) return;
      if (key.indexOf('promo.places_') === 0) return;
      if (key === 'promo.cta_url') return;
      setText(key, content[key]);
    });

    Object.keys(content).forEach(function (key) {
      if (key.indexOf('_html') === key.length - 5) setHtml(key, content[key]);
    });

    setHref('contact.phone_tel', 'tel:' + (content['contact.phone_tel'] || ''));
    setHref('contact.email', 'mailto:' + (content['contact.email'] || ''));

    applyMetrics(content);
    applyPromoTitle(content);
    applyPromoBar(content);
    applyPromoCta(content);
    applyLineLists(content);
    applyChips(content);

    renderAnnouncements(data.announcements);
    renderTrust(data.trust);
    renderFormations(data.formations);
    renderFaq(data.faq);
    renderCases(data.cases);
    renderClients(data.clients);
  }

  fetch('/api/content', { credentials: 'same-origin' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && data.ok) applyContent(data);
    })
    .catch(function () { /* keep built-in markup */ });
})();
