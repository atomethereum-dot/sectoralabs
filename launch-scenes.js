/* Sectora Launch — scroll scenes on the home page.
 *  · Story: a pinned section that tells how a coin is born in four steps; the canvas on the right and the
 *    active step on the left follow the scroll.
 *  · Sheet: the white page rises over the dark cover, from a rounded card to the full width; the top bar
 *    turns white once the sheet reaches it.
 * Everything is driven by the scroll position, so it plays forwards and backwards with the reader.
 * launch.js calls SLScenes.mount(main) after rendering the home and SLScenes.unmount() on other views. */
(function () {
  "use strict";
  var PI = Math.PI, TAU = PI * 2, html = document.documentElement;
  var cl = function (x, a, b) { return Math.max(a == null ? 0 : a, Math.min(b == null ? 1 : b, x)); };
  var seg = function (t, a, b) { return cl((t - a) / (b - a)); };
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var o3 = function (x) { return 1 - Math.pow(1 - x, 3); };
  var io3 = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var back = function (x) { var c = 1.5; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  var SANS = '"IBM Plex Sans", system-ui, sans-serif', MONO = '"IBM Plex Mono", ui-monospace, monospace';
  var DARK = { ink: "#f2f5fa", ink2: "#b6c0d1", ink3: "#7b8598", ink4: "#4f5867", key: "#1569ff", blue: "#4d8dff", live: "#3ecf8e", red: "#ff5c6c", card: "#10151f", line: "rgba(255,255,255,.09)", track: "rgba(255,255,255,.07)", soft: "rgba(255,255,255,.08)", grid: "rgba(255,255,255,.06)", axis: "rgba(255,255,255,.14)", sect: "#0d1626", btnTxt: "#fff" };
  var LIGHT = { ink: "#0b0d12", ink2: "#3a4252", ink3: "#5f6776", ink4: "#8d94a0", key: "#1569ff", blue: "#1a5fe0", live: "#12a26b", red: "#e5484d", card: "#ffffff", line: "rgba(10,13,18,.09)", track: "rgba(10,13,18,.07)", soft: "rgba(10,13,18,.06)", grid: "rgba(10,13,18,.06)", axis: "rgba(10,13,18,.16)", sect: "#eef3ff", btnTxt: "#fff" };
  var C = DARK;

  function rr(g, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function txt(g, s, x, y, o) {
    g.save(); g.globalAlpha *= (o.a == null ? 1 : o.a); g.fillStyle = o.c || C.ink; g.font = (o.w || 400) + " " + o.size + "px " + (o.mono ? MONO : SANS);
    g.textAlign = o.align || "left"; g.textBaseline = "middle"; g.fillText(s, x, y); var w = g.measureText(s).width; g.restore(); return w;
  }
  function tw(g, s, size, w, mono) { g.save(); g.font = (w || 400) + " " + size + "px " + (mono ? MONO : SANS); var m = g.measureText(s).width; g.restore(); return m; }
  function pill(g, x, y, w, h, fill, stroke) { rr(g, x, y, w, h, h / 2); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); } }
  function coinDisc(g, x, y, r, label, a) {
    if (r <= 0) return;
    g.save(); g.globalAlpha *= a == null ? 1 : a;
    var grd = g.createLinearGradient(x - r, y - r, x + r, y + r); grd.addColorStop(0, "#1569ff"); grd.addColorStop(1, "#3ec5ff");
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    if (label) txt(g, label, x, y + 1, { size: r * .62, w: 500, align: "center", c: "#fff" });
    g.restore();
  }
  function check(g, x, y, r, col, a) {
    g.save(); g.globalAlpha *= a; g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = "#04130c"; g.lineWidth = r * .22; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); g.moveTo(x - r * .42, y + r * .02); g.lineTo(x - r * .1, y + r * .32); g.lineTo(x + r * .45, y - r * .3); g.stroke(); g.restore();
  }

  /* ---------- the four steps ---------- */
  function stepCreate(g, W, H, s, L) {
    var cw = Math.min(W * .78, 440), ch = Math.min(H * .74, 310), x = W / 2 - cw / 2, y = H / 2 - ch / 2, a = 1, pad = cw < 360 ? 20 : 28;
    g.save(); g.globalAlpha *= a; g.translate(W / 2, H / 2); var sc = lerp(.94, 1, a); g.scale(sc, sc); g.translate(-W / 2, -H / 2);
    g.save(); if (C === LIGHT) { g.shadowColor = "rgba(16,24,40,.14)"; g.shadowBlur = 30; g.shadowOffsetY = 12; } rr(g, x, y, cw, ch, 24); g.fillStyle = C.card; g.fill(); g.restore(); rr(g, x, y, cw, ch, 24); g.strokeStyle = C.line; g.lineWidth = 1; g.stroke();
    var lr = cw < 360 ? 24 : 30, lx = x + pad + lr, ly = y + pad + lr;
    coinDisc(g, lx, ly, lr * back(seg(s, 0, .2)), seg(s, .12, .22) > 0 ? L.sc_ini : "", 1);
    var nk = Math.floor(seg(s, .1, .34) * L.sc_coin.length);
    txt(g, L.sc_coin.slice(0, nk), lx + lr + 16, ly - 9, { size: cw < 360 ? 18 : 21, w: 400 });
    var ta = seg(s, .38, .48), tkw = tw(g, L.sc_tick, 12, 500, true) + 20;
    g.save(); g.globalAlpha *= ta; pill(g, lx + lr + 16, ly + 7, tkw, 22, "rgba(21,105,255,.16)"); g.restore();
    txt(g, L.sc_tick, lx + lr + 26, ly + 18.5, { size: 12, w: 500, mono: true, c: C.blue, a: ta });
    var rows = [[L.sc_supply, Math.round(seg(s, .46, .68) * 1e9).toLocaleString(L.loc)], [L.sc_owner, L.sc_none], [L.sc_creator, "≤ 5 %"]], ry = ly + lr + (cw < 360 ? 26 : 34), rh = cw < 360 ? 30 : 34;
    rows.forEach(function (r, i) {
      var ra = seg(s, .44 + i * .07, .54 + i * .07), yy = ry + i * rh;
      txt(g, r[0], x + pad, yy, { size: 13.5, c: C.ink3, a: ra }); txt(g, r[1], x + cw - pad, yy, { size: 14, align: "right", a: ra });
      if (i < 2) { g.save(); g.globalAlpha *= ra; g.fillStyle = C.line; g.fillRect(x + pad, yy + rh / 2, cw - pad * 2, 1); g.restore(); }
    });
    var bh = 44, bw = cw - pad * 2, bx = x + pad, by = y + ch - pad - bh, press = Math.sin(PI * seg(s, .8, .9));
    g.save(); g.globalAlpha *= seg(s, .66, .76); g.translate(bx + bw / 2, by + bh / 2); g.scale(1 - press * .03, 1 - press * .03); g.translate(-(bx + bw / 2), -(by + bh / 2));
    pill(g, bx, by, bw, bh, C.key); txt(g, L.sc_launch, bx + bw / 2, by + bh / 2 + 1, { size: 14.5, w: 500, align: "center", c: "#fff" });
    var rk = seg(s, .84, 1); if (rk > 0 && rk < 1) { g.save(); rr(g, bx, by, bw, bh, bh / 2); g.clip(); g.globalAlpha *= (1 - rk) * .45; g.fillStyle = "#fff"; g.beginPath(); g.arc(bx + bw / 2, by + bh / 2, rk * bw * .6, 0, TAU); g.fill(); g.restore(); }
    g.restore(); g.restore();
  }
  function stepFair(g, W, H, s, L) {
    var R = Math.min(W * .24, H * .27), cx = W / 2, cy = H / 2 + H * .02, left = 1 - io3(seg(s, .05, .95)), sec = Math.ceil(300 * left);
    txt(g, L.sc_fair, cx, cy - R - (R > 90 ? 64 : 50), { size: 13, w: 500, align: "center", c: C.ink2 });
    g.save(); g.lineCap = "round"; g.lineWidth = R > 90 ? 12 : 9; g.strokeStyle = C.track; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
    var grd = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R); grd.addColorStop(0, C.key); grd.addColorStop(1, "#3ec5ff");
    g.strokeStyle = grd; g.beginPath(); g.arc(cx, cy, R, -PI / 2, -PI / 2 + TAU * Math.max(.001, left)); g.stroke(); g.restore();
    txt(g, String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0"), cx, cy - 4, { size: R * .44, w: 200, align: "center" });
    txt(g, L.sc_cap, cx, cy + R * .34, { size: 12.5, align: "center", c: C.ink3 });
    var N = 8, RR = R + (R > 90 ? 52 : 40);
    for (var i = 0; i < N; i++) {
      var k = seg(s, .08 + i * .075, .2 + i * .075); if (k <= 0) continue;
      var an = -PI / 2 + (i + .5) / N * TAU, px = cx + Math.cos(an) * RR, py = cy + Math.sin(an) * RR * .92, bad = i === 2 || i === 6;
      var label = bad ? "3 % ✕" : "≤ 1 %", w = tw(g, label, 12, 500) + 22;
      g.save(); g.globalAlpha *= o3(k); g.translate(px, py); var sc = lerp(.6, 1, back(k)); g.scale(sc, sc);
      pill(g, -w / 2, -13, w, 26, bad ? "rgba(229,72,77,.1)" : "rgba(18,162,107,.1)", bad ? "rgba(229,72,77,.4)" : "rgba(18,162,107,.38)");
      txt(g, label, 0, 1, { size: 12, w: 500, align: "center", c: bad ? C.red : C.live }); g.restore();
    }
  }
  function stepCurve(g, W, H, s, L) {
    var pw = Math.min(W * .82, 520), ph = Math.min(H * .46, 250), x0 = W / 2 - pw / 2, y0 = H / 2 + ph / 2 - H * .06, k = io3(seg(s, .05, .82)), gr = L.gr;
    var f = function (x) { var a = 1 / (1 - .62 * x); return (a * a - 1) / (Math.pow(1 / .38, 2) - 1); };
    g.save(); g.strokeStyle = C.grid; g.lineWidth = 1;
    for (var i = 1; i <= 3; i++) { g.beginPath(); g.moveTo(x0, y0 - ph * i / 4); g.lineTo(x0 + pw, y0 - ph * i / 4); g.stroke(); }
    g.strokeStyle = C.axis; g.beginPath(); g.moveTo(x0, y0 - ph); g.lineTo(x0, y0); g.lineTo(x0 + pw, y0); g.stroke(); g.restore();
    var gy = y0 - ph * .92; g.save(); g.setLineDash([3, 6]); g.strokeStyle = "rgba(62,207,142,.5)"; g.beginPath(); g.moveTo(x0, gy); g.lineTo(x0 + pw, gy); g.stroke(); g.restore();
    var hx = x0, hy = y0; g.save(); g.beginPath(); g.moveTo(x0, y0);
    for (i = 0; i <= 120 * k; i++) { hx = x0 + pw * i / 120; hy = y0 - ph * .92 * f(i / 120); g.lineTo(hx, hy); }
    hx = x0 + pw * k; hy = y0 - ph * .92 * f(k); g.lineTo(hx, hy);
    var sg = g.createLinearGradient(x0, 0, x0 + pw, 0); sg.addColorStop(0, C.key); sg.addColorStop(1, k > .98 ? C.live : "#3ec5ff");
    g.strokeStyle = sg; g.lineWidth = 3; g.lineCap = "round"; g.lineJoin = "round"; g.stroke();
    g.lineTo(hx, y0); g.closePath(); var af = g.createLinearGradient(0, y0 - ph, 0, y0); af.addColorStop(0, "rgba(21,105,255,.22)"); af.addColorStop(1, "rgba(21,105,255,0)"); g.fillStyle = af; g.fill(); g.restore();
    g.save(); g.fillStyle = "rgba(21,105,255,.16)"; g.beginPath(); g.arc(hx, hy, 11, 0, TAU); g.fill(); g.fillStyle = C === LIGHT ? C.key : "#fff"; g.beginPath(); g.arc(hx, hy, 5.5, 0, TAU); g.fill(); g.restore();
    var raised = Math.round(k * gr), done = k > .98, bw = Math.min(pw, 360), bx = W / 2 - bw / 2, by = y0 + 34;
    txt(g, raised.toLocaleString(L.loc) + " / " + gr.toLocaleString(L.loc) + " " + L.sc_raised, W / 2, by, { size: 14, align: "center", c: C.ink2 });
    pill(g, bx, by + 18, bw, 8, C.soft); if (k > 0) pill(g, bx, by + 18, Math.max(8, bw * k), 8, done ? C.live : C.key);
    var ga = seg(s, .84, .94); if (ga > 0) { var lw = tw(g, L.sc_grad, 13.5, 500) + 46; g.save(); g.globalAlpha *= ga; pill(g, W / 2 - lw / 2, y0 - ph - 30, lw, 32, "rgba(18,162,107,.1)", "rgba(18,162,107,.4)"); g.restore(); check(g, W / 2 - lw / 2 + 18, y0 - ph - 14, 8, C.live, ga); txt(g, L.sc_grad, W / 2 - lw / 2 + 32, y0 - ph - 13, { size: 13.5, w: 500, c: C.live, a: ga }); }
  }
  function stepGrad(g, W, H, s, L) {
    var cx = W / 2, cy = H / 2 - H * .06, r = Math.min(W, H) * .1, m = io3(seg(s, .02, .32)), d = lerp(Math.min(W * .28, 210), r * .62, m), join = seg(s, .26, .4);
    var poolW = Math.min(W * .62, 300), poolH = r * 2.2;
    if (join < 1) {
      coinDisc(g, cx - d, cy, r, L.sc_ini, 1 - join);
      g.save(); g.globalAlpha *= 1 - join; g.fillStyle = C.sect; g.beginPath(); g.arc(cx + d, cy, r, 0, TAU); g.fill(); g.strokeStyle = C.key; g.lineWidth = 3; g.beginPath(); g.arc(cx + d, cy, r * .62, 0, TAU); g.stroke(); g.restore();
      txt(g, "SECT", cx + d, cy + r + 18, { size: 12, w: 500, mono: true, align: "center", c: C.ink3, a: 1 - join });
    }
    if (join > 0) {
      var pw = lerp(r * 2, poolW, o3(join)), ph = lerp(r * 2, poolH, o3(join));
      g.save(); g.globalAlpha *= join; rr(g, cx - pw / 2, cy - ph / 2, pw, ph, ph / 2); var grd = g.createLinearGradient(cx - pw / 2, 0, cx + pw / 2, 0); grd.addColorStop(0, "#1569ff"); grd.addColorStop(1, "#0f3f99"); g.fillStyle = grd; g.fill(); g.restore();
      txt(g, L.sc_tick + " / SECT", cx, cy - 7, { size: 16, w: 500, align: "center", c: "#fff", a: seg(s, .36, .46) });
      txt(g, L.sc_dex, cx, cy + 14, { size: 12.5, align: "center", c: "rgba(255,255,255,.75)", a: seg(s, .38, .48) });
    }
    // the LP token leaves the pool and is locked at 0x…dEaD
    var tx = cx, ty = cy + poolH / 2 + Math.min(H * .2, 120), fly = io3(seg(s, .48, .72)), lk = seg(s, .7, .8);
    var bw = 120, bh = 66;
    if (s > .44) {
      g.save(); g.globalAlpha *= seg(s, .44, .5); if (C === LIGHT) { g.shadowColor = "rgba(16,24,40,.12)"; g.shadowBlur = 20; g.shadowOffsetY = 8; } rr(g, tx - bw / 2, ty - bh / 2, bw, bh, 18); g.fillStyle = C.card; g.fill(); g.shadowColor = "transparent"; g.strokeStyle = lk > 0 ? "rgba(18,162,107,.45)" : C.line; g.lineWidth = 1; g.stroke();
      var lx = tx - 30, ly = ty - 2; g.strokeStyle = lk > 0 ? C.live : C.ink3; g.lineWidth = 2.4; g.lineCap = "round";
      g.beginPath(); g.arc(lx, ly - 4 - (1 - lk) * 5, 7, PI, 0); g.lineTo(lx + 7, ly - 4 + (1 - lk) * 0); g.moveTo(lx - 7, ly - 4 - (1 - lk) * 5); g.lineTo(lx - 7, ly - 4); g.stroke();
      rr(g, lx - 10, ly - 4, 20, 15, 4); g.fillStyle = lk > 0 ? C.live : C.ink3; g.fill(); g.restore();
      txt(g, "0x…dEaD", tx + 12, ty - 2, { size: 13, w: 500, mono: true, align: "center", c: C.ink2, a: seg(s, .44, .5) });
      var px = cx, py = lerp(cy + poolH / 2 - 6, ty - bh / 2 - 6, fly);
      if (fly < 1 && s > .46) { g.save(); g.globalAlpha *= 1 - seg(s, .68, .72); pill(g, px - 22, py - 13, 44, 26, C === LIGHT ? "#0b0d12" : "#fff"); g.restore(); txt(g, "LP", px, py + 1, { size: 12, w: 500, mono: true, align: "center", c: C === LIGHT ? "#fff" : "#05070b", a: 1 - seg(s, .68, .72) }); }
      txt(g, L.sc_lp, tx, ty + bh / 2 + 22, { size: 13.5, w: 500, align: "center", c: C.live, a: seg(s, .74, .84) });
    }
    var ra = seg(s, .86, .96); if (ra > 0) { check(g, cx - tw(g, L.sc_ready, 15, 500) / 2 - 14, cy - poolH / 2 - 34, 10, C.live, ra); txt(g, L.sc_ready, cx + 10, cy - poolH / 2 - 33, { size: 15, w: 500, align: "center", a: ra }); }
  }
  var STEPS = [stepCreate, stepFair, stepCurve, stepGrad];

  /* ---------- scenes ---------- */
  var M = null, raf = 0, last = {}, drawn = -1;
  function toph() { var t = document.getElementById("slTop"); return t ? t.offsetHeight : 60; }
  function sizeCanvas(cv) {
    var r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(r.width * d) || cv.height !== Math.round(r.height * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); drawn = -1; }
    return { W: r.width, H: r.height, d: d };
  }
  function drawStory(p) {
    var cv = M.cv, sz = sizeCanvas(cv); if (sz.W < 10) return;
    var g = cv.getContext("2d"); g.setTransform(sz.d, 0, 0, sz.d, 0, 0); g.clearRect(0, 0, sz.W, sz.H);
    for (var i = 0; i < 4; i++) {
      var a0 = i * .25, a1 = a0 + .25, vin = i === 0 ? 1 : seg(p, a0 - .02, a0 + .035), vout = i === 3 ? 1 : 1 - seg(p, a1 - .035, a1 + .02), v = vin * vout;
      if (v <= 0.001) continue;
      var sp = seg(p, a0 + .01, a1 - .03);
      g.save(); g.globalAlpha = v; g.translate(0, (1 - vin) * 18 - (1 - vout) * 18); STEPS[i](g, sz.W, sz.H, sp, M.L); g.restore();
    }
  }
  function frame() {
    raf = 0; if (!M) return;
    var vh = innerHeight, th = toph();
    if (M.story) {
      var r = M.story.getBoundingClientRect(), span = M.story.offsetHeight - (vh - th), p = span > 0 ? cl((th - r.top) / span) : 0;
      if (r.bottom > -50 && r.top < vh + 50) {
        if (Math.abs(p - drawn) > .0005) { drawStory(p); drawn = p; }
        var idx = Math.min(3, Math.floor(p * 4 + .0001));
        if (idx !== last.idx) { M.items.forEach(function (li, i) { li.classList.toggle("on", i === idx); li.setAttribute("aria-current", i === idx ? "step" : "false"); }); last.idx = idx; }
        M.story.style.setProperty("--p", p.toFixed(4));
      }
    }
    if (M.sheet) {
      var rs = M.sheet.getBoundingClientRect(), k = cl((vh - rs.top) / (vh * .75)), gap = Math.min(innerWidth * .05, 64);
      M.sheet.style.setProperty("--rg", ((1 - io3(k)) * gap).toFixed(1) + "px");
      M.sheet.style.setProperty("--rr", (lerp(innerWidth < 640 ? 34 : 48, innerWidth < 640 ? 24 : 32, io3(k))).toFixed(1) + "px");
      html.classList.toggle("sl-ondark", rs.top > th);
    }
  }
  function req() { if (!raf) raf = requestAnimationFrame(frame); }
  function sbw() { html.style.setProperty("--sbw", Math.max(0, innerWidth - html.clientWidth) + "px"); }
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", function () { sbw(); drawn = -1; req(); });
  sbw();

  window.SLScenes = {
    mount: function (root) {
      var story = root.querySelector(".sl-story"), sheet = root.querySelector(".sl-sheet");
      if (!story && !sheet) { M = null; return; }
      var L = {}; try { L = JSON.parse(story ? story.getAttribute("data-l") : "{}"); } catch (e) {}
      M = { story: story, cv: story && story.querySelector("canvas"), items: story ? Array.prototype.slice.call(story.querySelectorAll(".sl-story-steps li")) : [], L: L, sheet: sheet };
      C = story && story.closest(".lt") ? LIGHT : DARK;
      last = {}; drawn = -1; sbw();
      M.items.forEach(function (li, i) {
        li.addEventListener("click", function () {
          var span = story.offsetHeight - (innerHeight - toph()), top = story.getBoundingClientRect().top + scrollY - toph();
          scrollTo({ top: top + span * (i * .25 + .12), behavior: "smooth" });
        });
      });
      var go = function () { drawn = -1; req(); };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
      go();
    },
    unmount: function () { M = null; html.classList.remove("sl-ondark"); }
  };
  // launch.js renders before this file loads: mount on the page that is already there
  var main = document.getElementById("slMain");
  if (main && main.querySelector(".sl-story")) window.SLScenes.mount(main);
})();
