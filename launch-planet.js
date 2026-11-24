/* Sectora Launch — the planet.
 * One WebGL scene does two jobs:
 *  1. Intro "Orbit" (once per session, ~6 s, any tap skips it): cinema bars and a field of stars; "Sectora
 *     Foundation presents"; the planet appears whole in deep space and a sunrise runs along its rim; the two
 *     networks lock onto it (Ethereum live, SectoraEVM coming soon); the camera dives until the planet is the
 *     horizon of the cover while the Sectora Launch title and the three graduation targets appear; then the
 *     bars open and the page fades in around the planet, already where the cover keeps it.
 *  2. Cover: the planet stays beneath the centred headline, faded downwards, turning slowly. It scrolls with
 *     the hero, fades out as you scroll and only runs on the home view.
 * Without WebGL, with reduced motion or after the first visit the intro is skipped.
 * window.SL_INTRO resolves when the page may animate in. */
(function () {
  "use strict";
  var T = window.THREE, TOPO = window.SECTORA_GLOBE_TOPOLOGY, html = document.documentElement;
  var cover = document.getElementById("li");
  var done = false, resolveIntro;
  window.SL_INTRO = new Promise(function (r) { resolveIntro = r; });
  function finishIntro() { if (done) return; done = true; html.classList.remove("li-run"); resolveIntro(); }
  window.SLPlanet = { setHome: function () {} };

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var seen = false;
  try { seen = sessionStorage.getItem("sl_intro3") === "1"; sessionStorage.setItem("sl_intro3", "1"); } catch (e) {}
  var homeRoute = !location.hash || /^#\/?$/.test(location.hash);
  var playIntro = !!cover && !seen && !reduce && homeRoute && scrollY < 40;

  var ui = null;
  function dropCover() {
    [cover, ui].forEach(function (el) { if (el && el.parentNode) { el.classList.add("out"); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 600); } });
  }
  if (!T || !TOPO) { dropCover(); finishIntro(); return; }

  var canvas = document.createElement("canvas");
  canvas.id = "slGlobe"; canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch (e) { canvas.remove(); dropCover(); finishIntro(); return; }
  html.classList.add("sl-gl");

  var D = Math.PI / 180, FOV = 30;
  var cl = function (x, a, b) { return Math.max(a == null ? 0 : a, Math.min(b == null ? 1 : b, x)); };
  var seg = function (t, a, b) { return cl((t - a) / (b - a)); };
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var o3 = function (x) { return 1 - Math.pow(1 - x, 3); };
  var io3 = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

  var SMALL = Math.min(innerWidth, innerHeight) < 620;
  var dpr = SMALL ? Math.min(devicePixelRatio || 1, 2.5) : Math.min(2.5, Math.max(1.5, devicePixelRatio || 1));
  renderer.setPixelRatio(dpr); renderer.setClearColor(0x000000, 0);
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(FOV, 1, 0.05, 200);
  function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  resize(); addEventListener("resize", resize);

  /* ---------- land mask from the local world atlas ---------- */
  function landMask(W) {
    W = Math.min(W, renderer.capabilities.maxTextureSize || 4096);
    var H = W / 2, c = document.createElement("canvas"); c.width = W; c.height = H;
    var g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
    var X = function (lon) { return (lon + 180) / 360 * W; }, Y = function (lat) { return (90 - lat) / 180 * H; };
    var sx = TOPO.transform.scale[0], sy = TOPO.transform.scale[1], tx = TOPO.transform.translate[0], ty = TOPO.transform.translate[1];
    var arcs = TOPO.arcs.map(function (a) { var x = 0, y = 0; return a.map(function (d) { x += d[0]; y += d[1]; return [x * sx + tx, y * sy + ty]; }); });
    var ring = function (idx) { var o = []; idx.forEach(function (i) { var a = i < 0 ? arcs[~i].slice().reverse() : arcs[i]; for (var k = o.length ? 1 : 0; k < a.length; k++) o.push(a[k]); }); return o; };
    var unwrap = function (r) { var o = [[r[0][0], r[0][1]]]; for (var i = 1; i < r.length; i++) { var lon = r[i][0], p = o[i - 1][0]; while (lon - p > 180) lon -= 360; while (p - lon > 180) lon += 360; o.push([lon, r[i][1]]); } return o; };
    var geom = TOPO.objects.land, src = geom.type === "GeometryCollection" ? geom.geometries : [geom];
    g.fillStyle = "#fff";
    src.forEach(function (gg) {
      var polys = gg.type === "MultiPolygon" ? gg.arcs : [gg.arcs];
      polys.forEach(function (p) {
        var rings = p.map(ring).map(unwrap), lo = Infinity, hi = -Infinity;
        rings.forEach(function (r) { r.forEach(function (q) { lo = Math.min(lo, q[0]); hi = Math.max(hi, q[0]); }); });
        var offs = [0]; if (hi > 180) offs.push(-360); if (lo < -180) offs.push(360);
        offs.forEach(function (off) { g.beginPath(); rings.forEach(function (r) { r.forEach(function (q, i) { var x = X(q[0] + off), y = Y(q[1]); if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); }); g.fill("evenodd"); });
      });
    });
    var tex = new T.CanvasTexture(c); tex.wrapS = T.RepeatWrapping; tex.minFilter = T.LinearMipmapLinearFilter; tex.magFilter = T.LinearFilter;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  /* ---------- planet: same look as the Dashboard globe ---------- */
  var LIGHT = new T.Vector3(-0.35, 0.75, 0.55).normalize();
  var root = new T.Group(); scene.add(root);
  var FADE = { value: new T.Vector2(-2, -1) }, OPAC = { value: 1 }; // screen-space fade (device px from the bottom) and overall opacity
  var SWEEP = { value: new T.Vector2(0, 0) }; // light running along the rim: x position in view space, strength
  var globe = new T.Group(); root.add(globe);
  var surfMat = new T.ShaderMaterial({
    transparent: true,
    uniforms: { uMask: { value: landMask(4096) }, uDiss: { value: 1 }, uL: { value: LIGHT }, uFade: FADE, uOp: OPAC, uSweep: SWEEP },
    vertexShader: "varying vec2 vUv; varying vec3 vN; varying vec3 vNv;\n" +
      "void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vNv = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform sampler2D uMask; uniform float uDiss; uniform vec3 uL; uniform vec2 uFade; uniform float uOp; uniform vec2 uSweep; varying vec2 vUv; varying vec3 vN; varying vec3 vNv;\n" +
      "float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n" +
      "void main(){ float raw = texture2D(uMask, vUv).r, land = smoothstep(0.25, 0.75, raw), coast = 1.0 - abs(raw - 0.5) * 2.0; coast *= coast;\n" +
      "  vec3 base = mix(vec3(0.026, 0.038, 0.072), vec3(0.200, 0.232, 0.300), land);\n" +
      "  float lam = clamp(dot(vN, uL) * 0.5 + 0.5, 0.0, 1.0); base *= 0.36 + 1.05 * pow(lam, 1.25);\n" +
      "  base += vec3(0.45, 0.60, 1.0) * coast * 0.30 * (0.35 + 0.65 * lam);\n" +
      "  float edge = 1.0 - abs(vNv.z); base += vec3(1.0) * pow(edge, 13.5) * 0.80 * (0.5 + 0.5 * lam); base += vec3(1.0) * pow(edge, 4.5) * 0.075;\n" +
      "  base += vec3(0.55, 0.68, 1.0) * pow(edge, 5.0) * exp(-pow((vNv.x - uSweep.x) / 0.16, 2.0)) * uSweep.y;\n" +
      "  if (step(h21(floor(vUv * vec2(96.0, 48.0))), uDiss) < 0.5) discard;\n" +
      "  gl_FragColor = vec4(base, uOp * smoothstep(uFade.x, uFade.y, gl_FragCoord.y)); }"
  });
  globe.add(new T.Mesh(new T.SphereGeometry(1, SMALL ? 160 : 256, SMALL ? 112 : 176), surfMat));
  var haloMat = new T.ShaderMaterial({ transparent: true, side: T.BackSide, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uA: { value: 1 }, uFade: FADE, uOp: OPAC },
    vertexShader: "varying vec3 vNv; varying vec3 vN; void main(){ vNv=normalize(normalMatrix*normal); vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",
    fragmentShader: "uniform float uA; uniform vec2 uFade; uniform float uOp; varying vec3 vNv; varying vec3 vN; void main(){ float f=pow(clamp(abs(vNv.z)/0.70,0.,1.),3.2)*uOp*smoothstep(uFade.x,uFade.y,gl_FragCoord.y); float lam=clamp(dot(vN,normalize(vec3(-.35,.75,.55)))*.5+.5,0.,1.); gl_FragColor=vec4(vec3(.16,.38,.95), f*.26*(.25+.75*lam)*uA);} " });
  var halo = new T.Mesh(new T.SphereGeometry(1.42, 64, 48), haloMat); halo.renderOrder = 1; root.add(halo);
  var atmoMat = new T.ShaderMaterial({ transparent: true, side: T.BackSide, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uA: { value: 1 }, uFade: FADE, uOp: OPAC },
    vertexShader: haloMat.vertexShader,
    fragmentShader: "uniform float uA; uniform vec2 uFade; uniform float uOp; varying vec3 vNv; varying vec3 vN; void main(){ float f=pow(clamp(abs(vNv.z)/0.37,0.,1.),5.0)*uOp*smoothstep(uFade.x,uFade.y,gl_FragCoord.y); float lam=clamp(dot(vN,normalize(vec3(-.35,.75,.55)))*.5+.5,0.,1.); gl_FragColor=vec4(vec3(.75,.84,1.0), f*.20*(.30+.70*lam)*uA);} " });
  var atmo = new T.Mesh(new T.SphereGeometry(1.075, 96, 64), atmoMat); atmo.renderOrder = 1; root.add(atmo);


  /* ---------- framing: the planet follows the #slOrbit box at the bottom of the hero ---------- */
  function frameFor(cx, cy, rad) {
    var t = Math.tan(FOV / 2 * D), d = innerHeight / (2 * rad * t), hh = d * t, hw = hh * camera.aspect;
    return { d: d, x: (cx / innerWidth * 2 - 1) * hw, y: -(cy / innerHeight * 2 - 1) * hh };
  }
  function place(f) { root.position.set(f.x, f.y, 0); camera.position.set(0, 0, f.d); camera.lookAt(0, 0, 0); }
  var anchor = null;
  // where the cover keeps the planet: centre and radius in CSS px, and the downward fade (device px)
  function coverGeom(lift) {
    if (!anchor || !anchor.isConnected) anchor = document.getElementById("slOrbit");
    var r = anchor && anchor.getBoundingClientRect(), w = innerWidth, h = innerHeight;
    if (!(r && r.width > 10 && r.height > 10)) r = { left: 0, width: w, top: h * .68, height: h * .22, bottom: h * .9 };
    var rad = w >= 960 ? Math.min(w * .54, 1060) : w * 1.06, k = renderer.getPixelRatio();
    return { cx: r.left + r.width * .5, cy: r.top + r.height * .02 + rad + lift, rad: rad,
      f0: (h - (r.bottom + r.height * .35 + lift)) * k, f1: (h - (r.top + r.height * .30 + lift)) * k };
  }
  function coverAt(lift) {
    var g = coverGeom(lift);
    place(frameFor(g.cx, g.cy, g.rad));
    FADE.value.set(g.f0, g.f1);
    OPAC.value = .95;
  }

  /* ---------- intro overlay ---------- */
  var TX = {
    en: ["Sectora Foundation presents", "Live now", "Coming soon", "Fair launches · Ethereum · SECT", "Graduation", "Skip"],
    es: ["Sectora Foundation presenta", "En vivo", "Próximamente", "Lanzamientos justos · Ethereum · SECT", "Graduación", "Saltar"],
    pt: ["Sectora Foundation apresenta", "Ao vivo", "Em breve", "Lançamentos justos · Ethereum · SECT", "Graduação", "Pular"],
    zh: ["Sectora Foundation 呈现", "已上线", "即将推出", "公平发行 · Ethereum · SECT", "毕业", "跳过"],
    ru: ["Sectora Foundation представляет", "Уже работает", "Скоро", "Честные запуски · Ethereum · SECT", "Выпуск", "Пропустить"],
    fr: ["Sectora Foundation présente", "En direct", "Bientôt", "Lancements équitables · Ethereum · SECT", "Graduation", "Passer"],
    ja: ["Sectora Foundation プレゼンツ", "稼働中", "近日公開", "公正なローンチ · Ethereum · SECT", "卒業", "スキップ"],
    ko: ["Sectora Foundation 제공", "운영 중", "출시 예정", "공정한 출시 · Ethereum · SECT", "졸업", "건너뛰기"],
    ar: ["Sectora Foundation تقدّم", "متاح الآن", "قريبًا", "إطلاقات عادلة · Ethereum · SECT", "التخرّج", "تخطٍّ"],
    de: ["Sectora Foundation präsentiert", "Live", "Demnächst", "Faire Launches · Ethereum · SECT", "Graduierung", "Überspringen"],
    hi: ["Sectora Foundation प्रस्तुत करता है", "लाइव", "जल्द आ रहा है", "निष्पक्ष लॉन्च · Ethereum · SECT", "ग्रेजुएशन", "छोड़ें"]
  };
  var L = (function () { var s = ""; try { s = sessionStorage.getItem("sectoraLaunch.lang") || ""; } catch (e) {} return TX[s] ? s : "en"; })();
  var W = TX[L];
  var ETH = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#627EEA"/><g fill="#FFF"><path fill-opacity=".602" d="M16.498 4v8.87l7.497 3.35z"/><path d="M16.498 4 9 16.22l7.498-3.35z"/><path fill-opacity=".602" d="M16.498 21.968v6.027L24 17.616z"/><path d="M16.498 27.995v-6.028L9 17.616z"/><path fill-opacity=".2" d="m16.498 20.573 7.497-4.353-7.497-3.348z"/><path fill-opacity=".602" d="m9 16.22 7.498 4.353v-7.701z"/></g></svg>';
  var SEVM = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#1569ff"/><circle cx="16" cy="16" r="7.4" fill="none" stroke="#fff" stroke-width="3"/></svg>';
  var el = {}, stars = null, sg = null, SN = [];
  if (playIntro) {
    cover.innerHTML = '<canvas class="li-stars"></canvas>';
    stars = cover.querySelector("canvas"); sg = stars.getContext("2d");
    var seed = 7; var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var i = 0; i < (SMALL ? 170 : 320); i++) SN.push({ x: rnd() * 2 - 1, y: rnd() * 2 - 1, z: .15 + rnd() * .85, b: .25 + rnd() * .75, tw: rnd() * 6.28 });
    ui = document.createElement("div"); ui.className = "li-ui"; ui.setAttribute("aria-hidden", "true");
    ui.innerHTML =
      '<i class="li-bar t"></i><i class="li-bar b"><span>SECTORA LAUNCH · ETHEREUM · SECTORAEVM</span><span>' + W[5] + ' ›</span></i>' +
      '<div class="li-pre">' + W[0] + "</div>" +
      '<svg class="li-beams"><line class="b1"/><line class="b2"/><circle class="p1" r="3"/><circle class="p2" r="3"/></svg>' +
      '<div class="li-net n1"><i class="li-logo">' + ETH + '</i><div><b>ETHEREUM</b><span><i class="li-dot live"></i>' + W[1] + "</span></div></div>" +
      '<div class="li-net n2"><i class="li-logo">' + SEVM + '</i><div><b>SECTORAEVM</b><span><i class="li-dot soon"></i>' + W[2] + "</span></div></div>" +
      '<div class="li-flare"><i></i></div>' +
      '<div class="li-lock"><i class="li-burst"></i><span class="sl-mark"><i></i></span><span class="li-word">SECTORA <em>LAUNCH</em></span><span class="li-tag">' + W[3] + "</span>" +
      '<span class="li-grad"><em>' + W[4] + "</em><b>$3K</b><i></i><b>$7K</b><i></i><b>$15K</b></span></div>";
    document.body.appendChild(ui);
    ["li-bar t", "li-bar b", "li-pre", "li-beams", "li-net n1", "li-net n2", "li-flare", "li-lock", "li-burst", "sl-mark", "li-word", "li-tag", "li-grad"].forEach(function (c) {
      el[c.replace("li-", "").replace(" ", "")] = ui.querySelector("." + c.split(" ").join("."));
    });
    el.n1 = ui.querySelector(".li-net.n1"); el.n2 = ui.querySelector(".li-net.n2");
    el.l1 = ui.querySelector("line.b1"); el.l2 = ui.querySelector("line.b2"); el.p1 = ui.querySelector("circle.p1"); el.p2 = ui.querySelector("circle.p2");
    canvas.classList.add("is-intro");
    html.classList.add("li-run");
  } else {
    dropCover();
    finishIntro();
  }

  /* ---------- timeline (seconds) ---------- */
  var END = 6.4, HAND = 5.6, SPIN0 = -1.513, SPD = .085; // turn speed, rad/s (one turn ~74 s)
  var o5 = function (x) { return 1 - Math.pow(1 - x, 5); };
  var back = function (x) { var c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  var bell = function (t, a, b, c, d) { return seg(t, a, b) * (1 - seg(t, c, d)); };
  var t0 = 0, last = 0, home = homeRoute, visible = true, skipAt = -1, introOver = !playIntro, spin = 0, heroTick = 0, scrolled = false;
  function drawStars(t, warp, fade) {
    var w = innerWidth, h = innerHeight, k = Math.min(devicePixelRatio || 1, 2);
    if (stars.width !== Math.round(w * k)) { stars.width = Math.round(w * k); stars.height = Math.round(h * k); }
    sg.setTransform(k, 0, 0, k, 0, 0); sg.clearRect(0, 0, w, h);
    var cx = w / 2, cy = h * .47, R = Math.max(w, h) * .75, drift = t * .012;
    for (var i = 0; i < SN.length; i++) {
      var s = SN[i], f = 1 + warp * 2.6 * s.z, x = cx + (s.x + drift * s.z) * R * f, y = cy + s.y * R * f;
      var a = s.b * fade * (.65 + .35 * Math.sin(t * 2.1 + s.tw));
      if (a <= .01 || x < -20 || x > w + 20 || y < -20 || y > h + 20) continue;
      if (warp > .02) {
        var f2 = 1 + Math.max(0, warp - .08) * 2.6 * s.z, x2 = cx + (s.x + drift * s.z) * R * f2, y2 = cy + s.y * R * f2;
        sg.strokeStyle = "rgba(190,210,255," + a.toFixed(3) + ")"; sg.lineWidth = .6 + s.z * 1.1;
        sg.beginPath(); sg.moveTo(x2, y2); sg.lineTo(x, y); sg.stroke();
      } else { sg.fillStyle = "rgba(210,224,255," + a.toFixed(3) + ")"; var r = .45 + s.z * 1.05; sg.fillRect(x - r / 2, y - r / 2, r, r); }
    }
  }
  function frameIntro(t) {
    var w = innerWidth, h = innerHeight, mob = w < 760;
    // the planet: whole in deep space, then the camera dives until it is the cover's horizon
    var r0 = Math.min(w * (mob ? .27 : .15), h * .17), A = { cx: w / 2, cy: h * (mob ? .5 : .47), rad: r0 }, B = coverGeom(0);
    var k = io3(seg(t, 3.4, 5.0)), rad = A.rad * Math.pow(B.rad / A.rad, k), cx = lerp(A.cx, B.cx, k), cy = lerp(A.cy, B.cy, k);
    place(frameFor(cx, cy, rad));
    var kf = seg(k, .5, 1); FADE.value.set(lerp(-2, B.f0, kf), lerp(-1, B.f1, kf)); OPAC.value = lerp(1, .95, k);
    globe.rotation.set(.24 + (1 - k) * .12, SPIN0 + (t - END) * SPD - (1 - o3(seg(t, .5, 4.95))) * 1.35, 0);
    surfMat.uniforms.uDiss.value = o3(seg(t, 1.2, 2.3));
    haloMat.uniforms.uA.value = seg(t, 1.3, 2.4); atmoMat.uniforms.uA.value = seg(t, 1.3, 2.4);
    var sw = seg(t, 1.95, 3.2), sw2 = seg(t, 4.3, 5.5);
    if (sw2 > 0) SWEEP.value.set(lerp(-.8, .8, io3(sw2)), Math.sin(Math.PI * sw2) * .9);
    else SWEEP.value.set(lerp(-.85, .85, io3(sw)), Math.sin(Math.PI * sw) * 1.1);
    // stars: drift, warp while diving, gone when the page arrives
    drawStars(t, bell(t, 3.45, 4.05, 4.5, 5.1), seg(t, .1, 1.1) * (1 - seg(t, 4.6, 5.6)));
    // cinema bars
    var bh = Math.round((mob ? .085 : .105) * h), bk = o3(seg(t, 0, .7)) * (1 - io3(seg(t, HAND, END)));
    el["bart"].style.height = el["barb"].style.height = (bh * bk).toFixed(1) + "px";
    el["barb"].style.setProperty("--o", seg(t, .7, 1.2) * (1 - seg(t, 5.2, 5.6)));
    // "Sectora Foundation presents"
    var pr = bell(t, .3, .75, 1.2, 1.55);
    el.pre.style.opacity = pr; el.pre.style.letterSpacing = lerp(.62, .42, seg(t, .3, 1.55)).toFixed(3) + "em";
    // sunrise on the rim: an anamorphic flare at the top of the planet
    var fl = bell(t, 2.05, 2.5, 2.75, 3.4);
    el.flare.style.opacity = fl; el.flare.style.transform = "translate(" + (cx - 0).toFixed(1) + "px," + (cy - rad).toFixed(1) + "px) scaleX(" + lerp(.4, 1, seg(t, 2.05, 2.8)).toFixed(3) + ")";
    // the two networks lock onto the planet
    var nin = o3(seg(t, 2.35, 2.9)), nout = seg(t, 3.35, 3.8), gap = mob ? r0 + 26 : r0 + 46;
    var p1 = mob ? [A.cx, A.cy - gap] : [A.cx - gap, A.cy], p2 = mob ? [A.cx, A.cy + gap] : [A.cx + gap, A.cy];
    [[el.n1, p1, -1], [el.n2, p2, 1]].forEach(function (n) {
      var off = (1 - nin) * 40 + nout * 70, dx = mob ? 0 : n[2] * off, dy = mob ? n[2] * off : 0;
      n[0].style.opacity = nin * (1 - nout); n[0].style.filter = nout > 0 ? "blur(" + (nout * 6).toFixed(1) + "px)" : "";
      n[0].style.transform = "translate(" + (n[1][0] + dx).toFixed(1) + "px," + (n[1][1] + dy).toFixed(1) + "px) translate(" + (mob ? "-50%" : n[2] < 0 ? "-100%" : "0") + "," + (mob ? (n[2] < 0 ? "-100%" : "0") : "-50%") + ")";
    });
    var bl = o3(seg(t, 2.6, 3.1)) * (1 - nout), e1 = mob ? [A.cx, A.cy - r0 - 4] : [A.cx - r0 - 4, A.cy], e2 = mob ? [A.cx, A.cy + r0 + 4] : [A.cx + r0 + 4, A.cy];
    [[el.l1, el.p1, p1, e1], [el.l2, el.p2, p2, e2]].forEach(function (b) {
      var sx = b[2][0], sy = b[2][1], ex = lerp(sx, b[3][0], bl), ey = lerp(sy, b[3][1], bl);
      b[0].setAttribute("x1", sx); b[0].setAttribute("y1", sy); b[0].setAttribute("x2", ex.toFixed(1)); b[0].setAttribute("y2", ey.toFixed(1));
      b[0].style.opacity = bl > 0 ? 1 - nout : 0; b[1].setAttribute("cx", ex.toFixed(1)); b[1].setAttribute("cy", ey.toFixed(1)); b[1].style.opacity = bl > .02 ? (1 - nout) : 0;
    });
    // the title
    var tin = seg(t, 4.25, 4.7), tout = seg(t, HAND - .2, HAND + .15);
    el.lock.style.opacity = 1 - tout; el.lock.style.transform = "translate(-50%, calc(-50% - " + (tout * 16).toFixed(1) + "px))";
    el["sl-mark"].style.opacity = tin; el["sl-mark"].style.transform = "scale(" + lerp(.6, 1, back(seg(t, 4.25, 4.75))).toFixed(3) + ")";
    el.burst.style.opacity = bell(t, 4.3, 4.45, 4.55, 5.2); el.burst.style.transform = "translate(-50%,-50%) scale(" + lerp(.2, 3.2, o3(seg(t, 4.3, 5.2))).toFixed(3) + ")";
    var wd = seg(t, 4.45, 5.15);
    el.word.style.opacity = o3(wd); el.word.style.letterSpacing = lerp(.95, .3, o5(wd)).toFixed(3) + "em"; el.word.style.marginRight = "-" + lerp(.95, .3, o5(wd)).toFixed(3) + "em";
    el.word.style.filter = wd < 1 ? "blur(" + ((1 - o3(wd)) * 8).toFixed(1) + "px)" : "";
    el.tag.style.opacity = seg(t, 4.9, 5.3);
    var gr = seg(t, 5.0, 5.4); el.grad.style.opacity = gr; el.grad.style.transform = "translateY(" + ((1 - o3(gr)) * 8).toFixed(1) + "px)";
  }
  function frameHero(t, dt) {
    coverAt(0);
    if (!reduce) spin += dt * SPD;
    globe.rotation.set(.24, SPIN0 + spin, 0);
    surfMat.uniforms.uDiss.value = 1; haloMat.uniforms.uA.value = 1; atmoMat.uniforms.uA.value = 1;
    SWEEP.value.set(0, 0);
  }

  function scrollFade() {
    var k = home ? 1 - seg(scrollY, innerHeight * .35, innerHeight * 1.25) : 0;
    canvas.style.opacity = k;
    visible = k > 0.01;
    html.classList.toggle("sl-top0", home && scrollY < 8);
  }
  addEventListener("scroll", function () { scrolled = true; scrollFade(); }, { passive: true });

  function endIntro() {
    introOver = true; canvas.classList.remove("is-intro"); dropCover(); finishIntro();
    ["pointerdown", "keydown", "wheel", "touchmove"].forEach(function (ev) { removeEventListener(ev, skip, true); });
  }
  function loop(now) {
    requestAnimationFrame(loop);
    if (!t0) t0 = now;
    var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    var t = (now - t0) / 1000;
    if (!introOver) {
      if (t >= HAND + .15) finishIntro();
      if (t >= END) endIntro();
      else {
        cover.style.background = "rgba(5,7,11," + (1 - seg(t, HAND, END)).toFixed(3) + ")";
        try { frameIntro(t); } catch (e) { skip(); }
        renderer.render(scene, camera);
        return;
      }
    }
    if (!visible || document.hidden) return;
    if (SMALL && (heroTick++ & 1) && !scrolled) return; // phones: 30 fps while the page is still
    scrolled = false;
    frameHero(t, dt);
    renderer.render(scene, camera);
  }
  function skip() {
    if (skipAt >= 0 || introOver) return;
    skipAt = performance.now();
    t0 = skipAt - HAND * 1000; // jump to the hand-off: the planet is in place, the page fades in
    finishIntro();
  }
  if (playIntro) ["pointerdown", "keydown", "wheel", "touchmove"].forEach(function (ev) { addEventListener(ev, skip, true); });

  window.SLPlanet = { setHome: function (on) { home = !!on; scrollFade(); } };
  scrollFade();
  // wait for the fonts (max 700 ms) so the name does not jump
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 700); })]).then(function () {
    if (playIntro && skipAt < 0) t0 = 0;
    requestAnimationFrame(loop);
  });
  // safety: whatever happens, the page appears
  setTimeout(function () { if (!introOver) endIntro(); }, 12000);
})();
