// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {RiskaPolicyMath} from "./RiskaPolicyMath.sol";

contract RiskaBeneficiaryRegistry is Ownable {
    struct Beneficiary {
        address account;
        uint16 shareBps;
    }

    uint256 public constant MAX_BENEFICIARIES = 8;

    address public policyManager;

    mapping(uint256 => Beneficiary[]) private policyBeneficiaries;

    event PolicyManagerUpdated(address indexed policyManager);
    event BeneficiariesSet(uint256 indexed policyId, uint256 count);

    modifier onlyPolicyManager() {
        require(msg.sender == policyManager, "ONLY_POLICY_MANAGER");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setPolicyManager(address nextPolicyManager) external onlyOwner {
        require(nextPolicyManager != address(0), "INVALID_POLICY_MANAGER");
        policyManager = nextPolicyManager;
        emit PolicyManagerUpdated(nextPolicyManager);
    }

    function setBeneficiaries(
        uint256 policyId,
        address[] memory accounts,
        uint16[] memory sharesBps
    ) external onlyPolicyManager {
        require(policyId != 0, "INVALID_POLICY");
        require(accounts.length == sharesBps.length, "BENEFICIARY_LENGTH");
        require(accounts.length > 0, "NO_BENEFICIARIES");
        require(accounts.length <= MAX_BENEFICIARIES, "TOO_MANY_BENEFICIARIES");
        require(RiskaPolicyMath.validateBeneficiaryShares(sharesBps), "INVALID_SHARES");

        delete policyBeneficiaries[policyId];

        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "INVALID_BENEFICIARY");

            for (uint256 j = 0; j < i; j++) {
                require(accounts[i] != accounts[j], "DUPLICATE_BENEFICIARY");
            }

            policyBeneficiaries[policyId].push(Beneficiary({account: accounts[i], shareBps: sharesBps[i]}));
        }

        emit BeneficiariesSet(policyId, accounts.length);
    }

    function beneficiaryCount(uint256 policyId) external view returns (uint256) {
        return policyBeneficiaries[policyId].length;
    }

    function beneficiaryAt(uint256 policyId, uint256 index) external view returns (address account, uint16 shareBps) {
        Beneficiary memory beneficiary = policyBeneficiaries[policyId][index];
        return (beneficiary.account, beneficiary.shareBps);
    }
}
