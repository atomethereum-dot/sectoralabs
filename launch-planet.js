/* Sectora Launch — the planet.
 * One WebGL scene does two jobs:
 *  1. Intro (once per session): on black, the planet dissolves in while a countdown runs from 10 to 00
 *     and the contract systems report ready; at 00 the Sectora mark lifts off the planet into orbit.
 *  2. Cover: the planet then settles to the right of the headline (like the Dashboard globe) and keeps
 *     turning, with the mark circling on its orbit. It fades out as you scroll and only runs on the home view.
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
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  var SMALL = Math.min(innerWidth, innerHeight) < 620;
  var dpr = SMALL ? Math.min(devicePixelRatio || 1, 2) : Math.min(2, Math.max(1.25, devicePixelRatio || 1));
  renderer.setPixelRatio(dpr); renderer.setClearColor(0x000000, 0);
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(FOV, 1, 0.05, 200);
  function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  resize(); addEventListener("resize", resize);

  /* ---------- land mask from the local world atlas ---------- */
  function landMask(W) {
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
  var globe = new T.Group(); root.add(globe);
  var surfMat = new T.ShaderMaterial({
    transparent: true,
    uniforms: { uMask: { value: landMask(SMALL ? 1024 : 2048) }, uDiss: { value: 1 }, uL: { value: LIGHT } },
    vertexShader: "varying vec2 vUv; varying vec3 vN; varying vec3 vNv;\n" +
      "void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vNv = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform sampler2D uMask; uniform float uDiss; uniform vec3 uL; varying vec2 vUv; varying vec3 vN; varying vec3 vNv;\n" +
      "float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\n" +
      "void main(){ float land = texture2D(uMask, vUv).r;\n" +
      "  vec3 base = mix(vec3(0.020, 0.027, 0.050), vec3(0.125, 0.145, 0.190), land);\n" +
      "  float lam = clamp(dot(vN, uL) * 0.5 + 0.5, 0.0, 1.0); base *= 0.32 + 0.95 * pow(lam, 1.35);\n" +
      "  float edge = 1.0 - abs(vNv.z); base += vec3(1.0) * pow(edge, 13.5) * 0.80 * (0.5 + 0.5 * lam); base += vec3(1.0) * pow(edge, 4.5) * 0.075;\n" +
      "  if (step(h21(floor(vUv * vec2(96.0, 48.0))), uDiss) < 0.5) discard;\n" +
      "  gl_FragColor = vec4(base, 1.0); }"
  });
  globe.add(new T.Mesh(new T.SphereGeometry(1, SMALL ? 128 : 192, SMALL ? 90 : 132), surfMat));
  var haloMat = new T.ShaderMaterial({ transparent: true, side: T.BackSide, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uA: { value: 1 } },
    vertexShader: "varying vec3 vNv; varying vec3 vN; void main(){ vNv=normalize(normalMatrix*normal); vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",
    fragmentShader: "uniform float uA; varying vec3 vNv; varying vec3 vN; void main(){ float f=pow(clamp(abs(vNv.z)/0.70,0.,1.),3.2); float lam=clamp(dot(vN,normalize(vec3(-.35,.75,.55)))*.5+.5,0.,1.); gl_FragColor=vec4(vec3(.16,.38,.95), f*.26*(.25+.75*lam)*uA);} " });
  var halo = new T.Mesh(new T.SphereGeometry(1.42, 64, 48), haloMat); halo.renderOrder = 1; root.add(halo);
  var atmoMat = new T.ShaderMaterial({ transparent: true, side: T.BackSide, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uA: { value: 1 } },
    vertexShader: haloMat.vertexShader,
    fragmentShader: "uniform float uA; varying vec3 vNv; varying vec3 vN; void main(){ float f=pow(clamp(abs(vNv.z)/0.37,0.,1.),5.0); float lam=clamp(dot(vN,normalize(vec3(-.35,.75,.55)))*.5+.5,0.,1.); gl_FragColor=vec4(vec3(.75,.84,1.0), f*.20*(.30+.70*lam)*uA);} " });
  var atmo = new T.Mesh(new T.SphereGeometry(1.075, 96, 64), atmoMat); atmo.renderOrder = 1; root.add(atmo);

  /* stars */
  var R = rng(2027), NS = SMALL ? 1200 : 2400, spos = new Float32Array(NS * 3), ssz = new Float32Array(NS), sfa = new Float32Array(NS);
  for (var i = 0; i < NS; i++) { var rr = 13 + R() * 17, th = R() * 6.2832, ph = Math.acos(2 * R() - 1); spos[i * 3] = rr * Math.sin(ph) * Math.cos(th); spos[i * 3 + 1] = rr * Math.sin(ph) * Math.sin(th); spos[i * 3 + 2] = rr * Math.cos(ph); ssz[i] = 0.9 + Math.pow(R(), 2.6) * 4.0; sfa[i] = R() * 6.283; }
  var sg = new T.BufferGeometry(); sg.setAttribute("position", new T.BufferAttribute(spos, 3)); sg.setAttribute("aSize", new T.BufferAttribute(ssz, 1)); sg.setAttribute("aFase", new T.BufferAttribute(sfa, 1));
  var starMat = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uDpr: { value: dpr }, uT: { value: 0 }, uA: { value: 1 } },
    vertexShader: "attribute float aSize; attribute float aFase; uniform float uDpr, uT; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); float pp = 0.72 + 0.28 * sin(uT * 1.15 + aFase); vA = (0.46 + 0.54 * (aSize/5.1)) * pp; gl_PointSize = max(1.0, aSize * uDpr); gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform float uA; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vec3(0.86,0.91,1.0), smoothstep(0.42, 0.02, d) * vA * uA); }" });
  scene.add(new T.Points(sg, starMat));

  /* orbit ring + the Sectora mark */
  var RO = 1.46;
  var orbit = new T.Group(); orbit.rotation.set(0.30, 0, -0.32); root.add(orbit);
  var opts = []; for (i = 0; i <= 240; i++) { var a = i / 240 * Math.PI * 2; opts.push(new T.Vector3(Math.cos(a) * RO, 0, Math.sin(a) * RO)); }
  var orbitMat = new T.LineBasicMaterial({ color: 0x7d9ad4, transparent: true, opacity: 0, depthWrite: false });
  var orbitLine = new T.LineLoop(new T.BufferGeometry().setFromPoints(opts), orbitMat); orbitLine.renderOrder = 2; orbit.add(orbitLine);
  function markTexture() {
    var s = 128, c = document.createElement("canvas"); c.width = c.height = s; var g = c.getContext("2d");
    var r = 14, m = 10; g.fillStyle = "#1569ff"; g.beginPath(); g.moveTo(m + r, m); g.arcTo(s - m, m, s - m, s - m, r); g.arcTo(s - m, s - m, m, s - m, r); g.arcTo(m, s - m, m, m, r); g.arcTo(m, m, s - m, m, r); g.closePath(); g.fill();
    g.strokeStyle = "#fff"; g.lineWidth = 10; g.beginPath(); g.arc(s / 2, s / 2, 25, 0, Math.PI * 2); g.stroke();
    var tx = new T.CanvasTexture(c); tx.minFilter = T.LinearFilter; return tx;
  }
  var mark = new T.Sprite(new T.SpriteMaterial({ map: markTexture(), transparent: true, depthWrite: false, opacity: 0 }));
  mark.scale.setScalar(0.11); mark.renderOrder = 4; root.add(mark);
  var trailN = 90, trailPos = new Float32Array(trailN * 3), trailGeo = new T.BufferGeometry();
  trailGeo.setAttribute("position", new T.BufferAttribute(trailPos, 3)); trailGeo.setDrawRange(0, 0);
  var trailMat = new T.LineBasicMaterial({ color: 0x7fa6ff, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
  var trail = new T.Line(trailGeo, trailMat); trail.renderOrder = 3; root.add(trail);
  var ringTex = (function () { var s = 128, c = document.createElement("canvas"); c.width = c.height = s; var g = c.getContext("2d"); var grd = g.createRadialGradient(s / 2, s / 2, s * .32, s / 2, s / 2, s * .5); grd.addColorStop(0, "rgba(90,130,255,0)"); grd.addColorStop(.55, "rgba(140,175,255,0.7)"); grd.addColorStop(1, "rgba(90,130,255,0)"); g.fillStyle = grd; g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, 6.284); g.fill(); return new T.CanvasTexture(c); })();
  var pulse = new T.Sprite(new T.SpriteMaterial({ map: ringTex, transparent: true, blending: T.AdditiveBlending, depthWrite: false, depthTest: false, opacity: 0 }));
  pulse.renderOrder = 5;
  root.add(pulse);

  /* launch path: from a point of the planet facing the viewer up to the orbit */
  var LAUNCH_DIR = new T.Vector3(-0.42, 0.66, 0.62).normalize();
  var ORBIT_A0 = Math.PI + 0.55, ORBIT_W = -0.24; // where the mark joins the orbit, and its angular speed
  function orbitPoint(angle, out) { out.set(Math.cos(angle) * RO, 0, Math.sin(angle) * RO); out.applyEuler(orbit.rotation); return out; }
  var P0 = LAUNCH_DIR.clone().multiplyScalar(1.01), P1 = orbitPoint(ORBIT_A0, new T.Vector3());
  var PC = LAUNCH_DIR.clone().multiplyScalar(1.75).add(new T.Vector3(0, .35, 0));
  var curve = new T.QuadraticBezierCurve3(P0, PC, P1);
  var tmp = new T.Vector3();

  /* ---------- framing: where the planet sits on screen ---------- */
  function frameFor(cx, cy, rad) {
    var t = Math.tan(FOV / 2 * D), d = innerHeight / (2 * rad * t), hh = d * t, hw = hh * camera.aspect;
    return { d: d, x: (cx / innerWidth * 2 - 1) * hw, y: -(cy / innerHeight * 2 - 1) * hh };
  }
  function introFrame() {
    var w = innerWidth, h = innerHeight;
    if (w < h * 1.1) return frameFor(w * .5, h * .32, Math.min(w * .31, h * .22));
    return frameFor(w * .68, h * .52, Math.min(h * .36, w * .25));
  }
  // on the cover the planet follows the #slOrbit box of the hero, so it scrolls with the page
  var anchor = null, anchorRect = null;
  function heroFrame() {
    if (!anchor || !anchor.isConnected) anchor = document.getElementById("slOrbit");
    var r = anchor && anchor.getBoundingClientRect();
    if (r && r.width > 10 && r.height > 10) {
      anchorRect = r;
      var wide = innerWidth >= 960, rad = wide ? Math.min(r.width * .37, r.height * .42) : Math.min(r.width * .30, r.height * .40);
      return frameFor(r.left + r.width * (wide ? .56 : .5), r.top + r.height * .5, rad);
    }
    anchorRect = null;
    var w = innerWidth, h = innerHeight;
    if (w < 960) return frameFor(w * .5, h * .8, w * .32);
    return frameFor(w * .76, h * .5, Math.min(h * .34, w * .22));
  }
  function place(f) { root.position.set(f.x, f.y, 0); camera.position.set(0, 0, f.d); camera.lookAt(0, 0, 0); }

  /* ---------- intro overlay text ---------- */
  var L = (function () { var s = ""; try { s = localStorage.getItem("sectoraLaunch.lang") || ""; } catch (e) {} s = s || (navigator.language || "en").slice(0, 2).toLowerCase(); return { es: 1, pt: 1 }[s] ? s : "en"; })();
  var TXT = {
    en: { lbl: "Ignition · T-minus", go: "Liftoff · Sectora Launch", tr: "Sectora Launch · Ignition", bl: "Ethereum · SECT", br: "Fair launches" },
    es: { lbl: "Ignición · cuenta atrás", go: "Despegue · Sectora Launch", tr: "Sectora Launch · Ignición", bl: "Ethereum · SECT", br: "Lanzamientos justos" },
    pt: { lbl: "Ignição · contagem", go: "Decolagem · Sectora Launch", tr: "Sectora Launch · Ignição", bl: "Ethereum · SECT", br: "Lançamentos justos" }
  }[L];
  var LOG = ["BONDING CURVE · 800,000,000 · ARMED", "FAIR WINDOW · 1 % / 5 MIN · ARMED", "CREATOR VESTING · 7 D + 30 D · LOCKED", "QUOTE · SECT · LIVE",
    "ROUTE · ETH → USDT → SECT · READY", "GRADUATION · UNISWAP · READY", "LP · 0x…DEAD · BURN ARMED", "SECTORA SHIELD · 8 CHECKS · ON", "SECT BURN · PLATFORM SHARE · ON", "ALL SYSTEMS · GO"];
  var big = null, lbl = null, rows = [];
  if (playIntro) {
    cover.innerHTML = "";
    ui = document.createElement("div"); ui.className = "li-ui"; ui.setAttribute("aria-hidden", "true");
    ui.innerHTML = '<span class="li-c li-tl"><span class="sl-mark"><i></i></span>SECTORA <em>LAUNCH</em></span><span class="li-c li-tr">' + TXT.tr + '</span><span class="li-c li-bl">' + TXT.bl + '</span><span class="li-c li-br">' + TXT.br + "</span>" +
      '<div class="li-count"><span class="li-lbl">' + TXT.lbl + '</span><b class="li-big">10</b><div class="li-log">' +
      LOG.map(function (x) { var p = x.split(" · "), st = p.pop(); return "<div>" + p.join(" · ") + " · <b>" + st + "</b></div>"; }).join("") + "</div></div>";
    document.body.appendChild(ui);
    big = ui.querySelector(".li-big"); lbl = ui.querySelector(".li-lbl"); rows = Array.prototype.slice.call(ui.querySelectorAll(".li-log > div"));
    canvas.classList.add("is-intro");
    html.classList.add("li-run");
  } else {
    dropCover();
    finishIntro();
  }

  /* ---------- timeline ---------- */
  var LIFT = 2.45, ARRIVE = 3.45, END = 4.3;
  var t0 = 0, last = 0, raf = 0, home = homeRoute, visible = true, skipAt = -1, introOver = !playIntro, hadLaunch = false;
  var spin = 0;
  function frameIntro(t) {
    var A = introFrame(), H = heroFrame(), m = io3(seg(t, 2.9, END));
    place({ d: lerp(A.d, H.d, m), x: lerp(A.x, H.x, m), y: lerp(A.y, H.y, m) });
    globe.rotation.set(.32 + .18 * m, -1.9 + t * .09, 0);
    surfMat.uniforms.uDiss.value = o3(seg(t, .1, 1.4));
    haloMat.uniforms.uA.value = seg(t, .5, 1.6); atmoMat.uniforms.uA.value = seg(t, .4, 1.5);
    starMat.uniforms.uT.value = t; starMat.uniforms.uA.value = .3 + .7 * seg(t, 0, 1.2);
    orbitMat.opacity = .3 * seg(t, ARRIVE - .3, END);
    // countdown and system log
    var n = Math.max(0, 10 - Math.floor(seg(t, .3, LIFT) * 10));
    if (big) big.textContent = String(n).padStart(2, "0");
    if (lbl) lbl.textContent = t >= LIFT ? TXT.go : TXT.lbl;
    rows.forEach(function (d, i) { var k = seg(t, .35 + i * .2, .55 + i * .2); d.style.opacity = k; d.style.transform = "translateX(" + ((1 - o3(k)) * -14) + "px)"; });
    if (ui) ui.style.opacity = 1 - seg(t, 3.0, 3.5);
    // lift-off: the mark leaves the planet and joins the orbit
    var f = seg(t, LIFT, ARRIVE), e = o3(f);
    pulse.position.copy(P0); var pk = seg(t, LIFT - .05, LIFT + .9); pulse.visible = pk > 0 && pk < 1; pulse.scale.setScalar(.02 + pk * .5); pulse.material.opacity = .9 * (1 - pk);
    if (t >= LIFT) {
      hadLaunch = true;
      curve.getPoint(e, tmp); mark.position.copy(tmp); mark.material.opacity = seg(t, LIFT, LIFT + .15);
      var n2 = Math.max(2, Math.floor(e * (trailN - 1)) + 1);
      for (var j = 0; j < n2; j++) { curve.getPoint(e * j / (n2 - 1), tmp); trailPos[j * 3] = tmp.x; trailPos[j * 3 + 1] = tmp.y; trailPos[j * 3 + 2] = tmp.z; }
      trailGeo.attributes.position.needsUpdate = true; trailGeo.setDrawRange(0, n2);
      trailMat.opacity = .85 * (1 - seg(t, ARRIVE, ARRIVE + 1.2));
      if (t > ARRIVE) { orbitPoint(ORBIT_A0 + (t - ARRIVE) * ORBIT_W, tmp); mark.position.copy(tmp); }
    } else { mark.material.opacity = 0; mark.position.copy(P0); }
  }
  var heroTick = 0;
  function frameHero(t, dt) {
    place(heroFrame());
    if (reduce) { t = END; dt = 0; }
    spin += dt * .035;
    globe.rotation.set(.5, -1.9 + 4.3 * .09 + spin, 0);
    surfMat.uniforms.uDiss.value = 1; haloMat.uniforms.uA.value = 1; atmoMat.uniforms.uA.value = 1;
    starMat.uniforms.uT.value = t; starMat.uniforms.uA.value = 1;
    orbitMat.opacity = .3; trailMat.opacity = 0; pulse.visible = false;
    orbitPoint(ORBIT_A0 + (t - ARRIVE) * ORBIT_W, tmp); mark.position.copy(tmp); mark.material.opacity = 1;
    // behind the planet the mark is hidden by depth (sprites are depth-tested)
  }
  mark.material.depthTest = true;

  function scrollFade() {
    var k = home ? 1 - seg(scrollY, innerHeight * .35, innerHeight * 1.25) : 0;
    canvas.style.opacity = k;
    visible = k > 0.01;
    html.classList.toggle("sl-top0", home && scrollY < 8);
  }
  var scrolled = false;
  addEventListener("scroll", function () { scrolled = true; scrollFade(); }, { passive: true });

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!t0) t0 = now;
    var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    var t = (now - t0) / 1000;
    if (!introOver) {
      var a = 1;
      if (skipAt >= 0) { a = 1 - o3(seg(now, skipAt, skipAt + 450)); if (a <= .001) t = END; }
      if (t >= 3.15 && !done) finishIntro();
      if (t >= END) {
        introOver = true; canvas.classList.remove("is-intro"); dropCover(); finishIntro();
        ["pointerdown", "keydown", "wheel", "touchmove"].forEach(function (ev) { removeEventListener(ev, skip, true); });
      } else {
        cover.style.background = "rgba(5,7,11," + (1 - seg(t, 3.15, END)) * (skipAt >= 0 ? a : 1) + ")";
        if (ui && skipAt >= 0) ui.style.opacity = Math.min(+ui.style.opacity || 1, a);
        try { frameIntro(t); } catch (e) { skip(); }
        renderer.render(scene, camera);
        return;
      }
    }
    if (!visible || document.hidden) return;
    if (SMALL && (heroTick++ & 1) && !scrolled) return; // phones: 30 fps while the page is still
    scrolled = false;
    frameHero(Math.max(t, END), dt);
    renderer.render(scene, camera);
  }
  function skip() {
    if (skipAt >= 0 || introOver) return;
    skipAt = performance.now();
    t0 = performance.now() - END * 1000 + 450; // jump to the cover framing, fading the overlay out
    finishIntro();
  }
  if (playIntro) ["pointerdown", "keydown", "wheel", "touchmove"].forEach(function (ev) { addEventListener(ev, skip, true); });
  else t0 = performance.now() - END * 1000; // straight to the cover framing

  window.SLPlanet = {
    setHome: function (on) { home = !!on; scrollFade(); }
  };
  scrollFade();
  // wait for the fonts (max 700 ms) so the counter does not jump
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 700); })]).then(function () {
    if (playIntro && skipAt < 0) t0 = 0;
    raf = requestAnimationFrame(loop);
  });
  // safety: whatever happens, the page appears
  setTimeout(function () { if (!introOver) { introOver = true; canvas.classList.remove("is-intro"); dropCover(); finishIntro(); } }, 9000);
})();
