// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/*
 * Sectora Launch — fair coin launches priced in SECT (or in the network's native coin
 * where SECT is not available yet).
 *
 * Every coin is a fixed-supply ERC-20 (1,000,000,000 tokens, 18 decimals, no owner,
 * no mint, no tax). 800,000,000 are sold on a bonding curve priced in the quote token
 * (SECT on Ethereum). When the curve sells out the coin graduates: all the quote raised
 * plus the remaining 200,000,000 tokens become a Uniswap-V2-style COIN/QUOTE pool and the
 * LP tokens are sent to 0x…dEaD, so that liquidity can never be withdrawn by anyone.
 *
 * Native mode: when the quote token is the wrapped native coin (e.g. WBNB on BNB Chain),
 * buyers pay with the native coin (wrapped 1:1, no swap) and sellers, refunds and
 * creator fees are paid back in the native coin. The platform share stays wrapped.
 *
 * Guarantees enforced by code:
 *  - Fair window: during the first 5 minutes a wallet can buy at most 1 % of supply.
 *  - Creator buy at launch: at most 5 % of supply, locked 7 days, then released
 *    linearly over 30 days.
 *  - Until graduation tokens only move through this contract, so nobody can seed or
 *    skew the DEX pool before it exists.
 *  - 1 % fee per curve trade: 0.5 % to the coin creator, 0.5 % to the platform.
 *    The launch fee also goes to the platform. A fixed share of everything the
 *    platform earns is burned (sent to 0x…dEaD) when it is withdrawn.
 *  - Buying with ETH swaps ETH → SECT on Uniswap V3 along a route fixed at deployment,
 *    with the buyer's own minimum-output protection, then buys on the curve. In native
 *    mode the coin is only wrapped; payouts to accounts that refuse the native coin are
 *    made in the wrapped coin.
 *  - Graduation in dollars: with an oracle pool set, each coin's curve is sized when the
 *    coin is created so that it graduates after raising `gradUsd` worth of the quote coin,
 *    valued at the 30-minute average price of a Uniswap/PancakeSwap V3 quote/stablecoin
 *    pool. The curve of a coin never changes after creation. If the oracle cannot answer,
 *    the fixed reserve is used, and the result always stays within 1/50x–50x of it.
 *  - The owner can only change where the platform's (non-burned) share is paid.
 *    It cannot pause, touch the curves, the raised SECT, the route or any coin.
 */

interface IV3PoolOracle {
    function observe(uint32[] calldata secondsAgos) external view returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

interface IDecimals {
    function decimals() external view returns (uint8);
}

interface IERC20Min {
    function balanceOf(address a) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IV2Factory {
    function getPair(address a, address b) external view returns (address);
    function createPair(address a, address b) external returns (address);
}

interface IV2Pair {
    function mint(address to) external returns (uint256);
}

interface IWNative {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

interface IV3SwapRouter {
    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }
    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
}

contract SectoraLaunchToken {
    uint256 public constant totalSupply = 1_000_000_000 ether;
    uint8 public constant decimals = 18;

    string public name;
    string public symbol;
    address public factory;
    bool public graduated;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) private _allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        factory = address(1); // the implementation itself can never be initialised
    }

    function initialize(string calldata name_, string calldata symbol_) external {
        require(factory == address(0), "SL: initialised");
        factory = msg.sender;
        name = name_;
        symbol = symbol_;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    /// Called once by the factory when the coin moves to the DEX. Irreversible.
    function markGraduated() external {
        require(msg.sender == factory, "SL: only factory");
        graduated = true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        if (spender == factory && !graduated) return type(uint256).max;
        return _allowance[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        // Before graduation the factory may pull tokens without an approval, so a curve
        // sale is a single transaction. The factory only ever pulls from the wallet that
        // calls sell(), and loses this right at graduation.
        if (!(msg.sender == factory && !graduated)) {
            uint256 a = _allowance[from][msg.sender];
            if (a != type(uint256).max) {
                require(a >= amount, "SL: allowance");
                unchecked { _allowance[from][msg.sender] = a - amount; }
            }
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) private {
        // Until graduation only the factory moves tokens (curve buys, sells and the
        // creator's vesting). Nobody can seed or skew the DEX pool before it exists.
        if (!graduated) require(msg.sender == factory, "SL: curve only until graduation");
        require(to != address(0), "SL: zero address");
        uint256 b = balanceOf[from];
        require(b >= amount, "SL: balance");
        unchecked {
            balanceOf[from] = b - amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }
}

contract SectoraLaunchFactory {
    // ---- supply split (18 decimals) ----
    uint256 public constant SUPPLY = 1_000_000_000 ether;
    uint256 public constant CURVE_SUPPLY = 800_000_000 ether;
    uint256 public constant LP_SUPPLY = 200_000_000 ether;
    uint256 public constant VIRTUAL_TOKENS = 1_073_000_000 ether;

    // ---- rules ----
    uint256 public constant FEE_BPS = 100;                // 1 % per curve trade
    uint256 public constant FAIR_WINDOW = 5 minutes;
    uint256 public constant FAIR_CAP = 10_000_000 ether;  // 1 % of supply per wallet
    uint256 public constant DEV_CAP = 50_000_000 ether;   // 5 % of supply
    uint256 public constant DEV_CLIFF = 7 days;
    uint256 public constant DEV_VESTING = 30 days;
    uint256 public constant MAX_NAME = 32;
    uint256 public constant MAX_SYMBOL = 12;
    uint256 public constant MAX_META = 1024;
    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;
    uint32 public constant TWAP_WINDOW = 30 minutes;      // average price used to size new curves
    uint256 public constant ORACLE_RANGE = 50;            // sized reserve stays within virtualQuote / 50 … × 50

    // ---- configuration, fixed at deployment ----
    address public immutable quote;           // SECT
    address public immutable dexFactory;      // Uniswap V2 factory (graduation)
    uint256 public immutable virtualQuote;    // virtual SECT reserve (fixed, or fallback when an oracle is set)
    uint256 public immutable launchFee;       // in SECT, platform income
    uint256 public immutable burnShareBps;    // share of platform income burned on withdrawal
    address public immutable swapRouter;      // Uniswap V3 SwapRouter02 (ETH → SECT), 0 = off
    address public immutable wrappedNative;   // WETH
    bool public immutable nativeQuote;        // quote == wrappedNative: pay and get paid in the native coin
    address public immutable tokenImplementation;
    address public immutable oraclePool;      // V3 pool quote/stablecoin used to size curves in dollars, 0 = off
    uint256 public immutable gradUsd;         // dollars (18 decimals) each new curve raises before graduating
    bool private immutable quoteIsToken0;     // side of the quote coin in the oracle pool
    uint256 private immutable quoteUnit;      // 10 ** quote decimals
    uint256 private immutable usdUnit;        // 10 ** stablecoin decimals
    bytes public swapPath;                    // WETH … SECT, fixed at deployment

    address public owner;
    address public feeRecipient;
    uint256 public protocolFees;
    uint256 public totalBurned;
    mapping(address => uint256) public creatorFees;

    struct Curve {
        address creator;
        uint64 createdAt;
        uint64 createdBlock;
        bool graduated;
        address pair;
        uint256 vQuote;
        uint256 vToken;
        uint256 realQuote;
        uint256 sold;
        uint256 devAmount;
        uint256 devClaimed;
        uint256 vQuote0;   // virtual reserve this coin started with
    }

    mapping(address => Curve) public curves;
    mapping(address => string) public meta;
    mapping(address => mapping(address => uint256)) public fairBought;
    address[] public allTokens;

    uint256 private _lock = 1;

    struct BuyCalc {
        uint256 tokensOut;
        uint256 fee;
        uint256 net;
        uint256 newVQuote;
        uint256 newVToken;
        bool completes;
    }

    event CoinCreated(address indexed token, address indexed creator, string name, string symbol, string meta, uint256 devTokens);
    event Trade(address indexed token, address indexed trader, bool isBuy, uint256 quoteAmount, uint256 tokenAmount, uint256 fee, uint256 vQuote, uint256 vToken, uint256 timestamp);
    event Graduated(address indexed token, address indexed pair, uint256 quoteAmount, uint256 tokenAmount, uint256 liquidity);
    event DevClaimed(address indexed token, address indexed creator, uint256 amount);
    event CreatorFeesClaimed(address indexed creator, uint256 amount);
    event ProtocolFeesWithdrawn(address indexed to, uint256 paid, uint256 burned);
    event FeeRecipientChanged(address indexed recipient);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier nonReentrant() {
        require(_lock == 1, "SL: reentrancy");
        _lock = 2;
        _;
        _lock = 1;
    }

    struct Config {
        address owner;
        address feeRecipient;
        address quote;
        address dexFactory;
        uint256 virtualQuote;
        uint256 launchFee;
        uint256 burnShareBps;
        address swapRouter;
        address wrappedNative;
        bytes swapPath;
        address oraclePool;
        uint256 gradUsd;
    }

    constructor(Config memory cfg) {
        require(cfg.owner != address(0) && cfg.feeRecipient != address(0), "SL: zero address");
        require(cfg.quote.code.length > 0 && cfg.dexFactory.code.length > 0, "SL: DEX or quote not found");
        require(cfg.virtualQuote > 0, "SL: virtual reserve");
        require(cfg.burnShareBps <= 10_000, "SL: burn share");
        bool native_ = cfg.wrappedNative != address(0) && cfg.quote == cfg.wrappedNative;
        if (native_) {
            require(cfg.swapRouter == address(0), "SL: native quote needs no route");
        } else if (cfg.swapRouter != address(0)) {
            require(cfg.swapRouter.code.length > 0 && cfg.wrappedNative.code.length > 0, "SL: router not found");
            uint256 n = cfg.swapPath.length;
            require(n >= 43 && (n - 20) % 23 == 0, "SL: swap path");
            require(_pathToken(cfg.swapPath, 0) == cfg.wrappedNative && _pathToken(cfg.swapPath, n - 20) == cfg.quote, "SL: swap path ends");
        }
        owner = cfg.owner;
        feeRecipient = cfg.feeRecipient;
        quote = cfg.quote;
        dexFactory = cfg.dexFactory;
        virtualQuote = cfg.virtualQuote;
        launchFee = cfg.launchFee;
        burnShareBps = cfg.burnShareBps;
        swapRouter = cfg.swapRouter;
        wrappedNative = cfg.wrappedNative;
        nativeQuote = native_;
        swapPath = cfg.swapPath;
        bool q0;
        uint256 qu;
        uint256 uu;
        if (cfg.oraclePool != address(0)) {
            require(cfg.gradUsd > 0, "SL: graduation in dollars");
            address t0 = IV3PoolOracle(cfg.oraclePool).token0();
            address t1 = IV3PoolOracle(cfg.oraclePool).token1();
            require(t0 == cfg.quote || t1 == cfg.quote, "SL: oracle pool");
            q0 = t0 == cfg.quote;
            uint8 qd = IDecimals(cfg.quote).decimals();
            uint8 ud = IDecimals(q0 ? t1 : t0).decimals();
            require(qd <= 18 && ud <= 18, "SL: oracle decimals");
            qu = 10 ** qd;
            uu = 10 ** ud;
        }
        oraclePool = cfg.oraclePool;
        gradUsd = cfg.oraclePool != address(0) ? cfg.gradUsd : 0;
        quoteIsToken0 = q0;
        quoteUnit = qu;
        usdUnit = uu;
        tokenImplementation = address(new SectoraLaunchToken());
        emit OwnershipTransferred(address(0), cfg.owner);
        emit FeeRecipientChanged(cfg.feeRecipient);
    }

    // ------------------------------------------------------------------ create

    /// Pays the launch fee plus an optional creator buy (`devQuote`) in SECT. Needs an approval.
    function createCoin(string memory name_, string memory symbol_, string memory meta_, uint256 devQuote, uint256 minDevTokens)
        external
        nonReentrant
        returns (address token)
    {
        _pull(msg.sender, launchFee + devQuote);
        token = _create(name_, symbol_, meta_, devQuote, minDevTokens);
    }

    /// Same, paying in ETH: swaps ETH → SECT, takes the launch fee, uses up to `maxDevQuote`
    /// for the creator buy and refunds any SECT left over.
    function createCoinWithETH(
        string memory name_,
        string memory symbol_,
        string memory meta_,
        uint256 maxDevQuote,
        uint256 minQuoteOut,
        uint256 minDevTokens
    ) external payable nonReentrant returns (address token) {
        uint256 got = _swapIn(msg.value, minQuoteOut);
        require(got >= launchFee, "SL: launch fee");
        uint256 dev = got - launchFee;
        if (dev > maxDevQuote) dev = maxDevQuote;
        token = _create(name_, symbol_, meta_, dev, minDevTokens);
        uint256 left = got - launchFee - dev;
        if (left > 0) _payOut(msg.sender, left);
    }

    // ------------------------------------------------------------------ trade

    /// Buys with SECT. Takes exactly what is used (less than `quoteIn` only on the last buy). Needs an approval.
    function buy(address token, uint256 quoteIn, uint256 minTokens) external nonReentrant returns (uint256 tokensOut) {
        uint256 used;
        (tokensOut, used) = _buy(token, msg.sender, quoteIn, minTokens);
        _pull(msg.sender, used);
        _afterBuy(token);
    }

    /// Buys with ETH: ETH → SECT on Uniswap V3 (protected by `minQuoteOut`), then buys on the curve.
    /// SECT not needed by the curve (only possible on the last buy) is returned to the buyer.
    function buyWithETH(address token, uint256 minQuoteOut, uint256 minTokens) external payable nonReentrant returns (uint256 tokensOut) {
        uint256 got = _swapIn(msg.value, minQuoteOut);
        uint256 used;
        (tokensOut, used) = _buy(token, msg.sender, got, minTokens);
        _afterBuy(token);
        if (got > used) _payOut(msg.sender, got - used);
    }

    /// Sells on the curve for SECT. No approval needed before graduation.
    function sell(address token, uint256 tokensIn, uint256 minQuote) external nonReentrant returns (uint256 quoteOut) {
        Curve storage c = curves[token];
        require(c.creator != address(0), "SL: unknown coin");
        require(!c.graduated, "SL: graduated, trade on the DEX");
        require(tokensIn > 0, "SL: zero amount");
        // Pull first (our own token, no hooks): selling more than you hold fails here.
        require(SectoraLaunchToken(token).transferFrom(msg.sender, address(this), tokensIn), "SL: transfer");

        uint256 newVToken = c.vToken + tokensIn;
        uint256 newVQuote = _ceilDiv(c.vQuote * c.vToken, newVToken);
        uint256 gross = c.vQuote - newVQuote;
        require(gross <= c.realQuote, "SL: curve reserve");
        uint256 fee = (gross * FEE_BPS) / 10_000;
        quoteOut = gross - fee;
        require(quoteOut > 0, "SL: amount too small");
        require(quoteOut >= minQuote, "SL: slippage");

        c.vQuote = newVQuote;
        c.vToken = newVToken;
        c.realQuote -= gross;
        c.sold -= tokensIn;
        _splitFee(c.creator, fee);

        emit Trade(token, msg.sender, false, gross, tokensIn, fee, newVQuote, newVToken, block.timestamp);
        _payOut(msg.sender, quoteOut);
    }

    // ------------------------------------------------------------------ creator

    function claimableDev(address token) public view returns (uint256) {
        Curve storage c = curves[token];
        if (c.devAmount == 0) return 0;
        uint256 start = uint256(c.createdAt) + DEV_CLIFF;
        if (block.timestamp <= start) return 0;
        uint256 elapsed = block.timestamp - start;
        uint256 vested = elapsed >= DEV_VESTING ? c.devAmount : (c.devAmount * elapsed) / DEV_VESTING;
        return vested - c.devClaimed;
    }

    function claimDev(address token) external nonReentrant {
        Curve storage c = curves[token];
        require(msg.sender == c.creator, "SL: only creator");
        uint256 amount = claimableDev(token);
        require(amount > 0, "SL: nothing to claim");
        c.devClaimed += amount;
        require(SectoraLaunchToken(token).transfer(msg.sender, amount), "SL: transfer");
        emit DevClaimed(token, msg.sender, amount);
    }

    function claimCreatorFees() external nonReentrant {
        uint256 amount = creatorFees[msg.sender];
        require(amount > 0, "SL: nothing to claim");
        creatorFees[msg.sender] = 0;
        emit CreatorFeesClaimed(msg.sender, amount);
        _payOut(msg.sender, amount);
    }

    // ------------------------------------------------------------------ platform

    /// Anyone can trigger it: burns the fixed share and pays the rest to the fee recipient.
    function withdrawProtocolFees() external nonReentrant {
        uint256 amount = protocolFees;
        require(amount > 0, "SL: nothing to withdraw");
        protocolFees = 0;
        uint256 burn = (amount * burnShareBps) / 10_000;
        uint256 paid = amount - burn;
        totalBurned += burn;
        emit ProtocolFeesWithdrawn(feeRecipient, paid, burn);
        if (burn > 0) _pay(DEAD, burn);
        if (paid > 0) _pay(feeRecipient, paid);
    }

    function setFeeRecipient(address recipient) external {
        require(msg.sender == owner, "SL: only owner");
        require(recipient != address(0), "SL: zero address");
        feeRecipient = recipient;
        emit FeeRecipientChanged(recipient);
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "SL: only owner");
        require(newOwner != address(0), "SL: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ------------------------------------------------------------------ views

    struct CoinView {
        address token;
        string name;
        string symbol;
        string meta;
        address creator;
        uint64 createdAt;
        uint64 createdBlock;
        bool graduated;
        address pair;
        uint256 vQuote;
        uint256 vToken;
        uint256 realQuote;
        uint256 sold;
        uint256 devAmount;
        uint256 devClaimed;
        uint256 vQuote0;
    }

    function coinsCount() external view returns (uint256) {
        return allTokens.length;
    }

    function coinView(address token) public view returns (CoinView memory v) {
        Curve storage c = curves[token];
        v.token = token;
        if (c.creator == address(0)) return v;
        v.name = SectoraLaunchToken(token).name();
        v.symbol = SectoraLaunchToken(token).symbol();
        v.meta = meta[token];
        v.creator = c.creator;
        v.createdAt = c.createdAt;
        v.createdBlock = c.createdBlock;
        v.graduated = c.graduated;
        v.pair = c.pair;
        v.vQuote = c.vQuote;
        v.vToken = c.vToken;
        v.realQuote = c.realQuote;
        v.sold = c.sold;
        v.devAmount = c.devAmount;
        v.devClaimed = c.devClaimed;
        v.vQuote0 = c.vQuote0;
    }

    /// Newest first: index 0 is the most recent coin.
    function latestCoins(uint256 offset, uint256 limit) external view returns (CoinView[] memory out) {
        uint256 n = allTokens.length;
        if (offset >= n) return new CoinView[](0);
        uint256 m = n - offset;
        if (limit < m) m = limit;
        out = new CoinView[](m);
        for (uint256 i = 0; i < m; i++) out[i] = coinView(allTokens[n - 1 - offset - i]);
    }

    function quoteBuy(address token, uint256 quoteIn)
        external
        view
        returns (uint256 tokensOut, uint256 fee, uint256 used, bool completes)
    {
        Curve storage c = curves[token];
        if (c.creator == address(0) || c.graduated || quoteIn == 0) return (0, 0, 0, false);
        BuyCalc memory b = _curveBuy(c, quoteIn);
        return (b.tokensOut, b.fee, b.net + b.fee, b.completes);
    }

    function quoteSell(address token, uint256 tokensIn) external view returns (uint256 quoteOut, uint256 fee) {
        Curve storage c = curves[token];
        if (c.creator == address(0) || c.graduated || tokensIn == 0) return (0, 0);
        uint256 newVQuote = _ceilDiv(c.vQuote * c.vToken, c.vToken + tokensIn);
        uint256 gross = c.vQuote - newVQuote;
        if (gross > c.realQuote) gross = c.realQuote;
        fee = (gross * FEE_BPS) / 10_000;
        quoteOut = gross - fee;
    }

    /// SECT needed (fee included) to buy everything left on the curve.
    function costToComplete(address token) external view returns (uint256) {
        Curve storage c = curves[token];
        if (c.creator == address(0) || c.graduated) return 0;
        uint256 k = c.vQuote * c.vToken;
        uint256 net = _ceilDiv(k, c.vToken - (CURVE_SUPPLY - c.sold)) - c.vQuote;
        return net + _ceilDiv(net * FEE_BPS, 10_000 - FEE_BPS);
    }

    // ------------------------------------------------------------------ dollar sizing

    /// Virtual reserve a coin created now starts with. With an oracle pool it is sized so the curve
    /// raises `gradUsd` worth of the quote coin (raise = reserve × 800/273), at the oracle's
    /// 30-minute average price; otherwise, or if the oracle cannot answer, it is `virtualQuote`.
    function virtualQuoteNow() public view returns (uint256 v) {
        uint256 price = quoteUsdPrice();
        if (price == 0) return virtualQuote;
        v = (gradUsd * 1e18 * 273) / (price * 800);
        uint256 lo = virtualQuote / ORACLE_RANGE;
        uint256 hi = virtualQuote * ORACLE_RANGE;
        if (v < lo) v = lo;
        if (v > hi) v = hi;
    }

    /// Dollars (18 decimals) per whole quote coin, from the 30-minute average tick of the oracle
    /// pool. 0 when there is no oracle or it cannot answer (not enough price history yet).
    function quoteUsdPrice() public view returns (uint256) {
        if (oraclePool == address(0)) return 0;
        uint32[] memory ago = new uint32[](2);
        ago[0] = TWAP_WINDOW;
        try IV3PoolOracle(oraclePool).observe(ago) returns (int56[] memory cum, uint160[] memory) {
            if (cum.length != 2) return 0;
            int256 d = int256(cum[1]) - int256(cum[0]);
            int256 w = int256(uint256(TWAP_WINDOW));
            int256 t = d / w;
            if (d < 0 && d % w != 0) t--; // round toward negative infinity, like Uniswap's OracleLibrary
            int256 e = quoteIsToken0 ? t : -t; // exponent of 1.0001 giving stablecoin units per quote unit
            if (e > 400_000 || e < -400_000) return 0;
            uint256 r = _pow10001(uint256(e >= 0 ? e : -e));
            if (e >= 0) return (r * quoteUnit) / usdUnit;
            return (1e36 * quoteUnit) / (r * usdUnit);
        } catch {
            return 0;
        }
    }

    /// 1.0001^n with 18 decimals (n ≤ 400,000 keeps every product far below 2^256).
    function _pow10001(uint256 n) private pure returns (uint256 r) {
        uint256 b = 1.0001e18;
        r = 1e18;
        while (n > 0) {
            if (n & 1 == 1) r = (r * b) / 1e18;
            n >>= 1;
            if (n > 0) b = (b * b) / 1e18;
        }
    }

    // ------------------------------------------------------------------ internal

    function _create(string memory name_, string memory symbol_, string memory meta_, uint256 devQuote, uint256 minDevTokens)
        private
        returns (address token)
    {
        uint256 nb = bytes(name_).length;
        uint256 sb = bytes(symbol_).length;
        require(nb > 0 && nb <= MAX_NAME, "SL: name length");
        require(sb > 0 && sb <= MAX_SYMBOL, "SL: symbol length");
        require(bytes(meta_).length <= MAX_META, "SL: meta too long");

        token = _clone(tokenImplementation);
        SectoraLaunchToken(token).initialize(name_, symbol_);

        Curve storage c = curves[token];
        c.creator = msg.sender;
        c.createdAt = uint64(block.timestamp);
        c.createdBlock = uint64(block.number);
        uint256 v0 = virtualQuoteNow();
        c.vQuote = v0;
        c.vQuote0 = v0;
        c.vToken = VIRTUAL_TOKENS;
        meta[token] = meta_;
        allTokens.push(token);
        protocolFees += launchFee;

        uint256 devTokens;
        if (devQuote > 0) {
            uint256 fee = (devQuote * FEE_BPS) / 10_000;
            uint256 net = devQuote - fee;
            uint256 newVQuote = c.vQuote + net;
            uint256 newVToken = _ceilDiv(c.vQuote * c.vToken, newVQuote);
            devTokens = c.vToken - newVToken;
            require(devTokens <= DEV_CAP, "SL: creator buy above 5%");
            require(devTokens >= minDevTokens, "SL: slippage");
            c.vQuote = newVQuote;
            c.vToken = newVToken;
            c.realQuote = net;
            c.sold = devTokens;
            c.devAmount = devTokens;
            _splitFee(msg.sender, fee);
            emit Trade(token, msg.sender, true, devQuote, devTokens, fee, newVQuote, newVToken, block.timestamp);
        }
        emit CoinCreated(token, msg.sender, name_, symbol_, meta_, devTokens);
    }

    /// Curve maths for a buy of `quoteIn` SECT. On the last buy it takes exactly what is left.
    function _curveBuy(Curve storage c, uint256 quoteIn) private view returns (BuyCalc memory b) {
        b.fee = (quoteIn * FEE_BPS) / 10_000;
        b.net = quoteIn - b.fee;
        uint256 k = c.vQuote * c.vToken;
        b.newVQuote = c.vQuote + b.net;
        b.newVToken = _ceilDiv(k, b.newVQuote);
        b.tokensOut = c.vToken - b.newVToken;
        uint256 remaining = CURVE_SUPPLY - c.sold;
        if (b.tokensOut >= remaining) {
            b.completes = true;
            b.tokensOut = remaining;
            b.newVToken = c.vToken - remaining;
            b.newVQuote = _ceilDiv(k, b.newVToken);
            b.net = b.newVQuote - c.vQuote;
            b.fee = _ceilDiv(b.net * FEE_BPS, 10_000 - FEE_BPS);
            if (b.net + b.fee > quoteIn) b.fee = quoteIn - b.net; // rounding dust (1 wei at most)
        }
    }

    function _buy(address token, address buyer, uint256 quoteIn, uint256 minTokens) private returns (uint256 tokensOut, uint256 used) {
        Curve storage c = curves[token];
        require(c.creator != address(0), "SL: unknown coin");
        require(!c.graduated, "SL: graduated, trade on the DEX");
        require(quoteIn > 0, "SL: zero amount");

        BuyCalc memory b = _curveBuy(c, quoteIn);
        tokensOut = b.tokensOut;
        require(tokensOut > 0, "SL: amount too small");
        require(tokensOut >= minTokens, "SL: slippage");

        if (block.timestamp < uint256(c.createdAt) + FAIR_WINDOW) {
            uint256 bought = fairBought[token][buyer] + tokensOut;
            require(bought <= FAIR_CAP, "SL: fair window cap (1% per wallet)");
            fairBought[token][buyer] = bought;
        }

        c.vQuote = b.newVQuote;
        c.vToken = b.newVToken;
        c.realQuote += b.net;
        c.sold += tokensOut;
        if (b.completes) c.graduated = true; // the pool is created in _afterBuy, once the SECT is in
        _splitFee(c.creator, b.fee);
        used = b.net + b.fee;

        require(SectoraLaunchToken(token).transfer(buyer, tokensOut), "SL: transfer");
        emit Trade(token, buyer, true, used, tokensOut, b.fee, b.newVQuote, b.newVToken, block.timestamp);
    }

    function _afterBuy(address token) private {
        Curve storage c = curves[token];
        if (c.graduated && c.pair == address(0)) _graduate(token, c);
    }

    function _graduate(address token, Curve storage c) private {
        uint256 amount = c.realQuote;
        c.realQuote = 0;

        address pair = IV2Factory(dexFactory).getPair(token, quote);
        if (pair == address(0)) pair = IV2Factory(dexFactory).createPair(token, quote);
        c.pair = pair;

        SectoraLaunchToken(token).markGraduated();
        // Fund the pool directly and mint once: a pre-existing pair or SECT sent to it in
        // advance cannot block or skew this step.
        _pay(pair, amount);
        require(SectoraLaunchToken(token).transfer(pair, LP_SUPPLY), "SL: token transfer");
        uint256 liquidity = IV2Pair(pair).mint(DEAD);
        emit Graduated(token, pair, amount, LP_SUPPLY, liquidity);
    }

    function _swapIn(uint256 ethIn, uint256 minQuoteOut) private returns (uint256 got) {
        require(ethIn > 0, "SL: zero amount");
        if (nativeQuote) {
            // native mode: the quote is the wrapped coin itself, 1:1
            IWNative(quote).deposit{value: ethIn}();
            require(ethIn >= minQuoteOut, "SL: swap slippage");
            return ethIn;
        }
        require(swapRouter != address(0), "SL: ETH buys off");
        uint256 before = IERC20Min(quote).balanceOf(address(this));
        IV3SwapRouter(swapRouter).exactInput{value: ethIn}(
            IV3SwapRouter.ExactInputParams({path: swapPath, recipient: address(this), amountIn: ethIn, amountOutMinimum: minQuoteOut})
        );
        got = IERC20Min(quote).balanceOf(address(this)) - before;
        require(got >= minQuoteOut && got > 0, "SL: swap slippage");
    }

    function _splitFee(address creator, uint256 fee) private {
        uint256 toCreator = fee / 2;
        creatorFees[creator] += toCreator;
        protocolFees += fee - toCreator;
    }

    /// Pulls SECT and rejects tokens that take a fee on transfer.
    function _pull(address from, uint256 amount) private {
        if (amount == 0) return;
        uint256 before = IERC20Min(quote).balanceOf(address(this));
        _call(quote, abi.encodeWithSelector(IERC20Min.transferFrom.selector, from, address(this), amount));
        require(IERC20Min(quote).balanceOf(address(this)) - before == amount, "SL: quote transfer");
    }

    /// Pays a user: in native mode the wrapped coin is unwrapped and sent as the native coin.
    /// If the receiver does not accept the native coin (a contract or a delegated account
    /// without a payable fallback), it is paid in the wrapped coin instead, so nobody is
    /// ever stuck. Every caller is nonReentrant and has already updated its state.
    function _payOut(address to, uint256 amount) private {
        if (!nativeQuote) {
            _pay(to, amount);
            return;
        }
        IWNative(quote).withdraw(amount);
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) {
            IWNative(quote).deposit{value: amount}();
            _pay(to, amount);
        }
    }

    /// Only the wrapped-native contract may send the native coin here (when unwrapping).
    receive() external payable {
        require(nativeQuote && msg.sender == wrappedNative, "SL: no direct payments");
    }

    function _pay(address to, uint256 amount) private {
        _call(quote, abi.encodeWithSelector(IERC20Min.transfer.selector, to, amount));
    }

    function _call(address target, bytes memory data) private {
        (bool ok, bytes memory ret) = target.call(data);
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "SL: quote transfer failed");
    }

    function _pathToken(bytes memory path, uint256 at) private pure returns (address a) {
        assembly {
            a := shr(96, mload(add(add(path, 32), at)))
        }
    }

    function _ceilDiv(uint256 a, uint256 b) private pure returns (uint256) {
        return a == 0 ? 0 : (a - 1) / b + 1;
    }

    function _clone(address impl) private returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, impl))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            instance := create(0, ptr, 0x37)
        }
        require(instance != address(0), "SL: clone failed");
    }
}
