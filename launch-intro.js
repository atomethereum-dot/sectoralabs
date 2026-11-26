/* Sectora Labs — the intro, once per visit, on the home view and never with reduced motion: a white screen with
 * the Sectora mark alone in the middle; the coins of the cover burst out of it to their places, the mark rises
 * above the headline and the page comes in around it. launch-cover.js plays it on the real cover; this file
 * loads in <head> so the first paint is already the white screen. window.SL_INTRO resolves when the headline
 * of the cover may animate in. */
(function () {
  "use strict";
  var html = document.documentElement, resolveIntro, ended = false;
  window.SL_INTRO = new Promise(function (r) { resolveIntro = r; });
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var seen = false;
  try { seen = sessionStorage.getItem("sl_intro4") === "1"; sessionStorage.setItem("sl_intro4", "1"); } catch (e) {}
  var home = !location.hash || /^#\/?$/.test(location.hash);
  if (seen || reduce || !home) { resolveIntro(); window.SLIntro = { on: false }; return; }
  html.classList.add("li-run", "ci-run");
  function end() {
    if (ended) return;
    ended = true; window.SLIntro.on = false; resolveIntro();
    html.classList.add("ci-fade"); html.classList.remove("ci-run");
    setTimeout(function () { html.classList.remove("ci-fade", "li-run"); }, 750);
  }
  window.SLIntro = { on: true, text: function () { resolveIntro(); }, end: end };
  setTimeout(end, 8000); // safety: whatever happens, the page appears
})();
