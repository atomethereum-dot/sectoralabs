// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OFTAdapter } from "@layerzerolabs/oft-evm/contracts/OFTAdapter.sol";
import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { EnforcedOptionParam } from "@layerzerolabs/oapp-evm/contracts/oapp/interfaces/IOAppOptionsType3.sol";
import { SetConfigParam } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/IMessageLibManager.sol";

/// @notice Everything that links one route, in one transaction (see configureRoute).
struct Route {
    uint32 eid;                         // the other network (LayerZero endpoint id)
    bytes32 peer;                       // the bridge contract on that network
    EnforcedOptionParam[] options;      // gas reserved for the delivery
    uint256 limit;                      // inbound limit (tokens per window)
    uint256 window;                     // seconds
    address sendLib;                    // pinned send library (0 = leave as is)
    address receiveLib;                 // pinned receive library (0 = leave as is)
    SetConfigParam[] sendConfig;        // pinned verifiers and executor for sending
    SetConfigParam[] receiveConfig;     // pinned verifiers for receiving
}

/// @title InboundLimit
/// @notice Caps how much SECT can arrive from each network. The capacity refills linearly over
/// `window` seconds. A delivery above the free capacity reverts and LayerZero keeps the message,
/// so it can be retried once there is room again: nothing is lost, it only waits.
/// A route with no limit set (limit 0) receives nothing until the owner sets one.
abstract contract InboundLimit is Ownable {
    struct Limit {
        uint128 limit;      // tokens (local decimals) that can arrive per window
        uint64 window;      // seconds
        uint64 lastUpdate;  // timestamp of the last change
        uint128 inFlight;   // tokens counted in the current window
    }

    mapping(uint32 => Limit) public inboundLimits;

    event InboundLimitSet(uint32 indexed srcEid, uint256 limit, uint256 window);
    error InboundLimitExceeded(uint32 srcEid, uint256 amount, uint256 available);

    function setInboundLimit(uint32 srcEid, uint256 limit, uint256 window) public onlyOwner {
        require(window > 0 && window <= 30 days, "SB: window");
        require(limit <= type(uint128).max, "SB: limit");
        Limit storage l = inboundLimits[srcEid];
        l.inFlight = uint128(_inFlightNow(l)); // settle what is counted so far at the old rate
        l.lastUpdate = uint64(block.timestamp);
        l.limit = uint128(limit);
        l.window = uint64(window);
        emit InboundLimitSet(srcEid, limit, window);
    }

    /// @notice How much can arrive from `srcEid` right now.
    function inboundAvailable(uint32 srcEid) public view returns (uint256) {
        Limit storage l = inboundLimits[srcEid];
        uint256 f = _inFlightNow(l);
        return f >= l.limit ? 0 : l.limit - f;
    }

    function _inFlightNow(Limit storage l) private view returns (uint256) {
        if (l.window == 0) return l.inFlight;
        uint256 refill = ((block.timestamp - l.lastUpdate) * l.limit) / l.window;
        return refill >= l.inFlight ? 0 : l.inFlight - refill;
    }

    function _useInbound(uint32 srcEid, uint256 amount) internal {
        Limit storage l = inboundLimits[srcEid];
        uint256 f = _inFlightNow(l);
        if (f + amount > l.limit) revert InboundLimitExceeded(srcEid, amount, f >= l.limit ? 0 : l.limit - f);
        l.inFlight = uint128(f + amount);
        l.lastUpdate = uint64(block.timestamp);
    }
}

/// @title Sectora SECT bridge — Ethereum side
/// @notice Locks the existing SECT (0x8C99…13db) when it leaves Ethereum and releases it when it
/// comes back. SECT itself is not changed in any way. Standard LayerZero V2 OFT adapter.
contract SectoraOFTAdapter is OFTAdapter, InboundLimit {
    constructor(address token_, address lzEndpoint_, address owner_) OFTAdapter(token_, lzEndpoint_, owner_) Ownable(owner_) {}

    /// @notice Links a route in one transaction: peer, delivery gas, inbound limit, and the security
    /// (message libraries, verifiers, executor) pinned to explicit values so that later changes to
    /// LayerZero's defaults do not change this bridge. Owner only.
    function configureRoute(Route calldata r) external onlyOwner {
        setPeer(r.eid, r.peer);
        setEnforcedOptions(r.options);
        setInboundLimit(r.eid, r.limit, r.window);
        if (r.sendLib != address(0)) endpoint.setSendLibrary(address(this), r.eid, r.sendLib);
        if (r.receiveLib != address(0)) endpoint.setReceiveLibrary(address(this), r.eid, r.receiveLib, 0);
        if (r.sendConfig.length > 0) endpoint.setConfig(address(this), r.sendLib, r.sendConfig);
        if (r.receiveConfig.length > 0) endpoint.setConfig(address(this), r.receiveLib, r.receiveConfig);
    }

    /// @notice Hands the bridge over (for example to a multisig): ownership and the LayerZero delegate.
    function handOver(address newOwner) external onlyOwner {
        setDelegate(newOwner);
        transferOwnership(newOwner);
    }

    function _credit(address to, uint256 amountLD, uint32 srcEid) internal override returns (uint256) {
        _useInbound(srcEid, amountLD);
        return super._credit(to, amountLD, srcEid);
    }
}

/// @title Sectora SECT bridge — BNB Chain side (and other EVM networks)
/// @notice SECT on this network. It starts with zero supply: tokens are only created when the same
/// amount is locked on Ethereum, and destroyed when they go back. There is no other way to mint.
contract SectoraOFT is OFT, InboundLimit {
    constructor(address lzEndpoint_, address owner_) OFT("Sectora", "SECT", lzEndpoint_, owner_) Ownable(owner_) {}

    /// @notice Links a route in one transaction: peer, delivery gas, inbound limit, and the security
    /// (message libraries, verifiers, executor) pinned to explicit values so that later changes to
    /// LayerZero's defaults do not change this bridge. Owner only.
    function configureRoute(Route calldata r) external onlyOwner {
        setPeer(r.eid, r.peer);
        setEnforcedOptions(r.options);
        setInboundLimit(r.eid, r.limit, r.window);
        if (r.sendLib != address(0)) endpoint.setSendLibrary(address(this), r.eid, r.sendLib);
        if (r.receiveLib != address(0)) endpoint.setReceiveLibrary(address(this), r.eid, r.receiveLib, 0);
        if (r.sendConfig.length > 0) endpoint.setConfig(address(this), r.sendLib, r.sendConfig);
        if (r.receiveConfig.length > 0) endpoint.setConfig(address(this), r.receiveLib, r.receiveConfig);
    }

    /// @notice Hands the bridge over (for example to a multisig): ownership and the LayerZero delegate.
    function handOver(address newOwner) external onlyOwner {
        setDelegate(newOwner);
        transferOwnership(newOwner);
    }

    function _credit(address to, uint256 amountLD, uint32 srcEid) internal override returns (uint256) {
        _useInbound(srcEid, amountLD);
        return super._credit(to, amountLD, srcEid);
    }
}
