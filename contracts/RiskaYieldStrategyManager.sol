// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IRiskaYieldAdapter} from "./interfaces/IRiskaYieldAdapter.sol";
import {RiskaPremiumVault} from "./RiskaPremiumVault.sol";

contract RiskaYieldStrategyManager is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Strategy {
        IRiskaYieldAdapter adapter;
        string name;
        string metadataURI;
        uint256 depositCap;
        uint256 totalCostBasis;
        uint256 totalShares;
        bool active;
        bool depositsEnabled;
    }

    IERC20 public immutable paymentToken;
    RiskaPremiumVault public immutable premiumVault;
    address public policyManager;

    Strategy[] private strategies;

    event PolicyManagerUpdated(address indexed policyManager);
    event StrategyAdded(uint256 indexed strategyId, address indexed adapter, string name, uint256 depositCap);
    event StrategyStatusUpdated(uint256 indexed strategyId, bool active, bool depositsEnabled);
    event StrategyCapUpdated(uint256 indexed strategyId, uint256 depositCap);
    event StrategyMetadataUpdated(uint256 indexed strategyId, string name, string metadataURI);
    event PolicyYieldDeposited(uint256 indexed policyId, uint256 indexed strategyId, uint256 assets, uint256 shares);
    event PolicyYieldWithdrawn(
        uint256 indexed policyId,
        uint256 indexed strategyId,
        uint256 shares,
        uint256 costBasis,
        uint256 assets,
        uint256 protocolFee,
        uint256 policyGain,
        uint256 policyLoss
    );

    modifier onlyPolicyManager() {
        require(msg.sender == policyManager, "ONLY_POLICY_MANAGER");
        _;
    }

    constructor(IERC20 paymentToken_, RiskaPremiumVault premiumVault_) Ownable(msg.sender) {
        require(address(paymentToken_) != address(0), "INVALID_TOKEN");
        require(address(premiumVault_) != address(0), "INVALID_VAULT");

        paymentToken = paymentToken_;
        premiumVault = premiumVault_;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setPolicyManager(address nextPolicyManager) external onlyOwner {
        require(nextPolicyManager != address(0), "INVALID_POLICY_MANAGER");
        policyManager = nextPolicyManager;
        emit PolicyManagerUpdated(nextPolicyManager);
    }

    function addStrategy(
        IRiskaYieldAdapter adapter,
        string calldata name,
        string calldata metadataURI,
        uint256 depositCap
    ) external onlyOwner returns (uint256 strategyId) {
        require(address(adapter) != address(0), "INVALID_ADAPTER");
        require(adapter.asset() == address(paymentToken), "ASSET_MISMATCH");

        strategyId = strategies.length;
        strategies.push(
            Strategy({
                adapter: adapter,
                name: name,
                metadataURI: metadataURI,
                depositCap: depositCap,
                totalCostBasis: 0,
                totalShares: 0,
                active: true,
                depositsEnabled: true
            })
        );

        emit StrategyAdded(strategyId, address(adapter), name, depositCap);
    }

    function setStrategyStatus(uint256 strategyId, bool active, bool depositsEnabled) external onlyOwner {
        Strategy storage strategy = _strategy(strategyId);
        strategy.active = active;
        strategy.depositsEnabled = depositsEnabled;

        emit StrategyStatusUpdated(strategyId, active, depositsEnabled);
    }

    function setStrategyCap(uint256 strategyId, uint256 depositCap) external onlyOwner {
        Strategy storage strategy = _strategy(strategyId);
        require(depositCap == 0 || depositCap >= strategy.totalCostBasis, "CAP_BELOW_DEPOSITS");
        strategy.depositCap = depositCap;

        emit StrategyCapUpdated(strategyId, depositCap);
    }

    function setStrategyMetadata(
        uint256 strategyId,
        string calldata name,
        string calldata metadataURI
    ) external onlyOwner {
        Strategy storage strategy = _strategy(strategyId);
        strategy.name = name;
        strategy.metadataURI = metadataURI;

        emit StrategyMetadataUpdated(strategyId, name, metadataURI);
    }

    function depositPolicyPrincipal(
        uint256 policyId,
        uint256 strategyId,
        uint256 assets,
        uint256 minSharesOut
    ) external onlyPolicyManager whenNotPaused nonReentrant returns (uint256 shares) {
        require(policyId != 0, "INVALID_POLICY");
        require(assets > 0, "INVALID_AMOUNT");

        Strategy storage strategy = _strategy(strategyId);
        require(strategy.active, "STRATEGY_INACTIVE");
        require(strategy.depositsEnabled, "DEPOSITS_DISABLED");
        require(
            strategy.depositCap == 0 || strategy.totalCostBasis + assets <= strategy.depositCap,
            "STRATEGY_CAP_EXCEEDED"
        );

        premiumVault.transferPrincipalToYield(policyId, address(this), assets);
        paymentToken.forceApprove(address(strategy.adapter), assets);
        shares = strategy.adapter.deposit(assets);
        require(shares >= minSharesOut, "SLIPPAGE_SHARES");

        strategy.totalCostBasis += assets;
        strategy.totalShares += shares;

        emit PolicyYieldDeposited(policyId, strategyId, assets, shares);
    }

    function withdrawPolicyPrincipal(
        uint256 policyId,
        uint256 strategyId,
        uint256 shares,
        uint256 costBasis,
        uint256 minAssetsOut
    )
        external
        onlyPolicyManager
        whenNotPaused
        nonReentrant
        returns (uint256 assets, uint256 protocolFee, uint256 policyGain, uint256 policyLoss)
    {
        require(policyId != 0, "INVALID_POLICY");
        require(shares > 0, "INVALID_SHARES");
        require(costBasis > 0, "INVALID_COST_BASIS");

        Strategy storage strategy = _strategy(strategyId);
        require(strategy.active, "STRATEGY_INACTIVE");
        require(shares <= strategy.totalShares, "SHARES_EXCEED_STRATEGY");
        require(costBasis <= strategy.totalCostBasis, "COST_EXCEEDS_STRATEGY");

        assets = strategy.adapter.redeem(shares);
        require(assets >= minAssetsOut, "SLIPPAGE_ASSETS");

        paymentToken.forceApprove(address(premiumVault), assets);
        (protocolFee, policyGain, policyLoss) = premiumVault.receiveYieldReturn(policyId, costBasis, assets);

        strategy.totalCostBasis -= costBasis;
        strategy.totalShares -= shares;

        emit PolicyYieldWithdrawn(
            policyId,
            strategyId,
            shares,
            costBasis,
            assets,
            protocolFee,
            policyGain,
            policyLoss
        );
    }

    function strategyCount() external view returns (uint256) {
        return strategies.length;
    }

    function strategyAt(uint256 strategyId)
        external
        view
        returns (
            address adapter,
            string memory name,
            string memory metadataURI,
            uint256 depositCap,
            uint256 totalCostBasis,
            uint256 totalShares,
            bool active,
            bool depositsEnabled
        )
    {
        Strategy storage strategy = _strategy(strategyId);

        return (
            address(strategy.adapter),
            strategy.name,
            strategy.metadataURI,
            strategy.depositCap,
            strategy.totalCostBasis,
            strategy.totalShares,
            strategy.active,
            strategy.depositsEnabled
        );
    }

    function previewRedeem(uint256 strategyId, uint256 shares) external view returns (uint256 assets) {
        return _strategy(strategyId).adapter.previewRedeem(shares);
    }

    function _strategy(uint256 strategyId) private view returns (Strategy storage strategy) {
        require(strategyId < strategies.length, "UNKNOWN_STRATEGY");
        return strategies[strategyId];
    }
}
