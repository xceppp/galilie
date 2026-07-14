/* NC Consulting — explorateur en arbre (decouvrir.html) */
(function () {
  'use strict';

  var tree = window.NC_TREE;
  if (!tree) return;

  var navEl = document.getElementById('ncTreeNav');
  var panelEl = document.getElementById('ncTreePanel');
  if (!navEl || !panelEl) return;

  var embedMode = !!document.getElementById('ncTreeSection');

  var flat = {};

  function indexNode(node, parent) {
    flat[node.id] = { node: node, parent: parent || null };
    (node.children || []).forEach(function (child) {
      indexNode(child, node);
    });
  }
  indexNode(tree, null);

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pathLabels(node) {
    var parts = [];
    var cur = node;
    while (cur) {
      parts.unshift(cur.label);
      cur = flat[cur.id] && flat[cur.id].parent;
    }
    return parts;
  }

  function renderBranch(node, depth) {
    var hasKids = node.children && node.children.length > 0;
    var li = document.createElement('li');
    li.className = 'nc-tree-node' + (hasKids ? ' has-children' : '');
    li.setAttribute('data-tree-id', node.id);

    var row = document.createElement('div');
    row.className = 'nc-tree-row';
    row.style.setProperty('--depth', String(depth));

    if (hasKids) {
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nc-tree-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Développer ' + node.label);
      toggle.innerHTML = '<span class="nc-tree-chevron" aria-hidden="true"></span>';
      row.appendChild(toggle);
    } else {
      var dot = document.createElement('span');
      dot.className = 'nc-tree-leaf-dot';
      dot.setAttribute('aria-hidden', 'true');
      row.appendChild(dot);
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nc-tree-label';
    btn.textContent = node.label;
    btn.setAttribute('data-tree-select', node.id);
    row.appendChild(btn);
    li.appendChild(row);

    if (hasKids) {
      var sub = document.createElement('ul');
      sub.className = 'nc-tree-children';
      sub.hidden = true;
      node.children.forEach(function (child) {
        sub.appendChild(renderBranch(child, depth + 1));
      });
      li.appendChild(sub);

      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = sub.hidden;
        sub.hidden = !open;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        li.classList.toggle('is-open', open);
      });
    }

    btn.addEventListener('click', function () {
      selectNode(node.id, true);
    });

    return li;
  }

  function renderPanel(node) {
    var crumbs = pathLabels(node);
    var kids = node.children || [];
    var html = '';
    html += '<p class="nc-tree-panel__crumb">' + esc(crumbs.join(' › ')) + '</p>';
    html += '<h2 class="nc-tree-panel__title">' + esc(node.label) + '</h2>';
    html += '<p class="nc-tree-panel__summary">' + esc(node.summary || '') + '</p>';

    if (kids.length) {
      html += '<div class="nc-tree-panel__subs"><p class="nc-tree-panel__subs-title">Dans cette rubrique</p><ul>';
      kids.forEach(function (child) {
        html +=
          '<li><button type="button" class="nc-tree-panel__sub" data-tree-select="' +
          esc(child.id) +
          '">' +
          esc(child.label) +
          '</button></li>';
      });
      html += '</ul></div>';
    }

    if (node.href) {
      html +=
        '<a class="btn btn-gold nc-tree-panel__cta" href="' +
        esc(node.href) +
        '">Voir en détail →</a>';
    } else if (kids.length === 1 && kids[0].href) {
      html +=
        '<a class="btn btn-gold nc-tree-panel__cta" href="' +
        esc(kids[0].href) +
        '">Voir en détail →</a>';
    }

    panelEl.innerHTML = html;
    panelEl.querySelectorAll('[data-tree-select]').forEach(function (b) {
      b.addEventListener('click', function () {
        selectNode(b.getAttribute('data-tree-select'), true);
      });
    });
  }

  function expandTo(nodeId) {
    var entry = flat[nodeId];
    if (!entry) return;
    var cur = entry.parent;
    while (cur) {
      var li = navEl.querySelector('[data-tree-id="' + cur.id + '"]');
      if (li) {
        var sub = li.querySelector('.nc-tree-children');
        var toggle = li.querySelector('.nc-tree-toggle');
        if (sub) sub.hidden = false;
        if (toggle) toggle.setAttribute('aria-expanded', 'true');
        li.classList.add('is-open');
      }
      cur = flat[cur.id] && flat[cur.id].parent;
    }
  }

  function selectNode(nodeId, pushHash) {
    var entry = flat[nodeId];
    if (!entry) return;
    var node = entry.node;
    expandTo(nodeId);
    navEl.querySelectorAll('.nc-tree-label').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-tree-select') === nodeId);
    });
    renderPanel(node);
    if (pushHash && history.replaceState) {
      history.replaceState(null, '', embedMode ? '#about' : '#' + nodeId);
    }
    document.dispatchEvent(
      new CustomEvent('nc-tree-select', { detail: { id: nodeId } })
    );
  }

  var rootUl = document.createElement('ul');
  rootUl.className = 'nc-tree-root';
  rootUl.setAttribute('role', 'tree');
  rootUl.setAttribute('aria-label', 'Carte NC Consulting');
  rootUl.appendChild(renderBranch(tree, 0));
  navEl.appendChild(rootUl);

  var initial = (location.hash || '').replace(/^#/, '');
  if (embedMode && (initial === 'about' || initial === 'decouvrir' || !initial)) {
    initial = tree.id;
  } else if (!flat[initial]) {
    initial = tree.id;
  }
  selectNode(initial, false);
  if (initial === tree.id) {
    var rootLi = navEl.querySelector('[data-tree-id="' + tree.id + '"]');
    if (rootLi) {
      var rootSub = rootLi.querySelector('.nc-tree-children');
      var rootToggle = rootLi.querySelector('.nc-tree-toggle');
      if (rootSub) rootSub.hidden = false;
      if (rootToggle) rootToggle.setAttribute('aria-expanded', 'true');
      rootLi.classList.add('is-open');
    }
  }

  window.addEventListener('hashchange', function () {
    var id = (location.hash || '').replace(/^#/, '');
    if (embedMode && id === 'about') return;
    if (embedMode && id === 'decouvrir') return;
    if (id && flat[id]) selectNode(id, false);
  });
})();
