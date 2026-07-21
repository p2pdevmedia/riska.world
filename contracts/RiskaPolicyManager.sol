// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {RiskaBeneficiaryRegistry} from "./RiskaBeneficiaryRegistry.sol";
import {RiskaPolicyMath} from "./RiskaPolicyMath.sol";
import {RiskaPremiumVault} from "./RiskaPremiumVault.sol";
import {RiskaYieldStrategyManager} from "./RiskaYieldStrategyManager.sol";

contract RiskaPolicyManager is Ownable, Pausable, ReentrancyGuard, EIP712 {
    bytes32 private constant POLICY_HUMAN_AUTHORIZATION_TYPEHASH = keccak256(
        "PolicyHumanAuthorization(address holder,bytes32 nullifierHash,uint256 deadline)"
    );
    enum PolicyStatus {
        None,
        Active,
        PayoutActive,
        DeathSettled,
        Closed
    }

    struct Policy {
        address holder;
        bytes32 nullifierHash;
        bytes32 termsHash;
        uint16 payoutsMade;
        uint256 openedAt;
        uint256 lastHolderInteractionAt;
        uint256 nextPayoutAt;
        uint256 remainingMinimumPrincipal;
        uint256 remainingExtraPrincipal;
        uint256 monthlyPayoutAmount;
        PolicyStatus status;
    }

    struct DeathNotice {
        address reporter;
        uint256 reportedAt;
        bool active;
    }

    struct YieldPosition {
        uint256 shares;
        uint256 costBasis;
    }

    uint256 public constant PAYMENT_PERIOD = 30 days;
    uint256 public constant DEATH_REPORT_DELAY = 12 * 30 days;
    uint256 public constant MAX_AUXILIARY_TOKENS = 16;
    uint256 public constant MAX_YIELD_STRATEGIES_PER_POLICY = 16;

    RiskaBeneficiaryRegistry public immutable beneficiaryRegistry;
    RiskaPremiumVault public immutable premiumVault;
    RiskaYieldStrategyManager public yieldStrategyManager;
    address public policyHumanVerifier;

    uint256 public nextPolicyId = 1;

    mapping(uint256 => Policy) public policies;
    mapping(address => uint256) public policyOf;
    mapping(bytes32 => uint256) public policyOfNullifierHash;
    mapping(uint256 => DeathNotice) public deathNotices;
    mapping(uint256 => mapping(address => uint256)) public auxiliaryTokenBalances;
    mapping(uint256 => address[]) private auxiliaryTokens;
    mapping(uint256 => mapping(address => bool)) private hasAuxiliaryToken;
    mapping(uint256 => mapping(uint256 => YieldPosition)) public yieldPositions;
    mapping(uint256 => uint256[]) private policyYieldStrategies;
    mapping(uint256 => mapping(uint256 => bool)) private hasYieldStrategy;
    mapping(uint256 => uint256) public yieldPrincipalAllocated;

    event YieldStrategyManagerUpdated(address indexed yieldStrategyManager);
    event PolicyHumanVerifierUpdated(address indexed previousVerifier, address indexed nextVerifier);
    event PolicyOpened(uint256 indexed policyId, address indexed holder, bytes32 indexed nullifierHash, bytes32 termsHash);
    event PolicyDeposit(
        uint256 indexed policyId,
        address indexed holder,
        uint256 amount,
        uint256 minimumPrincipalAdded,
        uint256 extraPrincipalAdded
    );
    event PolicyStatusUpdated(uint256 indexed policyId, PolicyStatus status);
    event BeneficiariesUpdated(uint256 indexed policyId);
    event PayoutActivated(uint256 indexed policyId, uint256 monthlyPayoutAmount, uint256 totalPrincipal);
    event PayoutRescheduled(uint256 indexed policyId, uint256 monthlyPayoutAmount, uint256 totalPrincipal, uint256 remainingMonths);
    event MonthlyClaimed(uint256 indexed policyId, uint256 amount, uint16 payoutsMade);
    event ClaimAll(uint256 indexed policyId, uint256 payout, uint256 retainedFee);
    event ExtraWithdrawn(uint256 indexed policyId, address indexed holder, uint256 amount);
    event AuxiliaryTokenDeposited(uint256 indexed policyId, address indexed holder, address indexed token, uint256 amount);
    event AuxiliaryTokenWithdrawn(uint256 indexed policyId, address indexed holder, address indexed token, uint256 amount);
    event AuxiliaryTokenBeneficiariesPaid(uint256 indexed policyId, address indexed token, uint256 amount);
    event Heartbeat(uint256 indexed policyId, address indexed holder, uint256 timestamp);
    event DeathReported(uint256 indexed policyId, address indexed reporter, uint256 claimableAt);
    event DeathReportCancelled(uint256 indexed policyId);
    event DeathClaimed(uint256 indexed policyId, uint256 payout, uint256 retainedFee);
    event PolicyYieldDeposited(
        uint256 indexed policyId,
        uint256 indexed strategyId,
        uint256 assets,
        uint256 shares
    );
    event PolicyYieldWithdrawn(
        uint256 indexed policyId,
        uint256 indexed strategyId,
        uint256 shares,
        uint256 costBasis,
        uint256 returnedAssets,
        uint256 protocolFee,
        uint256 policyGain,
        uint256 policyLoss
    );

    constructor(
        RiskaBeneficiaryRegistry beneficiaryRegistry_,
        RiskaPremiumVault premiumVault_,
        address policyHumanVerifier_
    ) Ownable(msg.sender) EIP712("RiskaPolicyManager", "1") {
        require(address(beneficiaryRegistry_) != address(0), "INVALID_REGISTRY");
        require(address(premiumVault_) != address(0), "INVALID_VAULT");
        require(policyHumanVerifier_ != address(0), "INVALID_HUMAN_VERIFIER");

        beneficiaryRegistry = beneficiaryRegistry_;
        premiumVault = premiumVault_;
        policyHumanVerifier = policyHumanVerifier_;
        emit PolicyHumanVerifierUpdated(address(0), policyHumanVerifier_);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setYieldStrategyManager(RiskaYieldStrategyManager nextYieldStrategyManager) external onlyOwner {
        require(address(nextYieldStrategyManager) != address(0), "INVALID_YIELD_MANAGER");
        yieldStrategyManager = nextYieldStrategyManager;
        emit YieldStrategyManagerUpdated(address(nextYieldStrategyManager));
    }

    function setPolicyHumanVerifier(address nextPolicyHumanVerifier) external onlyOwner {
        require(nextPolicyHumanVerifier != address(0), "INVALID_HUMAN_VERIFIER");

        address previousVerifier = policyHumanVerifier;
        policyHumanVerifier = nextPolicyHumanVerifier;

        emit PolicyHumanVerifierUpdated(previousVerifier, nextPolicyHumanVerifier);
    }

    function openPolicy(
        address[] memory beneficiaries,
        uint16[] memory sharesBps,
        bytes32 termsHash,
        bytes32 nullifierHash,
        uint256 deadline,
        bytes memory authorization
    ) external whenNotPaused nonReentrant returns (uint256 policyId) {
        require(policyOf[msg.sender] == 0, "POLICY_EXISTS");
        require(termsHash != bytes32(0), "INVALID_TERMS");
        require(nullifierHash != bytes32(0), "INVALID_NULLIFIER");
        require(policyOfNullifierHash[nullifierHash] == 0, "NULLIFIER_ALREADY_USED");
        require(block.timestamp <= deadline, "HUMAN_AUTHORIZATION_EXPIRED");
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            POLICY_HUMAN_AUTHORIZATION_TYPEHASH, msg.sender, nullifierHash, deadline
        )));
        require(ECDSA.recover(digest, authorization) == policyHumanVerifier, "INVALID_HUMAN_AUTHORIZATION");

        policyId = nextPolicyId++;
        policyOf[msg.sender] = policyId;
        policyOfNullifierHash[nullifierHash] = policyId;

        policies[policyId] = Policy({
            holder: msg.sender,
            nullifierHash: nullifierHash,
            termsHash: termsHash,
            payoutsMade: 0,
            openedAt: block.timestamp,
            lastHolderInteractionAt: block.timestamp,
            nextPayoutAt: 0,
            remainingMinimumPrincipal: 0,
            remainingExtraPrincipal: 0,
            monthlyPayoutAmount: 0,
            status: PolicyStatus.Active
        });

        beneficiaryRegistry.setBeneficiaries(policyId, beneficiaries, sharesBps);
        _collectAndAllocateDeposit(policyId, RiskaPolicyMath.MINIMUM_MONTHLY_UNIT);

        emit PolicyOpened(policyId, msg.sender, nullifierHash, termsHash);
    }

    function deposit(uint256 policyId, uint256 amount) external whenNotPaused nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.Active, "DEPOSITS_CLOSED");
        require(amount > 0, "INVALID_AMOUNT");

        _recordHolderInteraction(policyId, policy);
        _collectAndAllocateDeposit(policyId, amount);
    }

    function updateBeneficiaries(
        uint256 policyId,
        address[] memory beneficiaries,
        uint16[] memory sharesBps
    ) external whenNotPaused {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.Active || policy.status == PolicyStatus.PayoutActive, "POLICY_CLOSED");

        _recordHolderInteraction(policyId, policy);
        beneficiaryRegistry.setBeneficiaries(policyId, beneficiaries, sharesBps);

        emit BeneficiariesUpdated(policyId);
    }

    function activatePayout(uint256 policyId) external whenNotPaused {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.Active, "INVALID_STATUS");
        require(
            policy.remainingMinimumPrincipal == RiskaPolicyMath.MINIMUM_POLICY_PRINCIPAL,
            "MINIMUM_NOT_FUNDED"
        );
        require(!hasOpenYieldPositions(policyId), "OPEN_YIELD_POSITION");

        uint256 totalBalance = _totalPrincipal(policy);
        uint256 monthlyAmount = RiskaPolicyMath.monthlyPayout(totalBalance);
        require(monthlyAmount > 0, "INVALID_PAYOUT");

        _recordHolderInteraction(policyId, policy);

        policy.status = PolicyStatus.PayoutActive;
        policy.monthlyPayoutAmount = monthlyAmount;
        policy.nextPayoutAt = block.timestamp;

        emit PayoutActivated(policyId, monthlyAmount, totalBalance);
        emit PolicyStatusUpdated(policyId, PolicyStatus.PayoutActive);
    }

    function claimMonthly(uint256 policyId) external whenNotPaused nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.PayoutActive, "NOT_IN_PAYOUT");
        require(block.timestamp >= policy.nextPayoutAt, "PAYOUT_NOT_READY");
        require(!hasOpenYieldPositions(policyId), "OPEN_YIELD_POSITION");

        uint256 amount = policy.monthlyPayoutAmount;
        uint256 totalBalance = _totalPrincipal(policy);
        bool finalPayout = policy.payoutsMade + 1 >= RiskaPolicyMath.PAYOUT_MONTHS || amount >= totalBalance;

        if (finalPayout) {
            amount = totalBalance;
        }

        _recordHolderInteraction(policyId, policy);
        _drawdown(policy, amount);
        policy.payoutsMade += 1;
        uint16 payoutsMade = policy.payoutsMade;

        if (finalPayout || _totalPrincipal(policy) == 0) {
            _resetPayout(policy);
            emit PolicyStatusUpdated(policyId, PolicyStatus.Active);
        } else {
            policy.nextPayoutAt += PAYMENT_PERIOD;
        }

        premiumVault.payHolder(policyId, policy.holder, amount);

        emit MonthlyClaimed(policyId, amount, payoutsMade);
    }

    function claimAll(uint256 policyId) external whenNotPaused nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.Active || policy.status == PolicyStatus.PayoutActive, "POLICY_CLOSED");
        require(
            policy.status == PolicyStatus.PayoutActive ||
                policy.remainingMinimumPrincipal == RiskaPolicyMath.MINIMUM_POLICY_PRINCIPAL,
            "MINIMUM_NOT_FUNDED"
        );
        require(!hasOpenYieldPositions(policyId), "OPEN_YIELD_POSITION");

        uint256 remainingMinimumPrincipal = policy.remainingMinimumPrincipal;
        uint256 remainingExtraPrincipal = policy.remainingExtraPrincipal;
        uint256 releasedPrincipal = remainingMinimumPrincipal + remainingExtraPrincipal;
        require(releasedPrincipal > 0, "NO_PRINCIPAL");

        (uint256 payout, uint256 retainedFee) = RiskaPolicyMath.minimumFeePayout(
            remainingMinimumPrincipal,
            remainingExtraPrincipal
        );

        _recordHolderInteraction(policyId, policy);

        policy.remainingMinimumPrincipal = 0;
        policy.remainingExtraPrincipal = 0;
        _resetPayout(policy);

        premiumVault.settleHolderClaimAll(policyId, policy.holder, releasedPrincipal, payout);

        emit ClaimAll(policyId, payout, retainedFee);
        emit PolicyStatusUpdated(policyId, PolicyStatus.Active);
    }

    function withdrawExtra(uint256 policyId, uint256 amount) external whenNotPaused nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.Active || policy.status == PolicyStatus.PayoutActive, "POLICY_CLOSED");
        require(amount > 0, "INVALID_AMOUNT");
        require(amount <= policy.remainingExtraPrincipal, "EXTRA_EXCEEDS_BALANCE");
        require(!hasOpenYieldPositions(policyId), "OPEN_YIELD_POSITION");

        _recordHolderInteraction(policyId, policy);

        policy.remainingExtraPrincipal -= amount;

        if (policy.status == PolicyStatus.PayoutActive) {
            _reschedulePayout(policyId, policy);
        }

        premiumVault.payHolder(policyId, policy.holder, amount);

        emit ExtraWithdrawn(policyId, policy.holder, amount);
    }

    function depositYield(uint256 policyId, uint256 strategyId, uint256 amount, uint256 minSharesOut)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 shares)
    {
        Policy storage policy = policies[policyId];
        require(address(yieldStrategyManager) != address(0), "YIELD_NOT_CONFIGURED");
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.Active, "YIELD_ONLY_ACCUMULATION");
        require(amount > 0, "INVALID_AMOUNT");
        require(amount <= _yieldAvailable(policyId, policy), "YIELD_EXCEEDS_AVAILABLE");

        _recordHolderInteraction(policyId, policy);

        shares = yieldStrategyManager.depositPolicyPrincipal(policyId, strategyId, amount, minSharesOut);
        require(shares > 0, "NO_SHARES");

        if (!hasYieldStrategy[policyId][strategyId]) {
            require(policyYieldStrategies[policyId].length < MAX_YIELD_STRATEGIES_PER_POLICY, "TOO_MANY_YIELD_STRATEGIES");
            hasYieldStrategy[policyId][strategyId] = true;
            policyYieldStrategies[policyId].push(strategyId);
        }

        YieldPosition storage position = yieldPositions[policyId][strategyId];
        position.shares += shares;
        position.costBasis += amount;
        yieldPrincipalAllocated[policyId] += amount;

        emit PolicyYieldDeposited(policyId, strategyId, amount, shares);
    }

    function withdrawYield(uint256 policyId, uint256 strategyId, uint256 shares, uint256 minAssetsOut)
        public
        whenNotPaused
        nonReentrant
        returns (uint256 returnedAssets)
    {
        Policy storage policy = policies[policyId];
        require(address(yieldStrategyManager) != address(0), "YIELD_NOT_CONFIGURED");
        require(policy.status == PolicyStatus.Active, "YIELD_ONLY_ACCUMULATION");

        bool holderAction = policy.holder == msg.sender;
        require(holderAction || _canSettleDeathYield(policyId, msg.sender, policy), "ONLY_HOLDER_OR_CLAIMABLE_BENEFICIARY");

        YieldPosition storage position = yieldPositions[policyId][strategyId];
        require(shares > 0, "INVALID_SHARES");
        require(shares <= position.shares, "SHARES_EXCEED_POSITION");

        uint256 costBasis = shares == position.shares
            ? position.costBasis
            : (position.costBasis * shares) / position.shares;
        require(costBasis > 0, "INVALID_COST_BASIS");

        if (holderAction) {
            _recordHolderInteraction(policyId, policy);
        }

        uint256 protocolFee;
        uint256 policyGain;
        uint256 policyLoss;
        (returnedAssets, protocolFee, policyGain, policyLoss) = yieldStrategyManager.withdrawPolicyPrincipal(
            policyId,
            strategyId,
            shares,
            costBasis,
            minAssetsOut
        );

        position.shares -= shares;
        position.costBasis -= costBasis;
        yieldPrincipalAllocated[policyId] -= costBasis;

        if (policyGain > 0) {
            policy.remainingExtraPrincipal += policyGain;
        }

        if (policyLoss > 0) {
            _absorbPrincipalLoss(policy, policyLoss);
        }

        emit PolicyYieldWithdrawn(
            policyId,
            strategyId,
            shares,
            costBasis,
            returnedAssets,
            protocolFee,
            policyGain,
            policyLoss
        );
    }

    function withdrawAllYield(uint256 policyId, uint256 strategyId, uint256 minAssetsOut)
        external
        returns (uint256 returnedAssets)
    {
        YieldPosition storage position = yieldPositions[policyId][strategyId];
        return withdrawYield(policyId, strategyId, position.shares, minAssetsOut);
    }

    function depositToken(uint256 policyId, address token, uint256 amount) external whenNotPaused nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.Active || policy.status == PolicyStatus.PayoutActive, "POLICY_CLOSED");
        require(_minimumCovered(policy), "MINIMUM_NOT_FUNDED");
        require(token != address(0), "INVALID_TOKEN");
        require(token != address(premiumVault.paymentToken()), "USE_USDC_DEPOSIT");
        require(amount > 0, "INVALID_AMOUNT");

        _recordHolderInteraction(policyId, policy);

        uint256 received = premiumVault.collectAuxiliaryToken(policyId, policy.holder, IERC20(token), amount);

        if (!hasAuxiliaryToken[policyId][token]) {
            require(auxiliaryTokens[policyId].length < MAX_AUXILIARY_TOKENS, "TOO_MANY_TOKENS");
            hasAuxiliaryToken[policyId][token] = true;
            auxiliaryTokens[policyId].push(token);
        }

        auxiliaryTokenBalances[policyId][token] += received;

        emit AuxiliaryTokenDeposited(policyId, policy.holder, token, received);
    }

    function withdrawToken(uint256 policyId, address token, uint256 amount) external whenNotPaused nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.Active || policy.status == PolicyStatus.PayoutActive, "POLICY_CLOSED");
        require(token != address(0), "INVALID_TOKEN");
        require(token != address(premiumVault.paymentToken()), "USE_USDC_WITHDRAW");
        require(amount > 0, "INVALID_AMOUNT");
        require(amount <= auxiliaryTokenBalances[policyId][token], "TOKEN_EXCEEDS_BALANCE");

        _recordHolderInteraction(policyId, policy);

        auxiliaryTokenBalances[policyId][token] -= amount;
        premiumVault.payAuxiliaryTokenHolder(policyId, policy.holder, IERC20(token), amount);

        emit AuxiliaryTokenWithdrawn(policyId, policy.holder, token, amount);
    }

    function heartbeat(uint256 policyId) external whenNotPaused {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.Active || policy.status == PolicyStatus.PayoutActive, "POLICY_CLOSED");

        _recordHolderInteraction(policyId, policy);

        emit Heartbeat(policyId, msg.sender, block.timestamp);
    }

    function reportDeath(uint256 policyId) external whenNotPaused {
        Policy storage policy = policies[policyId];
        require(policy.holder != address(0), "POLICY_NOT_FOUND");
        require(policy.status == PolicyStatus.Active || policy.status == PolicyStatus.PayoutActive, "INVALID_STATUS");
        require(isBeneficiary(policyId, msg.sender) || msg.sender == owner(), "ONLY_BENEFICIARY_OR_OWNER");
        require(block.timestamp >= policy.openedAt + DEATH_REPORT_DELAY, "POLICY_TOO_NEW");
        require(!deathNotices[policyId].active, "DEATH_ALREADY_REPORTED");

        deathNotices[policyId] = DeathNotice({reporter: msg.sender, reportedAt: block.timestamp, active: true});

        emit DeathReported(policyId, msg.sender, block.timestamp + DEATH_REPORT_DELAY);
    }

    function claimDeath(uint256 policyId) external whenNotPaused nonReentrant {
        Policy storage policy = policies[policyId];
        DeathNotice storage notice = deathNotices[policyId];

        require(policy.holder != address(0), "POLICY_NOT_FOUND");
        require(policy.status == PolicyStatus.Active || policy.status == PolicyStatus.PayoutActive, "INVALID_STATUS");
        require(isBeneficiary(policyId, msg.sender), "ONLY_BENEFICIARY");
        require(notice.active, "NO_DEATH_REPORT");
        require(block.timestamp >= notice.reportedAt + DEATH_REPORT_DELAY, "DEATH_CLAIM_NOT_READY");
        require(policy.lastHolderInteractionAt <= notice.reportedAt, "HOLDER_INTERACTED");
        require(!hasOpenYieldPositions(policyId), "OPEN_YIELD_POSITION");

        uint256 remainingMinimumPrincipal = policy.remainingMinimumPrincipal;
        uint256 remainingExtraPrincipal = policy.remainingExtraPrincipal;
        uint256 releasedPrincipal = remainingMinimumPrincipal + remainingExtraPrincipal;
        (uint256 payout, uint256 retainedFee) = RiskaPolicyMath.deathPayout(
            remainingMinimumPrincipal,
            remainingExtraPrincipal
        );
        bool auxiliaryPayout = _hasAuxiliaryTokenBalance(policyId);

        policy.remainingMinimumPrincipal = 0;
        policy.remainingExtraPrincipal = 0;
        policy.nextPayoutAt = 0;
        policy.status = payout > 0 || auxiliaryPayout ? PolicyStatus.DeathSettled : PolicyStatus.Closed;
        delete deathNotices[policyId];

        premiumVault.settleBeneficiaryPayout(policyId, releasedPrincipal, payout);
        _settleAuxiliaryTokens(policyId);

        emit DeathClaimed(policyId, payout, retainedFee);
        emit PolicyStatusUpdated(policyId, policy.status);
    }

    function beneficiaryCount(uint256 policyId) external view returns (uint256) {
        return beneficiaryRegistry.beneficiaryCount(policyId);
    }

    function beneficiaryAt(uint256 policyId, uint256 index) external view returns (address account, uint16 shareBps) {
        return beneficiaryRegistry.beneficiaryAt(policyId, index);
    }

    function isBeneficiary(uint256 policyId, address account) public view returns (bool) {
        uint256 count = beneficiaryRegistry.beneficiaryCount(policyId);

        for (uint256 i = 0; i < count; i++) {
            (address beneficiary,) = beneficiaryRegistry.beneficiaryAt(policyId, i);
            if (beneficiary == account) {
                return true;
            }
        }

        return false;
    }

    function totalPrincipal(uint256 policyId) external view returns (uint256) {
        Policy storage policy = policies[policyId];
        require(policy.holder != address(0), "POLICY_NOT_FOUND");
        return _totalPrincipal(policy);
    }

    function monthlyPayoutEstimate(uint256 policyId) external view returns (uint256) {
        Policy storage policy = policies[policyId];
        require(policy.holder != address(0), "POLICY_NOT_FOUND");

        if (policy.status == PolicyStatus.PayoutActive) {
            return policy.monthlyPayoutAmount;
        }

        return RiskaPolicyMath.monthlyPayout(_totalPrincipal(policy));
    }

    function deathClaimableAt(uint256 policyId) external view returns (uint256) {
        DeathNotice storage notice = deathNotices[policyId];
        if (!notice.active) {
            return 0;
        }

        return notice.reportedAt + DEATH_REPORT_DELAY;
    }

    function auxiliaryTokenCount(uint256 policyId) external view returns (uint256) {
        return auxiliaryTokens[policyId].length;
    }

    function auxiliaryTokenAt(uint256 policyId, uint256 index) external view returns (address token, uint256 balance) {
        token = auxiliaryTokens[policyId][index];
        balance = auxiliaryTokenBalances[policyId][token];
    }

    function yieldStrategyCount(uint256 policyId) external view returns (uint256) {
        return policyYieldStrategies[policyId].length;
    }

    function yieldStrategyAt(uint256 policyId, uint256 index)
        external
        view
        returns (uint256 strategyId, uint256 shares, uint256 costBasis)
    {
        strategyId = policyYieldStrategies[policyId][index];
        YieldPosition storage position = yieldPositions[policyId][strategyId];
        shares = position.shares;
        costBasis = position.costBasis;
    }

    function hasOpenYieldPositions(uint256 policyId) public view returns (bool) {
        uint256[] storage strategyIds = policyYieldStrategies[policyId];

        for (uint256 i = 0; i < strategyIds.length; i++) {
            if (yieldPositions[policyId][strategyIds[i]].shares > 0) {
                return true;
            }
        }

        return false;
    }

    function _yieldAvailable(uint256 policyId, Policy storage policy) private view returns (uint256) {
        return _totalPrincipal(policy) - yieldPrincipalAllocated[policyId];
    }

    function _canSettleDeathYield(uint256 policyId, address account, Policy storage policy) private view returns (bool) {
        DeathNotice storage notice = deathNotices[policyId];

        return isBeneficiary(policyId, account) &&
            notice.active &&
            block.timestamp >= notice.reportedAt + DEATH_REPORT_DELAY &&
            policy.lastHolderInteractionAt <= notice.reportedAt;
    }

    function _absorbPrincipalLoss(Policy storage policy, uint256 loss) private {
        if (loss <= policy.remainingExtraPrincipal) {
            policy.remainingExtraPrincipal -= loss;
            return;
        }

        uint256 remainingLoss = loss - policy.remainingExtraPrincipal;
        policy.remainingExtraPrincipal = 0;
        require(remainingLoss <= policy.remainingMinimumPrincipal, "LOSS_EXCEEDS_PRINCIPAL");
        policy.remainingMinimumPrincipal -= remainingLoss;
    }

    function _collectAndAllocateDeposit(uint256 policyId, uint256 amount) private {
        Policy storage policy = policies[policyId];
        uint256 remainingMinimumCapacity = RiskaPolicyMath.MINIMUM_POLICY_PRINCIPAL -
            policy.remainingMinimumPrincipal;
        uint256 minimumPrincipalAdded = amount <= remainingMinimumCapacity ? amount : remainingMinimumCapacity;
        uint256 extraPrincipalAdded = amount - minimumPrincipalAdded;

        policy.remainingMinimumPrincipal += minimumPrincipalAdded;
        policy.remainingExtraPrincipal += extraPrincipalAdded;

        premiumVault.collectPremium(policyId, policy.holder, amount);

        emit PolicyDeposit(policyId, policy.holder, amount, minimumPrincipalAdded, extraPrincipalAdded);
    }

    function _drawdown(Policy storage policy, uint256 amount) private {
        uint256 remainingMinimumPrincipal = policy.remainingMinimumPrincipal;
        uint256 remainingExtraPrincipal = policy.remainingExtraPrincipal;
        uint256 total = remainingMinimumPrincipal + remainingExtraPrincipal;

        require(amount <= total, "PAYOUT_EXCEEDS_BALANCE");

        if (amount == total) {
            policy.remainingMinimumPrincipal = 0;
            policy.remainingExtraPrincipal = 0;
            return;
        }

        uint256 minimumDraw = (amount * remainingMinimumPrincipal) / total;
        uint256 extraDraw = amount - minimumDraw;

        if (extraDraw > remainingExtraPrincipal) {
            extraDraw = remainingExtraPrincipal;
            minimumDraw = amount - extraDraw;
        }

        if (minimumDraw > remainingMinimumPrincipal) {
            minimumDraw = remainingMinimumPrincipal;
            extraDraw = amount - minimumDraw;
        }

        policy.remainingMinimumPrincipal = remainingMinimumPrincipal - minimumDraw;
        policy.remainingExtraPrincipal = remainingExtraPrincipal - extraDraw;
    }

    function _recordHolderInteraction(uint256 policyId, Policy storage policy) private {
        policy.lastHolderInteractionAt = block.timestamp;
        _cancelDeathNotice(policyId);
    }

    function _minimumCovered(Policy storage policy) private view returns (bool) {
        return policy.status == PolicyStatus.PayoutActive ||
            policy.remainingMinimumPrincipal == RiskaPolicyMath.MINIMUM_POLICY_PRINCIPAL;
    }

    function _hasAuxiliaryTokenBalance(uint256 policyId) private view returns (bool) {
        address[] storage tokens = auxiliaryTokens[policyId];

        for (uint256 i = 0; i < tokens.length; i++) {
            if (auxiliaryTokenBalances[policyId][tokens[i]] > 0) {
                return true;
            }
        }

        return false;
    }

    function _settleAuxiliaryTokens(uint256 policyId) private {
        address[] storage tokens = auxiliaryTokens[policyId];

        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            uint256 amount = auxiliaryTokenBalances[policyId][token];

            if (amount == 0) {
                continue;
            }

            auxiliaryTokenBalances[policyId][token] = 0;
            premiumVault.settleAuxiliaryTokenBeneficiaries(policyId, IERC20(token), amount);

            emit AuxiliaryTokenBeneficiariesPaid(policyId, token, amount);
        }
    }

    function _resetPayout(Policy storage policy) private {
        policy.status = PolicyStatus.Active;
        policy.payoutsMade = 0;
        policy.monthlyPayoutAmount = 0;
        policy.nextPayoutAt = 0;
    }

    function _reschedulePayout(uint256 policyId, Policy storage policy) private {
        uint256 totalBalance = _totalPrincipal(policy);

        if (totalBalance == 0) {
            _resetPayout(policy);
            emit PolicyStatusUpdated(policyId, PolicyStatus.Active);
            return;
        }

        uint256 remainingMonths = RiskaPolicyMath.PAYOUT_MONTHS - policy.payoutsMade;
        uint256 monthlyAmount = totalBalance / remainingMonths;

        if (monthlyAmount == 0) {
            monthlyAmount = totalBalance;
        }

        policy.monthlyPayoutAmount = monthlyAmount;

        emit PayoutRescheduled(policyId, monthlyAmount, totalBalance, remainingMonths);
    }

    function _cancelDeathNotice(uint256 policyId) private {
        if (deathNotices[policyId].active) {
            delete deathNotices[policyId];
            emit DeathReportCancelled(policyId);
        }
    }

    function _totalPrincipal(Policy storage policy) private view returns (uint256) {
        return policy.remainingMinimumPrincipal + policy.remainingExtraPrincipal;
    }
}
