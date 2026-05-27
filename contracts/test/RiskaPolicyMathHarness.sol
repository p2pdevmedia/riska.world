// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RiskaPolicyMath} from "../RiskaPolicyMath.sol";

contract RiskaPolicyMathHarness {
    function monthlyPremium() external pure returns (uint256) {
        return RiskaPolicyMath.MONTHLY_PREMIUM;
    }

    function waitingPeriodMonths() external pure returns (uint16) {
        return RiskaPolicyMath.WAITING_PERIOD_MONTHS;
    }

    function contributionMonths() external pure returns (uint16) {
        return RiskaPolicyMath.CONTRIBUTION_MONTHS;
    }

    function retirementPayoutMonths() external pure returns (uint16) {
        return RiskaPolicyMath.RETIREMENT_PAYOUT_MONTHS;
    }

    function fullTermPrincipal() external pure returns (uint256) {
        return RiskaPolicyMath.FULL_TERM_PRINCIPAL;
    }

    function holderMonthlyPayout() external pure returns (uint256) {
        return RiskaPolicyMath.HOLDER_MONTHLY_PAYOUT;
    }

    function paidPrincipal(uint16 paidMonths) external pure returns (uint256) {
        return RiskaPolicyMath.paidPrincipal(paidMonths);
    }

    function beneficiaryPayoutBeforeMaturity(uint16 paidMonths) external pure returns (uint256) {
        return RiskaPolicyMath.beneficiaryPayoutBeforeMaturity(paidMonths);
    }

    function beneficiaryPayoutAfterMaturity(uint256 remainingBalance) external pure returns (uint256) {
        return RiskaPolicyMath.beneficiaryPayoutAfterMaturity(remainingBalance);
    }

    function validateBeneficiaryShares(uint16[] memory sharesBps) external pure returns (bool) {
        return RiskaPolicyMath.validateBeneficiaryShares(sharesBps);
    }
}
