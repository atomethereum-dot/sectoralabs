/* Sectora Launch intro guide: texts (EN / ES / PT here, 8 more languages in lang/), reference screenshots per language,
 * comparison table and the "what Sectora gains" table computed with the live SECT price. */
(function () {
  "use strict";
  var SECT = "0x8C9984B06281f1CA9416e493c2E602AaB08513db";
  var SUPPLY_AFTER_BURN = 25e6;
  var X = '<svg class="x" viewBox="0 0 24 24" fill="none" stroke-width="2.2"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var OK = '<svg class="ok" viewBox="0 0 24 24" fill="none" stroke-width="2.2"><path d="M5 12l5 5L20 7"/></svg>';
  var T = {};

  T.en = {
    title: "Sectora Launch · Same price as the creator", gl: "Launch · Intro guide", open: "Open the app",
    h_eb: "Sectora Launch · Introduction guide",
    h_t: "You pay the same price as the creator. <span>If it does not fill, you get 100 % back.</span>",
    h_p: "Nobody gets a cheaper price, every wallet has a maximum and the liquidity is locked forever. This guide shows <b>how it works</b>, <b>how your investment is protected</b> and <b>why every launch makes SECT stronger</b>, with screenshots of the app.",
    c_start: "Start the guide ↓", c_explore: "Explore coins", c_create: "Create a coin",
    k_eb: "Sectora Launch in one sentence", k_t: "A fair launch, <b>or you get 100 % back.</b>",
    k1t: "Same price for everyone", k1p: "Neither the creator nor the bots buy cheaper than you.",
    k2t: "The goal or a refund", k2p: "If the reserve does not reach its goal in time, you take back 100 %.",
    k3t: "Liquidity burned", k3p: "At launch the liquidity is locked forever on Uniswap.",
    k_note: "Everything is done by the smart contract. <b>No promises, no middlemen.</b>",
    pa_l: "Part A · Steps 1–4", pa_t: "How it works", pa_p: "Create, reserve, launch and receive.",
    pb_l: "Part B · Your money", pb_t: "Your investment", pb_p: "Why the 75 % already covers what you put in.",
    pc_l: "Part C · SECT", pc_t: "What Sectora gains", pc_p: "Why every launch benefits SECT holders.",
    pd_l: "Part D · Safety", pd_t: "Protections", pd_p: "The 8 protections and the comparison.",
    p_eb: "The problem", p_t: "Why most new coins <span>end badly</span>",
    p_p: "On most launchpads the price rises with every buy. Whoever buys first pays the least, and that is usually bots, insiders or the creator. When the price climbs, they sell to the people who arrived later.",
    p1t: "Snipers buy first", p1p: "Bots buy in the first seconds at the lowest price and sell into the first wave of real buyers.",
    p2t: "The creator dumps", p2p: "The creator can buy cheap at launch and sell everything at any moment, often minutes later.",
    p3t: "There is no way back", p3p: "If the coin never takes off, the buyers keep the loss. Nothing is returned.",
    f_p: "of the tokens launched on pump.fun showed pump-and-dump or rug-pull patterns, according to a report by Solidus Labs.<small>pump.fun disputes the figure.</small>",
    a_eb: "Part A · Steps 1–4", a_t: "How it works, <span>step by step</span>", a_l: "Part A",
    a_p: "A coin on Sectora Launch first opens a <b>reserve</b>. It only goes live when the reserve reaches its goal. Until then, your money can always come back.",
    s1t: "The creator opens a reserve",
    s1a: "Anyone creates a coin <b>for free</b>: name, ticker, supply. The token has a fixed supply, no owner, no mint and no tax.",
    s1b: "The creator picks the goal: <span class=\"chip o\">$3,000</span> <span class=\"chip o\">$7,000</span> or <span class=\"chip o\">$15,000</span>.",
    s1c: "The maximum per wallet grows with the goal ($150, $350 or $500), so <b>every launch needs at least 20 different wallets</b>.",
    s1cap: "The goal picker in the create page. Reference view with a test coin.",
    s2t: "You join the reserve",
    s2a: "You pay with <span class=\"chip\">ETH</span> <span class=\"chip\">USDT</span> or <span class=\"chip\">SECT</span>. ETH and USDT are swapped to SECT automatically.",
    s2b: "Everyone pays <b>the same price</b>. The app shows how many tokens you get and what they are worth at the opening price.",
    s2c: "Changed your mind? <b>Take back 100 % at any time</b> before launch, with no fees.",
    s2cap: "Joining a reserve with 500 USDT, the maximum per wallet, on a computer and on a phone. Reference views with a test coin.",
    s3t: "The goal is reached: the coin goes live",
    s3a: "In the same transaction, <b>98 % of the reserve</b> and the pool share of the tokens become a pool on Uniswap.",
    s3b: "The pool opens <b>50 % above the reserve price</b>. Everyone who joined starts above what they paid.",
    s3c: "The liquidity tokens go to 0x…dEaD: <b>nobody can ever pull the liquidity</b>.",
    s3cap: "A reserve in progress: price in the reserve, opening price, how much has been raised and how much is missing.",
    s4t: "You receive your tokens",
    s4a: "<b>75 %</b> of your tokens at launch, the other <b>25 % over 7 days</b>.",
    s4b: "Or lock for 30 days: you get everything on day 30 plus a <b>bonus of up to +25 %</b>.",
    s4c: "The coin trades on Uniswap against SECT. You can buy, sell or hold.",
    s4cap: "The list of coins: open reserves, how far each one is and the ones already live on Uniswap.",
    w_note: "<b>The goal is not reached in time?</b> Everyone takes back 100 % of what they put in. No fees, no small print.",
    b_eb: "Part B · Your investment", b_t: "With the 75 % you get your 100 % back. <span>The 25 % is profit.</span>",
    b_p: "Because the pool opens 50 % above the price everyone paid in the reserve, the 75 % you receive at launch is already worth more than everything you put in. The 25 % that arrives over the next 7 days is the gain: the reflection of that 50 % rise.",
    b_exh: "Example · you put $500 in a reserve (the maximum per wallet)",
    b_r1: "You put in the reserve", b_r2: "Your tokens at the opening price (+50 %)", b_r3: "75 % delivered at launch", b_r4: "25 % delivered over 7 days", b_r5: "Total gain at the opening price",
    bl_in: "What you put in", bk_in: "your investment",
    bl_out: "What you receive, at the opening price", bk_a: "75 % · covers your $500", bk_c: "25 % · gain",
    b_bars: "The 75 % ($562.50) is more than your $500: <b>your whole investment is covered from day one</b>. The 25 % ($187.50) is pure gain, and with the $62.50 extra inside the 75 % it adds up to the +50 % ($250).",
    b1t: "Risk covered from day one", b1p: "At the opening price, the tokens you receive at launch are worth 112.5 % of what you paid.",
    b2t: "The gain arrives gradually", b2p: "The 25 % over 7 days keeps the price from being crushed in the first minute, which protects the value of what you already hold.",
    b3t: "Or lock and earn more", b3p: "Lock for 30 days and receive everything plus a bonus of up to +25 %: up to $937.50 for your $500 at the opening price.",
    b_warn: "<b>Important:</b> the values are calculated at the opening price. Once trading starts the market sets the price: it can go up or down, and selling large amounts moves the price. The rules protect you from unfair launches, not from the market.",
    c_eb: "Part C · Why it matters for SECT holders", c_t: "Every launch <span>works for SECT</span>",
    c_p: "Every coin on Sectora Launch is priced in SECT. That means every reserve, every launch and every trade of every coin needs SECT. If you hold SECT, the launchpad is working for you.",
    fl1t: "A creator opens a reserve", fl1p: "And promotes their coin to their own community.",
    fl2t: "Buyers pay ETH or USDT", fl2p: "Or SECT, if they already have it.",
    fl3t: "The contract buys SECT", fl3p: "On the SECT/USDT pool, automatically, with every payment.",
    fl4t: "98 % is locked forever", fl4p: "In the coin's pool on Uniswap, with the LP burned.",
    fl5t: "Fees: half burned", fl5p: "Sectora's 1 % is paid in SECT and half of it is burned.",
    cb1t: "Constant buying of SECT", cb1p: "Every ETH or USDT payment into a reserve is a purchase of SECT on the market.",
    cb2t: "SECT out of circulation, forever", cb2p: "98 % of each reserve stays locked in a pool whose liquidity can never be withdrawn.",
    cb3t: "More SECT burned", cb3p: "Half of Sectora's fee is burned in SECT, on top of the burn of 25 million SECT in March.",
    cb4t: "SECT becomes the base currency", cb4p: "Every coin trades against SECT on Uniswap. Buying any of them means buying SECT first.",
    cb5t: "Other creators do the marketing", cb5p: "Each creator promotes their own coin. Every buyer they bring is a new SECT buyer.",
    cb6t: "Ready for SectoraEVM", cb6p: "The same launchpad will run on SectoraEVM, Sectora's own network, expected around March 2027.",
    lv_eb: "For creators · Creator levels", lv_t: "Level up <span>with every launch</span>", lv_p: "Every creator has a profile with levels. It goes up with every launch you make, according to how successful it is.",
    lv1t: "Level up your rank as a creator", lv1p: "The more successful your launch, the higher your level.",
    lv2t: "Become a known creator", lv2p: "Make every coin you launch a success.",
    lv3t: "Good for you and your community", lv3p: "It benefits you and your whole community.",
    lv_prof: "Your creator profile", lv_lvl: "Levels 1 to 5",
    ct_title: "How much SECT each launch moves",
    th2: ["Goal", "SECT bought", "Locked forever at launch", "Still locked even if everyone sells", "Burned"],
    px_live: "Calculated with the real SECT price right now: <b>{p}</b> (DexScreener). The figures change with the price.",
    px_off: "The live SECT price could not be loaded right now; amounts are shown in dollars of SECT.",
    big_l: "Example · 100 launches of $7,000", big_s: "SECT bought from the market",
    big_p: "That is <b>{pct}</b> of the 25 million SECT that will remain after the March burn, and <b>{lk}</b> of it stays locked forever in the pools. An illustration at today's price, not a forecast: the more SECT is bought, the higher its price and the fewer SECT each launch needs.",
    big_off: "Every launch of $7,000 buys $7,000 worth of SECT, and $6,860 of it stays locked forever in the pool.",
    usdOf: "of SECT",
    d_eb: "Part D · Safety",
    g_t: "Eight protections, <span>enforced by code</span>", g_p: "None of them depends on trusting the team. They are rules of the smart contract and apply to every coin, automatically.",
    g1t: "One price for everyone", g1p: "No early-bird discount and no curve to front-run. Bots get no advantage.",
    g2t: "Maximum per wallet", g2p: "$150, $350 or $500 per wallet. No whale and no creator can take most of the supply.",
    g3t: "100 % refund", g3p: "If the reserve does not reach its goal in time, everyone takes back everything. No fees.",
    g4t: "Liquidity burned forever", g4p: "At launch the LP tokens are sent to 0x…dEaD. The liquidity can never be pulled.",
    g5t: "A clean token", g5p: "Fixed supply. No owner, no mint, no tax, no blacklist, no transfer tricks.",
    g6t: "Creator vesting", g6p: "The creator's 5 % unlocks over 30 days. No dumping on day one.",
    g7t: "Gradual delivery", g7p: "75 % at launch and 25 % over 7 days, so the price is not crushed in the first minute.",
    g8t: "Rules nobody can change", g8p: "No pause button and no admin power over reserves, pools or coins. The owner can only change where Sectora's fee is paid.",
    sh_t: "Sectora Shield: the proof on every coin", sh_p: "Every coin page has a Shield tab that checks the protections live: fixed supply, no owner, liquidity locked, one price, refund, gradual delivery, an original name and ticker. Buyers see it before they put in a single dollar.",
    sh_cap: "A coin already live on Uniswap, with its Shield score of 100. Reference view with a test coin.",
    t_t: "Sectora Launch vs typical launchpads", t_p: "Most launchpads, including pump.fun, sell new coins on a bonding curve. This is what changes.",
    th: ["", "Typical launchpads", "Sectora Launch"],
    rows: [
      ["Price for buyers", "Rises with every buy: the first buyers pay the least", "The same price for everyone in the reserve"],
      ["Sniper bots", "Buy in the first seconds at the lowest price", "No advantage: same price and a maximum per wallet"],
      ["The creator at launch", "Can buy first and sell at any moment", "No cheaper price; their 5 % unlocks over 30 days"],
      ["Maximum per wallet", "None", "$150, $350 or $500"],
      ["If the coin does not take off", "The buyers keep the loss", "100 % back before launch, no fees"],
      ["Opening price", "Set by the curve", "50 % above what the reserve paid"],
      ["Tokens at launch", "Everything can be sold at once", "75 % at launch, 25 % over 7 days"],
      ["Liquidity", "Depends on each platform", "Burned forever at launch"]
    ],
    v_eb: "Don't trust. Verify.", v_t: "Open source, on Ethereum, <span>checkable by anyone</span>",
    v_p: "Sectora Launch runs on an open-source smart contract. Every reserve, every launch and every burned LP token can be checked on-chain, by anyone, at any time.",
    v_code: "Read the contract", v_sec: "Security", v_tr: "Transparency",
    q_eb: "Questions", q_t: "Frequently asked <span>questions</span>",
    q1: "Can the creator run away with the money?", a1: "No. The reserve is held by the smart contract. At launch 98 % goes into the Uniswap pool and the LP tokens are burned. The creator only receives a 1 % fee and 5 % of the tokens over 30 days.",
    q2: "What happens if the reserve does not fill?", a2: "After the deadline everyone takes back 100 % of what they put in. You can also withdraw at any time before launch. No fees in either case.",
    q6: "Is the +50 % guaranteed?", a6: "The pool always opens 50 % above the reserve price: that is a rule of the contract. What happens after the opening depends on the market: the price can go up or down.",
    q3: "Why is every coin priced in SECT?", a3: "SECT is the currency of the Sectora ecosystem. You can pay with ETH, USDT or SECT: ETH and USDT are swapped to SECT automatically on Uniswap.",
    q7: "How does this help me if I hold SECT?", a7: "Every launch buys SECT on the market, locks 98 % of it forever in a pool and burns part of the fees. More launches mean more demand for SECT and fewer SECT in circulation.",
    q4: "Does this mean a coin cannot lose value?", a4: "No. The rules remove rug pulls and unfair advantages, but a new coin is still high risk: its price depends on the people who buy and sell it.",
    q5: "Which network does it use?", a5: "Ethereum today. SectoraEVM, Sectora's own network, is expected around March 2027.",
    e_t: "Launch fair. Buy fair. <span>Hold SECT.</span>", e_p: "The launchpad where the rules protect the buyer, and every launch makes SECT stronger.",
    risk: "New coins are high risk. Sectora Launch protects against unfair launches, not against market losses. Only use money you can afford to lose. Screenshots are reference views with test coins.",
    foot: "© 2026 Sectora Foundation IL. All rights reserved."
  };

  T.es = {
    title: "Sectora Launch · El mismo precio que el creador", gl: "Launch · Guía de introducción", open: "Abrir la app",
    h_eb: "Sectora Launch · Guía de introducción",
    h_t: "Pagas el mismo precio que el creador. <span>Si no se llena, recuperas el 100 %.</span>",
    h_p: "Nadie consigue un precio más barato, cada wallet tiene un máximo y la liquidez queda bloqueada para siempre. Esta guía te muestra <b>cómo funciona</b>, <b>cómo se protege tu inversión</b> y <b>por qué cada lanzamiento hace más fuerte a SECT</b>, con capturas de la app.",
    c_start: "Empezar la guía ↓", c_explore: "Explorar monedas", c_create: "Crear una moneda",
    k_eb: "Sectora Launch en una frase", k_t: "Un lanzamiento justo, <b>o recuperas el 100 %.</b>",
    k1t: "El mismo precio para todos", k1p: "Ni el creador ni los bots compran más barato que tú.",
    k2t: "Meta o devolución", k2p: "Si la reserva no llega a su meta a tiempo, recuperas el 100 %.",
    k3t: "Liquidez quemada", k3p: "Al lanzar, la liquidez queda bloqueada para siempre en Uniswap.",
    k_note: "Todo lo hace el contrato inteligente. <b>Sin promesas, sin intermediarios.</b>",
    pa_l: "Parte A · Pasos 1–4", pa_t: "Cómo funciona", pa_p: "Crear, reservar, lanzar y recibir.",
    pb_l: "Parte B · Tu dinero", pb_t: "Tu inversión", pb_p: "Por qué el 75 % ya cubre lo que pones.",
    pc_l: "Parte C · SECT", pc_t: "Qué gana Sectora", pc_p: "Por qué cada lanzamiento beneficia a los holders de SECT.",
    pd_l: "Parte D · Seguridad", pd_t: "Protecciones", pd_p: "Las 8 protecciones y la comparación.",
    p_eb: "El problema", p_t: "Por qué la mayoría de monedas nuevas <span>terminan mal</span>",
    p_p: "En la mayoría de launchpads el precio sube con cada compra. Quien compra primero paga menos, y casi siempre son bots, gente de dentro o el propio creador. Cuando el precio sube, le venden a los que llegaron después.",
    p1t: "Los snipers compran primero", p1p: "Los bots compran en los primeros segundos al precio más bajo y le venden a la primera ola de compradores reales.",
    p2t: "El creador vende todo", p2p: "El creador puede comprar barato al lanzar y venderlo todo en cualquier momento, muchas veces minutos después.",
    p3t: "No hay vuelta atrás", p3p: "Si la moneda nunca despega, los compradores se quedan con la pérdida. No se devuelve nada.",
    f_p: "de los tokens lanzados en pump.fun mostraron patrones de pump-and-dump o rug pull, según un informe de Solidus Labs.<small>pump.fun discute la cifra.</small>",
    a_eb: "Parte A · Pasos 1–4", a_t: "Cómo funciona, <span>paso a paso</span>", a_l: "Parte A",
    a_p: "Una moneda en Sectora Launch primero abre una <b>reserva</b>. Solo sale al mercado cuando la reserva llega a su meta. Hasta entonces, tu dinero siempre puede volver.",
    s1t: "El creador abre una reserva",
    s1a: "Cualquiera crea una moneda <b>gratis</b>: nombre, ticker y supply. El token tiene supply fijo, sin dueño, sin emisión y sin impuestos.",
    s1b: "El creador elige la meta: <span class=\"chip o\">$3.000</span> <span class=\"chip o\">$7.000</span> o <span class=\"chip o\">$15.000</span>.",
    s1c: "El máximo por wallet sube con la meta ($150, $350 o $500), así que <b>cada lanzamiento necesita al menos 20 wallets distintas</b>.",
    s1cap: "El selector de meta en la página de crear. Vista de referencia con una moneda de prueba.",
    s2t: "Entras en la reserva",
    s2a: "Pagas con <span class=\"chip\">ETH</span> <span class=\"chip\">USDT</span> o <span class=\"chip\">SECT</span>. El ETH y el USDT se cambian a SECT automáticamente.",
    s2b: "Todos pagan <b>el mismo precio</b>. La app te muestra cuántos tokens recibes y cuánto valen al precio de apertura.",
    s2c: "¿Cambiaste de idea? <b>Retiras el 100 % cuando quieras</b> antes del lanzamiento, sin comisiones.",
    s2cap: "Entrar en una reserva con 500 USDT, el máximo por wallet, desde el ordenador y desde el móvil. Vistas de referencia con una moneda de prueba.",
    s3t: "Se llega a la meta: la moneda sale al mercado",
    s3a: "En la misma transacción, <b>el 98 % de la reserva</b> y la parte de tokens del pool forman una pool en Uniswap.",
    s3b: "La pool abre <b>un 50 % por encima del precio de la reserva</b>. Todos los que entraron empiezan por encima de lo que pagaron.",
    s3c: "Los tokens de liquidez van a 0x…dEaD: <b>nadie puede retirar nunca la liquidez</b>.",
    s3cap: "Una reserva en curso: precio en la reserva, precio de apertura, cuánto se ha reunido y cuánto falta.",
    s4t: "Recibes tus tokens",
    s4a: "El <b>75 %</b> de tus tokens al lanzar y el otro <b>25 % en 7 días</b>.",
    s4b: "O bloquea 30 días: recibes todo el día 30 más un <b>bonus de hasta +25 %</b>.",
    s4c: "La moneda cotiza en Uniswap contra SECT. Puedes comprar, vender o mantener.",
    s4cap: "La lista de monedas: reservas abiertas, cuánto le falta a cada una y las que ya están en Uniswap.",
    w_note: "<b>¿No se llega a la meta a tiempo?</b> Todos recuperan el 100 % de lo que pusieron. Sin comisiones, sin letra pequeña.",
    b_eb: "Parte B · Tu inversión", b_t: "Con el 75 % recuperas el 100 %. <span>El 25 % es ganancia.</span>",
    b_p: "Como la pool abre un 50 % por encima del precio que todos pagaron en la reserva, el 75 % que recibes al lanzar ya vale más que todo lo que pusiste. El 25 % que llega en los 7 días siguientes es la ganancia: el reflejo de esa subida del 50 %.",
    b_exh: "Ejemplo · pones $500 en una reserva (el máximo por wallet)",
    b_r1: "Pones en la reserva", b_r2: "Tus tokens al precio de apertura (+50 %)", b_r3: "75 % que recibes al lanzar", b_r4: "25 % que recibes en 7 días", b_r5: "Ganancia total al precio de apertura",
    bl_in: "Lo que pones", bk_in: "tu inversión",
    bl_out: "Lo que recibes, al precio de apertura", bk_a: "75 % · cubre tus $500", bk_c: "25 % · ganancia",
    b_bars: "El 75 % ($562,50) es más que tus $500: <b>toda tu inversión queda cubierta desde el primer día</b>. El 25 % ($187,50) es ganancia pura, y con los $62,50 de más dentro del 75 % suma el +50 % ($250).",
    b1t: "Riesgo cubierto desde el día uno", b1p: "Al precio de apertura, los tokens que recibes al lanzar valen el 112,5 % de lo que pagaste.",
    b2t: "La ganancia llega poco a poco", b2p: "El 25 % en 7 días evita que el precio se hunda en el primer minuto, y eso protege el valor de lo que ya tienes.",
    b3t: "O bloquea y gana más", b3p: "Bloquea 30 días y recibe todo más un bonus de hasta +25 %: hasta $937,50 por tus $500 al precio de apertura.",
    b_warn: "<b>Importante:</b> los valores se calculan al precio de apertura. Cuando empieza el trading, el precio lo pone el mercado: puede subir o bajar, y vender cantidades grandes mueve el precio. Las reglas te protegen de lanzamientos injustos, no del mercado.",
    c_eb: "Parte C · Por qué importa a los holders de SECT", c_t: "Cada lanzamiento <span>trabaja para SECT</span>",
    c_p: "Todas las monedas de Sectora Launch cotizan en SECT. Eso significa que cada reserva, cada lanzamiento y cada operación de cada moneda necesita SECT. Si tienes SECT, el launchpad trabaja para ti.",
    fl1t: "Un creador abre una reserva", fl1p: "Y promociona su moneda en su propia comunidad.",
    fl2t: "Los compradores pagan ETH o USDT", fl2p: "O SECT, si ya lo tienen.",
    fl3t: "El contrato compra SECT", fl3p: "En la pool SECT/USDT, automáticamente, con cada pago.",
    fl4t: "El 98 % queda bloqueado para siempre", fl4p: "En la pool de la moneda en Uniswap, con el LP quemado.",
    fl5t: "Comisiones: la mitad se quema", fl5p: "El 1 % de Sectora se cobra en SECT y la mitad se quema.",
    cb1t: "Compra constante de SECT", cb1p: "Cada pago en ETH o USDT a una reserva es una compra de SECT en el mercado.",
    cb2t: "SECT fuera de circulación, para siempre", cb2p: "El 98 % de cada reserva queda bloqueado en una pool cuya liquidez nunca se puede retirar.",
    cb3t: "Más SECT quemado", cb3p: "La mitad de la comisión de Sectora se quema en SECT, además de la quema de 25 millones de SECT en marzo.",
    cb4t: "SECT se vuelve la moneda base", cb4p: "Todas las monedas cotizan contra SECT en Uniswap. Comprar cualquiera de ellas significa comprar SECT primero.",
    cb5t: "Otros creadores hacen la publicidad", cb5p: "Cada creador promociona su propia moneda. Cada comprador que trae es un nuevo comprador de SECT.",
    cb6t: "Listo para SectoraEVM", cb6p: "El mismo launchpad funcionará en SectoraEVM, la red propia de Sectora, prevista hacia marzo de 2027.",
    lv_eb: "Para creadores · Niveles de creador", lv_t: "Sube de nivel <span>con cada lanzamiento</span>", lv_p: "Cada creador tiene un perfil con niveles. Sube con cada lanzamiento que haces, según lo exitoso que sea.",
    lv1t: "Sube tu rango como creador", lv1p: "Cuanto más exitoso tu lanzamiento, más alto tu nivel.",
    lv2t: "Hazte un creador conocido", lv2p: "Haz que todas las monedas que lances sean un éxito.",
    lv3t: "Bueno para ti y tu comunidad", lv3p: "Te beneficiará a ti y a toda tu comunidad.",
    lv_prof: "Tu perfil de creador", lv_lvl: "Niveles 1 a 5",
    ct_title: "Cuánto SECT mueve cada lanzamiento",
    th2: ["Meta", "SECT comprado", "Bloqueado para siempre al lanzar", "Sigue bloqueado aunque todos vendan", "Quemado"],
    px_live: "Calculado con el precio real de SECT en este momento: <b>{p}</b> (DexScreener). Las cifras cambian con el precio.",
    px_off: "No se pudo cargar ahora el precio real de SECT; las cantidades se muestran en dólares de SECT.",
    big_l: "Ejemplo · 100 lanzamientos de $7.000", big_s: "SECT comprado en el mercado",
    big_p: "Eso es el <b>{pct}</b> de los 25 millones de SECT que quedarán tras la quema de marzo, y <b>{lk}</b> quedan bloqueados para siempre en las pools. Es una ilustración al precio de hoy, no una predicción: cuanto más SECT se compra, más sube su precio y menos SECT necesita cada lanzamiento.",
    big_off: "Cada lanzamiento de $7.000 compra $7.000 en SECT, y $6.860 quedan bloqueados para siempre en la pool.",
    usdOf: "en SECT",
    d_eb: "Parte D · Seguridad",
    g_t: "Ocho protecciones, <span>garantizadas por código</span>", g_p: "Ninguna depende de confiar en el equipo. Son reglas del contrato inteligente y se aplican a todas las monedas, automáticamente.",
    g1t: "Un solo precio para todos", g1p: "Sin descuento para los primeros y sin curva que adelantar. Los bots no tienen ventaja.",
    g2t: "Máximo por wallet", g2p: "$150, $350 o $500 por wallet. Ninguna ballena ni el creador pueden quedarse con la mayor parte.",
    g3t: "Devolución del 100 %", g3p: "Si la reserva no llega a su meta a tiempo, todos recuperan todo. Sin comisiones.",
    g4t: "Liquidez quemada para siempre", g4p: "Al lanzar, los tokens LP se envían a 0x…dEaD. La liquidez no se puede retirar nunca.",
    g5t: "Un token limpio", g5p: "Supply fijo. Sin dueño, sin emisión, sin impuestos, sin lista negra, sin trucos en las transferencias.",
    g6t: "Entrega gradual al creador", g6p: "El 5 % del creador se libera en 30 días. Nada de vender todo el primer día.",
    g7t: "Entrega gradual", g7p: "75 % al lanzar y 25 % en 7 días, para que el precio no se hunda en el primer minuto.",
    g8t: "Reglas que nadie puede cambiar", g8p: "Sin botón de pausa y sin poder de administrador sobre reservas, pools o monedas. El dueño solo puede cambiar a dónde se paga la comisión de Sectora.",
    sh_t: "Sectora Shield: la prueba en cada moneda", sh_p: "La página de cada moneda tiene una pestaña Shield que comprueba las protecciones en vivo: supply fijo, sin dueño, liquidez bloqueada, mismo precio, devolución, entrega gradual, nombre y ticker originales. El comprador lo ve antes de poner un solo dólar.",
    sh_cap: "Una moneda ya en Uniswap, con su puntuación Shield de 100. Vista de referencia con una moneda de prueba.",
    t_t: "Sectora Launch frente a los launchpads típicos", t_p: "La mayoría de launchpads, incluido pump.fun, venden las monedas nuevas con una curva de precios. Esto es lo que cambia.",
    th: ["", "Launchpads típicos", "Sectora Launch"],
    rows: [
      ["Precio para los compradores", "Sube con cada compra: los primeros pagan menos", "El mismo precio para todos en la reserva"],
      ["Bots snipers", "Compran en los primeros segundos al precio más bajo", "Sin ventaja: mismo precio y máximo por wallet"],
      ["El creador al lanzar", "Puede comprar primero y vender en cualquier momento", "Sin precio más barato; su 5 % se libera en 30 días"],
      ["Máximo por wallet", "Ninguno", "$150, $350 o $500"],
      ["Si la moneda no despega", "Los compradores se quedan con la pérdida", "100 % de vuelta antes del lanzamiento, sin comisiones"],
      ["Precio de apertura", "Lo marca la curva", "50 % por encima de lo que pagó la reserva"],
      ["Tokens al lanzar", "Todo se puede vender de golpe", "75 % al lanzar, 25 % en 7 días"],
      ["Liquidez", "Depende de cada plataforma", "Quemada para siempre al lanzar"]
    ],
    v_eb: "No confíes. Verifica.", v_t: "Código abierto, en Ethereum, <span>comprobable por cualquiera</span>",
    v_p: "Sectora Launch funciona con un contrato inteligente de código abierto. Cada reserva, cada lanzamiento y cada token LP quemado se puede comprobar en la blockchain, por cualquiera y en cualquier momento.",
    v_code: "Leer el contrato", v_sec: "Seguridad", v_tr: "Transparencia",
    q_eb: "Preguntas", q_t: "Preguntas <span>frecuentes</span>",
    q1: "¿Puede el creador escaparse con el dinero?", a1: "No. La reserva la guarda el contrato inteligente. Al lanzar, el 98 % entra en la pool de Uniswap y los tokens LP se queman. El creador solo recibe una comisión del 1 % y el 5 % de los tokens en 30 días.",
    q2: "¿Qué pasa si la reserva no se llena?", a2: "Tras la fecha límite, todos recuperan el 100 % de lo que pusieron. También puedes retirarte en cualquier momento antes del lanzamiento. Sin comisiones en ningún caso.",
    q6: "¿El +50 % está garantizado?", a6: "La pool siempre abre un 50 % por encima del precio de la reserva: es una regla del contrato. Lo que pasa después de la apertura depende del mercado: el precio puede subir o bajar.",
    q3: "¿Por qué todas las monedas cotizan en SECT?", a3: "SECT es la moneda del ecosistema Sectora. Puedes pagar con ETH, USDT o SECT: el ETH y el USDT se cambian a SECT automáticamente en Uniswap.",
    q7: "¿En qué me beneficia si tengo SECT?", a7: "Cada lanzamiento compra SECT en el mercado, bloquea el 98 % para siempre en una pool y quema parte de las comisiones. Más lanzamientos significan más demanda de SECT y menos SECT en circulación.",
    q4: "¿Significa esto que una moneda no puede perder valor?", a4: "No. Las reglas eliminan los rugs y las ventajas injustas, pero una moneda nueva sigue siendo de alto riesgo: su precio depende de quienes la compran y la venden.",
    q5: "¿Qué red usa?", a5: "Ethereum hoy. SectoraEVM, la red propia de Sectora, se espera hacia marzo de 2027.",
    e_t: "Lanza justo. Compra justo. <span>Mantén SECT.</span>", e_p: "El launchpad donde las reglas protegen al comprador, y cada lanzamiento hace más fuerte a SECT.",
    risk: "Las monedas nuevas son de alto riesgo. Sectora Launch protege contra lanzamientos injustos, no contra pérdidas del mercado. Usa solo dinero que puedas permitirte perder. Las capturas son vistas de referencia con monedas de prueba.",
    foot: "© 2026 Sectora Foundation IL. Todos los derechos reservados."
  };

  T.pt = {
    title: "Sectora Launch · O mesmo preço que o criador", gl: "Launch · Guia de introdução", open: "Abrir o app",
    h_eb: "Sectora Launch · Guia de introdução",
    h_t: "Você paga o mesmo preço que o criador. <span>Se não encher, recebe 100 % de volta.</span>",
    h_p: "Ninguém consegue um preço mais barato, cada carteira tem um máximo e a liquidez fica travada para sempre. Este guia mostra <b>como funciona</b>, <b>como o seu investimento é protegido</b> e <b>por que cada lançamento deixa o SECT mais forte</b>, com capturas do app.",
    c_start: "Começar o guia ↓", c_explore: "Explorar moedas", c_create: "Criar uma moeda",
    k_eb: "Sectora Launch numa frase", k_t: "Um lançamento justo, <b>ou você recebe 100 % de volta.</b>",
    k1t: "O mesmo preço para todos", k1p: "Nem o criador nem os bots compram mais barato que você.",
    k2t: "Meta ou devolução", k2p: "Se a reserva não atingir a meta a tempo, você recebe 100 % de volta.",
    k3t: "Liquidez queimada", k3p: "No lançamento, a liquidez fica travada para sempre na Uniswap.",
    k_note: "Tudo é feito pelo contrato inteligente. <b>Sem promessas, sem intermediários.</b>",
    pa_l: "Parte A · Passos 1–4", pa_t: "Como funciona", pa_p: "Criar, reservar, lançar e receber.",
    pb_l: "Parte B · Seu dinheiro", pb_t: "Seu investimento", pb_p: "Por que os 75 % já cobrem o que você coloca.",
    pc_l: "Parte C · SECT", pc_t: "O que a Sectora ganha", pc_p: "Por que cada lançamento beneficia os holders de SECT.",
    pd_l: "Parte D · Segurança", pd_t: "Proteções", pd_p: "As 8 proteções e a comparação.",
    p_eb: "O problema", p_t: "Por que a maioria das moedas novas <span>termina mal</span>",
    p_p: "Na maioria dos launchpads o preço sobe a cada compra. Quem compra primeiro paga menos, e quase sempre são bots, gente de dentro ou o próprio criador. Quando o preço sobe, eles vendem para quem chegou depois.",
    p1t: "Os snipers compram primeiro", p1p: "Os bots compram nos primeiros segundos pelo menor preço e vendem para a primeira onda de compradores reais.",
    p2t: "O criador vende tudo", p2p: "O criador pode comprar barato no lançamento e vender tudo a qualquer momento, muitas vezes minutos depois.",
    p3t: "Não há volta", p3p: "Se a moeda nunca decola, os compradores ficam com o prejuízo. Nada é devolvido.",
    f_p: "dos tokens lançados na pump.fun mostraram padrões de pump-and-dump ou rug pull, segundo um relatório da Solidus Labs.<small>A pump.fun contesta o número.</small>",
    a_eb: "Parte A · Passos 1–4", a_t: "Como funciona, <span>passo a passo</span>", a_l: "Parte A",
    a_p: "Uma moeda no Sectora Launch primeiro abre uma <b>reserva</b>. Ela só vai ao mercado quando a reserva atinge a meta. Até lá, o seu dinheiro sempre pode voltar.",
    s1t: "O criador abre uma reserva",
    s1a: "Qualquer pessoa cria uma moeda <b>de graça</b>: nome, ticker e supply. O token tem supply fixo, sem dono, sem emissão e sem taxas.",
    s1b: "O criador escolhe a meta: <span class=\"chip o\">$3.000</span> <span class=\"chip o\">$7.000</span> ou <span class=\"chip o\">$15.000</span>.",
    s1c: "O máximo por carteira sobe com a meta ($150, $350 ou $500), então <b>cada lançamento precisa de pelo menos 20 carteiras diferentes</b>.",
    s1cap: "O seletor de meta na página de criar. Visualização de referência com uma moeda de teste.",
    s2t: "Você entra na reserva",
    s2a: "Você paga com <span class=\"chip\">ETH</span> <span class=\"chip\">USDT</span> ou <span class=\"chip\">SECT</span>. O ETH e o USDT são trocados por SECT automaticamente.",
    s2b: "Todos pagam <b>o mesmo preço</b>. O app mostra quantos tokens você recebe e quanto valem no preço de abertura.",
    s2c: "Mudou de ideia? <b>Retire 100 % quando quiser</b> antes do lançamento, sem taxas.",
    s2cap: "Entrando numa reserva com 500 USDT, o máximo por carteira, no computador e no celular. Visualizações de referência com uma moeda de teste.",
    s3t: "A meta é atingida: a moeda vai ao mercado",
    s3a: "Na mesma transação, <b>98 % da reserva</b> e a parte dos tokens do pool formam uma pool na Uniswap.",
    s3b: "A pool abre <b>50 % acima do preço da reserva</b>. Todos que entraram começam acima do que pagaram.",
    s3c: "Os tokens de liquidez vão para 0x…dEaD: <b>ninguém pode retirar a liquidez, nunca</b>.",
    s3cap: "Uma reserva em andamento: preço na reserva, preço de abertura, quanto já foi reunido e quanto falta.",
    s4t: "Você recebe seus tokens",
    s4a: "<b>75 %</b> dos seus tokens no lançamento e os outros <b>25 % em 7 dias</b>.",
    s4b: "Ou trave por 30 dias: você recebe tudo no dia 30 mais um <b>bônus de até +25 %</b>.",
    s4c: "A moeda é negociada na Uniswap contra SECT. Você pode comprar, vender ou manter.",
    s4cap: "A lista de moedas: reservas abertas, quanto falta para cada uma e as que já estão na Uniswap.",
    w_note: "<b>A meta não foi atingida a tempo?</b> Todos recebem 100 % do que colocaram. Sem taxas, sem letras miúdas.",
    b_eb: "Parte B · Seu investimento", b_t: "Com os 75 % você recupera 100 %. <span>Os 25 % são lucro.</span>",
    b_p: "Como a pool abre 50 % acima do preço que todos pagaram na reserva, os 75 % que você recebe no lançamento já valem mais do que tudo o que você colocou. Os 25 % que chegam nos 7 dias seguintes são o ganho: o reflexo dessa alta de 50 %.",
    b_exh: "Exemplo · você coloca $500 numa reserva (o máximo por carteira)",
    b_r1: "Você coloca na reserva", b_r2: "Seus tokens no preço de abertura (+50 %)", b_r3: "75 % que você recebe no lançamento", b_r4: "25 % que você recebe em 7 dias", b_r5: "Ganho total no preço de abertura",
    bl_in: "O que você coloca", bk_in: "seu investimento",
    bl_out: "O que você recebe, no preço de abertura", bk_a: "75 % · cobre seus $500", bk_c: "25 % · ganho",
    b_bars: "Os 75 % ($562,50) são mais que os seus $500: <b>todo o seu investimento fica coberto desde o primeiro dia</b>. Os 25 % ($187,50) são ganho puro, e com os $62,50 a mais dentro dos 75 % somam os +50 % ($250).",
    b1t: "Risco coberto desde o primeiro dia", b1p: "No preço de abertura, os tokens que você recebe no lançamento valem 112,5 % do que você pagou.",
    b2t: "O ganho chega aos poucos", b2p: "Os 25 % em 7 dias evitam que o preço desabe no primeiro minuto, e isso protege o valor do que você já tem.",
    b3t: "Ou trave e ganhe mais", b3p: "Trave por 30 dias e receba tudo mais um bônus de até +25 %: até $937,50 pelos seus $500 no preço de abertura.",
    b_warn: "<b>Importante:</b> os valores são calculados no preço de abertura. Quando o trading começa, o preço é definido pelo mercado: pode subir ou descer, e vender grandes quantidades move o preço. As regras protegem você de lançamentos injustos, não do mercado.",
    c_eb: "Parte C · Por que importa para os holders de SECT", c_t: "Cada lançamento <span>trabalha para o SECT</span>",
    c_p: "Todas as moedas do Sectora Launch são cotadas em SECT. Isso significa que cada reserva, cada lançamento e cada operação de cada moeda precisa de SECT. Se você tem SECT, o launchpad trabalha para você.",
    fl1t: "Um criador abre uma reserva", fl1p: "E divulga a moeda para a própria comunidade.",
    fl2t: "Os compradores pagam ETH ou USDT", fl2p: "Ou SECT, se já tiverem.",
    fl3t: "O contrato compra SECT", fl3p: "Na pool SECT/USDT, automaticamente, a cada pagamento.",
    fl4t: "98 % fica travado para sempre", fl4p: "Na pool da moeda na Uniswap, com o LP queimado.",
    fl5t: "Taxas: metade queimada", fl5p: "O 1 % da Sectora é pago em SECT e metade é queimada.",
    cb1t: "Compra constante de SECT", cb1p: "Cada pagamento em ETH ou USDT para uma reserva é uma compra de SECT no mercado.",
    cb2t: "SECT fora de circulação, para sempre", cb2p: "98 % de cada reserva fica travado numa pool cuja liquidez nunca pode ser retirada.",
    cb3t: "Mais SECT queimado", cb3p: "Metade da taxa da Sectora é queimada em SECT, além da queima de 25 milhões de SECT em março.",
    cb4t: "O SECT vira a moeda base", cb4p: "Todas as moedas são negociadas contra SECT na Uniswap. Comprar qualquer uma delas significa comprar SECT primeiro.",
    cb5t: "Outros criadores fazem a divulgação", cb5p: "Cada criador divulga a própria moeda. Cada comprador que ele traz é um novo comprador de SECT.",
    cb6t: "Pronto para a SectoraEVM", cb6p: "O mesmo launchpad vai funcionar na SectoraEVM, a rede própria da Sectora, prevista para por volta de março de 2027.",
    lv_eb: "Para criadores · Níveis de criador", lv_t: "Suba de nível <span>a cada lançamento</span>", lv_p: "Cada criador tem um perfil com níveis. Ele sobe a cada lançamento que você faz, de acordo com o sucesso dele.",
    lv1t: "Suba seu ranking como criador", lv1p: "Quanto mais bem-sucedido o seu lançamento, mais alto o seu nível.",
    lv2t: "Torne-se um criador conhecido", lv2p: "Faça de todas as moedas que você lançar um sucesso.",
    lv3t: "Bom para você e sua comunidade", lv3p: "Isso vai beneficiar você e toda a sua comunidade.",
    lv_prof: "Seu perfil de criador", lv_lvl: "Níveis 1 a 5",
    ct_title: "Quanto SECT cada lançamento movimenta",
    th2: ["Meta", "SECT comprado", "Travado para sempre no lançamento", "Continua travado mesmo se todos venderem", "Queimado"],
    px_live: "Calculado com o preço real do SECT agora: <b>{p}</b> (DexScreener). Os números mudam com o preço.",
    px_off: "Não foi possível carregar agora o preço real do SECT; os valores aparecem em dólares de SECT.",
    big_l: "Exemplo · 100 lançamentos de $7.000", big_s: "SECT comprado no mercado",
    big_p: "Isso é <b>{pct}</b> dos 25 milhões de SECT que vão restar depois da queima de março, e <b>{lk}</b> ficam travados para sempre nas pools. É uma ilustração com o preço de hoje, não uma previsão: quanto mais SECT é comprado, mais sobe o preço e menos SECT cada lançamento precisa.",
    big_off: "Cada lançamento de $7.000 compra $7.000 em SECT, e $6.860 ficam travados para sempre na pool.",
    usdOf: "em SECT",
    d_eb: "Parte D · Segurança",
    g_t: "Oito proteções, <span>garantidas por código</span>", g_p: "Nenhuma depende de confiar na equipe. São regras do contrato inteligente e valem para todas as moedas, automaticamente.",
    g1t: "Um único preço para todos", g1p: "Sem desconto para os primeiros e sem curva para passar na frente. Os bots não têm vantagem.",
    g2t: "Máximo por carteira", g2p: "$150, $350 ou $500 por carteira. Nenhuma baleia nem o criador pode ficar com a maior parte.",
    g3t: "Devolução de 100 %", g3p: "Se a reserva não atingir a meta a tempo, todos recebem tudo de volta. Sem taxas.",
    g4t: "Liquidez queimada para sempre", g4p: "No lançamento, os tokens LP são enviados para 0x…dEaD. A liquidez nunca pode ser retirada.",
    g5t: "Um token limpo", g5p: "Supply fixo. Sem dono, sem emissão, sem taxas, sem lista negra, sem truques nas transferências.",
    g6t: "Liberação gradual ao criador", g6p: "Os 5 % do criador são liberados em 30 dias. Nada de vender tudo no primeiro dia.",
    g7t: "Entrega gradual", g7p: "75 % no lançamento e 25 % em 7 dias, para o preço não desabar no primeiro minuto.",
    g8t: "Regras que ninguém pode mudar", g8p: "Sem botão de pausa e sem poder de administrador sobre reservas, pools ou moedas. O dono só pode mudar para onde vai a taxa da Sectora.",
    sh_t: "Sectora Shield: a prova em cada moeda", sh_p: "A página de cada moeda tem uma aba Shield que verifica as proteções ao vivo: supply fixo, sem dono, liquidez travada, mesmo preço, devolução, entrega gradual, nome e ticker originais. O comprador vê isso antes de colocar um único dólar.",
    sh_cap: "Uma moeda já na Uniswap, com pontuação Shield de 100. Visualização de referência com uma moeda de teste.",
    t_t: "Sectora Launch versus launchpads típicos", t_p: "A maioria dos launchpads, incluindo a pump.fun, vende as moedas novas numa curva de preços. Isto é o que muda.",
    th: ["", "Launchpads típicos", "Sectora Launch"],
    rows: [
      ["Preço para os compradores", "Sobe a cada compra: os primeiros pagam menos", "O mesmo preço para todos na reserva"],
      ["Bots snipers", "Compram nos primeiros segundos pelo menor preço", "Sem vantagem: mesmo preço e máximo por carteira"],
      ["O criador no lançamento", "Pode comprar primeiro e vender a qualquer momento", "Sem preço mais barato; seus 5 % liberados em 30 dias"],
      ["Máximo por carteira", "Nenhum", "$150, $350 ou $500"],
      ["Se a moeda não decolar", "Os compradores ficam com o prejuízo", "100 % de volta antes do lançamento, sem taxas"],
      ["Preço de abertura", "Definido pela curva", "50 % acima do que a reserva pagou"],
      ["Tokens no lançamento", "Tudo pode ser vendido de uma vez", "75 % no lançamento, 25 % em 7 dias"],
      ["Liquidez", "Depende de cada plataforma", "Queimada para sempre no lançamento"]
    ],
    v_eb: "Não confie. Verifique.", v_t: "Código aberto, na Ethereum, <span>verificável por qualquer pessoa</span>",
    v_p: "O Sectora Launch funciona com um contrato inteligente de código aberto. Cada reserva, cada lançamento e cada token LP queimado pode ser verificado na blockchain, por qualquer pessoa, a qualquer momento.",
    v_code: "Ler o contrato", v_sec: "Segurança", v_tr: "Transparência",
    q_eb: "Perguntas", q_t: "Perguntas <span>frequentes</span>",
    q1: "O criador pode fugir com o dinheiro?", a1: "Não. A reserva fica com o contrato inteligente. No lançamento, 98 % vai para a pool da Uniswap e os tokens LP são queimados. O criador só recebe uma taxa de 1 % e 5 % dos tokens em 30 dias.",
    q2: "O que acontece se a reserva não encher?", a2: "Depois do prazo, todos recebem 100 % do que colocaram. Você também pode sair a qualquer momento antes do lançamento. Sem taxas em nenhum caso.",
    q6: "Os +50 % são garantidos?", a6: "A pool sempre abre 50 % acima do preço da reserva: é uma regra do contrato. O que acontece depois da abertura depende do mercado: o preço pode subir ou descer.",
    q3: "Por que todas as moedas são cotadas em SECT?", a3: "SECT é a moeda do ecossistema Sectora. Você pode pagar com ETH, USDT ou SECT: o ETH e o USDT são trocados por SECT automaticamente na Uniswap.",
    q7: "Como isso me beneficia se eu tenho SECT?", a7: "Cada lançamento compra SECT no mercado, trava 98 % para sempre numa pool e queima parte das taxas. Mais lançamentos significam mais demanda por SECT e menos SECT em circulação.",
    q4: "Isso significa que uma moeda não pode perder valor?", a4: "Não. As regras eliminam os rugs e as vantagens injustas, mas uma moeda nova continua sendo de alto risco: o preço depende de quem compra e vende.",
    q5: "Qual rede usa?", a5: "Ethereum hoje. A SectoraEVM, a rede própria da Sectora, é esperada por volta de março de 2027.",
    e_t: "Lance justo. Compre justo. <span>Mantenha SECT.</span>", e_p: "O launchpad onde as regras protegem o comprador, e cada lançamento deixa o SECT mais forte.",
    risk: "Moedas novas são de alto risco. O Sectora Launch protege contra lançamentos injustos, não contra perdas de mercado. Use apenas dinheiro que você pode perder. As capturas são visualizações de referência com moedas de teste.",
    foot: "© 2026 Sectora Foundation IL. Todos os direitos reservados."
  };

  var LOC = { en: "en-US", es: "es-ES", pt: "pt-BR", zh: "zh-CN", ru: "ru-RU", fr: "fr-FR", ja: "ja-JP", ko: "ko-KR", ar: "ar-u-nu-latn", de: "de-DE", hi: "hi-IN" };
  // same languages, order and flag picker as the app (sectoralabs.com)
  var LANGS = ["en", "es", "zh", "pt", "ru", "fr", "ja", "ko", "ar", "de", "hi"];
  var LNAME = { en: "English", es: "Español", zh: "中文", pt: "Português", ru: "Русский", fr: "Français", ja: "日本語", ko: "한국어", ar: "العربية", de: "Deutsch", hi: "हिन्दी" };
  var FLAGS = {
    en: '<rect width="24" height="16" fill="#b22234"/><path d="M0 1.85h24M0 4.31h24M0 6.77h24M0 9.23h24M0 11.69h24M0 14.15h24" stroke="#fff" stroke-width="1.23"/><rect width="9.6" height="8.6" fill="#3c3b6e"/>',
    es: '<rect width="24" height="16" fill="#c60b1e"/><rect y="4" width="24" height="8" fill="#ffc400"/>',
    zh: '<rect width="24" height="16" fill="#de2910"/><circle cx="5" cy="4.4" r="2.1" fill="#ffde00"/><circle cx="9.4" cy="2.2" r=".8" fill="#ffde00"/><circle cx="11" cy="4.6" r=".8" fill="#ffde00"/><circle cx="10.6" cy="7.6" r=".8" fill="#ffde00"/><circle cx="8.4" cy="9.4" r=".8" fill="#ffde00"/>',
    pt: '<rect width="24" height="16" fill="#009c3b"/><path d="M12 2.2 22 8l-10 5.8L2 8z" fill="#ffdf00"/><circle cx="12" cy="8" r="3.1" fill="#002776"/>',
    ru: '<rect width="24" height="16" fill="#fff"/><rect y="5.33" width="24" height="5.34" fill="#0039a6"/><rect y="10.67" width="24" height="5.33" fill="#d52b1e"/>',
    fr: '<rect width="24" height="16" fill="#fff"/><rect width="8" height="16" fill="#002395"/><rect x="16" width="8" height="16" fill="#ed2939"/>',
    ja: '<rect width="24" height="16" fill="#fff"/><circle cx="12" cy="8" r="4.6" fill="#bc002d"/>',
    ko: '<rect width="24" height="16" fill="#fff"/><path d="M12 3.6a4.4 4.4 0 0 1 0 8.8 2.2 2.2 0 0 0 0-4.4 2.2 2.2 0 0 1 0-4.4z" fill="#cd2e3a"/><path d="M12 3.6a2.2 2.2 0 0 1 0 4.4 2.2 2.2 0 0 0 0 4.4 4.4 4.4 0 0 1 0-8.8z" fill="#0047a0"/>',
    ar: '<rect width="24" height="16" fill="#165d31"/><rect x="4" y="6.6" width="16" height="1.5" fill="#fff"/><rect x="4" y="9.4" width="11" height="1.2" fill="#fff"/>',
    de: '<rect width="24" height="16" fill="#000"/><rect y="5.33" width="24" height="5.34" fill="#dd0000"/><rect y="10.67" width="24" height="5.33" fill="#ffce00"/>',
    hi: '<rect width="24" height="16" fill="#ff9933"/><rect y="5.33" width="24" height="5.34" fill="#fff"/><rect y="10.67" width="24" height="5.33" fill="#138808"/><circle cx="12" cy="8" r="2" fill="none" stroke="#000080" stroke-width="1"/>'
  };
  function flag(c) { return '<svg class="fl" viewBox="0 0 24 16" aria-hidden="true">' + (FLAGS[c] || "") + "</svg>"; }
  var L = "en", PX = 0;
  function ok(l) { return LANGS.indexOf(l) >= 0; }
  // en, es and pt are in this file; the other languages load once from lang/<code>.js
  function load(l, done) {
    if (T[l]) { done(); return; }
    var s = document.createElement("script");
    s.src = "lang/" + l + ".js?v=1";
    s.onload = s.onerror = function () { var x = window.INTRO_T && window.INTRO_T[l]; if (x) T[l] = x; done(); };
    document.head.appendChild(s);
  }
  function picker() {
    var lp = document.getElementById("lp"); if (!lp) return;
    lp.innerHTML = '<button type="button" class="lp-b" aria-haspopup="listbox" aria-expanded="false" aria-label="Language">' + flag(L) + '<span class="nm">' + LNAME[L] + '</span><span class="cd">' + L.toUpperCase() + '</span><svg class="cv" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6"/></svg></button>' +
      '<ul class="lp-l" role="listbox">' + LANGS.map(function (l) { return '<li role="option" data-l="' + l + '" aria-selected="' + (l === L) + '" lang="' + l + '">' + flag(l) + "<span>" + LNAME[l] + "</span></li>"; }).join("") + "</ul>";
  }

  function pick() {
    var q = (location.search.match(/[?&]lang=([a-z]{2})/) || [])[1];
    if (q && ok(q)) return q;
    // English unless the visitor picks another language on this page
    try { var s = sessionStorage.getItem("sectoraIntro.lang"); if (s && ok(s)) return s; } catch (e) {}
    return "en";
  }
  function nf(v, d) { return v.toLocaleString(LOC[L], { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d == null ? 0 : d }); }
  function usd(v) { return "$" + nf(v, v < 100 ? 2 : 0); }
  function sect(usdAmount) { return PX > 0 ? nf(usdAmount / PX) + " SECT" : usd(usdAmount) + " " + T[L].usdOf; }

  function table(d) {
    var h = '<div class="row h"><div>' + d.th[0] + "</div><div>" + d.th[1] + "</div><div>" + d.th[2] + "</div></div>";
    return h + d.rows.map(function (r) {
      return '<div class="row"><div>' + r[0] + "</div><div>" + X + '<span><span class="lab">' + d.th[1] + "</span>" + r[1] + "</span></div><div>" + OK + '<span><span class="lab">' + d.th[2] + "</span>" + r[2] + "</span></div></div>";
    }).join("");
  }
  // SECT moved by a launch: bought = goal, 98 % locked at launch, ≥ 34.27 % still locked if every holder sells, 0.5 % burned
  function sectTable() {
    var d = T[L], hd = d.th2;
    var rows = [3000, 7000, 15000].map(function (g) {
      return '<div class="tr2"><div>' + usd(g) + '</div><div data-l="' + hd[1] + '"><b>' + sect(g) + '</b></div><div data-l="' + hd[2] + '"><b>' + sect(g * 0.98) + '</b></div><div data-l="' + hd[3] + '"><b>' + sect(g * 0.3427) + "</b><small>≥ 34 %</small></div><div data-l=\"" + hd[4] + '"><b>' + sect(g * 0.005) + "</b></div></div>";
    }).join("");
    document.getElementById("tbl2").innerHTML = '<div class="tr2">' + hd.map(function (x) { return "<div>" + x + "</div>"; }).join("") + "</div>" + rows;
    document.getElementById("pxn").innerHTML = PX > 0 ? d.px_live.replace("{p}", "$" + nf(PX, 4)) : d.px_off;
    if (PX > 0) {
      var bought = 100 * 7000 / PX;
      document.getElementById("bigN").textContent = nf(bought) + " SECT";
      document.getElementById("bigS").textContent = d.big_s;
      document.getElementById("bigP").innerHTML = d.big_p.replace("{pct}", nf(bought / SUPPLY_AFTER_BURN * 100, 1) + " %").replace("{lk}", nf(bought * 0.98) + " SECT");
    } else {
      document.getElementById("bigN").textContent = usd(700000);
      document.getElementById("bigS").textContent = d.big_s;
      document.getElementById("bigP").innerHTML = d.big_off;
    }
  }
  function apply(l, save) {
    L = T[l] ? l : "en";
    var d = T[L];
    document.documentElement.lang = L;
    document.documentElement.dir = L === "ar" ? "rtl" : "ltr";
    document.title = d.title;
    document.querySelectorAll("[data-i]").forEach(function (el) { var k = el.getAttribute("data-i"); if (d[k] != null) el.innerHTML = d[k]; });
    document.querySelectorAll("img[data-img]").forEach(function (im) { im.src = "img/" + L + "-" + im.getAttribute("data-img") + ".jpg?v=3"; im.loading = "lazy"; im.decoding = "async"; im.onclick = function () { window.open(im.src, "_blank", "noopener"); }; });
    document.querySelectorAll("[data-v]").forEach(function (el) { var v = +el.getAttribute("data-v"), dd = el.hasAttribute("data-d") ? +el.getAttribute("data-d") : 2; el.textContent = (el.hasAttribute("data-plus") ? "+" : "") + "$" + nf(v, dd); });
    document.getElementById("tbl").innerHTML = table(d);
    sectTable();
    picker();
    if (save) try { sessionStorage.setItem("sectoraIntro.lang", L); sessionStorage.setItem("sectoraLaunch.lang", L); } catch (e) {}
  }
  // live SECT price (largest SECT pool on Ethereum, from DexScreener)
  function loadPrice() {
    fetch("https://api.dexscreener.com/latest/dex/tokens/" + SECT, { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      var best = null;
      (j.pairs || []).forEach(function (p) {
        if (!p || p.chainId !== "ethereum" || !p.baseToken || String(p.baseToken.address).toLowerCase() !== SECT.toLowerCase()) return;
        var liq = (p.liquidity && p.liquidity.usd) || 0, pu = parseFloat(p.priceUsd);
        if (pu > 0 && (!best || liq > best.l)) best = { l: liq, p: pu };
      });
      if (best) { PX = best.p; sectTable(); }
    }).catch(function () {});
  }
  document.addEventListener("click", function (e) {
    var lp = document.getElementById("lp"); if (!lp) return;
    var li = e.target.closest && e.target.closest("#lp li[data-l]");
    if (li) { lp.classList.remove("on"); var l = li.getAttribute("data-l"); load(l, function () { apply(l, true); }); return; }
    if (e.target.closest && e.target.closest("#lp .lp-b")) { var on = !lp.classList.contains("on"); lp.classList.toggle("on", on); lp.querySelector(".lp-b").setAttribute("aria-expanded", on ? "true" : "false"); return; }
    lp.classList.remove("on");
  });
  document.addEventListener("keydown", function (e) { var lp = document.getElementById("lp"); if (e.key === "Escape" && lp) lp.classList.remove("on"); });
  var first = pick();
  apply("en");
  if (first !== "en") load(first, function () { apply(first); });
  loadPrice();
})();
