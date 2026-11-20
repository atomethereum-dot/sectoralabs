/* Sectora SECT bridge — one-time deployment and linking (team only). */
(function () {
  "use strict";
  var S = window.SB, E = S.E, C = S.C;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var ICO = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>',
    bad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    wait: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>'
  };
  function row(st, txt, code) { return '<div class="dp-chk ' + st + '"><i>' + ICO[st] + "</i><div><span>" + esc(txt) + "</span>" + (code ? "<br><code>" + esc(code) + "</code>" : "") + "</div></div>"; }
  function nf(v, d) { return Number(v).toLocaleString("es-ES", { maximumFractionDigits: d == null ? 0 : d }); }
  function link(k, kind, v) { return C[k].exp ? C[k].exp + "/" + kind + "/" + v : ""; }
  var ok = { ethereum: false, bsc: false };
  function owner0Key(k) { return "sectoraBridge.owner0." + k; }

  // ---------------------------------------------------------------- read-only checks
  function checks(k) {
    var box = $(k === "ethereum" ? "bdChkE" : "bdChkB"), p = S.rp(k), e = S.ep(k), o = S.other(k), eid = C[o].eid;
    box.innerHTML = row("wait", "Comprobando en la cadena…");
    var jobs = [p.getNetwork().then(function (n) { return Number(n.chainId); }), e.eid().catch(function () { return 0n; }),
      e.defaultSendLibrary(eid).then(function (lib) { return e.getConfig(E.ZeroAddress, lib, eid, 2); }).then(S.decodeUln).catch(function () { return null; }),
      e.defaultReceiveLibrary(eid).then(function (lib) { return e.getConfig(E.ZeroAddress, lib, eid, 2); }).then(S.decodeUln).catch(function () { return null; })];
    if (k === "ethereum") { var t = S.sect("ethereum"); jobs.push(Promise.all([t.name(), t.symbol(), t.decimals(), t.totalSupply()]).catch(function () { return null; })); }
    return Promise.all(jobs).then(function (r) {
      var c = [[r[0] === C[k].id, "RPC conectado a " + C[k].name + " (chain id " + r[0] + ")", C[k].rpc[0]],
        [Number(r[1]) === C[k].eid, "LayerZero V2 activo en " + C[k].name + " (endpoint " + r[1] + ")", S.EP]];
      var dv = function (u, dir) { return u ? [u.requiredDVNs.length + Number(u.optionalDVNThreshold) >= 2, dir + ": " + u.requiredDVNs.length + " verificadores obligatorios" + (Number(u.optionalDVNThreshold) ? " + " + u.optionalDVNThreshold + " opcionales" : "") + " · " + u.confirmations + " confirmaciones", u.requiredDVNs.join(" · ")] : [false, dir + ": sin configuración", ""]; };
      c.push(dv(r[2], "Seguridad al enviar a " + C[o].name), dv(r[3], "Seguridad al recibir de " + C[o].name));
      if (k === "ethereum") {
        var tk = r[4];
        c.splice(1, 0, [!!tk && tk[0] === "Sectora" && tk[1] === "SECT" && Number(tk[2]) === 18, "SECT: " + (tk ? tk[0] + " · " + tk[1] + " · " + tk[2] + " decimales · suministro " + nf(E.formatEther(tk[3])) : "no encontrado") + " (no se modifica)", S.SECT]);
      }
      ok[k] = c.every(function (x) { return x[0]; });
      box.innerHTML = c.map(function (x) { return row(x[0] ? "ok" : "bad", x[1], x[2]); }).join("");
      return deployedState(k);
    }).catch(function (err) { box.innerHTML = row("bad", "No se pudo leer " + C[k].name + ": " + S.errMsg(err)); });
  }
  function deployedState(k) {
    var a = S.addrOf(k), st = $(k === "ethereum" ? "bdStE" : "bdStB"), btn = $(k === "ethereum" ? "bdDepE" : "bdDepB");
    if (!a) { st.textContent = "sin desplegar"; st.className = "st"; updateBtns(); return Promise.resolve(); }
    return S.rp(k).getCode(a).then(function (code) {
      var has = code && code.length > 2;
      st.textContent = has ? "desplegado · " + a.slice(0, 8) + "…" + a.slice(-6) : "dirección sin contrato";
      st.className = "st" + (has ? " ok" : "");
      btn.dataset.done = has ? "1" : "";
      updateBtns();
    });
  }
  function updateBtns() {
    var connected = !!S.W.addr, own = E.isAddress($("bdOwner").value.trim());
    [["ethereum", "bdDepE"], ["bsc", "bdDepB"]].forEach(function (x) {
      var b = $(x[1]), done = b.dataset.done === "1";
      b.disabled = !(connected && own && ok[x[0]]) || done;
      b.textContent = done ? "Ya desplegado en " + C[x[0]].name : "Desplegar en " + C[x[0]].name;
    });
    var both = E.isAddress($("bdAddrE").value.trim()) && E.isAddress($("bdAddrB").value.trim()) && parseFloat($("bdLimit").value) > 0;
    $("bdLinkE").disabled = $("bdLinkB").disabled = !(connected && both);
    $("bdHandE").disabled = !(connected && E.isAddress($("bdSafeE").value.trim()) && S.addrOf("ethereum"));
    $("bdHandB").disabled = !(connected && E.isAddress($("bdSafeB").value.trim()) && S.addrOf("bsc"));
    var lim = parseFloat($("bdLimit").value) || 0;
    $("bdLimitU").textContent = lim > 0 ? "≈ " + nf(lim / 50000000 * 100, 2) + " % del suministro de SECT por día y por dirección" + (px.sect ? " (≈ $" + nf(lim * px.sect) + ")" : "") : "";
  }
  var px = { sect: 0 };
  S.usdPrices().then(function (p) { px = p; updateBtns(); });

  // ---------------------------------------------------------------- wallet
  $("bdConnect").addEventListener("click", function () {
    S.connect().then(function (w) { $("bdWho").textContent = w.addr; if (!$("bdOwner").value) $("bdOwner").value = w.addr; updateBtns(); },
      function (e) { $("bdWho").textContent = e.message === "no-wallet" ? "No hay wallet en este navegador" : (e.message || "Cancelado"); });
  });
  ["bdOwner", "bdAddrE", "bdAddrB", "bdLimit", "bdSafeE", "bdSafeB"].forEach(function (id) { $(id).addEventListener("input", updateBtns); });
  function fail(el, e) { el.textContent = S.isReject(e) ? "Cancelado en la wallet." : "Error: " + S.errMsg(e); }

  // ---------------------------------------------------------------- deploy
  function deploy(k) {
    var st = $(k === "ethereum" ? "bdStateE" : "bdStateB"), out = $(k === "ethereum" ? "bdOutE" : "bdOutB"), btn = $(k === "ethereum" ? "bdDepE" : "bdDepB");
    var own = E.getAddress($("bdOwner").value.trim());
    btn.disabled = true; st.textContent = "Cambiando a " + C[k].name + "…"; out.innerHTML = "";
    S.switchTo(k).then(function () { st.textContent = "Confirma en tu wallet…"; return S.signer(); }).then(function (s) {
      var f = k === "ethereum" ? new E.ContractFactory(window.SB_ABI.adapter, window.SB_BYTECODE.adapter, s) : new E.ContractFactory(window.SB_ABI.oft, window.SB_BYTECODE.oft, s);
      return k === "ethereum" ? f.deploy(S.SECT, S.EP, own) : f.deploy(S.EP, own);
    }).then(function (c) {
      st.textContent = "Enviado. Esperando confirmación…";
      var h = c.deploymentTransaction().hash, u = link(k, "tx", h);
      out.innerHTML = '<div class="dp-out">Transacción: ' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(h) + "</a>" : esc(h)) + "</div>";
      return c.waitForDeployment().then(function () { return c.getAddress(); });
    }).then(function (a) {
      S.saveAddr(k, a);
      try { localStorage.setItem(owner0Key(k), own); } catch (e) {}
      $(k === "ethereum" ? "bdAddrE" : "bdAddrB").value = a;
      st.textContent = "Desplegado.";
      out.innerHTML += '<div class="dp-out">' + esc(k) + ': "' + esc(a) + '"</div>';
      deployedState(k); linkStatus();
    }).catch(function (e) { btn.disabled = false; fail(st, e); });
  }
  $("bdDepE").addEventListener("click", function () { deploy("ethereum"); });
  $("bdDepB").addEventListener("click", function () { deploy("bsc"); });

  // ---------------------------------------------------------------- link
  function validPair() {
    var ae = E.getAddress($("bdAddrE").value.trim()), ab = E.getAddress($("bdAddrB").value.trim());
    var a = new E.Contract(ae, window.SB_ABI.adapter, S.rp("ethereum")), b = new E.Contract(ab, window.SB_ABI.oft, S.rp("bsc"));
    return Promise.all([a.token().catch(function () { return ""; }), b.symbol().catch(function () { return ""; }), b.token().catch(function () { return ""; })]).then(function (r) {
      if (r[0].toLowerCase() !== S.SECT.toLowerCase()) throw new Error("La dirección de Ethereum no es el puente de SECT");
      if (r[1] !== "SECT" || r[2].toLowerCase() !== ab.toLowerCase()) throw new Error("La dirección de BNB Chain no es el SECT del puente");
      S.saveAddr("ethereum", ae); S.saveAddr("bsc", ab);
    });
  }
  function linkSide(k) {
    var st = $("bdStateL"), btn = $(k === "ethereum" ? "bdLinkE" : "bdLinkB");
    btn.disabled = true; st.textContent = "Comprobando…";
    var lim = E.parseEther(String(parseFloat($("bdLimit").value)));
    validPair().then(function () { return S.routeFor(k, lim); }).then(function (route) {
      st.textContent = "Cambiando a " + C[k].name + "…";
      return S.switchTo(k).then(function () { st.textContent = "Confirma en tu wallet…"; return S.signer(); }).then(function (s) { return S.bridge(k, s).configureRoute(route); });
    }).then(function (tx) { st.textContent = "Enviado. Esperando confirmación…"; return tx.wait(1); }).then(function () {
      st.textContent = "Enlazado en " + C[k].name + "."; btn.disabled = false; linkStatus();
    }).catch(function (e) { btn.disabled = false; fail(st, e); });
  }
  $("bdLinkE").addEventListener("click", function () { linkSide("ethereum"); });
  $("bdLinkB").addEventListener("click", function () { linkSide("bsc"); });
  function linkStatus() {
    var box = $("bdChkL"), ae = S.addrOf("ethereum"), ab = S.addrOf("bsc");
    if (!ae || !ab) { $("bdStL").textContent = "—"; box.innerHTML = ""; return Promise.resolve(); }
    var side = function (k) {
      var o = S.other(k), b = S.bridge(k), eid = C[o].eid;
      return Promise.all([b.peers(eid), b.inboundLimits(eid), b.inboundAvailable(eid), S.ep(k).isDefaultSendLibrary(S.addrOf(k), eid), b.owner()]).then(function (r) {
        return { k: k, peer: r[0].toLowerCase() === S.b32(S.addrOf(o)).toLowerCase(), limit: r[1].limit, avail: r[2], pinned: !r[3], owner: r[4] };
      }).catch(function () { return { k: k, peer: false, limit: 0n, avail: 0n, pinned: false, owner: "" }; });
    };
    return Promise.all([side("ethereum"), side("bsc")]).then(function (r) {
      var rows = [];
      r.forEach(function (x) {
        var n = C[x.k].name, o = C[S.other(x.k)].name;
        rows.push(row(x.peer ? "ok" : "bad", n + ": enlazado con " + o));
        rows.push(row(x.limit > 0n ? "ok" : "bad", n + ": pueden llegar " + nf(E.formatEther(x.limit)) + " SECT por día (ahora " + nf(E.formatEther(x.avail)) + ")"));
        rows.push(row(x.pinned ? "ok" : "bad", n + ": seguridad de LayerZero fijada en el contrato"));
        rows.push(row("ok", n + ": dueño", x.owner));
      });
      box.innerHTML = rows.join("");
      var done = r.every(function (x) { return x.peer && x.limit > 0n && x.pinned; });
      $("bdStL").textContent = done ? "listo" : "pendiente"; $("bdStL").className = "st" + (done ? " ok" : "");
      publish(done, r);
    });
  }
  // ---------------------------------------------------------------- hand over
  function handOver(k) {
    var st = $("bdStateH"), safe = E.getAddress($(k === "ethereum" ? "bdSafeE" : "bdSafeB").value.trim());
    st.textContent = "Comprobando la multifirma…";
    S.rp(k).getCode(safe).then(function (code) {
      if (!code || code.length <= 2) throw new Error("Esa dirección no es un contrato en " + C[k].name + ". Una Safe es un contrato: créala primero en esa red.");
      if (!window.confirm("¿Ceder el control del puente en " + C[k].name + " a " + safe + "? Es irreversible.")) throw { code: 4001 };
      return S.switchTo(k).then(function () { st.textContent = "Confirma en tu wallet…"; return S.signer(); }).then(function (s) { return S.bridge(k, s).handOver(safe); });
    }).then(function (tx) { st.textContent = "Enviado. Esperando confirmación…"; return tx.wait(1); }).then(function () {
      st.textContent = "Control cedido en " + C[k].name + "."; linkStatus();
    }).catch(function (e) { fail(st, e); });
  }
  $("bdHandE").addEventListener("click", function () { handOver("ethereum"); });
  $("bdHandB").addEventListener("click", function () { handOver("bsc"); });

  // ---------------------------------------------------------------- publish
  function publish(done, r) {
    var box = $("bdPub"), ae = S.addrOf("ethereum"), ab = S.addrOf("bsc");
    if (!done) { box.innerHTML = "Cuando esté enlazado aparecerán aquí las direcciones para enviármelas y los datos para verificar el código en Etherscan y BscScan."; return; }
    var o0 = function (k, fallback) { try { return localStorage.getItem(owner0Key(k)) || fallback; } catch (e) { return fallback; } };
    var enc = E.AbiCoder.defaultAbiCoder();
    var argsE = enc.encode(["address", "address", "address"], [S.SECT, S.EP, o0("ethereum", r[0].owner)]).slice(2);
    var argsB = enc.encode(["address", "address"], [S.EP, o0("bsc", r[1].owner)]).slice(2);
    box.innerHTML = '<div class="sl-alert is-ok">' + ICO.ok.replace("<svg", '<svg width="15" height="15"') + "<span>El puente está enlazado. Pruébalo con poco en bridge.html desde este navegador y luego envíame estas dos direcciones para publicarlo para todo el mundo.</span></div>" +
      '<div class="dp-out">ethereum: "' + esc(ae) + '",\nbsc: "' + esc(ab) + '"</div>' +
      '<p class="dp-note">Verificación en Etherscan y BscScan: compilador v0.8.24, optimización 200, EVM paris, archivo <a href="contracts/SectoraBridge.standard-input.json" download style="color:var(--blue)">SectoraBridge.standard-input.json</a>. Contrato en Ethereum: <code>contracts/SectoraBridge.sol:SectoraOFTAdapter</code>. Contrato en BNB Chain: <code>contracts/SectoraBridge.sol:SectoraOFT</code>.</p>' +
      '<p class="dp-note">Argumentos del constructor · Ethereum:</p><div class="dp-out">' + esc(argsE) + "</div>" +
      '<p class="dp-note">Argumentos del constructor · BNB Chain:</p><div class="dp-out">' + esc(argsB) + "</div>";
  }

  // ---------------------------------------------------------------- start
  $("bdAddrE").value = S.addrOf("ethereum"); $("bdAddrB").value = S.addrOf("bsc");
  checks("ethereum"); checks("bsc"); linkStatus(); updateBtns();
})();
