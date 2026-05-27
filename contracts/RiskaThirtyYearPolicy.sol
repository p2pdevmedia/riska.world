// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract RiskaThirtyYearPolicy {
    enum PolicyStatus {
        None,
        Active,
        GracePeriod,
        Lapsed,
        DeathPaid,
        Matured,
        RetirementPayout,
        Closed
    }

    struct Plan {
        bool active;
        uint256 monthlyPremium;
        uint256 deathBenefit;
        uint16 retirementShareBps;
        uint16 feeBps;
        uint16 payoutMonths;
        bytes32 termsHash;
    }

    struct Policy {
        uint256 planId;
        address holder;
        address beneficiary;
        uint256 issuedAt;
        uint256 maturityAt;
        uint256 paidThrough;
        uint256 totalPremiumPaid;
        uint256 retirementBalance;
        uint256 monthlyRetirementPayout;
        uint16 payoutsMade;
        uint256 nextPayoutAt;
        PolicyStatus status;
    }

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant PAYMENT_PERIOD = 30 days;
    uint256 public constant POLICY_TERM = 360 * PAYMENT_PERIOD;
    uint256 public constant GRACE_PERIOD = 60 days;

    IERC20 public immutable paymentToken;
    address public owner;
    address public claimVerifier;
    uint256 public nextPlanId = 1;
    uint256 public nextPolicyId = 1;
    uint256 public totalRetirementLiability;
    uint256 public feeBalance;

    mapping(uint256 => Plan) public plans;
    mapping(uint256 => Policy) public policies;

    bool private locked;

    event OwnerUpdated(address indexed owner);
    event ClaimVerifierUpdated(address indexed verifier);
    event PlanCreated(uint256 indexed planId, bytes32 indexed termsHash);
    event PlanStatusUpdated(uint256 indexed planId, bool active);
    event PolicyOpened(uint256 indexed policyId, uint256 indexed planId, address indexed holder, address beneficiary);
    event PremiumPaid(uint256 indexed policyId, uint256 amount, uint256 retirementAmount, uint256 feeAmount);
    event PolicyStatusUpdated(uint256 indexed policyId, PolicyStatus status);
    event DeathSettled(uint256 indexed policyId, address indexed beneficiary, uint256 deathBenefit, uint256 retirementBalance, bytes32 evidenceHash);
    event RetirementActivated(uint256 indexed policyId, uint256 monthlyPayout, uint16 payoutMonths);
    event RetirementPaid(uint256 indexed policyId, address indexed holder, uint256 amount, uint16 payoutsMade);
    event LapsedPolicySurrendered(uint256 indexed policyId, address indexed holder, uint256 amount);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event RiskReserveFunded(address indexed from, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    modifier onlyVerifier() {
        require(msg.sender == claimVerifier, "ONLY_VERIFIER");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "REENTRANCY");
        locked = true;
        _;
        locked = false;
    }

    constructor(IERC20 paymentToken_, address claimVerifier_) {
        require(address(paymentToken_) != address(0), "INVALID_TOKEN");
        require(claimVerifier_ != address(0), "INVALID_VERIFIER");

        paymentToken = paymentToken_;
        owner = msg.sender;
        claimVerifier = claimVerifier_;

        emit OwnerUpdated(msg.sender);
        emit ClaimVerifierUpdated(claimVerifier_);
    }

    function transferOwnership(address nextOwner) external onlyOwner {
        require(nextOwner != address(0), "INVALID_OWNER");
        owner = nextOwner;
        emit OwnerUpdated(nextOwner);
    }

    function setClaimVerifier(address nextVerifier) external onlyOwner {
        require(nextVerifier != address(0), "INVALID_VERIFIER");
        claimVerifier = nextVerifier;
        emit ClaimVerifierUpdated(nextVerifier);
    }

    function createPlan(
        uint256 monthlyPremium,
        uint256 deathBenefit,
        uint16 retirementShareBps,
        uint16 feeBps,
        uint16 payoutMonths,
        bytes32 termsHash
    ) external onlyOwner returns (uint256 planId) {
        require(monthlyPremium > 0, "INVALID_PREMIUM");
        require(deathBenefit > 0, "INVALID_DEATH_BENEFIT");
        require(payoutMonths > 0, "INVALID_PAYOUT_MONTHS");
        require(termsHash != bytes32(0), "INVALID_TERMS");
        require(uint256(retirementShareBps) + uint256(feeBps) <= BPS_DENOMINATOR, "INVALID_ALLOCATION");

        planId = nextPlanId++;
        plans[planId] = Plan({
            active: true,
            monthlyPremium: monthlyPremium,
            deathBenefit: deathBenefit,
            retirementShareBps: retirementShareBps,
            feeBps: feeBps,
            payoutMonths: payoutMonths,
            termsHash: termsHash
        });

        emit PlanCreated(planId, termsHash);
    }

    function setPlanActive(uint256 planId, bool active) external onlyOwner {
        require(plans[planId].monthlyPremium > 0, "PLAN_NOT_FOUND");
        plans[planId].active = active;
        emit PlanStatusUpdated(planId, active);
    }

    function openPolicy(uint256 planId, address beneficiary) external nonReentrant returns (uint256 policyId) {
        Plan memory plan = plans[planId];
        require(plan.active, "PLAN_INACTIVE");
        require(beneficiary != address(0), "INVALID_BENEFICIARY");

        policyId = nextPolicyId++;
        policies[policyId] = Policy({
            planId: planId,
            holder: msg.sender,
            beneficiary: beneficiary,
            issuedAt: block.timestamp,
            maturityAt: block.timestamp + POLICY_TERM,
            paidThrough: block.timestamp + PAYMENT_PERIOD,
            totalPremiumPaid: 0,
            retirementBalance: 0,
            monthlyRetirementPayout: 0,
            payoutsMade: 0,
            nextPayoutAt: 0,
            status: PolicyStatus.Active
        });

        _collectPremium(policyId, plan.monthlyPremium);
        emit PolicyOpened(policyId, planId, msg.sender, beneficiary);
    }

    function payPremium(uint256 policyId, uint16 periods) external nonReentrant {
        require(periods > 0, "INVALID_PERIODS");

        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(block.timestamp < policy.maturityAt, "POLICY_MATURED");

        PolicyStatus status = refreshPolicyStatus(policyId);
        require(status == PolicyStatus.Active || status == PolicyStatus.GracePeriod, "POLICY_NOT_PAYABLE");

        Plan memory plan = plans[policy.planId];
        uint256 amount = plan.monthlyPremium * periods;
        policy.paidThrough += uint256(periods) * PAYMENT_PERIOD;

        _collectPremium(policyId, amount);
        refreshPolicyStatus(policyId);
    }

    function activateRetirement(uint256 policyId) external {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");

        PolicyStatus status = refreshPolicyStatus(policyId);
        require(status == PolicyStatus.Matured, "NOT_MATURED");
        require(policy.retirementBalance > 0, "NO_RETIREMENT_BALANCE");

        Plan memory plan = plans[policy.planId];
        uint256 monthlyPayout = policy.retirementBalance / plan.payoutMonths;
        require(monthlyPayout > 0, "PAYOUT_TOO_SMALL");

        policy.status = PolicyStatus.RetirementPayout;
        policy.monthlyRetirementPayout = monthlyPayout;
        policy.nextPayoutAt = block.timestamp;

        emit RetirementActivated(policyId, monthlyPayout, plan.payoutMonths);
        emit PolicyStatusUpdated(policyId, PolicyStatus.RetirementPayout);
    }

    function claimRetirementPayout(uint256 policyId) external nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");
        require(policy.status == PolicyStatus.RetirementPayout, "NOT_IN_PAYOUT");
        require(block.timestamp >= policy.nextPayoutAt, "PAYOUT_NOT_READY");

        Plan memory plan = plans[policy.planId];
        uint256 amount = policy.monthlyRetirementPayout;
        bool finalPayout = policy.payoutsMade + 1 >= plan.payoutMonths || amount >= policy.retirementBalance;

        if (finalPayout) {
            amount = policy.retirementBalance;
        }

        policy.retirementBalance -= amount;
        totalRetirementLiability -= amount;
        policy.payoutsMade += 1;

        if (finalPayout || policy.retirementBalance == 0) {
            policy.status = PolicyStatus.Closed;
            policy.nextPayoutAt = 0;
            emit PolicyStatusUpdated(policyId, PolicyStatus.Closed);
        } else {
            policy.nextPayoutAt += PAYMENT_PERIOD;
        }

        _safeTransfer(policy.holder, amount);
        emit RetirementPaid(policyId, policy.holder, amount, policy.payoutsMade);
    }

    function reportDeath(uint256 policyId, bytes32 evidenceHash) external onlyVerifier nonReentrant {
        require(evidenceHash != bytes32(0), "INVALID_EVIDENCE");

        Policy storage policy = policies[policyId];
        require(policy.holder != address(0), "POLICY_NOT_FOUND");

        PolicyStatus status = refreshPolicyStatus(policyId);
        require(status != PolicyStatus.DeathPaid && status != PolicyStatus.Closed, "POLICY_CLOSED");

        Plan memory plan = plans[policy.planId];
        uint256 deathBenefit = 0;

        if (
            (status == PolicyStatus.Active || status == PolicyStatus.GracePeriod) &&
            block.timestamp < policy.maturityAt
        ) {
            deathBenefit = plan.deathBenefit;
            require(availableRiskLiquidity() >= deathBenefit, "INSUFFICIENT_RISK_LIQUIDITY");
        }

        uint256 retirementAmount = policy.retirementBalance;
        uint256 payout = deathBenefit + retirementAmount;
        require(payout > 0, "NO_PAYOUT_AVAILABLE");

        policy.retirementBalance = 0;
        policy.status = deathBenefit > 0 ? PolicyStatus.DeathPaid : PolicyStatus.Closed;
        totalRetirementLiability -= retirementAmount;

        _safeTransfer(policy.beneficiary, payout);
        emit DeathSettled(policyId, policy.beneficiary, deathBenefit, retirementAmount, evidenceHash);
        emit PolicyStatusUpdated(policyId, policy.status);
    }

    function surrenderLapsedPolicy(uint256 policyId) external nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "ONLY_HOLDER");

        PolicyStatus status = refreshPolicyStatus(policyId);
        require(status == PolicyStatus.Lapsed, "NOT_LAPSED");

        uint256 amount = policy.retirementBalance;
        require(amount > 0, "NO_RETIREMENT_BALANCE");

        policy.retirementBalance = 0;
        policy.status = PolicyStatus.Closed;
        totalRetirementLiability -= amount;

        _safeTransfer(policy.holder, amount);
        emit LapsedPolicySurrendered(policyId, policy.holder, amount);
        emit PolicyStatusUpdated(policyId, PolicyStatus.Closed);
    }

    function refreshPolicyStatus(uint256 policyId) public returns (PolicyStatus) {
        Policy storage policy = policies[policyId];
        require(policy.holder != address(0), "POLICY_NOT_FOUND");

        if (
            policy.status == PolicyStatus.DeathPaid ||
            policy.status == PolicyStatus.Lapsed ||
            policy.status == PolicyStatus.RetirementPayout ||
            policy.status == PolicyStatus.Closed
        ) {
            return policy.status;
        }

        PolicyStatus nextStatus;
        if (block.timestamp > policy.paidThrough + GRACE_PERIOD && policy.paidThrough < policy.maturityAt) {
            nextStatus = PolicyStatus.Lapsed;
        } else if (block.timestamp >= policy.maturityAt && policy.paidThrough >= policy.maturityAt) {
            nextStatus = PolicyStatus.Matured;
        } else if (block.timestamp > policy.paidThrough) {
            nextStatus = PolicyStatus.GracePeriod;
        } else {
            nextStatus = PolicyStatus.Active;
        }

        if (policy.status != nextStatus) {
            policy.status = nextStatus;
            emit PolicyStatusUpdated(policyId, nextStatus);
        }

        return nextStatus;
    }

    function fundRiskReserve(uint256 amount) external nonReentrant {
        require(amount > 0, "INVALID_AMOUNT");
        _safeTransferFrom(msg.sender, address(this), amount);
        emit RiskReserveFunded(msg.sender, amount);
    }

    function withdrawFees(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "INVALID_RECIPIENT");
        require(amount <= feeBalance, "INSUFFICIENT_FEES");

        feeBalance -= amount;
        _safeTransfer(to, amount);
        emit FeesWithdrawn(to, amount);
    }

    function availableRiskLiquidity() public view returns (uint256) {
        uint256 balance = paymentToken.balanceOf(address(this));
        uint256 reserved = totalRetirementLiability + feeBalance;
        return balance > reserved ? balance - reserved : 0;
    }

    function _collectPremium(uint256 policyId, uint256 amount) private {
        Policy storage policy = policies[policyId];
        Plan memory plan = plans[policy.planId];

        uint256 retirementAmount = (amount * plan.retirementShareBps) / BPS_DENOMINATOR;
        uint256 feeAmount = (amount * plan.feeBps) / BPS_DENOMINATOR;

        policy.totalPremiumPaid += amount;
        policy.retirementBalance += retirementAmount;
        totalRetirementLiability += retirementAmount;
        feeBalance += feeAmount;

        _safeTransferFrom(policy.holder, address(this), amount);
        emit PremiumPaid(policyId, amount, retirementAmount, feeAmount);
    }

    function _safeTransfer(address to, uint256 amount) private {
        require(paymentToken.transfer(to, amount), "TRANSFER_FAILED");
    }

    function _safeTransferFrom(address from, address to, uint256 amount) private {
        require(paymentToken.transferFrom(from, to, amount), "TRANSFER_FROM_FAILED");
    }
}
