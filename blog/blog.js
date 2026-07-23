/* Blog hub filters + article reading progress */
(function () {
  var filters = document.querySelectorAll(".nc-blog-filters [data-filter]");
  if (filters.length) {
    var cards = document.querySelectorAll("[data-blog-list] .nc-blog-card");
    var featured = document.querySelector(".nc-blog-featured");
    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filters.forEach(function (b) {
          b.classList.toggle("is-on", b === btn);
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        var f = btn.getAttribute("data-filter");
        cards.forEach(function (c) {
          var cat = c.getAttribute("data-blog-cat") || "";
          var ok = f === "all" || cat === f;
          c.classList.toggle("is-hidden", !ok);
        });
        if (featured) {
          var fc = featured.getAttribute("data-blog-cat") || "";
          featured.style.display = f === "all" || fc === f ? "" : "none";
        }
      });
    });
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
