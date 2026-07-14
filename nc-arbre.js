/* NC Consulting — arbre déployé (accueil + decouvrir) */
(function () {
  'use strict';

  var data = window.NC_ARBRE;
  var mount = document.getElementById('ncArbre');
  if (!data || !mount) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderLeaves(leaves) {
    return leaves
      .map(function (leaf) {
        return (
          '<a class="nc-arbre__feuille" href="' +
          esc(leaf.href) +
          '"><b>' +
          esc(leaf.title) +
          ' <span class="nc-arbre__fl" aria-hidden="true">→</span></b><small>' +
          esc(leaf.text) +
          '</small></a>'
        );
      })
      .join('');
  }

  function renderSections(sections) {
    return sections
      .map(function (section) {
        var label = section.label
          ? '<div class="nc-arbre__sous">' + esc(section.label) + '</div>'
          : '';
        return (
          label +
          '<div class="nc-arbre__feuilles">' +
          renderLeaves(section.leaves || []) +
          '</div>'
        );
      })
      .join('');
  }

  function renderBranch(branch) {
    var more = branch.moreLink
      ? '<a class="nc-arbre__lien-plus" href="' +
        esc(branch.moreLink.href) +
        '">' +
        esc(branch.moreLink.text) +
        '</a>'
      : '';
    return (
      '<div class="nc-arbre__noeud" data-arbre-noeud id="arbre-' +
      esc(branch.id) +
      '">' +
      '<button type="button" class="nc-arbre__tete" aria-expanded="false">' +
      '<span class="nc-arbre__num" aria-hidden="true">' +
      esc(branch.num) +
      '</span>' +
      '<span class="nc-arbre__titre">' +
      esc(branch.title) +
      '</span>' +
      '<span class="nc-arbre__resume">' +
      esc(branch.resume) +
      '</span>' +
      '<span class="nc-arbre__croix" aria-hidden="true"></span>' +
      '</button>' +
      '<div class="nc-arbre__corps" hidden>' +
      renderSections(branch.sections || []) +
      more +
      '</div></div>'
    );
  }

  var root = data.root || {};
  var cta = data.cta || {};

  mount.innerHTML =
    '<div class="nc-arbre__barre">' +
    '<button type="button" class="nc-arbre__barre-btn" id="ncArbreOpenAll">Tout déployer</button>' +
    '<button type="button" class="nc-arbre__barre-btn" id="ncArbreCloseAll">Tout replier</button>' +
    '</div>' +
    '<div class="nc-arbre__racine">' +
    '<span class="nc-arbre__pastille" aria-hidden="true"></span>' +
    '<strong>' +
    esc(root.title || 'NC Consulting') +
    '</strong>' +
    '<span>' +
    esc(root.subtitle || '') +
    '</span></div>' +
    '<div class="nc-arbre__branche">' +
    (data.branches || []).map(renderBranch).join('') +
    '</div>' +
    '<div class="nc-arbre__cta">' +
    '<p>' +
    (cta.titleHtml || '') +
    '<small>' +
    esc(cta.subtitle || '') +
    '</small></p>' +
    '<a class="btn btn-gold nc-arbre__bouton" href="' +
    esc(cta.href || '#formulaire') +
    '">' +
    esc(cta.button || 'Demander un premier échange →') +
    '</a></div>';

  var nodes = Array.prototype.slice.call(mount.querySelectorAll('[data-arbre-noeud]'));

  function setOpen(node, open) {
    var head = node.querySelector('.nc-arbre__tete');
    var body = node.querySelector('.nc-arbre__corps');
    node.classList.toggle('is-open', open);
    if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (body) body.hidden = !open;
  }

  nodes.forEach(function (node) {
    var head = node.querySelector('.nc-arbre__tete');
    if (!head) return;
    head.addEventListener('click', function () {
      setOpen(node, !node.classList.contains('is-open'));
    });
  });

  function setAll(open) {
    nodes.forEach(function (node) {
      setOpen(node, open);
    });
  }

  var openAll = document.getElementById('ncArbreOpenAll');
  var closeAll = document.getElementById('ncArbreCloseAll');
  if (openAll) openAll.addEventListener('click', function () { setAll(true); });
  if (closeAll) closeAll.addEventListener('click', function () { setAll(false); });

  var hash = (location.hash || '').replace(/^#/, '');
  if (hash.indexOf('arbre-') === 0) {
    var target = document.getElementById(hash);
    if (target) {
      setOpen(target, true);
      window.setTimeout(function () {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }
})();
