(function () {
  try {
    var t = localStorage.getItem('nc-theme');
    if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) {}
})();
