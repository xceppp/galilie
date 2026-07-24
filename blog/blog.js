/* Blog hub filters + search + sticky CTA dock + article reading progress */
(function () {
  var filterBtns = document.querySelectorAll(".nc-blog-filters [data-filter]");
  var cards = document.querySelectorAll("[data-blog-list] .nc-blog-card");
  var featured = document.querySelector(".nc-blog-featured");
  var searchInput = document.getElementById("ncBlogSearch");
  var activeFilter = "all";

  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function matchesSearch(el, q) {
    if (!q) return true;
    var hay =
      (el.getAttribute("data-blog-search") || "") +
      " " +
      (el.textContent || "");
    return normalize(hay).indexOf(q) !== -1;
  }

  function applyFilters() {
    var q = searchInput ? normalize(searchInput.value.trim()) : "";
    cards.forEach(function (c) {
      var cat = c.getAttribute("data-blog-cat") || "";
      var okCat = activeFilter === "all" || cat === activeFilter;
      var okSearch = matchesSearch(c, q);
      c.classList.toggle("is-hidden", !(okCat && okSearch));
    });
    if (featured) {
      var fc = featured.getAttribute("data-blog-cat") || "";
      var okFeatCat = activeFilter === "all" || fc === activeFilter;
      var okFeatSearch = matchesSearch(featured, q);
      featured.classList.toggle("is-hidden", !(okFeatCat && okFeatSearch));
    }
  }

  if (filterBtns.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) {
          b.classList.toggle("is-on", b === btn);
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        activeFilter = btn.getAttribute("data-filter") || "all";
        applyFilters();
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  /* Sticky conversion dock — show after scroll, hide near banner / form */
  var dock = document.getElementById("ncBlogCtaDock");
  var banner = document.getElementById("ncBlogCtaBanner");
  if (dock && banner) {
    function updateDock() {
      var sc = window.scrollY || document.documentElement.scrollTop;
      var br = banner.getBoundingClientRect();
      var nearBanner = br.top < window.innerHeight * 0.92 && br.bottom > 0;
      var show = sc > 380 && !nearBanner;
      dock.hidden = !show;
      dock.classList.toggle("is-on", show);
    }
    window.addEventListener("scroll", updateDock, { passive: true });
    window.addEventListener("resize", updateDock);
    updateDock();
  }

  var bar = document.querySelector(".nc-blog-read-progress");
  var article = document.querySelector(".nc-blog-article");
  if (!bar || !article) return;

  function update() {
    var rect = article.getBoundingClientRect();
    var top = window.scrollY + rect.top;
    var h = article.offsetHeight - window.innerHeight;
    var y = window.scrollY - top;
    var p = h > 0 ? Math.max(0, Math.min(100, (y / h) * 100)) : 0;
    if (window.scrollY < top) p = 0;
    bar.style.width = p + "%";
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
