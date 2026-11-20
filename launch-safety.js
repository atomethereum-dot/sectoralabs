/* Sectora Launch — investor protection page (#/safety).
 * Every measure the Ethereum fair-launch contract and this website take, what it protects from and where it lives in the code.
 * Uses the helpers of launch.js (window.SLX) and the live module (window.SLLive). */
(function () {
  "use strict";
  var S = {
    en: {
      eb: "Investor protection",
      h1: "Every safety measure, explained.",
      intro: "Sectora Launch protects the people who put money into new coins with rules written into the smart contract, not promises on a web page. Below is each measure: what it does, what it protects you from and where it lives in the code.",
      net: "Sectora Launch on Ethereum · every coin priced in SECT",
      k1: "max per wallet in a reserve", k2: "back if a reserve does not fill", k3: "of every reserve becomes liquidity, burned forever", k4: "admin functions over reserves, pools or coins",
      jump: "Jump to",
      prot: "Protects you from", code: "In the contract",
      p1_t: "Every coin starts safe", p1_p: "Rules that apply to every coin from the moment it is created, whoever creates it.",
      p2_t: "While the reserve is open", p2_p: "Your money during the reserve: same price, a per-wallet maximum and a way out at any time.",
      p3_t: "At launch", p3_p: "What happens in the transaction that fills the reserve.",
      p4_t: "After launch", p4_p: "How tokens are delivered and why nobody can dump a large share on day one.",
      p5_t: "The contract and this website", p5_p: "Who controls what, and how the website handles your wallet.",
      c1_t: "Fixed supply, created once", c1_p: "The supply is created once, when the coin is created. The coin has no mint function, so nobody can ever create more.", c1_v: "Hidden inflation and surprise mints",
      c2_t: "No owner, no tax, no blacklist", c2_p: "Every coin is a plain ERC-20: transfer, approve and nothing else. No owner, no transfer fee, no pause, no blacklist, no max-sell rule.", c2_v: "Honeypots you can buy but not sell, sell taxes, frozen wallets",
      c3_t: "The same code for every coin", c3_p: "Each coin is a minimal copy (EIP-1167) of one token template deployed by the launch contract. Creators fill in a name, a ticker and a supply; they cannot upload their own code.", c3_v: "Malicious custom contracts",
      c4_t: "Nobody holds the coin before launch", c4_p: "The whole supply sits in the launch contract. The creator gets nothing up front and nobody can trade the coin until the pool exists.", c4_v: "Pre-mined supply dumped on buyers",
      c5_t: "Rules fixed at creation", c5_p: "Target, per-wallet maximum, deadline and supply are stored when the coin is created and can never be changed, not by the creator and not by Sectora.", c5_v: "Moving goalposts",
      c6_t: "Copycat and ticker checks", c6_p: "The website refuses tickers that imitate major assets (ETH, USDT, SECT…), flags names that look like an existing coin and shows a Sectora Shield score on every coin.", c6_v: "Fake copies of known coins",
      c7_t: "One price for everyone", c7_p: "Every SECT in a reserve buys exactly the same number of tokens. Joining in the first second or the last one costs the same.", c7_v: "Snipers, bots and first-buyer advantage",
      c8_t: "A maximum of {CAP} per wallet", c8_p: "Fixed in SECT when the coin is created, using the 30-minute SECT price. The contract only takes what fits under the maximum and under the target, and returns the rest in the same transaction.", c8_v: "Whales taking most of a coin",
      c9_t: "Leave at any time before launch", c9_p: "Until the reserve fills, you can take back 100 % of your SECT with one click. No fee, no waiting period.", c9_v: "Being locked into a reserve you no longer want",
      c10_t: "100 % back if it does not fill", c10_p: "If the deadline passes before the target is reached, the reserve closes and everyone can take back all their SECT. No fee is charged on a coin that does not launch.", c10_v: "Losing money on a coin that never launched",
      c11_t: "Your SECT is held by the contract", c11_p: "Reserve funds sit in the launch contract. Neither the creator nor Sectora has any function to move them: they either go into the pool at launch or back to you.", c11_v: "Rug pulls before launch",
      c12_t: "Dollar sizes that cannot be gamed", c12_p: "The {G} target and the {CAP} maximum are converted to SECT with the 30-minute average price (TWAP) of the Uniswap V3 SECT/USDT pool, and can never move more than 50× away from fixed reference values.", c12_v: "A sudden price spike resizing a reserve",
      c13_t: "Price protection when paying with ETH", c13_p: "ETH is swapped to SECT on a fixed route (ETH → USDT → SECT on Uniswap V3) with a minimum amount of SECT you accept. If the price moves more than your slippage, the transaction is cancelled.", c13_v: "Sandwich attacks and paying too much",
      c14_t: "Exact approvals only", c14_p: "When you pay with SECT, the website asks you to approve exactly the amount of that operation, never an unlimited amount.", c14_v: "Wallets drained through unlimited approvals",
      c15_t: "Automatic launch, same transaction", c15_p: "The contribution that reaches the target creates the pool, adds the liquidity and burns the LP tokens in the same transaction. No team server, no manual step, no waiting.", c15_v: "Stalled or manipulated migrations",
      c16_t: "98 % of the reserve goes into the pool", c16_p: "Fees exist only if the coin launches: 1 % to the creator and 1 % to Sectora. Everything else becomes liquidity.", c16_v: "Hidden fees and fees on failed coins",
      c17_t: "Liquidity burned forever", c17_p: "The pool's LP tokens are minted straight to 0x…dEaD. Nobody, not the creator and not Sectora, can ever withdraw the liquidity.", c17_v: "The classic liquidity rug pull",
      c18_t: "The pool opens 50 % above the reserve price", c18_p: "The pool receives the SECT and a token amount set so its first price is 1.5× the price everyone paid in the reserve. From then on, the market sets the price.", c18_v: "Reserve participants starting below their price on day one",
      c19_t: "The pool cannot be rigged in advance", c19_p: "Since nobody holds the coin before launch, nobody can create its pool at a bad price. SECT sent to the pool address in advance only adds liquidity.", c19_v: "Pre-seeded pools and price manipulation at launch",
      c20_t: "Gradual delivery", c20_p: "75 % of your tokens can be received at launch and the other 25 % is released evenly over 7 days.", c20_v: "Everybody selling everything in the first minute",
      c21_t: "Optional 30-day lock with a bonus", c21_p: "Whoever locks receives everything on day 30 plus a bonus of up to +25 %, paid from a fixed 6.5 % allotment. The part nobody earns is burned at launch, so no new tokens are ever created.", c21_v: "Short-term pressure, without diluting anyone",
      c22_t: "Creator tokens vest over 30 days", c22_p: "The creator's 5 % is released evenly over 30 days after launch. In the reserve the creator is one more wallet, with the same price and the same maximum.", c22_v: "Creators dumping a large share at launch",
      c23_t: "Half of the platform income is burned", c23_p: "Sectora's 1 % is paid in SECT. When it is withdrawn, half is sent to 0x…dEaD. Anyone can run the withdrawal.", c23_v: "Fees that never benefit SECT holders",
      c24_t: "Open trading on Uniswap", c24_p: "After launch the coin trades on a standard Uniswap V2 pool. You can trade it on this website, on the Uniswap app or anywhere else, and follow it on DexScreener.", c24_v: "Being locked into one platform",
      c25_t: "No admin over your money", c25_p: "The contract owner can only change the wallet that receives Sectora's non-burned share. There is no pause, no upgrade and no function to change fees, rules or prices, or to touch reserves, pools or coins.", c25_v: "Admin keys and upgrades that change the rules",
      c26_t: "Re-entrancy guard and checked maths", c26_p: "Every function that moves money is protected against re-entrancy; Solidity 0.8 stops overflows; direct ETH payments are refused; SECT transfers must arrive in full.", c26_v: "Common smart-contract exploits",
      c27_t: "Public source code", c27_p: "The full contract is published on this website, together with the exact compiler settings, so anyone can verify it on Etherscan against the deployed address.", c27_v: "Code nobody can check",
      c28_t: "A non-custodial website", c28_p: "Your wallet signs every transaction. The website never sees your keys or holds your funds, and it reads every number directly from Ethereum.", c28_v: "Custodial risk",
      c29_t: "Real data, no simulated prices", c29_p: "Balances, reserves and pools come from the blockchain; dollar values use live market data. If the website is on the wrong network, it asks you to switch before sending anything.", c29_v: "Made-up numbers and transactions on the wrong network",
      roles_t: "Who can do what", roles_p: "The contract gives each party a short, fixed list of powers.",
      th_who: "Who", th_can: "Can", th_cannot: "Cannot",
      ro1: "Sectora (contract owner)", ro1c: "Change the wallet that receives Sectora's non-burned share of the fees, or hand this role to another address.", ro1n: "Pause anything, change rules, fees, prices or deadlines, touch any reserve, pool, coin or your tokens, or create tokens.",
      ro2: "Creator", ro2c: "Create a coin (name, ticker, supply, reserve time), join its reserve like any wallet, collect the 1 % creator fee and the 5 % over 30 days.", ro2n: "Change anything after creation, put in more than the per-wallet maximum, touch anyone's SECT, receive tokens before launch or sell the 5 % on day one.",
      ro3: "You", ro3c: "Join a reserve, take your SECT back before launch, lock for the bonus, receive your tokens and trade them anywhere.", ro3n: "Join after the deadline or above the per-wallet maximum.",
      ro4: "Anyone", ro4c: "Run the platform burn and read every number of every coin on Etherscan.", ro4n: "Move another person's SECT or tokens.",
      risk_t: "What these measures do not cover", risk_p: "No platform can remove every risk. Please read this before you join a reserve.",
      r1_t: "Prices move after launch", r1_p: "The pool opens 50 % above the reserve price, but after that the market decides. The price can fall below what you paid.",
      r2_t: "A launch is not an endorsement", r2_p: "A full reserve shows demand, not that a project is good. Read the description, check the links and the creator.",
      r3_t: "One person, several wallets", r3_p: "Someone can use several wallets. Each one still pays the same price and has the same maximum.",
      r4_t: "The SECT price", r4_p: "Reserves are paid in SECT, so their dollar value moves with the SECT price.",
      r5_t: "Smart-contract risk", r5_p: "The code is public and tested, but software can contain errors, and blockchain transactions cannot be reversed.",
      r6_t: "Fake sites and fake coins", r6_p: "Use only sectoralabs.com, check the contract address and never share your recovery phrase. Sectora will never ask for it.",
      ver_t: "Check it yourself", ver_p: "You do not have to trust this page. Everything above can be checked on the blockchain.",
      v1: "Read the code of the launch contract and the coin template.", v1l: "SectoraFairLaunch.sol",
      v2: "On Etherscan, open the launch contract → Read Contract → coinView(coin address): target, raised, deadline and per-wallet maximum.", v2l: "Launch contract on Etherscan", v2n: "The launch contract address is published here as soon as it is live.",
      v3: "seatView(coin address, your wallet) shows your SECT in the reserve, your lock and the tokens you have received and can receive now.",
      v4: "After launch, open the coin's pool on Etherscan: the LP tokens are held by 0x000…dEaD.",
      v5: "Open the coin's contract: it only has transfer, approve and transferFrom. No owner, mint or pause function exists.",
      cta_t: "Ready to see it working?", cta_explore: "Explore coins", cta_create: "Create a coin"
    },
    es: {
      eb: "Protección del inversor",
      h1: "Todas las medidas de seguridad, explicadas.",
      intro: "Sectora Launch protege a quienes ponen dinero en monedas nuevas con reglas escritas en el contrato inteligente, no con promesas en una web. Aquí tienes cada medida: qué hace, de qué te protege y dónde está en el código.",
      net: "Sectora Launch en Ethereum · todas las monedas cotizan en SECT",
      k1: "máximo por wallet en una reserva", k2: "de vuelta si la reserva no se llena", k3: "de cada reserva se convierte en liquidez quemada para siempre", k4: "funciones de administración sobre reservas, pools o monedas",
      jump: "Ir a",
      prot: "Te protege de", code: "En el contrato",
      p1_t: "Toda moneda nace segura", p1_p: "Reglas que se aplican a cada moneda desde que se crea, la cree quien la cree.",
      p2_t: "Mientras la reserva está abierta", p2_p: "Tu dinero durante la reserva: mismo precio, un máximo por wallet y salida en cualquier momento.",
      p3_t: "En el lanzamiento", p3_p: "Lo que pasa en la transacción que llena la reserva.",
      p4_t: "Después del lanzamiento", p4_p: "Cómo se entregan los tokens y por qué nadie puede vender una gran parte el primer día.",
      p5_t: "El contrato y esta web", p5_p: "Quién controla qué y cómo trata la web tu wallet.",
      c1_t: "Supply fijo, creado una sola vez", c1_p: "El supply se crea una sola vez, al crear la moneda. La moneda no tiene función de mint, así que nadie puede crear más nunca.", c1_v: "Inflación oculta y emisiones sorpresa",
      c2_t: "Sin dueño, sin impuestos, sin lista negra", c2_p: "Cada moneda es un ERC-20 sencillo: transferir, aprobar y nada más. Sin dueño, sin comisión por transferencia, sin pausa, sin lista negra y sin límite de venta.", c2_v: "Honeypots que se pueden comprar pero no vender, impuestos de venta, wallets congeladas",
      c3_t: "El mismo código para todas las monedas", c3_p: "Cada moneda es una copia mínima (EIP-1167) de una única plantilla de token desplegada por el contrato de lanzamiento. El creador elige nombre, ticker y supply; no puede subir su propio código.", c3_v: "Contratos personalizados maliciosos",
      c4_t: "Nadie tiene la moneda antes del lanzamiento", c4_p: "Todo el supply está en el contrato de lanzamiento. El creador no recibe nada por adelantado y nadie puede operar la moneda hasta que existe el pool.", c4_v: "Supply preminado que se vende a los compradores",
      c5_t: "Reglas fijas desde la creación", c5_p: "El objetivo, el máximo por wallet, el plazo y el supply se guardan al crear la moneda y no se pueden cambiar nunca: ni el creador ni Sectora.", c5_v: "Cambios de reglas a mitad de camino",
      c6_t: "Control de copias y de tickers", c6_p: "La web rechaza tickers que imitan activos conocidos (ETH, USDT, SECT…), avisa de nombres parecidos a una moneda que ya existe y muestra la puntuación de Sectora Shield en cada moneda.", c6_v: "Copias falsas de monedas conocidas",
      c7_t: "Mismo precio para todos", c7_p: "Cada SECT de una reserva compra exactamente la misma cantidad de tokens. Entrar en el primer segundo o en el último cuesta lo mismo.", c7_v: "Snipers, bots y ventaja por llegar primero",
      c8_t: "Un máximo de {CAP} por wallet", c8_p: "Se fija en SECT al crear la moneda, con el precio medio de 30 minutos del SECT. El contrato solo acepta lo que cabe bajo el máximo y bajo el objetivo, y devuelve el resto en la misma transacción.", c8_v: "Ballenas que se quedan con casi toda la moneda",
      c9_t: "Sal cuando quieras antes del lanzamiento", c9_p: "Hasta que la reserva se llena puedes recuperar el 100 % de tu SECT con un clic. Sin comisión y sin plazos de espera.", c9_v: "Quedarte atrapado en una reserva que ya no quieres",
      c10_t: "100 % de vuelta si no se llena", c10_p: "Si pasa el plazo sin llegar al objetivo, la reserva se cierra y cada uno puede recuperar todo su SECT. Una moneda que no se lanza no cobra ninguna comisión.", c10_v: "Perder dinero en una moneda que nunca salió",
      c11_t: "Tu SECT lo guarda el contrato", c11_p: "Los fondos de la reserva están en el contrato de lanzamiento. Ni el creador ni Sectora tienen ninguna función para moverlos: o van al pool al lanzar o vuelven a ti.", c11_v: "Robos antes del lanzamiento",
      c12_t: "Tamaños en dólares que no se pueden manipular", c12_p: "El objetivo de {G} y el máximo de {CAP} se convierten a SECT con el precio medio de 30 minutos (TWAP) del pool SECT/USDT de Uniswap V3, y nunca pueden alejarse más de 50 veces de unos valores de referencia fijos.", c12_v: "Un pico de precio repentino que cambie el tamaño de una reserva",
      c13_t: "Protección de precio al pagar con ETH", c13_p: "El ETH se cambia a SECT por una ruta fija (ETH → USDT → SECT en Uniswap V3) con un mínimo de SECT que tú aceptas. Si el precio se mueve más que tu deslizamiento, la transacción se cancela.", c13_v: "Ataques sándwich y pagar de más",
      c14_t: "Solo aprobaciones exactas", c14_p: "Cuando pagas con SECT, la web te pide aprobar exactamente la cantidad de esa operación, nunca una cantidad ilimitada.", c14_v: "Wallets vaciadas por aprobaciones ilimitadas",
      c15_t: "Lanzamiento automático, en la misma transacción", c15_p: "La aportación que llega al objetivo crea el pool, añade la liquidez y quema los LP en la misma transacción. Sin servidores del equipo, sin pasos manuales y sin esperas.", c15_v: "Migraciones atascadas o manipuladas",
      c16_t: "El 98 % de la reserva va al pool", c16_p: "Solo hay comisiones si la moneda se lanza: 1 % para el creador y 1 % para Sectora. Todo lo demás se convierte en liquidez.", c16_v: "Comisiones ocultas y comisiones en monedas que fracasan",
      c17_t: "Liquidez quemada para siempre", c17_p: "Los LP del pool se crean directamente en 0x…dEaD. Nadie, ni el creador ni Sectora, puede retirar nunca la liquidez.", c17_v: "El clásico robo de liquidez",
      c18_t: "El pool abre un 50 % por encima del precio de la reserva", c18_p: "El pool recibe el SECT y una cantidad de tokens calculada para que su primer precio sea 1,5 veces el precio que todos pagaron en la reserva. A partir de ahí, el precio lo marca el mercado.", c18_v: "Que quienes entraron en la reserva empiecen por debajo de su precio el primer día",
      c19_t: "El pool no se puede preparar de antemano", c19_p: "Como nadie tiene la moneda antes del lanzamiento, nadie puede crear su pool a un precio malo. El SECT que alguien envíe antes a la dirección del pool solo suma liquidez.", c19_v: "Pools preparados y manipulación del precio al lanzar",
      c20_t: "Entrega gradual", c20_p: "El 75 % de tus tokens se puede recibir al lanzar y el 25 % restante se libera de forma lineal durante 7 días.", c20_v: "Que todo el mundo lo venda todo en el primer minuto",
      c21_t: "Bloqueo opcional de 30 días con bonus", c21_p: "Quien bloquea recibe todo el día 30 más un bonus de hasta +25 %, pagado de una reserva fija del 6,5 %. La parte que nadie gana se quema al lanzar, así que nunca se crean tokens nuevos.", c21_v: "Presión de venta a corto plazo, sin diluir a nadie",
      c22_t: "Los tokens del creador se liberan en 30 días", c22_p: "El 5 % del creador se libera de forma lineal durante 30 días desde el lanzamiento. En la reserva el creador es una wallet más, con el mismo precio y el mismo máximo.", c22_v: "Creadores que venden una gran parte al lanzar",
      c23_t: "La mitad de los ingresos de la plataforma se quema", c23_p: "El 1 % de Sectora se cobra en SECT. Al retirarlo, la mitad se envía a 0x…dEaD. Cualquiera puede ejecutar ese retiro.", c23_v: "Comisiones que nunca benefician a quien tiene SECT",
      c24_t: "Compraventa abierta en Uniswap", c24_p: "Tras el lanzamiento la moneda cotiza en un pool estándar de Uniswap V2. Puedes operarla en esta web, en la app de Uniswap o en cualquier otro sitio, y seguirla en DexScreener.", c24_v: "Quedar atado a una sola plataforma",
      c25_t: "Nadie administra tu dinero", c25_p: "El dueño del contrato solo puede cambiar la wallet que recibe la parte no quemada de Sectora. No hay pausa ni actualizaciones, ni ninguna función para cambiar comisiones, reglas o precios, ni para tocar reservas, pools o monedas.", c25_v: "Claves de administrador y actualizaciones que cambian las reglas",
      c26_t: "Protección contra reentrada y cálculos verificados", c26_p: "Todas las funciones que mueven dinero están protegidas contra reentrada; Solidity 0.8 impide desbordamientos; se rechazan los pagos directos de ETH; las transferencias de SECT tienen que llegar completas.", c26_v: "Ataques habituales a contratos inteligentes",
      c27_t: "Código fuente público", c27_p: "El contrato completo está publicado en esta web, junto con la configuración exacta del compilador, para que cualquiera pueda verificarlo en Etherscan contra la dirección desplegada.", c27_v: "Código que nadie puede revisar",
      c28_t: "Una web sin custodia", c28_p: "Tu wallet firma cada transacción. La web nunca ve tus claves ni guarda tus fondos, y lee cada número directamente de Ethereum.", c28_v: "Riesgo de custodia",
      c29_t: "Datos reales, sin precios simulados", c29_p: "Saldos, reservas y pools salen de la blockchain; los valores en dólares usan datos reales del mercado. Si tu wallet está en otra red, la web te pide cambiarla antes de enviar nada.", c29_v: "Números inventados y transacciones en la red equivocada",
      roles_t: "Quién puede hacer qué", roles_p: "El contrato da a cada parte una lista corta y fija de permisos.",
      th_who: "Quién", th_can: "Puede", th_cannot: "No puede",
      ro1: "Sectora (dueño del contrato)", ro1c: "Cambiar la wallet que recibe la parte no quemada de las comisiones de Sectora, o pasar este papel a otra dirección.", ro1n: "Pausar nada, cambiar reglas, comisiones, precios o plazos, tocar ninguna reserva, pool, moneda ni tus tokens, ni crear tokens.",
      ro2: "Creador", ro2c: "Crear una moneda (nombre, ticker, supply y tiempo de reserva), entrar en su reserva como cualquier wallet, cobrar el 1 % de creador y el 5 % en 30 días.", ro2n: "Cambiar nada después de crearla, poner más que el máximo por wallet, tocar el SECT de nadie, recibir tokens antes del lanzamiento ni vender su 5 % el primer día.",
      ro3: "Tú", ro3c: "Entrar en una reserva, recuperar tu SECT antes del lanzamiento, bloquear por el bonus, recibir tus tokens y operarlos donde quieras.", ro3n: "Entrar después del plazo ni por encima del máximo por wallet.",
      ro4: "Cualquiera", ro4c: "Ejecutar la quema de la plataforma y leer todos los datos de cada moneda en Etherscan.", ro4n: "Mover el SECT o los tokens de otra persona.",
      risk_t: "Lo que estas medidas no cubren", risk_p: "Ninguna plataforma puede eliminar todos los riesgos. Léelo antes de entrar en una reserva.",
      r1_t: "El precio se mueve después del lanzamiento", r1_p: "El pool abre un 50 % por encima del precio de la reserva, pero después decide el mercado. El precio puede bajar de lo que pagaste.",
      r2_t: "Un lanzamiento no es una recomendación", r2_p: "Una reserva llena muestra demanda, no que el proyecto sea bueno. Lee la descripción y revisa los enlaces y al creador.",
      r3_t: "Una persona, varias wallets", r3_p: "Alguien puede usar varias wallets. Cada una paga el mismo precio y tiene el mismo máximo.",
      r4_t: "El precio del SECT", r4_p: "Las reservas se pagan en SECT, así que su valor en dólares sube y baja con el precio del SECT.",
      r5_t: "Riesgo de los contratos inteligentes", r5_p: "El código es público y está probado, pero el software puede tener errores y las transacciones en blockchain no se pueden deshacer.",
      r6_t: "Webs y monedas falsas", r6_p: "Usa solo sectoralabs.com, comprueba la dirección del contrato y nunca compartas tu frase de recuperación. Sectora nunca te la pedirá.",
      ver_t: "Compruébalo tú mismo", ver_p: "No tienes que fiarte de esta página. Todo lo anterior se puede comprobar en la blockchain.",
      v1: "Lee el código del contrato de lanzamiento y de la plantilla de las monedas.", v1l: "SectoraFairLaunch.sol",
      v2: "En Etherscan, abre el contrato de lanzamiento → Read Contract → coinView(dirección de la moneda): objetivo, reunido, plazo y máximo por wallet.", v2l: "Contrato de lanzamiento en Etherscan", v2n: "La dirección del contrato de lanzamiento se publicará aquí en cuanto esté activo.",
      v3: "seatView(dirección de la moneda, tu wallet) muestra tu SECT en la reserva, tu bloqueo y los tokens que has recibido y puedes recibir ahora.",
      v4: "Tras el lanzamiento, abre el pool de la moneda en Etherscan: los LP están en 0x000…dEaD.",
      v5: "Abre el contrato de la moneda: solo tiene transfer, approve y transferFrom. No existe ninguna función de dueño, mint ni pausa.",
      cta_t: "¿Quieres verlo funcionando?", cta_explore: "Explorar monedas", cta_create: "Crear una moneda"
    },
    pt: {
      eb: "Proteção do investidor",
      h1: "Todas as medidas de segurança, explicadas.",
      intro: "O Sectora Launch protege quem coloca dinheiro em moedas novas com regras escritas no contrato inteligente, não com promessas num site. Aqui está cada medida: o que faz, do que protege você e onde fica no código.",
      net: "Sectora Launch na Ethereum · todas as moedas cotadas em SECT",
      k1: "máximo por carteira numa reserva", k2: "de volta se a reserva não encher", k3: "de cada reserva vira liquidez queimada para sempre", k4: "funções de administração sobre reservas, pools ou moedas",
      jump: "Ir para",
      prot: "Protege você de", code: "No contrato",
      p1_t: "Toda moeda nasce segura", p1_p: "Regras que valem para cada moeda desde a criação, seja quem for o criador.",
      p2_t: "Enquanto a reserva está aberta", p2_p: "Seu dinheiro durante a reserva: mesmo preço, um máximo por carteira e saída a qualquer momento.",
      p3_t: "No lançamento", p3_p: "O que acontece na transação que enche a reserva.",
      p4_t: "Depois do lançamento", p4_p: "Como os tokens são entregues e por que ninguém pode vender uma grande parte no primeiro dia.",
      p5_t: "O contrato e este site", p5_p: "Quem controla o quê e como o site trata sua carteira.",
      c1_t: "Supply fixo, criado uma única vez", c1_p: "O supply é criado uma única vez, quando a moeda é criada. A moeda não tem função de mint, então ninguém pode criar mais.", c1_v: "Inflação oculta e emissões surpresa",
      c2_t: "Sem dono, sem imposto, sem lista negra", c2_p: "Cada moeda é um ERC-20 simples: transferir, aprovar e nada mais. Sem dono, sem taxa de transferência, sem pausa, sem lista negra e sem limite de venda.", c2_v: "Honeypots que dá para comprar mas não vender, impostos de venda, carteiras congeladas",
      c3_t: "O mesmo código para todas as moedas", c3_p: "Cada moeda é uma cópia mínima (EIP-1167) de um único modelo de token implantado pelo contrato de lançamento. O criador escolhe nome, ticker e supply; não pode enviar código próprio.", c3_v: "Contratos personalizados maliciosos",
      c4_t: "Ninguém tem a moeda antes do lançamento", c4_p: "Todo o supply fica no contrato de lançamento. O criador não recebe nada adiantado e ninguém pode negociar a moeda até o pool existir.", c4_v: "Supply pré-minerado vendido aos compradores",
      c5_t: "Regras fixas desde a criação", c5_p: "Meta, máximo por carteira, prazo e supply são gravados na criação e nunca podem ser alterados: nem pelo criador, nem pela Sectora.", c5_v: "Mudança de regras no meio do caminho",
      c6_t: "Controle de cópias e de tickers", c6_p: "O site recusa tickers que imitam ativos conhecidos (ETH, USDT, SECT…), avisa sobre nomes parecidos com uma moeda que já existe e mostra a nota do Sectora Shield em cada moeda.", c6_v: "Cópias falsas de moedas conhecidas",
      c7_t: "Mesmo preço para todos", c7_p: "Cada SECT de uma reserva compra exatamente a mesma quantidade de tokens. Entrar no primeiro segundo ou no último custa o mesmo.", c7_v: "Snipers, bots e vantagem de chegar primeiro",
      c8_t: "Um máximo de {CAP} por carteira", c8_p: "Fixado em SECT na criação da moeda, com o preço médio de 30 minutos do SECT. O contrato só aceita o que cabe no máximo e na meta, e devolve o resto na mesma transação.", c8_v: "Baleias ficando com quase toda a moeda",
      c9_t: "Saia quando quiser antes do lançamento", c9_p: "Até a reserva encher, você pode recuperar 100 % do seu SECT com um clique. Sem taxa e sem prazo de espera.", c9_v: "Ficar preso numa reserva que você não quer mais",
      c10_t: "100 % de volta se não encher", c10_p: "Se o prazo passar sem chegar à meta, a reserva fecha e cada um pode recuperar todo o seu SECT. Uma moeda que não é lançada não cobra nenhuma taxa.", c10_v: "Perder dinheiro numa moeda que nunca saiu",
      c11_t: "Seu SECT fica com o contrato", c11_p: "Os fundos da reserva ficam no contrato de lançamento. Nem o criador nem a Sectora têm qualquer função para movê-los: ou vão para o pool no lançamento ou voltam para você.", c11_v: "Golpes antes do lançamento",
      c12_t: "Valores em dólar que não podem ser manipulados", c12_p: "A meta de {G} e o máximo de {CAP} são convertidos em SECT com o preço médio de 30 minutos (TWAP) do pool SECT/USDT da Uniswap V3, e nunca podem se afastar mais de 50 vezes de valores de referência fixos.", c12_v: "Um pico repentino de preço mudando o tamanho de uma reserva",
      c13_t: "Proteção de preço ao pagar com ETH", c13_p: "O ETH é trocado por SECT numa rota fixa (ETH → USDT → SECT na Uniswap V3) com um mínimo de SECT que você aceita. Se o preço se mover mais que o seu slippage, a transação é cancelada.", c13_v: "Ataques sanduíche e pagar demais",
      c14_t: "Só aprovações exatas", c14_p: "Quando você paga com SECT, o site pede para aprovar exatamente o valor daquela operação, nunca um valor ilimitado.", c14_v: "Carteiras esvaziadas por aprovações ilimitadas",
      c15_t: "Lançamento automático, na mesma transação", c15_p: "A contribuição que chega à meta cria o pool, adiciona a liquidez e queima os LP na mesma transação. Sem servidor da equipe, sem passo manual e sem espera.", c15_v: "Migrações travadas ou manipuladas",
      c16_t: "98 % da reserva vai para o pool", c16_p: "Só há taxas se a moeda for lançada: 1 % para o criador e 1 % para a Sectora. Todo o resto vira liquidez.", c16_v: "Taxas ocultas e taxas em moedas que fracassam",
      c17_t: "Liquidez queimada para sempre", c17_p: "Os LP do pool são criados diretamente em 0x…dEaD. Ninguém, nem o criador nem a Sectora, pode retirar a liquidez.", c17_v: "O clássico golpe de retirar a liquidez",
      c18_t: "O pool abre 50 % acima do preço da reserva", c18_p: "O pool recebe o SECT e uma quantidade de tokens calculada para que o primeiro preço seja 1,5 vez o preço que todos pagaram na reserva. Daí em diante, o mercado define o preço.", c18_v: "Quem entrou na reserva começar abaixo do seu preço no primeiro dia",
      c19_t: "O pool não pode ser preparado antes", c19_p: "Como ninguém tem a moeda antes do lançamento, ninguém pode criar o pool a um preço ruim. SECT enviado antes ao endereço do pool só soma liquidez.", c19_v: "Pools preparados e manipulação de preço no lançamento",
      c20_t: "Entrega gradual", c20_p: "75 % dos seus tokens podem ser recebidos no lançamento e os outros 25 % são liberados de forma linear durante 7 dias.", c20_v: "Todo mundo vendendo tudo no primeiro minuto",
      c21_t: "Bloqueio opcional de 30 dias com bônus", c21_p: "Quem bloqueia recebe tudo no dia 30 mais um bônus de até +25 %, pago de uma reserva fixa de 6,5 %. A parte que ninguém ganha é queimada no lançamento, então nunca se criam tokens novos.", c21_v: "Pressão de venda de curto prazo, sem diluir ninguém",
      c22_t: "Os tokens do criador são liberados em 30 dias", c22_p: "Os 5 % do criador são liberados de forma linear durante 30 dias após o lançamento. Na reserva o criador é mais uma carteira, com o mesmo preço e o mesmo máximo.", c22_v: "Criadores vendendo uma grande parte no lançamento",
      c23_t: "Metade da receita da plataforma é queimada", c23_p: "O 1 % da Sectora é cobrado em SECT. Ao ser retirado, metade é enviada para 0x…dEaD. Qualquer pessoa pode executar a retirada.", c23_v: "Taxas que nunca beneficiam quem tem SECT",
      c24_t: "Negociação aberta na Uniswap", c24_p: "Após o lançamento a moeda é negociada num pool padrão da Uniswap V2. Você pode negociá-la neste site, no app da Uniswap ou em qualquer outro lugar, e acompanhá-la no DexScreener.", c24_v: "Ficar preso a uma única plataforma",
      c25_t: "Ninguém administra o seu dinheiro", c25_p: "O dono do contrato só pode mudar a carteira que recebe a parte não queimada da Sectora. Não há pausa nem atualização, nem função para mudar taxas, regras ou preços, ou para mexer em reservas, pools ou moedas.", c25_v: "Chaves de administrador e atualizações que mudam as regras",
      c26_t: "Proteção contra reentrada e cálculos verificados", c26_p: "Todas as funções que movem dinheiro são protegidas contra reentrada; o Solidity 0.8 impede estouros; pagamentos diretos em ETH são recusados; transferências de SECT precisam chegar completas.", c26_v: "Ataques comuns a contratos inteligentes",
      c27_t: "Código-fonte público", c27_p: "O contrato completo está publicado neste site, junto com a configuração exata do compilador, para que qualquer pessoa possa verificá-lo no Etherscan contra o endereço implantado.", c27_v: "Código que ninguém pode revisar",
      c28_t: "Um site sem custódia", c28_p: "Sua carteira assina cada transação. O site nunca vê suas chaves nem guarda seus fundos, e lê cada número diretamente da Ethereum.", c28_v: "Risco de custódia",
      c29_t: "Dados reais, sem preços simulados", c29_p: "Saldos, reservas e pools vêm da blockchain; os valores em dólar usam dados reais do mercado. Se sua carteira estiver em outra rede, o site pede para trocar antes de enviar qualquer coisa.", c29_v: "Números inventados e transações na rede errada",
      roles_t: "Quem pode fazer o quê", roles_p: "O contrato dá a cada parte uma lista curta e fixa de permissões.",
      th_who: "Quem", th_can: "Pode", th_cannot: "Não pode",
      ro1: "Sectora (dona do contrato)", ro1c: "Mudar a carteira que recebe a parte não queimada das taxas da Sectora, ou passar este papel para outro endereço.", ro1n: "Pausar nada, mudar regras, taxas, preços ou prazos, mexer em reservas, pools, moedas ou nos seus tokens, nem criar tokens.",
      ro2: "Criador", ro2c: "Criar uma moeda (nome, ticker, supply e tempo de reserva), entrar na reserva como qualquer carteira, receber o 1 % de criador e os 5 % em 30 dias.", ro2n: "Mudar nada depois da criação, colocar mais que o máximo por carteira, mexer no SECT de ninguém, receber tokens antes do lançamento ou vender os 5 % no primeiro dia.",
      ro3: "Você", ro3c: "Entrar numa reserva, recuperar seu SECT antes do lançamento, bloquear pelo bônus, receber seus tokens e negociá-los onde quiser.", ro3n: "Entrar depois do prazo ou acima do máximo por carteira.",
      ro4: "Qualquer pessoa", ro4c: "Executar a queima da plataforma e ler todos os dados de cada moeda no Etherscan.", ro4n: "Mover o SECT ou os tokens de outra pessoa.",
      risk_t: "O que estas medidas não cobrem", risk_p: "Nenhuma plataforma elimina todos os riscos. Leia antes de entrar numa reserva.",
      r1_t: "O preço muda depois do lançamento", r1_p: "O pool abre 50 % acima do preço da reserva, mas depois quem decide é o mercado. O preço pode cair abaixo do que você pagou.",
      r2_t: "Um lançamento não é uma recomendação", r2_p: "Uma reserva cheia mostra demanda, não que o projeto seja bom. Leia a descrição e confira os links e o criador.",
      r3_t: "Uma pessoa, várias carteiras", r3_p: "Alguém pode usar várias carteiras. Cada uma paga o mesmo preço e tem o mesmo máximo.",
      r4_t: "O preço do SECT", r4_p: "As reservas são pagas em SECT, então o valor em dólar sobe e desce com o preço do SECT.",
      r5_t: "Risco de contratos inteligentes", r5_p: "O código é público e testado, mas software pode ter erros, e transações em blockchain não podem ser desfeitas.",
      r6_t: "Sites e moedas falsos", r6_p: "Use apenas sectoralabs.com, confira o endereço do contrato e nunca compartilhe sua frase de recuperação. A Sectora nunca vai pedi-la.",
      ver_t: "Confira você mesmo", ver_p: "Você não precisa confiar nesta página. Tudo acima pode ser conferido na blockchain.",
      v1: "Leia o código do contrato de lançamento e do modelo das moedas.", v1l: "SectoraFairLaunch.sol",
      v2: "No Etherscan, abra o contrato de lançamento → Read Contract → coinView(endereço da moeda): meta, reunido, prazo e máximo por carteira.", v2l: "Contrato de lançamento no Etherscan", v2n: "O endereço do contrato de lançamento será publicado aqui assim que estiver ativo.",
      v3: "seatView(endereço da moeda, sua carteira) mostra seu SECT na reserva, seu bloqueio e os tokens que você recebeu e pode receber agora.",
      v4: "Depois do lançamento, abra o pool da moeda no Etherscan: os LP estão em 0x000…dEaD.",
      v5: "Abra o contrato da moeda: ele só tem transfer, approve e transferFrom. Não existe função de dono, mint ou pausa.",
      cta_t: "Quer ver funcionando?", cta_explore: "Explorar moedas", cta_create: "Criar uma moeda"
    }
  };
  // [section key, icon, measure numbers with the code they live in]
  var PHASES = [
    ["p1", "coins", [[1, "coins", "initialize() · no mint()"], [2, "shield", "transfer() · approve()"], [3, "copy", "EIP-1167 · tokenImplementation"], [4, "lock", "balanceOf(launch contract)"], [5, "file", "coinView()"], [6, "copycat", "Sectora Shield"]]],
    ["p2", "users", [[7, "users", "claimable()"], [8, "scale", "cap · seatView()"], [9, "back", "withdraw()"], [10, "clock", "deadline · withdraw()"], [11, "lock", "raised"], [12, "chart", "quoteUsdPrice() · sizesNow()"], [13, "bolt", "contributeWithETH(minQuoteOut)"], [14, "check", "approve(exact)"]]],
    ["p3", "rocket", [[15, "rocket", "_launch()"], [16, "pie", "FEE_CREATOR_BPS · FEE_PLATFORM_BPS"], [17, "fire", "mint(0x…dEaD)"], [18, "chart", "RESERVE_PARTS · POOL_PARTS"], [19, "shield", "getPair() · mint()"]]],
    ["p4", "clock", [[20, "clock", "INSTANT_BPS · VEST_PERIOD"], [21, "badge", "BONUS_BPS · MAX_LOCK_BONUS"], [22, "user", "CREATOR_BPS · CREATOR_VEST"], [23, "fire", "withdrawProtocolFees()"], [24, "ext", "Uniswap V2"]]],
    ["p5", "shield", [[25, "id", "setFeeRecipient()"], [26, "lock", "nonReentrant · Solidity 0.8.24"], [27, "file", "SectoraFairLaunch.sol"], [28, "wallet", "EIP-1193 · EIP-6963"], [29, "info", "Ethereum RPC · DexScreener"]]]
  ];
  function view(net) {
    var X = window.SLX, LV = window.SLLive, L = X.lang(), D = S[L] || S.en;
    var z = LV && LV.sizes ? LV.sizes() : { g: 15000, cap: 500 }, dol = function (n) { return "$" + X.nf(n, 0); };
    function s(k) { var v = D[k] != null ? D[k] : S.en[k]; return String(v).split("{G}").join(dol(z.g)).split("{CAP}").join(dol(z.cap)); }
    var e = X.esc, ico = X.ico;
    var k = LV && LV.liveChains ? LV.liveChains()[0] : null, ch = k && LV.chains[k], fac = k && LV.factory ? LV.factory(k) : "";
    var facUrl = fac && ch && ch.exp ? ch.exp + "/address/" + fac + "#readContract" : "";
    var tiles = [[dol(z.cap), s("k1")], ["100 %", s("k2")], ["98 %", s("k3")], ["0", s("k4")]];
    var head = '<a class="sl-back" href="#/">' + ico("back") + e(X.t("back")) + "</a>" +
      '<div class="sl-pagehead sf-head"><span class="sl-eyebrow"><i class="rule"></i>' + e(s("eb")) + "</span><h1>" + e(s("h1")) + "</h1><p>" + e(s("intro")) + '</p><span class="sf-net">' + ico("shield") + e(s("net")) + "</span></div>" +
      '<div class="sf-keys">' + tiles.map(function (t) { return '<div class="sf-key"><b>' + e(t[0]) + "</b><span>" + e(t[1]) + "</span></div>"; }).join("") + "</div>" +
      '<nav class="sf-jump" aria-label="' + e(s("jump")) + '"><span>' + e(s("jump")) + "</span>" + PHASES.map(function (p, i) { return '<button type="button" data-sf="sf-' + p[0] + '"><i>' + (i + 1) + "</i>" + e(s(p[0] + "_t")) + "</button>"; }).join("") +
      '<button type="button" data-sf="sf-roles"><i>6</i>' + e(s("roles_t")) + '</button><button type="button" data-sf="sf-risk"><i>7</i>' + e(s("risk_t")) + '</button><button type="button" data-sf="sf-verify"><i>8</i>' + e(s("ver_t")) + "</button></nav>";
    var n = 0;
    var phases = PHASES.map(function (p, i) {
      return '<section class="sf-phase" id="sf-' + p[0] + '"><div class="sf-phase-h"><span class="sf-num">' + String(i + 1).padStart(2, "0") + "</span><div>" + ico(p[1]) + "<h2>" + e(s(p[0] + "_t")) + "</h2><p>" + e(s(p[0] + "_p")) + "</p></div></div>" +
        '<div class="sf-cards">' + p[2].map(function (c) {
          n++;
          return '<article class="sf-card"><div class="sf-card-top"><span class="sf-n">' + String(n).padStart(2, "0") + "</span>" + ico(c[1]) + "</div><h3>" + e(s("c" + c[0] + "_t")) + "</h3><p>" + e(s("c" + c[0] + "_p")) + "</p>" +
            '<dl><div><dt>' + e(s("prot")) + "</dt><dd>" + e(s("c" + c[0] + "_v")) + "</dd></div><div><dt>" + e(s("code")) + '</dt><dd class="sf-code">' + e(c[2]) + "</dd></div></dl></article>";
        }).join("") + "</div></section>";
    }).join("");
    var roles = '<section class="sf-block" id="sf-roles"><div class="sl-head"><div><span class="sl-eyebrow"><i class="rule"></i>06</span><h2>' + e(s("roles_t")) + '</h2></div></div><p class="sl-sec-sub">' + e(s("roles_p")) + "</p>" +
      '<div class="sf-roles">' + [1, 2, 3, 4].map(function (r) {
        return '<div class="sf-role"><h4>' + ico(["id", "user", "wallet", "users"][r - 1]) + e(s("ro" + r)) + '</h4><div class="sf-can"><b>' + ico("check") + e(s("th_can")) + "</b><p>" + e(s("ro" + r + "c")) + '</p></div><div class="sf-cannot"><b>' + ico("x") + e(s("th_cannot")) + "</b><p>" + e(s("ro" + r + "n")) + "</p></div></div>";
      }).join("") + "</div></section>";
    var risks = '<section class="sf-block" id="sf-risk"><div class="sl-head"><div><span class="sl-eyebrow"><i class="rule"></i>07</span><h2>' + e(s("risk_t")) + '</h2></div></div><p class="sl-sec-sub">' + e(s("risk_p")) + "</p>" +
      '<div class="sf-risks">' + [1, 2, 3, 4, 5, 6].map(function (r) { return '<div class="sf-risk">' + ico("alert") + "<div><b>" + e(s("r" + r + "_t")) + "</b><p>" + e(s("r" + r + "_p")) + "</p></div></div>"; }).join("") + "</div></section>";
    var steps = [
      e(s("v1")) + ' <a href="contracts/SectoraFairLaunch.sol" target="_blank" rel="noopener">' + e(s("v1l")) + " ↗</a>",
      e(s("v2")) + " " + (facUrl ? '<a href="' + e(facUrl) + '" target="_blank" rel="noopener">' + e(s("v2l")) + " ↗</a>" : '<span class="faint">' + e(s("v2n")) + "</span>"),
      e(s("v3")), e(s("v4")), e(s("v5"))
    ];
    var verify = '<section class="sf-block" id="sf-verify"><div class="sl-head"><div><span class="sl-eyebrow"><i class="rule"></i>08</span><h2>' + e(s("ver_t")) + '</h2></div></div><p class="sl-sec-sub">' + e(s("ver_p")) + "</p>" +
      '<ol class="sf-steps">' + steps.map(function (h) { return "<li><p>" + h + "</p></li>"; }).join("") + "</ol></section>";
    var cta = '<section class="sf-cta"><h2>' + e(s("cta_t")) + '</h2><div><a class="sl-btn" href="#/">' + ico("compass") + e(s("cta_explore")) + '</a><a class="sl-btn sl-btn-p" href="#/create">' + ico("rocket") + e(s("cta_create")) + "</a></div></section>";
    return head + phases + roles + risks + verify + cta;
  }
  // in-page jumps without touching the #/ routes
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-sf]");
    if (!b) return;
    var t = document.getElementById(b.getAttribute("data-sf"));
    if (t) { ev.preventDefault(); t.scrollIntoView({ behavior: "smooth", block: "start" }); }
  });
  window.SLSafety = { view: view };
})();
