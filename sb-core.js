/* Sectora SECT bridge — shared core for bridge.html and bridge-deploy.html.
 * SECT on Ethereum is locked in SectoraOFTAdapter; SECT on BNB Chain is SectoraOFT (LayerZero V2). */
(function () {
  "use strict";
  var E = window.ethers;
  var EP = "0x1a44076050125825900e736c501f859c50fE728c";          // LayerZero EndpointV2 (same address on both networks)
  var SECT = "0x8C9984B06281f1CA9416e493c2E602AaB08513db";        // SECT on Ethereum (unchanged)
  var OPTS = "0x000301001101000000000000000000000000000249f0";     // 150,000 gas reserved for the delivery
  var C = {
    ethereum: { key: "ethereum", id: 1, eid: 30101, name: "Ethereum", sym: "ETH", col: "#627eea", exp: "https://etherscan.io", ds: "ethereum",
      rpc: ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com"], wnative: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", confirmations: "≈ 3 min" },
    bsc: { key: "bsc", id: 56, eid: 30102, name: "BNB Chain", sym: "BNB", col: "#f0b90b", exp: "https://bscscan.com", ds: "bsc",
      rpc: ["https://bsc-rpc.publicnode.com", "https://bsc-dataseed.bnbchain.org"], wnative: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", confirmations: "≈ 1 min",
      add: { chainId: "0x38", chainName: "BNB Smart Chain", nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 }, rpcUrls: ["https://bsc-dataseed.bnbchain.org"], blockExplorerUrls: ["https://bscscan.com"] } }
  };
  var KEYS = ["ethereum", "bsc"];
  // local testing against two forks (only on this machine, only when switched on)
  var LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  try {
    if (LOCAL && localStorage.getItem("sb.forks") === "1") {
      C.ethereum.id = 31337; C.ethereum.rpc = ["http://127.0.0.1:8545"]; C.ethereum.exp = "";
      C.bsc.id = 31338; C.bsc.rpc = ["http://127.0.0.1:8546"]; C.bsc.exp = ""; C.bsc.add = null;
    }
  } catch (e) {}
  function overrides() { try { return JSON.parse(localStorage.getItem("sectoraBridge.addr") || "{}") || {}; } catch (e) { return {}; } }
  function addrOf(k) {
    var o = overrides()[k];
    if (o && E.isAddress(o)) return E.getAddress(o);
    var d = (window.SB_DEPLOY || {})[k];
    return d && E.isAddress(d) ? E.getAddress(d) : "";
  }
  function saveAddr(k, a) { try { var o = overrides(); o[k] = a; localStorage.setItem("sectoraBridge.addr", JSON.stringify(o)); } catch (e) {} }
  var RP = {};
  function rp(k) { return RP[k] || (RP[k] = new E.JsonRpcProvider(C[k].rpc[0], C[k].id, { staticNetwork: E.Network.from(C[k].id), batchMaxCount: 1 })); }
  function other(k) { return k === "ethereum" ? "bsc" : "ethereum"; }
  function abiOf(k) { return k === "ethereum" ? window.SB_ABI.adapter : window.SB_ABI.oft; }
  function bridge(k, runner) { return new E.Contract(addrOf(k), abiOf(k), runner || rp(k)); }
  var ERC20 = ["function balanceOf(address) view returns (uint256)", "function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)", "function name() view returns (string)", "function symbol() view returns (string)", "function decimals() view returns (uint8)", "function totalSupply() view returns (uint256)"];
  function sect(k, runner) { return new E.Contract(k === "ethereum" ? SECT : addrOf("bsc"), ERC20, runner || rp(k)); }
  var EPABI = ["function eid() view returns (uint32)", "function defaultSendLibrary(uint32) view returns (address)", "function defaultReceiveLibrary(uint32) view returns (address)",
    "function getConfig(address,address,uint32,uint32) view returns (bytes)", "function isDefaultSendLibrary(address,uint32) view returns (bool)", "function delegates(address) view returns (address)"];
  function ep(k) { return new E.Contract(EP, EPABI, rp(k)); }
  var ULN = "tuple(uint64 confirmations,uint8 requiredDVNCount,uint8 optionalDVNCount,uint8 optionalDVNThreshold,address[] requiredDVNs,address[] optionalDVNs)";
  function decodeUln(raw) { return E.AbiCoder.defaultAbiCoder().decode([ULN], raw)[0]; }
  function b32(a) { return E.zeroPadValue(a, 32); }
  function sendParam(dstK, to, amountLD, minLD) { return { dstEid: C[dstK].eid, to: b32(to), amountLD: amountLD, minAmountLD: minLD, extraOptions: "0x", composeMsg: "0x", oftCmd: "0x" }; }
  // the route this network's bridge contract needs, built from LayerZero's current defaults read on chain
  function routeFor(k, limitLD) {
    var e = ep(k), o = other(k), eid = C[o].eid, me = addrOf(k), peer = addrOf(o);
    return Promise.all([e.defaultSendLibrary(eid), e.defaultReceiveLibrary(eid)]).then(function (libs) {
      return Promise.all([e.getConfig(me, libs[0], eid, 1), e.getConfig(me, libs[0], eid, 2), e.getConfig(me, libs[1], eid, 2)]).then(function (cf) {
        return { eid: eid, peer: b32(peer), options: [{ eid: eid, msgType: 1, options: OPTS }, { eid: eid, msgType: 2, options: OPTS }], limit: limitLD, window: 86400,
          sendLib: libs[0], receiveLib: libs[1],
          sendConfig: [{ eid: eid, configType: 1, config: cf[0] }, { eid: eid, configType: 2, config: cf[1] }],
          receiveConfig: [{ eid: eid, configType: 2, config: cf[2] }] };
      });
    });
  }
  // wallets (EIP-6963 + window.ethereum)
  var providers = [];
  window.addEventListener("eip6963:announceProvider", function (e) { if (e.detail && e.detail.provider && !providers.some(function (p) { return p.info && e.detail.info && p.info.uuid === e.detail.info.uuid; })) providers.push(e.detail); });
  try { window.dispatchEvent(new Event("eip6963:requestProvider")); } catch (e) {}
  var W = { prov: null, addr: "", chainId: 0, info: null, listeners: [] };
  function onWallet(fn) { W.listeners.push(fn); }
  function emit() { W.listeners.forEach(function (fn) { try { fn(W); } catch (e) {} }); }
  function walletList() { var l = providers.slice(); if (!l.length && window.ethereum) l.push({ provider: window.ethereum, info: { name: "Wallet", uuid: "injected" } }); return l; }
  function connect(choice) {
    var l = walletList(), pick = choice || l[0];
    if (!pick) return Promise.reject(new Error("no-wallet"));
    var prov = pick.provider;
    return prov.request({ method: "eth_requestAccounts" }).then(function (a) {
      W.prov = prov; W.info = pick.info; W.addr = E.getAddress(a[0]);
      return prov.request({ method: "eth_chainId" });
    }).then(function (cid) {
      W.chainId = parseInt(cid, 16);
      if (prov.on && !prov._sbWired) {
        prov._sbWired = true;
        prov.on("accountsChanged", function (a) { W.addr = a && a[0] ? E.getAddress(a[0]) : ""; emit(); });
        prov.on("chainChanged", function (c) { W.chainId = parseInt(c, 16); emit(); });
      }
      emit(); return W;
    });
  }
  function switchTo(k) {
    if (!W.prov) return Promise.reject(new Error("no-wallet"));
    var hex = "0x" + C[k].id.toString(16);
    return W.prov.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] }).catch(function (err) {
      if (err && (err.code === 4902 || /Unrecognized|not added|4902/i.test(String(err.message))) && C[k].add) return W.prov.request({ method: "wallet_addEthereumChain", params: [C[k].add] });
      throw err;
    }).then(function () { return W.prov.request({ method: "eth_chainId" }); }).then(function (cid) {
      W.chainId = parseInt(cid, 16);
      if (W.chainId !== C[k].id) throw new Error("wrong-chain");
      emit();
    });
  }
  function signer() { return new E.BrowserProvider(W.prov, "any").getSigner(); }
  function isReject(err) { var s = String((err && (err.code || "")) + " " + (err && err.message || "")); return /4001|ACTION_REJECTED|denied|rejected|cancel/i.test(s); }
  function errMsg(err) {
    var s = (err && (err.shortMessage || err.reason || err.message)) || String(err);
    try { var d = err && (err.data || (err.info && err.info.error && err.info.error.data)); if (d && d !== "0x") { var p = new E.Interface(window.SB_ABI.oft).parseError(d); if (p) s = p.name; } } catch (e) {}
    return String(s).replace(/^execution reverted:?\s*/i, "").slice(0, 160);
  }
  function usdPrices() {
    var get = function (a, ds) { return fetch("https://api.dexscreener.com/latest/dex/tokens/" + a).then(function (r) { return r.json(); }).then(function (j) {
      var best = null; (j.pairs || []).forEach(function (p) { if (p.chainId === ds && p.baseToken && p.baseToken.address.toLowerCase() === a.toLowerCase()) { var l = (p.liquidity && p.liquidity.usd) || 0; if (!best || l > best.l) best = { l: l, p: +p.priceUsd }; } });
      return best ? best.p : 0; }).catch(function () { return 0; }); };
    return Promise.all([get(C.ethereum.wnative, "ethereum"), get(C.bsc.wnative, "bsc"), get(SECT, "ethereum")]).then(function (r) { return { ethereum: r[0], bsc: r[1], sect: r[2] }; });
  }
  window.SB = { E: E, EP: EP, SECT: SECT, OPTS: OPTS, C: C, KEYS: KEYS, LOCAL: LOCAL, addrOf: addrOf, saveAddr: saveAddr, rp: rp, other: other, bridge: bridge, sect: sect, ep: ep,
    decodeUln: decodeUln, b32: b32, sendParam: sendParam, routeFor: routeFor, W: W, onWallet: onWallet, walletList: walletList, connect: connect, switchTo: switchTo, signer: signer,
    isReject: isReject, errMsg: errMsg, usdPrices: usdPrices, ERC20: ERC20 };
})();
