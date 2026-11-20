// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/*
 * Sectora Launch — fair launches on Ethereum, every coin priced in SECT.
 *
 * 1. Anyone creates a coin for free: name, ticker, supply (1,000 … 10^15 tokens, 18 decimals,
 *    no owner, no mint, no tax) and how long its reserve stays open (1 hour … 7 days).
 * 2. Reserve: everyone pays the same price. The target is $15,000 worth of SECT and each wallet
 *    can put at most $500 worth, both converted to SECT when the coin is created with the
 *    30-minute average price of the SECT/USDT pool. Paying with ETH swaps it to SECT on a route
 *    fixed at deployment. Until the target is reached anyone can take their SECT back; if the
 *    deadline passes first, everyone takes back 100 % and no fee is charged.
 * 3. Launch, in the transaction that reaches the target: 1 % of the reserve goes to the creator and
 *    1 % to the platform (part of it burned when withdrawn). The other 98 % and the pool share of
 *    the tokens become a COIN/SECT Uniswap-V2 pool whose LP tokens are sent to 0x…dEaD, so the
 *    liquidity can never be withdrawn. The pool opens 50 % above the price the reserve paid.
 * 4. Delivery: 75 % of each share at launch and the rest linearly over 7 days. Whoever chose to lock
 *    for 30 days gets everything at day 30 plus a bonus (up to +25 %) from a 6.5 % allotment; the
 *    part of the allotment nobody earns is burned at launch. The creator's 5 % vests over 30 days.
 * 5. The owner can only change where the platform's (non-burned) share is paid. Nobody can pause,
 *    change the rules, touch a reserve, a pool or any coin.
 */

interface IERC20Min {
    function balanceOf(address a) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IV2Factory {
    function getPair(address a, address b) external view returns (address);
    function createPair(address a, address b) external returns (address);
}

interface IV2Pair {
    function mint(address to) external returns (uint256);
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

interface IV3PoolOracle {
    function observe(uint32[] calldata secondsAgos) external view returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

interface IDecimals {
    function decimals() external view returns (uint8);
}

/// Plain fixed-supply ERC-20: no owner, no mint, no tax, no transfer rules.
/// The whole supply is minted to the factory, which hands it out only after launch.
contract SectoraFairToken {
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    string public name;
    string public symbol;
    address public factory;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        factory = address(1); // the implementation itself can never be initialised
    }

    function initialize(string calldata name_, string calldata symbol_, uint256 supply) external {
        require(factory == address(0), "SF: initialised");
        factory = msg.sender;
        name = name_;
        symbol = symbol_;
        totalSupply = supply;
        balanceOf[msg.sender] = supply;
        emit Transfer(address(0), msg.sender, supply);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) {
            require(a >= amount, "SF: allowance");
            unchecked { allowance[from][msg.sender] = a - amount; }
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) private {
        require(to != address(0), "SF: zero address");
        uint256 b = balanceOf[from];
        require(b >= amount, "SF: balance");
        unchecked {
            balanceOf[from] = b - amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }
}

contract SectoraFairLaunch {
    // ---- token split (basis points of the supply) ----
    uint256 public constant CREATOR_BPS = 500;            // 5 % to the creator, vested over 30 days
    uint256 public constant BONUS_BPS = 650;              // 6.5 % bonus allotment for 30-day lockers
    // The rest is split so the pool opens 50 % above the reserve price after the 2 % fees:
    // pool price / reserve price = (98 % × reserve / poolTokens) / (reserve / reserveTokens) = 1.5
    uint256 public constant RESERVE_PARTS = 150;
    uint256 public constant POOL_PARTS = 98;

    // ---- rules ----
    uint256 public constant FEE_CREATOR_BPS = 100;        // 1 % of the reserve, only if the coin launches
    uint256 public constant FEE_PLATFORM_BPS = 100;       // 1 % of the reserve, only if the coin launches
    uint256 public constant INSTANT_BPS = 7500;           // 75 % delivered at launch
    uint256 public constant VEST_PERIOD = 7 days;         // the other 25 % over 7 days
    uint256 public constant LOCK_PERIOD = 30 days;        // lockers get everything at day 30
    uint256 public constant MAX_LOCK_BONUS = 0.25e18;     // up to +25 % for lockers
    uint256 public constant CREATOR_VEST = 30 days;
    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 7 days;
    uint256 public constant MIN_SUPPLY = 1_000 ether;
    uint256 public constant MAX_SUPPLY = 1_000_000_000_000_000 ether;
    uint256 public constant MAX_NAME = 32;
    uint256 public constant MAX_SYMBOL = 12;
    uint256 public constant MAX_META = 1024;
    uint32 public constant TWAP_WINDOW = 30 minutes;
    uint256 public constant ORACLE_RANGE = 50;            // sized amounts stay within fallback / 50 … × 50
    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;

    // ---- configuration, fixed at deployment ----
    address public immutable quote;            // SECT
    address public immutable dexFactory;       // Uniswap V2 factory
    address public immutable swapRouter;       // Uniswap V3 SwapRouter02 (ETH → SECT)
    address public immutable wrappedNative;    // WETH
    address public immutable oraclePool;       // Uniswap V3 SECT/USDT pool (30-minute average price)
    uint256 public immutable targetUsd;        // reserve target in dollars (18 decimals)
    uint256 public immutable capUsd;           // per-wallet maximum in dollars (18 decimals)
    uint256 public immutable targetFallback;   // target in SECT if the oracle cannot answer
    uint256 public immutable capFallback;      // per-wallet maximum in SECT if the oracle cannot answer
    uint256 public immutable burnShareBps;     // share of platform income burned on withdrawal
    address public immutable tokenImplementation;
    bool private immutable quoteIsToken0;
    uint256 private immutable quoteUnit;
    uint256 private immutable usdUnit;
    bytes public swapPath;                     // WETH … SECT

    address public owner;
    address public feeRecipient;
    uint256 public protocolFees;
    uint256 public totalBurned;
    mapping(address => uint256) public creatorFees;

    struct Launch {
        address creator;
        uint64 createdAt;
        uint64 deadline;
        uint64 launchedAt;     // 0 until launch
        uint32 contributors;
        address pair;
        uint256 supply;
        uint256 target;        // SECT
        uint256 cap;           // SECT per wallet
        uint256 raised;        // SECT
        uint256 lockedRaised;  // SECT from wallets that chose the 30-day lock
        uint256 bonusRate;     // 1e18 = +100 %, set at launch
        uint256 creatorClaimed;
    }

    struct Seat {
        uint256 amount;   // SECT in the reserve
        bool locked;      // chose the 30-day lock
        uint256 claimed;  // tokens already received
    }

    mapping(address => Launch) public launches;
    mapping(address => string) public meta;
    mapping(address => mapping(address => Seat)) public seats;
    address[] public allTokens;

    uint256 private _lock = 1;

    event CoinCreated(address indexed token, address indexed creator, uint256 supply, uint256 target, uint256 cap, uint256 deadline);
    event Contributed(address indexed token, address indexed account, uint256 amount, bool locked, uint256 raised);
    event Withdrawn(address indexed token, address indexed account, uint256 amount, uint256 raised);
    event Locked(address indexed token, address indexed account);
    event Launched(address indexed token, address indexed pair, uint256 poolQuote, uint256 poolTokens, uint256 liquidity, uint256 bonusRate, uint256 bonusBurned);
    event Claimed(address indexed token, address indexed account, uint256 amount);
    event CreatorTokensClaimed(address indexed token, address indexed creator, uint256 amount);
    event CreatorFeesClaimed(address indexed creator, uint256 amount);
    event ProtocolFeesWithdrawn(address indexed to, uint256 paid, uint256 burned);
    event FeeRecipientChanged(address indexed recipient);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier nonReentrant() {
        require(_lock == 1, "SF: reentrancy");
        _lock = 2;
        _;
        _lock = 1;
    }

    struct Config {
        address owner;
        address feeRecipient;
        address quote;
        address dexFactory;
        address swapRouter;
        address wrappedNative;
        bytes swapPath;
        address oraclePool;
        uint256 targetUsd;
        uint256 capUsd;
        uint256 targetFallback;
        uint256 capFallback;
        uint256 burnShareBps;
    }

    constructor(Config memory cfg) {
        require(cfg.owner != address(0) && cfg.feeRecipient != address(0), "SF: zero address");
        require(cfg.quote.code.length > 0 && cfg.dexFactory.code.length > 0, "SF: DEX or quote not found");
        require(cfg.swapRouter.code.length > 0 && cfg.wrappedNative.code.length > 0, "SF: router not found");
        uint256 n = cfg.swapPath.length;
        require(n >= 43 && (n - 20) % 23 == 0, "SF: swap path");
        require(_pathToken(cfg.swapPath, 0) == cfg.wrappedNative && _pathToken(cfg.swapPath, n - 20) == cfg.quote, "SF: swap path ends");
        require(cfg.targetUsd > 0 && cfg.capUsd > 0 && cfg.capUsd <= cfg.targetUsd, "SF: dollar amounts");
        require(cfg.targetFallback > 0 && cfg.capFallback > 0 && cfg.capFallback <= cfg.targetFallback, "SF: fallback amounts");
        require(cfg.burnShareBps <= 10_000, "SF: burn share");
        address t0 = IV3PoolOracle(cfg.oraclePool).token0();
        address t1 = IV3PoolOracle(cfg.oraclePool).token1();
        require(t0 == cfg.quote || t1 == cfg.quote, "SF: oracle pool");
        bool q0 = t0 == cfg.quote;
        uint8 qd = IDecimals(cfg.quote).decimals();
        uint8 ud = IDecimals(q0 ? t1 : t0).decimals();
        require(qd <= 18 && ud <= 18, "SF: oracle decimals");

        owner = cfg.owner;
        feeRecipient = cfg.feeRecipient;
        quote = cfg.quote;
        dexFactory = cfg.dexFactory;
        swapRouter = cfg.swapRouter;
        wrappedNative = cfg.wrappedNative;
        swapPath = cfg.swapPath;
        oraclePool = cfg.oraclePool;
        targetUsd = cfg.targetUsd;
        capUsd = cfg.capUsd;
        targetFallback = cfg.targetFallback;
        capFallback = cfg.capFallback;
        burnShareBps = cfg.burnShareBps;
        quoteIsToken0 = q0;
        quoteUnit = 10 ** qd;
        usdUnit = 10 ** ud;
        tokenImplementation = address(new SectoraFairToken());
        emit OwnershipTransferred(address(0), cfg.owner);
        emit FeeRecipientChanged(cfg.feeRecipient);
    }

    // ------------------------------------------------------------------ create

    /// Creates a coin and opens its reserve. Optionally the creator joins the reserve with
    /// `contribution` SECT (needs an approval) in the same transaction.
    function createCoin(
        string calldata name_,
        string calldata symbol_,
        string calldata meta_,
        uint256 supply,
        uint256 duration,
        uint256 contribution,
        bool lock
    ) external nonReentrant returns (address token) {
        token = _create(name_, symbol_, meta_, supply, duration);
        if (contribution > 0) {
            _pull(msg.sender, contribution);
            uint256 used = _contribute(token, msg.sender, contribution, lock);
            if (used < contribution) _pay(msg.sender, contribution - used);
        }
    }

    /// Same, joining the reserve with ETH (swapped to SECT; SECT that does not fit is returned).
    function createCoinWithETH(
        string calldata name_,
        string calldata symbol_,
        string calldata meta_,
        uint256 supply,
        uint256 duration,
        uint256 minQuoteOut,
        bool lock
    ) external payable nonReentrant returns (address token) {
        token = _create(name_, symbol_, meta_, supply, duration);
        uint256 got = _swapIn(msg.value, minQuoteOut);
        uint256 used = _contribute(token, msg.sender, got, lock);
        if (used < got) _pay(msg.sender, got - used);
    }

    // ------------------------------------------------------------------ reserve

    /// Joins the reserve with SECT (needs an approval). Takes only what fits under the target and the
    /// wallet maximum. The contribution that reaches the target launches the coin.
    function contribute(address token, uint256 amount, bool lock) external nonReentrant returns (uint256 used) {
        _pull(msg.sender, amount);
        used = _contribute(token, msg.sender, amount, lock);
        if (used < amount) _pay(msg.sender, amount - used);
    }

    /// Joins the reserve with ETH: swaps it to SECT on the fixed route; SECT that does not fit is returned.
    function contributeWithETH(address token, uint256 minQuoteOut, bool lock) external payable nonReentrant returns (uint256 used) {
        uint256 got = _swapIn(msg.value, minQuoteOut);
        used = _contribute(token, msg.sender, got, lock);
        if (used < got) _pay(msg.sender, got - used);
    }

    /// Chooses the 30-day lock (and its bonus) for what this wallet has in the reserve. Before launch only.
    function lockSeat(address token) external nonReentrant {
        Launch storage l = launches[token];
        Seat storage s = seats[token][msg.sender];
        require(l.launchedAt == 0 && block.timestamp < l.deadline, "SF: reserve closed");
        require(s.amount > 0 && !s.locked, "SF: nothing to lock");
        s.locked = true;
        l.lockedRaised += s.amount;
        emit Locked(token, msg.sender);
    }

    /// Takes back everything this wallet put in the reserve: any time before launch, including after
    /// a deadline that passed without reaching the target. No fee.
    function withdraw(address token) external nonReentrant {
        Launch storage l = launches[token];
        Seat storage s = seats[token][msg.sender];
        require(l.launchedAt == 0, "SF: launched");
        uint256 amount = s.amount;
        require(amount > 0, "SF: nothing to withdraw");
        l.raised -= amount;
        if (s.locked) l.lockedRaised -= amount;
        l.contributors -= 1;
        s.amount = 0;
        s.locked = false;
        emit Withdrawn(token, msg.sender, amount, l.raised);
        _pay(msg.sender, amount);
    }

    // ------------------------------------------------------------------ after launch

    /// Tokens this wallet can take now.
    function claimable(address token, address account) public view returns (uint256) {
        Launch storage l = launches[token];
        Seat storage s = seats[token][account];
        if (l.launchedAt == 0 || s.amount == 0) return 0;
        uint256 base = (s.amount * reserveTokens(l.supply)) / l.target;
        uint256 vested;
        if (s.locked) {
            vested = block.timestamp >= uint256(l.launchedAt) + LOCK_PERIOD ? base + (base * l.bonusRate) / 1e18 : 0;
        } else {
            uint256 elapsed = block.timestamp - l.launchedAt;
            if (elapsed > VEST_PERIOD) elapsed = VEST_PERIOD;
            uint256 instant = (base * INSTANT_BPS) / 10_000;
            vested = instant + ((base - instant) * elapsed) / VEST_PERIOD;
        }
        return vested - s.claimed;
    }

    function claim(address token) external nonReentrant {
        uint256 amount = claimable(token, msg.sender);
        require(amount > 0, "SF: nothing to claim");
        seats[token][msg.sender].claimed += amount;
        require(SectoraFairToken(token).transfer(msg.sender, amount), "SF: transfer");
        emit Claimed(token, msg.sender, amount);
    }

    function creatorClaimable(address token) public view returns (uint256) {
        Launch storage l = launches[token];
        if (l.launchedAt == 0) return 0;
        uint256 total = (l.supply * CREATOR_BPS) / 10_000;
        uint256 elapsed = block.timestamp - l.launchedAt;
        uint256 vested = elapsed >= CREATOR_VEST ? total : (total * elapsed) / CREATOR_VEST;
        return vested - l.creatorClaimed;
    }

    function claimCreatorTokens(address token) external nonReentrant {
        Launch storage l = launches[token];
        require(msg.sender == l.creator, "SF: only creator");
        uint256 amount = creatorClaimable(token);
        require(amount > 0, "SF: nothing to claim");
        l.creatorClaimed += amount;
        require(SectoraFairToken(token).transfer(msg.sender, amount), "SF: transfer");
        emit CreatorTokensClaimed(token, msg.sender, amount);
    }

    function claimCreatorFees() external nonReentrant {
        uint256 amount = creatorFees[msg.sender];
        require(amount > 0, "SF: nothing to claim");
        creatorFees[msg.sender] = 0;
        emit CreatorFeesClaimed(msg.sender, amount);
        _pay(msg.sender, amount);
    }

    /// Anyone can run it: the burn share goes to 0x…dEaD, the rest to the fee recipient.
    function withdrawProtocolFees() external nonReentrant {
        uint256 amount = protocolFees;
        require(amount > 0, "SF: nothing to withdraw");
        protocolFees = 0;
        uint256 burn = (amount * burnShareBps) / 10_000;
        uint256 paid = amount - burn;
        totalBurned += burn;
        emit ProtocolFeesWithdrawn(feeRecipient, paid, burn);
        if (burn > 0) _pay(DEAD, burn);
        if (paid > 0) _pay(feeRecipient, paid);
    }

    function setFeeRecipient(address recipient) external {
        require(msg.sender == owner, "SF: only owner");
        require(recipient != address(0), "SF: zero address");
        feeRecipient = recipient;
        emit FeeRecipientChanged(recipient);
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "SF: only owner");
        require(newOwner != address(0), "SF: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ------------------------------------------------------------------ views

    function reserveTokens(uint256 supply) public pure returns (uint256) {
        uint256 rest = supply - (supply * (CREATOR_BPS + BONUS_BPS)) / 10_000;
        return (rest * RESERVE_PARTS) / (RESERVE_PARTS + POOL_PARTS);
    }

    function poolTokens(uint256 supply) public pure returns (uint256) {
        uint256 rest = supply - (supply * (CREATOR_BPS + BONUS_BPS)) / 10_000;
        return rest - (rest * RESERVE_PARTS) / (RESERVE_PARTS + POOL_PARTS);
    }

    struct CoinView {
        address token;
        string name;
        string symbol;
        string meta;
        address creator;
        uint64 createdAt;
        uint64 deadline;
        uint64 launchedAt;
        uint32 contributors;
        address pair;
        uint256 supply;
        uint256 target;
        uint256 cap;
        uint256 raised;
        uint256 lockedRaised;
        uint256 bonusRate;
        uint256 creatorClaimed;
    }

    function coinsCount() external view returns (uint256) {
        return allTokens.length;
    }

    function coinView(address token) public view returns (CoinView memory v) {
        Launch storage l = launches[token];
        v.token = token;
        if (l.creator == address(0)) return v;
        v.name = SectoraFairToken(token).name();
        v.symbol = SectoraFairToken(token).symbol();
        v.meta = meta[token];
        v.creator = l.creator;
        v.createdAt = l.createdAt;
        v.deadline = l.deadline;
        v.launchedAt = l.launchedAt;
        v.contributors = l.contributors;
        v.pair = l.pair;
        v.supply = l.supply;
        v.target = l.target;
        v.cap = l.cap;
        v.raised = l.raised;
        v.lockedRaised = l.lockedRaised;
        v.bonusRate = l.bonusRate;
        v.creatorClaimed = l.creatorClaimed;
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

    function seatView(address token, address account) external view returns (uint256 amount, bool locked, uint256 claimed, uint256 claimableNow) {
        Seat storage s = seats[token][account];
        return (s.amount, s.locked, s.claimed, claimable(token, account));
    }

    // ------------------------------------------------------------------ dollar sizing

    /// Reserve target and per-wallet maximum (in SECT) for a coin created now.
    function sizesNow() public view returns (uint256 target, uint256 cap) {
        uint256 price = quoteUsdPrice();
        if (price == 0) return (targetFallback, capFallback);
        target = _clamp((targetUsd * quoteUnit) / price, targetFallback);
        cap = _clamp((capUsd * quoteUnit) / price, capFallback);
        if (cap > target) cap = target;
    }

    /// Dollars (18 decimals) per whole SECT, from the 30-minute average tick of the oracle pool.
    /// 0 when it cannot answer (not enough price history).
    function quoteUsdPrice() public view returns (uint256) {
        uint32[] memory ago = new uint32[](2);
        ago[0] = TWAP_WINDOW;
        try IV3PoolOracle(oraclePool).observe(ago) returns (int56[] memory cum, uint160[] memory) {
            if (cum.length != 2) return 0;
            int256 d = int256(cum[1]) - int256(cum[0]);
            int256 w = int256(uint256(TWAP_WINDOW));
            int256 t = d / w;
            if (d < 0 && d % w != 0) t--; // round toward negative infinity, like Uniswap's OracleLibrary
            int256 e = quoteIsToken0 ? t : -t;
            if (e > 400_000 || e < -400_000) return 0;
            uint256 r = _pow10001(uint256(e >= 0 ? e : -e));
            if (e >= 0) return (r * quoteUnit) / usdUnit;
            return (1e36 * quoteUnit) / (r * usdUnit);
        } catch {
            return 0;
        }
    }

    // ------------------------------------------------------------------ internal

    function _create(string calldata name_, string calldata symbol_, string calldata meta_, uint256 supply, uint256 duration)
        private
        returns (address token)
    {
        uint256 nb = bytes(name_).length;
        uint256 sb = bytes(symbol_).length;
        require(nb > 0 && nb <= MAX_NAME, "SF: name length");
        require(sb > 0 && sb <= MAX_SYMBOL, "SF: symbol length");
        require(bytes(meta_).length <= MAX_META, "SF: meta too long");
        require(supply >= MIN_SUPPLY && supply <= MAX_SUPPLY && supply % 1 ether == 0, "SF: supply");
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, "SF: duration");

        token = _clone(tokenImplementation);
        SectoraFairToken(token).initialize(name_, symbol_, supply);
        (uint256 target, uint256 cap) = sizesNow();
        Launch storage l = launches[token];
        l.creator = msg.sender;
        l.createdAt = uint64(block.timestamp);
        l.deadline = uint64(block.timestamp + duration);
        l.supply = supply;
        l.target = target;
        l.cap = cap;
        meta[token] = meta_;
        allTokens.push(token);
        emit CoinCreated(token, msg.sender, supply, target, cap, l.deadline);
    }

    function _contribute(address token, address account, uint256 amount, bool lock) private returns (uint256 used) {
        Launch storage l = launches[token];
        require(l.creator != address(0), "SF: unknown coin");
        require(l.launchedAt == 0 && block.timestamp < l.deadline, "SF: reserve closed");
        Seat storage s = seats[token][account];
        uint256 room = l.target - l.raised;
        uint256 capLeft = l.cap - s.amount;
        used = amount;
        if (used > room) used = room;
        if (used > capLeft) used = capLeft;
        require(used > 0, "SF: wallet maximum reached");
        if (s.amount == 0) l.contributors += 1;
        if (lock && !s.locked) {
            s.locked = true;
            l.lockedRaised += s.amount;
            emit Locked(token, account);
        }
        s.amount += used;
        if (s.locked) l.lockedRaised += used;
        l.raised += used;
        emit Contributed(token, account, used, s.locked, l.raised);
        if (l.raised == l.target) _launch(token, l);
    }

    function _launch(address token, Launch storage l) private {
        l.launchedAt = uint64(block.timestamp);
        uint256 feeC = (l.raised * FEE_CREATOR_BPS) / 10_000;
        uint256 feeP = (l.raised * FEE_PLATFORM_BPS) / 10_000;
        creatorFees[l.creator] += feeC;
        protocolFees += feeP;
        uint256 poolQuote = l.raised - feeC - feeP;
        uint256 poolAmt = poolTokens(l.supply);

        // bonus for 30-day lockers: up to +25 %, what nobody earns is burned now
        uint256 bonusTotal = (l.supply * BONUS_BPS) / 10_000;
        uint256 lockedBase = (l.lockedRaised * reserveTokens(l.supply)) / l.target;
        uint256 rate;
        if (lockedBase > 0) {
            rate = (bonusTotal * 1e18) / lockedBase;
            if (rate > MAX_LOCK_BONUS) rate = MAX_LOCK_BONUS;
        }
        l.bonusRate = rate;
        uint256 bonusBurned = bonusTotal - (lockedBase * rate) / 1e18;

        address pair = IV2Factory(dexFactory).getPair(token, quote);
        if (pair == address(0)) pair = IV2Factory(dexFactory).createPair(token, quote);
        l.pair = pair;
        // Fund the pool directly and mint once. Nobody else holds the coin before launch, so the
        // pool cannot be seeded or skewed with it; SECT sent to the pair in advance only adds liquidity.
        _pay(pair, poolQuote);
        require(SectoraFairToken(token).transfer(pair, poolAmt), "SF: token transfer");
        uint256 liquidity = IV2Pair(pair).mint(DEAD);
        if (bonusBurned > 0) require(SectoraFairToken(token).transfer(DEAD, bonusBurned), "SF: token transfer");
        emit Launched(token, pair, poolQuote, poolAmt, liquidity, rate, bonusBurned);
    }

    function _swapIn(uint256 ethIn, uint256 minQuoteOut) private returns (uint256 got) {
        require(ethIn > 0, "SF: zero amount");
        uint256 before = IERC20Min(quote).balanceOf(address(this));
        IV3SwapRouter(swapRouter).exactInput{value: ethIn}(
            IV3SwapRouter.ExactInputParams({path: swapPath, recipient: address(this), amountIn: ethIn, amountOutMinimum: minQuoteOut})
        );
        got = IERC20Min(quote).balanceOf(address(this)) - before;
        require(got >= minQuoteOut && got > 0, "SF: swap slippage");
    }

    /// Pulls SECT and rejects tokens that take a fee on transfer.
    function _pull(address from, uint256 amount) private {
        require(amount > 0, "SF: zero amount");
        uint256 before = IERC20Min(quote).balanceOf(address(this));
        _call(quote, abi.encodeWithSelector(IERC20Min.transferFrom.selector, from, address(this), amount));
        require(IERC20Min(quote).balanceOf(address(this)) - before == amount, "SF: quote transfer");
    }

    function _pay(address to, uint256 amount) private {
        _call(quote, abi.encodeWithSelector(IERC20Min.transfer.selector, to, amount));
    }

    function _call(address target, bytes memory data) private {
        (bool ok, bytes memory ret) = target.call(data);
        require(ok && (ret.length == 0 || abi.decode(ret, (bool))), "SF: quote transfer failed");
    }

    function _clamp(uint256 v, uint256 ref) private pure returns (uint256) {
        uint256 lo = ref / ORACLE_RANGE;
        uint256 hi = ref * ORACLE_RANGE;
        if (v < lo) return lo;
        if (v > hi) return hi;
        return v;
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

    function _pathToken(bytes memory path, uint256 at) private pure returns (address a) {
        assembly {
            a := shr(96, mload(add(add(path, 32), at)))
        }
    }

    function _clone(address impl) private returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, impl))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            instance := create(0, ptr, 0x37)
        }
        require(instance != address(0), "SF: clone failed");
    }

    /// ETH is only accepted through the swap functions.
    receive() external payable {
        revert("SF: no direct payments");
    }
}
