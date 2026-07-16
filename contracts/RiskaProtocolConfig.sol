// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Immutable parent configuration for all user-owned Riska vaults.
/// @dev Every mutable parameter is callable only by the Governor through a successful vote.
contract RiskaProtocolConfig {
    uint16 public constant BPS_DENOMINATOR = 10_000;

    IERC20 public immutable paymentToken;
    address public immutable governance;
    address public feeRecipient;
    uint16 public yieldFeeBps;
    bool public accountCreationEnabled;

    mapping(address => bool) public isYieldVaultAllowed;

    event FeeRecipientUpdated(address indexed feeRecipient);
    event YieldFeeBpsUpdated(uint16 yieldFeeBps);
    event YieldVaultUpdated(address indexed vault, bool allowed);
    event AccountCreationUpdated(bool enabled);

    modifier onlyGovernance() {
        require(msg.sender == governance, "ONLY_GOVERNANCE");
        _;
    }

    constructor(IERC20 paymentToken_, address governance_, address feeRecipient_, uint16 yieldFeeBps_) {
        require(address(paymentToken_) != address(0), "INVALID_TOKEN");
        require(governance_ != address(0), "INVALID_GOVERNANCE");
        require(feeRecipient_ != address(0), "INVALID_FEE_RECIPIENT");
        require(yieldFeeBps_ <= BPS_DENOMINATOR, "INVALID_FEE");

        paymentToken = paymentToken_;
        governance = governance_;
        feeRecipient = feeRecipient_;
        yieldFeeBps = yieldFeeBps_;
        accountCreationEnabled = true;
    }

    function setFeeRecipient(address nextFeeRecipient) external onlyGovernance {
        require(nextFeeRecipient != address(0), "INVALID_FEE_RECIPIENT");
        feeRecipient = nextFeeRecipient;
        emit FeeRecipientUpdated(nextFeeRecipient);
    }

    function setYieldFeeBps(uint16 nextYieldFeeBps) external onlyGovernance {
        require(nextYieldFeeBps <= BPS_DENOMINATOR, "INVALID_FEE");
        yieldFeeBps = nextYieldFeeBps;
        emit YieldFeeBpsUpdated(nextYieldFeeBps);
    }

    function setYieldVault(address vault, bool allowed) external onlyGovernance {
        require(vault != address(0), "INVALID_VAULT");
        isYieldVaultAllowed[vault] = allowed;
        emit YieldVaultUpdated(vault, allowed);
    }

    function setAccountCreationEnabled(bool enabled) external onlyGovernance {
        accountCreationEnabled = enabled;
        emit AccountCreationUpdated(enabled);
    }
}
