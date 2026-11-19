/* Sectora Launch — short, sober boot screen. Resolves window.SL_INTRO when the page may animate in. */
(function () {
  "use strict";
  var el = document.getElementById("li"), html = document.documentElement;
  if (!el) { window.SL_INTRO = Promise.resolve(); return; }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches, again = false;
  try { again = sessionStorage.getItem("sl_intro2") === "1"; sessionStorage.setItem("sl_intro2", "1"); } catch (e) {}
  var hold = reduce ? 150 : again ? 650 : 1450;
  el.style.setProperty("--li-d", Math.max(0.2, (hold - 150) / 1000) + "s");
  html.classList.add("li-run");
  window.SL_INTRO = new Promise(function (resolve) {
    var done = false, timer = 0;
    function finish() {
      if (done) return; done = true; clearTimeout(timer);
      el.classList.add("out"); html.classList.remove("li-run");
      removeEventListener("keydown", finish); el.removeEventListener("pointerdown", finish);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
      resolve();
    }
    timer = setTimeout(finish, hold);
    el.addEventListener("pointerdown", finish);
    addEventListener("keydown", finish);
    setTimeout(finish, 5000); // safety
  });
})();
