// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library RiskaPolicyMath {
    uint16 internal constant BPS_DENOMINATOR = 10_000;
    uint16 internal constant WAITING_PERIOD_MONTHS = 12;
    uint16 internal constant CONTRIBUTION_MONTHS = 360;
    uint16 internal constant RETIREMENT_PAYOUT_MONTHS = 120;
    uint16 internal constant PRE_MATURITY_BENEFICIARY_BPS = 8_000;
    uint16 internal constant POST_MATURITY_BENEFICIARY_BPS = 9_000;

    uint8 internal constant USDC_DECIMALS = 6;
    uint256 internal constant MONTHLY_PREMIUM = 30 * 10 ** USDC_DECIMALS;
    uint256 internal constant FULL_TERM_PRINCIPAL = MONTHLY_PREMIUM * CONTRIBUTION_MONTHS;
    uint256 internal constant HOLDER_MONTHLY_PAYOUT = FULL_TERM_PRINCIPAL / RETIREMENT_PAYOUT_MONTHS;

    function paidPrincipal(uint16 paidMonths) internal pure returns (uint256) {
        require(paidMonths <= CONTRIBUTION_MONTHS, "PAID_MONTHS_TOO_HIGH");
        return uint256(paidMonths) * MONTHLY_PREMIUM;
    }

    function beneficiaryPayoutBeforeMaturity(uint16 paidMonths) internal pure returns (uint256) {
        require(paidMonths < CONTRIBUTION_MONTHS, "USE_MATURED_PAYOUT");

        if (paidMonths < WAITING_PERIOD_MONTHS) {
            return 0;
        }

        return (paidPrincipal(paidMonths) * PRE_MATURITY_BENEFICIARY_BPS) / BPS_DENOMINATOR;
    }

    function beneficiaryPayoutAfterMaturity(uint256 remainingBalance) internal pure returns (uint256) {
        return (remainingBalance * POST_MATURITY_BENEFICIARY_BPS) / BPS_DENOMINATOR;
    }

    function validateBeneficiaryShares(uint16[] memory sharesBps) internal pure returns (bool) {
        uint256 total;

        for (uint256 i = 0; i < sharesBps.length; i++) {
            if (sharesBps[i] == 0) {
                return false;
            }
            total += sharesBps[i];
        }

        return total == BPS_DENOMINATOR;
    }
}
