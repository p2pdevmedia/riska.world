// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {RiskaBeneficiaryRegistry} from "./RiskaBeneficiaryRegistry.sol";
import {RiskaPolicyMath} from "./RiskaPolicyMath.sol";
import {RiskaPremiumVault} from "./RiskaPremiumVault.sol";

contract RiskaPolicyManager is Ownable, Pausable, ReentrancyGuard {
    enum PolicyStatus {
        None,
        Active,
        PayoutActive,
        DeathSettled,
        Closed
    }

    struct Policy {
        address holder;
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

    uint256 public constant PAYMENT_PERIOD = 30 days;
    uint256 public constant DEATH_REPORT_DELAY = 12 * 30 days;

    RiskaBeneficiaryRegistry public immutable beneficiaryRegistry;
    RiskaPremiumVault public immutable premiumVault;

    uint256 public nextPolicyId = 1;

    mapping(uint256 => Policy) public policies;
    mapping(address => uint256) public policyOf;
    mapping(uint256 => DeathNotice) public deathNotices;

    event PolicyOpened(uint256 indexed policyId, address indexed holder, bytes32 indexed termsHash);
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
    event MonthlyClaimed(uint256 indexed policyId, uint256 amount, uint16 payoutsMade);
    event ClaimAll(uint256 indexed policyId, uint256 amount);
    event Heartbeat(uint256 indexed policyId, address indexed holder, uint256 timestamp);
    event DeathReported(uint256 indexed policyId, address indexed reporter, uint256 claimableAt);
    event DeathReportCancelled(uint256 indexed policyId);
    event DeathClaimed(uint256 indexed policyId, uint256 payout, uint256 retainedFee);

    constructor(
        RiskaBeneficiaryRegistry beneficiaryRegistry_,
        RiskaPremiumVault premiumVault_
    ) Ownable(msg.sender) {
        require(address(beneficiaryRegistry_) != address(0), "INVALID_REGISTRY");
        require(address(premiumVault_) != address(0), "INVALID_VAULT");

        beneficiaryRegistry = beneficiaryRegistry_;
        premiumVault = premiumVault_;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function openPolicy(
        address[] memory beneficiaries,
        uint16[] memory sharesBps,
        bytes32 termsHash
    ) external whenNotPaused nonReentrant returns (uint256 policyId) {
        require(policyOf[msg.sender] == 0, "POLICY_EXISTS");
        require(termsHash != bytes32(0), "INVALID_TERMS");

        policyId = nextPolicyId++;
        policyOf[msg.sender] = policyId;

        policies[policyId] = Policy({
            holder: msg.sender,
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

        emit PolicyOpened(policyId, msg.sender, termsHash);
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

        uint256 amount = policy.monthlyPayoutAmount;
        uint256 totalBalance = _totalPrincipal(policy);
        bool finalPayout = policy.payoutsMade + 1 >= RiskaPolicyMath.PAYOUT_MONTHS || amount >= totalBalance;

        if (finalPayout) {
            amount = totalBalance;
        }

        _recordHolderInteraction(policyId, policy);
        _drawdown(policy, amount);
        policy.payoutsMade += 1;

        if (finalPayout || _totalPrincipal(policy) == 0) {
            policy.status = PolicyStatus.Closed;
            policy.nextPayoutAt = 0;
            emit PolicyStatusUpdated(policyId, PolicyStatus.Closed);
        } else {
            policy.nextPayoutAt += PAYMENT_PERIOD;
        }

        premiumVault.payHolder(policyId, policy.holder, amount);

        emit MonthlyClaimed(policyId, amount, policy.payoutsMade);
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

        uint256 amount = _totalPrincipal(policy);
        require(amount > 0, "NO_PRINCIPAL");

        _recordHolderInteraction(policyId, policy);

        policy.remainingMinimumPrincipal = 0;
        policy.remainingExtraPrincipal = 0;
        policy.status = PolicyStatus.Closed;
        policy.nextPayoutAt = 0;

        premiumVault.payHolder(policyId, policy.holder, amount);

        emit ClaimAll(policyId, amount);
        emit PolicyStatusUpdated(policyId, PolicyStatus.Closed);
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
        require(isBeneficiary(policyId, msg.sender), "ONLY_BENEFICIARY");
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

        uint256 remainingMinimumPrincipal = policy.remainingMinimumPrincipal;
        uint256 remainingExtraPrincipal = policy.remainingExtraPrincipal;
        uint256 releasedPrincipal = remainingMinimumPrincipal + remainingExtraPrincipal;
        (uint256 payout, uint256 retainedFee) = RiskaPolicyMath.deathPayout(
            remainingMinimumPrincipal,
            remainingExtraPrincipal
        );

        policy.remainingMinimumPrincipal = 0;
        policy.remainingExtraPrincipal = 0;
        policy.nextPayoutAt = 0;
        policy.status = payout > 0 ? PolicyStatus.DeathSettled : PolicyStatus.Closed;
        delete deathNotices[policyId];

        premiumVault.settleBeneficiaryPayout(policyId, releasedPrincipal, payout);

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
        return RiskaPolicyMath.monthlyPayout(_totalPrincipal(policy));
    }

    function deathClaimableAt(uint256 policyId) external view returns (uint256) {
        DeathNotice storage notice = deathNotices[policyId];
        if (!notice.active) {
            return 0;
        }

        return notice.reportedAt + DEATH_REPORT_DELAY;
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
