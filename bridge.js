/* Sectora SECT bridge — public page: move SECT between Ethereum and BNB Chain (LayerZero V2 OFT). */
(function () {
  "use strict";
  var S = window.SB, E = S.E, C = S.C;
  var T = {
    en: {
      eyebrow: "Official SECT bridge · LayerZero", title: "Bridge SECT", lead: "Move SECT between Ethereum and BNB Chain. It is the same SECT: it is locked on Ethereum and created 1:1 on BNB Chain, and the other way round.",
      from: "From", to: "To", amount: "Amount", bal: "Balance", max: "Max", to_wallet: "Arrives at", yours: "your wallet", change: "Change", use_mine: "Use my wallet", to_ph: "0x… wallet on {n}",
      recv: "You receive on {n}", fee: "LayerZero fee", time: "Arrives in", time_v: "a few minutes", cap: "Can still arrive today",
      connect: "Connect wallet", sw: "Switch to {n}", approve: "Approve {a} SECT", send: "Bridge to {n}", enter: "Enter an amount",
      e_bal: "Not enough SECT", e_fee: "Not enough {s} for the fee", e_cap: "Above what can arrive right now ({n} SECT). Try less or later.", e_addr: "Invalid receiving address", e_dust: "Amount too small",
      off_t: "The bridge opens soon", off_p: "SECT lives on Ethereum today. The bridge to BNB Chain is being prepared and will open here.",
      hist: "Your transfers", st_sent: "Sent", st_way: "Crossing", st_recv: "Received", track: "LayerZero Scan", ago: "{n} ago",
      how: "How it works", h1: "Your SECT is locked in the bridge contract on Ethereum and the same amount is created on BNB Chain. Going back, it is destroyed on BNB Chain and released on Ethereum.",
      h2: "LayerZero carries the message. Four independent verifiers must confirm it before anything is created or released.",
      h3: "A daily limit per network caps what can arrive, as a safety net. A transfer above it waits and arrives once there is room.",
      h4: "The SECT contract on Ethereum is not changed and the total supply stays at 50,000,000.",
      contracts: "Contracts", c_sect: "SECT · Ethereum", c_br: "Bridge · Ethereum", c_bsc: "SECT · BNB Chain",
      tx_confirm: "Confirm in your wallet…", tx_wait: "Waiting for confirmation…", tx_rej: "Cancelled in the wallet.", tx_fail: "Failed: {m}", ok_appr: "Approved. Now bridge.", ok_sent: "Sent. It arrives on {n} in a few minutes.",
      no_wallet: "No wallet found in this browser. Open this page in your wallet's browser.",
      foot: "Each transfer pays a LayerZero fee in the source network's coin (ETH or BNB). Amounts below 0.000001 SECT stay in your wallet. Solana: coming soon. Not financial advice."
    },
    es: {
      eyebrow: "Puente oficial de SECT · LayerZero", title: "Puente SECT", lead: "Pasa SECT entre Ethereum y BNB Chain. Es el mismo SECT: se bloquea en Ethereum y se crea 1:1 en BNB Chain, y al revés.",
      from: "Desde", to: "Hacia", amount: "Cantidad", bal: "Saldo", max: "Máx.", to_wallet: "Llega a", yours: "tu wallet", change: "Cambiar", use_mine: "Usar mi wallet", to_ph: "0x… wallet en {n}",
      recv: "Recibes en {n}", fee: "Comisión de LayerZero", time: "Llega en", time_v: "unos minutos", cap: "Aún puede llegar hoy",
      connect: "Conectar wallet", sw: "Cambiar a {n}", approve: "Aprobar {a} SECT", send: "Enviar a {n}", enter: "Escribe una cantidad",
      e_bal: "No tienes suficiente SECT", e_fee: "No tienes suficiente {s} para la comisión", e_cap: "Supera lo que puede llegar ahora ({n} SECT). Prueba con menos o más tarde.", e_addr: "Dirección de destino no válida", e_dust: "Cantidad demasiado pequeña",
      off_t: "El puente se abre pronto", off_p: "Hoy SECT está en Ethereum. El puente a BNB Chain se está preparando y se abrirá aquí.",
      hist: "Tus envíos", st_sent: "Enviado", st_way: "Cruzando", st_recv: "Recibido", track: "LayerZero Scan", ago: "hace {n}",
      how: "Cómo funciona", h1: "Tu SECT se bloquea en el contrato del puente en Ethereum y se crea la misma cantidad en BNB Chain. Al volver, se destruye en BNB Chain y se libera en Ethereum.",
      h2: "LayerZero lleva el mensaje. Cuatro verificadores independientes tienen que confirmarlo antes de crear o liberar nada.",
      h3: "Un límite diario por red pone tope a lo que puede llegar, como red de seguridad. Si un envío lo supera, espera y llega cuando hay hueco.",
      h4: "El contrato de SECT en Ethereum no cambia y el suministro total sigue siendo 50.000.000.",
      contracts: "Contratos", c_sect: "SECT · Ethereum", c_br: "Puente · Ethereum", c_bsc: "SECT · BNB Chain",
      tx_confirm: "Confirma en tu wallet…", tx_wait: "Esperando confirmación…", tx_rej: "Cancelado en la wallet.", tx_fail: "Falló: {m}", ok_appr: "Aprobado. Ahora envía.", ok_sent: "Enviado. Llega a {n} en unos minutos.",
      no_wallet: "No hay wallet en este navegador. Abre esta página en el navegador de tu wallet.",
      foot: "Cada envío paga una comisión de LayerZero en la moneda de la red de origen (ETH o BNB). Las fracciones por debajo de 0,000001 SECT se quedan en tu wallet. Solana: próximamente. No es asesoramiento financiero."
    },
    pt: {
      eyebrow: "Ponte oficial do SECT · LayerZero", title: "Ponte SECT", lead: "Passe SECT entre a Ethereum e a BNB Chain. É o mesmo SECT: fica bloqueado na Ethereum e é criado 1:1 na BNB Chain, e vice-versa.",
      from: "De", to: "Para", amount: "Quantidade", bal: "Saldo", max: "Máx.", to_wallet: "Chega em", yours: "sua carteira", change: "Alterar", use_mine: "Usar minha carteira", to_ph: "0x… carteira na {n}",
      recv: "Você recebe na {n}", fee: "Taxa da LayerZero", time: "Chega em", time_v: "alguns minutos", cap: "Ainda pode chegar hoje",
      connect: "Conectar carteira", sw: "Mudar para {n}", approve: "Aprovar {a} SECT", send: "Enviar para {n}", enter: "Digite uma quantidade",
      e_bal: "SECT insuficiente", e_fee: "{s} insuficiente para a taxa", e_cap: "Acima do que pode chegar agora ({n} SECT). Tente menos ou mais tarde.", e_addr: "Endereço de destino inválido", e_dust: "Quantidade pequena demais",
      off_t: "A ponte abre em breve", off_p: "Hoje o SECT está na Ethereum. A ponte para a BNB Chain está sendo preparada e vai abrir aqui.",
      hist: "Suas transferências", st_sent: "Enviado", st_way: "Atravessando", st_recv: "Recebido", track: "LayerZero Scan", ago: "há {n}",
      how: "Como funciona", h1: "Seu SECT fica bloqueado no contrato da ponte na Ethereum e a mesma quantidade é criada na BNB Chain. Na volta, é destruído na BNB Chain e liberado na Ethereum.",
      h2: "A LayerZero leva a mensagem. Quatro verificadores independentes precisam confirmá-la antes de criar ou liberar qualquer coisa.",
      h3: "Um limite diário por rede limita o que pode chegar, como rede de segurança. Uma transferência acima dele espera e chega quando houver espaço.",
      h4: "O contrato do SECT na Ethereum não muda e o suprimento total continua em 50.000.000.",
      contracts: "Contratos", c_sect: "SECT · Ethereum", c_br: "Ponte · Ethereum", c_bsc: "SECT · BNB Chain",
      tx_confirm: "Confirme na sua carteira…", tx_wait: "Aguardando confirmação…", tx_rej: "Cancelado na carteira.", tx_fail: "Falhou: {m}", ok_appr: "Aprovado. Agora envie.", ok_sent: "Enviado. Chega na {n} em alguns minutos.",
      no_wallet: "Nenhuma carteira neste navegador. Abra esta página no navegador da sua carteira.",
      foot: "Cada transferência paga uma taxa da LayerZero na moeda da rede de origem (ETH ou BNB). Frações abaixo de 0,000001 SECT ficam na sua carteira. Solana: em breve. Não é aconselhamento financeiro."
    }
  };
  var LOC = { en: "en-US", es: "es-ES", pt: "pt-BR" };
  var L = (function () { try { var s = localStorage.getItem("sectoraLaunch.lang"); if (T[s]) return s; } catch (e) {} var n = (navigator.language || "en").slice(0, 2).toLowerCase(); return T[n] ? n : "en"; })();
  function t(k, v) { var s = (T[L][k] != null ? T[L][k] : T.en[k]) || k; if (v) for (var x in v) s = s.split("{" + x + "}").join(v[x]); return s; }
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nf(v, d) { return Number(v).toLocaleString(LOC[L], { maximumFractionDigits: d == null ? 2 : d }); }
  function fmt(wei, d) { var n = Number(E.formatEther(wei || 0n)); return nf(n, d == null ? (n >= 1000 ? 2 : n >= 1 ? 4 : 6) : d); }
  function short(a) { return a ? a.slice(0, 6) + "…" + a.slice(-4) : ""; }
  function dot(k) { return '<i class="br-dot" style="background:' + C[k].col + '"></i>'; }
  function exUrl(k, kind, v) { return C[k].exp ? C[k].exp + "/" + kind + "/" + v : ""; }
  function ago(ms) { var s = Math.max(1, Math.round((Date.now() - ms) / 1000)); var v = s < 60 ? s + " s" : s < 3600 ? Math.round(s / 60) + " min" : s < 86400 ? Math.round(s / 3600) + " h" : Math.round(s / 86400) + " d"; return t("ago", { n: v }); }

  var live = !!(S.addrOf("ethereum") && S.addrOf("bsc"));
  var st = { from: "ethereum", amt: "", to: "", editTo: false, bal: {}, nat: {}, allow: 0n, q: null, busy: false, msg: "", msgBad: false };
  var px = { ethereum: 0, bsc: 0, sect: 0 };

  // ---------------------------------------------------------------- static parts
  function statics() {
    document.documentElement.lang = L;
    $("brLangs").innerHTML = ["en", "es", "pt"].map(function (x) { return '<button data-l="' + x + '"' + (x === L ? ' class="on"' : "") + ">" + x.toUpperCase() + "</button>"; }).join("");
    $("brEyebrow").textContent = t("eyebrow"); $("brTitle").textContent = t("title"); $("brLead").textContent = t("lead");
    $("brHowT").textContent = t("how");
    $("brHow").innerHTML = ["h1", "h2", "h3", "h4"].map(function (k, i) { return '<li><span class="n">' + (i + 1) + "</span><span>" + esc(t(k)) + "</span></li>"; }).join("");
    var rows = [[t("c_sect"), "ethereum", S.SECT], [t("c_br"), "ethereum", S.addrOf("ethereum")], [t("c_bsc"), "bsc", S.addrOf("bsc")]].filter(function (r) { return r[2]; });
    $("brAddrs").innerHTML = "<h3>" + esc(t("contracts")) + "</h3>" + rows.map(function (r) {
      var u = exUrl(r[1], "address", r[2]);
      return '<div class="sl-kv"><span>' + esc(r[0]) + "</span><b>" + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(short(r[2])) + "</a>" : esc(short(r[2]))) + "</b></div>";
    }).join("");
    $("brFoot").textContent = t("foot");
  }
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-l]"); if (!b) return; L = b.getAttribute("data-l"); try { localStorage.setItem("sectoraLaunch.lang", L); } catch (x) {} statics(); render(); history(); });

  // ---------------------------------------------------------------- card
  function dest() { return S.other(st.from); }
  function recipient() { return st.editTo ? st.to.trim() : S.W.addr; }
  function render() {
    var card = $("brCard");
    if (!live) { card.innerHTML = '<div class="br-off">' + dot("bsc") + "<h3>" + esc(t("off_t")) + "</h3><p>" + esc(t("off_p")) + "</p></div>"; return; }
    var f = st.from, d = dest(), w = S.W.addr, bal = st.bal[f];
    var netBox = function (k, lab, sub) { return '<div class="br-net"><span class="lbl">' + esc(lab) + "</span><b>" + dot(k) + esc(C[k].name) + "</b><small>" + esc(sub) + "</small></div>"; };
    var balTxt = w && bal != null ? fmt(bal) + " SECT" : "SECT";
    card.innerHTML = '<div class="br-route">' + netBox(f, t("from"), balTxt) +
      '<button class="br-flip" data-a="flip" aria-label="⇄"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 7h12l-3-3M17 17H5l3 3"/></svg></button>' +
      netBox(d, t("to"), w && st.bal[d] != null ? fmt(st.bal[d]) + " SECT" : "SECT") + "</div>" +
      '<div class="sl-field br-amt"><label for="brAmt">' + esc(t("amount")) + '</label><div class="sl-input-wrap"><input class="sl-input num" id="brAmt" inputmode="decimal" placeholder="0" autocomplete="off" value="' + esc(st.amt) + '"><span class="unit">SECT</span></div>' +
      '<div class="br-bal"><span>' + esc(t("bal")) + ": " + (w && bal != null ? fmt(bal) + " SECT" : "—") + (px.sect && st.amt ? " · ≈ $" + nf(parseFloat(st.amt || 0) * px.sect, 2) : "") + "</span>" + (w && bal > 0n ? '<button data-a="max">' + esc(t("max")) + "</button>" : "") + "</div></div>" +
      '<div class="br-to">' + (st.editTo ? '<input class="sl-input mono" id="brTo" style="font-size:13px;padding:10px 12px" placeholder="' + esc(t("to_ph", { n: C[d].name })) + '" value="' + esc(st.to) + '"><button data-a="mine">' + esc(t("use_mine")) + "</button>"
        : "<span>" + esc(t("to_wallet")) + ": " + (w ? "<code>" + esc(short(w)) + "</code> (" + esc(t("yours")) + ")" : esc(t("yours"))) + '</span><button data-a="editto">' + esc(t("change")) + "</button>") + "</div>" +
      '<div class="br-sum" id="brSum">' + summary() + "</div>" +
      '<div class="br-err" id="brErr">' + errBox() + "</div>" +
      '<div class="br-go">' + button() + "</div>";
    var inp = $("brAmt");
    inp.addEventListener("input", function () { var v = inp.value.replace(/,/g, ".").replace(/[^0-9.]/g, ""); if (v !== inp.value) inp.value = v; st.amt = v; st.msg = ""; requote(); });
    var to = $("brTo"); if (to) to.addEventListener("input", function () { st.to = to.value; requote(); });
  }
  function summary() {
    var q = st.q, d = dest(), f = st.from;
    var rows = [[t("recv", { n: C[d].name }), q && q.recv != null ? fmt(q.recv) + " SECT" : "—"],
      [t("fee"), q && q.fee != null ? fmt(q.fee, 6) + " " + C[f].sym + (px[f] ? " <small>≈ $" + nf(Number(E.formatEther(q.fee)) * px[f], 2) + "</small>" : "") : "—"],
      [t("time"), t("time_v")],
      [t("cap"), q && q.cap != null ? fmt(q.cap, 0) + " SECT" : "—"]];
    return rows.map(function (r) { return '<div class="sl-kv"><span>' + esc(r[0]) + '</span><b class="num">' + r[1] + "</b></div>"; }).join("");
  }
  function errBox() {
    var m = st.msg || (st.q && st.q.err);
    if (!m) return "";
    var bad = st.msg ? st.msgBad : true;
    return '<div class="sl-alert ' + (bad ? "is-bad" : "is-ok") + '"><span>' + esc(m) + "</span></div>";
  }
  function amountLD() { try { var v = (st.amt || "").trim(); if (!v || !(parseFloat(v) > 0)) return 0n; var p = v.split("."); return E.parseEther(p[0] + (p[1] ? "." + p[1].slice(0, 18) : "")); } catch (e) { return 0n; } }
  function button() {
    var f = st.from, d = dest();
    if (!S.W.addr) return '<button class="sl-btn sl-btn-p" data-a="connect">' + esc(t("connect")) + "</button>";
    if (S.W.chainId !== C[f].id) return '<button class="sl-btn sl-btn-p" data-a="switch">' + esc(t("sw", { n: C[f].name })) + "</button>";
    var a = amountLD(), q = st.q, ready = q && !q.err && q.amount === a && a > 0n;
    if (!(a > 0n)) return '<button class="sl-btn sl-btn-p" disabled>' + esc(t("enter")) + "</button>";
    if (f === "ethereum" && ready && st.allow < q.send) return '<button class="sl-btn sl-btn-p" data-a="approve"' + (st.busy ? " disabled" : "") + ">" + esc(t("approve", { a: fmt(q.send) })) + "</button>";
    return '<button class="sl-btn sl-btn-p" data-a="send"' + (ready && !st.busy ? "" : " disabled") + ">" + esc(t("send", { n: C[d].name })) + "</button>";
  }
  function refreshParts() { var s = $("brSum"), e = $("brErr"); if (s) s.innerHTML = summary(); if (e) e.innerHTML = errBox(); var g = document.querySelector(".br-go"); if (g) g.innerHTML = button(); }

  // ---------------------------------------------------------------- data
  function loadBalances() {
    var w = S.W.addr; if (!w || !live) return Promise.resolve();
    return Promise.all([S.sect("ethereum").balanceOf(w), S.sect("bsc").balanceOf(w), S.rp("ethereum").getBalance(w), S.rp("bsc").getBalance(w), S.sect("ethereum").allowance(w, S.addrOf("ethereum"))].map(function (p) { return p.catch(function () { return null; }); })).then(function (r) {
      st.bal = { ethereum: r[0], bsc: r[1] }; st.nat = { ethereum: r[2], bsc: r[3] }; st.allow = r[4] || 0n;
    });
  }
  var qT = 0, qN = 0;
  function requote() {
    clearTimeout(qT); var n = ++qN; st.q = null; refreshParts();
    var a = amountLD(); if (!(a > 0n)) return;
    qT = setTimeout(function () {
      var f = st.from, d = dest(), to = recipient() || "0x000000000000000000000000000000000000dEaD";
      if (st.editTo && !E.isAddress(to)) { st.q = { amount: a, err: t("e_addr") }; refreshParts(); return; }
      var b = S.bridge(f), probe = S.sendParam(d, to, a, 0n);
      Promise.all([b.quoteOFT(probe), S.bridge(d).inboundAvailable(C[f].eid)]).then(function (r) {
        var recv = r[0][2].amountReceivedLD, send = r[0][2].amountSentLD, cap = r[1];
        return b.quoteSend(S.sendParam(d, to, a, recv), false).then(function (fee) {
          if (n !== qN) return;
          var q = { amount: a, send: send, recv: recv, fee: fee.nativeFee, cap: cap, err: "" };
          if (recv === 0n) q.err = t("e_dust");
          else if (S.W.addr && st.bal[f] != null && send > st.bal[f]) q.err = t("e_bal");
          else if (recv > cap) q.err = t("e_cap", { n: fmt(cap, 0) });
          else if (S.W.addr && st.nat[f] != null && fee.nativeFee > st.nat[f]) q.err = t("e_fee", { s: C[f].sym });
          st.q = q; refreshParts();
        });
      }).catch(function (e) { if (n === qN) { st.q = { amount: a, err: S.errMsg(e) }; refreshParts(); } });
    }, 300);
  }

  // ---------------------------------------------------------------- actions
  function flow(sendFn, after) {
    st.busy = true; st.msg = t("tx_confirm"); st.msgBad = false; refreshParts();
    S.signer().then(sendFn).then(function (tx) {
      st.msg = t("tx_wait"); refreshParts();
      return tx.wait(1).then(function (rc) { if (!rc || rc.status !== 1) throw new Error("reverted"); return after(rc, tx); });
    }).catch(function (e) {
      st.msg = S.isReject(e) ? t("tx_rej") : t("tx_fail", { m: S.errMsg(e) }); st.msgBad = true;
    }).then(function () { st.busy = false; return loadBalances(); }).then(function () { render(); requote(); });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-a]"); if (!b) return;
    var a = b.getAttribute("data-a");
    if (a === "connect") { S.connect().then(function () { return loadBalances(); }).then(function () { render(); requote(); history(); }, function (err) { st.msg = err.message === "no-wallet" ? t("no_wallet") : (S.isReject(err) ? t("tx_rej") : S.errMsg(err)); st.msgBad = true; refreshParts(); }); }
    if (a === "switch") { S.switchTo(st.from).then(function () { render(); requote(); }, function (err) { st.msg = S.isReject(err) ? t("tx_rej") : S.errMsg(err); st.msgBad = true; refreshParts(); }); }
    if (a === "flip") { st.from = dest(); st.msg = ""; render(); requote(); }
    if (a === "max") { var bl = st.bal[st.from]; if (bl > 0n) { st.amt = E.formatEther(bl); render(); requote(); } }
    if (a === "editto") { st.editTo = true; st.to = ""; render(); requote(); }
    if (a === "mine") { st.editTo = false; st.to = ""; render(); requote(); }
    if (a === "approve") {
      var q0 = st.q;
      flow(function (s) { return S.sect("ethereum", s).approve(S.addrOf("ethereum"), q0.send); }, function () { st.msg = t("ok_appr"); st.msgBad = false; });
    }
    if (a === "send") {
      var q = st.q, f = st.from, d = dest(), to = recipient();
      flow(function (s) {
        // re-quote right before sending; 5 % headroom, LayerZero refunds what is not used
        var p = S.sendParam(d, to, q.amount, q.recv), br = S.bridge(f, s);
        return S.bridge(f).quoteSend(p, false).then(function (fee) {
          var nf2 = fee.nativeFee * 105n / 100n;
          return br.send(p, { nativeFee: nf2, lzTokenFee: 0n }, S.W.addr, { value: nf2 });
        });
      }, function (rc, tx) {
        var iface = new E.Interface(window.SB_ABI.oft), guid = null;
        rc.logs.forEach(function (l) { try { var p = iface.parseLog(l); if (p && p.name === "OFTSent") guid = p.args.guid; } catch (x) {} });
        return S.rp(d).getBlockNumber().then(function (bn) {
          addTx({ hash: tx.hash, from: f, to: d, amount: q.recv.toString(), guid: guid, t: Date.now(), dstFrom: Math.max(0, bn - 50), done: false });
          st.amt = ""; st.q = null; st.msg = t("ok_sent", { n: C[d].name }); st.msgBad = false; history();
        });
      });
    }
  });

  // ---------------------------------------------------------------- history (this browser)
  function hKey() { return "sectoraBridge.tx." + (S.W.addr || "").toLowerCase(); }
  function txs() { try { return JSON.parse(localStorage.getItem(hKey()) || "[]"); } catch (e) { return []; } }
  function saveTxs(l) { try { localStorage.setItem(hKey(), JSON.stringify(l.slice(0, 20))); } catch (e) {} }
  function addTx(x) { var l = txs(); l.unshift(x); saveTxs(l); }
  function history() {
    var box = $("brHistory"), l = S.W.addr ? txs() : [];
    if (!l.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = "<h3>" + esc(t("hist")) + "</h3>" + l.map(function (x) {
      var u = exUrl(x.from, "tx", x.hash), du = x.dstTx ? exUrl(x.to, "tx", x.dstTx) : "";
      return '<div class="br-tx"><div class="h"><b>' + fmt(BigInt(x.amount)) + " SECT</b><span class=\"dim\">" + esc(C[x.from].name) + " → " + esc(C[x.to].name) + "</span></div>" +
        '<div class="br-steps"><span class="ok">' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(t("st_sent")) + "</a>" : esc(t("st_sent"))) + "</span>" +
        '<span class="' + (x.done ? "ok" : "on") + '"><a href="https://layerzeroscan.com/tx/' + esc(x.hash) + '" target="_blank" rel="noopener">' + esc(x.done ? t("track") : t("st_way") + " · " + t("track")) + "</a></span>" +
        (x.done ? '<span class="ok">' + (du ? '<a href="' + esc(du) + '" target="_blank" rel="noopener">' + esc(t("st_recv")) + "</a>" : esc(t("st_recv"))) + "</span>" : "") +
        '<span>' + esc(ago(x.t)) + "</span></div></div>";
    }).join("");
  }
  // watch pending transfers on the destination network (OFTReceived with the same guid)
  function poll() {
    if (!live || !S.W.addr) return;
    var l = txs(), pend = l.filter(function (x) { return !x.done && x.guid; });
    if (!pend.length) return;
    Promise.all(pend.map(function (x) {
      var c = S.bridge(x.to);
      // scan forward from where we left off, a few thousand blocks at a time
      return S.rp(x.to).getBlockNumber().then(function (latest) {
        var step = function (from, n) {
          if (from > latest || n > 8 || x.done) return Promise.resolve();
          var to = Math.min(latest, from + 4900);
          return c.queryFilter(c.filters.OFTReceived(x.guid), from, to).then(function (ev) {
            if (ev.length) { x.done = true; x.dstTx = ev[0].transactionHash; return; }
            x.dstFrom = Math.max(x.dstFrom, to - 20);
            return step(to + 1, n + 1);
          });
        };
        return step(x.dstFrom, 0);
      }).catch(function () {});
    })).then(function () {
      var changed = pend.some(function (x) { return x.done; });
      saveTxs(l); history();
      if (changed) loadBalances().then(function () { render(); requote(); });
    });
  }
  setInterval(poll, 8000);
  setInterval(function () { if (!$("brHistory").hidden) history(); }, 30000);

  S.onWallet(function () { loadBalances().then(function () { render(); requote(); history(); }); });
  statics(); render();
  S.usdPrices().then(function (p) { px = p; refreshParts(); });
  // reconnect silently if the wallet already trusts this site
  var w0 = S.walletList()[0];
  if (w0 && live) w0.provider.request({ method: "eth_accounts" }).then(function (a) { if (a && a[0]) S.connect(w0); }).catch(function () {});
})();
