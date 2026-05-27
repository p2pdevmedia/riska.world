// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {RiskaBeneficiaryRegistry} from "./RiskaBeneficiaryRegistry.sol";
import {RiskaDeathVerifier} from "./RiskaDeathVerifier.sol";
import {RiskaPolicyMath} from "./RiskaPolicyMath.sol";
import {RiskaPremiumVault} from "./RiskaPremiumVault.sol";

contract RiskaPolicyManager is Ownable, Pausable, ReentrancyGuard {
    enum PolicyStatus {
        None,
        Active,
        InactiveReview,
        Matured,
        RetirementPayout,
        DeathSettled,
        Closed
    }

    struct Policy {
        address holder;
        bytes32 termsHash;
        uint16 paidMonths;
        uint16 payoutsMade;
        uint256 openedAt;
        uint256 nextPayoutAt;
        uint256 paidPrincipal;
        uint256 remainingPrincipal;
        PolicyStatus status;
    }

    uint256 public constant PAYMENT_PERIOD = 30 days;

    RiskaBeneficiaryRegistry public immutable beneficiaryRegistry;
    RiskaDeathVerifier public immutable deathVerifier;
    RiskaPremiumVault public immutable premiumVault;

    uint256 public nextPolicyId = 1;

    mapping(uint256 => Policy) public policies;
    mapping(address => uint256) public policyOf;
    event PolicyOpened(uint256 indexed policyId, address indexed holder, bytes32 indexed termsHash);
    event PremiumPaid(uint256 indexed policyId, uint16 periods, uint256 amount, uint16 paidMonths);
    event PolicyStatusUpdated(uint256 indexed policyId, PolicyStatus status);
    event DeathSettled(uint256 indexed policyId, uint256 payout, bytes32 indexed evidenceHash);
    event RetirementActivated(uint256 indexed policyId);
    event RetirementPaid(uint256 indexed policyId, uint256 amount, uint16 payoutsMade);

    constructor(
        RiskaBeneficiaryRegistry beneficiaryRegistry_,
        RiskaDeathVerifier deathVerifier_,
        RiskaPremiumVault premiumVault_
    ) Ownable(msg.sender) {
        require(address(beneficiaryRegistry_) != address(0), "INVALID_REGISTRY");
        require(address(deathVerifier_) != address(0), "INVALID_DEATH_VERIFIER");
        require(address(premiumVault_) != address(0), "INVALID_VAULT");

        beneficiaryRegistry = beneficiaryRegistry_;
        deathVerifier = deathVerifier_;
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
            paidMonths: 0,
            payoutsMade: 0,
            openedAt: block.timestamp,
            nextPayoutAt: 0,
            paidPrincipal: 0,
            remainingPrincipal: 0,
            status: PolicyStatus.Active
        });

        beneficiaryRegistry.setBeneficiaries(policyId, beneficiaries, sharesBps);

        _collectPremium(policyId, 1);

        emit PolicyOpened(policyId, msg.sender, termsHash);
    }

    function payPremium(uint256 policyId, uint16 periods) external whenNotPaused nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.Active || policy.status == PolicyStatus.InactiveReview, "POLICY_NOT_PAYABLE");

        _collectPremium(policyId, periods);

        if (policy.paidMonths == RiskaPolicyMath.CONTRIBUTION_MONTHS && policy.status != PolicyStatus.Matured) {
            policy.status = PolicyStatus.Matured;
            emit PolicyStatusUpdated(policyId, PolicyStatus.Matured);
        }
    }

    function flagInactiveReview(uint256 policyId) external onlyOwner {
        Policy storage policy = policies[policyId];
        require(policy.holder != address(0), "POLICY_NOT_FOUND");
        require(
            policy.status == PolicyStatus.Active ||
                policy.status == PolicyStatus.Matured ||
                policy.status == PolicyStatus.RetirementPayout,
            "INVALID_STATUS"
        );

        policy.status = PolicyStatus.InactiveReview;
        emit PolicyStatusUpdated(policyId, PolicyStatus.InactiveReview);
    }

    function activateRetirement(uint256 policyId) external whenNotPaused {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.Matured, "NOT_MATURED");
        require(policy.remainingPrincipal == RiskaPolicyMath.FULL_TERM_PRINCIPAL, "INCOMPLETE_PRINCIPAL");

        policy.status = PolicyStatus.RetirementPayout;
        policy.nextPayoutAt = block.timestamp;

        emit RetirementActivated(policyId);
        emit PolicyStatusUpdated(policyId, PolicyStatus.RetirementPayout);
    }

    function claimRetirementPayout(uint256 policyId) external whenNotPaused nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.RetirementPayout, "NOT_IN_PAYOUT");
        require(block.timestamp >= policy.nextPayoutAt, "PAYOUT_NOT_READY");

        uint256 amount = RiskaPolicyMath.HOLDER_MONTHLY_PAYOUT;
        bool finalPayout = policy.payoutsMade + 1 >= RiskaPolicyMath.RETIREMENT_PAYOUT_MONTHS ||
            amount >= policy.remainingPrincipal;

        if (finalPayout) {
            amount = policy.remainingPrincipal;
        }

        policy.remainingPrincipal -= amount;
        policy.payoutsMade += 1;

        if (finalPayout || policy.remainingPrincipal == 0) {
            policy.status = PolicyStatus.Closed;
            policy.nextPayoutAt = 0;
            emit PolicyStatusUpdated(policyId, PolicyStatus.Closed);
        } else {
            policy.nextPayoutAt += PAYMENT_PERIOD;
        }

        premiumVault.payHolder(policyId, policy.holder, amount);
        emit RetirementPaid(policyId, amount, policy.payoutsMade);
    }

    function settleVerifiedDeath(uint256 policyId) external whenNotPaused nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.holder != address(0), "POLICY_NOT_FOUND");
        require(
            policy.status == PolicyStatus.Active ||
                policy.status == PolicyStatus.InactiveReview ||
                policy.status == PolicyStatus.Matured ||
                policy.status == PolicyStatus.RetirementPayout,
            "INVALID_STATUS"
        );

        bytes32 evidenceHash = deathVerifier.consumeVerifiedDeath(policyId);

        uint256 payout;
        if (
            policy.status == PolicyStatus.Matured ||
            policy.status == PolicyStatus.RetirementPayout ||
            (policy.status == PolicyStatus.InactiveReview && policy.paidMonths == RiskaPolicyMath.CONTRIBUTION_MONTHS)
        ) {
            payout = RiskaPolicyMath.beneficiaryPayoutAfterMaturity(policy.remainingPrincipal);
        } else {
            payout = RiskaPolicyMath.beneficiaryPayoutBeforeMaturity(policy.paidMonths);
        }

        uint256 releasedPrincipal = policy.remainingPrincipal;
        policy.remainingPrincipal = 0;
        policy.status = payout > 0 ? PolicyStatus.DeathSettled : PolicyStatus.Closed;
        premiumVault.settleBeneficiaryPayout(policyId, releasedPrincipal, payout);

        emit DeathSettled(policyId, payout, evidenceHash);
        emit PolicyStatusUpdated(policyId, policy.status);
    }

    function beneficiaryCount(uint256 policyId) external view returns (uint256) {
        return beneficiaryRegistry.beneficiaryCount(policyId);
    }

    function beneficiaryAt(uint256 policyId, uint256 index) external view returns (address account, uint16 shareBps) {
        return beneficiaryRegistry.beneficiaryAt(policyId, index);
    }

    function _collectPremium(uint256 policyId, uint16 periods) private {
        require(periods > 0, "INVALID_PERIODS");

        Policy storage policy = policies[policyId];
        require(policy.paidMonths + periods <= RiskaPolicyMath.CONTRIBUTION_MONTHS, "TOO_MANY_PERIODS");

        uint256 amount = uint256(periods) * RiskaPolicyMath.MONTHLY_PREMIUM;
        policy.paidMonths += periods;
        policy.paidPrincipal += amount;
        policy.remainingPrincipal += amount;

        premiumVault.collectPremium(policyId, policy.holder, amount);
        emit PremiumPaid(policyId, periods, amount, policy.paidMonths);
    }
}
