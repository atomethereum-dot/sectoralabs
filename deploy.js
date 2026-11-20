/* Sectora Launch — one-time deployment of the fair-launch contract on Ethereum (team only).
 * Every coin is priced in SECT: reserves sized in dollars with the 30-minute SECT/USDT price, ETH swapped to SECT on Uniswap V3,
 * launch into a COIN/SECT Uniswap V2 pool with the LP burned. */
(function () {
  "use strict";
  var E = window.ethers, C = window.SLLive.chains, ORDER = window.SLLive.order.filter(function (k) { return C[k] && C[k].qaddr && C[k].oracle; });
  var $ = function (id) { return document.getElementById(id); };
  var W = null, ok = false, px = { sect: 0, oracle: 0 }, runId = 0, fbEdited = false;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var ICO = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"/></svg>',
    bad: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    wait: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>'
  };
  var providers = [];
  window.addEventListener("eip6963:announceProvider", function (e) { if (e.detail && e.detail.provider) providers.push(e.detail); });
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  ORDER.forEach(function (k) { var o = document.createElement("option"); o.value = k; o.textContent = C[k].name + " · " + C[k].qs + " (" + C[k].id + ")"; $("dpNet").appendChild(o); });
  function net() { return $("dpNet").value; }
  function path(k) { return E.solidityPacked(["address", "uint24", "address", "uint24", "address"], C[k].path); }
  function num(id) { return parseFloat(String($(id).value).replace(",", ".")) || 0; }
  function nf(v, d) { return v.toLocaleString("es-ES", { maximumFractionDigits: d == null ? (v >= 100 ? 0 : 4) : d }); }
  function usd(v) { return "$" + nf(v, v >= 100 ? 0 : 2); }
  function setDefaults() {
    $("dpTU").value = "15000"; $("dpCU").value = "500"; $("dpBurn").value = "50"; fbEdited = false; px = { sect: 0, oracle: 0 };
    loadPx(); preview(); runChecks();
  }
  function best(pairs, addr, ds) {
    var b = null;
    (pairs || []).forEach(function (p) { if (p.chainId === ds && p.baseToken && p.baseToken.address.toLowerCase() === addr.toLowerCase()) { var l = (p.liquidity && p.liquidity.usd) || 0; if (!b || l > b.l) b = { l: l, p: +p.priceUsd }; } });
    return b ? b.p : 0;
  }
  // 30-minute average SECT price in dollars, from the same V3 pool the contract reads
  var OPOOL = ["function slot0() view returns (uint160,int24,uint16,uint16,uint16,uint32,bool)", "function token0() view returns (address)", "function token1() view returns (address)",
    "function observe(uint32[]) view returns (int56[], uint160[])", "function increaseObservationCardinalityNext(uint16)"];
  function oracleRead(k) {
    var ch = C[k], p = reader(k), pool = new E.Contract(ch.oracle, OPOOL, p);
    var dec = function (a) { return new E.Contract(a, ["function decimals() view returns (uint8)"], p).decimals().then(Number); };
    return Promise.all([pool.token0(), pool.token1(), pool.slot0(), pool.observe([1800, 0]).catch(function () { return null; })]).then(function (r) {
      var q0 = r[0].toLowerCase() === ch.qaddr.toLowerCase(), q1 = r[1].toLowerCase() === ch.qaddr.toLowerCase();
      return Promise.all([dec(ch.qaddr), dec(q0 ? r[1] : r[0])]).then(function (d) {
        var price = 0, tk = function (t) { var e = q0 ? t : -t; return Math.pow(1.0001, e) * Math.pow(10, d[0] - d[1]); };
        var spot = tk(Number(r[2][1]));
        if (r[3]) { var dt = Number(r[3][0][1] - r[3][0][0]); price = tk(Math.floor(dt / 1800)); }
        return { has: q0 || q1, price: price, spot: spot, card: Number(r[2][3]), next: Number(r[2][4]) };
      });
    });
  }
  // fallback sizes (only used if the oracle cannot answer): the dollar amounts at today's 30-minute price
  function autoFallback() {
    if (fbEdited || !px.oracle) return;
    $("dpTF").value = String(Math.round(num("dpTU") / px.oracle));
    $("dpCF").value = String(Math.round(num("dpCU") / px.oracle));
  }
  function loadPx() {
    var ch = C[net()], k = net();
    fetch("https://api.dexscreener.com/latest/dex/tokens/" + ch.qaddr).then(function (r) { return r.json(); }).then(function (j) {
      if (net() !== k) return; px.sect = best(j.pairs, ch.qaddr, ch.ds); preview();
    }).catch(function () {});
    oracleRead(k).then(function (o) { if (net() !== k) return; px.oracle = o.price || o.spot; autoFallback(); preview(); updateBtn(); }).catch(function () {});
  }
  function preview() {
    var tu = num("dpTU"), cu = num("dpCU"), tf = num("dpTF"), cf = num("dpCF"), b = num("dpBurn"), op = px.oracle;
    // 1B supply: 535.28M tokens in the reserve, 349.72M in the pool
    var res = 1e9 * (1 - 0.115) * 150 / 248, rp = tu / res;
    $("dpTUu").textContent = tu > 0 ? (op ? "Hoy son ≈ " + nf(tu / op) + " SECT (precio medio de 30 min: $" + nf(op, 6) + "). " : "") +
      "Con 1.000 millones de tokens: precio en la reserva ≈ $" + nf(rp, 8) + ", al abrir ≈ $" + nf(rp * 1.5, 8) + " y valor al abrir ≈ " + usd(rp * 1.5 * 1e9) + "." : "";
    $("dpCUu").textContent = cu > 0 ? (op ? "Hoy son ≈ " + nf(cu / op) + " SECT. " : "") + (tu > 0 ? "Hacen falta al menos " + Math.ceil(tu / cu) + " wallets para llenar una reserva." : "") : "";
    $("dpFBu").textContent = tf > 0 && cf > 0 ? "Solo si el oráculo no responde: objetivo " + nf(tf) + " SECT y máximo " + nf(cf) + " SECT por wallet" + (px.sect ? " (≈ " + usd(tf * px.sect) + " y " + usd(cf * px.sect) + " hoy)" : "") + ". Con el oráculo funcionando, el contrato nunca usa menos de 1/50 ni más de 50 veces estos valores." : "";
    $("dpBurnU").textContent = "Del 1 % que se queda la plataforma al lanzar cada moneda se quema el " + b + " % y el " + (100 - b) + " % va a la cartera de comisiones.";
  }
  function row(st, txt, code) { return '<div class="dp-chk ' + st + '"><i>' + ICO[st] + "</i><div><span>" + esc(txt) + "</span>" + (code ? "<br><code>" + esc(code) + "</code>" : "") + "</div></div>"; }
  function reader(k) { return new E.JsonRpcProvider(C[k].rpc[0], C[k].id, { staticNetwork: E.Network.from(C[k].id) }); }
  function runChecks() {
    var k = net(), ch = C[k], id = ++runId, box = $("dpChecks");
    ok = false; updateBtn();
    box.innerHTML = row("wait", "Comprobando en la cadena…");
    var p = reader(k);
    var T = new E.Contract(ch.qaddr, ["function symbol() view returns (string)", "function decimals() view returns (uint8)"], p);
    var F = new E.Contract(ch.dexFactory, ["function allPairsLength() view returns (uint)"], p);
    var R = new E.Contract(ch.router, ["function factory() view returns (address)", "function WETH() view returns (address)"], p);
    var R3 = new E.Contract(ch.v3router, ["function WETH9() view returns (address)"], p);
    var Q = new E.Contract(ch.quoter, ["function quoteExactInput(bytes path, uint256 amountIn) returns (uint256 amountOut, uint160[], uint32[], uint256)"], p);
    var nope = function () { return null; };
    Promise.all([
      p.getNetwork().then(function (n) { return Number(n.chainId); }),
      T.symbol().catch(nope), T.decimals().catch(nope),
      F.allPairsLength().catch(function () { return -1n; }),
      R.factory().catch(nope), R.WETH().catch(nope), R3.WETH9().catch(nope),
      Q.quoteExactInput.staticCall(path(k), E.parseEther("0.01")).then(function (r) { return r[0]; }).catch(nope),
      oracleRead(k).catch(nope)
    ]).then(function (r) {
      if (id !== runId) return;
      var same = function (a, b) { return a && b && a.toLowerCase() === b.toLowerCase(); }, o = r[8];
      var c = [
        [r[0] === ch.id, "RPC conectado a " + ch.name + " (chain id " + r[0] + ")", ch.rpc[0]],
        [r[1] === "SECT" && Number(r[2]) === 18, "Moneda de cotización: " + (r[1] || "no encontrada") + " · " + r[2] + " decimales", ch.qaddr],
        [r[3] > 0n, "Uniswap V2 (pool de cada moneda): fábrica con " + (r[3] > 0n ? Number(r[3]).toLocaleString("es-ES") + " pools" : "sin código"), ch.dexFactory],
        [same(r[4], ch.dexFactory) && same(r[5], ch.wnative), "Router de Uniswap V2 (compraventa en la web) apunta a la misma fábrica y a WETH", ch.router],
        [same(r[6], ch.wnative), "Router de Uniswap V3 (pagar con ETH) usa WETH", ch.v3router],
        [r[7] && r[7] > 0n, "Ruta ETH → USDT → SECT: 0,01 ETH = " + (r[7] ? nf(Number(E.formatEther(r[7])), 2) + " SECT" : "sin liquidez"), ch.quoter],
        [!!(o && o.has), "Oráculo de precio: " + ch.oracleDex + (o ? " · ahora $" + nf(o.spot, 6) + (o.price ? " · media de 30 min $" + nf(o.price, 6) : "") : ""), ch.oracle]
      ];
      var hist = "";
      if (o && o.next < 100) hist = '<div class="dp-chk bad"><i>' + ICO.bad + "</i><div><span>El oráculo guarda poco historial (" + o.card + " punto" + (o.card === 1 ? "" : "s") + "). Si alguien opera en los 30 minutos antes de crear una moneda, esa moneda usará los valores de respaldo. Amplíalo una vez antes de desplegar (cualquiera puede hacerlo; cuesta gas):</span><br><button class=\"sl-btn\" id=\"dpWiden\" style=\"margin-top:8px\">Ampliar el historial del oráculo</button> <span class=\"dim\" id=\"dpWidenSt\"></span></div></div>";
      else if (o) hist = row("ok", "Historial del oráculo: " + o.next + " puntos");
      ok = c.every(function (x) { return x[0]; });
      var dep = (window.SL_DEPLOYMENTS || {})[k];
      box.innerHTML = c.map(function (x) { return row(x[0] ? "ok" : "bad", x[1], x[2]); }).join("") + hist +
        (dep ? row("bad", "Ya hay un contrato publicado para esta red en la web. Desplegar otro no lo sustituye hasta que se actualice la web.", dep) : "");
      updateBtn();
      var wb = $("dpWiden");
      if (wb) wb.addEventListener("click", function () {
        var st = $("dpWidenSt");
        if (!W) { st.textContent = "Conecta tu wallet primero."; return; }
        wb.disabled = true; st.textContent = "Confirma en tu wallet…";
        W.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x" + ch.id.toString(16) }] }).then(function () { return new E.BrowserProvider(W, "any").getSigner(); })
          .then(function (s) { return new E.Contract(ch.oracle, OPOOL, s).increaseObservationCardinalityNext(200); })
          .then(function (tx) { st.textContent = "Enviado. Esperando confirmación…"; return tx.wait(1); })
          .then(function () { st.textContent = "Listo."; runChecks(); }, function (e) { wb.disabled = false; st.textContent = (e && (e.code === 4001 || e.code === "ACTION_REJECTED")) ? "Cancelado en la wallet." : "Error: " + (e.shortMessage || e.message); });
      });
    }).catch(function (e) { if (id === runId) box.innerHTML = row("bad", "No se pudo leer la red: " + (e.shortMessage || e.message)); });
  }
  function valid() {
    var tu = num("dpTU"), cu = num("dpCU"), tf = num("dpTF"), cf = num("dpCF"), b = num("dpBurn");
    return E.isAddress($("dpOwner").value.trim()) && E.isAddress($("dpFee").value.trim()) && tu > 0 && cu > 0 && cu <= tu && tf > 0 && cf > 0 && cf <= tf && b >= 0 && b <= 100;
  }
  function updateBtn() {
    $("dpDeploy").disabled = !(ok && !!W && valid());
    $("dpDeploy").textContent = "Desplegar en " + C[net()].name;
  }
  $("dpConnect").addEventListener("click", function () {
    var prov = providers.length ? providers[0].provider : window.ethereum;
    if (!prov) { $("dpWho").textContent = "No hay wallet en este navegador"; return; }
    prov.request({ method: "eth_requestAccounts" }).then(function (a) {
      W = prov; var me = E.getAddress(a[0]);
      $("dpWho").textContent = me;
      if (!$("dpOwner").value) $("dpOwner").value = me;
      if (!$("dpFee").value) $("dpFee").value = me;
      updateBtn();
    }, function (e) { $("dpWho").textContent = e.message || "Cancelado"; });
  });
  ["dpOwner", "dpFee", "dpTU", "dpCU", "dpTF", "dpCF", "dpBurn"].forEach(function (id) { $(id).addEventListener("input", function () {
    if (id === "dpTF" || id === "dpCF") fbEdited = true;
    if (id === "dpTU" || id === "dpCU") autoFallback();
    preview(); updateBtn();
  }); });
  $("dpNet").addEventListener("change", setDefaults);

  $("dpDeploy").addEventListener("click", function () {
    var k = net(), ch = C[k], btn = $("dpDeploy"), st = $("dpState"), out = $("dpResult");
    var cfg = {
      owner: E.getAddress($("dpOwner").value.trim()), feeRecipient: E.getAddress($("dpFee").value.trim()), quote: ch.qaddr, dexFactory: ch.dexFactory,
      swapRouter: ch.v3router, wrappedNative: ch.wnative, swapPath: path(k), oraclePool: ch.oracle,
      targetUsd: E.parseEther(String(num("dpTU"))), capUsd: E.parseEther(String(num("dpCU"))),
      targetFallback: E.parseEther(String(num("dpTF"))), capFallback: E.parseEther(String(num("dpCF"))), burnShareBps: Math.round(num("dpBurn") * 100)
    };
    btn.disabled = true; st.textContent = "Confirma en tu wallet…"; out.innerHTML = "";
    W.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x" + ch.id.toString(16) }] }).then(function () {
      return new E.BrowserProvider(W, "any").getSigner();
    }).then(function (s) {
      return new E.ContractFactory(window.SL_ABI.factory, window.SL_BYTECODE, s).deploy(cfg);
    }).then(function (c) {
      st.textContent = "Enviado. Esperando confirmación…";
      out.innerHTML = '<div class="dp-out">Transacción: ' + esc(c.deploymentTransaction().hash) + "</div>";
      return c.waitForDeployment().then(function () { return c.getAddress(); }).then(function (addr) {
        return Promise.all([c.targetUsd(), c.capUsd(), c.sizesNow(), c.burnShareBps(), c.owner(), c.feeRecipient(), c.quote()]).then(function (v) {
          try { var o = JSON.parse(localStorage.getItem("sectoraLaunch.fair") || "{}"); o[k] = addr; localStorage.setItem("sectoraLaunch.fair", JSON.stringify(o)); } catch (e) {}
          var enc = new E.Interface(window.SL_ABI.factory).encodeDeploy([cfg]).slice(2);
          var exp = ch.exp ? ch.exp + "/address/" + addr : "", f = function (x) { return Number(E.formatEther(x)); };
          st.textContent = "Desplegado.";
          out.innerHTML = '<div class="sl-alert is-ok">' + ICO.ok.replace("<svg", '<svg width="15" height="15"') + "<span>Sectora Launch ya funciona en " + esc(ch.name) + " desde este navegador. Envía la dirección para publicarla en la web para todo el mundo.</span></div>" +
            '<div class="dp-out" style="margin-top:12px">' + esc(k) + ': "' + esc(addr) + '"</div>' +
            '<div class="sl-kv"><span>Moneda de cotización</span><b class="mono">' + esc(v[6]) + "</b></div>" +
            '<div class="sl-kv"><span>Objetivo de cada reserva</span><b class="num">' + usd(f(v[0])) + " · hoy " + nf(f(v[2][0])) + " SECT</b></div>" +
            '<div class="sl-kv"><span>Máximo por wallet</span><b class="num">' + usd(f(v[1])) + " · hoy " + nf(f(v[2][1])) + " SECT</b></div>" +
            '<div class="sl-kv"><span>Parte quemada</span><b class="num">' + Number(v[3]) / 100 + " %</b></div>" +
            '<div class="sl-kv"><span>Dueño</span><b class="mono">' + esc(v[4]) + "</b></div>" +
            '<div class="sl-kv"><span>Comisiones a</span><b class="mono">' + esc(v[5]) + "</b></div>" +
            '<div class="dp-row">' + (exp ? '<a class="sl-btn" href="' + esc(exp) + '" target="_blank" rel="noopener">Ver en el explorador</a>' : "") + '<a class="sl-btn" href="./">Abrir Sectora Launch</a></div>' +
            '<p class="sl-note" style="margin-top:16px">Verificación del código en el explorador: compilador v0.8.24, optimización 200, EVM paris, archivo <a href="contracts/SectoraFairLaunch.standard-input.json" download>SectoraFairLaunch.standard-input.json</a>, contrato SectoraFairLaunch. Argumentos del constructor:</p><div class="dp-out">' + esc(enc) + "</div>";
        });
      });
    }).catch(function (e) {
      btn.disabled = false;
      st.textContent = (e && (e.code === 4001 || e.code === "ACTION_REJECTED")) ? "Cancelado en la wallet." : "Error: " + (e.shortMessage || e.message);
    });
  });
  setDefaults();
})();
