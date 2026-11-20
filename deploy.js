/* Sectora Launch — one-time factory deployment (team only).
 * Ethereum: coins priced in SECT (buy with ETH through Uniswap V3). BNB Chain: coins priced in BNB (held as WBNB). */
(function () {
  "use strict";
  var E = window.ethers, C = window.SLLive.chains, ORDER = window.SLLive.order.filter(function (k) { return C[k] && C[k].qaddr; });
  var GRAD_X = 1073 / 273 - 1; // quote raised at graduation = virtual reserve × 2.9304
  var $ = function (id) { return document.getElementById(id); };
  var W = null, ok = false, px = { sect: 0, eth: 0 }, runId = 0;
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
  function setDefaults() {
    var ch = C[net()];
    if (ch.native) { $("dpV0").value = "6"; $("dpLF").value = "0.002"; $("dpBurn").value = "0"; }
    else { $("dpV0").value = "32000"; $("dpLF").value = "10"; $("dpBurn").value = "50"; }
    $("dpGU").value = "10000"; v0Edited = false; px.oracle = 0;
    $("dpBurn").disabled = !!ch.native;
    $("dpU1").textContent = ch.qs; $("dpU2").textContent = ch.qs;
    $("dpIntro").textContent = ch.native
      ? "Esta página despliega el contrato de Sectora Launch desde tu wallet en " + ch.name + ". Se hace una sola vez. Antes de desplegar comprueba en la propia cadena " + ch.dex + " (graduación) y W" + ch.qs + "."
      : "Esta página despliega el contrato de Sectora Launch desde tu wallet en " + ch.name + ". Se hace una sola vez. Antes de desplegar comprueba en la propia cadena el token SECT, Uniswap V2 (graduación) y la ruta ETH → USDT → SECT de Uniswap V3 (compra con ETH).";
    $("dpNote").textContent = ch.native
      ? "Todas las monedas cotizan en " + ch.qs + ": se compra y se cobra en " + ch.qs + " y el contrato lo guarda como W" + ch.qs + ". Se gradúan en un pool MONEDA/W" + ch.qs + " de " + ch.dex + " con el LP quemado. En esta red no se quema nada: las comisiones de la plataforma van a la cartera de comisiones en W" + ch.qs + ". El dueño no puede pausar ni tocar las curvas, lo reunido ni ninguna moneda. Estos valores quedan fijos en el contrato."
      : "Todas las monedas cotizan en SECT y se gradúan en un pool MONEDA/SECT de Uniswap con el LP quemado. El dueño no puede pausar ni tocar las curvas, el SECT reunido, la ruta de compra con ETH ni ninguna moneda. Estos valores quedan fijos en el contrato.";
    loadPx(); preview(); runChecks();
  }
  function best(pairs, addr, ds) {
    var b = null;
    (pairs || []).forEach(function (p) { if (p.chainId === ds && p.baseToken && p.baseToken.address.toLowerCase() === addr.toLowerCase()) { var l = (p.liquidity && p.liquidity.usd) || 0; if (!b || l > b.l) b = { l: l, p: +p.priceUsd }; } });
    return b ? b.p : 0;
  }
  // 30-minute average price of the quote coin in dollars, from the same V3 pool the contract will read
  var v0Edited = false, OPOOL = ["function slot0() view returns (uint160,int24,uint16,uint16,uint16,uint32,bool)", "function token0() view returns (address)", "function token1() view returns (address)",
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
  function loadPx() {
    var ch = C[net()];
    var get = function (a) { return fetch("https://api.dexscreener.com/latest/dex/tokens/" + a).then(function (r) { return r.json(); }); };
    var k = net();
    px = { sect: 0, eth: 0 }; preview();
    var toks = ch.native ? [ch.wnative] : [ch.qaddr, ch.wnative];
    Promise.all(toks.map(get)).then(function (r) {
      if (net() !== k) return;
      px.sect = best(r[0].pairs, toks[0], ch.ds); px.eth = best(r[r.length - 1].pairs, ch.wnative, ch.ds); preview();
    }).catch(function () {});
    if (ch.oracle) oracleRead(k).then(function (o) {
      if (net() !== k) return;
      px.oracle = o.price || o.spot;
      if (!v0Edited && px.oracle) $("dpV0").value = String(Math.round((parseFloat($("dpGU").value) || 10000) * 273 / 800 / px.oracle * 1000) / 1000);
      preview();
    }).catch(function () {});
  }
  function fmtUsd(v) { return "$" + Math.round(v).toLocaleString("es-ES"); }
  function preview() {
    var ch = C[net()], q = ch.qs, v0 = parseFloat($("dpV0").value) || 0, lf = parseFloat($("dpLF").value) || 0, b = parseFloat($("dpBurn").value) || 0, p = px.sect;
    var nf = function (v) { return v.toLocaleString("es-ES", { maximumFractionDigits: v >= 100 ? 0 : 3 }); };
    var g = v0 * GRAD_X, gu = parseFloat($("dpGU").value) || 0, op = px.oracle || 0;
    var gq = op ? gu / op : 0, mcu = gu * 1073 / 273 / 273e6 * 1e9 / GRAD_X;
    $("dpGUu").textContent = gu > 0 ? (op ? "Hoy son ≈ " + nf(gq) + " " + q + " (precio medio de 30 min: $" + op.toLocaleString("es-ES", { maximumFractionDigits: 6 }) + "). " : "") + "Capitalización al graduar ≈ " + fmtUsd(mcu) + ". Cada moneda nueva se ajusta sola al precio del momento; una vez creada, su curva no cambia." : "";
    $("dpGrad").textContent = "Con esta reserva una moneda se graduaría al reunir ≈ " + nf(g) + " " + q + (p ? " (≈ " + fmtUsd(g * p) + ")" : "") + ". El contrato nunca usa menos de 1/50 ni más de 50 veces esta reserva.";
    $("dpLFu").textContent = p ? "≈ $" + (lf * p).toLocaleString("es-ES", { maximumFractionDigits: 2 }) + " por moneda" : "";
    $("dpBurnU").textContent = ch.native ? "En " + ch.name + " no se quema nada: el 0,5 % de la plataforma y la comisión de lanzamiento van enteros a la cartera de comisiones (en W" + q + ")."
      : "Del 0,5 % de la plataforma y de la comisión de lanzamiento se quema el " + b + " % y el " + (100 - b) + " % va a la cartera de comisiones.";
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
    var R3 = ch.native ? null : new E.Contract(ch.v3router, ["function WETH9() view returns (address)"], p);
    var Q = ch.native ? null : new E.Contract(ch.quoter, ["function quoteExactInput(bytes path, uint256 amountIn) returns (uint256 amountOut, uint160[], uint32[], uint256)"], p);
    var nope = function () { return null; };
    Promise.all([
      p.getNetwork().then(function (n) { return Number(n.chainId); }),
      T.symbol().catch(nope), T.decimals().catch(nope),
      F.allPairsLength().catch(function () { return -1n; }),
      R.factory().catch(nope), R.WETH().catch(nope), R3 ? R3.WETH9().catch(nope) : null,
      Q ? Q.quoteExactInput.staticCall(path(k), E.parseEther("0.01")).then(function (r) { return r[0]; }).catch(nope) : null,
      ch.oracle ? oracleRead(k).catch(nope) : null
    ]).then(function (r) {
      if (id !== runId) return;
      var same = function (a, b) { return a && b && a.toLowerCase() === b.toLowerCase(); };
      var c = ch.native ? [
        [r[0] === ch.id, "RPC conectado a " + ch.name + " (chain id " + r[0] + ")", ch.rpc[0]],
        [r[1] === "W" + ch.qs && Number(r[2]) === 18 && same(ch.qaddr, ch.wnative), "Moneda de cotización: " + ch.qs + " (guardado como " + (r[1] || "no encontrado") + " · " + r[2] + " decimales)", ch.qaddr],
        [r[3] > 0n, ch.dex + " V2 (graduación): fábrica con " + (r[3] > 0n ? Number(r[3]).toLocaleString("es-ES") + " pools" : "sin código"), ch.dexFactory],
        [same(r[4], ch.dexFactory) && same(r[5], ch.wnative), "Router de " + ch.dex + " V2 apunta a la misma fábrica y a W" + ch.qs, ch.router]
      ] : [
        [r[0] === ch.id, "RPC conectado a " + ch.name + " (chain id " + r[0] + ")", ch.rpc[0]],
        [r[1] === "SECT" && Number(r[2]) === 18, "Moneda de cotización: " + (r[1] || "no encontrada") + " · " + r[2] + " decimales", ch.qaddr],
        [r[3] > 0n, "Uniswap V2 (graduación): fábrica con " + (r[3] > 0n ? Number(r[3]).toLocaleString("es-ES") + " pools" : "sin código"), ch.dexFactory],
        [same(r[4], ch.dexFactory) && same(r[5], ch.wnative), "Router de Uniswap V2 apunta a la misma fábrica y a WETH", ch.router],
        [same(r[6], ch.wnative), "Router de Uniswap V3 (compra con ETH) usa WETH", ch.v3router],
        [r[7] && r[7] > 0n, "Ruta ETH → USDT → SECT: 0,01 ETH = " + (r[7] ? Number(E.formatEther(r[7])).toLocaleString("es-ES", { maximumFractionDigits: 2 }) + " SECT" : "sin liquidez"), ch.quoter]
      ];
      var o = r[8], hist = "";
      if (ch.oracle) {
        c.push([!!(o && o.has), "Oráculo de precio: " + ch.oracleDex + (o ? " · ahora $" + o.spot.toLocaleString("es-ES", { maximumFractionDigits: 6 }) + (o.price ? " · media de 30 min $" + o.price.toLocaleString("es-ES", { maximumFractionDigits: 6 }) : "") : ""), ch.oracle]);
        if (o && o.next < 100) hist = '<div class="dp-chk bad"><i>' + ICO.bad + "</i><div><span>El oráculo guarda poco historial (" + o.card + " punto" + (o.card === 1 ? "" : "s") + "). Si alguien opera en los 30 minutos antes de crear una moneda, esa moneda usará la reserva de respaldo. Amplíalo una vez (cualquiera puede hacerlo; cuesta gas):</span><br><button class=\"sl-btn\" id=\"dpWiden\" style=\"margin-top:8px\">Ampliar el historial del oráculo</button> <span class=\"dim\" id=\"dpWidenSt\"></span></div></div>";
        else if (o) hist = row("ok", "Historial del oráculo: " + o.next + " puntos");
      }
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
  function updateBtn() {
    var b = parseFloat($("dpBurn").value);
    var good = ok && !!W && E.isAddress($("dpOwner").value.trim()) && E.isAddress($("dpFee").value.trim()) && parseFloat($("dpV0").value) > 0 && parseFloat($("dpLF").value) >= 0 && b >= 0 && b <= 100 && (!C[net()].oracle || parseFloat($("dpGU").value) > 0);
    $("dpDeploy").disabled = !good;
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
  ["dpOwner", "dpFee", "dpV0", "dpLF", "dpBurn", "dpGU"].forEach(function (id) { $(id).addEventListener("input", function () {
    if (id === "dpV0") v0Edited = true;
    if (id === "dpGU" && !v0Edited && px.oracle) $("dpV0").value = String(Math.round((parseFloat($("dpGU").value) || 10000) * 273 / 800 / px.oracle * 1000) / 1000);
    preview(); updateBtn();
  }); });
  $("dpNet").addEventListener("change", setDefaults);

  $("dpDeploy").addEventListener("click", function () {
    var k = net(), ch = C[k], btn = $("dpDeploy"), st = $("dpState"), out = $("dpResult");
    var cfg = {
      owner: E.getAddress($("dpOwner").value.trim()), feeRecipient: E.getAddress($("dpFee").value.trim()), quote: ch.qaddr, dexFactory: ch.dexFactory,
      virtualQuote: E.parseEther($("dpV0").value.trim()), launchFee: E.parseEther($("dpLF").value.trim()), oraclePool: ch.oracle || E.ZeroAddress, gradUsd: ch.oracle ? E.parseEther(String(parseFloat($("dpGU").value) || 0)) : 0n, burnShareBps: Math.round(parseFloat($("dpBurn").value) * 100),
      swapRouter: ch.native ? E.ZeroAddress : ch.v3router, wrappedNative: ch.wnative, swapPath: ch.native ? "0x" : path(k)
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
        return Promise.all([c.virtualQuote(), c.launchFee(), c.burnShareBps(), c.owner(), c.feeRecipient(), c.quote(), c.gradUsd(), c.virtualQuoteNow()]).then(function (v) {
          try { var o = JSON.parse(localStorage.getItem("sectoraLaunch.factories") || "{}"); o[k] = addr; localStorage.setItem("sectoraLaunch.factories", JSON.stringify(o)); } catch (e) {}
          var tuple = "tuple(address owner,address feeRecipient,address quote,address dexFactory,uint256 virtualQuote,uint256 launchFee,uint256 burnShareBps,address swapRouter,address wrappedNative,bytes swapPath,address oraclePool,uint256 gradUsd)";
          var enc = E.AbiCoder.defaultAbiCoder().encode([tuple], [cfg]).slice(2);
          var exp = ch.exp ? ch.exp + "/address/" + addr : "";
          st.textContent = "Desplegado.";
          out.innerHTML = '<div class="sl-alert is-ok">' + ICO.ok.replace("<svg", '<svg width="15" height="15"') + "<span>Sectora Launch ya funciona en " + esc(ch.name) + " desde este navegador. Envía la dirección para publicarla en la web para todo el mundo.</span></div>" +
            '<div class="dp-out" style="margin-top:12px">' + esc(k) + ': "' + esc(addr) + '"</div>' +
            '<div class="sl-kv"><span>Moneda de cotización</span><b class="mono">' + esc(v[5]) + "</b></div>" +
            (v[6] > 0n ? '<div class="sl-kv"><span>Graduación</span><b class="num">$' + Number(E.formatEther(v[6])).toLocaleString("es-ES") + " · hoy " + Number(E.formatEther(v[7]) * GRAD_X).toLocaleString("es-ES", { maximumFractionDigits: 2 }) + " " + esc(ch.qs) + "</b></div>" : "") +
            '<div class="sl-kv"><span>' + (v[6] > 0n ? "Reserva de respaldo" : "Reserva virtual") + '</span><b class="num">' + esc(E.formatEther(v[0])) + " " + esc(ch.qs) + "</b></div>" +
            '<div class="sl-kv"><span>Comisión de lanzamiento</span><b class="num">' + esc(E.formatEther(v[1])) + " " + esc(ch.qs) + "</b></div>" +
            '<div class="sl-kv"><span>Parte quemada</span><b class="num">' + Number(v[2]) / 100 + " %</b></div>" +
            '<div class="sl-kv"><span>Dueño</span><b class="mono">' + esc(v[3]) + "</b></div>" +
            '<div class="sl-kv"><span>Comisiones a</span><b class="mono">' + esc(v[4]) + "</b></div>" +
            '<div class="dp-row">' + (exp ? '<a class="sl-btn" href="' + esc(exp) + '" target="_blank" rel="noopener">Ver en el explorador</a>' : "") + '<a class="sl-btn" href="./">Abrir Sectora Launch</a></div>' +
            '<p class="sl-note" style="margin-top:16px">Verificación del código en el explorador: compilador v0.8.24, optimización 200, EVM paris, archivo <a href="contracts/SectoraLaunch.standard-input.json" download>SectoraLaunch.standard-input.json</a>, contrato SectoraLaunchFactory. Argumentos del constructor:</p><div class="dp-out">' + esc(enc) + "</div>";
        });
      });
    }).catch(function (e) {
      btn.disabled = false;
      st.textContent = (e && (e.code === 4001 || e.code === "ACTION_REJECTED")) ? "Cancelado en la wallet." : "Error: " + (e.shortMessage || e.message);
    });
  });
  setDefaults();
})();
