/* Sectora Launch — live mode: real coins on EVM networks.
 * Reads the Sectora Launch factory on each network through a public RPC and sends
 * transactions through the visitor's own wallet (EIP-1193 / EIP-6963).
 * SectoraEVM itself stays in demo mode until its mainnet (approx. 22 March 2027). */
(function () {
  "use strict";
  var E = window.ethers, ABI = window.SL_ABI, DEP = window.SL_DEPLOYMENTS || {};
  if (!E || !ABI) return;
  var X = null; // helpers from launch.js, set by SLLive.init()

  /* ------------------------------------------------------------------ networks */
  var CHAINS = {
    bsc: { id: 56, name: "BNB Chain", short: "BNB", sym: "BNB", col: "#f0b90b", ds: "bsc", exp: "https://bscscan.com",
      rpc: ["https://bsc-rpc.publicnode.com", "https://bsc-dataseed.bnbchain.org"],
      dex: "PancakeSwap", dexFactory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73", router: "0x10ED43C718714eb63d5aA57B78B54704E256024E", wnative: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      swap: "https://pancakeswap.finance/swap?chain=bsc&outputCurrency=", quick: ["0.05", "0.1", "0.5", "1"] },
    base: { id: 8453, name: "Base", short: "Base", sym: "ETH", col: "#0052ff", ds: "base", exp: "https://basescan.org",
      rpc: ["https://base-rpc.publicnode.com", "https://mainnet.base.org"],
      dex: "Uniswap V2", dexFactory: "0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6", router: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24", wnative: "0x4200000000000000000000000000000000000006",
      swap: "https://app.uniswap.org/swap?chain=base&outputCurrency=", quick: ["0.005", "0.01", "0.05", "0.1"] },
    ethereum: { id: 1, name: "Ethereum", short: "ETH", sym: "ETH", col: "#627eea", ds: "ethereum", exp: "https://etherscan.io",
      rpc: ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com"],
      dex: "Uniswap", dexFactory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", wnative: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      swap: "https://app.uniswap.org/swap?chain=mainnet&inputCurrency=ETH&outputCurrency=", quick: ["0.005", "0.01", "0.05", "0.1"],
      // every coin is priced in SECT; ETH buys swap ETH → USDT → SECT on Uniswap V3
      qs: "SECT", qaddr: "0x8C9984B06281f1CA9416e493c2E602AaB08513db", qquick: ["100", "500", "1000", "5000"],
      v3router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", quoter: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
      path: ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 500, "0xdAC17F958D2ee523a2206206994597C13D831ec7", 100, "0x8C9984B06281f1CA9416e493c2E602AaB08513db"] },
    arbitrum: { id: 42161, name: "Arbitrum", short: "ARB", sym: "ETH", col: "#28a0f0", ds: "arbitrum", exp: "https://arbiscan.io",
      rpc: ["https://arbitrum-one-rpc.publicnode.com", "https://arb1.arbitrum.io/rpc"],
      dex: "Uniswap V2", dexFactory: "0xf1D7CC64Fb4452F05c498126312eBE29f30Fbcf9", router: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24", wnative: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      swap: "https://app.uniswap.org/swap?chain=arbitrum&outputCurrency=", quick: ["0.005", "0.01", "0.05", "0.1"] },
    polygon: { id: 137, name: "Polygon", short: "POL", sym: "POL", col: "#8247e5", ds: "polygon", exp: "https://polygonscan.com",
      rpc: ["https://polygon-bor-rpc.publicnode.com", "https://polygon-rpc.com"],
      dex: "QuickSwap", dexFactory: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32", router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", wnative: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      swap: "https://dapp.quickswap.exchange/swap?outputCurrency=", quick: ["50", "100", "500", "1000"] },
    optimism: { id: 10, name: "Optimism", short: "OP", sym: "ETH", col: "#ff0420", ds: "optimism", exp: "https://optimistic.etherscan.io",
      rpc: ["https://optimism-rpc.publicnode.com", "https://mainnet.optimism.io"],
      dex: "Uniswap V2", dexFactory: "0x0c3c1c532F1e39EdF36BE9Fe0bE1410313E074Bf", router: "0x4A7b5Da61326A6379179b40d00F57E5bbDC962c2", wnative: "0x4200000000000000000000000000000000000006",
      swap: "https://app.uniswap.org/swap?chain=optimism&outputCurrency=", quick: ["0.005", "0.01", "0.05", "0.1"] },
    avalanche: { id: 43114, name: "Avalanche", short: "AVAX", sym: "AVAX", col: "#e84142", ds: "avalanche", exp: "https://snowtrace.io",
      rpc: ["https://avalanche-c-chain-rpc.publicnode.com", "https://api.avax.network/ext/bc/C/rpc"],
      dex: "Uniswap V2", dexFactory: "0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C", router: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24", wnative: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
      swap: "https://app.uniswap.org/swap?chain=avalanche&outputCurrency=", quick: ["1", "5", "10", "25"] }
  };
  var ORDER = ["ethereum", "bsc", "base", "arbitrum", "polygon", "optimism", "avalanche"];
  // Local development chain (hardhat / anvil) — only offered when the site runs on this machine.
  var LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  if (LOCAL) {
    CHAINS.local = Object.assign({}, CHAINS.ethereum, { id: 31337, name: "Localhost", short: "Local", col: "#9aa4b2", exp: "", rpc: ["http://127.0.0.1:8545"] });
    ORDER.push("local");
  }
  var MAINNET_TXT = "22.03.2027";
  var CURVE = 800e6, VT0 = 1073e6, FAIR_S = 300, FAIR_CAP = 10e6, DEV_CAP = 50e6, CLIFF_S = 7 * 86400, VEST_S = 30 * 86400;
  var DEAD = "0x000000000000000000000000000000000000dEaD";

  function overrides() { try { return JSON.parse(localStorage.getItem("sectoraLaunch.factories") || "{}") || {}; } catch (e) { return {}; } }
  function factoryOf(k) {
    if (!CHAINS[k] || !CHAINS[k].qaddr) return ""; // this version runs where SECT is the quote coin
    var o = overrides()[k];
    if (o && E.isAddress(o)) return E.getAddress(o);
    var d = DEP[k];
    return d && E.isAddress(d) ? E.getAddress(d) : "";
  }
  function isLive(k) { return !!(k && CHAINS[k]); }
  function deployed(k) { return isLive(k) && !!factoryOf(k); }
  function liveChains() { return ORDER.filter(deployed); }

  /* ------------------------------------------------------------------ strings */
  var LS = {
    en: {
      pay: "Pay with", route: "ETH → USDT → SECT on Uniswap, then the curve, in one transaction.", t_swap: "Swapped to SECT", t_recv_sect: "When you sell you receive SECT.", t_uni: "Buy with ETH on Uniswap", t_approve_q: "Approve {s}", c_route: "Your ETH is swapped to SECT on Uniswap (ETH → USDT → SECT). SECT left over is returned to you.", st_burned: "SECT burned", st_lp: "LP burned", sect_bal: "SECT balance", eth_bal: "ETH balance", burn_pending: "+{n} pending burn", burn_pend_l: "Pending burn", burn_btn: "Burn pending SECT", burn_p: "Anyone can run it: {b} % of the platform income is burned (sent to 0x…dEaD) and the rest goes to Sectora.", ok_burn: "SECT burned", net: "Network", net_t: "Choose network", net_live: "Live", net_soon: "Coming soon", sectora_demo: "SectoraEVM", sectora_note: "Mainnet approx. {d}", sectora_menu: "Demo · mainnet approx. {d}",
      banner_live: "Real coins on {n}, priced in SECT. Sectora Launch arrives on SectoraEVM approximately on 22 March 2027.",
      banner_off: "Sectora Launch is not active on {n} yet. Choose an active network. SectoraEVM: approximately 22 March 2027.",
      sectora_soon_t: "Coming to SectoraEVM", sectora_soon_p: "Sectora Launch will be available on SectoraEVM approximately on 22 March 2027, at mainnet. Until then it runs on Ethereum with real coins priced in SECT.",
      w_connect: "Connect wallet", w_choose: "Choose your wallet", w_none_t: "No wallet found in this browser", w_none_p: "Open this page inside your wallet's browser, or install a wallet extension.",
      w_disconnect: "Disconnect", w_wrong: "Switch to {n}", w_addr: "Wallet",
      ex_t: "Explore coins", ex_sub: "{n} live coins on {c}", ex_loading: "Loading coins from {c}…", ex_err: "Could not reach {c}. Retrying…",
      ex_empty_t: "No coins yet on {c}", ex_empty_p: "Be the first to launch one. It takes one transaction.",
      off_t: "Sectora Launch is not active on {c} yet", off_p: "Pick one of the active networks to explore and launch coins.",
      st_coins: "Coins launched", st_grad: "Graduated to DEX", st_raised: "In bonding curves", st_nets: "Active networks",
      grad_dex: "On {d}", curve: "curve", mc: "Market cap", price: "Price",
      c_t: "Launch a coin", c_s: "Your coin goes live on {c}, priced in SECT, with a fixed supply of 1,000,000,000 and every protection built into the contract.",
      c_name: "Name", c_ticker: "Ticker", c_desc: "Description", c_img: "Image link", c_img_h: "https:// or ipfs:// link to a square image (PNG, JPG, GIF, WebP).",
      c_web: "Website", c_x: "X (Twitter)", c_tg: "Telegram", c_dev: "Your buy at launch (optional)", c_dev_h: "Up to 5 % of supply. Locked 7 days, then released over 30 days.",
      c_max: "Max 5 %", c_summary: "Summary", c_fee: "Launch fee", c_devbuy: "Your buy", c_total: "Total", c_get: "You get (locked)",
      c_rules: "Rules in the contract", c_r1: "Fixed supply 1,000,000,000 · no owner, no mint, no tax",
      c_r2: "Anti-sniper: max 1 % per wallet for 5 minutes", c_r3: "Graduates at ~{g} SECT raised → COIN/SECT pool on {d}, LP burned forever",
      c_r4: "Fee 1 % per curve trade: 0.5 % creator · 0.5 % Sectora ({b} % of it burned in SECT)", c_r5: "Until graduation it trades only on the curve",
      c_ack: "I understand this is a real transaction on {c} and that new coins are high risk.",
      c_btn: "Launch on {c}", c_need_wallet: "Connect your wallet to launch",
      e_name: "Name: 1 to 32 characters", e_sym: "Ticker: 1 to 12 letters or numbers", e_meta: "Description and links are too long",
      e_img: "Image link must start with https:// or ipfs://", e_dev: "Above 5 % of supply", e_bal: "Not enough {s} in your wallet",
      e_reserved: "This ticker imitates a well-known asset", e_similar: "Similar to an existing coin: {n}",
      t_buy: "Buy", t_sell: "Sell", t_bal: "Balance", t_you_get: "You receive", t_fee: "Fee (1 %)", t_impact: "Price impact", t_min: "Minimum after slippage",
      t_slip: "Slippage", t_refund: "Refund (curve completes)", t_completes: "This buy completes the curve and moves the coin to {d}.",
      t_fair: "Fair window: max 1 % of supply per wallet for {m}.", t_fair_cap: "Above the 1 % per wallet limit of the fair window",
      t_btn_buy: "Buy ${s}", t_btn_sell: "Sell ${s}", t_no_tokens: "You have no ${s}", t_dex_note: "Graduated: trades now run on {d}.",
      t_approve: "Approve ${s}", t_router_off: "In-app trading is off on this network. Use {d}:",
      cv_t: "Bonding curve", cv_p: "{p} % · {r} of ~{g} {s} raised", cv_grad: "Graduated to {d}", cv_grad_p: "Liquidity {n} {s} + 200M tokens · LP tokens burned forever",
      cr_t: "Creator", cr_fees: "Your creator fees", cr_claim: "Claim", cr_vest: "Creator tokens", cr_vest_p: "{v} of {a} released · fully by {d}", cr_none: "The creator did not buy at launch.",
      tab_trades: "Trades", tab_shield: "Shield", tab_info: "Info", tr_recent: "Recent trades", tr_none: "No trades in the recent blocks.",
      th_time: "Time", th_type: "Type", th_acct: "Wallet", th_native: "{s}", th_tok: "Tokens", th_tx: "Tx",
      i_contract: "Contract", i_creator: "Creator", i_created: "Created", i_pair: "Pool", i_links: "Links", i_explorer: "View on explorer", i_chart: "DexScreener",
      sh_t: "Sectora Shield", sh_score: "Contract guarantees and live checks",
      sh1: "Fixed supply", sh1d: "1,000,000,000 tokens minted once. No mint function exists.",
      sh2: "No owner, no tax", sh2d: "The token has no owner, no blacklist and no transfer fee.",
      sh3: "Liquidity locked forever", sh3d: "At graduation the LP tokens go to 0x…dEaD. Nobody can pull the pool.",
      sh4: "Fair launch window", sh4d: "Max 1 % of supply per wallet during the first 5 minutes.",
      sh5: "Creator buy capped and vested", sh5d: "Creator bought {p} % · locked 7 days, released over 30 days.",
      sh5n: "The creator did not buy at launch.", sh6: "Pool cannot be seeded early", sh6d: "Until graduation tokens only move through the curve.",
      sh7: "Original name", sh7d: "No similar coin found on this network.", sh7w: "Similar to {n} — make sure it is the one you want.",
      sh8: "Ticker check", sh8d: "Does not imitate a major asset.", sh8w: "Imitates a major asset ({s}).",
      me_t: "Your wallet", me_coins: "Coins you created", me_hold: "Your coins", me_none: "Nothing here yet.", me_fees: "Creator fees to claim",
      stats_t: "Sectora Launch on every network", stats_fees: "Platform fees pending",
      tx_confirm: "Confirm in your wallet", tx_sent: "Transaction sent", tx_wait: "Waiting for confirmation on {c}…", tx_ok: "Confirmed", tx_view: "View transaction",
      tx_rejected: "Transaction cancelled in the wallet.", tx_failed: "Transaction failed: {m}",
      ok_launch: "Coin launched", ok_buy: "Bought {n} ${s}", ok_sell: "Sold {n} ${s}", ok_claim: "Claimed", ok_approve: "Approved",
      r_fair: "Above the 1 % per wallet limit of the fair window", r_grad: "This coin already graduated", r_slip: "Price moved more than your slippage. Try again.",
      r_fee: "Launch fee missing", r_dev: "Your buy is above 5 % of supply", r_bal: "Not enough balance",
      soon_on: "Live on {n} networks", why_multi_t: "Any EVM network", why_multi_p: "BNB Chain, Base, Ethereum, Arbitrum, Polygon, Optimism and Avalanche today. SectoraEVM at mainnet, approx. 22 March 2027.",
      block: "Block", usd: "≈ {u}", st_main: "SectoraEVM mainnet", days: "days", approx_d: "approx. {d}", bal_h: "Balance"
    },
    es: {
      pay: "Pagar con", route: "ETH → USDT → SECT en Uniswap y luego la curva, en una sola transacción.", t_swap: "Cambiado a SECT", t_recv_sect: "Al vender recibes SECT.", t_uni: "Comprar con ETH en Uniswap", t_approve_q: "Aprobar {s}", c_route: "Tu ETH se cambia a SECT en Uniswap (ETH → USDT → SECT). El SECT que sobre te lo devuelve el contrato.", st_burned: "SECT quemado", st_lp: "LP quemado", sect_bal: "Saldo SECT", eth_bal: "Saldo ETH", burn_pending: "+{n} pendiente de quemar", burn_pend_l: "Pendiente de quemar", burn_btn: "Ejecutar la quema pendiente", burn_p: "Cualquiera puede ejecutarla: el {b} % de los ingresos de la plataforma se quema (se envía a 0x…dEaD) y el resto va a Sectora.", ok_burn: "SECT quemado", net: "Red", net_t: "Elige la red", net_live: "Activa", net_soon: "Próximamente", sectora_demo: "SectoraEVM", sectora_note: "Mainnet aprox. {d}", sectora_menu: "Demo · mainnet aprox. {d}",
      banner_live: "Monedas reales en {n}, cotizadas en SECT. Sectora Launch llegará a SectoraEVM aproximadamente el 22 de marzo de 2027.",
      banner_off: "Sectora Launch aún no está activo en {n}. Elige una red activa. SectoraEVM: aproximadamente el 22 de marzo de 2027.",
      sectora_soon_t: "Llega a SectoraEVM", sectora_soon_p: "Sectora Launch estará disponible en SectoraEVM aproximadamente el 22 de marzo de 2027, con la mainnet. Mientras tanto funciona en Ethereum con monedas reales cotizadas en SECT.",
      w_connect: "Conectar wallet", w_choose: "Elige tu wallet", w_none_t: "No hay ninguna wallet en este navegador", w_none_p: "Abre esta página dentro del navegador de tu wallet o instala una extensión.",
      w_disconnect: "Desconectar", w_wrong: "Cambiar a {n}", w_addr: "Wallet",
      ex_t: "Explorar monedas", ex_sub: "{n} monedas reales en {c}", ex_loading: "Cargando monedas de {c}…", ex_err: "No se pudo conectar con {c}. Reintentando…",
      ex_empty_t: "Aún no hay monedas en {c}", ex_empty_p: "Sé el primero en lanzar una. Es una sola transacción.",
      off_t: "Sectora Launch aún no está activo en {c}", off_p: "Elige una de las redes activas para explorar y lanzar monedas.",
      st_coins: "Monedas lanzadas", st_grad: "Graduadas al DEX", st_raised: "En curvas de bonding", st_nets: "Redes activas",
      grad_dex: "En {d}", curve: "curva", mc: "Cap. de mercado", price: "Precio",
      c_t: "Lanzar una moneda", c_s: "Tu moneda sale en {c}, cotizada en SECT, con un supply fijo de 1.000.000.000 y todas las protecciones escritas en el contrato.",
      c_name: "Nombre", c_ticker: "Ticker", c_desc: "Descripción", c_img: "Enlace de la imagen", c_img_h: "Enlace https:// o ipfs:// a una imagen cuadrada (PNG, JPG, GIF, WebP).",
      c_web: "Web", c_x: "X (Twitter)", c_tg: "Telegram", c_dev: "Tu compra al lanzar (opcional)", c_dev_h: "Hasta el 5 % del supply. Bloqueada 7 días y liberada durante 30 días.",
      c_max: "Máx. 5 %", c_summary: "Resumen", c_fee: "Comisión de lanzamiento", c_devbuy: "Tu compra", c_total: "Total", c_get: "Recibes (bloqueado)",
      c_rules: "Reglas del contrato", c_r1: "Supply fijo 1.000.000.000 · sin dueño, sin mint, sin impuestos",
      c_r2: "Anti-snipers: máx. 1 % por cartera durante 5 minutos", c_r3: "Se gradúa al reunir ~{g} SECT → pool MONEDA/SECT en {d}, LP quemado para siempre",
      c_r4: "Comisión 1 % por operación en la curva: 0,5 % creador · 0,5 % Sectora (el {b} % se quema en SECT)", c_r5: "Hasta graduarse solo se opera en la curva",
      c_ack: "Entiendo que es una transacción real en {c} y que las monedas nuevas son de alto riesgo.",
      c_btn: "Lanzar en {c}", c_need_wallet: "Conecta tu wallet para lanzar",
      e_name: "Nombre: de 1 a 32 caracteres", e_sym: "Ticker: de 1 a 12 letras o números", e_meta: "La descripción y los enlaces son demasiado largos",
      e_img: "El enlace de la imagen debe empezar por https:// o ipfs://", e_dev: "Supera el 5 % del supply", e_bal: "No tienes suficiente {s} en la wallet",
      e_reserved: "Este ticker imita un activo conocido", e_similar: "Parecida a una moneda que ya existe: {n}",
      t_buy: "Comprar", t_sell: "Vender", t_bal: "Saldo", t_you_get: "Recibes", t_fee: "Comisión (1 %)", t_impact: "Impacto en el precio", t_min: "Mínimo con deslizamiento",
      t_slip: "Deslizamiento", t_refund: "Devolución (se completa la curva)", t_completes: "Esta compra completa la curva y lleva la moneda a {d}.",
      t_fair: "Ventana justa: máx. 1 % del supply por cartera durante {m}.", t_fair_cap: "Supera el límite del 1 % por cartera de la ventana justa",
      t_btn_buy: "Comprar ${s}", t_btn_sell: "Vender ${s}", t_no_tokens: "No tienes ${s}", t_dex_note: "Graduada: ahora se opera en {d}.",
      t_approve: "Aprobar ${s}", t_router_off: "La operación desde aquí no está disponible en esta red. Usa {d}:",
      cv_t: "Curva de bonding", cv_p: "{p} % · {r} de ~{g} {s} reunidos", cv_grad: "Graduada a {d}", cv_grad_p: "Liquidez {n} {s} + 200M tokens · LP quemado para siempre",
      cr_t: "Creador", cr_fees: "Tus comisiones de creador", cr_claim: "Cobrar", cr_vest: "Tokens del creador", cr_vest_p: "{v} de {a} liberados · todo el {d}", cr_none: "El creador no compró al lanzar.",
      tab_trades: "Operaciones", tab_shield: "Shield", tab_info: "Info", tr_recent: "Operaciones recientes", tr_none: "No hay operaciones en los bloques recientes.",
      th_time: "Hora", th_type: "Tipo", th_acct: "Cartera", th_native: "{s}", th_tok: "Tokens", th_tx: "Tx",
      i_contract: "Contrato", i_creator: "Creador", i_created: "Creada", i_pair: "Pool", i_links: "Enlaces", i_explorer: "Ver en el explorador", i_chart: "DexScreener",
      sh_t: "Sectora Shield", sh_score: "Garantías del contrato y comprobaciones en vivo",
      sh1: "Supply fijo", sh1d: "1.000.000.000 tokens creados una sola vez. No existe función de mint.",
      sh2: "Sin dueño ni impuestos", sh2d: "El token no tiene dueño, lista negra ni comisión por transferencia.",
      sh3: "Liquidez bloqueada para siempre", sh3d: "Al graduarse, los LP van a 0x…dEaD. Nadie puede retirar el pool.",
      sh4: "Ventana de lanzamiento justo", sh4d: "Máx. 1 % del supply por cartera durante los primeros 5 minutos.",
      sh5: "Compra del creador limitada y con vesting", sh5d: "El creador compró el {p} % · bloqueado 7 días y liberado en 30 días.",
      sh5n: "El creador no compró al lanzar.", sh6: "Nadie puede crear el pool antes", sh6d: "Hasta graduarse, los tokens solo se mueven por la curva.",
      sh7: "Nombre original", sh7d: "No hay monedas parecidas en esta red.", sh7w: "Parecida a {n}: asegúrate de que es la que buscas.",
      sh8: "Ticker", sh8d: "No imita a un activo conocido.", sh8w: "Imita a un activo conocido ({s}).",
      me_t: "Tu wallet", me_coins: "Monedas que has creado", me_hold: "Tus monedas", me_none: "Aún no hay nada.", me_fees: "Comisiones de creador por cobrar",
      stats_t: "Sectora Launch en todas las redes", stats_fees: "Comisiones de la plataforma pendientes",
      tx_confirm: "Confirma en tu wallet", tx_sent: "Transacción enviada", tx_wait: "Esperando confirmación en {c}…", tx_ok: "Confirmada", tx_view: "Ver transacción",
      tx_rejected: "Transacción cancelada en la wallet.", tx_failed: "La transacción falló: {m}",
      ok_launch: "Moneda lanzada", ok_buy: "Has comprado {n} ${s}", ok_sell: "Has vendido {n} ${s}", ok_claim: "Cobrado", ok_approve: "Aprobado",
      r_fair: "Supera el límite del 1 % por cartera de la ventana justa", r_grad: "Esta moneda ya se graduó", r_slip: "El precio se movió más que tu deslizamiento. Inténtalo de nuevo.",
      r_fee: "Falta la comisión de lanzamiento", r_dev: "Tu compra supera el 5 % del supply", r_bal: "Saldo insuficiente",
      soon_on: "Activo en {n} redes", why_multi_t: "Cualquier red EVM", why_multi_p: "BNB Chain, Base, Ethereum, Arbitrum, Polygon, Optimism y Avalanche hoy. SectoraEVM con la mainnet, aprox. el 22 de marzo de 2027.",
      block: "Bloque", usd: "≈ {u}", st_main: "Mainnet SectoraEVM", days: "días", approx_d: "aprox. {d}", bal_h: "Saldo"
    },
    pt: {
      pay: "Pagar com", route: "ETH → USDT → SECT na Uniswap e depois a curva, numa única transação.", t_swap: "Trocado por SECT", t_recv_sect: "Ao vender você recebe SECT.", t_uni: "Comprar com ETH na Uniswap", t_approve_q: "Aprovar {s}", c_route: "Seu ETH é trocado por SECT na Uniswap (ETH → USDT → SECT). O SECT que sobrar volta para você.", st_burned: "SECT queimado", st_lp: "LP queimado", sect_bal: "Saldo SECT", eth_bal: "Saldo ETH", burn_pending: "+{n} a queimar", burn_pend_l: "A queimar", burn_btn: "Executar a queima pendente", burn_p: "Qualquer pessoa pode executar: {b} % da receita da plataforma é queimada (enviada para 0x…dEaD) e o resto vai para a Sectora.", ok_burn: "SECT queimado", net: "Rede", net_t: "Escolha a rede", net_live: "Ativa", net_soon: "Em breve", sectora_demo: "SectoraEVM", sectora_note: "Mainnet aprox. {d}", sectora_menu: "Demo · mainnet aprox. {d}",
      banner_live: "Moedas reais na {n}, cotadas em SECT. O Sectora Launch chega à SectoraEVM aproximadamente em 22 de março de 2027.",
      banner_off: "O Sectora Launch ainda não está ativo na {n}. Escolha uma rede ativa. SectoraEVM: aproximadamente 22 de março de 2027.",
      sectora_soon_t: "Chega à SectoraEVM", sectora_soon_p: "O Sectora Launch estará disponível na SectoraEVM aproximadamente em 22 de março de 2027, com a mainnet. Até lá funciona na Ethereum com moedas reais cotadas em SECT.",
      w_connect: "Conectar carteira", w_choose: "Escolha sua carteira", w_none_t: "Nenhuma carteira neste navegador", w_none_p: "Abra esta página no navegador da sua carteira ou instale uma extensão.",
      w_disconnect: "Desconectar", w_wrong: "Mudar para {n}", w_addr: "Carteira",
      ex_t: "Explorar moedas", ex_sub: "{n} moedas reais na {c}", ex_loading: "Carregando moedas da {c}…", ex_err: "Não foi possível conectar à {c}. Tentando de novo…",
      ex_empty_t: "Ainda não há moedas na {c}", ex_empty_p: "Seja o primeiro a lançar uma. É uma única transação.",
      off_t: "O Sectora Launch ainda não está ativo na {c}", off_p: "Escolha uma das redes ativas para explorar e lançar moedas.",
      st_coins: "Moedas lançadas", st_grad: "Graduadas para a DEX", st_raised: "Nas curvas de bonding", st_nets: "Redes ativas",
      grad_dex: "Na {d}", curve: "curva", mc: "Cap. de mercado", price: "Preço",
      c_t: "Lançar uma moeda", c_s: "Sua moeda sai na {c}, cotada em SECT, com supply fixo de 1.000.000.000 e todas as proteções escritas no contrato.",
      c_name: "Nome", c_ticker: "Ticker", c_desc: "Descrição", c_img: "Link da imagem", c_img_h: "Link https:// ou ipfs:// para uma imagem quadrada (PNG, JPG, GIF, WebP).",
      c_web: "Site", c_x: "X (Twitter)", c_tg: "Telegram", c_dev: "Sua compra no lançamento (opcional)", c_dev_h: "Até 5 % do supply. Bloqueada 7 dias e liberada ao longo de 30 dias.",
      c_max: "Máx. 5 %", c_summary: "Resumo", c_fee: "Taxa de lançamento", c_devbuy: "Sua compra", c_total: "Total", c_get: "Você recebe (bloqueado)",
      c_rules: "Regras do contrato", c_r1: "Supply fixo 1.000.000.000 · sem dono, sem mint, sem impostos",
      c_r2: "Anti-snipers: máx. 1 % por carteira durante 5 minutos", c_r3: "Gradua ao reunir ~{g} SECT → pool MOEDA/SECT na {d}, LP queimado para sempre",
      c_r4: "Taxa de 1 % por operação na curva: 0,5 % criador · 0,5 % Sectora ({b} % queimado em SECT)", c_r5: "Até graduar só se negocia na curva",
      c_ack: "Entendo que é uma transação real na {c} e que moedas novas são de alto risco.",
      c_btn: "Lançar na {c}", c_need_wallet: "Conecte sua carteira para lançar",
      e_name: "Nome: de 1 a 32 caracteres", e_sym: "Ticker: de 1 a 12 letras ou números", e_meta: "A descrição e os links são longos demais",
      e_img: "O link da imagem deve começar com https:// ou ipfs://", e_dev: "Acima de 5 % do supply", e_bal: "Saldo de {s} insuficiente na carteira",
      e_reserved: "Este ticker imita um ativo conhecido", e_similar: "Parecida com uma moeda existente: {n}",
      t_buy: "Comprar", t_sell: "Vender", t_bal: "Saldo", t_you_get: "Você recebe", t_fee: "Taxa (1 %)", t_impact: "Impacto no preço", t_min: "Mínimo com slippage",
      t_slip: "Slippage", t_refund: "Devolução (a curva se completa)", t_completes: "Esta compra completa a curva e leva a moeda para a {d}.",
      t_fair: "Janela justa: máx. 1 % do supply por carteira durante {m}.", t_fair_cap: "Acima do limite de 1 % por carteira da janela justa",
      t_btn_buy: "Comprar ${s}", t_btn_sell: "Vender ${s}", t_no_tokens: "Você não tem ${s}", t_dex_note: "Graduada: agora se negocia na {d}.",
      t_approve: "Aprovar ${s}", t_router_off: "Negociar por aqui não está disponível nesta rede. Use a {d}:",
      cv_t: "Curva de bonding", cv_p: "{p} % · {r} de ~{g} {s} reunidos", cv_grad: "Graduada para a {d}", cv_grad_p: "Liquidez {n} {s} + 200M tokens · LP queimado para sempre",
      cr_t: "Criador", cr_fees: "Suas taxas de criador", cr_claim: "Resgatar", cr_vest: "Tokens do criador", cr_vest_p: "{v} de {a} liberados · tudo em {d}", cr_none: "O criador não comprou no lançamento.",
      tab_trades: "Operações", tab_shield: "Shield", tab_info: "Info", tr_recent: "Operações recentes", tr_none: "Nenhuma operação nos blocos recentes.",
      th_time: "Hora", th_type: "Tipo", th_acct: "Carteira", th_native: "{s}", th_tok: "Tokens", th_tx: "Tx",
      i_contract: "Contrato", i_creator: "Criador", i_created: "Criada", i_pair: "Pool", i_links: "Links", i_explorer: "Ver no explorador", i_chart: "DexScreener",
      sh_t: "Sectora Shield", sh_score: "Garantias do contrato e verificações ao vivo",
      sh1: "Supply fixo", sh1d: "1.000.000.000 tokens criados uma única vez. Não existe função de mint.",
      sh2: "Sem dono nem impostos", sh2d: "O token não tem dono, lista negra nem taxa de transferência.",
      sh3: "Liquidez bloqueada para sempre", sh3d: "Na graduação os LP vão para 0x…dEaD. Ninguém pode retirar o pool.",
      sh4: "Janela de lançamento justo", sh4d: "Máx. 1 % do supply por carteira nos primeiros 5 minutos.",
      sh5: "Compra do criador limitada e com vesting", sh5d: "O criador comprou {p} % · bloqueado 7 dias, liberado em 30 dias.",
      sh5n: "O criador não comprou no lançamento.", sh6: "Ninguém pode criar o pool antes", sh6d: "Até graduar, os tokens só se movem pela curva.",
      sh7: "Nome original", sh7d: "Nenhuma moeda parecida nesta rede.", sh7w: "Parecida com {n}: confira se é a que você procura.",
      sh8: "Ticker", sh8d: "Não imita um ativo conhecido.", sh8w: "Imita um ativo conhecido ({s}).",
      me_t: "Sua carteira", me_coins: "Moedas que você criou", me_hold: "Suas moedas", me_none: "Ainda não há nada.", me_fees: "Taxas de criador a resgatar",
      stats_t: "Sectora Launch em todas as redes", stats_fees: "Taxas da plataforma pendentes",
      tx_confirm: "Confirme na sua carteira", tx_sent: "Transação enviada", tx_wait: "Aguardando confirmação na {c}…", tx_ok: "Confirmada", tx_view: "Ver transação",
      tx_rejected: "Transação cancelada na carteira.", tx_failed: "A transação falhou: {m}",
      ok_launch: "Moeda lançada", ok_buy: "Você comprou {n} ${s}", ok_sell: "Você vendeu {n} ${s}", ok_claim: "Resgatado", ok_approve: "Aprovado",
      r_fair: "Acima do limite de 1 % por carteira da janela justa", r_grad: "Esta moeda já graduou", r_slip: "O preço mudou mais que seu slippage. Tente de novo.",
      r_fee: "Falta a taxa de lançamento", r_dev: "Sua compra passa de 5 % do supply", r_bal: "Saldo insuficiente",
      soon_on: "Ativo em {n} redes", why_multi_t: "Qualquer rede EVM", why_multi_p: "BNB Chain, Base, Ethereum, Arbitrum, Polygon, Optimism e Avalanche hoje. SectoraEVM com a mainnet, aprox. 22 de março de 2027.",
      block: "Bloco", usd: "≈ {u}", st_main: "Mainnet SectoraEVM", days: "dias", approx_d: "aprox. {d}", bal_h: "Saldo"
    }
  };
  // Home / create copy that changes when the coins are real and priced in SECT.
  var OVR = {
    "en": {
      "st4_p": "Liquidity moves to a COIN/SECT pool on Uniswap and the LP is burned at 0x…dEaD, so nobody can pull it.", "sc_dex": "Uniswap",
      "eyebrow2": "Sectora Launch · Ethereum · SECT",
      "hero_s": "Fair launches on Ethereum where every coin is priced in SECT: anti-sniper limits, liquidity locked forever on Uniswap and creator tokens with vesting. Pay with ETH or SECT.",
      "w4_p": "1 % per curve trade: 0.5 % to the creator and 0.5 % to Sectora, part of which is burned in SECT. Nothing hidden, nothing changeable.",
      "w5_t": "Automatic graduation",
      "w5_p": "When the curve sells out, the SECT raised and 200M tokens become a COIN/SECT pool on Uniswap in the same transaction, with the LP burned.",
      "w5_v": "Elsewhere: migrations that depend on a team server.",
      "w7_p": "Everything in SECT with its dollar value next to it, from live market data.",
      "w9_t": "Every coin drives SECT",
      "w9_p": "To buy any coin you buy SECT first, and at graduation the SECT is locked forever in the pool. Part of the platform income is burned.",
      "w9_v": "Elsewhere: fees that never touch the project token.",
      "h1_p": "Name, ticker, image and links. Pay with ETH or SECT from your own wallet.",
      "h3_p": "When the curve sells out, the SECT raised and 200M tokens become a COIN/SECT pool on Uniswap and the LP is burned forever.",
      "h4_p": "The creator earns 0.5 % of every curve trade in SECT and can claim it at any time.",
      "footer_l": "Sectora Launch · real coins on Ethereum, priced in SECT. SectoraEVM approx. 22 March 2027. Not financial advice: new coins are high risk.",
      "end_s": "Sectora Launch arrives on SectoraEVM approximately on 22 March 2027. Today it already runs on Ethereum with real coins priced in SECT."
    },
    "es": {
      "st4_p": "La liquidez pasa a un pool MONEDA/SECT en Uniswap y el LP se quema en 0x…dEaD: nadie puede retirarla.", "sc_dex": "Uniswap",
      "eyebrow2": "Sectora Launch · Ethereum · SECT",
      "hero_s": "Lanzamientos justos en Ethereum donde cada moneda cotiza en SECT: límites anti-snipers, liquidez bloqueada para siempre en Uniswap y tokens del creador con vesting. Paga con ETH o con SECT.",
      "w4_p": "1 % por operación en la curva: 0,5 % para el creador y 0,5 % para Sectora, de la que una parte se quema en SECT. Nada oculto y nada que se pueda cambiar.",
      "w5_t": "Graduación automática",
      "w5_p": "Cuando la curva se completa, el SECT reunido y 200M de tokens forman un pool MONEDA/SECT en Uniswap en la misma transacción, con el LP quemado.",
      "w5_v": "En otras: migraciones que dependen de un servidor del equipo.",
      "w7_p": "Todo en SECT con su valor en dólares al lado, con datos reales del mercado.",
      "w9_t": "Cada moneda impulsa SECT",
      "w9_p": "Para comprar cualquier moneda primero se compra SECT, y al graduarse el SECT queda bloqueado para siempre en el pool. Parte de los ingresos de la plataforma se quema.",
      "w9_v": "En otras: comisiones que nunca tocan el token del proyecto.",
      "h1_p": "Nombre, ticker, imagen y enlaces. Paga con ETH o con SECT desde tu propia wallet.",
      "h3_p": "Cuando la curva se completa, el SECT reunido y 200M de tokens forman un pool MONEDA/SECT en Uniswap y el LP se quema para siempre.",
      "h4_p": "El creador gana el 0,5 % de cada operación en la curva, en SECT, y lo cobra cuando quiera.",
      "footer_l": "Sectora Launch · monedas reales en Ethereum cotizadas en SECT. SectoraEVM aprox. el 22 de marzo de 2027. No es asesoramiento financiero: las monedas nuevas son de alto riesgo.",
      "end_s": "Sectora Launch llegará a SectoraEVM aproximadamente el 22 de marzo de 2027. Hoy ya funciona en Ethereum con monedas reales cotizadas en SECT."
    },
    "pt": {
      "st4_p": "A liquidez vai para um pool MOEDA/SECT na Uniswap e o LP é queimado em 0x…dEaD: ninguém pode retirá-la.", "sc_dex": "Uniswap",
      "eyebrow2": "Sectora Launch · Ethereum · SECT",
      "hero_s": "Lançamentos justos na Ethereum onde cada moeda é cotada em SECT: limites anti-snipers, liquidez bloqueada para sempre na Uniswap e tokens do criador com vesting. Pague com ETH ou SECT.",
      "w4_p": "1 % por operação na curva: 0,5 % para o criador e 0,5 % para a Sectora, parte dela queimada em SECT. Nada oculto, nada alterável.",
      "w5_t": "Graduação automática",
      "w5_p": "Quando a curva se completa, o SECT reunido e 200M de tokens viram um pool MOEDA/SECT na Uniswap na mesma transação, com o LP queimado.",
      "w5_v": "Em outras: migrações que dependem de um servidor da equipe.",
      "w7_p": "Tudo em SECT com o valor em dólares ao lado, com dados reais do mercado.",
      "w9_t": "Cada moeda impulsiona o SECT",
      "w9_p": "Para comprar qualquer moeda primeiro se compra SECT, e na graduação o SECT fica bloqueado para sempre no pool. Parte da receita da plataforma é queimada.",
      "w9_v": "Em outras: taxas que nunca tocam o token do projeto.",
      "h1_p": "Nome, ticker, imagem e links. Pague com ETH ou SECT da sua própria carteira.",
      "h3_p": "Quando a curva se completa, o SECT reunido e 200M de tokens viram um pool MOEDA/SECT na Uniswap e o LP é queimado para sempre.",
      "h4_p": "O criador ganha 0,5 % de cada operação na curva, em SECT, e resgata quando quiser.",
      "footer_l": "Sectora Launch · moedas reais na Ethereum cotadas em SECT. SectoraEVM aprox. 22 de março de 2027. Não é aconselhamento financeiro: moedas novas são de alto risco.",
      "end_s": "O Sectora Launch chega à SectoraEVM aproximadamente em 22 de março de 2027. Hoje já funciona na Ethereum com moedas reais cotadas em SECT."
    }
  };
  function lt(k, v) {
    var L = X.lang(), s = (LS[L] && LS[L][k] != null) ? LS[L][k] : (LS.en[k] != null ? LS.en[k] : k);
    if (v) for (var x in v) s = s.split("{" + x + "}").join(v[x]);
    return s;
  }
  function override(k) { var L = X.lang(); return (OVR[L] && OVR[L][k] != null) ? OVR[L][k] : (OVR.en[k] != null ? OVR.en[k] : null); }

  /* ------------------------------------------------------------------ formatting */
  function fx(b) { try { return Number(E.formatEther(b || 0n)); } catch (e) { return 0; } }
  function amt(n, s) { return (n >= 1e4 ? X.compact(n) : X.nf(n, n >= 1 ? 4 : 6)) + (s ? " " + s : ""); }
  var NUSD = {};
  function usdOf(k, n) {
    var p = NUSD[k] && NUSD[k].p;
    if (!(p > 0) || !(n >= 0)) return "";
    var v = n * p;
    return v >= 1 ? "$" + X.nf(v, v >= 1000 ? 0 : 2) : (v > 0 ? "$" + X.fmtPrice(v) : "$0");
  }
  function usdLine(k, n) { var u = usdOf(k, n); return u ? '<small class="faint">' + X.esc(lt("usd", { u: u })) + "</small>" : ""; }
  function chainDot(k, size) {
    var ch = CHAINS[k] || { col: "#1569ff" };
    return '<i class="sl-cdot" style="--c:' + ch.col + (size ? ";--s:" + size + "px" : "") + '"></i>';
  }
  function exUrl(k, kind, v) { var ch = CHAINS[k]; return ch && ch.exp ? ch.exp + "/" + kind + "/" + v : ""; }
  function txLink(k, h) { var u = exUrl(k, "tx", h); return u ? '<a href="' + X.esc(u) + '" target="_blank" rel="noopener">' + X.esc(X.short(h)) + "</a>" : X.esc(X.short(h)); }
  function addrLink(k, a, label) { var u = exUrl(k, "address", a); return u ? '<a href="' + X.esc(u) + '" target="_blank" rel="noopener">' + X.esc(label || X.short(a)) + "</a>" : X.esc(label || X.short(a)); }
  function safeImg(u) {
    u = String(u || "").trim();
    if (!u) return "";
    var m = /^ipfs:\/\/(ipfs\/)?([A-Za-z0-9]{20,}(\/[^\s"'<>]*)?)$/.exec(u);
    if (m) return "https://ipfs.io/ipfs/" + m[2];
    try { var x = new URL(u); return x.protocol === "https:" ? x.href : ""; } catch (e) { return ""; }
  }
  function safeLink(u) {
    u = String(u || "").trim(); if (!u) return "";
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    try { var x = new URL(u); return x.protocol === "https:" ? x.href : ""; } catch (e) { return ""; }
  }
  function parseMeta(s) {
    var m = {};
    try { var j = JSON.parse(String(s || "{}")); if (j && typeof j === "object") m = j; } catch (e) {}
    function str(v, n) { return typeof v === "string" ? v.slice(0, n) : ""; }
    return { d: str(m.d, 600), i: safeImg(str(m.i, 400)), w: safeLink(str(m.w, 300)), x: safeLink(str(m.x, 300)), t: safeLink(str(m.t, 300)) };
  }
  function logoOf(c) { return X.coinLogo({ img: "", sym: c.sym }); }
  function logoTag(c, cls) {
    var fb = logoOf(c);
    if (!c.meta.i) return '<img class="' + cls + '" src="' + fb + '" alt="">';
    return '<img class="' + cls + '" src="' + X.esc(c.meta.i) + '" alt="" loading="lazy" referrerpolicy="no-referrer" data-fb="' + X.esc(fb) + '">';
  }

  /* ------------------------------------------------------------------ RPC */
  var RPI = {}, RP = {};
  function rp(k) {
    if (!RP[k]) {
      var ch = CHAINS[k], i = RPI[k] || 0;
      RP[k] = new E.JsonRpcProvider(ch.rpc[i % ch.rpc.length], ch.id, { staticNetwork: E.Network.from(ch.id), batchMaxCount: 1, cacheTimeout: -1 });
    }
    return RP[k];
  }
  function rotate(k) { RPI[k] = (RPI[k] || 0) + 1; if (RP[k]) { try { RP[k].destroy(); } catch (e) {} } RP[k] = null; }
  function withRpc(k, fn) {
    return fn(rp(k)).catch(function (err) {
      var code = err && err.code;
      if (CHAINS[k].rpc.length > 1 && (code === "SERVER_ERROR" || code === "TIMEOUT" || code === "NETWORK_ERROR" || code === "UNKNOWN_ERROR" || /fetch|network|cors|429|rate/i.test(String(err && err.message)))) {
        rotate(k);
        return fn(rp(k));
      }
      throw err;
    });
  }
  function fac(k, runner) { return new E.Contract(factoryOf(k), ABI.factory, runner || rp(k)); }
  function tokC(addr, runner, k) { return new E.Contract(addr, ABI.token, runner || rp(k)); }
  var ROUTER_ABI = [
    "function factory() view returns (address)", "function WETH() view returns (address)",
    "function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)",
    "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] path, address to, uint deadline) payable",
    "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)",
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)"
  ];
  var ERC20_ABI = ["function balanceOf(address) view returns (uint256)", "function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"];
  var QUOTER_ABI = ["function quoteExactInput(bytes path, uint256 amountIn) returns (uint256 amountOut, uint160[], uint32[], uint256)"];
  function qC(k, runner) { return new E.Contract(CHAINS[k].qaddr, ERC20_ABI, runner || rp(k)); }
  function pathBytes(k) { var pth = CHAINS[k].path; return E.solidityPacked(["address", "uint24", "address", "uint24", "address"], pth); }
  // SECT received for `wei` of ETH along the fixed route (Uniswap QuoterV2, read-only call)
  function quoteEth(k, wei) { return withRpc(k, function (p) { return new E.Contract(CHAINS[k].quoter, QUOTER_ABI, p).quoteExactInput.staticCall(pathBytes(k), wei); }).then(function (r) { return r[0]; }); }
  var RATE = {};
  function loadRate(k) {
    if (RATE[k] && Date.now() - RATE[k].at < 60000) return Promise.resolve(RATE[k].r);
    return quoteEth(k, E.parseEther("0.01")).then(function (out) { RATE[k] = { r: fx(out) / 0.01, at: Date.now() }; return RATE[k].r; });
  }
  var PAIR_ABI = ["function getReserves() view returns (uint112, uint112, uint32)", "function token0() view returns (address)"];

  /* ------------------------------------------------------------------ data */
  var D = {};   // per network: { cfg, coins, count, at, loading, err, block, fees }
  var TD = {};  // per coin: { c, trades, from, pool, at, loading, err }
  var ME = {};  // per network: { native, at, fees, bals:{} }
  function chainState(k) { return D[k] || (D[k] = { coins: [], count: 0, at: 0, loading: false, err: "", cfg: null, block: 0 }); }
  function mapCoin(v) {
    var created = Number(v.createdAt) * 1000;
    return {
      addr: E.getAddress(v.token), name: String(v.name), sym: String(v.symbol), meta: parseMeta(v.meta),
      creator: E.getAddress(v.creator), created: created, createdBlock: Number(v.createdBlock), grad: !!v.graduated,
      pair: v.pair, vN: v.vQuote, vT: v.vToken, real: v.realQuote, sold: v.sold, dev: v.devAmount, devClaimed: v.devClaimed
    };
  }
  // the chain's own clock (block timestamps), so time rules match the contract exactly
  function chainNow(k) { var sk = D[k] && D[k].skew; return Date.now() + (Math.abs(sk) > 2000 ? sk : 0); }
  function priceOf(c) { return fx(c.vN) / fx(c.vT); }
  function soldOf(c) { return fx(c.sold); }
  function progressOf(c) { return c.grad ? 1 : Math.min(1, soldOf(c) / CURVE); }
  function gradTarget(k) { var cf = chainState(k).cfg; if (!cf) return 0; var v0 = fx(cf.vN); return v0 * VT0 / (VT0 - CURVE) - v0; }

  function loadCfg(k) {
    var st = chainState(k);
    if (st.cfg) return Promise.resolve(st.cfg);
    return withRpc(k, function (p) {
      var f = fac(k, p);
      return Promise.all([f.virtualQuote(), f.launchFee(), f.burnShareBps()]);
    }).then(function (r) { st.cfg = { vN: r[0], fee: r[1], burn: Number(r[2]) }; return st.cfg; });
  }
  function loadChain(k, force) {
    var st = chainState(k);
    if (!deployed(k)) return Promise.resolve(st);
    if (st.loading) return st.loading;
    if (!force && st.at && Date.now() - st.at < 12000) return Promise.resolve(st);
    st.loading = loadCfg(k).then(function () {
      return withRpc(k, function (p) { var f = fac(k, p); return Promise.all([f.coinsCount(), f.latestCoins(0, 120), p.getBlock("latest"), f.protocolFees(), f.totalBurned()]); });
    }).then(function (r) {
      st.count = Number(r[0]); st.coins = r[1].map(mapCoin); st.block = r[2].number; st.skew = r[2].timestamp * 1000 - Date.now(); st.fees = r[3]; st.burned = r[4]; st.at = Date.now(); st.err = ""; st.loading = false;
      return st;
    }, function (err) { st.loading = false; st.err = String((err && (err.shortMessage || err.message)) || err); throw err; });
    loadUsd(k);
    return st.loading;
  }
  function bestUsd(pairs, addr, chain) {
    var best = null, a = String(addr).toLowerCase();
    (pairs || []).forEach(function (p) {
      if (!p || !p.baseToken || String(p.baseToken.address).toLowerCase() !== a || p.chainId !== chain) return;
      var liq = (p.liquidity && p.liquidity.usd) || 0, pu = parseFloat(p.priceUsd);
      if (pu > 0 && (!best || liq > best.l)) best = { l: liq, p: pu };
    });
    return best ? best.p : 0;
  }
  function loadUsd(k) {
    var ch = CHAINS[k];
    if (!ch.qaddr || (NUSD[k] && Date.now() - NUSD[k].at < 120000)) return Promise.resolve();
    NUSD[k] = NUSD[k] || { p: 0, eth: 0, at: 0 }; NUSD[k].at = Date.now();
    var get = function (a) { return fetch("https://api.dexscreener.com/latest/dex/tokens/" + a, { cache: "no-store" }).then(function (r) { return r.json(); }); };
    return Promise.all([get(ch.qaddr), get(ch.wnative)]).then(function (r) {
      var q = bestUsd(r[0].pairs, ch.qaddr, "ethereum"), e = bestUsd(r[1].pairs, ch.wnative, "ethereum");
      if (q > 0) NUSD[k].p = q;
      if (e > 0) NUSD[k].eth = e;
      X.refreshLive && X.refreshLive("usd");
    }).catch(function () {});
  }
  function ethUsd(k, n) { var p = NUSD[k] && NUSD[k].eth; if (!(p > 0) || !(n >= 0)) return ""; var v = n * p; return "$" + X.nf(v, v >= 1000 ? 0 : 2); }
  function loadToken(k, addr, force) {
    var key = k + ":" + addr, td = TD[key] || (TD[key] = { c: null, trades: [], at: 0, loading: null, err: "", from: 0, pool: null, missing: false });
    if (td.loading) return td.loading;
    if (!force && td.at && Date.now() - td.at < 8000) return Promise.resolve(td);
    td.loading = loadCfg(k).then(function () {
      return withRpc(k, function (p) { return Promise.all([fac(k, p).coinView(addr), p.getBlock("latest")]); });
    }).then(function (r) {
      var v = r[0], latest = r[1].number;
      chainState(k).skew = r[1].timestamp * 1000 - Date.now();
      if (v.creator === E.ZeroAddress) { td.missing = true; td.loading = null; td.at = Date.now(); return td; }
      td.c = mapCoin(v);
      var jobs = [loadTrades(k, td, latest)];
      if (td.c.grad && td.c.pair && td.c.pair !== E.ZeroAddress) jobs.push(loadPool(k, td));
      if (W.addr) jobs.push(loadMine(k, td));
      return Promise.all(jobs).then(function () { td.at = Date.now(); td.err = ""; td.loading = null; return td; });
    }).catch(function (err) { td.loading = null; td.err = String((err && (err.shortMessage || err.message)) || err); throw err; });
    return td.loading;
  }
  function loadTrades(k, td, latest) {
    var ch = CHAINS[k], chunk = ch.chunk || 5000, maxChunks = 10, c = td.c;
    var start = td.trades.length ? Math.max(td.lastBlock + 1, c.createdBlock) : Math.max(c.createdBlock, latest - chunk * maxChunks + 1);
    if (start > latest) return Promise.resolve();
    var ranges = [];
    for (var to = latest; to >= start; to -= chunk) ranges.push([Math.max(start, to - chunk + 1), to]);
    return Promise.all(ranges.map(function (rg) {
      return withRpc(k, function (p) { var fc = fac(k, p); return fc.queryFilter(fc.filters.Trade(c.addr), rg[0], rg[1]); }).catch(function () { return []; });
    })).then(function (lists) {
      var fresh = [];
      lists.forEach(function (l) { l.forEach(function (ev) {
        var a = ev.args;
        fresh.push({ buy: a.isBuy, who: a.trader, n: fx(a.quoteAmount), tok: fx(a.tokenAmount), p: fx(a.vQuote) / fx(a.vToken), t: Number(a.timestamp) * 1000, h: ev.transactionHash, b: ev.blockNumber, i: ev.index });
      }); });
      var seen = {}; td.trades.forEach(function (x) { seen[x.h + ":" + x.i] = 1; });
      fresh.forEach(function (x) { if (!seen[x.h + ":" + x.i]) td.trades.push(x); });
      td.trades.sort(function (a, b) { return b.b - a.b || b.i - a.i; });
      if (!td.from) td.from = start;
      td.lastBlock = latest;
    });
  }
  function loadPool(k, td) {
    return withRpc(k, function (p) {
      var pc = new E.Contract(td.c.pair, PAIR_ABI, p);
      return Promise.all([pc.getReserves(), pc.token0()]);
    }).then(function (r) {
      var t0 = E.getAddress(r[1]) === td.c.addr, rt = t0 ? r[0][0] : r[0][1], rn = t0 ? r[0][1] : r[0][0];
      td.pool = { n: fx(rn), t: fx(rt) };
    }).catch(function () {});
  }
  function loadMine(k, td) {
    if (!W.addr) return Promise.resolve();
    var me = W.addr;
    return withRpc(k, function (p) {
      var f = fac(k, p), q = qC(k, p), ch = CHAINS[k];
      var jobs = [p.getBalance(me), tokC(td.c.addr, p).balanceOf(me), f.fairBought(td.c.addr, me), f.creatorFees(td.c.creator), f.claimableDev(td.c.addr),
        q.balanceOf(me), q.allowance(me, factoryOf(k)), q.allowance(me, ch.router), tokC(td.c.addr, p).allowance(me, ch.router)];
      return Promise.all(jobs);
    }).then(function (r) {
      td.mine = { addr: me, native: r[0], bal: r[1], fair: r[2], cfees: r[3], claimable: r[4], sect: r[5], qAllow: r[6], qAllowR: r[7], tAllowR: r[8] };
      meState(k).native = r[0]; meState(k).sect = r[5];
    }).catch(function () {});
  }
  function meState(k) { return ME[k] || (ME[k] = { native: null, sect: null, qAllow: 0n, at: 0, fees: 0n, bals: {} }); }
  function loadMe(k) {
    var ms = meState(k);
    if (!W.addr || !deployed(k)) return Promise.resolve(ms);
    var me = W.addr;
    return loadChain(k).then(function (st) {
      var coins = st.coins.slice(0, 60);
      return withRpc(k, function (p) {
        var f = fac(k, p);
        var q = qC(k, p);
        return Promise.all([p.getBalance(me), f.creatorFees(me), q.balanceOf(me), q.allowance(me, factoryOf(k))].concat(coins.map(function (c) { return tokC(c.addr, p).balanceOf(me).catch(function () { return 0n; }); })));
      }).then(function (r) {
        ms.native = r[0]; ms.fees = r[1]; ms.sect = r[2]; ms.qAllow = r[3]; ms.bals = {};
        coins.forEach(function (c, i) { ms.bals[c.addr] = r[4 + i]; });
        ms.at = Date.now();
        return ms;
      });
    });
  }

  /* ------------------------------------------------------------------ wallet */
  var W = { list: [], p: null, info: null, addr: "", chainId: 0 };
  var WKEY = "sectoraLaunch.wallet";
  window.addEventListener("eip6963:announceProvider", function (e) {
    var d = e.detail;
    if (!d || !d.provider || !d.info || !d.info.uuid) return;
    if (W.list.some(function (x) { return x.info.uuid === d.info.uuid; })) return;
    W.list.push(d);
  });
  try { window.dispatchEvent(new Event("eip6963:requestProvider")); } catch (e) {}
  function walletIcon(info) { var i = info && info.icon; return typeof i === "string" && /^data:image\//.test(i) ? i : ""; }
  function bindWallet(prov, info, addr) {
    W.p = prov; W.info = info || { name: "Wallet", rdns: "injected" }; W.addr = E.getAddress(addr);
    try { localStorage.setItem(WKEY, W.info.rdns || "injected"); } catch (e) {}
    prov.request({ method: "eth_chainId" }).then(function (id) { W.chainId = parseInt(id, 16); X.render(); }, function () {});
    if (!prov.__slBound && prov.on) {
      prov.__slBound = true;
      prov.on("accountsChanged", function (a) {
        if (W.p !== prov) return;
        if (a && a.length) { W.addr = E.getAddress(a[0]); } else { W.addr = ""; W.p = null; }
        ME = {}; Object.keys(TD).forEach(function (key) { TD[key].mine = null; TD[key].at = 0; });
        X.render();
      });
      prov.on("chainChanged", function (id) { if (W.p === prov) { W.chainId = parseInt(id, 16); X.render(); } });
    }
    ME = {}; Object.keys(TD).forEach(function (key) { TD[key].mine = null; TD[key].at = 0; });
    X.render();
    refreshBalance();
  }
  function refreshBalance() {
    var n = X.net(); if (!W.addr || !isLive(n)) return;
    var me = W.addr;
    withRpc(n, function (p) { return p.getBalance(me); }).then(function (b) { if (W.addr !== me) return; meState(n).native = b; X.shell(); }, function () {});
  }
  function connectWith(prov, info) {
    return prov.request({ method: "eth_requestAccounts" }).then(function (a) {
      if (a && a.length) { bindWallet(prov, info, a[0]); X.toast(X.esc(X.short(E.getAddress(a[0]))), "ok"); }
    }, function (err) { if (!isReject(err)) X.toast(X.esc(errMsg(err)), "bad"); });
  }
  function connect() {
    if (W.list.length > 1) return walletChooser();
    if (W.list.length === 1) return connectWith(W.list[0].provider, W.list[0].info);
    if (window.ethereum) return connectWith(window.ethereum, { name: "Wallet", rdns: "injected" });
    walletChooser();
  }
  function disconnect() { W.p = null; W.addr = ""; W.info = null; ME = {}; try { localStorage.removeItem(WKEY); } catch (e) {} X.render(); }
  function autoReconnect() {
    var saved = null; try { saved = localStorage.getItem(WKEY); } catch (e) {}
    if (!saved) return;
    setTimeout(function () {
      var hit = W.list.filter(function (x) { return x.info.rdns === saved; })[0];
      var prov = hit ? hit.provider : (window.ethereum || null), info = hit ? hit.info : { name: "Wallet", rdns: "injected" };
      if (!prov) return;
      prov.request({ method: "eth_accounts" }).then(function (a) { if (a && a.length) bindWallet(prov, info, a[0]); }, function () {});
    }, 350);
  }
  function walletChooser() {
    var here = location.host + location.pathname, full = location.href;
    var bg = document.createElement("div");
    bg.className = "sl-modal-bg";
    var inner;
    if (W.list.length || window.ethereum) {
      var items = W.list.length ? W.list : [{ provider: window.ethereum, info: { name: "Browser wallet", rdns: "injected", uuid: "injected" } }];
      inner = "<h3>" + X.esc(lt("w_choose")) + '</h3><div class="sl-wlist">' + items.map(function (x, i) {
        var ic = walletIcon(x.info);
        return '<button class="sl-wbtn" data-i="' + i + '">' + (ic ? '<img src="' + X.esc(ic) + '" alt="">' : '<span class="sl-wph">' + X.ico("user") + "</span>") + "<span>" + X.esc(x.info.name || "Wallet") + "</span></button>";
      }).join("") + "</div>";
      bg.innerHTML = '<div class="sl-modal sl-modal-w" role="dialog">' + inner + '<button class="sl-btn sl-btn-sm sl-modal-x" data-x="1">' + X.esc(X.t("close")) + "</button></div>";
      bg.addEventListener("click", function (e) {
        var b = e.target.closest(".sl-wbtn");
        if (b) { var it = items[+b.getAttribute("data-i")]; bg.remove(); connectWith(it.provider, it.info); return; }
        if (e.target === bg || e.target.closest("[data-x]")) bg.remove();
      });
    } else {
      var enc = encodeURIComponent(full);
      var links = [
        ["MetaMask", "https://metamask.app.link/dapp/" + here + location.hash],
        ["Trust Wallet", "https://link.trustwallet.com/open_url?coin_id=60&url=" + enc],
        ["OKX Wallet", "okx://wallet/dapp/url?dappUrl=" + enc],
        ["Coinbase Wallet", "https://go.cb-w.com/dapp?cb_url=" + enc]
      ];
      inner = "<h3>" + X.esc(lt("w_none_t")) + "</h3><p>" + X.esc(lt("w_none_p")) + '</p><div class="sl-wlist">' +
        links.map(function (l) { return '<a class="sl-wbtn" href="' + X.esc(l[1]) + '" rel="noopener"><span class="sl-wph">' + X.ico("arrow") + "</span><span>" + X.esc(l[0]) + "</span></a>"; }).join("") + "</div>";
      bg.innerHTML = '<div class="sl-modal sl-modal-w" role="dialog">' + inner + '<button class="sl-btn sl-btn-sm sl-modal-x" data-x="1">' + X.esc(X.t("close")) + "</button></div>";
      bg.addEventListener("click", function (e) { if (e.target === bg || e.target.closest("[data-x]")) bg.remove(); });
    }
    document.body.appendChild(bg);
  }
  function ensureChain(k) {
    var ch = CHAINS[k], hexId = "0x" + ch.id.toString(16);
    return W.p.request({ method: "eth_chainId" }).then(function (id) {
      if (parseInt(id, 16) === ch.id) return;
      return W.p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] }).catch(function (err) {
        var code = err && (err.code || (err.data && err.data.originalError && err.data.originalError.code));
        if (code === 4902 && ch.exp) {
          return W.p.request({ method: "wallet_addEthereumChain", params: [{ chainId: hexId, chainName: ch.name, nativeCurrency: { name: ch.sym, symbol: ch.sym, decimals: 18 }, rpcUrls: [ch.rpc[0]], blockExplorerUrls: [ch.exp] }] });
        }
        throw err;
      });
    }).then(function () { W.chainId = ch.id; });
  }
  function signer() { return new E.BrowserProvider(W.p, "any").getSigner(); }

  /* ------------------------------------------------------------------ transactions */
  function isReject(err) {
    var c = err && (err.code || (err.info && err.info.error && err.info.error.code));
    return c === 4001 || c === "ACTION_REJECTED" || /user (rejected|denied)|rejected the request/i.test(String(err && (err.shortMessage || err.message)));
  }
  function errMsg(err) {
    var s = String((err && (err.reason || err.shortMessage || (err.info && err.info.error && err.info.error.message) || err.message)) || err);
    if (/fair window/i.test(s)) return lt("r_fair");
    if (/graduated/i.test(s)) return lt("r_grad");
    if (/slippage|INSUFFICIENT_OUTPUT/i.test(s)) return lt("r_slip");
    if (/launch fee/i.test(s)) return lt("r_fee");
    if (/above 5%/i.test(s)) return lt("r_dev");
    if (/insufficient funds|SL: balance/i.test(s)) return lt("r_bal");
    return s.replace(/^execution reverted:?\s*/i, "").replace(/^SL:\s*/, "").slice(0, 160);
  }
  function txFlow(k, send, done) {
    var bg = document.createElement("div");
    bg.className = "sl-modal-bg";
    bg.innerHTML = '<div class="sl-modal" role="dialog" aria-live="polite"><div class="sl-blocks"><i></i><i></i><i></i><i></i></div><h3>' + X.esc(lt("tx_confirm")) + '</h3><p class="mono">' + X.esc(CHAINS[k].name) + "</p></div>";
    document.body.appendChild(bg);
    var m = bg.querySelector(".sl-modal");
    function close(ms) { setTimeout(function () { bg.style.transition = "opacity .3s"; bg.style.opacity = "0"; setTimeout(function () { bg.remove(); }, 280); }, ms || 0); }
    ensureChain(k).then(function () { return signer(); }).then(function (s) { return send(s); }).then(function (tx) {
      m.innerHTML = '<div class="sl-blocks"><i></i><i></i><i></i><i></i></div><h3>' + X.esc(lt("tx_sent")) + "</h3><p>" + X.esc(lt("tx_wait", { c: CHAINS[k].name })) + '</p><p class="mono">' + txLink(k, tx.hash) + "</p>";
      return tx.wait(1).then(function (rc) {
        if (!rc || rc.status !== 1) throw new Error("reverted");
        var msg = done ? done(rc) : "";
        m.innerHTML = '<div class="sl-okmark">' + X.ico("check") + "</div><h3>" + X.esc(lt("tx_ok")) + "</h3><p>" + (msg && msg.html ? msg.html : "") + '</p><p class="mono">' + txLink(k, tx.hash) + "</p>";
        close(1500);
        setTimeout(function () { if (msg && msg.go) location.hash = msg.go; else X.render(); refreshBalance(); }, 1700);
      });
    }).catch(function (err) {
      close(0);
      if (isReject(err)) X.toast(X.esc(lt("tx_rejected")));
      else X.toast(X.esc(lt("tx_failed", { m: errMsg(err) })), "bad");
    });
  }

  /* ------------------------------------------------------------------ header pieces */
  function netChip(net) {
    var label = isLive(net) ? CHAINS[net].name : "SectoraEVM";
    return '<div class="sl-netwrap"><button class="sl-net" data-a="netmenu" aria-haspopup="true" aria-label="' + X.esc(lt("net")) + '">' + (isLive(net) ? chainDot(net) : '<i class="sl-cdot is-sect"></i>') +
      '<span class="nm">' + X.esc(label) + '</span><span class="sh">' + X.esc(isLive(net) ? CHAINS[net].short : "SEVM") + '</span><svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg></button></div>';
  }
  function netMenu(net) {
    var html = '<div class="sl-netmenu" id="slNetMenu" role="menu"><span class="lbl">' + X.esc(lt("net_t")) + "</span>";
    ORDER.forEach(function (k) {
      var on = deployed(k);
      html += '<button role="menuitem" data-a="setnet" data-v="' + k + '"' + (k === net ? ' class="on"' : "") + (on ? "" : " disabled") + ">" + chainDot(k) + "<span>" + X.esc(CHAINS[k].name) + '</span><em class="' + (on ? "ok" : "") + '">' + X.esc(on ? lt("net_live") : lt("net_soon")) + "</em></button>";
    });
    html += '<button role="menuitem" data-a="setnet" data-v="sectora"' + (net === "sectora" ? ' class="on"' : "") + '><i class="sl-cdot is-sect"></i><span>' + X.esc(lt("sectora_demo")) + '</span><em class="soon">' + X.esc(lt("sectora_menu", { d: MAINNET_TXT })) + "</em></button></div>";
    return html;
  }
  function toggleNetMenu(net, anchor) {
    var ex = document.getElementById("slNetMenu");
    if (ex) { ex.remove(); return; }
    var wrap = anchor.closest(".sl-netwrap");
    wrap.insertAdjacentHTML("beforeend", netMenu(net));
    setTimeout(function () {
      document.addEventListener("click", function off(e) {
        if (e.target.closest(".sl-netwrap")) return;
        var m = document.getElementById("slNetMenu"); if (m) m.remove();
        document.removeEventListener("click", off, true);
      }, true);
    }, 0);
  }
  function acctBtn(net) {
    if (!W.addr) return '<button class="sl-acct" data-a="wconnect">' + X.ico("wallet").replace("<svg", '<svg width="14" height="14"') + '<span class="l">' + X.esc(lt("w_connect")) + '</span><span class="s">' + X.esc(lt("w_addr")) + "</span></button>";
    var ch = CHAINS[net], wrong = isLive(net) && W.chainId && W.chainId !== ch.id;
    if (wrong) return '<button class="sl-acct is-warn" data-a="wswitch">' + X.ico("alert").replace("<svg", '<svg width="14" height="14"') + '<span class="l">' + X.esc(lt("w_wrong", { n: ch.name })) + '</span><span class="s">' + X.esc(ch.short) + "</span></button>";
    var ms = meState(net), bal = ms.native != null ? amt(fx(ms.native), ch.sym) : X.short(W.addr);
    return '<a class="sl-acct is-on" href="#/me"><span class="dot"></span><span class="num">' + X.esc(ms.native != null ? bal : X.short(W.addr)) + "</span></a>";
  }
  function banner(net) {
    var n = isLive(net) ? CHAINS[net].name : "SectoraEVM";
    return '<span class="sl-dot" style="color:var(--live)"></span><span>' + X.esc(deployed(net) ? lt("banner_live", { n: n }) : lt("banner_off", { n: n })) + "</span>";
  }

  /* ------------------------------------------------------------------ home */
  var ui = { tab: "trend", q: "", side: "buy", ctab: "trades", slip: 3, pay: "eth", amt: "" };
  function coinRow(k, c, i, extra) {
    var pr = progressOf(c), p = priceOf(c), mc = p * 1e9, ch = CHAINS[k], href = "#/t/" + k + "/" + c.addr;
    return '<tr data-go="' + href + '"><td class="rk">' + (i + 1) + '</td><td><div class="sl-coin">' + logoTag(c, "sl-logo") + '<div><b><a href="' + href + '">' + X.esc(c.name) + "</a></b><span>$" + X.esc(c.sym) + "</span></div></div></td>" +
      (extra != null ? '<td class="r num">' + extra + "</td>" : "") +
      '<td class="r num sl-hide-sm">' + X.fmtPrice(p) + ' <span class="faint">' + X.esc(ch.qs) + "</span></td>" +
      '<td class="r num">' + X.esc(amt(mc, ch.qs)) + '<span class="usd">' + (X.esc(usdOf(k, mc)) || "&nbsp;") + "</span></td>" +
      '<td><div class="sl-pcell"><div class="sl-prog' + (c.grad ? " is-done" : "") + '"><i style="width:' + (pr * 100).toFixed(1) + '%"></i></div><b>' + (c.grad ? X.esc(ch.dex) : X.nf(pr * 100, 1) + " %") + "</b></div></td>" +
      '<td class="r num sl-hide-sm dim">' + X.esc(X.ago(c.created)) + "</td></tr>";
  }
  function coinTable(k, list, extraHead, extraFn) {
    return '<div class="sl-table-wrap"><table class="sl-table"><thead><tr><th class="rk">#</th><th>' + X.esc(X.t("th_coin")) + "</th>" + (extraHead ? '<th class="r">' + X.esc(extraHead) + "</th>" : "") +
      '<th class="r sl-hide-sm">' + X.esc(lt("price")) + '</th><th class="r">' + X.esc(lt("mc")) + "</th><th>" + X.esc(lt("curve")) + '</th><th class="r sl-hide-sm">' + X.esc(X.t("created")) + "</th></tr></thead><tbody>" +
      list.map(function (c, i) { return coinRow(k, c, i, extraFn ? extraFn(c) : null); }).join("") + "</tbody></table></div>";
  }
  function filtered(k) {
    var st = chainState(k), q = ui.q.trim().toLowerCase(), cs = st.coins.slice();
    if (q) cs = cs.filter(function (c) { return (c.name + " " + c.sym + " " + c.addr).toLowerCase().indexOf(q) >= 0; });
    if (ui.tab === "new") cs.sort(function (a, b) { return b.created - a.created; });
    else if (ui.tab === "soon") cs = cs.filter(function (c) { return !c.grad; }).sort(function (a, b) { return progressOf(b) - progressOf(a); });
    else if (ui.tab === "grad") cs = cs.filter(function (c) { return c.grad; });
    else cs.sort(function (a, b) { return fx(b.real) - fx(a.real) || b.created - a.created; });
    return cs;
  }
  function gridHtml(k) {
    var st = chainState(k), ch = CHAINS[k];
    if (!deployed(k)) return offHtml(k);
    if (!st.at) return '<div class="sl-empty sl-loading">' + X.ico("clock") + "<p>" + X.esc(st.err ? lt("ex_err", { c: ch.name }) : lt("ex_loading", { c: ch.name })) + "</p></div>";
    if (!st.coins.length) return '<div class="sl-empty">' + X.ico("rocket") + "<h3>" + X.esc(lt("ex_empty_t", { c: ch.name })) + "</h3><p>" + X.esc(lt("ex_empty_p")) + '</p><a class="sl-btn sl-btn-p" href="#/create">' + X.esc(X.t("cta_launch")) + "</a></div>";
    var cs = filtered(k);
    if (!cs.length) return '<div class="sl-empty"><p>' + X.esc(X.t("empty_f")) + "</p></div>";
    return coinTable(k, cs);
  }
  function offHtml(k) {
    var live = liveChains();
    return '<div class="sl-empty sl-off">' + X.ico("clock") + "<h3>" + X.esc(lt("off_t", { c: isLive(k) ? CHAINS[k].name : "SectoraEVM" })) + "</h3><p>" + X.esc(lt("off_p")) + "</p>" +
      (live.length ? '<div class="sl-netrow">' + live.map(function (x) { return '<button class="sl-netpill" data-a="setnet" data-v="' + x + '">' + chainDot(x) + X.esc(CHAINS[x].name) + "</button>"; }).join("") + "</div>" : "") + "</div>";
  }
  function netRow(net) {
    return '<div class="sl-netrow">' + ORDER.map(function (k) {
      var on = deployed(k);
      return '<button class="sl-netpill' + (k === net ? " on" : "") + '" data-a="setnet" data-v="' + k + '"' + (on ? "" : " disabled") + ">" + chainDot(k) + X.esc(CHAINS[k].name) + (on ? "" : ' <em>' + X.esc(lt("net_soon")) + "</em>") + "</button>";
    }).join("") + '<button class="sl-netpill' + (net === "sectora" ? " on" : "") + '" data-a="setnet" data-v="sectora"><i class="sl-cdot is-sect"></i>SectoraEVM <em>' + X.esc(lt("sectora_note", { d: MAINNET_TXT })) + "</em></button></div>";
  }
  function explore(net) {
    var st = chainState(net), ch = CHAINS[net];
    var tabs = [["trend", "tab_trend"], ["new", "tab_new"], ["soon", "tab_soon"], ["grad", "tab_grad"]];
    if (deployed(net)) loadChain(net).then(function () { X.refreshLive("grid"); }, function () { X.refreshLive("grid"); setTimeout(function () { X.refreshLive("grid"); }, 4000); });
    return '<section class="sl-sec"><div class="sl-head"><div><h2>' + X.esc(lt("ex_t")) + '</h2><span class="lbl" id="slExSub">' + X.esc(lt("ex_sub", { n: X.nf(st.count || 0, 0), c: ch.name })) + "</span></div>" +
      '<label class="sl-search">' + X.ico("search") + '<span class="sr">' + X.esc(X.t("search")) + '</span><input class="sl-input" id="slLQ" type="search" placeholder="' + X.esc(X.t("search")) + '" value="' + X.esc(ui.q) + '"></label></div>' +
      netRow(net) +
      '<div class="sl-tabs" style="margin:16px 0">' + tabs.map(function (x) { return '<button data-a="ltab" data-v="' + x[0] + '"' + (ui.tab === x[0] ? ' class="on"' : "") + ">" + X.esc(X.t(x[1])) + "</button>"; }).join("") + "</div>" +
      '<div class="sl-mkt" id="slLGrid">' + gridHtml(net) + "</div></section>" + soonBand();
  }
  function soonBand() {
    return '<section class="sl-sec"><div class="sl-soon"><div class="sl-soon-ic"><i class="sl-cdot is-sect" style="--s:14px"></i></div><div><span class="sl-eyebrow"><i class="rule"></i>SectoraEVM · ' + X.esc(lt("sectora_note", { d: MAINNET_TXT })) + "</span><h3>" + X.esc(lt("sectora_soon_t")) + "</h3><p>" + X.esc(lt("sectora_soon_p")) + "</p></div></div></section>";
  }
  function statTiles(net) {
    var st = chainState(net), ch = CHAINS[net], grads = st.coins.filter(function (c) { return c.grad; }).length;
    var raised = st.coins.reduce(function (s2, c) { return s2 + (c.grad ? 0 : fx(c.real)); }, 0);
    var burned = fx(st.burned || 0n), cf = st.cfg, pending = cf ? fx(st.fees || 0n) * cf.burn / 10000 : 0;
    var tiles = [
      [lt("net"), ch.name, ch.qs + " · " + (deployed(net) ? lt("net_live") : lt("net_soon")), "is-net"],
      [lt("st_coins"), X.nf(st.count || 0, 0), "", ""],
      [lt("st_grad"), X.nf(grads, 0), ch.dex + " · " + lt("st_lp"), ""],
      [lt("st_raised"), amt(raised, ch.qs), usdOf(net, raised), ""],
      [lt("st_burned"), amt(burned, ch.qs), pending > 0 ? lt("burn_pending", { n: amt(pending, ch.qs) }) : usdOf(net, burned), ""]
    ];
    return '<div class="sl-stats is-live" id="slLStats">' + tiles.map(function (x) {
      var parts = String(x[1]).split(" "), big = x[3] === "is-net" ? X.esc(x[1]) : X.esc(parts[0]) + (parts[1] ? "<small>" + X.esc(parts.slice(1).join(" ")) + "</small>" : "");
      return '<div class="sl-stat ' + x[3] + '"><span class="lbl">' + X.esc(x[0]) + '</span><b class="big">' + big + '</b><span class="sub">' + (x[2] ? X.esc(x[2]) : "&nbsp;") + "</span></div>";
    }).join("") + "</div>";
  }
  function hud(net) {
    var st = chainState(net);
    return X.esc(CHAINS[net].name) + " · " + X.esc(lt("block")) + ' <b class="num" id="slBlk">' + (st.block ? X.nf(st.block, 0) : "—") + "</b>";
  }

  /* ------------------------------------------------------------------ create */
  var draft = { name: "", sym: "", desc: "", img: "", web: "", x: "", tg: "", dev: "", ack: false, pay: "eth", touched: {} };
  var RESERVED = ["SECT", "SECTORA", "BTC", "WBTC", "ETH", "WETH", "USDT", "USDC", "DAI", "BNB", "WBNB", "SOL", "XRP", "POL", "MATIC", "AVAX", "ARB", "OP", "BUSD", "FDUSD", "TRX", "DOGE", "SHIB", "PEPE", "LINK", "UNI", "TON"];
  function utf8len(s) { return new TextEncoder().encode(s).length; }
  function metaJson() {
    var m = {};
    if (draft.desc.trim()) m.d = draft.desc.trim();
    if (draft.img.trim()) m.i = draft.img.trim();
    if (draft.web.trim()) m.w = safeLink(draft.web);
    if (draft.x.trim()) m.x = safeLink(draft.x);
    if (draft.tg.trim()) m.t = safeLink(draft.tg);
    return Object.keys(m).length ? JSON.stringify(m) : "";
  }
  function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function lev(a, b) {
    if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
    var v0 = [], v1 = [], i, j; for (i = 0; i <= b.length; i++) v0[i] = i;
    for (i = 0; i < a.length; i++) { v1[0] = i + 1; for (j = 0; j < b.length; j++) v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + (a[i] === b[j] ? 0 : 1)); for (j = 0; j <= b.length; j++) v0[j] = v1[j]; }
    return v1[b.length];
  }
  function similar(k, name, sym, except) {
    var n = norm(name), s = norm(sym), hit = null;
    chainState(k).coins.forEach(function (c) {
      if (hit || c.addr === except) return;
      var cn = norm(c.name), cs = norm(c.sym);
      if ((s && cs === s) || (n && cn === n) || (n.length > 4 && lev(n, cn) <= 1)) hit = c.name + " ($" + c.sym + ")";
    });
    return hit;
  }
  function devTokensFor(k, sectIn) {
    var cf = chainState(k).cfg; if (!cf || !(sectIn > 0)) return 0;
    var v0 = fx(cf.vN), net = sectIn * 0.99;
    return VT0 - VT0 * v0 / (v0 + net);
  }
  function devMaxSect(k) {
    var cf = chainState(k).cfg; if (!cf) return 0;
    var v0 = fx(cf.vN), net = v0 * VT0 / (VT0 - DEV_CAP * 0.999) - v0;
    return Math.floor(net / 0.99 * 1e6) / 1e6;
  }
  function rateOf(k) { return RATE[k] ? RATE[k].r : 0; }
  // what the form means in SECT and in ETH, whichever coin the creator pays with
  function createPlan(k) {
    var cf = chainState(k).cfg, r = rateOf(k), d = X.num(draft.dev), fee = cf ? fx(cf.fee) : 0;
    if (draft.pay === "eth") {
      var feeEth = r ? fee / r * 1.03 : 0, devSect = r ? d * r : 0;
      return { eth: true, fee: fee, feeEth: feeEth, dev: d, devSect: devSect, total: feeEth + d, ready: !!(cf && r) };
    }
    return { eth: false, fee: fee, dev: d, devSect: d, total: fee + d, ready: !!cf };
  }
  function createErrors(k) {
    var e = {}, nb = utf8len(draft.name.trim()), sb = draft.sym.length, ch = CHAINS[k];
    if (!nb || nb > 32) e.name = lt("e_name");
    if (!sb || sb > 12) e.sym = lt("e_sym");
    else if (RESERVED.indexOf(draft.sym) >= 0) e.sym = lt("e_reserved");
    if (draft.img.trim() && !safeImg(draft.img)) e.img = lt("e_img");
    if (utf8len(metaJson()) > 1024) e.meta = lt("e_meta");
    var pl = createPlan(k);
    if (pl.devSect > 0 && devTokensFor(k, pl.devSect) > DEV_CAP) e.dev = lt("e_dev");
    var ms = meState(k);
    if (W.addr && pl.ready) {
      if (pl.eth && ms.native != null && pl.total > fx(ms.native)) e.bal = lt("e_bal", { s: ch.sym });
      if (!pl.eth && ms.sect != null && pl.total > fx(ms.sect)) e.bal = lt("e_bal", { s: ch.qs });
    }
    return e;
  }
  function createSummary(k) {
    var ch = CHAINS[k], cf = chainState(k).cfg, pl = createPlan(k), errs = createErrors(k), g = gradTarget(k), ms = meState(k);
    var rows;
    if (pl.eth) {
      rows = [[lt("c_fee"), amt(pl.fee, ch.qs), pl.feeEth ? "≈ " + amt(pl.feeEth, ch.sym) : ""],
        [lt("c_devbuy"), pl.dev > 0 ? amt(pl.dev, ch.sym) : "—", pl.dev > 0 && pl.devSect ? "≈ " + amt(pl.devSect, ch.qs) : ""]];
    } else {
      rows = [[lt("c_fee"), amt(pl.fee, ch.qs), usdOf(k, pl.fee)], [lt("c_devbuy"), pl.dev > 0 ? amt(pl.dev, ch.qs) : "—", pl.dev > 0 ? usdOf(k, pl.dev) : ""]];
    }
    if (pl.devSect > 0) rows.push([lt("c_get"), X.compact(devTokensFor(k, pl.devSect)) + " $" + (draft.sym || "?"), X.nf(devTokensFor(k, pl.devSect) / 1e7, 2) + " %"]);
    rows.push([lt("c_total"), pl.ready ? amt(pl.total, pl.eth ? ch.sym : ch.qs) : "…", pl.eth ? ethUsd(k, pl.total) : usdOf(k, pl.total)]);
    var needApprove = !pl.eth && W.addr && pl.ready && ms.qAllow != null && ms.qAllow < E.parseEther(pl.total.toFixed(18));
    var ok = !Object.keys(errs).length && draft.ack && pl.ready;
    var btn = !W.addr ? '<button class="sl-btn sl-btn-p sl-btn-w" data-a="wconnect">' + X.esc(lt("w_connect")) + "</button>"
      : '<button class="sl-btn sl-btn-p sl-btn-w" data-a="llaunch"' + (ok ? "" : " disabled") + ">" + X.ico("rocket") + X.esc(needApprove ? lt("t_approve_q", { s: ch.qs }) : lt("c_btn", { c: ch.name })) + "</button>";
    var errList = ["bal", "meta", "dev"].filter(function (x) { return errs[x]; }).map(function (x) { return '<div class="sl-alert is-bad" style="margin-top:10px">' + X.ico("alert") + "<span>" + X.esc(errs[x]) + "</span></div>"; }).join("");
    var burn = cf ? Math.round(cf.burn / 100) : 0;
    return '<div class="sl-panel"><h3>' + X.ico("file") + X.esc(lt("c_summary")) + "</h3>" + chainDot(k) + ' <b style="font-size:13px">' + X.esc(ch.name) + " · " + X.esc(ch.qs) + "</b>" +
      rows.map(function (r) { return '<div class="sl-kv"><span>' + X.esc(r[0]) + '</span><b class="num">' + X.esc(r[1]) + (r[2] ? ' <small class="faint">' + X.esc(r[2]) + "</small>" : "") + "</b></div>"; }).join("") +
      (pl.eth ? '<p class="sl-route">' + X.esc(lt("c_route")) + "</p>" : "") +
      '<h4 class="sl-sub">' + X.esc(lt("c_rules")) + '</h4><ul class="sl-rules">' +
      ["c_r1", "c_r2", "c_r3", "c_r4", "c_r5"].map(function (r) { return "<li>" + X.ico("check") + "<span>" + X.esc(lt(r, { g: g ? X.nf(g, 0) : "…", s: ch.qs, d: ch.dex, b: burn })) + "</span></li>"; }).join("") + "</ul>" +
      errList + '<div style="margin-top:14px">' + btn + "</div></div>" +
      '<div class="sl-alert is-info">' + X.ico("info") + "<span>" + X.esc(lt("sectora_soon_p")) + "</span></div>";
  }
  function createView(net) {
    if (!deployed(net)) return '<a class="sl-back" href="#/">' + X.ico("back") + X.esc(X.t("back")) + "</a>" + offHtml(net);
    loadCfg(net).then(function () { X.refreshLive("summary"); }, function () {});
    loadUsd(net);
    var hadRate = !!rateOf(net);
    loadRate(net).then(function () {
      var ae = document.activeElement;
      if (!hadRate && draft.pay === "eth" && /#\/create/.test(location.hash) && !(ae && /INPUT|TEXTAREA/.test(ae.tagName))) X.render(); else X.refreshLive("summary");
    }, function () {});
    if (W.addr) loadMe(net).then(function () { X.refreshLive("summary"); }, function () {});
    var ch = CHAINS[net], errs = createErrors(net), tch = draft.touched, sim = (draft.name || draft.sym) ? similar(net, draft.name, draft.sym, null) : null;
    function f(id, label, val, attrs, err, hint) {
      return '<div class="sl-field"><label for="' + id + '">' + X.esc(label) + '</label><input class="sl-input' + (err ? " is-bad" : "") + '" id="' + id + '" value="' + X.esc(val) + '" ' + (attrs || "") + ">" + (err ? '<small class="sl-err" style="color:var(--red)">' + X.esc(err) + "</small>" : hint ? "<small>" + X.esc(hint) + "</small>" : "") + "</div>";
    }
    var prev = draft.img.trim() && safeImg(draft.img) ? '<img class="sl-logo" id="slLImgPv" src="' + X.esc(safeImg(draft.img)) + '" alt="" referrerpolicy="no-referrer" data-fb="' + X.esc(logoOf({ sym: draft.sym || "?" })) + '">' : '<img class="sl-logo" id="slLImgPv" src="' + logoOf({ sym: draft.sym || "?" }) + '" alt="">';
    var r0 = rateOf(net), dmS = devMaxSect(net), dm = draft.pay === "eth" ? (r0 ? Math.floor(dmS / r0 * 1e5) / 1e5 : 0) : dmS;
    var devUnit = draft.pay === "eth" ? ch.sym : ch.qs, devQuick = draft.pay === "eth" ? ch.quick.slice(0, 3) : ch.qquick.slice(0, 3);
    return '<a class="sl-back" href="#/">' + X.ico("back") + X.esc(X.t("back")) + "</a>" +
      '<div class="sl-pagehead"><span class="sl-eyebrow"><i class="rule"></i>Sectora Launch · ' + X.esc(ch.name) + "</span><h1>" + X.esc(lt("c_t")) + "</h1><p>" + X.esc(lt("c_s", { c: ch.name })) + "</p></div>" +
      '<div class="sl-2col"><div><div class="sl-panel">' +
      '<div class="sl-field"><span class="sl-label">' + X.esc(lt("c_img")) + '</span><div class="sl-upload">' + prev + '<div style="flex:1;min-width:0"><input class="sl-input' + (tch.img && errs.img ? " is-bad" : "") + '" id="slLImg" inputmode="url" placeholder="https://… / ipfs://…" value="' + X.esc(draft.img) + '"><small style="display:block;margin-top:6px">' + X.esc(tch.img && errs.img ? errs.img : lt("c_img_h")) + "</small></div></div></div>" +
      '<div class="sl-row2">' + f("slLName", lt("c_name"), draft.name, 'maxlength="32" autocomplete="off"', tch.name && errs.name) +
      f("slLSym", lt("c_ticker"), draft.sym, 'maxlength="12" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase;font-family:var(--mono)"', tch.sym && errs.sym) + "</div>" +
      '<div class="sl-warn-list" id="slLSim">' + (sim ? '<div class="sl-alert">' + X.ico("alert") + "<span>" + X.esc(lt("e_similar", { n: sim })) + "</span></div>" : "") + "</div>" +
      '<div class="sl-field"><label for="slLDesc">' + X.esc(lt("c_desc")) + '</label><textarea class="sl-textarea" id="slLDesc" maxlength="500">' + X.esc(draft.desc) + "</textarea></div>" +
      '<div class="sl-row3">' + f("slLWeb", lt("c_web"), draft.web, 'inputmode="url" placeholder="https://"') + f("slLX", lt("c_x"), draft.x, 'inputmode="url" placeholder="https://x.com/…"') + f("slLTg", lt("c_tg"), draft.tg, 'inputmode="url" placeholder="https://t.me/…"') + "</div>" +
      '<div class="sl-field"><span class="sl-label">' + X.esc(lt("pay")) + '</span><div class="sl-pay" style="margin:0">' + ["eth", "sect"].map(function (x) { return '<button type="button" data-a="lcpay" data-v="' + x + '"' + (draft.pay === x ? ' class="on"' : "") + ">" + X.esc(x === "eth" ? ch.sym : ch.qs) + "</button>"; }).join("") + "</div></div>" +
      '<div class="sl-field"><label for="slLDev">' + X.esc(lt("c_dev")) + '</label><div class="sl-input-wrap"><input class="sl-input num" id="slLDev" inputmode="decimal" placeholder="0" value="' + X.esc(draft.dev) + '"><span class="unit">' + X.esc(devUnit) + "</span></div>" +
      '<div class="sl-quick" style="margin:6px 0 0">' + devQuick.map(function (v) { return '<button type="button" data-a="ldev" data-v="' + v + '">' + v + "</button>"; }).join("") + (dm ? '<button type="button" data-a="ldev" data-v="' + dm + '">' + X.esc(lt("c_max")) + "</button>" : "") + "</div>" +
      "<small>" + X.esc(lt("c_dev_h")) + "</small></div>" +
      '<label class="sl-check"><input type="checkbox" id="slLAck"' + (draft.ack ? " checked" : "") + "><span>" + X.esc(lt("c_ack", { c: ch.name })) + "</span></label>" +
      '</div></div><div class="sl-sticky" id="slLSummary">' + createSummary(net) + "</div></div>";
  }
  function wireCreate(net) {
    function refresh() { var s = document.getElementById("slLSummary"); if (s) s.innerHTML = createSummary(net); }
    function bind(id, key, mode) {
      var el = document.getElementById(id); if (!el) return;
      el.addEventListener("input", function () {
        var v = el.value;
        if (mode === "sym") { v = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12); el.value = v; }
        if (mode === "num") v = v.replace(/[^0-9.,]/g, "");
        draft[key] = v;
        if (key === "name" || key === "sym") {
          var sm = document.getElementById("slLSim"), s = (draft.name || draft.sym) ? similar(net, draft.name, draft.sym, null) : null;
          if (sm) sm.innerHTML = s ? '<div class="sl-alert">' + X.ico("alert") + "<span>" + X.esc(lt("e_similar", { n: s })) + "</span></div>" : "";
        }
        if (key === "img" || key === "sym") {
          var pv = document.getElementById("slLImgPv"), u = safeImg(draft.img);
          if (pv) { pv.setAttribute("referrerpolicy", "no-referrer"); pv.src = u || logoOf({ sym: draft.sym || "?" }); pv.setAttribute("data-fb", logoOf({ sym: draft.sym || "?" })); }
        }
        refresh();
      });
      el.addEventListener("blur", function () {
        if (draft.touched[key]) return; draft.touched[key] = true;
        var errs = createErrors(net), e = errs[key];
        if (e) { el.classList.add("is-bad"); var sm = el.parentNode.querySelector("small"); if (sm) { sm.textContent = e; sm.style.color = "var(--red)"; } }
      });
    }
    bind("slLName", "name"); bind("slLSym", "sym", "sym"); bind("slLDesc", "desc"); bind("slLImg", "img"); bind("slLWeb", "web"); bind("slLX", "x"); bind("slLTg", "tg"); bind("slLDev", "dev", "num");
    var ack = document.getElementById("slLAck"); if (ack) ack.addEventListener("change", function () { draft.ack = ack.checked; refresh(); });
  }
  function doLaunch(net) {
    var errs = createErrors(net), cf = chainState(net).cfg, pl = createPlan(net), ms = meState(net);
    if (Object.keys(errs).length || !draft.ack || !pl.ready || !W.addr) { draft.touched = { name: 1, sym: 1, img: 1 }; X.render(); return; }
    var name = draft.name.trim(), sym = draft.sym, meta = metaJson();
    var done = function (rc) {
      var addr = null, iface = new E.Interface(ABI.factory);
      rc.logs.forEach(function (l) { try { var p = iface.parseLog(l); if (p && p.name === "CoinCreated") addr = p.args.token; } catch (e) {} });
      draft = { name: "", sym: "", desc: "", img: "", web: "", x: "", tg: "", dev: "", ack: false, pay: draft.pay, touched: {} };
      chainState(net).at = 0; ME[net] && (ME[net].at = 0);
      return { html: X.esc(lt("ok_launch")) + " · <b>$" + X.esc(sym) + "</b>", go: addr ? "#/t/" + net + "/" + E.getAddress(addr) : "#/" };
    };
    if (!pl.eth) {
      var devWei = pl.dev > 0 ? E.parseEther(pl.dev.toFixed(18)) : 0n, total = cf.fee + devWei;
      if (ms.qAllow == null || ms.qAllow < total) {
        // exact approval for this launch only
        txFlow(net, function (s) { return qC(net, s).approve(factoryOf(net), total); }, function () { ME[net] && (ME[net].at = 0); loadMe(net).then(function () { X.refreshLive("summary"); }); return { html: X.esc(lt("ok_approve")) }; });
        return;
      }
      var minDev = devWei > 0n ? E.parseEther(String(Math.floor(devTokensFor(net, pl.dev) * 0.995))) : 0n;
      txFlow(net, function (s) { return fac(net, s).createCoin(name, sym, meta, devWei, minDev); }, done);
      return;
    }
    // paying ETH: swap ETH → SECT along the fixed route, launch fee first, the rest is the creator buy
    var value = E.parseEther(pl.total.toFixed(15));
    txFlow(net, function (s) {
      return quoteEth(net, value).then(function (out) {
        var minQuote = out * 98n / 100n, maxDev = 0n, minDev = 0n;
        if (pl.dev > 0) {
          var capS = Math.min(fx(out) - fx(cf.fee), devMaxSect(net));
          maxDev = E.parseEther(Math.max(0, capS).toFixed(18));
          minDev = E.parseEther(String(Math.floor(devTokensFor(net, Math.max(0, fx(minQuote) - fx(cf.fee))) * 0.995)));
          if (devTokensFor(net, fx(maxDev)) < fx(minDev)) minDev = 0n;
        }
        return fac(net, s).createCoinWithETH(name, sym, meta, maxDev, minQuote, minDev, { value: value });
      });
    }, done);
  }

  /* ------------------------------------------------------------------ coin page */
  function chartSvg(k, td) {
    var c = td.c, list = td.trades.slice().reverse(), cf = chainState(k).cfg;
    var series = [];
    if (cf && (!td.from || td.from <= c.createdBlock)) series.push({ t: c.created, p: fx(cf.vN) / VT0 });
    list.forEach(function (tr) { series.push({ t: tr.t, p: tr.p }); });
    if (c.grad && td.pool && td.pool.t > 0) series.push({ t: Date.now(), p: td.pool.n / td.pool.t });
    var W2 = 800, H = 260, padT = 14, padB = 22;
    if (series.length < 2) return '<div class="sl-chart-wrap"><svg class="sl-chart" viewBox="0 0 ' + W2 + " " + H + '" preserveAspectRatio="none"><line x1="0" y1="' + (H - 40) + '" x2="' + W2 + '" y2="' + (H - 40) + '" stroke="rgba(255,255,255,.12)" stroke-dasharray="4 6"/></svg><div class="sl-chart-empty">' + X.esc(X.t("chart_empty")) + "</div></div>";
    var ys = series.map(function (s) { return s.p; }), mn = Math.min.apply(null, ys), mx = Math.max.apply(null, ys);
    if (mx === mn) { mx *= 1.05; mn *= 0.95; }
    var n = series.length, coords = series.map(function (s, i) { return [(i / (n - 1)) * W2, padT + (1 - (s.p - mn) / (mx - mn)) * (H - padT - padB)]; });
    var line = coords.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var col = ys[ys.length - 1] >= ys[0] ? "#14e0a0" : "#ff5c6c", area = line + " L" + W2 + " " + H + " L0 " + H + " Z";
    return '<div class="sl-chart-wrap"><svg class="sl-chart" viewBox="0 0 ' + W2 + " " + H + '" preserveAspectRatio="none"><defs><linearGradient id="slLG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".28"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#slLG)"/><path pathLength="1" d="' + line + '" fill="none" stroke="' + col + '" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>' +
      '<span class="pt" style="position:absolute;right:0;top:' + (coords[coords.length - 1][1] / H * 100).toFixed(2) + '%;width:9px;height:9px;margin:-4.5px -2px 0 0;border-radius:50%;background:' + col + ';box-shadow:0 0 0 3px ' + col + '33"></span></div>';
  }
  function curPrice(td) { var c = td.c; return c.grad && td.pool && td.pool.t > 0 ? td.pool.n / td.pool.t : priceOf(c); }
  function priceBar(k, td) {
    var c = td.c, ch = CHAINS[k], p = curPrice(td), mc = p * 1e9, day = Date.now() - 864e5, vol = 0;
    td.trades.forEach(function (tr) { if (tr.t > day) vol += tr.n; });
    return "<div><span>" + X.esc(lt("price")) + "</span><b>" + X.fmtPrice(p) + " <small>" + X.esc(ch.qs) + '</small></b><small style="margin:0">' + X.esc(usdOf(k, p)) + "</small></div>" +
      "<div><span>" + X.esc(lt("mc")) + "</span><b>" + X.esc(amt(mc)) + " <small>" + X.esc(ch.qs) + '</small></b><small style="margin:0">' + X.esc(usdOf(k, mc)) + "</small></div>" +
      "<div><span>" + X.esc(X.t("vol")) + " 24h</span><b>" + X.esc(amt(vol)) + " <small>" + X.esc(ch.qs) + '</small></b><small style="margin:0">' + X.esc(usdOf(k, vol)) + "</small></div>" +
      "<div><span>" + X.esc(lt("curve")) + "</span><b>" + X.nf(progressOf(c) * 100, 1) + " %</b></div>";
  }
  function tradesTable(k, td) {
    var ch = CHAINS[k];
    if (!td.trades.length) return '<p class="dim" style="margin:6px 0">' + X.esc(lt("tr_none")) + "</p>";
    return '<div class="sl-table-wrap"><table class="sl-table"><thead><tr><th>' + X.esc(lt("th_time")) + "</th><th>" + X.esc(lt("th_type")) + "</th><th>" + X.esc(lt("th_acct")) + '</th><th class="r">' + X.esc(ch.qs) + '</th><th class="r">' + X.esc(lt("th_tok")) + '</th><th class="sl-hide-sm">' + X.esc(lt("th_tx")) + "</th></tr></thead><tbody>" +
      td.trades.slice(0, 80).map(function (tr) {
        var type = '<span class="sl-side-pill ' + (tr.buy ? "buy" : "sell") + '">' + X.esc(tr.buy ? lt("t_buy") : lt("t_sell")) + "</span>";
        var who = addrLink(k, tr.who, (W.addr && tr.who === W.addr ? "★ " : "") + X.short(tr.who)) + (tr.who === td.c.creator ? ' <span class="sl-tag is-blue">' + X.esc(X.t("creator")) + "</span>" : "");
        return '<tr><td class="mono dim">' + X.esc(X.timeStr(tr.t)) + "</td><td>" + type + "</td><td>" + who + '</td><td class="r num">' + X.esc(amt(tr.n)) + '</td><td class="r num">' + X.esc(X.compact(tr.tok)) + '</td><td class="mono faint sl-hide-sm">' + txLink(k, tr.h) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function shieldChecks(k, td) {
    var c = td.c, devPct = fx(c.dev) / 1e7, sim = similar(k, c.name, c.sym, c.addr), res = RESERVED.indexOf(c.sym.toUpperCase()) >= 0;
    var list = [
      ["pass", lt("sh1"), lt("sh1d")], ["pass", lt("sh2"), lt("sh2d")], ["pass", lt("sh3"), lt("sh3d")], ["pass", lt("sh4"), lt("sh4d")],
      [devPct > 0 ? "pass" : "info", lt("sh5"), devPct > 0 ? lt("sh5d", { p: X.nf(devPct, 2) }) : lt("sh5n")],
      ["pass", lt("sh6"), lt("sh6d")],
      [sim ? "warn" : "pass", lt("sh7"), sim ? lt("sh7w", { n: sim }) : lt("sh7d")],
      [res ? "warn" : "pass", lt("sh8"), res ? lt("sh8w", { s: c.sym }) : lt("sh8d")]
    ];
    var score = Math.round(list.filter(function (x) { return x[0] !== "warn"; }).length / list.length * 100);
    return { score: score, list: list };
  }
  function shieldHtml(k, td) {
    var sh = shieldChecks(k, td), col = sh.score >= 85 ? "var(--green)" : sh.score >= 65 ? "var(--amber)" : "var(--red)";
    var circ = 2 * Math.PI * 31, off = circ * (1 - sh.score / 100);
    return '<div class="sl-shield-top"><div class="sl-ring"><svg viewBox="0 0 74 74"><circle cx="37" cy="37" r="31" fill="none" stroke="var(--panel-3)" stroke-width="7"/><circle cx="37" cy="37" r="31" fill="none" stroke="' + col + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg><b>' + sh.score + "</b></div>" +
      "<div><b>" + X.esc(lt("sh_t")) + '</b><p class="sl-note" style="margin-top:4px">' + X.esc(lt("sh_score")) + "</p></div></div>" +
      '<div class="sl-checks">' + sh.list.map(function (x) {
        var ic = x[0] === "pass" ? "check" : x[0] === "info" ? "info" : "alert";
        return '<div class="sl-chk ' + x[0] + '"><i>' + X.ico(ic) + "</i><div><b>" + X.esc(x[1]) + "</b><span>" + X.esc(x[2]) + "</span></div></div>";
      }).join("") + "</div>";
  }
  function infoHtml(k, td) {
    var c = td.c, ch = CHAINS[k], links = [["w", lt("c_web")], ["x", lt("c_x")], ["t", lt("c_tg")]].filter(function (l) { return c.meta[l[0]]; });
    var ds = c.grad && ch.ds ? "https://dexscreener.com/" + ch.ds + "/" + c.pair : "";
    return '<p style="margin:0 0 14px;color:var(--dim);white-space:pre-line">' + X.esc(c.meta.d || "—") + "</p>" +
      '<div class="sl-kv"><span>' + X.esc(lt("i_contract")) + "</span><b class=\"mono\">" + addrLink(k, c.addr) + ' <button class="sl-addr" data-a="copy" data-v="' + c.addr + '">' + X.ico("copy") + "</button></b></div>" +
      '<div class="sl-kv"><span>' + X.esc(lt("i_creator")) + '</span><b class="mono">' + addrLink(k, c.creator) + "</b></div>" +
      '<div class="sl-kv"><span>' + X.esc(lt("i_created")) + "</span><b>" + X.esc(X.dateStr(c.created)) + " · " + X.esc(X.timeStr(c.created)) + "</b></div>" +
      (c.grad ? '<div class="sl-kv"><span>' + X.esc(lt("i_pair")) + '</span><b class="mono">' + addrLink(k, c.pair) + (ds ? ' · <a href="' + X.esc(ds) + '" target="_blank" rel="noopener">' + X.esc(lt("i_chart")) + "</a>" : "") + "</b></div>" : "") +
      (links.length ? '<div class="sl-kv"><span>' + X.esc(lt("i_links")) + '</span><b style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">' +
        links.map(function (l) { return '<a href="' + X.esc(c.meta[l[0]]) + '" target="_blank" rel="noopener nofollow ugc" style="color:var(--blue)">' + X.esc(l[1]) + "</a>"; }).join("") + "</b></div>" : "");
  }
  function curvePanel(k, td) {
    var c = td.c, ch = CHAINS[k], g = gradTarget(k);
    if (c.grad) {
      var pn = td.pool ? td.pool.n : 0;
      return '<div class="sl-panel"><h3>' + X.ico("check") + X.esc(lt("cv_grad", { d: ch.dex })) + '</h3><div class="sl-prog is-done"><i style="width:100%"></i></div><p class="sl-note">' +
        X.esc(lt("cv_grad_p", { n: pn ? amt(pn) : "…", s: ch.qs })) + "</p></div>";
    }
    var pr = progressOf(c), r = fx(c.real);
    return '<div class="sl-panel"><h3>' + X.ico("chart") + X.esc(lt("cv_t")) + '</h3><div class="sl-prog"><i style="width:' + (pr * 100).toFixed(2) + '%"></i></div><p class="sl-note">' +
      X.esc(lt("cv_p", { p: X.nf(pr * 100, 2), r: amt(r), g: g ? X.nf(g, g >= 100 ? 0 : 3) : "…", s: ch.qs })) + " " + X.esc(usdOf(k, r) ? "(" + usdOf(k, r) + ")" : "") + "</p></div>";
  }
  function creatorPanel(k, td) {
    var c = td.c, ch = CHAINS[k], mine = td.mine && W.addr && W.addr === c.creator, html = '<div class="sl-panel"><h3>' + X.ico("user") + X.esc(lt("cr_t")) + "</h3>" +
      '<div class="sl-kv"><span>' + X.esc(lt("i_creator")) + '</span><b class="mono">' + addrLink(k, c.creator) + "</b></div>";
    if (mine) {
      var cfee = fx(td.mine.cfees);
      html += '<div class="sl-kv"><span>' + X.esc(lt("cr_fees")) + '</span><b class="num">' + X.esc(amt(cfee, ch.qs)) + "</b></div>" +
        '<button class="sl-btn sl-btn-p sl-btn-w" style="margin-top:10px" data-a="lclaimfees"' + (td.mine.cfees > 0n ? "" : " disabled") + ">" + X.esc(lt("cr_claim")) + "</button>";
    }
    var dev = fx(c.dev);
    if (dev > 0) {
      var nowS = chainNow(k) / 1000, startS = c.created / 1000 + CLIFF_S, vest = nowS <= startS ? 0 : Math.min(1, (nowS - startS) / VEST_S), released = dev * vest;
      html += '<h4 class="sl-sub">' + X.ico("lock") + X.esc(lt("cr_vest")) + '</h4><div class="sl-prog"><i style="width:' + (vest * 100).toFixed(1) + '%"></i></div><p class="sl-note">' +
        X.esc(lt("cr_vest_p", { v: X.compact(released), a: X.compact(dev), d: X.dateStr((startS + VEST_S) * 1000) })) + "</p>";
      if (mine) html += '<button class="sl-btn sl-btn-w" style="margin-top:10px" data-a="lclaimdev"' + (td.mine.claimable > 0n ? "" : " disabled") + ">" + X.esc(lt("cr_claim")) + " · " + X.esc(X.compact(fx(td.mine.claimable))) + " $" + X.esc(c.sym) + "</button>";
    } else html += '<p class="sl-note" style="margin-top:8px">' + X.esc(lt("cr_none")) + "</p>";
    return html + "</div>";
  }
  function tradePanel(k, td) {
    var c = td.c, ch = CHAINS[k], side = ui.side, m = td.mine, pay = c.grad ? "sect" : ui.pay;
    var head = '<div class="sl-trade-tabs"><button class="buy' + (side === "buy" ? " on" : "") + '" data-a="lside" data-v="buy">' + X.esc(lt("t_buy")) + '</button><button class="sell' + (side === "sell" ? " on" : "") + '" data-a="lside" data-v="sell">' + X.esc(lt("t_sell")) + "</button></div>";
    var fairLeft = c.created + FAIR_S * 1000 - chainNow(k);
    var fair = !c.grad && fairLeft > 0 ? '<div class="sl-alert is-info" style="margin-bottom:14px">' + X.ico("clock") + "<span>" + X.esc(lt("t_fair", { m: X.dur(fairLeft) })) + "</span></div>" : "";
    var uni = ch.swap ? ch.swap + c.addr : "";
    var dexNote = c.grad ? '<div class="sl-alert is-ok" style="margin-bottom:14px">' + X.ico("check") + "<span>" + X.esc(lt("t_dex_note", { d: ch.dex })) + "</span></div>" : "";
    if (c.grad && !routerOk[k]) {
      checkRouter(k);
      if (routerOk[k] === false) {
        return '<div class="sl-panel">' + dexNote + "<p class=\"sl-note\">" + X.esc(lt("t_router_off", { d: ch.dex })) + "</p>" + (uni ? '<a class="sl-btn sl-btn-p sl-btn-w" href="' + X.esc(uni) + '" target="_blank" rel="noopener">' + X.esc(ch.dex) + "</a>" : "") + "</div>";
      }
    }
    var unit, balLine, quick, payRow = "", note = "";
    if (side === "buy") {
      if (!c.grad) payRow = '<div class="sl-pay"><span>' + X.esc(lt("pay")) + "</span>" + ["eth", "sect"].map(function (x) { return '<button data-a="lpay" data-v="' + x + '"' + (pay === x ? ' class="on"' : "") + ">" + X.esc(x === "eth" ? ch.sym : ch.qs) + "</button>"; }).join("") + "</div>";
      unit = pay === "eth" ? ch.sym : ch.qs;
      balLine = '<div class="sl-bal"><span>' + X.esc(lt("t_bal")) + '</span><span class="num">' + (m ? X.esc(pay === "eth" ? amt(fx(m.native), ch.sym) : amt(fx(m.sect), ch.qs)) : "—") + "</span></div>";
      quick = (pay === "eth" ? ch.quick : ch.qquick).map(function (v) { return '<button data-a="lamt" data-v="' + v + '">' + v + "</button>"; }).join("");
      if (pay === "eth" && !c.grad) note = '<p class="sl-route">' + X.esc(lt("route")) + "</p>";
      if (c.grad && uni) note = '<p class="sl-route"><a href="' + X.esc(uni) + '" target="_blank" rel="noopener">' + X.esc(lt("t_uni")) + " ↗</a></p>";
    } else {
      unit = "$" + c.sym;
      balLine = '<div class="sl-bal"><span>' + X.esc(lt("t_bal")) + '</span><span class="num">' + (m ? X.esc(X.compact(fx(m.bal))) + " " + X.esc(c.sym) : "—") + "</span></div>";
      quick = [0.25, 0.5, 0.75, 1].map(function (f) { return '<button data-a="lpct" data-v="' + f + '">' + (f === 1 ? X.esc(X.t("max")) : f * 100 + "%") + "</button>"; }).join("");
      note = '<p class="sl-route">' + X.esc(lt("t_recv_sect")) + "</p>";
    }
    var slip = '<div class="sl-slip"><span>' + X.esc(lt("t_slip")) + "</span>" + [1, 3, 5, 10].map(function (s2) { return '<button data-a="lslip" data-v="' + s2 + '"' + (ui.slip === s2 ? ' class="on"' : "") + ">" + s2 + " %</button>"; }).join("") + "</div>";
    var btn = !W.addr ? '<button class="sl-btn sl-btn-p sl-btn-w" data-a="wconnect">' + X.esc(lt("w_connect")) + "</button>"
      : '<button class="sl-btn sl-btn-w ' + (side === "buy" ? "sl-btn-g" : "sl-btn-r") + '" data-a="ltrade" id="slLTradeBtn" disabled>' + X.esc(lt(side === "buy" ? "t_btn_buy" : "t_btn_sell", { s: c.sym })) + "</button>";
    return '<div class="sl-panel" id="slLTrade">' + head + dexNote + fair + payRow +
      '<div class="sl-field" style="margin-bottom:12px"><div class="sl-input-wrap"><input class="sl-input num" id="slLAmt" inputmode="decimal" placeholder="0.0" autocomplete="off" value="' + X.esc(ui.amt) + '"><span class="unit">' + X.esc(unit) + "</span></div></div>" +
      balLine + '<div class="sl-quick">' + quick + "</div>" + note + slip +
      '<div class="sl-quote" id="slLQuote">' + quoteRows([]) + "</div>" +
      '<div id="slLTradeErr"></div>' + btn + "</div>";
  }
  function quoteRows(rows) {
    if (!rows.length) rows = [[lt("t_you_get"), "—"], [lt("t_fee"), "—"], [lt("t_min"), "—"]];
    return rows.map(function (r) { return '<div class="sl-kv"><span>' + X.esc(r[0]) + '</span><b class="num">' + X.esc(r[1]) + "</b></div>"; }).join("");
  }
  var routerOk = {};
  function checkRouter(k) {
    if (routerOk[k] != null || checkRouter[k]) return;
    var ch = CHAINS[k];
    if (!ch.router) { routerOk[k] = false; return; }
    checkRouter[k] = true;
    withRpc(k, function (p) { var r = new E.Contract(ch.router, ROUTER_ABI, p); return Promise.all([r.factory(), r.WETH()]); }).then(function (r) {
      routerOk[k] = E.getAddress(r[0]) === E.getAddress(ch.dexFactory) && E.getAddress(r[1]) === E.getAddress(ch.wnative);
      X.render();
    }, function () { routerOk[k] = false; X.render(); });
  }
  var qTimer = 0, lastQ = null;
  function wireTrade(k, addr) {
    var inp = document.getElementById("slLAmt"), td = TD[k + ":" + addr];
    if (!inp || !td || !td.c) return;
    function upd() {
      clearTimeout(qTimer);
      var v = X.num(inp.value), qb = document.getElementById("slLQuote"), btn = document.getElementById("slLTradeBtn"), er = document.getElementById("slLTradeErr");
      lastQ = null; if (btn) btn.disabled = true;
      if (!(v > 0)) { qb.innerHTML = quoteRows([]); er.innerHTML = ""; return; }
      qTimer = setTimeout(function () { quote(k, td, v).then(function (q) {
        if (X.num(inp.value) !== v) return;
        lastQ = q;
        qb.innerHTML = quoteRows(q.rows);
        er.innerHTML = q.err ? '<div class="sl-alert is-bad" style="margin-bottom:12px">' + X.ico("alert") + "<span>" + X.esc(q.err) + "</span></div>" : q.note ? '<div class="sl-alert is-info" style="margin-bottom:12px">' + X.ico("info") + "<span>" + X.esc(q.note) + "</span></div>" : "";
        if (btn) { btn.disabled = !!q.err || !W.addr; if (q.approve) btn.textContent = q.approveQ ? lt("t_approve_q", { s: CHAINS[k].qs }) : lt("t_approve", { s: td.c.sym }); else btn.textContent = lt(ui.side === "buy" ? "t_btn_buy" : "t_btn_sell", { s: td.c.sym }); }
      }, function (err) { er.innerHTML = '<div class="sl-alert is-bad" style="margin-bottom:12px">' + X.ico("alert") + "<span>" + X.esc(errMsg(err)) + "</span></div>"; }); }, 260);
    }
    inp.addEventListener("input", function () { ui.amt = inp.value; upd(); });
    inp._upd = function () { ui.amt = inp.value; upd(); };
    if (inp.value) upd();
  }
  function quote(k, td, v) {
    var c = td.c, ch = CHAINS[k], m = td.mine, slip = BigInt(Math.round(ui.slip * 100)), pay = c.grad ? "sect" : ui.pay;
    var wei;
    try { wei = E.parseEther(String(v)); } catch (e) { return Promise.reject(new Error("amount")); }
    var cut = function (x, n) { return x * (10000n - slip * BigInt(n || 1)) / 10000n; };
    var fairErr = function (tok) { return chainNow(k) < c.created + FAIR_S * 1000 && m && fx(m.fair) + tok > FAIR_CAP ? lt("t_fair_cap") : ""; };
    if (ui.side === "buy" && !c.grad) {
      var sectIn = pay === "eth" ? quoteEth(k, wei) : Promise.resolve(wei);
      return sectIn.then(function (sq) {
        return withRpc(k, function (p) { return fac(k, p).quoteBuy(c.addr, sq); }).then(function (r) {
          var out = r[0], fee = r[1], used = r[2], comp = r[3], tok = fx(out), spot = priceOf(c);
          var impact = tok > 0 ? (fx(used - fee) / tok) / spot - 1 : 0;
          var minTok = comp ? 0n : cut(out, pay === "eth" ? 2 : 1);
          var rows = [[lt("t_you_get"), X.compact(tok) + " $" + c.sym]];
          if (pay === "eth") rows.push([lt("t_swap"), amt(fx(sq), ch.qs)]);
          rows.push([lt("t_fee"), amt(fx(fee), ch.qs)], [lt("t_impact"), X.nf(impact * 100, 2) + " %"], [lt("t_min"), comp ? "—" : X.compact(fx(minTok)) + " $" + c.sym]);
          if (comp) rows.push([lt("t_refund"), amt(fx(sq - used), ch.qs)]);
          var err = "";
          if (m && pay === "eth" && wei > m.native) err = lt("e_bal", { s: ch.sym });
          else if (m && pay === "sect" && wei > m.sect) err = lt("e_bal", { s: ch.qs });
          else err = fairErr(tok);
          var q = { rows: rows, err: err, note: comp ? lt("t_completes", { d: ch.dex }) : "", min: minTok };
          if (pay === "eth") { q.kind = "buyeth"; q.value = wei; q.minQuote = cut(sq); }
          else { q.kind = "buysect"; q.amount = wei; q.approve = m && m.qAllow < wei; q.approveQ = true; q.spender = factoryOf(k); }
          return q;
        });
      });
    }
    if (ui.side === "sell" && !c.grad) {
      return withRpc(k, function (p) { return fac(k, p).quoteSell(c.addr, wei); }).then(function (r) {
        var out = r[0], fee = r[1], minOut = cut(out);
        var err = m && wei > m.bal ? (m.bal > 0n ? lt("r_bal") : lt("t_no_tokens", { s: c.sym })) : "";
        return { rows: [[lt("t_you_get"), amt(fx(out), ch.qs)], [lt("t_fee"), amt(fx(fee), ch.qs)], [lt("t_min"), amt(fx(minOut), ch.qs)]], err: err, kind: "sell", amount: wei, min: minOut };
      });
    }
    // graduated: COIN/SECT pool on Uniswap V2
    var path = ui.side === "buy" ? [ch.qaddr, c.addr] : [c.addr, ch.qaddr];
    return withRpc(k, function (p) { return new E.Contract(ch.router, ROUTER_ABI, p).getAmountsOut(wei, path); }).then(function (a) {
      var out = a[1], minOut = cut(out), buy = ui.side === "buy";
      var err = buy ? (m && wei > m.sect ? lt("e_bal", { s: ch.qs }) : "") : (m && wei > m.bal ? (m.bal > 0n ? lt("r_bal") : lt("t_no_tokens", { s: c.sym })) : "");
      return { rows: [[lt("t_you_get"), buy ? X.compact(fx(out)) + " $" + c.sym : amt(fx(out), ch.qs)], [lt("t_min"), buy ? X.compact(fx(minOut)) + " $" + c.sym : amt(fx(minOut), ch.qs)]],
        err: err, kind: buy ? "dexbuy" : "dexsell", amount: wei, min: minOut, path: path,
        approve: m && (buy ? m.qAllowR < wei : m.tAllowR < wei), approveQ: buy, spender: ch.router };
    });
  }
  function doTrade(k, addr) {
    var td = TD[k + ":" + addr], q = lastQ;
    if (!td || !td.c || !q || q.err || !W.addr) return;
    var c = td.c, ch = CHAINS[k], dl = Math.floor(chainNow(k) / 1000) + 1200;
    txFlow(k, function (s) {
      // approvals are always for the exact amount of this trade, never unlimited
      if (q.approve) return (q.approveQ ? qC(k, s) : tokC(c.addr, s)).approve(q.spender, q.amount);
      if (q.kind === "buyeth") return fac(k, s).buyWithETH(c.addr, q.minQuote, q.min, { value: q.value });
      if (q.kind === "buysect") return fac(k, s).buy(c.addr, q.amount, q.min);
      if (q.kind === "sell") return fac(k, s).sell(c.addr, q.amount, q.min);
      return new E.Contract(ch.router, ROUTER_ABI, s).swapExactTokensForTokens(q.amount, q.min, q.path, W.addr, dl);
    }, function () {
      td.at = 0; chainState(k).at = 0; ME[k] && (ME[k].at = 0);
      if (q.approve) return { html: X.esc(lt("ok_approve")) };
      ui.amt = "";
      var buy = q.kind === "buyeth" || q.kind === "buysect" || q.kind === "dexbuy";
      return { html: X.esc(buy ? lt("ok_buy", { n: q.rows[0][1].replace(/ \$.*/, ""), s: c.sym }) : lt("ok_sell", { n: X.compact(fx(q.amount)), s: c.sym })) };
    });
  }
  function tokenView(k, addr) {
    var back = '<a class="sl-back" href="#/">' + X.ico("back") + X.esc(X.t("back")) + "</a>";
    if (!isLive(k) || !E.isAddress(addr || "")) return back + '<div class="sl-empty"><p>' + X.esc(X.t("empty_f")) + "</p></div>";
    if (!deployed(k)) return back + offHtml(k);
    addr = E.getAddress(addr);
    var td = TD[k + ":" + addr];
    if (!td || (!td.c && !td.missing)) {
      if (!td || !td.loading) loadToken(k, addr).then(function () { if (onToken(addr)) X.render(); }, function () { setTimeout(function () { if (onToken(addr)) X.render(); }, 3000); });
      loadUsd(k);
      return back + '<div class="sl-empty sl-loading">' + X.ico("clock") + "<p>" + X.esc(lt("ex_loading", { c: CHAINS[k].name })) + "</p></div>";
    }
    if (td.missing) return back + '<div class="sl-empty"><p>' + X.esc(X.t("empty_f")) + "</p></div>";
    ensureToken(k, addr);
    var c = td.c, ch = CHAINS[k], sh = shieldChecks(k, td);
    var itabs = [["trades", "tab_trades"], ["shield", "tab_shield"], ["info", "tab_info"]];
    var body = ui.ctab === "shield" ? shieldHtml(k, td) : ui.ctab === "info" ? infoHtml(k, td) : tradesTable(k, td);
    var tag = sh.score >= 85 ? "is-good" : sh.score >= 65 ? "is-mid" : "is-bad";
    return back +
      '<div class="sl-2col sl-tok"><div>' +
      '<div class="sl-coinhead o1">' + logoTag(c, "sl-logo sl-logo-lg") + "<div><h1>" + X.esc(c.name) + " <span>$" + X.esc(c.sym) + '</span><span class="sl-tag ' + tag + '">' + X.ico("shield") + sh.score + "</span></h1>" +
      '<div class="meta"><span class="sl-netpill on sm">' + chainDot(k) + X.esc(ch.name) + '</span><button class="sl-addr" data-a="copy" data-v="' + c.addr + '">' + X.esc(X.short(c.addr)) + X.ico("copy") + "</button>" +
      (c.grad ? '<span class="sl-tag is-good">' + X.ico("check") + X.esc(lt("grad_dex", { d: ch.dex })) + "</span>" : "") +
      '<span class="faint" style="font-size:12.5px">' + X.esc(X.ago(c.created)) + "</span></div></div></div>" +
      '<div class="sl-panel o2"><div class="sl-pricebar" id="slLPrice">' + priceBar(k, td) + '</div><div id="slLChart">' + chartSvg(k, td) + "</div></div>" +
      '<div class="sl-panel o5"><div class="sl-itabs">' + itabs.map(function (x) { return '<button data-a="lctab" data-v="' + x[0] + '"' + (ui.ctab === x[0] ? ' class="on"' : "") + ">" + X.esc(lt(x[1])) + "</button>"; }).join("") + '</div><div id="slLBody">' + body + "</div></div>" +
      '</div><div class="sl-sticky"><div class="o3">' + tradePanel(k, td) + '</div><div id="slLCurve" class="o4">' + curvePanel(k, td) + '</div><div id="slLCreator" class="o6">' + creatorPanel(k, td) + "</div></div></div>";
  }
  function onToken(addr) { return location.hash.indexOf(addr) >= 0 || location.hash.toLowerCase().indexOf(addr.toLowerCase()) >= 0; }
  // reload stale coin data (after a transaction, a wallet change or every few seconds) without looping renders
  function ensureToken(k, addr) {
    var td = TD[k + ":" + addr];
    if (!td || td.loading || (td.at && Date.now() - td.at < 8000)) return;
    loadToken(k, addr, true).then(function () {
      if (!onToken(addr)) return;
      var inp = document.getElementById("slLAmt");
      if (inp && inp.value) refreshToken(k, addr); else X.render();
    }, function () {});
  }
  function refreshToken(k, addr) {
    var td = TD[k + ":" + addr]; if (!td || !td.c) return;
    var set = function (id, h) { var el = document.getElementById(id); if (el) el.innerHTML = h; };
    set("slLPrice", priceBar(k, td)); set("slLChart", chartSvg(k, td)); set("slLCurve", curvePanel(k, td)); set("slLCreator", creatorPanel(k, td));
    if (ui.ctab === "trades") set("slLBody", tradesTable(k, td));
    var inp = document.getElementById("slLAmt"); if (inp && inp.value && inp._upd) inp._upd();
  }

  /* ------------------------------------------------------------------ me / stats */
  function meView(net) {
    if (!W.addr) return '<div class="sl-pagehead"><span class="sl-eyebrow"><i class="rule"></i>Sectora Launch</span><h1>' + X.esc(lt("me_t")) + '</h1></div><div class="sl-empty">' + X.ico("wallet") + "<p>" + X.esc(lt("c_need_wallet")) + '</p><button class="sl-btn sl-btn-p" data-a="wconnect">' + X.esc(lt("w_connect")) + "</button></div>";
    var ch = CHAINS[net], ms = meState(net), st = chainState(net);
    if (deployed(net) && (!ms.at || Date.now() - ms.at > 15000)) loadMe(net).then(function () { X.render(); }, function () {});
    var mine = st.coins.filter(function (c) { return c.creator === W.addr; });
    var held = st.coins.filter(function (c) { return ms.bals[c.addr] > 0n; });
    var list = function (arr, bal) {
      if (!arr.length) return '<p class="dim">' + X.esc(lt("me_none")) + "</p>";
      return '<div class="sl-mkt">' + coinTable(net, arr, bal ? lt("bal_h") : null, bal ? function (c) { return X.esc(X.compact(fx(ms.bals[c.addr]))) + ' <span class="faint">$' + X.esc(c.sym) + "</span>"; } : null) + "</div>";
    };
    return '<div class="sl-pagehead"><span class="sl-eyebrow"><i class="rule"></i>' + X.esc(W.info && W.info.name || "Wallet") + "</span><h1>" + X.esc(lt("me_t")) + "</h1></div>" +
      '<div class="sl-panel"><div class="sl-kv"><span>' + X.esc(lt("w_addr")) + '</span><b class="mono">' + (isLive(net) ? addrLink(net, W.addr, W.addr) : X.esc(W.addr)) + "</b></div>" +
      '<div class="sl-kv"><span>' + X.esc(lt("net")) + "</span><b>" + chainDot(net) + " " + X.esc(ch.name) + "</b></div>" +
      '<div class="sl-kv"><span>' + X.esc(lt("eth_bal")) + '</span><b class="num">' + (ms.native != null ? X.esc(amt(fx(ms.native), ch.sym)) + ' <small class="faint">' + X.esc(ethUsd(net, fx(ms.native))) + "</small>" : "…") + "</b></div>" +
      (ch.qaddr ? '<div class="sl-kv"><span>' + X.esc(lt("sect_bal")) + '</span><b class="num">' + (ms.sect != null ? X.esc(amt(fx(ms.sect), ch.qs)) + " " + usdLine(net, fx(ms.sect)) : "…") + "</b></div>" : "") +
      (deployed(net) ? '<div class="sl-kv"><span>' + X.esc(lt("me_fees")) + '</span><b class="num">' + X.esc(amt(fx(ms.fees || 0n), ch.qs)) + "</b></div>" +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="sl-btn sl-btn-p" data-a="lclaimfees"' + (ms.fees > 0n ? "" : " disabled") + ">" + X.esc(lt("cr_claim")) + '</button><button class="sl-btn" data-a="wdisconnect">' + X.esc(lt("w_disconnect")) + "</button></div>" : '<button class="sl-btn" style="margin-top:12px" data-a="wdisconnect">' + X.esc(lt("w_disconnect")) + "</button>") + "</div>" +
      (deployed(net) ? '<section class="sl-sec"><div class="sl-head"><div><h2>' + X.esc(lt("me_hold")) + "</h2></div></div>" + list(held, true) + "</section>" +
        '<section class="sl-sec"><div class="sl-head"><div><h2>' + X.esc(lt("me_coins")) + "</h2></div></div>" + list(mine, false) + "</section>" : offHtml(net));
  }
  function burnPanel() {
    var k = liveChains()[0]; if (!k) return "";
    var st = chainState(k), cf = st.cfg, ch = CHAINS[k];
    if (!st.at || !cf) return "";
    var fees = fx(st.fees || 0n), pend = fees * cf.burn / 10000;
    return '<div class="sl-panel"><h3>' + X.ico("fire") + X.esc(lt("st_burned")) + '</h3><div class="sl-kv"><span>' + X.esc(lt("st_burned")) + '</span><b class="num">' + X.esc(amt(fx(st.burned || 0n), ch.qs)) + "</b></div>" +
      '<div class="sl-kv"><span>' + X.esc(lt("burn_pend_l")) + '</span><b class="num">' + X.esc(amt(pend, ch.qs)) + "</b></div>" +
      '<p class="sl-note">' + X.esc(lt("burn_p", { b: Math.round(cf.burn / 100) })) + "</p>" +
      '<button class="sl-btn sl-btn-p" style="margin-top:12px" data-a="lburn" data-v="' + k + '"' + (fees > 0 ? "" : " disabled") + ">" + X.ico("fire") + X.esc(lt("burn_btn")) + "</button></div>";
  }
  function statsView() {
    var live = liveChains();
    live.forEach(function (k) { if (!chainState(k).at || !chainState(k).cfg) loadChain(k).then(function () { X.render(); }, function () {}); });
    return '<div class="sl-pagehead"><span class="sl-eyebrow"><i class="rule"></i>Sectora Launch</span><h1>' + X.esc(lt("stats_t")) + "</h1><p>" + X.esc(lt("soon_on", { n: live.length })) + "</p></div>" +
      '<div class="sl-panel"><div class="sl-table-wrap"><table class="sl-table"><thead><tr><th>' + X.esc(lt("net")) + '</th><th class="r">' + X.esc(lt("st_coins")) + '</th><th class="r">' + X.esc(lt("st_grad")) + '</th><th class="r">' + X.esc(lt("st_raised")) + '</th><th class="r sl-hide-sm">' + X.esc(lt("st_burned")) + "</th></tr></thead><tbody>" +
      ORDER.map(function (k) {
        var on = deployed(k), st = chainState(k), ch = CHAINS[k];
        if (!on) return '<tr><td>' + chainDot(k) + " " + X.esc(ch.name) + '</td><td class="r faint" colspan="4">' + X.esc(lt("net_soon")) + "</td></tr>";
        var g = st.coins.filter(function (c) { return c.grad; }).length, r = st.coins.reduce(function (s, c) { return s + (c.grad ? 0 : fx(c.real)); }, 0);
        return '<tr><td><button class="sl-link" data-a="setnet" data-v="' + k + '">' + chainDot(k) + " " + X.esc(ch.name) + '</button></td><td class="r num">' + (st.at ? X.nf(st.count, 0) : "…") + '</td><td class="r num">' + (st.at ? X.nf(g, 0) : "…") + '</td><td class="r num">' + (st.at ? X.esc(amt(r, ch.qs)) : "…") + '</td><td class="r num sl-hide-sm">' + (st.at ? X.esc(amt(fx(st.burned || 0n), ch.qs)) : "…") + "</td></tr>";
      }).join("") +
      '<tr><td><i class="sl-cdot is-sect"></i> SectoraEVM</td><td class="r faint" colspan="4">' + X.esc(lt("sectora_note", { d: MAINNET_TXT })) + "</td></tr></tbody></table></div></div>" + burnPanel() + soonBand();
  }

  /* ------------------------------------------------------------------ actions */
  function onAction(act, v, el, net, view, args) {
    if (act === "netmenu") { toggleNetMenu(net, el); return true; }
    if (act === "setnet") { var mm = document.getElementById("slNetMenu"); if (mm) mm.remove(); X.setNet(v); return true; }
    if (act === "wconnect") { connect(); return true; }
    if (act === "wdisconnect") { disconnect(); return true; }
    if (act === "wswitch") { if (isLive(net)) ensureChain(net).then(function () { X.render(); }, function (err) { if (!isReject(err)) X.toast(X.esc(errMsg(err)), "bad"); }); return true; }
    if (!isLive(net)) return false;
    if (act === "ltab") { ui.tab = v; var g = document.getElementById("slLGrid"); if (g) g.innerHTML = gridHtml(net); document.querySelectorAll('[data-a="ltab"]').forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === v); }); return true; }
    if (act === "lcpay") { draft.pay = v; draft.dev = ""; X.render(); return true; }
    if (act === "ldev") { draft.dev = String(v); var d = document.getElementById("slLDev"); if (d) { d.value = draft.dev; d.dispatchEvent(new Event("input")); } return true; }
    if (act === "llaunch") { doLaunch(net); return true; }
    if (act === "lside") { ui.side = v; ui.amt = ""; X.render(); return true; }
    if (act === "lpay") { ui.pay = v; ui.amt = ""; X.render(); return true; }
    if (act === "lctab") { ui.ctab = v; X.render(); return true; }
    if (act === "lslip") { ui.slip = +v; document.querySelectorAll('[data-a="lslip"]').forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === v); }); var i0 = document.getElementById("slLAmt"); if (i0 && i0._upd) i0._upd(); return true; }
    if (act === "lamt") { var i1 = document.getElementById("slLAmt"); if (i1) { i1.value = v; i1._upd && i1._upd(); } return true; }
    if (act === "lpct") {
      var td0 = TD[args[0] + ":" + args[1]], i2 = document.getElementById("slLAmt");
      if (td0 && td0.mine && i2) {
        var b = td0.mine.bal * BigInt(Math.round(parseFloat(v) * 10000)) / 10000n;
        i2.value = b > 0n ? E.formatEther(b) : ""; i2._upd && i2._upd();
      }
      return true;
    }
    if (act === "ltrade") { doTrade(args[0], args[1]); return true; }
    if (act === "lburn") {
      if (!W.addr) { connect(); return true; }
      var bk = v || net;
      txFlow(bk, function (s2) { return fac(bk, s2).withdrawProtocolFees(); }, function () { chainState(bk).at = 0; return { html: X.esc(lt("ok_burn")) }; });
      return true;
    }
    if (act === "lclaimfees") {
      txFlow(net, function (s) { return fac(net, s).claimCreatorFees(); }, function () { ME[net] && (ME[net].at = 0); Object.keys(TD).forEach(function (key) { TD[key].at = 0; }); return { html: X.esc(lt("ok_claim")) }; });
      return true;
    }
    if (act === "lclaimdev") {
      var tk = args[1];
      txFlow(net, function (s) { return fac(net, s).claimDev(tk); }, function () { var t2 = TD[net + ":" + tk]; if (t2) t2.at = 0; return { html: X.esc(lt("ok_claim")) }; });
      return true;
    }
    return false;
  }
  function wire(view, net, args) {
    var q = document.getElementById("slLQ");
    if (q) q.addEventListener("input", function () { ui.q = q.value; var g = document.getElementById("slLGrid"); if (g) g.innerHTML = gridHtml(net); });
    if (view === "create" && isLive(net)) wireCreate(net);
    if (view === "t" && args[0] && args[1] && E.isAddress(args[1])) wireTrade(args[0], E.getAddress(args[1]));
  }
  // broken coin images fall back to the generated logo
  document.addEventListener("error", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG" && t.getAttribute("data-fb") && t.src !== t.getAttribute("data-fb")) t.src = t.getAttribute("data-fb");
  }, true);
  function tick(view, net, args) {
    if (!isLive(net) || !deployed(net) || document.hidden) return;
    if (W.addr && (!meState(net).native || ++tick.n % 3 === 0)) refreshBalance();
    if (view === "home") {
      loadChain(net).then(function () { X.refreshLive("grid"); }, function () {});
    } else if (view === "t" && args[1] && E.isAddress(args[1])) {
      var addr = E.getAddress(args[1]);
      loadToken(args[0], addr).then(function () { refreshToken(args[0], addr); }, function () {});
    }
  }
  tick.n = 0;
  function refresh(part, net) {
    if (!isLive(net)) return;
    var st = chainState(net);
    if (part === "grid" || part === "usd") {
      var g = document.getElementById("slLGrid"); if (g) g.innerHTML = gridHtml(net);
      var s = document.getElementById("slLStats"); if (s) s.outerHTML = statTiles(net);
      var sub = document.getElementById("slExSub"); if (sub) sub.textContent = lt("ex_sub", { n: X.nf(st.count || 0, 0), c: CHAINS[net].name });
      var bk = document.getElementById("slBlk"); if (bk && st.block) bk.textContent = X.nf(st.block, 0);
    }
    if (part === "summary" || part === "usd") { var sm = document.getElementById("slLSummary"); if (sm) sm.innerHTML = createSummary(net); }
  }

  window.SLLive = {
    init: function (helpers) { X = helpers; autoReconnect(); },
    chains: CHAINS, order: ORDER, isLive: isLive, deployed: deployed, liveChains: liveChains,
    defaultNet: function () { var l = liveChains(); return l.length ? l[0] : "sectora"; },
    t: override, netChip: netChip, acctBtn: acctBtn, banner: banner, hud: hud,
    explore: explore, statTiles: statTiles, create: createView, token: tokenView, me: meView, stats: statsView,
    onAction: onAction, wire: wire, tick: tick, refresh: refresh,
    wallet: function () { return W.addr; }
  };
})();
