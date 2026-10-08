document$.subscribe(function () {
  var link = document.querySelector(".hero-links .whoami-link");
  var social = document.querySelector(".md-footer .md-social");
  if (!link || !social) return;

  link.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    var style = getComputedStyle(document.documentElement);
    var scrollDelay = parseFloat(style.getPropertyValue("--whoami-scroll-delay")) || 200;
    var cycle = parseFloat(style.getPropertyValue("--whoami-flash-cycle")) || 450;
    var blinks = parseFloat(style.getPropertyValue("--whoami-flash-blinks")) || 4;

    var flash = function () {
      social.classList.add("whoami-flash");
      setTimeout(function () { social.classList.remove("whoami-flash"); }, cycle * blinks);
    };

    setTimeout(function () {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: reduced ? "auto" : "smooth" });
      if ("onscrollend" in window) window.addEventListener("scrollend", flash, { once: true });
      else setTimeout(flash, 500);
    }, scrollDelay);
  });
});
