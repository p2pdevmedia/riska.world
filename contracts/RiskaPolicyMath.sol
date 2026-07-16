// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library RiskaPolicyMath {
    uint16 internal constant BPS_DENOMINATOR = 10_000;
    uint16 internal constant MINIMUM_POLICY_MONTHS = 360;
    uint16 internal constant PAYOUT_MONTHS = 120;
    uint16 internal constant DEATH_BENEFICIARY_BPS = 8_000;
    uint16 internal constant DEATH_FEE_BPS = 2_000;
    uint16 internal constant YIELD_FEE_BPS = 1_000;

    uint8 internal constant USDC_DECIMALS = 6;
    uint256 internal constant MINIMUM_MONTHLY_UNIT = 30 * 10 ** USDC_DECIMALS;
    uint256 internal constant MINIMUM_POLICY_PRINCIPAL = MINIMUM_MONTHLY_UNIT * MINIMUM_POLICY_MONTHS;

    function monthlyPayout(uint256 principal) internal pure returns (uint256) {
        return principal / PAYOUT_MONTHS;
    }

    function minimumFeePayout(uint256 remainingMinimumPrincipal, uint256 remainingExtraPrincipal)
        internal
        pure
        returns (uint256 payout, uint256 retainedFee)
    {
        retainedFee = (remainingMinimumPrincipal * DEATH_FEE_BPS) / BPS_DENOMINATOR;
        payout = remainingExtraPrincipal + remainingMinimumPrincipal - retainedFee;
    }

    function deathPayout(uint256 remainingMinimumPrincipal, uint256 remainingExtraPrincipal)
        internal
        pure
        returns (uint256 payout, uint256 retainedFee)
    {
        return minimumFeePayout(remainingMinimumPrincipal, remainingExtraPrincipal);
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
