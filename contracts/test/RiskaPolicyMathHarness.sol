// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RiskaPolicyMath} from "../RiskaPolicyMath.sol";

contract RiskaPolicyMathHarness {
    function minimumMonthlyUnit() external pure returns (uint256) {
        return RiskaPolicyMath.MINIMUM_MONTHLY_UNIT;
    }

    function minimumPolicyMonths() external pure returns (uint16) {
        return RiskaPolicyMath.MINIMUM_POLICY_MONTHS;
    }

    function payoutMonths() external pure returns (uint16) {
        return RiskaPolicyMath.PAYOUT_MONTHS;
    }

    function minimumPolicyPrincipal() external pure returns (uint256) {
        return RiskaPolicyMath.MINIMUM_POLICY_PRINCIPAL;
    }

    function deathBeneficiaryBps() external pure returns (uint16) {
        return RiskaPolicyMath.DEATH_BENEFICIARY_BPS;
    }

    function deathFeeBps() external pure returns (uint16) {
        return RiskaPolicyMath.DEATH_FEE_BPS;
    }

    function yieldFeeBps() external pure returns (uint16) {
        return RiskaPolicyMath.YIELD_FEE_BPS;
    }

    function monthlyPayout(uint256 principal) external pure returns (uint256) {
        return RiskaPolicyMath.monthlyPayout(principal);
    }

    function deathPayout(uint256 remainingMinimumPrincipal, uint256 remainingExtraPrincipal)
        external
        pure
        returns (uint256 payout, uint256 retainedFee)
    {
        return RiskaPolicyMath.deathPayout(remainingMinimumPrincipal, remainingExtraPrincipal);
    }

    function validateBeneficiaryShares(uint16[] memory sharesBps) external pure returns (bool) {
        return RiskaPolicyMath.validateBeneficiaryShares(sharesBps);
    }
}
