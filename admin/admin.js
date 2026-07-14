'use strict';

(function () {
  var state = {
    content: {},
    announcements: [],
    trust: [],
    formations: [],
    faq: [],
    cases: [],
    clients: [],
  };
  var dirty = false;
  var clientId = '';

  var el = {
    loading: document.getElementById('loadingView'),
    setup: document.getElementById('setupView'),
    setupMissing: document.getElementById('setupMissing'),
    login: document.getElementById('loginView'),
    app: document.getElementById('appView'),
    gsiButton: document.getElementById('gsiButton'),
    loginError: document.getElementById('loginError'),
    nav: document.getElementById('nav'),
    panelTitle: document.getElementById('panelTitle'),
    saveBtn: document.getElementById('saveBtn'),
    seedBtn: document.getElementById('seedBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    whoName: document.getElementById('whoName'),
    whoEmail: document.getElementById('whoEmail'),
    annList: document.getElementById('annList'),
    trustList: document.getElementById('trustList'),
    formList: document.getElementById('formList'),
    faqList: document.getElementById('faqList'),
    caseList: document.getElementById('caseList'),
    clientList: document.getElementById('clientList'),
    toast: document.getElementById('toast'),
  };

  var PANEL_TITLES = {
    hero: 'Accueil',
    trust: 'Bandeau confiance',
    promo: 'Offre promo',
    announcements: 'Annonces',
    formations: 'Formations',
    intro: 'Concours — titres',
    poles: 'Pôles',
    methode: 'Méthode',
    expert: 'Pourquoi NC',
    founder: 'Mot du fondateur',
    about: 'À propos',
    faq: 'FAQ',
    contact: 'Contact & pied de page',
  };

  var COLLECTIONS = {
    announcement: {
      list: el.annList,
      tpl: 'tpl-announcement',
      key: 'announcements',
      fields: ['id', 'text', 'active'],
      prefix: 'a',
    },
    trust: {
      list: el.trustList,
      tpl: 'tpl-trust',
      key: 'trust',
      fields: ['id', 'bold', 'text', 'active'],
      prefix: 't',
    },
    formation: {
      list: el.formList,
      tpl: 'tpl-formation',
      key: 'formations',
      fields: ['id', 'tag', 'title', 'subtitle', 'items', 'cta_url', 'active'],
      prefix: 'f',
    },
    faq: {
      list: el.faqList,
      tpl: 'tpl-faq',
      key: 'faq',
      fields: ['id', 'question', 'answer', 'active'],
      prefix: 'q',
    },
    case: {
      list: el.caseList,
      tpl: 'tpl-case',
      key: 'cases',
      fields: ['id', 'tag', 'title', 'description', 'outcome', 'active'],
      prefix: 'c',
    },
    client: {
      list: el.clientList,
      tpl: 'tpl-client',
      key: 'clients',
      fields: ['id', 'label', 'active'],
      prefix: 'cl',
    },
  };

  function toast(msg, kind) {
    el.toast.textContent = msg;
    el.toast.className = 'toast show' + (kind ? ' ' + kind : '');
    el.toast.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.toast.className = 'toast';
      setTimeout(function () { el.toast.hidden = true; }, 300);
    }, 2600);
  }

  function setDirty(v) {
    dirty = v;
    el.saveBtn.disabled = !v;
    el.saveBtn.classList.toggle('dirty', v);
  }

  function api(path, opts) {
    opts = opts || {};
    return fetch(path, {
      method: opts.method || 'GET',
      headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: 'same-origin',
    }).then(function (r) {
      return r.json().then(function (j) { return { status: r.status, json: j }; });
    });
  }

  function hideAllViews() {
    el.loading.hidden = true;
    el.setup.hidden = true;
    el.login.hidden = true;
    el.app.hidden = true;
  }

  function showSetup(missing) {
    hideAllViews();
    el.setup.hidden = false;
    if (el.setupMissing) {
      el.setupMissing.innerHTML = '';
      (missing || []).forEach(function (name) {
        var li = document.createElement('li');
        li.innerHTML = '<code>' + name + '</code>';
        el.setupMissing.appendChild(li);
      });
    }
  }

  function showLogin() {
    hideAllViews();
    el.login.hidden = false;
  }

  function bootstrap() {
    hideAllViews();
    el.loading.hidden = false;
    api('/api/admin/config').then(function (res) {
      var j = res.json || {};
      clientId = j.clientId || '';
      if (!j.configured) {
        showSetup(j.missing || []);
        return;
      }
      if (j.authenticated) enterApp(j.user);
      else { showLogin(); initGsi(); }
    }).catch(function () {
      showLogin();
      el.loginError.textContent = 'Impossible de contacter le serveur.';
      el.loginError.hidden = false;
    });
  }

  function initGsi() {
    if (!clientId) return;
    function tryInit(attempt) {
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
        if (attempt < 40) return setTimeout(function () { tryInit(attempt + 1); }, 100);
        el.loginError.textContent = 'Échec du chargement de Google Sign-In.';
        el.loginError.hidden = false;
        return;
      }
      google.accounts.id.initialize({ client_id: clientId, callback: onCredential });
      google.accounts.id.renderButton(el.gsiButton, {
        theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', width: 300,
      });
    }
    tryInit(0);
  }

  function onCredential(response) {
    el.loginError.hidden = true;
    api('/api/admin/login', { method: 'POST', body: { credential: response.credential } })
      .then(function (res) {
        if (res.status === 200 && res.json.ok) enterApp(res.json.user);
        else if (res.json.error === 'not_configured') showSetup();
        else if (res.json.error === 'not_allowed') {
          el.loginError.textContent = "Ce compte Google n'est pas autorisé.";
          el.loginError.hidden = false;
        } else {
          el.loginError.textContent = 'Connexion refusée. Réessayez.';
          el.loginError.hidden = false;
        }
      })
      .catch(function () {
        el.loginError.textContent = 'Erreur réseau pendant la connexion.';
        el.loginError.hidden = false;
      });
  }

  function enterApp(user) {
    hideAllViews();
    el.app.hidden = false;
    if (user) {
      el.whoName.textContent = user.name || 'Admin';
      el.whoEmail.textContent = user.email || '';
    }
    loadContent();
  }

  function logout() {
    api('/api/admin/logout', { method: 'POST' }).then(function () {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.disableAutoSelect();
      }
      window.location.reload();
    });
  }

  function loadContent() {
    api('/api/admin/content').then(function (res) {
      if (res.status === 503 || (res.json && res.json.error === 'not_configured')) {
        showSetup();
        return;
      }
      if (res.status === 401) { showLogin(); initGsi(); return; }
      if (!res.json.ok) { toast('Erreur de chargement', 'err'); return; }
      state.content = res.json.content || {};
      state.announcements = res.json.announcements || [];
      state.trust = res.json.trust || [];
      state.formations = res.json.formations || [];
      state.faq = res.json.faq || [];
      state.cases = res.json.cases || [];
      state.clients = res.json.clients || [];
      renderAll();
      setDirty(false);
    }).catch(function () { toast('Erreur réseau', 'err'); });
  }

  function renderCollection(kind) {
    var cfg = COLLECTIONS[kind];
    if (!cfg || !cfg.list) return;
    var tpl = document.getElementById(cfg.tpl);
    cfg.list.innerHTML = '';
    (state[cfg.key] || []).forEach(function (item) {
      var node = tpl.content.firstElementChild.cloneNode(true);
      cfg.fields.forEach(function (field) {
        var input = node.querySelector('[data-field="' + field + '"]');
        if (!input) return;
        if (field === 'active') input.checked = item.active !== false;
        else input.value = item[field] != null ? item[field] : '';
      });
      cfg.list.appendChild(node);
    });
  }

  function renderAll() {
    document.querySelectorAll('[data-content]').forEach(function (input) {
      var key = input.getAttribute('data-content');
      input.value = state.content[key] != null ? state.content[key] : '';
    });
    Object.keys(COLLECTIONS).forEach(renderCollection);
  }

  function collectCollection(kind) {
    var cfg = COLLECTIONS[kind];
    var out = [];
    if (!cfg || !cfg.list) return out;
    cfg.list.querySelectorAll('[data-kind="' + kind + '"]').forEach(function (row, i) {
      var item = { order: i + 1 };
      cfg.fields.forEach(function (field) {
        var input = row.querySelector('[data-field="' + field + '"]');
        if (!input) return;
        if (field === 'active') item.active = input.checked;
        else item[field] = input.value;
      });
      if (!item.id) item.id = cfg.prefix + (i + 1);
      out.push(item);
    });
    return out;
  }

  function collect() {
    var content = {};
    document.querySelectorAll('[data-content]').forEach(function (input) {
      content[input.getAttribute('data-content')] = input.value;
    });
    return {
      content: content,
      announcements: collectCollection('announcement'),
      trust: collectCollection('trust'),
      formations: collectCollection('formation'),
      faq: collectCollection('faq'),
      cases: collectCollection('case'),
      clients: collectCollection('client'),
    };
  }

  function save() {
    var payload = collect();
    el.saveBtn.disabled = true;
    el.saveBtn.textContent = 'Enregistrement…';
    api('/api/admin/content', { method: 'POST', body: payload })
      .then(function (res) {
        el.saveBtn.textContent = 'Enregistrer';
        if (res.status === 503 || (res.json && res.json.error === 'not_configured')) {
          showSetup();
          return;
        }
        if (res.status === 401) { showLogin(); initGsi(); return; }
        if (res.json.ok) {
          state.content = res.json.content || {};
          state.announcements = res.json.announcements || [];
          state.trust = res.json.trust || [];
          state.formations = res.json.formations || [];
          state.faq = res.json.faq || [];
          state.cases = res.json.cases || [];
          state.clients = res.json.clients || [];
          renderAll();
          setDirty(false);
          toast('Modifications enregistrées', 'ok');
        } else {
          toast('Échec de l\u2019enregistrement', 'err');
          setDirty(true);
        }
      })
      .catch(function () {
        el.saveBtn.textContent = 'Enregistrer';
        toast('Erreur réseau', 'err');
        setDirty(true);
      });
  }

  function newItem(kind) {
    var cfg = COLLECTIONS[kind];
    var tpl = document.getElementById(cfg.tpl);
    var node = tpl.content.firstElementChild.cloneNode(true);
    var idField = node.querySelector('[data-field="id"]');
    if (idField) idField.value = cfg.prefix + Date.now();
    var activeField = node.querySelector('[data-field="active"]');
    if (activeField) activeField.checked = true;
    cfg.list.appendChild(node);
    var focus = node.querySelector('input[type="text"], textarea');
    if (focus) focus.focus();
    setDirty(true);
  }

  function moveNode(node, dir) {
    if (dir === 'up' && node.previousElementSibling) {
      node.parentNode.insertBefore(node, node.previousElementSibling);
      setDirty(true);
    } else if (dir === 'down' && node.nextElementSibling) {
      node.parentNode.insertBefore(node.nextElementSibling, node);
      setDirty(true);
    }
  }

  function switchPanel(name) {
    el.nav.querySelectorAll('.nav-item').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-panel') === name);
    });
    document.querySelectorAll('.panel').forEach(function (p) {
      p.classList.toggle('is-active', p.id === 'panel-' + name);
    });
    el.panelTitle.textContent = PANEL_TITLES[name] || '';
  }

  function wire() {
    el.nav.addEventListener('click', function (e) {
      var btn = e.target.closest('.nav-item');
      if (btn) switchPanel(btn.getAttribute('data-panel'));
    });
    el.saveBtn.addEventListener('click', function () { if (dirty) save(); });
    if (el.seedBtn) {
      el.seedBtn.addEventListener('click', function () {
        if (!window.confirm(
          'Importer tout le contenu actuel du site dans votre Google Sheet ?\n\n' +
          'Cela remplace les données CMS par le texte par défaut du site (hero, pôles, FAQ, etc.).'
        )) return;
        el.seedBtn.disabled = true;
        api('/api/admin/seed', { method: 'POST' })
          .then(function (res) {
            el.seedBtn.disabled = false;
            if (res.status === 503 || (res.json && res.json.error === 'not_configured')) {
              showSetup();
              return;
            }
            if (res.status === 401) { showLogin(); initGsi(); return; }
            if (res.json.ok) {
              state.content = res.json.content || {};
              state.announcements = res.json.announcements || [];
              state.trust = res.json.trust || [];
              state.formations = res.json.formations || [];
              state.faq = res.json.faq || [];
              state.cases = res.json.cases || [];
              state.clients = res.json.clients || [];
              renderAll();
              setDirty(false);
              toast('Contenu du site importé', 'ok');
            } else {
              toast('Échec de l\u2019import', 'err');
            }
          })
          .catch(function () {
            el.seedBtn.disabled = false;
            toast('Erreur réseau', 'err');
          });
      });
    }
    el.logoutBtn.addEventListener('click', logout);
    el.app.addEventListener('input', function () { if (!dirty) setDirty(true); });
    el.app.addEventListener('change', function () { if (!dirty) setDirty(true); });
    document.querySelectorAll('[data-add]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        newItem(btn.getAttribute('data-add'));
      });
    });
    el.app.addEventListener('click', function (e) {
      var removeBtn = e.target.closest('[data-remove]');
      if (removeBtn) {
        var container = removeBtn.closest('[data-kind]');
        if (container) { container.remove(); setDirty(true); }
        return;
      }
      var moveBtn = e.target.closest('[data-move]');
      if (moveBtn) {
        var node = moveBtn.closest('[data-kind]');
        if (node) moveNode(node, moveBtn.getAttribute('data-move'));
      }
    });
    window.addEventListener('beforeunload', function (e) {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  wire();
  bootstrap();
})();
