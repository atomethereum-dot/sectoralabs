/* Sectora Launch — fair launches on Ethereum, every coin priced in SECT.
 * Reads the SectoraFairLaunch contract through a public RPC and sends transactions through the
 * visitor's own wallet (EIP-1193 / EIP-6963). One price for everyone in a reserve, 100 % back if it
 * does not fill, and at the target the coin goes live on Uniswap with its liquidity burned forever.
 * SectoraEVM itself stays in demo mode until its mainnet (approx. 22 March 2027). */
(function () {
  "use strict";
  var E = window.ethers, ABI = window.SL_ABI, DEP = window.SL_DEPLOYMENTS || {};
  if (!E || !ABI) return;
  var X = null; // helpers from launch.js, set by SLLive.init()

  /* ------------------------------------------------------------------ network */
  var CHAINS = {
    ethereum: { id: 1, name: "Ethereum", short: "ETH", sym: "ETH", col: "#627eea", ds: "ethereum", exp: "https://etherscan.io",
      rpc: ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com"],
      dex: "Uniswap", dexFactory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", wnative: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      swap: "https://app.uniswap.org/swap?chain=mainnet&inputCurrency=ETH&outputCurrency=", quick: ["0.01", "0.05", "0.1", "0.25"],
      // every coin is priced in SECT; paying with ETH swaps ETH → USDT → SECT on Uniswap V3
      qs: "SECT", qaddr: "0x8C9984B06281f1CA9416e493c2E602AaB08513db", qquick: ["500", "1000", "2500", "4700"],
      v3router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", quoter: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
      path: ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 500, "0xdAC17F958D2ee523a2206206994597C13D831ec7", 100, "0x8C9984B06281f1CA9416e493c2E602AaB08513db"],
      oracle: "0xA12A11fc202827B7c734Cf2019f2C7A6CF061d69", oracleDex: "Uniswap V3 SECT/USDT 0.01 %" }
  };
  var ORDER = ["ethereum"];
  // Local development chain (a fork of Ethereum) — only offered when the site runs on this machine.
  var LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  if (LOCAL) {
    CHAINS.local = Object.assign({}, CHAINS.ethereum, { id: 31337, name: "Localhost", short: "Local", col: "#9aa4b2", exp: "", rpc: ["http://127.0.0.1:8545"] });
    ORDER.push("local");
  }
  var MAINNET_TXT = "22.03.2027";
  // token split, same maths as the contract (basis points of the supply)
  var CREATOR_BPS = 500n, BONUS_BPS = 650n, RES_PARTS = 150n, POOL_PARTS = 98n;
  var INSTANT = 0.75, VEST_MS = 7 * 864e5, LOCK_MS = 30 * 864e5, CREATOR_MS = 30 * 864e5;
  var DUR = [3600, 6 * 3600, 12 * 3600, 86400, 3 * 86400, 7 * 86400];
  var DEAD = "0x000000000000000000000000000000000000dEaD";
  function resTokens(sup) { var rest = sup - sup * (CREATOR_BPS + BONUS_BPS) / 10000n; return rest * RES_PARTS / (RES_PARTS + POOL_PARTS); }
  function poolTokens(sup) { var rest = sup - sup * (CREATOR_BPS + BONUS_BPS) / 10000n; return rest - rest * RES_PARTS / (RES_PARTS + POOL_PARTS); }

  function overrides() { try { return JSON.parse(localStorage.getItem("sectoraLaunch.fair") || "{}") || {}; } catch (e) { return {}; } }
  function factoryOf(k) {
    if (!CHAINS[k]) return "";
    var o = overrides()[k];
    if (o && E.isAddress(o)) return E.getAddress(o);
    var d = DEP[k];
    return d && E.isAddress(d) ? E.getAddress(d) : "";
  }
  function isLive(k) { return !!(k && CHAINS[k] && ORDER.indexOf(k) >= 0); }
  function deployed(k) { return isLive(k) && !!factoryOf(k); }
  function liveChains() { return ORDER.filter(deployed); }

  /* ------------------------------------------------------------------ strings */
  var LS = {
    en: {
      bonus_up: "Bonus up to +25 %", r_p1: "{r} of {g} · 1 wallet", 
      j_sect: "SECT from your ETH", j_in: "Goes into the reserve", j_back: "Returned to you", 
      pay: "Pay with", banner_live: "Fair launches on {n}: one price for everyone, 100 % back if a reserve does not fill. Every coin is priced in {s}.",
      banner_off: "Sectora Launch is not active on {n} yet. SectoraEVM: approximately 22 March 2027.",
      sectora_soon_t: "Coming to SectoraEVM", sectora_soon_p: "Sectora Launch will be available on SectoraEVM approximately on 22 March 2027, at mainnet. Until then it runs with real coins on Ethereum, priced in SECT.",
      sectora_note: "Mainnet approx. {d}", sectora_menu: "Demo · mainnet approx. {d}", sectora_demo: "SectoraEVM",
      w_connect: "Connect wallet", w_choose: "Choose your wallet", w_none_t: "No wallet found in this browser", w_none_p: "Open this page inside your wallet's browser, or install a wallet extension.",
      w_disconnect: "Disconnect", w_wrong: "Switch to {n}", w_addr: "Wallet", net: "Network", net_t: "Choose network", net_live: "Live", net_soon: "Coming soon", block: "Block", usd: "≈ {u}",
      ex_t: "Explore coins", ex_sub: "{n} coins on {c}", ex_loading: "Loading coins from {c}…", ex_err: "Could not reach {c}. Retrying…",
      ex_empty_t: "No coins yet on {c}", ex_empty_p: "Be the first: create a coin and open its reserve. Creating is free.", off_t: "Sectora Launch is not active on {c} yet", off_p: "Come back soon.",
      st_coins: "Coins", st_open: "Open reserves", st_inres: "In reserves", st_live: "Live on Uniswap", st_lp: "LP burned forever", st_burned: "SECT burned", burn_pending: "+{n} pending burn", th_raised: "Raised", th_reserve: "Reserve", th_time: "Time", s_open: "Reserve open", s_live: "Live", s_exp: "Expired", left: "{t} left",
      c_t: "Create a coin", c_s: "Your coin opens a reserve on {c}. Everyone who joins pays the same price. At {g} it goes live on Uniswap with its liquidity burned forever. If it does not fill in time, everyone gets 100 % back.",
      c_img: "Image link", c_img_h: "https:// or ipfs:// link to a square image (PNG, JPG, GIF, WebP).", c_name: "Name", c_ticker: "Ticker", c_desc: "Description", c_web: "Website", c_x: "X (Twitter)", c_tg: "Telegram",
      c_supply: "Supply", c_supply_h: "How many tokens exist, forever. The value is the same with any supply: only the price per token changes.",
      c_dur: "Reserve open for", c_dur_h: "If {g} is not reached in time, everyone takes back 100 %.", c_join: "Join your own reserve (optional)", c_join_h: "Same price as everyone, up to {cap} per wallet.",
      c_lock: "Lock my tokens 30 days for a bonus (up to +25 %)", c_lock_h: "Everything, bonus included, arrives 30 days after launch.",
      c_ack: "I understand this is a real transaction on {c} and that new coins are high risk.", c_btn: "Create on {c}", c_need_wallet: "Connect your wallet",
      c_summary: "Summary", c_target: "Reserve target", c_cap: "Max per wallet", c_rprice: "Price in the reserve", c_oprice: "Opening price on Uniswap", c_omc: "Value at opening", c_you: "You get", c_until: "Reserve closes",
      c_rules: "Rules in the contract", c_r1: "Fixed supply · no owner, no mint, no tax", c_r2: "One price for everyone in the reserve · max {cap} per wallet",
      c_r3: "Not filled by the deadline: 100 % back, no fees", c_r4: "At {g}: pool on {d} 50 % above the reserve price, LP burned forever",
      c_r5: "75 % of the tokens at launch, 25 % over 7 days · 30-day lock: everything at day 30 + bonus up to +25 %", c_r6: "Creator: 5 % over 30 days · fees only if it launches: 1 % creator, 1 % Sectora (half burned in SECT)",
      dur: ["1 hour", "6 hours", "12 hours", "1 day", "3 days", "7 days"],
      e_name: "Name: 1 to 32 characters", e_sym: "Ticker: 1 to 12 letters or numbers", e_meta: "Description and links are too long", e_img: "Image link must start with https:// or ipfs://",
      e_reserved: "This ticker imitates a well-known asset", e_similar: "Similar to an existing coin: {n}", e_supply: "Supply: a whole number from 1,000 to 1,000,000,000,000,000", e_bal: "Not enough {s} in your wallet", e_cap: "Above the maximum per wallet ({n})",
      pb_rprice: "Reserve price", pb_oprice: "Opening price", pb_now: "Price now", pb_omc: "Value at opening", pb_mc: "Market cap", pb_raised: "Raised", pb_liq: "Pool",
      r_t: "Reserve", r_p: "{r} of {g} · {n} wallets", r_closes: "Closes in {t}", r_live: "Live on {d} since {t}", r_exp_t: "This reserve expired", r_exp_p: "It did not reach its target in time. Everyone can take their SECT back, no fees.",
      j_t: "Join the reserve", j_get: "You get", j_open: "Worth at opening", j_launch: "This completes the reserve and launches the coin on {d} (a bit more gas).",
      j_swap: "Your ETH is swapped to SECT on Uniswap. SECT that does not fit is returned to you.", j_btn: "Join the reserve", j_full: "Your wallet is at the maximum for this coin.", approve_sect: "Approve {n} SECT",
      my_t: "Your seat", my_in: "In the reserve", my_lock: "30-day lock", my_yes: "Yes", my_no: "No", my_tokens: "Your tokens", my_got: "Received", my_now: "Available now",
      my_next: "The rest arrives by {d}", my_lockday: "Everything arrives on {d}", my_withdraw: "Take my SECT back", my_lockbtn: "Lock 30 days for the bonus", my_claim: "Receive tokens", my_bonus: "Bonus +{p} %",
      tab_act: "Activity", tab_shield: "Shield", tab_info: "Info", act_none: "No activity yet.", th_type: "Type", th_acct: "Wallet", th_amt: "SECT", th_tx: "Tx", act_join: "Joined", act_out: "Withdrew", act_launch: "Launched",
      t_buy: "Buy", t_sell: "Sell", t_bal: "Balance", t_you_get: "You receive", t_min: "Minimum after slippage", t_slip: "Slippage", t_btn_buy: "Buy ${s}", t_btn_sell: "Sell ${s}",
      t_approve: "Approve ${s}", t_no_tokens: "You have no ${s}", t_dex_note: "Live: trades run on {d}.", t_router_off: "In-app trading is off. Use {d}:", t_uni: "Buy with ETH on Uniswap ↗", t_chart: "Chart on DexScreener ↗",
      cr_t: "Creator", cr_fees: "Your creator fees", cr_claim: "Claim", cr_vest: "Creator tokens (5 %)", cr_vest_p: "{v} of {a} released · fully by {d}", cr_wait: "Released over 30 days after launch.",
      sh_t: "Sectora Shield", sh_score: "Contract guarantees and live checks",
      sh1: "Fixed supply", sh1d: "Minted once. No mint function exists.", sh2: "No owner, no tax", sh2d: "The token has no owner, no blacklist and no transfer fee.",
      sh3: "Liquidity locked forever", sh3d: "The LP tokens were sent to 0x…dEaD. Nobody can pull the pool.", sh3p: "At launch the LP tokens go to 0x…dEaD.",
      sh4: "One price for everyone", sh4d: "Everyone in the reserve paid the same price.", sh5: "Refund if it does not fill", sh5d: "Before launch anyone can take their SECT back; if the deadline passes, everyone does.",
      sh6: "Gradual delivery", sh6d: "75 % at launch, 25 % over 7 days. Creator: 5 % over 30 days.", sh7: "Original name", sh7d: "No similar coin found.", sh7w: "Similar to {n} — make sure it is the one you want.",
      sh8: "Ticker check", sh8d: "Does not imitate a major asset.", sh8w: "Imitates a major asset ({s}).",
      i_contract: "Contract", i_creator: "Creator", i_created: "Created", i_deadline: "Reserve deadline", i_supply: "Supply", i_pair: "Pool", i_links: "Links", i_chart: "DexScreener",
      me_t: "Your wallet", me_seats: "Your reserves and tokens", me_coins: "Coins you created", me_none: "Nothing here yet.", me_fees: "Creator fees to claim", eth_bal: "{s} balance", sect_bal: "SECT balance",
      me_in: "In reserve", me_status: "Status", me_get: "Available",
      stats_t: "Sectora Launch in numbers", soon_on: "Live on {n} network", burn_btn: "Burn pending SECT", burn_pend_l: "Pending burn",
      burn_p: "Anyone can run it: {b} % of the platform income is burned (sent to 0x…dEaD) and the rest goes to Sectora.", ok_burn: "SECT burned",
      tx_confirm: "Confirm in your wallet", tx_sent: "Transaction sent", tx_wait: "Waiting for confirmation on {c}…", tx_ok: "Confirmed",
      tx_rejected: "Transaction cancelled in the wallet.", tx_failed: "Transaction failed: {m}",
      ok_create: "Coin created", ok_join: "You joined the reserve", ok_live: "Reserve full: the coin is live on Uniswap!", ok_withdraw: "Your SECT is back", ok_lock: "Locked 30 days",
      ok_claim: "Tokens received", ok_approve: "Approved", ok_buy: "Bought {n} ${s}", ok_sell: "Sold {n} ${s}", ok_fees: "Creator fees received", ok_ctok: "Creator tokens received",
      r_closed: "This reserve is closed", r_max: "Your wallet is at the maximum for this coin", r_launched: "This coin is already live", r_slip: "Price moved more than your slippage. Try again.", r_bal: "Not enough balance", r_nothing: "Nothing to do yet"
    },
    es: {
      bonus_up: "Bonus de hasta +25 %", r_p1: "{r} de {g} · 1 wallet", 
      j_sect: "SECT por tu ETH", j_in: "Entra en la reserva", j_back: "Se te devuelve", 
      pay: "Pagar con", banner_live: "Lanzamientos justos en {n}: mismo precio para todos y 100 % de vuelta si la reserva no se llena. Todas las monedas cotizan en {s}.",
      banner_off: "Sectora Launch aún no está activo en {n}. SectoraEVM: aproximadamente el 22 de marzo de 2027.",
      sectora_soon_t: "Llega a SectoraEVM", sectora_soon_p: "Sectora Launch estará disponible en SectoraEVM aproximadamente el 22 de marzo de 2027, con la mainnet. Mientras tanto funciona con monedas reales en Ethereum, cotizadas en SECT.",
      sectora_note: "Mainnet aprox. {d}", sectora_menu: "Demo · mainnet aprox. {d}", sectora_demo: "SectoraEVM",
      w_connect: "Conectar wallet", w_choose: "Elige tu wallet", w_none_t: "No hay ninguna wallet en este navegador", w_none_p: "Abre esta página en el navegador de tu wallet o instala una extensión de wallet.",
      w_disconnect: "Desconectar", w_wrong: "Cambiar a {n}", w_addr: "Wallet", net: "Red", net_t: "Elige la red", net_live: "Activa", net_soon: "Próximamente", block: "Bloque", usd: "≈ {u}",
      ex_t: "Explorar monedas", ex_sub: "{n} monedas en {c}", ex_loading: "Cargando monedas de {c}…", ex_err: "No se pudo conectar con {c}. Reintentando…",
      ex_empty_t: "Aún no hay monedas en {c}", ex_empty_p: "Sé el primero: crea una moneda y abre su reserva. Crear es gratis.", off_t: "Sectora Launch aún no está activo en {c}", off_p: "Vuelve pronto.",
      st_coins: "Monedas", st_open: "Reservas abiertas", st_inres: "En reservas", st_live: "En Uniswap", st_lp: "LP quemado para siempre", st_burned: "SECT quemado", burn_pending: "+{n} pendiente de quemar", th_raised: "Reunido", th_reserve: "Reserva", th_time: "Tiempo", s_open: "Reserva abierta", s_live: "En Uniswap", s_exp: "Caducada", left: "quedan {t}",
      c_t: "Crear una moneda", c_s: "Tu moneda abre una reserva en {c}. Todos los que entran pagan el mismo precio. Al llegar a {g} sale a Uniswap con la liquidez quemada para siempre. Si no se llena a tiempo, a todos se les devuelve el 100 %.",
      c_img: "Enlace de la imagen", c_img_h: "Enlace https:// o ipfs:// a una imagen cuadrada (PNG, JPG, GIF, WebP).", c_name: "Nombre", c_ticker: "Ticker", c_desc: "Descripción", c_web: "Web", c_x: "X (Twitter)", c_tg: "Telegram",
      c_supply: "Supply", c_supply_h: "Cuántos tokens existen, para siempre. El valor es el mismo con cualquier supply: solo cambia el precio por token.",
      c_dur: "Reserva abierta durante", c_dur_h: "Si no se llega a {g} a tiempo, cada uno recupera el 100 %.", c_join: "Entrar en tu propia reserva (opcional)", c_join_h: "Mismo precio que todos, hasta {cap} por wallet.",
      c_lock: "Bloquear mis tokens 30 días a cambio de un bonus (hasta +25 %)", c_lock_h: "Todo, bonus incluido, llega 30 días después del lanzamiento.",
      c_ack: "Entiendo que es una transacción real en {c} y que las monedas nuevas son de alto riesgo.", c_btn: "Crear en {c}", c_need_wallet: "Conecta tu wallet",
      c_summary: "Resumen", c_target: "Objetivo de la reserva", c_cap: "Máximo por wallet", c_rprice: "Precio en la reserva", c_oprice: "Precio al abrir en Uniswap", c_omc: "Valor al abrir", c_you: "Recibes", c_until: "La reserva cierra",
      c_rules: "Reglas del contrato", c_r1: "Supply fijo · sin dueño, sin mint y sin impuestos", c_r2: "Mismo precio para todos en la reserva · máximo {cap} por wallet",
      c_r3: "Si no se llena a tiempo: 100 % de vuelta y sin comisiones", c_r4: "Al llegar a {g}: pool en {d} un 50 % por encima del precio de la reserva, LP quemado para siempre",
      c_r5: "75 % de los tokens al lanzar y 25 % en 7 días · bloqueo de 30 días: todo el día 30 + bonus de hasta +25 %", c_r6: "Creador: 5 % en 30 días · comisiones solo si se lanza: 1 % creador, 1 % Sectora (la mitad se quema en SECT)",
      dur: ["1 hora", "6 horas", "12 horas", "1 día", "3 días", "7 días"],
      e_name: "Nombre: de 1 a 32 caracteres", e_sym: "Ticker: de 1 a 12 letras o números", e_meta: "La descripción y los enlaces son demasiado largos", e_img: "El enlace de la imagen debe empezar por https:// o ipfs://",
      e_reserved: "Este ticker imita un activo conocido", e_similar: "Parecida a una moneda que ya existe: {n}", e_supply: "Supply: número entero entre 1.000 y 1.000.000.000.000.000", e_bal: "No tienes suficiente {s} en tu wallet", e_cap: "Supera el máximo por wallet ({n})",
      pb_rprice: "Precio en la reserva", pb_oprice: "Precio al abrir", pb_now: "Precio ahora", pb_omc: "Valor al abrir", pb_mc: "Cap. de mercado", pb_raised: "Reunido", pb_liq: "Pool",
      r_t: "Reserva", r_p: "{r} de {g} · {n} wallets", r_closes: "Cierra en {t}", r_live: "En {d} desde {t}", r_exp_t: "Esta reserva caducó", r_exp_p: "No llegó al objetivo a tiempo. Cada uno puede recuperar su SECT, sin comisiones.",
      j_t: "Entrar en la reserva", j_get: "Recibes", j_open: "Valor al abrir", j_launch: "Esto completa la reserva y lanza la moneda en {d} (un poco más de gas).",
      j_swap: "Tu ETH se cambia a SECT en Uniswap. El SECT que no quepa se te devuelve.", j_btn: "Entrar en la reserva", j_full: "Tu wallet ya está en el máximo para esta moneda.", approve_sect: "Aprobar {n} SECT",
      my_t: "Tu plaza", my_in: "En la reserva", my_lock: "Bloqueo de 30 días", my_yes: "Sí", my_no: "No", my_tokens: "Tus tokens", my_got: "Recibidos", my_now: "Disponibles ahora",
      my_next: "El resto llega antes del {d}", my_lockday: "Todo llega el {d}", my_withdraw: "Recuperar mi SECT", my_lockbtn: "Bloquear 30 días por el bonus", my_claim: "Recibir tokens", my_bonus: "Bonus +{p} %",
      tab_act: "Actividad", tab_shield: "Shield", tab_info: "Info", act_none: "Aún no hay actividad.", th_type: "Tipo", th_acct: "Wallet", th_amt: "SECT", th_tx: "Tx", act_join: "Entró", act_out: "Retiró", act_launch: "Lanzada",
      t_buy: "Comprar", t_sell: "Vender", t_bal: "Saldo", t_you_get: "Recibes", t_min: "Mínimo con deslizamiento", t_slip: "Deslizamiento", t_btn_buy: "Comprar ${s}", t_btn_sell: "Vender ${s}",
      t_approve: "Aprobar ${s}", t_no_tokens: "No tienes ${s}", t_dex_note: "En vivo: se opera en {d}.", t_router_off: "La compraventa en la web no está disponible. Usa {d}:", t_uni: "Comprar con ETH en Uniswap ↗", t_chart: "Gráfica en DexScreener ↗",
      cr_t: "Creador", cr_fees: "Tus comisiones de creador", cr_claim: "Cobrar", cr_vest: "Tokens del creador (5 %)", cr_vest_p: "{v} de {a} liberados · todo el {d}", cr_wait: "Se liberan durante 30 días desde el lanzamiento.",
      sh_t: "Sectora Shield", sh_score: "Garantías del contrato y comprobaciones en vivo",
      sh1: "Supply fijo", sh1d: "Se creó una sola vez. No existe función de mint.", sh2: "Sin dueño ni impuestos", sh2d: "El token no tiene dueño, lista negra ni comisión por transferencia.",
      sh3: "Liquidez bloqueada para siempre", sh3d: "Los LP se enviaron a 0x…dEaD. Nadie puede retirar el pool.", sh3p: "Al lanzar, los LP van a 0x…dEaD.",
      sh4: "Mismo precio para todos", sh4d: "Todos en la reserva pagaron el mismo precio.", sh5: "Devolución si no se llena", sh5d: "Antes del lanzamiento cualquiera puede recuperar su SECT; si pasa el plazo, todos.",
      sh6: "Entrega gradual", sh6d: "75 % al lanzar, 25 % en 7 días. Creador: 5 % en 30 días.", sh7: "Nombre original", sh7d: "No hay ninguna moneda parecida.", sh7w: "Parecida a {n}: asegúrate de que es la que buscas.",
      sh8: "Ticker", sh8d: "No imita un activo conocido.", sh8w: "Imita un activo conocido ({s}).",
      i_contract: "Contrato", i_creator: "Creador", i_created: "Creada", i_deadline: "Cierre de la reserva", i_supply: "Supply", i_pair: "Pool", i_links: "Enlaces", i_chart: "DexScreener",
      me_t: "Tu wallet", me_seats: "Tus reservas y tokens", me_coins: "Monedas que creaste", me_none: "Aún no hay nada.", me_fees: "Comisiones de creador por cobrar", eth_bal: "Saldo {s}", sect_bal: "Saldo SECT",
      me_in: "En reserva", me_status: "Estado", me_get: "Disponible",
      stats_t: "Sectora Launch en cifras", soon_on: "Activo en {n} red", burn_btn: "Ejecutar la quema pendiente", burn_pend_l: "Pendiente de quemar",
      burn_p: "Cualquiera puede ejecutarla: el {b} % de los ingresos de la plataforma se quema (se envía a 0x…dEaD) y el resto va a Sectora.", ok_burn: "SECT quemado",
      tx_confirm: "Confirma en tu wallet", tx_sent: "Transacción enviada", tx_wait: "Esperando confirmación en {c}…", tx_ok: "Confirmada",
      tx_rejected: "Transacción cancelada en la wallet.", tx_failed: "La transacción falló: {m}",
      ok_create: "Moneda creada", ok_join: "Entraste en la reserva", ok_live: "¡Reserva completa: la moneda ya está en Uniswap!", ok_withdraw: "Tu SECT ya está de vuelta", ok_lock: "Bloqueado 30 días",
      ok_claim: "Tokens recibidos", ok_approve: "Aprobado", ok_buy: "Compraste {n} ${s}", ok_sell: "Vendiste {n} ${s}", ok_fees: "Comisiones de creador cobradas", ok_ctok: "Tokens de creador recibidos",
      r_closed: "Esta reserva está cerrada", r_max: "Tu wallet ya está en el máximo para esta moneda", r_launched: "Esta moneda ya está en Uniswap", r_slip: "El precio se movió más que tu deslizamiento. Vuelve a intentarlo.", r_bal: "Saldo insuficiente", r_nothing: "Aún no hay nada que hacer"
    },
    pt: {
      bonus_up: "Bônus de até +25 %", r_p1: "{r} de {g} · 1 carteira", 
      j_sect: "SECT pelo seu ETH", j_in: "Entra na reserva", j_back: "Volta para você", 
      pay: "Pagar com", banner_live: "Lançamentos justos na {n}: mesmo preço para todos e 100 % de volta se a reserva não encher. Todas as moedas são cotadas em {s}.",
      banner_off: "O Sectora Launch ainda não está ativo na {n}. SectoraEVM: aproximadamente em 22 de março de 2027.",
      sectora_soon_t: "Chega à SectoraEVM", sectora_soon_p: "O Sectora Launch estará disponível na SectoraEVM aproximadamente em 22 de março de 2027, com a mainnet. Até lá funciona com moedas reais na Ethereum, cotadas em SECT.",
      sectora_note: "Mainnet aprox. {d}", sectora_menu: "Demo · mainnet aprox. {d}", sectora_demo: "SectoraEVM",
      w_connect: "Conectar carteira", w_choose: "Escolha sua carteira", w_none_t: "Nenhuma carteira neste navegador", w_none_p: "Abra esta página no navegador da sua carteira ou instale uma extensão de carteira.",
      w_disconnect: "Desconectar", w_wrong: "Mudar para {n}", w_addr: "Carteira", net: "Rede", net_t: "Escolha a rede", net_live: "Ativa", net_soon: "Em breve", block: "Bloco", usd: "≈ {u}",
      ex_t: "Explorar moedas", ex_sub: "{n} moedas na {c}", ex_loading: "Carregando moedas da {c}…", ex_err: "Não foi possível conectar à {c}. Tentando de novo…",
      ex_empty_t: "Ainda não há moedas na {c}", ex_empty_p: "Seja o primeiro: crie uma moeda e abra a reserva. Criar é grátis.", off_t: "O Sectora Launch ainda não está ativo na {c}", off_p: "Volte em breve.",
      st_coins: "Moedas", st_open: "Reservas abertas", st_inres: "Em reservas", st_live: "Na Uniswap", st_lp: "LP queimado para sempre", st_burned: "SECT queimado", burn_pending: "+{n} a queimar", th_raised: "Reunido", th_reserve: "Reserva", th_time: "Tempo", s_open: "Reserva aberta", s_live: "Na Uniswap", s_exp: "Expirada", left: "faltam {t}",
      c_t: "Criar uma moeda", c_s: "Sua moeda abre uma reserva na {c}. Todos que entram pagam o mesmo preço. Ao chegar a {g} ela vai para a Uniswap com a liquidez queimada para sempre. Se não encher a tempo, todos recebem 100 % de volta.",
      c_img: "Link da imagem", c_img_h: "Link https:// ou ipfs:// para uma imagem quadrada (PNG, JPG, GIF, WebP).", c_name: "Nome", c_ticker: "Ticker", c_desc: "Descrição", c_web: "Site", c_x: "X (Twitter)", c_tg: "Telegram",
      c_supply: "Supply", c_supply_h: "Quantos tokens existem, para sempre. O valor é o mesmo com qualquer supply: só muda o preço por token.",
      c_dur: "Reserva aberta por", c_dur_h: "Se não chegar a {g} a tempo, cada um recebe 100 % de volta.", c_join: "Entrar na sua própria reserva (opcional)", c_join_h: "Mesmo preço de todos, até {cap} por carteira.",
      c_lock: "Bloquear meus tokens por 30 dias em troca de um bônus (até +25 %)", c_lock_h: "Tudo, bônus incluído, chega 30 dias depois do lançamento.",
      c_ack: "Entendo que é uma transação real na {c} e que moedas novas são de alto risco.", c_btn: "Criar na {c}", c_need_wallet: "Conecte sua carteira",
      c_summary: "Resumo", c_target: "Meta da reserva", c_cap: "Máximo por carteira", c_rprice: "Preço na reserva", c_oprice: "Preço ao abrir na Uniswap", c_omc: "Valor ao abrir", c_you: "Você recebe", c_until: "A reserva fecha",
      c_rules: "Regras do contrato", c_r1: "Supply fixo · sem dono, sem mint e sem impostos", c_r2: "Mesmo preço para todos na reserva · máximo {cap} por carteira",
      c_r3: "Se não encher a tempo: 100 % de volta e sem taxas", c_r4: "Ao chegar a {g}: pool na {d} 50 % acima do preço da reserva, LP queimado para sempre",
      c_r5: "75 % dos tokens no lançamento e 25 % em 7 dias · bloqueio de 30 dias: tudo no dia 30 + bônus de até +25 %", c_r6: "Criador: 5 % em 30 dias · taxas só se lançar: 1 % criador, 1 % Sectora (metade queimada em SECT)",
      dur: ["1 hora", "6 horas", "12 horas", "1 dia", "3 dias", "7 dias"],
      e_name: "Nome: de 1 a 32 caracteres", e_sym: "Ticker: de 1 a 12 letras ou números", e_meta: "A descrição e os links são longos demais", e_img: "O link da imagem deve começar com https:// ou ipfs://",
      e_reserved: "Este ticker imita um ativo conhecido", e_similar: "Parecida com uma moeda que já existe: {n}", e_supply: "Supply: número inteiro entre 1.000 e 1.000.000.000.000.000", e_bal: "{s} insuficiente na sua carteira", e_cap: "Acima do máximo por carteira ({n})",
      pb_rprice: "Preço na reserva", pb_oprice: "Preço ao abrir", pb_now: "Preço agora", pb_omc: "Valor ao abrir", pb_mc: "Valor de mercado", pb_raised: "Reunido", pb_liq: "Pool",
      r_t: "Reserva", r_p: "{r} de {g} · {n} carteiras", r_closes: "Fecha em {t}", r_live: "Na {d} desde {t}", r_exp_t: "Esta reserva expirou", r_exp_p: "Não chegou à meta a tempo. Cada um pode recuperar seu SECT, sem taxas.",
      j_t: "Entrar na reserva", j_get: "Você recebe", j_open: "Valor ao abrir", j_launch: "Isto completa a reserva e lança a moeda na {d} (um pouco mais de gas).",
      j_swap: "Seu ETH é trocado por SECT na Uniswap. O SECT que não couber volta para você.", j_btn: "Entrar na reserva", j_full: "Sua carteira já está no máximo para esta moeda.", approve_sect: "Aprovar {n} SECT",
      my_t: "Seu lugar", my_in: "Na reserva", my_lock: "Bloqueio de 30 dias", my_yes: "Sim", my_no: "Não", my_tokens: "Seus tokens", my_got: "Recebidos", my_now: "Disponíveis agora",
      my_next: "O resto chega até {d}", my_lockday: "Tudo chega em {d}", my_withdraw: "Recuperar meu SECT", my_lockbtn: "Bloquear 30 dias pelo bônus", my_claim: "Receber tokens", my_bonus: "Bônus +{p} %",
      tab_act: "Atividade", tab_shield: "Shield", tab_info: "Info", act_none: "Ainda não há atividade.", th_type: "Tipo", th_acct: "Carteira", th_amt: "SECT", th_tx: "Tx", act_join: "Entrou", act_out: "Retirou", act_launch: "Lançada",
      t_buy: "Comprar", t_sell: "Vender", t_bal: "Saldo", t_you_get: "Você recebe", t_min: "Mínimo com slippage", t_slip: "Slippage", t_btn_buy: "Comprar ${s}", t_btn_sell: "Vender ${s}",
      t_approve: "Aprovar ${s}", t_no_tokens: "Você não tem ${s}", t_dex_note: "Ao vivo: negociado na {d}.", t_router_off: "A negociação no site não está disponível. Use a {d}:", t_uni: "Comprar com ETH na Uniswap ↗", t_chart: "Gráfico no DexScreener ↗",
      cr_t: "Criador", cr_fees: "Suas taxas de criador", cr_claim: "Resgatar", cr_vest: "Tokens do criador (5 %)", cr_vest_p: "{v} de {a} liberados · tudo em {d}", cr_wait: "Liberados ao longo de 30 dias após o lançamento.",
      sh_t: "Sectora Shield", sh_score: "Garantias do contrato e verificações ao vivo",
      sh1: "Supply fixo", sh1d: "Criado uma única vez. Não existe função de mint.", sh2: "Sem dono, sem imposto", sh2d: "O token não tem dono, lista negra nem taxa de transferência.",
      sh3: "Liquidez bloqueada para sempre", sh3d: "Os LP foram enviados para 0x…dEaD. Ninguém pode retirar o pool.", sh3p: "No lançamento os LP vão para 0x…dEaD.",
      sh4: "Mesmo preço para todos", sh4d: "Todos na reserva pagaram o mesmo preço.", sh5: "Devolução se não encher", sh5d: "Antes do lançamento qualquer um pode recuperar seu SECT; se o prazo passar, todos.",
      sh6: "Entrega gradual", sh6d: "75 % no lançamento, 25 % em 7 dias. Criador: 5 % em 30 dias.", sh7: "Nome original", sh7d: "Nenhuma moeda parecida.", sh7w: "Parecida com {n}: confira se é a que você quer.",
      sh8: "Ticker", sh8d: "Não imita um ativo conhecido.", sh8w: "Imita um ativo conhecido ({s}).",
      i_contract: "Contrato", i_creator: "Criador", i_created: "Criada", i_deadline: "Fechamento da reserva", i_supply: "Supply", i_pair: "Pool", i_links: "Links", i_chart: "DexScreener",
      me_t: "Sua carteira", me_seats: "Suas reservas e tokens", me_coins: "Moedas que você criou", me_none: "Ainda não há nada.", me_fees: "Taxas de criador a resgatar", eth_bal: "Saldo {s}", sect_bal: "Saldo SECT",
      me_in: "Na reserva", me_status: "Status", me_get: "Disponível",
      stats_t: "Sectora Launch em números", soon_on: "Ativo em {n} rede", burn_btn: "Executar a queima pendente", burn_pend_l: "A queimar",
      burn_p: "Qualquer pessoa pode executar: {b} % da receita da plataforma é queimada (enviada para 0x…dEaD) e o resto vai para a Sectora.", ok_burn: "SECT queimado",
      tx_confirm: "Confirme na sua carteira", tx_sent: "Transação enviada", tx_wait: "Aguardando confirmação na {c}…", tx_ok: "Confirmada",
      tx_rejected: "Transação cancelada na carteira.", tx_failed: "A transação falhou: {m}",
      ok_create: "Moeda criada", ok_join: "Você entrou na reserva", ok_live: "Reserva completa: a moeda já está na Uniswap!", ok_withdraw: "Seu SECT voltou", ok_lock: "Bloqueado por 30 dias",
      ok_claim: "Tokens recebidos", ok_approve: "Aprovado", ok_buy: "Você comprou {n} ${s}", ok_sell: "Você vendeu {n} ${s}", ok_fees: "Taxas de criador resgatadas", ok_ctok: "Tokens de criador recebidos",
      r_closed: "Esta reserva está fechada", r_max: "Sua carteira já está no máximo para esta moeda", r_launched: "Esta moeda já está na Uniswap", r_slip: "O preço mudou mais que seu slippage. Tente de novo.", r_bal: "Saldo insuficiente", r_nothing: "Ainda não há nada a fazer"
    }
  };
  // extra languages (zh, ru, fr, ja, ko, ar, de, hi) come from i18n/<code>.js
  function xd(L, part) { var x = window.SL_I18N && window.SL_I18N[L]; return x && x[part] || null; }
  function lt(k, v) {
    var L = X.lang(), d = LS[L] || xd(L, "live"), s = (d && d[k] != null) ? d[k] : (LS.en[k] != null ? LS.en[k] : k);
    if (v) for (var x in v) s = s.split("{" + x + "}").join(v[x]);
    return s;
  }
  // home copy for the fair model ({G} = reserve target, {CAP} = maximum per wallet, both in dollars)
  var OVR = {
    en: {
      eyebrow2: "Sectora Launch · Ethereum · SECT",
      hero_s: "Fair launches on Ethereum, priced in SECT: one price for everyone, {CAP} per wallet, 100 % back if a reserve does not fill, and liquidity locked forever on Uniswap. Pay with ETH or SECT.",
      hf1: "One price · max {CAP}", hf2: "LP burned forever", hf3: "100 % back if it does not fill",
      film_s: "A quick look at Sectora Launch, Shield and the SECT burn, in 34 seconds.",
      tab_trend: "Top raised", tab_soon: "Almost full", tab_grad: "Live",
      st1_t: "Create your coin", st1_p: "Free. Name, ticker, image and links; you choose the supply and how long the reserve stays open (1 hour to 7 days). No owner, no mint, no tax.",
      st2_t: "Join the reserve", st2_p: "Everyone pays the same price, up to {CAP} per wallet. You can take your SECT back at any time before launch.",
      st3_t: "Reach {G}", st3_p: "When the reserve reaches {G} in SECT, the coin launches at once. If time runs out first, everyone gets 100 % back.",
      st4_t: "Live on Uniswap", st4_p: "98 % of the reserve becomes a COIN/SECT pool that opens 50 % above the reserve price, with the LP burned at 0x…dEaD.",
      sc_creator: "Creator share", sc_launch: "Create coin", sc_fair: "Reserve · one price", sc_cap: "max. {CAP} per wallet", sc_blocked: "over the max",
      sc_raised: "SECT in the reserve", sc_grad: "Launched", sc_dex: "Uniswap",
      w1_t: "One price for everyone", w1_p: "Everyone in a reserve pays exactly the same price. No first-block bots, no early-buyer edge.", w1_v: "Elsewhere: whoever buys first gets the best price and sells to the rest.",
      w2_t: "Max {CAP} per wallet", w2_p: "Each wallet can put at most {CAP} in a reserve, so no whale can take most of a coin.", w2_v: "Elsewhere: one wallet can buy a large part of the supply.",
      w3_p: "Before launch the SECT sits in the reserve contract; at launch the Uniswap LP tokens are burned forever.",
      w4_t: "Fees only if it launches", w4_p: "Creating is free. If a reserve launches, 1 % goes to the creator and 1 % to Sectora, half of it burned in SECT. If it does not launch, nobody pays anything.", w4_v: "Elsewhere: fees on every trade, win or lose.",
      w5_t: "100 % back if it does not fill", w5_p: "If the reserve does not reach its target in time, everyone takes back all their SECT. Before launch anyone can leave at any time.", w5_v: "Elsewhere: if a coin does not graduate, the money stays in the curve.",
      w6_p: "Automatic checks on every coin: fixed supply, burned liquidity, gradual delivery and copycat names.",
      w7_p: "Everything in SECT with its dollar value next to it, from live market data.",
      w9_t: "Every coin drives SECT", w9_p: "Every reserve is filled with SECT, and at launch 98 % of it is locked forever in the pool. Half of the platform income is burned.", w9_v: "Elsewhere: fees that never touch the project token.",
      h1_p: "Free. Name, ticker, image, links, supply and how long the reserve stays open.",
      h2_t: "Join the reserve", h2_p: "Same price for everyone, max {CAP} per wallet, leave any time before launch.",
      h3_t: "Launch", h3_p: "At {G} the coin goes live on Uniswap, 50 % above the reserve price, with the LP burned forever.",
      h4_t: "Gradual delivery", h4_p: "75 % of the tokens at launch and 25 % over 7 days, or everything at day 30 with a bonus of up to +25 %.",
      f_tag: "Fair coin launches on Ethereum, priced in SECT.",
      lg8_p: "On the SectoraEVM testnet, SECT and test coins have no value. On Ethereum, coins are real and every reserve and trade moves real funds.",
      footer_l: "Sectora Launch · real coins on Ethereum, priced in SECT. SectoraEVM approx. 22 March 2027. Not financial advice: new coins are high risk.",
      end_s: "Sectora Launch arrives on SectoraEVM approximately on 22 March 2027. Today it already runs on Ethereum with real coins priced in SECT."
    },
    es: {
      eyebrow2: "Sectora Launch · Ethereum · SECT",
      hero_s: "Lanzamientos justos en Ethereum, cotizados en SECT: mismo precio para todos, {CAP} por wallet, 100 % de vuelta si la reserva no se llena y liquidez bloqueada para siempre en Uniswap. Paga con ETH o con SECT.",
      hf1: "Mismo precio · máx. {CAP}", hf2: "LP quemado para siempre", hf3: "100 % de vuelta si no se llena",
      film_s: "Un vistazo a Sectora Launch, Shield y la quema de SECT, en 34 segundos.",
      tab_trend: "Más reunido", tab_soon: "Casi llenas", tab_grad: "En Uniswap",
      st1_t: "Crea tu moneda", st1_p: "Gratis. Nombre, ticker, imagen y enlaces; tú eliges el supply y cuánto tiempo está abierta la reserva (de 1 hora a 7 días). Sin dueño, sin mint y sin impuestos.",
      st2_t: "Entra en la reserva", st2_p: "Todos pagan el mismo precio, hasta {CAP} por wallet. Puedes recuperar tu SECT en cualquier momento antes del lanzamiento.",
      st3_t: "Llega a {G}", st3_p: "Cuando la reserva llega a {G} en SECT, la moneda se lanza al momento. Si se acaba el tiempo antes, a todos se les devuelve el 100 %.",
      st4_t: "En Uniswap", st4_p: "El 98 % de la reserva forma un pool MONEDA/SECT que abre un 50 % por encima del precio de la reserva, con el LP quemado en 0x…dEaD.",
      sc_creator: "Parte del creador", sc_launch: "Crear moneda", sc_fair: "Reserva · mismo precio", sc_cap: "máx. {CAP} por wallet", sc_blocked: "supera el máximo",
      sc_raised: "SECT en la reserva", sc_grad: "Lanzada", sc_dex: "Uniswap",
      w1_t: "Mismo precio para todos", w1_p: "Todos los que entran en una reserva pagan exactamente el mismo precio. Sin bots en el primer bloque y sin ventaja por llegar antes.", w1_v: "En otras: el primero que compra consigue el mejor precio y vende a los demás.",
      w2_t: "Máximo {CAP} por wallet", w2_p: "Cada wallet puede poner como máximo {CAP} en una reserva, así ninguna ballena se queda con casi toda la moneda.", w2_v: "En otras: una sola wallet puede comprar gran parte del supply.",
      w3_p: "Antes del lanzamiento el SECT está en el contrato de la reserva; al lanzar, los LP de Uniswap se queman para siempre.",
      w4_t: "Comisiones solo si se lanza", w4_p: "Crear es gratis. Si una reserva se lanza, el 1 % va al creador y el 1 % a Sectora, de la que la mitad se quema en SECT. Si no se lanza, nadie paga nada.", w4_v: "En otras: comisiones en cada operación, se gane o se pierda.",
      w5_t: "100 % de vuelta si no se llena", w5_p: "Si la reserva no llega a su objetivo a tiempo, cada uno recupera todo su SECT. Antes del lanzamiento cualquiera puede salir cuando quiera.", w5_v: "En otras: si la moneda no se gradúa, el dinero se queda en la curva.",
      w6_p: "Comprobaciones automáticas en cada moneda: supply fijo, liquidez quemada, entrega gradual y nombres copiados.",
      w7_p: "Todo en SECT con su valor en dólares al lado, con datos reales del mercado.",
      w9_t: "Cada moneda impulsa SECT", w9_p: "Todas las reservas se llenan con SECT y, al lanzar, el 98 % queda bloqueado para siempre en el pool. La mitad de los ingresos de la plataforma se quema.", w9_v: "En otras: comisiones que nunca tocan el token del proyecto.",
      h1_p: "Gratis. Nombre, ticker, imagen, enlaces, supply y cuánto tiempo está abierta la reserva.",
      h2_t: "Entra en la reserva", h2_p: "Mismo precio para todos, máximo {CAP} por wallet, puedes salir cuando quieras antes del lanzamiento.",
      h3_t: "Lanzamiento", h3_p: "Al llegar a {G} la moneda sale a Uniswap, un 50 % por encima del precio de la reserva, con el LP quemado para siempre.",
      h4_t: "Entrega gradual", h4_p: "El 75 % de los tokens al lanzar y el 25 % en 7 días, o todo el día 30 con un bonus de hasta +25 %.",
      f_tag: "Lanzamientos justos de monedas en Ethereum, cotizadas en SECT.",
      lg8_p: "En la testnet de SectoraEVM el SECT y las monedas de prueba no tienen valor. En Ethereum las monedas son reales y cada reserva y operación mueve fondos reales.",
      footer_l: "Sectora Launch · monedas reales en Ethereum cotizadas en SECT. SectoraEVM aprox. el 22 de marzo de 2027. No es asesoramiento financiero: las monedas nuevas son de alto riesgo.",
      end_s: "Sectora Launch llegará a SectoraEVM aproximadamente el 22 de marzo de 2027. Hoy ya funciona en Ethereum con monedas reales cotizadas en SECT."
    },
    pt: {
      eyebrow2: "Sectora Launch · Ethereum · SECT",
      hero_s: "Lançamentos justos na Ethereum, cotados em SECT: mesmo preço para todos, {CAP} por carteira, 100 % de volta se a reserva não encher e liquidez bloqueada para sempre na Uniswap. Pague com ETH ou SECT.",
      hf1: "Mesmo preço · máx. {CAP}", hf2: "LP queimado para sempre", hf3: "100 % de volta se não encher",
      film_s: "Uma visão rápida do Sectora Launch, do Shield e da queima de SECT, em 34 segundos.",
      tab_trend: "Mais reunido", tab_soon: "Quase cheias", tab_grad: "Na Uniswap",
      st1_t: "Crie sua moeda", st1_p: "Grátis. Nome, ticker, imagem e links; você escolhe o supply e por quanto tempo a reserva fica aberta (de 1 hora a 7 dias). Sem dono, sem mint e sem impostos.",
      st2_t: "Entre na reserva", st2_p: "Todos pagam o mesmo preço, até {CAP} por carteira. Você pode recuperar seu SECT a qualquer momento antes do lançamento.",
      st3_t: "Chegue a {G}", st3_p: "Quando a reserva chega a {G} em SECT, a moeda é lançada na hora. Se o tempo acabar antes, todos recebem 100 % de volta.",
      st4_t: "Na Uniswap", st4_p: "98 % da reserva vira um pool MOEDA/SECT que abre 50 % acima do preço da reserva, com o LP queimado em 0x…dEaD.",
      sc_creator: "Parte do criador", sc_launch: "Criar moeda", sc_fair: "Reserva · mesmo preço", sc_cap: "máx. {CAP} por carteira", sc_blocked: "acima do máximo",
      sc_raised: "SECT na reserva", sc_grad: "Lançada", sc_dex: "Uniswap",
      w1_t: "Mesmo preço para todos", w1_p: "Todos numa reserva pagam exatamente o mesmo preço. Sem bots no primeiro bloco e sem vantagem por chegar antes.", w1_v: "Em outras: quem compra primeiro tem o melhor preço e vende para os outros.",
      w2_t: "Máximo {CAP} por carteira", w2_p: "Cada carteira pode colocar no máximo {CAP} numa reserva, então nenhuma baleia fica com quase toda a moeda.", w2_v: "Em outras: uma só carteira pode comprar grande parte do supply.",
      w3_p: "Antes do lançamento o SECT fica no contrato da reserva; no lançamento os LP da Uniswap são queimados para sempre.",
      w4_t: "Taxas só se lançar", w4_p: "Criar é grátis. Se uma reserva é lançada, 1 % vai para o criador e 1 % para a Sectora, metade queimada em SECT. Se não lançar, ninguém paga nada.", w4_v: "Em outras: taxas em cada operação, ganhando ou perdendo.",
      w5_t: "100 % de volta se não encher", w5_p: "Se a reserva não chega à meta a tempo, cada um recupera todo o seu SECT. Antes do lançamento qualquer um pode sair quando quiser.", w5_v: "Em outras: se a moeda não se gradua, o dinheiro fica na curva.",
      w6_p: "Verificações automáticas em cada moeda: supply fixo, liquidez queimada, entrega gradual e nomes copiados.",
      w7_p: "Tudo em SECT com o valor em dólares ao lado, com dados reais do mercado.",
      w9_t: "Cada moeda impulsiona o SECT", w9_p: "Todas as reservas são preenchidas com SECT e, no lançamento, 98 % fica bloqueado para sempre no pool. Metade da receita da plataforma é queimada.", w9_v: "Em outras: taxas que nunca tocam o token do projeto.",
      h1_p: "Grátis. Nome, ticker, imagem, links, supply e por quanto tempo a reserva fica aberta.",
      h2_t: "Entre na reserva", h2_p: "Mesmo preço para todos, máximo {CAP} por carteira, saia quando quiser antes do lançamento.",
      h3_t: "Lançamento", h3_p: "Ao chegar a {G} a moeda vai para a Uniswap, 50 % acima do preço da reserva, com o LP queimado para sempre.",
      h4_t: "Entrega gradual", h4_p: "75 % dos tokens no lançamento e 25 % em 7 dias, ou tudo no dia 30 com um bônus de até +25 %.",
      f_tag: "Lançamentos justos de moedas na Ethereum, cotadas em SECT.",
      lg8_p: "Na testnet da SectoraEVM, o SECT e as moedas de teste não têm valor. Na Ethereum as moedas são reais e cada reserva e operação movimenta fundos reais.",
      footer_l: "Sectora Launch · moedas reais na Ethereum cotadas em SECT. SectoraEVM aprox. 22 de março de 2027. Não é aconselhamento financeiro: moedas novas são de alto risco.",
      end_s: "O Sectora Launch chega à SectoraEVM aproximadamente em 22 de março de 2027. Hoje já funciona na Ethereum com moedas reais cotadas em SECT."
    }
  };
  // reserve target and per-wallet maximum in dollars, from the deployed contract (defaults until it answers)
  function usdSizes() {
    var k = liveChains()[0], cf = k && chainState(k).cfg;
    return { g: cf && cf.targetUsd > 0 ? cf.targetUsd : 15000, cap: cf && cf.capUsd > 0 ? cf.capUsd : 500 };
  }
  function dollars(n) { return "$" + X.nf(n, 0); }
  function override(k) {
    var L = X.lang(), d = OVR[L] || xd(L, "ovr"), s = (d && d[k] != null) ? d[k] : (OVR.en[k] != null ? OVR.en[k] : null);
    if (s == null) return null;
    var z = usdSizes();
    return s.split("{G}").join(dollars(z.g)).split("{CAP}").join(dollars(z.cap));
  }
  /* ------------------------------------------------------------------ formatting */
  function fx(b) { try { return Number(E.formatEther(b || 0n)); } catch (e) { return 0; } }
  function amt(n, s) { return (n >= 1e4 ? X.compact(n) : X.nf(n, n >= 100 ? 2 : n >= 1 ? 4 : 6)) + (s ? " " + s : ""); }
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
  function quoteEth(k, wei) { if (CHAINS[k].native) return Promise.resolve(wei); return withRpc(k, function (p) { return new E.Contract(CHAINS[k].quoter, QUOTER_ABI, p).quoteExactInput.staticCall(pathBytes(k), wei); }).then(function (r) { return r[0]; }); }
  var RATE = {};
  function loadRate(k) {
    if (CHAINS[k].native) { RATE[k] = { r: 1, at: Date.now() }; return Promise.resolve(1); }
    if (RATE[k] && Date.now() - RATE[k].at < 60000) return Promise.resolve(RATE[k].r);
    return quoteEth(k, E.parseEther("0.01")).then(function (out) { RATE[k] = { r: fx(out) / 0.01, at: Date.now() }; return RATE[k].r; });
  }
  var PAIR_ABI = ["function getReserves() view returns (uint112, uint112, uint32)", "function token0() view returns (address)"];

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
    var toks = ch.native ? [ch.wnative] : [ch.qaddr, ch.wnative];
    return Promise.all(toks.map(get)).then(function (r) {
      var q = bestUsd(r[0].pairs, toks[0], ch.ds), e = bestUsd(r[r.length - 1].pairs, ch.wnative, ch.ds);
      if (q > 0) NUSD[k].p = q;
      if (e > 0) NUSD[k].eth = e;
      X.refreshLive && X.refreshLive("usd");
    }).catch(function () {});
  }
  function ethUsd(k, n) { var p = NUSD[k] && NUSD[k].eth; if (!(p > 0) || !(n >= 0)) return ""; var v = n * p; return "$" + X.nf(v, v >= 1000 ? 0 : 2); }

  /* ------------------------------------------------------------------ data */
  var D = {};   // per network: { cfg, coins, count, at, loading, err, block, fees, burned }
  var TD = {};  // per coin: { c, acts, pool, mine, at, loading, err }
  var ME = {};  // per network: { native, sect, qAllow, fees, seats, at }
  var BT = {};  // block timestamps, per network
  var IF = new E.Interface(ABI.factory);
  var ACT_TOPICS = [IF.getEvent("Contributed").topicHash, IF.getEvent("Withdrawn").topicHash, IF.getEvent("Launched").topicHash];
  function chainState(k) { return D[k] || (D[k] = { coins: [], count: 0, at: 0, loading: false, err: "", cfg: null, block: 0 }); }
  // the chain's own clock (block timestamps), so deadlines match the contract exactly
  function chainNow(k) { var sk = D[k] && D[k].skew; return Date.now() + (Math.abs(sk) > 2000 ? sk : 0); }
  function mapCoin(v) {
    var sup = v.supply, res = resTokens(sup), pool = poolTokens(sup), tgt = fx(v.target);
    return {
      addr: E.getAddress(v.token), name: String(v.name), sym: String(v.symbol), meta: parseMeta(v.meta), creator: E.getAddress(v.creator),
      created: Number(v.createdAt) * 1000, deadline: Number(v.deadline) * 1000, launched: Number(v.launchedAt) * 1000,
      wallets: Number(v.contributors), pair: v.pair, supply: sup, target: v.target, cap: v.cap, raised: v.raised, lockedRaised: v.lockedRaised,
      bonus: fx(v.bonusRate), creatorClaimed: v.creatorClaimed, res: res, pool: pool,
      rprice: tgt / fx(res),            // SECT per token, the same for everyone in the reserve
      oprice: tgt * 0.98 / fx(pool)     // SECT per token when the pool opens (98 % of the reserve, +50 %)
    };
  }
  function statusOf(k, c) { return c.launched ? "live" : chainNow(k) >= c.deadline ? "exp" : "open"; }
  function progressOf(c) { var t = fx(c.target); return c.launched ? 1 : t > 0 ? Math.min(1, fx(c.raised) / t) : 0; }

  // sizes for a coin created now follow the 30-minute oracle price, so they are re-read every minute
  function loadCfg(k) {
    var st = chainState(k);
    if (st.cfg && Date.now() - st.cfg.at < 60000) return Promise.resolve(st.cfg);
    if (!st.cfgLoading) {
      st.cfgLoading = withRpc(k, function (p) {
        var f = fac(k, p);
        return Promise.all([f.sizesNow(), f.quoteUsdPrice(), f.burnShareBps(), f.targetUsd(), f.capUsd()]);
      }).then(function (r) {
        st.cfg = { target: r[0][0], cap: r[0][1], px: fx(r[1]), burn: Number(r[2]), targetUsd: fx(r[3]), capUsd: fx(r[4]), at: Date.now() };
        // dollar values come from DexScreener; until it answers, the contract's own 30-minute SECT price is used
        if (st.cfg.px > 0) { NUSD[k] = NUSD[k] || { p: 0, eth: 0, at: 0 }; if (!(NUSD[k].p > 0)) NUSD[k].p = st.cfg.px; }
        st.cfgLoading = null; return st.cfg;
      }, function (err) { st.cfgLoading = null; if (st.cfg) return st.cfg; throw err; });
    }
    return st.cfg ? Promise.resolve(st.cfg) : st.cfgLoading;
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
  function loadToken(k, addr, force) {
    var key = k + ":" + addr, td = TD[key] || (TD[key] = { c: null, acts: [], at: 0, loading: null, err: "", from: 0, pool: null, missing: false, mine: null });
    if (td.loading) return td.loading;
    if (!force && td.at && Date.now() - td.at < 8000) return Promise.resolve(td);
    td.loading = loadCfg(k).then(function () {
      return withRpc(k, function (p) { return Promise.all([fac(k, p).coinView(addr), p.getBlock("latest")]); });
    }).then(function (r) {
      var v = r[0], latest = r[1].number;
      chainState(k).skew = r[1].timestamp * 1000 - Date.now();
      if (v.creator === E.ZeroAddress) { td.missing = true; td.loading = null; td.at = Date.now(); return td; }
      td.c = mapCoin(v);
      var jobs = [loadActs(k, td, latest)];
      if (td.c.launched && td.c.pair !== E.ZeroAddress) jobs.push(loadPool(k, td));
      if (W.addr) jobs.push(loadMine(k, td));
      return Promise.all(jobs).then(function () { td.at = Date.now(); td.err = ""; td.loading = null; return td; });
    }).catch(function (err) { td.loading = null; td.err = String((err && (err.shortMessage || err.message)) || err); throw err; });
    return td.loading;
  }
  // reserve activity from the contract's own events (joins, withdrawals and the launch), newest first
  function loadActs(k, td, latest) {
    var ch = CHAINS[k], chunk = ch.chunk || 5000, maxChunks = 10, c = td.c;
    // blocks are at least 12 s apart on Ethereum, so this never starts after the coin was created
    var est = Math.max(0, latest - Math.ceil((chainNow(k) - c.created) / 12000) - 20);
    var start = td.lastBlock ? td.lastBlock + 1 : Math.max(est, latest - chunk * maxChunks + 1);
    if (start > latest) return Promise.resolve();
    var ranges = [];
    for (var to = latest; to >= start; to -= chunk) ranges.push([Math.max(start, to - chunk + 1), to]);
    return Promise.all(ranges.map(function (rg) {
      return withRpc(k, function (p) { return p.getLogs({ address: factoryOf(k), fromBlock: rg[0], toBlock: rg[1], topics: [ACT_TOPICS, E.zeroPadValue(c.addr, 32)] }); }).catch(function () { return []; });
    })).then(function (lists) {
      var fresh = [];
      lists.forEach(function (l) { l.forEach(function (lg) {
        var ev; try { ev = IF.parseLog(lg); } catch (e) { return; }
        if (!ev) return;
        var a = ev.args, x = { h: lg.transactionHash, b: lg.blockNumber, i: lg.index };
        if (ev.name === "Contributed") { x.kind = "join"; x.who = a.account; x.n = fx(a.amount); x.lock = a.locked; }
        else if (ev.name === "Withdrawn") { x.kind = "out"; x.who = a.account; x.n = fx(a.amount); }
        else { x.kind = "launch"; x.who = a.pair; x.n = fx(a.poolQuote); }
        fresh.push(x);
      }); });
      var seen = {}; td.acts.forEach(function (x) { seen[x.h + ":" + x.i] = 1; });
      fresh.forEach(function (x) { if (!seen[x.h + ":" + x.i]) td.acts.push(x); });
      td.acts.sort(function (a, b) { return b.b - a.b || b.i - a.i; });
      if (!td.from) td.from = start;
      td.lastBlock = latest;
      return blockTimes(k, td.acts.slice(0, 40));
    });
  }
  function blockTimes(k, list) {
    var bt = BT[k] || (BT[k] = {}), need = [];
    list.forEach(function (x) { if (bt[x.b] == null && need.indexOf(x.b) < 0) need.push(x.b); });
    return Promise.all(need.slice(0, 30).map(function (b) {
      return withRpc(k, function (p) { return p.getBlock(b); }).then(function (blk) { if (blk) bt[b] = blk.timestamp * 1000; }, function () {});
    }));
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
    var me = W.addr, c = td.c, ch = CHAINS[k];
    return withRpc(k, function (p) {
      var f = fac(k, p), q = qC(k, p), t = tokC(c.addr, p);
      return Promise.all([p.getBalance(me), q.balanceOf(me), q.allowance(me, factoryOf(k)), f.seatView(c.addr, me), t.balanceOf(me),
        f.creatorFees(me), f.creatorClaimable(c.addr), q.allowance(me, ch.router), t.allowance(me, ch.router)]);
    }).then(function (r) {
      if (W.addr !== me) return;
      td.mine = { addr: me, native: r[0], sect: r[1], qAllow: r[2], seat: { amount: r[3][0], locked: r[3][1], claimed: r[3][2], claimable: r[3][3] },
        bal: r[4], cfees: r[5], cclaim: r[6], qAllowR: r[7], tAllowR: r[8] };
      var ms = meState(k); ms.native = r[0]; ms.sect = r[1]; ms.qAllow = r[2];
    }).catch(function () {});
  }
  function meState(k) { return ME[k] || (ME[k] = { native: null, sect: null, qAllow: null, at: 0, fees: 0n, seats: {} }); }
  function loadMe(k) {
    var ms = meState(k);
    if (!W.addr || !deployed(k)) return Promise.resolve(ms);
    var me = W.addr;
    return loadChain(k).then(function (st) {
      var coins = st.coins.slice(0, 60);
      return withRpc(k, function (p) {
        var f = fac(k, p), q = qC(k, p);
        return Promise.all([p.getBalance(me), f.creatorFees(me), q.balanceOf(me), q.allowance(me, factoryOf(k))].concat(coins.map(function (c) { return f.seatView(c.addr, me).catch(function () { return null; }); })));
      }).then(function (r) {
        if (W.addr !== me) return ms;
        ms.native = r[0]; ms.fees = r[1]; ms.sect = r[2]; ms.qAllow = r[3]; ms.seats = {};
        coins.forEach(function (c, i) { var s = r[4 + i]; if (s && s[0] > 0n) ms.seats[c.addr] = { amount: s[0], locked: s[1], claimed: s[2], claimable: s[3] }; });
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
    if (/reserve closed/i.test(s)) return lt("r_closed");
    if (/wallet maximum/i.test(s)) return lt("r_max");
    if (/SF: launched/i.test(s)) return lt("r_launched");
    if (/slippage|INSUFFICIENT_OUTPUT|Too little received/i.test(s)) return lt("r_slip");
    if (/insufficient funds|SF: balance|transfer amount exceeds/i.test(s)) return lt("r_bal");
    if (/nothing to/i.test(s)) return lt("r_nothing");
    return s.replace(/^execution reverted:?\s*/i, "").replace(/^SF:\s*/, "").slice(0, 160);
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
    return '<span class="sl-dot" style="color:var(--live)"></span><span>' + X.esc(deployed(net) ? lt("banner_live", { n: n, s: CHAINS[net].qs }) : lt("banner_off", { n: n })) + "</span>";
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

  /* ------------------------------------------------------------------ home */
  var ui = { tab: "trend", q: "", side: "buy", ctab: "act", slip: 3, pay: "eth", amt: "", lock: false };
  function fdur(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    if (s >= 86400) return Math.floor(s / 86400) + " d " + Math.floor((s % 86400) / 3600) + " h";
    return X.dur(s * 1000);
  }
  // "… ago" measured on the chain's clock
  function agoC(k, ts) { return X.ago(ts - (chainNow(k) - Date.now())); }
  function whenTxt(k, c) {
    var s = statusOf(k, c);
    return s === "open" ? lt("left", { t: fdur(c.deadline - chainNow(k)) }) : agoC(k, s === "live" ? c.launched : c.deadline);
  }
  function progCell(k, c) {
    var s = statusOf(k, c), pr = progressOf(c);
    if (s === "live") return '<div class="sl-pcell"><div class="sl-prog is-done"><i style="width:100%"></i></div><b>' + X.esc(CHAINS[k].dex) + "</b></div>";
    return '<div class="sl-pcell"><div class="sl-prog' + (s === "exp" ? " is-exp" : "") + '"><i style="width:' + (pr * 100).toFixed(1) + '%"></i></div><b>' + (s === "exp" ? X.esc(lt("s_exp")) : X.nf(pr * 100, 1) + " %") + "</b></div>";
  }
  function coinRow(k, c, i, extra) {
    var ch = CHAINS[k], href = "#/t/" + k + "/" + c.addr, raised = fx(c.raised);
    return '<tr data-go="' + href + '"><td class="rk">' + (i + 1) + '</td><td><div class="sl-coin">' + logoTag(c, "sl-logo") + '<div><b><a href="' + href + '">' + X.esc(c.name) + "</a></b><span>$" + X.esc(c.sym) + "</span></div></div></td>" +
      (extra != null ? '<td class="r num">' + extra + "</td>" : "") +
      '<td class="r num sl-hide-sm">' + X.fmtPrice(c.rprice) + ' <span class="faint">' + X.esc(ch.qs) + "</span></td>" +
      '<td class="r num">' + X.esc(amt(raised, ch.qs)) + '<span class="usd">' + (X.esc(usdOf(k, raised)) || "&nbsp;") + "</span></td>" +
      "<td>" + progCell(k, c) + "</td>" +
      '<td class="r num sl-hide-sm dim">' + X.esc(whenTxt(k, c)) + "</td></tr>";
  }
  function coinTable(k, list, extraHead, extraFn) {
    return '<div class="sl-table-wrap"><table class="sl-table"><thead><tr><th class="rk">#</th><th>' + X.esc(X.t("th_coin")) + "</th>" + (extraHead ? '<th class="r">' + X.esc(extraHead) + "</th>" : "") +
      '<th class="r sl-hide-sm">' + X.esc(lt("pb_rprice")) + '</th><th class="r">' + X.esc(lt("th_raised")) + "</th><th>" + X.esc(lt("th_reserve")) + '</th><th class="r sl-hide-sm">' + X.esc(lt("th_time")) + "</th></tr></thead><tbody>" +
      list.map(function (c, i) { return coinRow(k, c, i, extraFn ? extraFn(c) : null); }).join("") + "</tbody></table></div>";
  }
  function filtered(k) {
    var st = chainState(k), q = ui.q.trim().toLowerCase(), cs = st.coins.slice();
    if (q) cs = cs.filter(function (c) { return (c.name + " " + c.sym + " " + c.addr).toLowerCase().indexOf(q) >= 0; });
    if (ui.tab === "new") cs.sort(function (a, b) { return b.created - a.created; });
    else if (ui.tab === "soon") cs = cs.filter(function (c) { return statusOf(k, c) === "open"; }).sort(function (a, b) { return progressOf(b) - progressOf(a) || a.deadline - b.deadline; });
    else if (ui.tab === "grad") cs = cs.filter(function (c) { return c.launched; }).sort(function (a, b) { return b.launched - a.launched; });
    else cs.sort(function (a, b) { return fx(b.raised) - fx(a.raised) || b.created - a.created; });
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
      return '<button class="sl-netpill' + (k === net ? " on" : "") + '" data-a="setnet" data-v="' + k + '"' + (on ? "" : " disabled") + ">" + chainDot(k) + X.esc(CHAINS[k].name) + (on ? "" : " <em>" + X.esc(lt("net_soon")) + "</em>") + "</button>";
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
  function counts(k) {
    var st = chainState(k), r = { open: 0, live: 0, inres: 0 };
    st.coins.forEach(function (c) { var s = statusOf(k, c); if (s === "live") r.live++; else { if (s === "open") r.open++; r.inres += fx(c.raised); } });
    return r;
  }
  function statTiles(net) {
    var st = chainState(net), ch = CHAINS[net], n = counts(net);
    var burned = fx(st.burned || 0n), cf = st.cfg, pending = cf ? fx(st.fees || 0n) * cf.burn / 10000 : 0;
    var tiles = [
      [lt("net"), ch.name, ch.qs + " · " + (deployed(net) ? lt("net_live") : lt("net_soon")), "is-net"],
      [lt("st_coins"), X.nf(st.count || 0, 0), "", ""],
      [lt("st_open"), X.nf(n.open, 0), lt("st_inres") + " · " + amt(n.inres, ch.qs), ""],
      [lt("st_live"), X.nf(n.live, 0), lt("st_lp"), ""],
      [lt("st_burned"), amt(burned, ch.qs), pending > 0 ? lt("burn_pending", { n: amt(pending, ch.qs) }) : usdOf(net, burned), ""]
    ];
    return '<div class="sl-stats is-live" id="slLStats"' + (st.count ? "" : ' style="display:none"') + ">" + tiles.map(function (x) {
      var parts = String(x[1]).split(" "), big = x[3] === "is-net" ? X.esc(x[1]) : X.esc(parts[0]) + (parts[1] ? "<small>" + X.esc(parts.slice(1).join(" ")) + "</small>" : "");
      return '<div class="sl-stat ' + x[3] + '"><span class="lbl">' + X.esc(x[0]) + '</span><b class="big">' + big + '</b><span class="sub">' + (x[2] ? X.esc(x[2]) : "&nbsp;") + "</span></div>";
    }).join("") + "</div>";
  }
  function hud(net) {
    var st = chainState(net);
    return X.esc(CHAINS[net].name) + " · " + X.esc(lt("block")) + ' <b class="num" id="slBlk">' + (st.block ? X.nf(st.block, 0) : "—") + "</b>";
  }
  // the SECT a reserve needs today, for the "how it works" animation
  function storyRaise(net) { var cf = isLive(net) && chainState(net).cfg; return cf ? Math.round(fx(cf.target)) : 0; }

  /* ------------------------------------------------------------------ create */
  var SUPPLIES = [["1M", "1000000"], ["100M", "100000000"], ["1B", "1000000000"], ["10B", "10000000000"], ["1T", "1000000000000"]];
  function newDraft(pay) { return { name: "", sym: "", desc: "", img: "", web: "", x: "", tg: "", supply: "1000000000", dur: 3, join: "", lock: false, ack: false, pay: pay || "eth", touched: {} }; }
  var draft = newDraft();
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
  // whole tokens, 1,000 … 10^15, as the contract requires
  function supplyWei() {
    var d = String(draft.supply || "").replace(/[^0-9]/g, "").replace(/^0+/, "");
    if (!d || d.length > 16) return null;
    var n = BigInt(d);
    if (n < 1000n || n > 1000000000000000n) return null;
    return n * 10n ** 18n;
  }
  function rateOf(k) { return RATE[k] ? RATE[k].r : 0; }
  // the creator's optional seat, in SECT (paying with ETH it is an estimate at the live swap rate)
  function joinPlan(k) {
    var cf = chainState(k).cfg, v = X.num(draft.join), r = rateOf(k);
    if (!(v > 0)) return { v: 0, sect: 0, eth: draft.pay === "eth", ready: !!cf };
    var sect = draft.pay === "eth" ? v * r : v;
    return { v: v, sect: sect, eth: draft.pay === "eth", ready: !!(cf && (draft.pay !== "eth" || r)) };
  }
  function createErrors(k) {
    var e = {}, nb = utf8len(draft.name.trim()), sb = draft.sym.length, ch = CHAINS[k], cf = chainState(k).cfg;
    if (!nb || nb > 32) e.name = lt("e_name");
    if (!sb || sb > 12) e.sym = lt("e_sym");
    else if (RESERVED.indexOf(draft.sym) >= 0) e.sym = lt("e_reserved");
    if (draft.img.trim() && !safeImg(draft.img)) e.img = lt("e_img");
    if (utf8len(metaJson()) > 1024) e.meta = lt("e_meta");
    if (!supplyWei()) e.supply = lt("e_supply");
    var jp = joinPlan(k), ms = meState(k);
    if (jp.v > 0 && cf && jp.ready && jp.sect > fx(cf.cap) * (jp.eth ? 1.02 : 1)) e.join = lt("e_cap", { n: amt(fx(cf.cap), ch.qs) });
    if (jp.v > 0 && W.addr) {
      if (jp.eth && ms.native != null && jp.v > fx(ms.native)) e.join = lt("e_bal", { s: ch.sym });
      if (!jp.eth && ms.sect != null && jp.v > fx(ms.sect)) e.join = lt("e_bal", { s: ch.qs });
    }
    return e;
  }
  function kv(label, val, sub) { return '<div class="sl-kv"><span>' + X.esc(label) + '</span><b class="num">' + X.esc(val) + (sub ? ' <small class="faint">' + X.esc(sub) + "</small>" : "") + "</b></div>"; }
  function createSummary(k) {
    var ch = CHAINS[k], cf = chainState(k).cfg, errs = createErrors(k), ms = meState(k), sup = supplyWei(), jp = joinPlan(k), z = usdSizes();
    var rows = "";
    if (cf) {
      var tgt = fx(cf.target), cap = fx(cf.cap);
      rows += kv(lt("c_target"), amt(tgt, ch.qs), "≈ " + dollars(cf.targetUsd || z.g)) + kv(lt("c_cap"), amt(cap, ch.qs), "≈ " + dollars(cf.capUsd || z.cap));
      if (sup) {
        var res = fx(resTokens(sup)), rp0 = tgt / res, op = tgt * 0.98 / fx(poolTokens(sup)), omc = op * fx(sup);
        rows += kv(lt("c_rprice"), X.fmtPrice(rp0) + " " + ch.qs, usdOf(k, rp0)) + kv(lt("c_oprice"), X.fmtPrice(op) + " " + ch.qs, "+50 % · " + usdOf(k, op)) +
          kv(lt("c_omc"), amt(omc, ch.qs), usdOf(k, omc));
        if (jp.sect > 0) {
          var got = Math.min(jp.sect, cap) / tgt * res;
          rows += kv(lt("c_you"), X.compact(got) + " $" + (draft.sym || "?"), draft.lock ? lt("bonus_up") : "");
        }
      }
      rows += kv(lt("c_until"), X.dateStr(chainNow(k) + DUR[draft.dur] * 1000) + " · " + X.timeStr(chainNow(k) + DUR[draft.dur] * 1000), "");
    } else rows = '<p class="sl-note">' + X.esc(lt("ex_loading", { c: ch.name })) + "</p>";
    var needApprove = !jp.eth && jp.v > 0 && W.addr && ms.qAllow != null && cf && ms.qAllow < joinWei(k);
    var ok = !Object.keys(errs).length && draft.ack && !!cf && jp.ready;
    var btn = !W.addr ? '<button class="sl-btn sl-btn-p sl-btn-w" data-a="wconnect">' + X.esc(lt("w_connect")) + "</button>"
      : '<button class="sl-btn sl-btn-p sl-btn-w" data-a="llaunch"' + (ok ? "" : " disabled") + ">" + X.ico("rocket") + X.esc(needApprove ? lt("approve_sect", { n: amt(fx(joinWei(k))) }) : lt("c_btn", { c: ch.name })) + "</button>";
    var errList = ["join", "meta", "supply"].filter(function (x) { return errs[x] && (x !== "supply" || draft.touched.supply); }).map(function (x) { return '<div class="sl-alert is-bad" style="margin-top:10px">' + X.ico("alert") + "<span>" + X.esc(errs[x]) + "</span></div>"; }).join("");
    var burn = cf ? Math.round(cf.burn / 100) : 50, gtxt = dollars(cf && cf.targetUsd > 0 ? cf.targetUsd : z.g), ctxt = dollars(cf && cf.capUsd > 0 ? cf.capUsd : z.cap);
    return '<div class="sl-panel"><h3>' + X.ico("file") + X.esc(lt("c_summary")) + "</h3>" + chainDot(k) + ' <b style="font-size:13px">' + X.esc(ch.name) + " · " + X.esc(ch.qs) + "</b>" + rows +
      '<h4 class="sl-sub">' + X.esc(lt("c_rules")) + '</h4><ul class="sl-rules">' +
      ["c_r1", "c_r2", "c_r3", "c_r4", "c_r5", "c_r6"].map(function (r) { return "<li>" + X.ico("check") + "<span>" + X.esc(lt(r, { g: gtxt, cap: ctxt, d: ch.dex, b: burn })) + "</span></li>"; }).join("") + "</ul>" +
      errList + '<div style="margin-top:14px">' + btn + "</div></div>" +
      '<div class="sl-alert is-info">' + X.ico("info") + "<span>" + X.esc(lt("sectora_soon_p")) + "</span></div>";
  }
  // SECT the creator puts in (never more than the per-wallet maximum)
  function joinWei(k) {
    var cf = chainState(k).cfg, v = X.num(draft.join);
    if (!cf || !(v > 0)) return 0n;
    var w; try { w = E.parseEther(String(v)); } catch (e) { return 0n; }
    return w > cf.cap ? cf.cap : w;
  }
  function createView(net) {
    if (!deployed(net)) return '<a class="sl-back" href="#/">' + X.ico("back") + X.esc(X.t("back")) + "</a>" + offHtml(net);
    loadCfg(net).then(function () { X.refreshLive("summary"); }, function () {});
    loadChain(net).then(function () {}, function () {});
    loadUsd(net);
    loadRate(net).then(function () { X.refreshLive("summary"); }, function () {});
    if (W.addr) loadMe(net).then(function () { X.refreshLive("summary"); }, function () {});
    var ch = CHAINS[net], cf = chainState(net).cfg, errs = createErrors(net), tch = draft.touched, sim = (draft.name || draft.sym) ? similar(net, draft.name, draft.sym, null) : null;
    function f(id, label, val, attrs, err, hint) {
      return '<div class="sl-field"><label for="' + id + '">' + X.esc(label) + '</label><input class="sl-input' + (err ? " is-bad" : "") + '" id="' + id + '" value="' + X.esc(val) + '" ' + (attrs || "") + ">" + (err ? '<small class="sl-err" style="color:var(--red)">' + X.esc(err) + "</small>" : hint ? "<small>" + X.esc(hint) + "</small>" : "") + "</div>";
    }
    var prev = draft.img.trim() && safeImg(draft.img) ? '<img class="sl-logo" id="slLImgPv" src="' + X.esc(safeImg(draft.img)) + '" alt="" referrerpolicy="no-referrer" data-fb="' + X.esc(logoOf({ sym: draft.sym || "?" })) + '">' : '<img class="sl-logo" id="slLImgPv" src="' + logoOf({ sym: draft.sym || "?" }) + '" alt="">';
    var z = usdSizes(), capTxt = dollars(cf && cf.capUsd > 0 ? cf.capUsd : z.cap), gTxt = dollars(cf && cf.targetUsd > 0 ? cf.targetUsd : z.g);
    var r0 = rateOf(net), capS = cf ? fx(cf.cap) : 0, maxJ = draft.pay === "eth" ? (r0 && capS ? Math.floor(capS / r0 * 0.98 * 1e5) / 1e5 : 0) : capS;
    var jUnit = draft.pay === "eth" ? ch.sym : ch.qs, jQuick = draft.pay === "eth" ? ch.quick.slice(0, 3) : ch.qquick.slice(0, 3);
    var supShown = X.nf(Number(String(draft.supply).replace(/[^0-9]/g, "") || 0), 0);
    return '<a class="sl-back" href="#/">' + X.ico("back") + X.esc(X.t("back")) + "</a>" +
      '<div class="sl-pagehead"><span class="sl-eyebrow"><i class="rule"></i>Sectora Launch · ' + X.esc(ch.name) + "</span><h1>" + X.esc(lt("c_t")) + "</h1><p>" + X.esc(lt("c_s", { c: ch.name, g: gTxt })) + "</p></div>" +
      '<div class="sl-2col"><div><div class="sl-panel">' +
      '<div class="sl-field"><span class="sl-label">' + X.esc(lt("c_img")) + '</span><div class="sl-upload">' + prev + '<div style="flex:1;min-width:0"><input class="sl-input' + (tch.img && errs.img ? " is-bad" : "") + '" id="slLImg" inputmode="url" placeholder="https://… / ipfs://…" value="' + X.esc(draft.img) + '"><small style="display:block;margin-top:6px">' + X.esc(tch.img && errs.img ? errs.img : lt("c_img_h")) + "</small></div></div></div>" +
      '<div class="sl-row2">' + f("slLName", lt("c_name"), draft.name, 'maxlength="32" autocomplete="off"', tch.name && errs.name) +
      f("slLSym", lt("c_ticker"), draft.sym, 'maxlength="12" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase;font-family:var(--mono)"', tch.sym && errs.sym) + "</div>" +
      '<div class="sl-warn-list" id="slLSim">' + (sim ? '<div class="sl-alert">' + X.ico("alert") + "<span>" + X.esc(lt("e_similar", { n: sim })) + "</span></div>" : "") + "</div>" +
      '<div class="sl-field"><label for="slLDesc">' + X.esc(lt("c_desc")) + '</label><textarea class="sl-textarea" id="slLDesc" maxlength="500">' + X.esc(draft.desc) + "</textarea></div>" +
      '<div class="sl-row3">' + f("slLWeb", lt("c_web"), draft.web, 'inputmode="url" placeholder="https://"') + f("slLX", lt("c_x"), draft.x, 'inputmode="url" placeholder="https://x.com/…"') + f("slLTg", lt("c_tg"), draft.tg, 'inputmode="url" placeholder="https://t.me/…"') + "</div>" +
      '<div class="sl-field"><label for="slLSup">' + X.esc(lt("c_supply")) + '</label><input class="sl-input num' + (tch.supply && errs.supply ? " is-bad" : "") + '" id="slLSup" inputmode="numeric" autocomplete="off" value="' + X.esc(supShown) + '">' +
      '<div class="sl-chips" style="margin-top:8px">' + SUPPLIES.map(function (s) { return '<button type="button" data-a="lsup" data-v="' + s[1] + '"' + (String(draft.supply).replace(/[^0-9]/g, "") === s[1] ? ' class="on"' : "") + ">" + s[0] + "</button>"; }).join("") + "</div>" +
      "<small>" + X.esc(tch.supply && errs.supply ? errs.supply : lt("c_supply_h")) + "</small></div>" +
      '<div class="sl-field"><span class="sl-label">' + X.esc(lt("c_dur")) + '</span><div class="sl-chips">' + DUR.map(function (d, i) { return '<button type="button" data-a="ldur" data-v="' + i + '"' + (draft.dur === i ? ' class="on"' : "") + ">" + X.esc(lt("dur")[i]) + "</button>"; }).join("") + "</div>" +
      "<small>" + X.esc(lt("c_dur_h", { g: gTxt })) + "</small></div>" +
      '<h4 class="sl-sub">' + X.esc(lt("c_join")) + "</h4>" +
      '<div class="sl-pay">' + '<span>' + X.esc(lt("pay")) + "</span>" + ["eth", "sect"].map(function (x) { return '<button type="button" data-a="lcpay" data-v="' + x + '"' + (draft.pay === x ? ' class="on"' : "") + ">" + X.esc(x === "eth" ? ch.sym : ch.qs) + "</button>"; }).join("") + "</div>" +
      '<div class="sl-field"><div class="sl-input-wrap"><input class="sl-input num" id="slLJoin" inputmode="decimal" placeholder="0" value="' + X.esc(draft.join) + '"><span class="unit">' + X.esc(jUnit) + "</span></div>" +
      '<div class="sl-quick" style="margin:6px 0 0">' + jQuick.map(function (v) { return '<button type="button" data-a="ljoinamt" data-v="' + v + '">' + v + "</button>"; }).join("") + (maxJ ? '<button type="button" data-a="ljoinamt" data-v="' + maxJ + '">' + X.esc(X.t("max")) + "</button>" : "") + "</div>" +
      "<small>" + X.esc(lt("c_join_h", { cap: capTxt })) + "</small></div>" +
      '<label class="sl-check" style="margin-bottom:14px"><input type="checkbox" id="slLLock"' + (draft.lock ? " checked" : "") + "><span>" + X.esc(lt("c_lock")) + '<br><small class="faint">' + X.esc(lt("c_lock_h")) + "</small></span></label>" +
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
        if (mode === "int") {
          var digits = v.replace(/[^0-9]/g, "").slice(0, 16);
          v = digits;
          var pos = el.value.length - el.selectionStart;
          el.value = digits ? X.nf(Number(digits), 0) : "";
          try { var np = Math.max(0, el.value.length - pos); el.setSelectionRange(np, np); } catch (e) {}
          document.querySelectorAll('[data-a="lsup"]').forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === digits); });
        }
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
        if (key === "supply") refresh();
      });
    }
    bind("slLName", "name"); bind("slLSym", "sym", "sym"); bind("slLDesc", "desc"); bind("slLImg", "img"); bind("slLWeb", "web"); bind("slLX", "x"); bind("slLTg", "tg");
    bind("slLSup", "supply", "int"); bind("slLJoin", "join", "num");
    var ack = document.getElementById("slLAck"); if (ack) ack.addEventListener("change", function () { draft.ack = ack.checked; refresh(); });
    var lk = document.getElementById("slLLock"); if (lk) lk.addEventListener("change", function () { draft.lock = lk.checked; refresh(); });
  }
  function doCreate(net) {
    var errs = createErrors(net), cf = chainState(net).cfg, jp = joinPlan(net), ms = meState(net), sup = supplyWei();
    if (Object.keys(errs).length || !draft.ack || !cf || !jp.ready || !W.addr || !sup) { draft.touched = { name: 1, sym: 1, img: 1, supply: 1 }; X.render(); return; }
    var name = draft.name.trim(), sym = draft.sym, meta = metaJson(), dur = DUR[draft.dur], lock = !!draft.lock && jp.v > 0;
    var done = function (rc) {
      var addr = null;
      rc.logs.forEach(function (l) { try { var p = IF.parseLog(l); if (p && p.name === "CoinCreated") addr = p.args.token; } catch (e) {} });
      draft = newDraft(draft.pay);
      chainState(net).at = 0; ME[net] && (ME[net].at = 0);
      return { html: X.esc(lt("ok_create")) + " · <b>$" + X.esc(sym) + "</b>", go: addr ? "#/t/" + net + "/" + E.getAddress(addr) : "#/" };
    };
    if (!jp.eth || !(jp.v > 0)) {
      var amount = joinWei(net);
      if (amount > 0n && (ms.qAllow == null || ms.qAllow < amount)) {
        // exact approval for this coin only, never unlimited
        txFlow(net, function (s) { return qC(net, s).approve(factoryOf(net), amount); }, function () { ME[net] && (ME[net].at = 0); loadMe(net).then(function () { X.refreshLive("summary"); }); return { html: X.esc(lt("ok_approve")) }; });
        return;
      }
      txFlow(net, function (s) { return fac(net, s).createCoin(name, sym, meta, sup, dur, amount, lock); }, done);
      return;
    }
    // paying ETH: swapped to SECT on the fixed route; SECT above the wallet maximum comes back to the creator
    var value; try { value = E.parseEther(String(jp.v)); } catch (e) { return; }
    txFlow(net, function (s) {
      return quoteEth(net, value).then(function (out) {
        return fac(net, s).createCoinWithETH(name, sym, meta, sup, dur, out * 98n / 100n, lock, { value: value });
      });
    }, done);
  }

  /* ------------------------------------------------------------------ coin page */
  function poolPrice(td) { return td.pool && td.pool.t > 0 ? td.pool.n / td.pool.t : 0; }
  function cell(label, val, unit, sub) {
    return "<div><span>" + X.esc(label) + "</span><b>" + val + (unit ? " <small>" + X.esc(unit) + "</small>" : "") + '</b><small style="margin:0">' + X.esc(sub || "") + "</small></div>";
  }
  function priceBar(k, td) {
    var c = td.c, ch = CHAINS[k], sup = fx(c.supply), raised = fx(c.raised);
    if (c.launched) {
      var p = poolPrice(td), liq = td.pool ? td.pool.n : 0, x = p && c.rprice ? p / c.rprice : 0;
      return cell(lt("pb_now"), p ? X.fmtPrice(p) : "…", ch.qs, p ? usdOf(k, p) : "") +
        cell(lt("pb_rprice"), X.fmtPrice(c.rprice), ch.qs, x ? "×" + X.nf(x, 2) + " · " + usdOf(k, c.rprice) : usdOf(k, c.rprice)) +
        cell(lt("pb_mc"), p ? X.esc(amt(p * sup)) : "…", ch.qs, p ? usdOf(k, p * sup) : "") +
        cell(lt("pb_liq"), liq ? X.esc(amt(liq)) : "…", ch.qs, liq ? usdOf(k, liq) : "");
    }
    return cell(lt("pb_rprice"), X.fmtPrice(c.rprice), ch.qs, usdOf(k, c.rprice)) +
      cell(lt("pb_oprice"), X.fmtPrice(c.oprice), ch.qs, "+50 % · " + usdOf(k, c.oprice)) +
      cell(lt("pb_omc"), X.esc(amt(c.oprice * sup)), ch.qs, usdOf(k, c.oprice * sup)) +
      cell(lt("pb_raised"), X.esc(amt(raised)), ch.qs, usdOf(k, raised));
  }
  function meterHtml(k, td) {
    var c = td.c, ch = CHAINS[k], s = statusOf(k, c), pr = progressOf(c);
    var line = lt(c.wallets === 1 ? "r_p1" : "r_p", { r: amt(fx(c.raised), ch.qs), g: amt(fx(c.target), ch.qs), n: X.nf(c.wallets, 0) });
    var right = s === "open" ? lt("r_closes", { t: fdur(c.deadline - chainNow(k)) }) : s === "live" ? lt("r_live", { d: ch.dex, t: X.dateStr(c.launched) }) : lt("s_exp");
    var links = "";
    if (s === "live") {
      var ds = ch.ds ? "https://dexscreener.com/" + ch.ds + "/" + c.pair : "", uni = ch.swap ? ch.swap + c.addr : "";
      links = '<div class="sl-meter-links">' + (ds ? '<a class="sl-btn" href="' + X.esc(ds) + '" target="_blank" rel="noopener">' + X.esc(lt("t_chart")) + "</a>" : "") + (uni ? '<a class="sl-btn" href="' + X.esc(uni) + '" target="_blank" rel="noopener">' + X.esc(lt("t_uni")) + "</a>" : "") + "</div>";
    }
    return '<div class="sl-meter"><div class="sl-meter-row"><b>' + X.esc(lt("r_t")) + "</b><span>" + X.nf(pr * 100, 1) + ' %</span></div><div class="sl-prog' + (s === "live" ? " is-done" : s === "exp" ? " is-exp" : "") + '"><i style="width:' + (pr * 100).toFixed(2) + '%"></i></div>' +
      '<div class="sl-meter-row dim"><span>' + X.esc(line) + "</span><span>" + X.esc(right) + "</span></div>" +
      (s === "exp" ? '<div class="sl-alert" style="margin-top:12px">' + X.ico("info") + "<span><b>" + X.esc(lt("r_exp_t")) + "</b> " + X.esc(lt("r_exp_p")) + "</span></div>" : "") + links + "</div>";
  }
  function actsTable(k, td) {
    var ch = CHAINS[k], bt = BT[k] || {};
    if (!td.acts.length) return '<p class="dim" style="margin:6px 0">' + X.esc(lt("act_none")) + "</p>";
    return '<div class="sl-table-wrap"><table class="sl-table"><thead><tr><th>' + X.esc(lt("th_time")) + "</th><th>" + X.esc(lt("th_type")) + "</th><th>" + X.esc(lt("th_acct")) + '</th><th class="r">' + X.esc(lt("th_amt")) + '</th><th class="sl-hide-sm">' + X.esc(lt("th_tx")) + "</th></tr></thead><tbody>" +
      td.acts.slice(0, 80).map(function (a) {
        var cls = a.kind === "join" ? "buy" : a.kind === "out" ? "sell" : "ev", label = a.kind === "join" ? lt("act_join") : a.kind === "out" ? lt("act_out") : lt("act_launch");
        var type = '<span class="sl-side-pill ' + cls + '">' + X.esc(label) + "</span>" + (a.lock ? ' <span class="faint" title="30 d">' + X.ico("lock").replace("<svg", '<svg width="11" height="11"') + "</span>" : "");
        var who = a.kind === "launch" ? addrLink(k, a.who, ch.dex) : addrLink(k, a.who, (W.addr && a.who === W.addr ? "★ " : "") + X.short(a.who)) + (a.who === td.c.creator ? ' <span class="sl-tag is-blue">' + X.esc(X.t("creator")) + "</span>" : "");
        return '<tr><td class="mono dim">' + X.esc(bt[a.b] ? X.timeStr(bt[a.b]) : "#" + a.b) + "</td><td>" + type + "</td><td>" + who + '</td><td class="r num">' + X.esc(amt(a.n)) + '</td><td class="mono faint sl-hide-sm">' + txLink(k, a.h) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function shieldChecks(k, td) {
    var c = td.c, live = !!c.launched, sim = similar(k, c.name, c.sym, c.addr), res = RESERVED.indexOf(c.sym.toUpperCase()) >= 0;
    var list = [
      ["pass", lt("sh1"), lt("sh1d")], ["pass", lt("sh2"), lt("sh2d")],
      [live ? "pass" : "info", lt("sh3"), live ? lt("sh3d") : lt("sh3p")],
      ["pass", lt("sh4"), lt("sh4d")], ["pass", lt("sh5"), lt("sh5d")], ["pass", lt("sh6"), lt("sh6d")],
      [sim ? "warn" : "pass", lt("sh7"), sim ? lt("sh7w", { n: sim }) : lt("sh7d")],
      [res ? "warn" : "pass", lt("sh8"), res ? lt("sh8w", { s: c.sym }) : lt("sh8d")]
    ];
    return { score: Math.round(list.filter(function (x) { return x[0] !== "warn"; }).length / list.length * 100), list: list };
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
    var ds = c.launched && ch.ds ? "https://dexscreener.com/" + ch.ds + "/" + c.pair : "";
    var row = function (l, v) { return '<div class="sl-kv"><span>' + X.esc(l) + "</span><b>" + v + "</b></div>"; };
    return '<p style="margin:0 0 14px;color:var(--dim);white-space:pre-line">' + X.esc(c.meta.d || "—") + "</p>" +
      row(lt("i_contract"), '<span class="mono">' + addrLink(k, c.addr) + '</span> <button class="sl-addr" data-a="copy" data-v="' + c.addr + '">' + X.ico("copy") + "</button>") +
      row(lt("i_creator"), '<span class="mono">' + addrLink(k, c.creator) + "</span>") +
      row(lt("i_created"), X.esc(X.dateStr(c.created) + " · " + X.timeStr(c.created))) +
      row(lt("i_deadline"), X.esc(X.dateStr(c.deadline) + " · " + X.timeStr(c.deadline))) +
      row(lt("i_supply"), '<span class="num">' + X.esc(X.nf(fx(c.supply), 0)) + "</span>") +
      (c.launched ? row(lt("i_pair"), '<span class="mono">' + addrLink(k, c.pair) + "</span>" + (ds ? ' · <a href="' + X.esc(ds) + '" target="_blank" rel="noopener">' + X.esc(lt("i_chart")) + "</a>" : "")) : "") +
      (links.length ? '<div class="sl-kv"><span>' + X.esc(lt("i_links")) + '</span><b style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">' +
        links.map(function (l) { return '<a href="' + X.esc(c.meta[l[0]]) + '" target="_blank" rel="noopener nofollow ugc" style="color:var(--blue)">' + X.esc(l[1]) + "</a>"; }).join("") + "</b></div>" : "");
  }
  // the visitor's place in this reserve: SECT in it, the lock, and the tokens after launch
  function seatPanel(k, td) {
    var c = td.c, ch = CHAINS[k], m = td.mine, s = statusOf(k, c);
    if (!W.addr || !m || !m.seat || !(m.seat.amount > 0n)) return "";
    var seat = m.seat, inRes = fx(seat.amount), html = '<div class="sl-panel"><h3>' + X.ico("user") + X.esc(lt("my_t")) + "</h3>" +
      kv(lt("my_in"), amt(inRes, ch.qs), usdOf(k, inRes)) + kv(lt("my_lock"), seat.locked ? lt("my_yes") : lt("my_no"), "");
    var base = inRes * fx(c.res) / fx(c.target);
    if (s !== "live") {
      html += kv(lt("my_tokens"), X.compact(base) + " $" + c.sym, seat.locked ? lt("bonus_up") : "");
      html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="sl-btn" data-a="lwithdraw">' + X.esc(lt("my_withdraw")) + "</button>" +
        (s === "open" && !seat.locked ? '<button class="sl-btn" data-a="llock">' + X.ico("lock") + X.esc(lt("my_lockbtn")) + "</button>" : "") + "</div>";
      return html + "</div>";
    }
    var total = seat.locked ? base * (1 + c.bonus) : base, got = fx(seat.claimed), now = fx(seat.claimable), frac = total > 0 ? Math.min(1, (got + now) / total) : 0;
    html += kv(lt("my_tokens"), X.compact(total) + " $" + c.sym, seat.locked && c.bonus > 0 ? lt("my_bonus", { p: X.nf(c.bonus * 100, 2) }) : "") +
      kv(lt("my_got"), X.compact(got) + " $" + c.sym, "") + kv(lt("my_now"), X.compact(now) + " $" + c.sym, "") +
      '<div class="sl-prog" style="margin:10px 0 6px"><i style="width:' + (frac * 100).toFixed(1) + '%"></i></div>' +
      '<p class="sl-note">' + X.esc(seat.locked ? lt("my_lockday", { d: X.dateStr(c.launched + LOCK_MS) }) : lt("my_next", { d: X.dateStr(c.launched + VEST_MS) })) + "</p>" +
      '<button class="sl-btn sl-btn-p sl-btn-w" style="margin-top:12px" data-a="lclaim"' + (seat.claimable > 0n ? "" : " disabled") + ">" + X.esc(lt("my_claim")) + (now > 0 ? " · " + X.esc(X.compact(now)) + " $" + X.esc(c.sym) : "") + "</button>";
    return html + "</div>";
  }
  function creatorPanel(k, td) {
    var c = td.c, ch = CHAINS[k], mine = td.mine && W.addr && W.addr === c.creator, html = '<div class="sl-panel"><h3>' + X.ico("user") + X.esc(lt("cr_t")) + "</h3>" +
      '<div class="sl-kv"><span>' + X.esc(lt("i_creator")) + '</span><b class="mono">' + addrLink(k, c.creator) + "</b></div>";
    if (mine) {
      html += kv(lt("cr_fees"), amt(fx(td.mine.cfees), ch.qs), usdOf(k, fx(td.mine.cfees))) +
        '<button class="sl-btn sl-btn-w" style="margin-top:10px" data-a="lclaimfees"' + (td.mine.cfees > 0n ? "" : " disabled") + ">" + X.esc(lt("cr_claim")) + "</button>";
    }
    var all = fx(c.supply) * 0.05;
    html += '<h4 class="sl-sub">' + X.ico("lock") + X.esc(lt("cr_vest")) + "</h4>";
    if (c.launched) {
      var frac = Math.min(1, Math.max(0, (chainNow(k) - c.launched) / CREATOR_MS));
      html += '<div class="sl-prog"><i style="width:' + (frac * 100).toFixed(1) + '%"></i></div><p class="sl-note">' +
        X.esc(lt("cr_vest_p", { v: X.compact(all * frac), a: X.compact(all), d: X.dateStr(c.launched + CREATOR_MS) })) + "</p>";
      if (mine) html += '<button class="sl-btn sl-btn-w" style="margin-top:10px" data-a="lclaimc"' + (td.mine.cclaim > 0n ? "" : " disabled") + ">" + X.esc(lt("cr_claim")) + " · " + X.esc(X.compact(fx(td.mine.cclaim))) + " $" + X.esc(c.sym) + "</button>";
    } else html += '<p class="sl-note">' + X.esc(X.compact(all)) + " $" + X.esc(c.sym) + " · " + X.esc(lt("cr_wait")) + "</p>";
    return html + "</div>";
  }
  function joinPanel(k, td) {
    var c = td.c, ch = CHAINS[k], m = td.mine, pay = ui.pay, locked = m && m.seat && m.seat.locked;
    var room = c.target - c.raised, capLeft = c.cap - (m && m.seat ? m.seat.amount : 0n), fit = room < capLeft ? room : capLeft;
    var head = "<h3>" + X.ico("rocket") + X.esc(lt("j_t")) + "</h3>";
    if (W.addr && m && fit <= 0n) return '<div class="sl-panel" id="slLTrade">' + head + '<div class="sl-alert is-ok">' + X.ico("check") + "<span>" + X.esc(lt("j_full")) + "</span></div></div>";
    var payRow = '<div class="sl-pay"><span>' + X.esc(lt("pay")) + "</span>" + ["eth", "sect"].map(function (x) { return '<button data-a="lpay" data-v="' + x + '"' + (pay === x ? ' class="on"' : "") + ">" + X.esc(x === "eth" ? ch.sym : ch.qs) + "</button>"; }).join("") + "</div>";
    var unit = pay === "eth" ? ch.sym : ch.qs, r0 = rateOf(k);
    var bal = '<div class="sl-bal"><span>' + X.esc(lt("t_bal")) + '</span><span class="num">' + (m ? X.esc(pay === "eth" ? amt(fx(m.native), ch.sym) : amt(fx(m.sect), ch.qs)) : "—") + "</span></div>";
    // paying ETH, Max aims 2 % above what fits (price impact): whatever does not fit comes back as SECT
    var maxV = pay === "eth" ? (r0 ? Math.ceil(fx(fit) / r0 * 1.02 * 1e5) / 1e5 : 0) : Math.floor(fx(fit) * 1e4) / 1e4;
    var quick = (pay === "eth" ? ch.quick.slice(0, 3) : ch.qquick.slice(0, 3)).map(function (v) { return '<button data-a="lamt" data-v="' + v + '">' + v + "</button>"; }).join("") +
      (maxV > 0 ? '<button data-a="lamt" data-v="' + maxV + '">' + X.esc(X.t("max")) + "</button>" : "");
    var lock = '<label class="sl-check" style="margin:2px 0 14px"><input type="checkbox" id="slJLock"' + (locked || ui.lock ? " checked" : "") + (locked ? " disabled" : "") + "><span>" + X.esc(lt("c_lock")) + '<br><small class="faint">' + X.esc(lt("c_lock_h")) + "</small></span></label>";
    var slip = pay === "eth" ? '<div class="sl-slip"><span>' + X.esc(lt("t_slip")) + "</span>" + [1, 3, 5].map(function (s2) { return '<button data-a="lslip" data-v="' + s2 + '"' + (ui.slip === s2 ? ' class="on"' : "") + ">" + s2 + " %</button>"; }).join("") + "</div>" : "";
    var btn = !W.addr ? '<button class="sl-btn sl-btn-p sl-btn-w" data-a="wconnect">' + X.esc(lt("w_connect")) + "</button>"
      : '<button class="sl-btn sl-btn-w sl-btn-g" data-a="ltrade" id="slLTradeBtn" disabled>' + X.esc(lt("j_btn")) + "</button>";
    return '<div class="sl-panel" id="slLTrade">' + head + payRow +
      '<div class="sl-field" style="margin-bottom:12px"><div class="sl-input-wrap"><input class="sl-input num" id="slLAmt" inputmode="decimal" placeholder="0.0" autocomplete="off" value="' + X.esc(ui.amt) + '"><span class="unit">' + X.esc(unit) + "</span></div></div>" +
      bal + '<div class="sl-quick">' + quick + "</div>" + lock + slip +
      '<div class="sl-quote" id="slLQuote">' + quoteRows([]) + "</div>" +
      '<div id="slLTradeErr"></div>' + btn + (pay === "eth" ? '<p class="sl-route">' + X.esc(lt("j_swap")) + "</p>" : "") + "</div>";
  }
  function tradePanel(k, td) {
    var c = td.c, ch = CHAINS[k], side = ui.side, m = td.mine, uni = ch.swap ? ch.swap + c.addr : "";
    var head = '<div class="sl-trade-tabs"><button class="buy' + (side === "buy" ? " on" : "") + '" data-a="lside" data-v="buy">' + X.esc(lt("t_buy")) + '</button><button class="sell' + (side === "sell" ? " on" : "") + '" data-a="lside" data-v="sell">' + X.esc(lt("t_sell")) + "</button></div>";
    var dexNote = '<div class="sl-alert is-ok" style="margin-bottom:14px">' + X.ico("check") + "<span>" + X.esc(lt("t_dex_note", { d: ch.dex })) + "</span></div>";
    if (!routerOk[k]) {
      checkRouter(k);
      if (routerOk[k] === false) return '<div class="sl-panel">' + dexNote + '<p class="sl-note">' + X.esc(lt("t_router_off", { d: ch.dex })) + "</p>" + (uni ? '<a class="sl-btn sl-btn-p sl-btn-w" href="' + X.esc(uni) + '" target="_blank" rel="noopener">' + X.esc(ch.dex) + "</a>" : "") + "</div>";
    }
    var unit, bal, quick, note = "";
    if (side === "buy") {
      unit = ch.qs;
      bal = '<div class="sl-bal"><span>' + X.esc(lt("t_bal")) + '</span><span class="num">' + (m ? X.esc(amt(fx(m.sect), ch.qs)) : "—") + "</span></div>";
      quick = ch.qquick.map(function (v) { return '<button data-a="lamt" data-v="' + v + '">' + v + "</button>"; }).join("");
      if (uni) note = '<p class="sl-route"><a href="' + X.esc(uni) + '" target="_blank" rel="noopener">' + X.esc(lt("t_uni")) + "</a></p>";
    } else {
      unit = "$" + c.sym;
      bal = '<div class="sl-bal"><span>' + X.esc(lt("t_bal")) + '</span><span class="num">' + (m ? X.esc(X.compact(fx(m.bal))) + " " + X.esc(c.sym) : "—") + "</span></div>";
      quick = [0.25, 0.5, 0.75, 1].map(function (f) { return '<button data-a="lpct" data-v="' + f + '">' + (f === 1 ? X.esc(X.t("max")) : f * 100 + "%") + "</button>"; }).join("");
    }
    var slip = '<div class="sl-slip"><span>' + X.esc(lt("t_slip")) + "</span>" + [1, 3, 5, 10].map(function (s2) { return '<button data-a="lslip" data-v="' + s2 + '"' + (ui.slip === s2 ? ' class="on"' : "") + ">" + s2 + " %</button>"; }).join("") + "</div>";
    var btn = !W.addr ? '<button class="sl-btn sl-btn-p sl-btn-w" data-a="wconnect">' + X.esc(lt("w_connect")) + "</button>"
      : '<button class="sl-btn sl-btn-w ' + (side === "buy" ? "sl-btn-g" : "sl-btn-r") + '" data-a="ltrade" id="slLTradeBtn" disabled>' + X.esc(lt(side === "buy" ? "t_btn_buy" : "t_btn_sell", { s: c.sym })) + "</button>";
    return '<div class="sl-panel" id="slLTrade">' + head + dexNote +
      '<div class="sl-field" style="margin-bottom:12px"><div class="sl-input-wrap"><input class="sl-input num" id="slLAmt" inputmode="decimal" placeholder="0.0" autocomplete="off" value="' + X.esc(ui.amt) + '"><span class="unit">' + X.esc(unit) + "</span></div></div>" +
      bal + '<div class="sl-quick">' + quick + "</div>" + note + slip +
      '<div class="sl-quote" id="slLQuote">' + quoteRows([]) + "</div>" +
      '<div id="slLTradeErr"></div>' + btn + "</div>";
  }
  function expiredPanel(k, td) {
    return '<div class="sl-panel" id="slLTrade"><h3>' + X.ico("clock") + X.esc(lt("r_exp_t")) + '</h3><p class="sl-note">' + X.esc(lt("r_exp_p")) + "</p></div>";
  }
  function quoteRows(rows) {
    if (!rows.length) rows = [[lt("t_you_get"), "—"], [lt("t_min"), "—"]];
    return rows.map(function (r) { return '<div class="sl-kv"><span>' + X.esc(r[0]) + '</span><b class="num">' + X.esc(r[1]) + "</b></div>"; }).join("");
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
        if (btn) {
          btn.disabled = !!q.err || !W.addr;
          if (q.approve) btn.textContent = q.approveQ ? lt("approve_sect", { n: amt(fx(q.amount)) }) : lt("t_approve", { s: td.c.sym });
          else btn.textContent = q.kind === "joineth" || q.kind === "joinsect" ? lt("j_btn") : lt(ui.side === "buy" ? "t_btn_buy" : "t_btn_sell", { s: td.c.sym });
        }
      }, function (err) { er.innerHTML = '<div class="sl-alert is-bad" style="margin-bottom:12px">' + X.ico("alert") + "<span>" + X.esc(errMsg(err)) + "</span></div>"; }); }, 260);
    }
    inp.addEventListener("input", function () { ui.amt = inp.value; upd(); });
    inp._upd = function () { ui.amt = inp.value; upd(); };
    var lk = document.getElementById("slJLock");
    if (lk) lk.addEventListener("change", function () { ui.lock = lk.checked; upd(); });
    if (inp.value) upd();
  }
  function quote(k, td, v) {
    var c = td.c, ch = CHAINS[k], m = td.mine, slip = BigInt(Math.round(ui.slip * 100));
    var wei;
    try { wei = E.parseEther(String(v)); } catch (e) { return Promise.reject(new Error("amount")); }
    var cut = function (x) { return x * (10000n - slip) / 10000n; };
    if (!c.launched) {
      // joining the reserve: only what fits under the target and this wallet's maximum is taken
      var pay = ui.pay, sq = pay === "eth" ? quoteEth(k, wei) : Promise.resolve(wei);
      return sq.then(function (s) {
        var room = c.target - c.raised, capLeft = c.cap - (m && m.seat ? m.seat.amount : 0n), fit = room < capLeft ? room : capLeft;
        if (fit < 0n) fit = 0n;
        // a typed amount a hair below what fits (decimals cut by "Max") still fills the seat or the reserve exactly
        if (pay === "sect" && s < fit && fit - s <= 10n ** 14n) s = fit;
        var used = s < fit ? s : fit, tokens = fx(used) * fx(c.res) / fx(c.target), lock = !!ui.lock || !!(m && m.seat && m.seat.locked);
        var rows = [];
        if (pay === "eth") rows.push([lt("j_sect"), amt(fx(s), ch.qs)]);
        rows.push([lt("j_in"), amt(fx(used), ch.qs) + (usdOf(k, fx(used)) ? " · " + usdOf(k, fx(used)) : "")]);
        if (s > used) rows.push([lt("j_back"), amt(fx(s - used), ch.qs)]);
        rows.push([lt("j_get"), X.compact(tokens) + " $" + c.sym + (lock ? " · " + lt("bonus_up") : "")]);
        rows.push([lt("j_open"), amt(tokens * c.oprice, ch.qs) + (usdOf(k, tokens * c.oprice) ? " · " + usdOf(k, tokens * c.oprice) : "")]);
        if (pay === "eth") rows.push([lt("t_min"), amt(fx(cut(s)), ch.qs)]);
        var err = "";
        if (statusOf(k, c) !== "open") err = lt("r_closed");
        else if (fit <= 0n) err = lt("j_full");
        else if (m && pay === "eth" && wei > m.native) err = lt("e_bal", { s: ch.sym });
        else if (m && pay === "sect" && used > m.sect) err = lt("e_bal", { s: ch.qs });
        var q = { rows: rows, err: err, note: used > 0n && used === room ? lt("j_launch", { d: ch.dex }) : "", lock: lock };
        if (pay === "eth") { q.kind = "joineth"; q.value = wei; q.minQuote = cut(s); }
        else { q.kind = "joinsect"; q.amount = used; q.approve = m && m.qAllow < used; q.approveQ = true; q.spender = factoryOf(k); }
        return q;
      });
    }
    // live: COIN/SECT pool on Uniswap V2
    var buy = ui.side === "buy", path = buy ? [ch.qaddr, c.addr] : [c.addr, ch.qaddr];
    return withRpc(k, function (p) { return new E.Contract(ch.router, ROUTER_ABI, p).getAmountsOut(wei, path); }).then(function (a) {
      var out = a[1], minOut = cut(out);
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
      // approvals are always for the exact amount, never unlimited
      if (q.approve) return (q.approveQ ? qC(k, s) : tokC(c.addr, s)).approve(q.spender, q.amount);
      if (q.kind === "joineth") return fac(k, s).contributeWithETH(c.addr, q.minQuote, q.lock, { value: q.value });
      if (q.kind === "joinsect") return fac(k, s).contribute(c.addr, q.amount, q.lock);
      return new E.Contract(ch.router, ROUTER_ABI, s).swapExactTokensForTokens(q.amount, q.min, q.path, W.addr, dl);
    }, function (rc) {
      td.at = 0; chainState(k).at = 0; ME[k] && (ME[k].at = 0);
      if (q.approve) return { html: X.esc(lt("ok_approve")) };
      ui.amt = "";
      if (q.kind === "joineth" || q.kind === "joinsect") {
        var launched = rc.logs.some(function (l) { try { var p = IF.parseLog(l); return p && p.name === "Launched"; } catch (e) { return false; } });
        return { html: X.esc(launched ? lt("ok_live") : lt("ok_join")) };
      }
      return { html: X.esc(q.kind === "dexbuy" ? lt("ok_buy", { n: q.rows[0][1].replace(/ \$.*/, ""), s: c.sym }) : lt("ok_sell", { n: X.compact(fx(q.amount)), s: c.sym })) };
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
    if (!td.c.launched) loadRate(k).then(function () {}, function () {});
    var c = td.c, ch = CHAINS[k], sh = shieldChecks(k, td), s = statusOf(k, c);
    td.shown = s;
    var itabs = [["act", "tab_act"], ["shield", "tab_shield"], ["info", "tab_info"]];
    var body = ui.ctab === "shield" ? shieldHtml(k, td) : ui.ctab === "info" ? infoHtml(k, td) : actsTable(k, td);
    var tag = sh.score >= 85 ? "is-good" : sh.score >= 65 ? "is-mid" : "is-bad";
    var stag = s === "live" ? '<span class="sl-tag is-good">' + X.ico("check") + X.esc(lt("s_live")) + "</span>" : s === "open" ? '<span class="sl-tag is-blue">' + X.ico("clock") + X.esc(lt("s_open")) + "</span>" : '<span class="sl-tag is-mid">' + X.esc(lt("s_exp")) + "</span>";
    var action = s === "open" ? joinPanel(k, td) : s === "live" ? tradePanel(k, td) : expiredPanel(k, td);
    return back +
      '<div class="sl-2col sl-tok"><div>' +
      '<div class="sl-coinhead o1">' + logoTag(c, "sl-logo sl-logo-lg") + "<div><h1>" + X.esc(c.name) + " <span>$" + X.esc(c.sym) + '</span><span class="sl-tag ' + tag + '">' + X.ico("shield") + sh.score + "</span></h1>" +
      '<div class="meta"><span class="sl-netpill on sm">' + chainDot(k) + X.esc(ch.name) + '</span><button class="sl-addr" data-a="copy" data-v="' + c.addr + '">' + X.esc(X.short(c.addr)) + X.ico("copy") + "</button>" + stag +
      '<span class="faint" style="font-size:12.5px">' + X.esc(agoC(k, c.created)) + "</span></div></div></div>" +
      '<div class="sl-panel o2"><div class="sl-pricebar" id="slLPrice">' + priceBar(k, td) + '</div><div id="slLMeter">' + meterHtml(k, td) + "</div></div>" +
      '<div class="sl-panel o5"><div class="sl-itabs">' + itabs.map(function (x) { return '<button data-a="lctab" data-v="' + x[0] + '"' + (ui.ctab === x[0] ? ' class="on"' : "") + ">" + X.esc(lt(x[1])) + "</button>"; }).join("") + '</div><div id="slLBody">' + body + "</div></div>" +
      '</div><div class="sl-sticky"><div class="o3">' + action + '</div><div id="slLSeat" class="o4">' + seatPanel(k, td) + '</div><div id="slLCreator" class="o6">' + creatorPanel(k, td) + "</div></div></div>";
  }
  function onToken(addr) { return location.hash.toLowerCase().indexOf(addr.toLowerCase()) >= 0; }
  // reload stale coin data without looping renders; a full render only when nothing is being typed or the status changed
  function ensureToken(k, addr) {
    var td = TD[k + ":" + addr];
    if (!td || td.loading || (td.at && Date.now() - td.at < 8000)) return;
    loadToken(k, addr, true).then(function () {
      if (!onToken(addr)) return;
      var inp = document.getElementById("slLAmt");
      if (inp && inp.value && td.c && statusOf(k, td.c) === td.shown) refreshToken(k, addr); else X.render();
    }, function () {});
  }
  function refreshToken(k, addr) {
    var td = TD[k + ":" + addr]; if (!td || !td.c) return;
    if (statusOf(k, td.c) !== td.shown) { X.render(); return; }
    var set = function (id, h) { var el = document.getElementById(id); if (el) el.innerHTML = h; };
    set("slLPrice", priceBar(k, td)); set("slLMeter", meterHtml(k, td)); set("slLSeat", seatPanel(k, td)); set("slLCreator", creatorPanel(k, td));
    if (ui.ctab === "act") set("slLBody", actsTable(k, td));
    var inp = document.getElementById("slLAmt"); if (inp && inp.value && inp._upd) inp._upd();
  }

  /* ------------------------------------------------------------------ me / stats */
  function meView(net) {
    if (!W.addr) return '<div class="sl-pagehead"><span class="sl-eyebrow"><i class="rule"></i>Sectora Launch</span><h1>' + X.esc(lt("me_t")) + '</h1></div><div class="sl-empty">' + X.ico("wallet") + "<p>" + X.esc(lt("c_need_wallet")) + '</p><button class="sl-btn sl-btn-p" data-a="wconnect">' + X.esc(lt("w_connect")) + "</button></div>";
    var ch = CHAINS[net], ms = meState(net), st = chainState(net);
    if (deployed(net) && (!ms.at || Date.now() - ms.at > 15000)) loadMe(net).then(function () { if (/#\/me/.test(location.hash)) X.render(); }, function () {});
    var mine = st.coins.filter(function (c) { return c.creator === W.addr; });
    var seated = st.coins.filter(function (c) { return ms.seats[c.addr]; });
    var seatsHtml = !seated.length ? '<p class="dim">' + X.esc(lt("me_none")) + "</p>" :
      '<div class="sl-mkt"><div class="sl-table-wrap"><table class="sl-table"><thead><tr><th>' + X.esc(X.t("th_coin")) + '</th><th class="r">' + X.esc(lt("me_in")) + "</th><th>" + X.esc(lt("me_status")) + '</th><th class="r">' + X.esc(lt("me_get")) + "</th></tr></thead><tbody>" +
      seated.map(function (c) {
        var s = ms.seats[c.addr], href = "#/t/" + net + "/" + c.addr, stt = statusOf(net, c);
        return '<tr data-go="' + href + '"><td><div class="sl-coin">' + logoTag(c, "sl-logo") + '<div><b><a href="' + href + '">' + X.esc(c.name) + "</a></b><span>$" + X.esc(c.sym) + "</span></div></div></td>" +
          '<td class="r num">' + X.esc(amt(fx(s.amount), ch.qs)) + "</td><td>" + progCell(net, c) + '</td><td class="r num">' + (stt === "live" ? X.esc(X.compact(fx(s.claimable))) + ' <span class="faint">$' + X.esc(c.sym) + "</span>" : "—") + "</td></tr>";
      }).join("") + "</tbody></table></div></div>";
    return '<div class="sl-pagehead"><span class="sl-eyebrow"><i class="rule"></i>' + X.esc(W.info && W.info.name || "Wallet") + "</span><h1>" + X.esc(lt("me_t")) + "</h1></div>" +
      '<div class="sl-panel"><div class="sl-kv"><span>' + X.esc(lt("w_addr")) + '</span><b class="mono">' + (isLive(net) ? addrLink(net, W.addr, W.addr) : X.esc(W.addr)) + "</b></div>" +
      '<div class="sl-kv"><span>' + X.esc(lt("net")) + "</span><b>" + chainDot(net) + " " + X.esc(ch.name) + "</b></div>" +
      '<div class="sl-kv"><span>' + X.esc(lt("eth_bal", { s: ch.sym })) + '</span><b class="num">' + (ms.native != null ? X.esc(amt(fx(ms.native), ch.sym)) + ' <small class="faint">' + X.esc(ethUsd(net, fx(ms.native))) + "</small>" : "…") + "</b></div>" +
      '<div class="sl-kv"><span>' + X.esc(lt("sect_bal")) + '</span><b class="num">' + (ms.sect != null ? X.esc(amt(fx(ms.sect), ch.qs)) + " " + usdLine(net, fx(ms.sect)) : "…") + "</b></div>" +
      (deployed(net) ? '<div class="sl-kv"><span>' + X.esc(lt("me_fees")) + '</span><b class="num">' + X.esc(amt(fx(ms.fees || 0n), ch.qs)) + "</b></div>" +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="sl-btn sl-btn-p" data-a="lclaimfees"' + (ms.fees > 0n ? "" : " disabled") + ">" + X.esc(lt("cr_claim")) + '</button><button class="sl-btn" data-a="wdisconnect">' + X.esc(lt("w_disconnect")) + "</button></div>" : '<button class="sl-btn" style="margin-top:12px" data-a="wdisconnect">' + X.esc(lt("w_disconnect")) + "</button>") + "</div>" +
      (deployed(net) ? '<section class="sl-sec"><div class="sl-head"><div><h2>' + X.esc(lt("me_seats")) + "</h2></div></div>" + seatsHtml + "</section>" +
        '<section class="sl-sec"><div class="sl-head"><div><h2>' + X.esc(lt("me_coins")) + "</h2></div></div>" + (mine.length ? '<div class="sl-mkt">' + coinTable(net, mine) + "</div>" : '<p class="dim">' + X.esc(lt("me_none")) + "</p>") + "</section>" : offHtml(net));
  }
  function burnPanel() {
    var k = liveChains()[0]; if (!k) return "";
    var st = chainState(k), cf = st.cfg, ch = CHAINS[k];
    if (!st.at || !cf) return "";
    var fees = fx(st.fees || 0n), pend = fees * cf.burn / 10000;
    return '<div class="sl-panel"><h3>' + X.ico("fire") + X.esc(lt("st_burned")) + "</h3>" + kv(lt("st_burned"), amt(fx(st.burned || 0n), ch.qs), usdOf(k, fx(st.burned || 0n))) +
      kv(lt("burn_pend_l"), amt(pend, ch.qs), usdOf(k, pend)) +
      '<p class="sl-note">' + X.esc(lt("burn_p", { b: Math.round(cf.burn / 100) })) + "</p>" +
      '<button class="sl-btn sl-btn-p" style="margin-top:12px" data-a="lburn" data-v="' + k + '"' + (fees > 0 ? "" : " disabled") + ">" + X.ico("fire") + X.esc(lt("burn_btn")) + "</button></div>";
  }
  function statsView() {
    var live = liveChains();
    live.forEach(function (k) { if (!chainState(k).at || !chainState(k).cfg) loadChain(k).then(function () { if (/#\/stats/.test(location.hash)) X.render(); }, function () {}); });
    return '<div class="sl-pagehead"><span class="sl-eyebrow"><i class="rule"></i>Sectora Launch</span><h1>' + X.esc(lt("stats_t")) + "</h1><p>" + X.esc(lt("soon_on", { n: live.length })) + "</p></div>" +
      '<div class="sl-panel"><div class="sl-table-wrap"><table class="sl-table"><thead><tr><th>' + X.esc(lt("net")) + '</th><th class="r">' + X.esc(lt("st_coins")) + '</th><th class="r">' + X.esc(lt("st_open")) + '</th><th class="r">' + X.esc(lt("st_live")) + '</th><th class="r sl-hide-sm">' + X.esc(lt("st_inres")) + '</th><th class="r sl-hide-sm">' + X.esc(lt("st_burned")) + "</th></tr></thead><tbody>" +
      ORDER.map(function (k) {
        var on = deployed(k), st = chainState(k), ch = CHAINS[k];
        if (!on) return "<tr><td>" + chainDot(k) + " " + X.esc(ch.name) + '</td><td class="r faint" colspan="5">' + X.esc(lt("net_soon")) + "</td></tr>";
        var n = counts(k), ok = !!st.at;
        return '<tr><td><button class="sl-link" data-a="setnet" data-v="' + k + '">' + chainDot(k) + " " + X.esc(ch.name) + '</button></td><td class="r num">' + (ok ? X.nf(st.count, 0) : "…") + '</td><td class="r num">' + (ok ? X.nf(n.open, 0) : "…") + '</td><td class="r num">' + (ok ? X.nf(n.live, 0) : "…") +
          '</td><td class="r num sl-hide-sm">' + (ok ? X.esc(amt(n.inres, ch.qs)) : "…") + '</td><td class="r num sl-hide-sm">' + (ok ? X.esc(amt(fx(st.burned || 0n), ch.qs)) : "…") + "</td></tr>";
      }).join("") +
      '<tr><td><i class="sl-cdot is-sect"></i> SectoraEVM</td><td class="r faint" colspan="5">' + X.esc(lt("sectora_note", { d: MAINNET_TXT })) + "</td></tr></tbody></table></div></div>" + burnPanel() + soonBand();
  }

  /* ------------------------------------------------------------------ actions */
  function invalidate(net, tk) { chainState(net).at = 0; ME[net] && (ME[net].at = 0); if (tk && TD[net + ":" + tk]) TD[net + ":" + tk].at = 0; }
  function onAction(act, v, el, net, view, args) {
    if (act === "netmenu") { toggleNetMenu(net, el); return true; }
    if (act === "setnet") { var mm = document.getElementById("slNetMenu"); if (mm) mm.remove(); X.setNet(v); return true; }
    if (act === "wconnect") { connect(); return true; }
    if (act === "wdisconnect") { disconnect(); return true; }
    if (act === "wswitch") { if (isLive(net)) ensureChain(net).then(function () { X.render(); }, function (err) { if (!isReject(err)) X.toast(X.esc(errMsg(err)), "bad"); }); return true; }
    if (!isLive(net)) return false;
    var tk = view === "t" && args[1] && E.isAddress(args[1]) ? E.getAddress(args[1]) : null, tnet = view === "t" && args[0] ? args[0] : net;
    if (act === "ltab") { ui.tab = v; var g = document.getElementById("slLGrid"); if (g) g.innerHTML = gridHtml(net); document.querySelectorAll('[data-a="ltab"]').forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === v); }); return true; }
    if (act === "lsup") { draft.supply = String(v); draft.touched.supply = true; X.render(); return true; }
    if (act === "ldur") { draft.dur = +v; X.render(); return true; }
    if (act === "lcpay") { draft.pay = v; draft.join = ""; X.render(); return true; }
    if (act === "ljoinamt") { draft.join = String(v); var d = document.getElementById("slLJoin"); if (d) { d.value = draft.join; d.dispatchEvent(new Event("input")); } return true; }
    if (act === "llaunch") { doCreate(net); return true; }
    if (act === "lside") { ui.side = v; ui.amt = ""; X.render(); return true; }
    if (act === "lpay") { ui.pay = v; ui.amt = ""; X.render(); return true; }
    if (act === "lctab") { ui.ctab = v; X.render(); return true; }
    if (act === "lslip") { ui.slip = +v; document.querySelectorAll('[data-a="lslip"]').forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-v") === v); }); var i0 = document.getElementById("slLAmt"); if (i0 && i0._upd) i0._upd(); return true; }
    if (act === "lamt") { var i1 = document.getElementById("slLAmt"); if (i1) { i1.value = v; i1._upd && i1._upd(); } return true; }
    if (act === "lpct") {
      var td0 = TD[args[0] + ":" + tk], i2 = document.getElementById("slLAmt");
      if (td0 && td0.mine && i2) { var b = td0.mine.bal * BigInt(Math.round(parseFloat(v) * 10000)) / 10000n; i2.value = b > 0n ? E.formatEther(b) : ""; i2._upd && i2._upd(); }
      return true;
    }
    if (act === "ltrade") { if (tk) doTrade(tnet, tk); return true; }
    if (act === "lwithdraw" && tk) { txFlow(tnet, function (s) { return fac(tnet, s).withdraw(tk); }, function () { invalidate(tnet, tk); return { html: X.esc(lt("ok_withdraw")) }; }); return true; }
    if (act === "llock" && tk) { txFlow(tnet, function (s) { return fac(tnet, s).lockSeat(tk); }, function () { invalidate(tnet, tk); return { html: X.esc(lt("ok_lock")) }; }); return true; }
    if (act === "lclaim" && tk) { txFlow(tnet, function (s) { return fac(tnet, s).claim(tk); }, function () { invalidate(tnet, tk); return { html: X.esc(lt("ok_claim")) }; }); return true; }
    if (act === "lclaimc" && tk) { txFlow(tnet, function (s) { return fac(tnet, s).claimCreatorTokens(tk); }, function () { invalidate(tnet, tk); return { html: X.esc(lt("ok_ctok")) }; }); return true; }
    if (act === "lclaimfees") {
      txFlow(net, function (s) { return fac(net, s).claimCreatorFees(); }, function () { ME[net] && (ME[net].at = 0); Object.keys(TD).forEach(function (key) { TD[key].at = 0; }); return { html: X.esc(lt("ok_fees")) }; });
      return true;
    }
    if (act === "lburn") {
      if (!W.addr) { connect(); return true; }
      var bk = v || net;
      txFlow(bk, function (s2) { return fac(bk, s2).withdrawProtocolFees(); }, function () { chainState(bk).at = 0; return { html: X.esc(lt("ok_burn")) }; });
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
      loadToken(args[0], addr).then(function () { if (onToken(addr)) refreshToken(args[0], addr); }, function () {});
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
    t: override, netChip: netChip, acctBtn: acctBtn, banner: banner, hud: hud, storyRaise: storyRaise, factory: factoryOf, sizes: usdSizes,
    explore: explore, statTiles: statTiles, create: createView, token: tokenView, me: meView, stats: statsView,
    onAction: onAction, wire: wire, tick: tick, refresh: refresh,
    wallet: function () { return W.addr; }
  };
})();
