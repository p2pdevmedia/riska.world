import type { ContractId } from "@/lib/contracts";

export type ContractSource = {
  language: "solidity" | string;
  code: string;
};

const policyManagerSource = String.raw`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPremiumVault {
    function schedulePayout(address recipient, uint256 amount) external;
}

contract PolicyManager {
    struct Policy {
        address holder;
        uint256 coverage;
        uint64 windowStart;
        uint64 windowEnd;
        bytes32 riskId;
        bool active;
    }

    uint256 public nextPolicyId = 1;
    address public owner;
    IPremiumVault public premiumVault;

    mapping(uint256 => Policy) private _policies;

    event PolicyIssued(uint256 indexed policyId, address indexed holder, bytes32 indexed riskId);
    event PolicyExpired(uint256 indexed policyId);
    event VaultUpdated(address indexed vault);

    modifier onlyOwner() {
        require(msg.sender == owner, "POLICY_MANAGER:NOT_OWNER");
        _;
    }

    constructor(address vault) {
        owner = msg.sender;
        premiumVault = IPremiumVault(vault);
    }

    function setVault(address vault) external onlyOwner {
        require(vault != address(0), "POLICY_MANAGER:VAULT_ZERO");
        premiumVault = IPremiumVault(vault);
        emit VaultUpdated(vault);
    }

    function issuePolicy(
        address holder,
        uint64 windowStart,
        uint64 windowEnd,
        uint256 coverage,
        bytes32 riskId
    ) external onlyOwner returns (uint256 policyId) {
        require(holder != address(0), "POLICY_MANAGER:HOLDER_ZERO");
        require(windowEnd > windowStart, "POLICY_MANAGER:INVALID_WINDOW");
        require(coverage > 0, "POLICY_MANAGER:COVERAGE_ZERO");

        policyId = nextPolicyId++;

        _policies[policyId] = Policy({
            holder: holder,
            coverage: coverage,
            windowStart: windowStart,
            windowEnd: windowEnd,
            riskId: riskId,
            active: true
        });

        emit PolicyIssued(policyId, holder, riskId);
    }

    function expirePolicy(uint256 policyId) external onlyOwner {
        Policy storage policy = _policies[policyId];
        require(policy.active, "POLICY_MANAGER:NOT_ACTIVE");
        policy.active = false;
        emit PolicyExpired(policyId);
    }

    function isActive(uint256 policyId) public view returns (bool) {
        Policy storage policy = _policies[policyId];
        if (!policy.active) {
            return false;
        }
        return block.timestamp <= policy.windowEnd;
    }

    function getPolicy(uint256 policyId) external view returns (Policy memory) {
        return _policies[policyId];
    }
}
`;

const claimsBridgeSource = String.raw`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPolicyManager {
    function isActive(uint256 policyId) external view returns (bool);
}

interface IVaultPayouts {
    function schedulePayout(address recipient, uint256 amount) external;
}

contract ClaimsBridge {
    address public owner;
    IPolicyManager public policyManager;
    IVaultPayouts public premiumVault;

    mapping(bytes32 => bool) public consumedReports;

    event ClaimForwarded(uint256 indexed policyId, address indexed beneficiary, uint256 amount, bytes32 reportId);
    event BridgeConfigured(address indexed policyManager, address indexed premiumVault);

    modifier onlyOwner() {
        require(msg.sender == owner, "CLAIMS_BRIDGE:NOT_OWNER");
        _;
    }

    constructor(address policyManager_, address premiumVault_) {
        owner = msg.sender;
        policyManager = IPolicyManager(policyManager_);
        premiumVault = IVaultPayouts(premiumVault_);
        emit BridgeConfigured(policyManager_, premiumVault_);
    }

    function configure(address policyManager_, address premiumVault_) external onlyOwner {
        require(policyManager_ != address(0) && premiumVault_ != address(0), "CLAIMS_BRIDGE:ZERO_ADDRESS");
        policyManager = IPolicyManager(policyManager_);
        premiumVault = IVaultPayouts(premiumVault_);
        emit BridgeConfigured(policyManager_, premiumVault_);
    }

    function forwardClaim(
        uint256 policyId,
        address beneficiary,
        uint256 amount,
        bytes32 reportId
    ) external onlyOwner {
        require(!consumedReports[reportId], "CLAIMS_BRIDGE:REPORT_USED");
        require(policyManager.isActive(policyId), "CLAIMS_BRIDGE:INACTIVE_POLICY");
        require(beneficiary != address(0), "CLAIMS_BRIDGE:ZERO_BENEFICIARY");
        require(amount > 0, "CLAIMS_BRIDGE:ZERO_AMOUNT");

        consumedReports[reportId] = true;
        premiumVault.schedulePayout(beneficiary, amount);
        emit ClaimForwarded(policyId, beneficiary, amount, reportId);
    }
}
`;

const premiumVaultSource = String.raw`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PremiumVault {
    address public owner;

    struct Payout {
        address recipient;
        uint128 amount;
        bool released;
    }

    uint256 public nextPayoutId = 1;

    mapping(address => uint256) public balances;
    mapping(uint256 => Payout) public payouts;

    event Deposited(address indexed sender, uint256 amount);
    event Withdrawn(address indexed recipient, uint256 amount);
    event PayoutScheduled(uint256 indexed payoutId, address indexed recipient, uint256 amount);
    event PayoutReleased(uint256 indexed payoutId, address indexed recipient, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "PREMIUM_VAULT:NOT_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function deposit() external payable {
        require(msg.value > 0, "PREMIUM_VAULT:ZERO_DEPOSIT");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "PREMIUM_VAULT:INSUFFICIENT");
        (bool success, ) = owner.call{value: amount}("");
        require(success, "PREMIUM_VAULT:WITHDRAW_FAIL");
        emit Withdrawn(owner, amount);
    }

    function schedulePayout(address recipient, uint256 amount) external onlyOwner returns (uint256 payoutId) {
        require(recipient != address(0), "PREMIUM_VAULT:ZERO_RECIPIENT");
        require(amount > 0, "PREMIUM_VAULT:ZERO_AMOUNT");

        payoutId = nextPayoutId++;
        payouts[payoutId] = Payout({recipient: recipient, amount: uint128(amount), released: false});

        emit PayoutScheduled(payoutId, recipient, amount);
    }

    function release(uint256 payoutId) external onlyOwner {
        Payout storage payout = payouts[payoutId];
        require(!payout.released, "PREMIUM_VAULT:ALREADY_RELEASED");
        require(payout.amount > 0, "PREMIUM_VAULT:UNKNOWN_PAYOUT");
        require(address(this).balance >= payout.amount, "PREMIUM_VAULT:INSUFFICIENT_BALANCE");

        payout.released = true;
        (bool success, ) = payout.recipient.call{value: payout.amount}("");
        require(success, "PREMIUM_VAULT:TRANSFER_FAIL");

        emit PayoutReleased(payoutId, payout.recipient, payout.amount);
    }
}
`;

export const contractSources: Record<ContractId, ContractSource> = {
  policyManager: { language: "solidity", code: policyManagerSource },
  claimsBridge: { language: "solidity", code: claimsBridgeSource },
  premiumVault: { language: "solidity", code: premiumVaultSource }
};
