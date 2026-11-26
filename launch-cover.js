/* Sectora Labs — the cover. The home opens on the same cover as the video: a white field of original,
 * fictional coins that float around the logo and the headline, and drift slowly while the cover is on screen.
 * The intro (once per visit, see launch-intro.js) plays on this same cover: the Sectora mark appears alone in
 * the middle of a white screen, the coins burst out of it to their places, the mark rises above the headline
 * and the page comes in around it. Later visits: the coins pop in from the centre outwards. With reduced
 * motion they stay still. */
(function () {
  "use strict";
  var ICON = {
  cat: c => `<path d="M30 42 L34 22 L46 34 Z M70 42 L66 22 L54 34 Z" fill="${c}"/><circle cx="50" cy="52" r="22" fill="${c}"/><circle cx="42" cy="50" r="3.4" fill="#111"/><circle cx="58" cy="50" r="3.4" fill="#111"/><path d="M47 58 h6 l-3 3z" fill="#111"/><path d="M30 57 h10 M30 61 h10 M60 57 h10 M60 61 h10" stroke="#111" stroke-width="1.6"/>`,
  dog: c => `<ellipse cx="30" cy="48" rx="8" ry="15" fill="#5b3a1e"/><ellipse cx="70" cy="48" rx="8" ry="15" fill="#5b3a1e"/><circle cx="50" cy="50" r="22" fill="${c}"/><circle cx="42" cy="46" r="3.4" fill="#111"/><circle cx="58" cy="46" r="3.4" fill="#111"/><ellipse cx="50" cy="58" rx="7" ry="5" fill="#111"/><path d="M50 63 v5" stroke="#111" stroke-width="2"/>`,
  bear: c => `<circle cx="32" cy="32" r="9" fill="${c}"/><circle cx="68" cy="32" r="9" fill="${c}"/><circle cx="50" cy="52" r="24" fill="${c}"/><circle cx="41" cy="48" r="3.4" fill="#111"/><circle cx="59" cy="48" r="3.4" fill="#111"/><ellipse cx="50" cy="60" rx="9" ry="7" fill="#f3e2c7"/><circle cx="50" cy="57" r="3" fill="#111"/>`,
  ghost: c => `<path d="M30 72 V46 a20 20 0 0 1 40 0 V72 l-6.7-6 -6.7 6 -6.6-6 -6.7 6 -6.6-6z" fill="${c}"/><circle cx="43" cy="46" r="4" fill="#111"/><circle cx="57" cy="46" r="4" fill="#111"/>`,
  alien: c => `<ellipse cx="50" cy="50" rx="22" ry="26" fill="${c}"/><ellipse cx="41" cy="50" rx="7" ry="10" transform="rotate(-20 41 50)" fill="#111"/><ellipse cx="59" cy="50" rx="7" ry="10" transform="rotate(20 59 50)" fill="#111"/>`,
  robot: c => `<rect x="30" y="34" width="40" height="34" rx="8" fill="${c}"/><circle cx="42" cy="50" r="5" fill="#111"/><circle cx="58" cy="50" r="5" fill="#111"/><rect x="42" y="59" width="16" height="3" fill="#111"/><path d="M50 34 v-8" stroke="${c}" stroke-width="3"/><circle cx="50" cy="24" r="4" fill="${c}"/>`,
  rocket: c => `<path d="M50 20 c10 10 12 26 8 40 h-16 c-4-14-2-30 8-40z" fill="${c}"/><circle cx="50" cy="40" r="5" fill="#111"/><path d="M42 54 l-8 10 h10z M58 54 l8 10 h-10z" fill="${c}"/><path d="M45 62 h10 l-5 12z" fill="#ffb02e"/>`,
  moon: c => `<path d="M60 26 a26 26 0 1 0 14 40 a22 22 0 1 1 -14 -40z" fill="${c}"/><circle cx="44" cy="54" r="3" fill="rgba(0,0,0,.25)"/><circle cx="52" cy="66" r="2.4" fill="rgba(0,0,0,.25)"/>`,
  flame: c => `<path d="M50 20 c4 12 18 18 18 34 a18 18 0 0 1 -36 0 c0-8 4-12 8-16 0 6 3 9 6 9 c-2-10 0-18 4-27z" fill="${c}"/>`,
  diamond: c => `<path d="M32 40 l8-12 h20 l8 12 -18 30z" fill="${c}"/><path d="M32 40 h36 M40 28 l10 42 10-42" stroke="rgba(0,0,0,.3)" stroke-width="1.6" fill="none"/>`,
  crown: c => `<path d="M28 64 l-2-30 12 12 12-18 12 18 12-12 -2 30z" fill="${c}"/><rect x="28" y="64" width="44" height="7" rx="2" fill="${c}"/>`,
  bolt: c => `<path d="M56 18 L32 54 h16 l-6 28 26-38 h-16z" fill="${c}"/>`,
  star: c => `<path d="M50 20 l9 19 21 3 -15 14 4 21 -19-10 -19 10 4-21 -15-14 21-3z" fill="${c}"/>`,
  hex: c => `<path d="M50 22 l24 14 v28 l-24 14 -24-14 v-28z" fill="none" stroke="${c}" stroke-width="6"/><path d="M50 36 l12 7 v14 l-12 7 -12-7 v-14z" fill="${c}"/>`,
  cube: c => `<path d="M50 22 l26 14 -26 14 -26-14z" fill="${c}"/><path d="M24 36 l26 14 v30 l-26-14z" fill="${c}" opacity=".75"/><path d="M76 36 l-26 14 v30 l26-14z" fill="${c}" opacity=".5"/>`,
  ring: c => `<circle cx="50" cy="50" r="22" fill="none" stroke="${c}" stroke-width="9"/><circle cx="50" cy="50" r="6" fill="${c}"/>`,
  waves: c => `<path d="M24 40 q7-8 13 0 t13 0 t13 0 t13 0 M24 52 q7-8 13 0 t13 0 t13 0 t13 0 M24 64 q7-8 13 0 t13 0 t13 0 t13 0" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
  bars: c => `<rect x="28" y="54" width="10" height="18" rx="2" fill="${c}"/><rect x="45" y="42" width="10" height="30" rx="2" fill="${c}"/><rect x="62" y="28" width="10" height="44" rx="2" fill="${c}"/>`,
  leaf: c => `<path d="M28 72 C28 40 46 26 74 26 C74 56 60 72 28 72z" fill="${c}"/><path d="M30 70 L64 36" stroke="rgba(0,0,0,.3)" stroke-width="2.4"/>`,
  shield: c => `<path d="M50 22 l24 9 v18 c0 15-10 26-24 31 -14-5-24-16-24-31 v-18z" fill="${c}"/><path d="M40 51 l7 7 14-15" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  atom: c => `<ellipse cx="50" cy="50" rx="26" ry="10" fill="none" stroke="${c}" stroke-width="4"/><ellipse cx="50" cy="50" rx="26" ry="10" transform="rotate(60 50 50)" fill="none" stroke="${c}" stroke-width="4"/><ellipse cx="50" cy="50" rx="26" ry="10" transform="rotate(120 50 50)" fill="none" stroke="${c}" stroke-width="4"/><circle cx="50" cy="50" r="5" fill="${c}"/>`,
  tri: c => `<path d="M50 24 l27 46 h-54z" fill="none" stroke="${c}" stroke-width="7" stroke-linejoin="round"/><circle cx="50" cy="54" r="6" fill="${c}"/>`,
  nodes: c => `<circle cx="32" cy="36" r="6" fill="${c}"/><circle cx="68" cy="36" r="6" fill="${c}"/><circle cx="50" cy="66" r="6" fill="${c}"/><circle cx="50" cy="46" r="7" fill="${c}"/><path d="M32 36 L50 46 L68 36 M50 46 V66" stroke="${c}" stroke-width="3"/>`,
  orbit: c => `<circle cx="50" cy="50" r="12" fill="${c}"/><ellipse cx="50" cy="50" rx="28" ry="11" transform="rotate(-25 50 50)" fill="none" stroke="${c}" stroke-width="4"/>`,
  sun: c => `<circle cx="50" cy="50" r="13" fill="${c}"/><g stroke="${c}" stroke-width="4" stroke-linecap="round"><path d="M50 22v8M50 70v8M22 50h8M70 50h8M30 30l6 6M64 64l6 6M70 30l-6 6M36 64l-6 6"/></g>`,
  key: c => `<circle cx="38" cy="50" r="12" fill="none" stroke="${c}" stroke-width="7"/><path d="M50 50 h26 v8 M66 50 v8" stroke="${c}" stroke-width="7" fill="none"/>`
};
// [icon, coin color, icon color, ticker, meme?]
var COINS = [
  ['cat', '#ffcc33', '#ffffff', 'CATZ', 1], ['dog', '#f28c28', '#f6d7a8', 'BORK', 1], ['bear', '#8e5a35', '#c08457', 'HONEY', 1], ['ghost', '#7b61ff', '#ffffff', 'BOO', 1],
  ['alien', '#22c55e', '#b6f5c9', 'ZORP', 1], ['robot', '#ef4444', '#e5e7eb', 'BLEEP', 1], ['rocket', '#0ea5e9', '#ffffff', 'LIFTOFF', 1], ['moon', '#1f2a44', '#f6e7a8', 'LUNA2', 1],
  ['flame', '#ff5a1f', '#ffd166', 'BLAZE', 1], ['diamond', '#14b8a6', '#d6fff8', 'HODL', 1], ['crown', '#a855f7', '#ffd54a', 'KING', 1], ['bolt', '#facc15', '#1f2937', 'ZAP', 1],
  ['star', '#ec4899', '#ffffff', 'STARZ', 1],
  ['hex', '#0f172a', '#4d8dff', 'NOVA', 0], ['cube', '#111827', '#38bdf8', 'ATLAS', 0], ['ring', '#ffffff', '#1569ff', 'ORBIT', 0], ['waves', '#0b3b6f', '#7dd3fc', 'TIDE', 0],
  ['bars', '#064e3b', '#34d399', 'YIELD', 0], ['leaf', '#ecfdf5', '#16a34a', 'TERRA', 0], ['shield', '#1e293b', '#e2e8f0', 'VAULT', 0], ['atom', '#312e81', '#a5b4fc', 'QUANT', 0],
  ['tri', '#f8fafc', '#0f172a', 'APEX', 0], ['nodes', '#0c4a6e', '#bae6fd', 'MESH', 0], ['orbit', '#3b0764', '#e9d5ff', 'ORION', 0], ['sun', '#fff7ed', '#f97316', 'SOLR', 0],
  ['key', '#18181b', '#fbbf24', 'KEYS', 0]
];

  function coinSVG(k) {
    var c = COINS[k % COINS.length], ic = c[0], bg = c[1], fg = c[2], tk = c[3];
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="49" fill="' + bg + '"/><circle cx="50" cy="50" r="44.5" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.5"/><circle cx="50" cy="50" r="48.5" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1"/>' +
      '<g transform="translate(50 47) scale(.78) translate(-50 -50)">' + ICON[ic](fg) + '</g><text x="50" y="86" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9" letter-spacing="1" fill="' + fg + '" opacity=".95">$' + tk + "</text></svg>";
  }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = null, introT0 = 0, introDone = false, textSent = false, endSent = false;
  var cl = function (x) { return Math.max(0, Math.min(1, x)); }, seg = function (t, a, b) { return cl((t - a) / (b - a)); };
  var o3 = function (x) { return 1 - Math.pow(1 - x, 3); }, io3 = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var back = function (x) { var c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  // intro timeline (seconds)
  var S0 = 1.25, MOVE0 = 1.4, MOVE1 = 2.2, CM0 = 1.4, CM1 = 2.15, TEXT = 1.75, PAGE = 2.35;
  function introOn() { var I = window.SLIntro; return !!(I && I.on) && !introDone; }
  function mount(hero) {
    var keepT0 = state ? state.t0 : 0; // a new render of the home keeps the coins where they are
    unmount();
    var bg = hero.querySelector(".sl-cv-bg"), inner = hero.querySelector(".sl-cv-in"), mark = hero.querySelector(".sl-cv-mark");
    if (!bg || !inner) return;
    var intro = introOn();
    if (intro && !introT0 && scrollY > 40) { introDone = true; intro = false; finishIntro(); }
    if (intro && !introT0) {
      // wait for the fonts (max 700 ms) so the headline does not move under the coins, then start
      var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 700); })]).then(function () {
        if (introT0 || !document.body.contains(hero)) return;
        introT0 = performance.now(); mount(hero);
      });
      hero.style.animation = "none";
      return;
    }
    if (intro) { hero.style.animation = "none"; if (mark) mark.style.transform = ""; }
    // the field of coins reaches up to the top of the page (behind the header), so the intro fills the whole screen;
    // the coins of the cover itself stay below the header (from y0)
    var htop = hero.getBoundingClientRect().top + scrollY;
    bg.style.top = (-htop).toFixed(1) + "px";
    var y0 = Math.max(0, htop - 48);
    var W = bg.clientWidth, H = bg.clientHeight, br = bg.getBoundingClientRect(), ir = inner.getBoundingClientRect();
    var small = W < 700, pad = small ? 4 : 18;
    var keep = [ir.left - br.left - pad, ir.top - br.top - pad, ir.right - br.left + pad, ir.bottom - br.top + pad];
    var minD = small ? 34 : 54, maxD = small ? 68 : Math.min(160, W / 11);
    var n = Math.round(Math.min(small ? 26 : 64, (W * (H - y0)) / (small ? 9000 : 26000)));
    var seed = 31, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    // the intro bursts the coins out of the mark while it waits in the middle of the screen
    var sx = innerWidth / 2 - br.left, sy = innerHeight / 2 - br.top, far = Math.hypot(Math.max(sx, W - sx), Math.max(sy, H - sy));
    var placed = [], coins = [];
    for (var i = 0, tries = 0; i < n && tries < 6000; tries++) {
      var d = minD + rnd() * (maxD - minD), x = -d * .2 + rnd() * (W + d * .4), y = y0 - d * .2 + rnd() * (H - y0 + d * .4);
      if (x + d / 2 > keep[0] && x - d / 2 < keep[2] && y + d / 2 > keep[1] && y - d / 2 < keep[3]) continue;
      if (y + d * .64 > H) continue; // whole coins only at the bottom of the cover (they fade out there, never cut)
      var ok = true;
      for (var j = 0; j < placed.length; j++) { var p = placed[j]; if (Math.hypot(p[0] - x, p[1] - y) < (p[2] + d) / 2 + 8) { ok = false; break; } }
      if (!ok) continue;
      placed.push([x, y, d]);
      var el = document.createElement("i"); el.className = "sl-cv-coin";
      el.style.cssText = "left:" + (x - d / 2).toFixed(1) + "px;top:" + (y - d / 2).toFixed(1) + "px;width:" + d.toFixed(1) + "px;height:" + d.toFixed(1) + "px";
      el.innerHTML = coinSVG(i * 7 + Math.floor(rnd() * 3));
      bg.appendChild(el);
      var dist = Math.hypot(x - sx, y - sy);
      coins.push({ el: el, x: x, y: y, d: d, rot: (rnd() - .5) * 24, ph: rnd() * 6.283, ph2: rnd() * 6.283, sp: .6 + rnd() * .7,
        delay: Math.hypot(x - W / 2, y - H / 2) / Math.hypot(W / 2, H / 2),
        // intro: where it starts (the mark), when it leaves, how long it flies, its curve and its spin
        bx: sx - x, by: sy - y, bl: .7 + rnd() * .22, bd: .62 + dist / far * .55, cv: (rnd() - .5) * .5, spin: (rnd() < .5 ? -1 : 1) * (160 + rnd() * 200) });
      i++;
    }
    // phones: the text takes the whole width, so the band under it gets its own row of coins (whole, fading out at the bottom)
    if (small) {
      for (var nb = 0, tb = 0; nb < 7 && tb < 3000; tb++) {
        var d2 = 36 + rnd() * 26, x2 = -d2 * .2 + rnd() * (W + d2 * .4), y2 = keep[3] + d2 / 2 + 6 + rnd() * Math.max(1, H - keep[3] - d2 * 1.16 - 14);
        if (y2 + d2 * .64 > H || y2 - d2 / 2 < keep[3]) continue;
        var ok2 = true;
        for (var j2 = 0; j2 < placed.length; j2++) { var p2 = placed[j2]; if (Math.hypot(p2[0] - x2, p2[1] - y2) < (p2[2] + d2) / 2 + 8) { ok2 = false; break; } }
        if (!ok2) continue;
        placed.push([x2, y2, d2]);
        var el2 = document.createElement("i"); el2.className = "sl-cv-coin";
        el2.style.cssText = "left:" + (x2 - d2 / 2).toFixed(1) + "px;top:" + (y2 - d2 / 2).toFixed(1) + "px;width:" + d2.toFixed(1) + "px;height:" + d2.toFixed(1) + "px";
        el2.innerHTML = coinSVG(i * 7 + 3);
        bg.appendChild(el2);
        var dist2 = Math.hypot(x2 - sx, y2 - sy);
        coins.push({ el: el2, x: x2, y: y2, d: d2, rot: (rnd() - .5) * 24, ph: rnd() * 6.283, ph2: rnd() * 6.283, sp: .6 + rnd() * .7,
          delay: Math.hypot(x2 - W / 2, y2 - H / 2) / Math.hypot(W / 2, H / 2), bx: sx - x2, by: sy - y2, bl: .7 + rnd() * .22, bd: .62 + dist2 / far * .55, cv: (rnd() - .5) * .5, spin: (rnd() < .5 ? -1 : 1) * (160 + rnd() * 200) });
        nb++; i++;
      }
    }
    var ring = null, mc = null;
    if (intro && mark) {
      var vx0 = -br.left, vy0 = -br.top, VW = innerWidth, VH = innerHeight, mw = mark.offsetWidth * S0 / 2 + 22, spots = [];
      for (var k = 0, tr = 0; k < coins.length && tr < 6000; tr++) {
        var c0 = coins[k], qx = vx0 - c0.d * .15 + rnd() * (VW + c0.d * .3), qy = vy0 - c0.d * .15 + rnd() * (VH + c0.d * .3);
        if (Math.hypot(qx - sx, qy - sy) < mw + c0.d / 2) continue;
        var free = true;
        for (var q = 0; q < spots.length; q++) { if (Math.hypot(spots[q][0] - qx, spots[q][1] - qy) < (spots[q][2] + c0.d) / 2 + 6) { free = false; break; } }
        if (!free) continue;
        spots.push([qx, qy, c0.d]); k++;
      }
      // each coin takes the free spot in the same direction from the mark, so they barely cross on the way to their places
      var ang = function (x, y) { return Math.atan2(y - sy, x - sx); };
      var byA = coins.slice(0, spots.length).sort(function (p1, p2) { return ang(p1.x, p1.y) - ang(p2.x, p2.y); });
      spots.sort(function (p1, p2) { return ang(p1[0], p1[1]) - ang(p2[0], p2[1]); });
      byA.forEach(function (c1, q) { c1.ix = spots[q][0] - c1.x; c1.iy = spots[q][1] - c1.y; });
      coins.forEach(function (c1) {
        if (c1.ix == null) { c1.ix = 0; c1.iy = 0; }
        c1.bd = .62 + Math.hypot(c1.ix - c1.bx, c1.iy - c1.by) / far * .55;
      });
      var mr = mark.getBoundingClientRect();
      mc = { dx: innerWidth / 2 - (mr.left + mr.width / 2), dy: innerHeight / 2 - (mr.top + mr.height / 2) };
      ring = document.createElement("i"); ring.className = "sl-cv-ring"; ring.style.left = sx.toFixed(1) + "px"; ring.style.top = sy.toFixed(1) + "px";
      bg.appendChild(ring);
    }
    state = { hero: hero, coins: coins, t0: intro ? introT0 : keepT0 || performance.now(), raf: 0, on: true, W: W, mark: intro ? mark : null, mc: mc, ring: ring };
    if ("IntersectionObserver" in window) {
      state.io = new IntersectionObserver(function (es) { if (!state) return; state.on = es[es.length - 1].isIntersecting; if (state.on && !state.raf) loop(); }, { threshold: 0 });
      state.io.observe(hero);
    }
    if (reduce) { coins.forEach(function (c) { c.el.style.opacity = 1; c.el.style.transform = "rotate(" + c.rot + "deg)"; }); return; }
    frame(); loop();
  }
  function finishIntro() {
    var I = window.SLIntro;
    if (!textSent) { textSent = true; if (I && I.text) I.text(); }
    if (!endSent) { endSent = true; if (I && I.end) I.end(); }
  }
  function skip() {
    if (!introT0 || introDone) return;
    var now = performance.now();
    if (now - introT0 < MOVE1 * 1000) introT0 = now - MOVE1 * 1000;
    if (state && state.mark) state.t0 = introT0;
  }
  ["pointerdown", "keydown", "wheel", "touchmove"].forEach(function (ev) { addEventListener(ev, function () { if (introOn()) skip(); }, { capture: true, passive: true }); });
  function frame() {
    var now = performance.now(), t = (now - state.t0) / 1000, intro = !!state.mark;
    if (intro) {
      // the mark: pops in alone in the middle, gathers itself, lets the coins out and rises to its place
      var m = state.mark, a = seg(t, .05, .58), k = io3(seg(t, MOVE0, MOVE1)), sq = Math.sin(Math.PI * seg(t, .58, .86));
      var sc = (.4 + .6 * back(a)) * (S0 + (1 - S0) * k) * (1 - .1 * sq);
      m.style.opacity = o3(a).toFixed(3);
      m.style.transform = "translate(" + (state.mc.dx * (1 - k)).toFixed(1) + "px," + (state.mc.dy * (1 - k)).toFixed(1) + "px) scale(" + sc.toFixed(3) + ")";
      var r = seg(t, .7, 1.55);
      state.ring.style.opacity = r > 0 && r < 1 ? ((1 - r) * .55).toFixed(3) : 0;
      state.ring.style.transform = "scale(" + (.6 + o3(r) * 7).toFixed(3) + ")";
      if (t >= TEXT && !textSent) { textSent = true; window.SLIntro.text(); }
      if (t >= PAGE && !endSent) { endSent = true; window.SLIntro.end(); }
      if (t >= Math.max(PAGE, MOVE1) + .05) {
        introDone = true; m.style.opacity = ""; m.style.transform = ""; state.mark = null;
        if (state.ring.parentNode) state.ring.parentNode.removeChild(state.ring);
      }
    }
    state.coins.forEach(function (c) {
      var fx = Math.sin(t * .55 * c.sp + c.ph) * c.d * .10, fy = Math.cos(t * .7 * c.sp + c.ph2) * c.d * .12, s, op, rot = c.rot + Math.sin(t * .5 + c.ph) * 14;
      if (intro) {
        // the burst: out of the mark, along a slight curve, spinning, to a free spot on the screen; then, as the
        // headline comes in, each coin steps aside to its place on the cover
        var a = seg(t, c.bl, c.bl + c.bd), e = back(a), w = Math.sin(Math.PI * a) * c.cv, mv = io3(seg(t, CM0, CM1));
        var px = c.bx + (c.ix - c.bx) * e, py = c.by + (c.iy - c.by) * e, ddx = c.ix - c.bx, ddy = c.iy - c.by;
        fx = fx * o3(a) + px * (1 - mv) - ddy * w * (1 - mv); fy = fy * o3(a) + py * (1 - mv) + ddx * w * (1 - mv);
        s = .22 + .78 * o3(a); op = seg(a, 0, .12); rot += (1 - o3(a)) * c.spin;
      } else {
        // later visits: each coin pops in from the centre outwards, then floats and turns slowly
        var b = seg(t, c.delay * .7, c.delay * .7 + .55), eb = o3(b);
        s = .3 + .7 * eb + .06 * Math.sin(Math.PI * b); op = eb;
      }
      c.el.style.opacity = op.toFixed(3);
      c.el.style.transform = "translate(" + fx.toFixed(1) + "px," + fy.toFixed(1) + "px) rotate(" + rot.toFixed(1) + "deg) scale(" + s.toFixed(3) + ")";
    });
  }
  function loop() {
    if (!state || state.raf) return;
    state.raf = requestAnimationFrame(function () {
      if (!state) return;
      state.raf = 0;
      if (!state.on && !state.mark) return;
      if (!document.hidden) frame();
      loop();
    });
  }
  function unmount() {
    if (!state) return;
    if (state.raf) cancelAnimationFrame(state.raf);
    if (state.io) state.io.disconnect();
    state.coins.forEach(function (c) { if (c.el.parentNode) c.el.parentNode.removeChild(c.el); });
    if (state.ring && state.ring.parentNode) state.ring.parentNode.removeChild(state.ring);
    state = null;
  }
  var rt = 0;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (!state || !document.body.contains(state.hero)) return;
      var bg = state.hero.querySelector(".sl-cv-bg");
      if (bg && Math.abs(bg.clientWidth - state.W) > 40) { if (state.mark) { introDone = true; finishIntro(); state.mark.style.opacity = ""; state.mark.style.transform = ""; state.mark = null; } mount(state.hero); }
    }, 250);
  });
  window.SLCover = { mount: mount, unmount: unmount };
})();
