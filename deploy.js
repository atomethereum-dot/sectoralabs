/* Sectora Launch — one-time factory deployment (team only). Coins are priced in SECT on Ethereum. */
(function () {
  "use strict";
  var E = window.ethers, C = window.SLLive.chains, ORDER = window.SLLive.order.filter(function (k) { return C[k] && C[k].qaddr; });
  var GRAD_X = 1073 / 273 - 1; // SECT raised at graduation = virtual reserve × 2.9304
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
    $("dpV0").value = "30000"; $("dpLF").value = "10"; $("dpBurn").value = "50";
    $("dpU1").textContent = C[net()].qs; $("dpU2").textContent = C[net()].qs;
    loadPx(); preview(); runChecks();
  }
  function best(pairs, addr) {
    var b = null;
    (pairs || []).forEach(function (p) { if (p.chainId === "ethereum" && p.baseToken && p.baseToken.address.toLowerCase() === addr.toLowerCase()) { var l = (p.liquidity && p.liquidity.usd) || 0; if (!b || l > b.l) b = { l: l, p: +p.priceUsd }; } });
    return b ? b.p : 0;
  }
  function loadPx() {
    var ch = C[net()];
    var get = function (a) { return fetch("https://api.dexscreener.com/latest/dex/tokens/" + a).then(function (r) { return r.json(); }); };
    Promise.all([get(ch.qaddr), get(ch.wnative)]).then(function (r) { px.sect = best(r[0].pairs, ch.qaddr); px.eth = best(r[1].pairs, ch.wnative); preview(); }).catch(function () {});
  }
  function fmtUsd(v) { return "$" + Math.round(v).toLocaleString("es-ES"); }
  function preview() {
    var v0 = parseFloat($("dpV0").value) || 0, lf = parseFloat($("dpLF").value) || 0, b = parseFloat($("dpBurn").value) || 0, p = px.sect;
    var g = v0 * GRAD_X, mc = v0 * 1073 / 273 / 273e6 * 1e9;
    $("dpGrad").textContent = "Se gradúa al reunir ≈ " + Math.round(g).toLocaleString("es-ES") + " SECT" + (p ? " (≈ " + fmtUsd(g * p) + ")" : "") + " · cap. de mercado al graduar ≈ " + Math.round(mc).toLocaleString("es-ES") + " SECT" + (p ? " (≈ " + fmtUsd(mc * p) + ")" : "");
    $("dpLFu").textContent = p ? "≈ $" + (lf * p).toLocaleString("es-ES", { maximumFractionDigits: 2 }) + " por moneda" : "";
    $("dpBurnU").textContent = "Del 0,5 % de la plataforma y de la comisión de lanzamiento se quema el " + b + " % y el " + (100 - b) + " % va a la cartera de comisiones.";
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
      Q.quoteExactInput.staticCall(path(k), E.parseEther("0.01")).then(function (r) { return r[0]; }).catch(nope)
    ]).then(function (r) {
      if (id !== runId) return;
      var same = function (a, b) { return a && b && a.toLowerCase() === b.toLowerCase(); };
      var c = [
        [r[0] === ch.id, "RPC conectado a " + ch.name + " (chain id " + r[0] + ")", ch.rpc[0]],
        [r[1] === "SECT" && Number(r[2]) === 18, "Moneda de cotización: " + (r[1] || "no encontrada") + " · " + r[2] + " decimales", ch.qaddr],
        [r[3] > 0n, "Uniswap V2 (graduación): fábrica con " + (r[3] > 0n ? Number(r[3]).toLocaleString("es-ES") + " pools" : "sin código"), ch.dexFactory],
        [same(r[4], ch.dexFactory) && same(r[5], ch.wnative), "Router de Uniswap V2 apunta a la misma fábrica y a WETH", ch.router],
        [same(r[6], ch.wnative), "Router de Uniswap V3 (compra con ETH) usa WETH", ch.v3router],
        [r[7] && r[7] > 0n, "Ruta ETH → USDT → SECT: 0,01 ETH = " + (r[7] ? Number(E.formatEther(r[7])).toLocaleString("es-ES", { maximumFractionDigits: 2 }) + " SECT" : "sin liquidez"), ch.quoter]
      ];
      ok = c.every(function (x) { return x[0]; });
      var dep = (window.SL_DEPLOYMENTS || {})[k];
      box.innerHTML = c.map(function (x) { return row(x[0] ? "ok" : "bad", x[1], x[2]); }).join("") +
        (dep ? row("bad", "Ya hay un contrato publicado para esta red en la web. Desplegar otro no lo sustituye hasta que se actualice la web.", dep) : "");
      updateBtn();
    }).catch(function (e) { if (id === runId) box.innerHTML = row("bad", "No se pudo leer la red: " + (e.shortMessage || e.message)); });
  }
  function updateBtn() {
    var b = parseFloat($("dpBurn").value);
    var good = ok && !!W && E.isAddress($("dpOwner").value.trim()) && E.isAddress($("dpFee").value.trim()) && parseFloat($("dpV0").value) > 0 && parseFloat($("dpLF").value) >= 0 && b >= 0 && b <= 100;
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
  ["dpOwner", "dpFee", "dpV0", "dpLF", "dpBurn"].forEach(function (id) { $(id).addEventListener("input", function () { preview(); updateBtn(); }); });
  $("dpNet").addEventListener("change", setDefaults);

  $("dpDeploy").addEventListener("click", function () {
    var k = net(), ch = C[k], btn = $("dpDeploy"), st = $("dpState"), out = $("dpResult");
    var cfg = {
      owner: E.getAddress($("dpOwner").value.trim()), feeRecipient: E.getAddress($("dpFee").value.trim()), quote: ch.qaddr, dexFactory: ch.dexFactory,
      virtualQuote: E.parseEther($("dpV0").value.trim()), launchFee: E.parseEther($("dpLF").value.trim()), burnShareBps: Math.round(parseFloat($("dpBurn").value) * 100),
      swapRouter: ch.v3router, wrappedNative: ch.wnative, swapPath: path(k)
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
        return Promise.all([c.virtualQuote(), c.launchFee(), c.burnShareBps(), c.owner(), c.feeRecipient(), c.quote()]).then(function (v) {
          try { var o = JSON.parse(localStorage.getItem("sectoraLaunch.factories") || "{}"); o[k] = addr; localStorage.setItem("sectoraLaunch.factories", JSON.stringify(o)); } catch (e) {}
          var tuple = "tuple(address owner,address feeRecipient,address quote,address dexFactory,uint256 virtualQuote,uint256 launchFee,uint256 burnShareBps,address swapRouter,address wrappedNative,bytes swapPath)";
          var enc = E.AbiCoder.defaultAbiCoder().encode([tuple], [cfg]).slice(2);
          var exp = ch.exp ? ch.exp + "/address/" + addr : "";
          st.textContent = "Desplegado.";
          out.innerHTML = '<div class="sl-alert is-ok">' + ICO.ok.replace("<svg", '<svg width="15" height="15"') + "<span>Sectora Launch ya funciona en " + esc(ch.name) + " desde este navegador. Envía la dirección para publicarla en la web para todo el mundo.</span></div>" +
            '<div class="dp-out" style="margin-top:12px">' + esc(k) + ': "' + esc(addr) + '"</div>' +
            '<div class="sl-kv"><span>Moneda de cotización</span><b class="mono">' + esc(v[5]) + "</b></div>" +
            '<div class="sl-kv"><span>Reserva virtual</span><b class="num">' + esc(E.formatEther(v[0])) + " SECT</b></div>" +
            '<div class="sl-kv"><span>Comisión de lanzamiento</span><b class="num">' + esc(E.formatEther(v[1])) + " SECT</b></div>" +
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
