/* Sectora Launch — the planet.
 * One WebGL scene does two jobs:
 *  1. Intro "Horizon" (once per session): on black, the planet rises from below and settles as a faded
 *     horizon while the Sectora Launch name appears at the top; a light runs along the rim; then the page
 *     fades in around it. The planet is already where the cover keeps it, so the hand-off has no jump.
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
  try { seen = sessionStorage.getItem("sl_intro2") === "1"; sessionStorage.setItem("sl_intro2", "1"); } catch (e) {}
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
  function coverAt(lift) {
    if (!anchor || !anchor.isConnected) anchor = document.getElementById("slOrbit");
    var r = anchor && anchor.getBoundingClientRect(), w = innerWidth, h = innerHeight;
    if (!(r && r.width > 10 && r.height > 10)) r = { left: 0, width: w, top: h * .68, height: h * .22, bottom: h * .9 };
    var rad = w >= 960 ? Math.min(w * .54, 1060) : w * 1.06, k = renderer.getPixelRatio();
    place(frameFor(r.left + r.width * .5, r.top + r.height * .02 + rad + lift, rad));
    FADE.value.set((h - (r.bottom + r.height * .35 + lift)) * k, (h - (r.top + r.height * .30 + lift)) * k);
    OPAC.value = .95;
  }

  /* ---------- intro overlay: the name at the top ---------- */
  var TAGS = { en: "Fair launches · Ethereum · SECT", es: "Lanzamientos justos · Ethereum · SECT", pt: "Lançamentos justos · Ethereum · SECT",
    zh: "公平发行 · Ethereum · SECT", ru: "Честные запуски · Ethereum · SECT", fr: "Lancements équitables · Ethereum · SECT", ja: "公正なローンチ · Ethereum · SECT",
    ko: "공정한 출시 · Ethereum · SECT", ar: "إطلاقات عادلة · Ethereum · SECT", de: "Faire Launches · Ethereum · SECT", hi: "निष्पक्ष लॉन्च · Ethereum · SECT" };
  var L = (function () { var s = ""; try { s = sessionStorage.getItem("sectoraLaunch.lang") || ""; } catch (e) {} return TAGS[s] ? s : "en"; })();
  var TAG = TAGS[L];
  var lock = null, lmark = null, lword = null, ltag = null;
  if (playIntro) {
    cover.innerHTML = "";
    ui = document.createElement("div"); ui.className = "li-ui"; ui.setAttribute("aria-hidden", "true");
    ui.innerHTML = '<div class="li-lock"><span class="sl-mark"><i></i></span><span class="li-word">SECTORA <em>LAUNCH</em></span><span class="li-tag">' + TAG + "</span></div>";
    document.body.appendChild(ui);
    lock = ui.querySelector(".li-lock"); lmark = ui.querySelector(".sl-mark"); lword = ui.querySelector(".li-word"); ltag = ui.querySelector(".li-tag");
    canvas.classList.add("is-intro");
    html.classList.add("li-run");
  } else {
    dropCover();
    finishIntro();
  }

  /* ---------- timeline ---------- */
  var END = 3.3, SPIN0 = -1.513, SPD = .085; // turn speed, rad/s (one turn ~74 s)
  var o5 = function (x) { return 1 - Math.pow(1 - x, 5); };
  var back = function (x) { var c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  var t0 = 0, last = 0, home = homeRoute, visible = true, skipAt = -1, introOver = !playIntro, spin = 0, heroTick = 0, scrolled = false;
  function frameIntro(t) {
    coverAt((1 - o5(seg(t, .15, 1.9))) * innerHeight * .55);
    globe.rotation.set(.24, SPIN0 + (t - END) * SPD, 0);
    surfMat.uniforms.uDiss.value = o3(seg(t, .2, 1.3));
    haloMat.uniforms.uA.value = seg(t, .3, 1.4); atmoMat.uniforms.uA.value = seg(t, .3, 1.4);
    var sw = seg(t, 1.2, 2.5); SWEEP.value.set(lerp(-.8, .8, io3(sw)), Math.sin(Math.PI * sw) * .9);
    if (lock) {
      var out = seg(t, 2.25, 2.6);
      lock.style.opacity = 1 - out; lock.style.transform = "translate(-50%, calc(-50% - " + (out * 14).toFixed(1) + "px))";
      lmark.style.opacity = seg(t, .95, 1.2); lmark.style.transform = "scale(" + lerp(.7, 1, back(seg(t, .95, 1.4))).toFixed(3) + ")";
      lword.style.clipPath = "inset(-20% " + ((1 - seg(t, 1.25, 1.95)) * 100).toFixed(1) + "% -20% 0)";
      ltag.style.opacity = seg(t, 1.85, 2.3);
    }
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
      if (t >= 2.6) finishIntro();
      if (t >= END) endIntro();
      else {
        cover.style.background = "rgba(5,7,11," + (1 - seg(t, 2.55, END)).toFixed(3) + ")";
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
    t0 = skipAt - 2.55 * 1000; // jump to the hand-off: the planet is in place, the page fades in
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
  setTimeout(function () { if (!introOver) endIntro(); }, 9000);
})();
