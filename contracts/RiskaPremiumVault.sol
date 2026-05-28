// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {RiskaBeneficiaryRegistry} from "./RiskaBeneficiaryRegistry.sol";
import {RiskaPolicyMath} from "./RiskaPolicyMath.sol";

contract RiskaPremiumVault is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable paymentToken;
    RiskaBeneficiaryRegistry public immutable beneficiaryRegistry;

    address public policyManager;
    uint256 public totalPrincipalLiability;
    uint256 public protocolReserveBalance;
    mapping(address => uint256) public auxiliaryTokenLiability;

    event PolicyManagerUpdated(address indexed policyManager);
    event PremiumCollected(uint256 indexed policyId, address indexed holder, uint256 amount);
    event HolderPaid(uint256 indexed policyId, address indexed holder, uint256 amount);
    event BeneficiariesPaid(uint256 indexed policyId, uint256 payout, uint256 retained);
    event AuxiliaryTokenCollected(uint256 indexed policyId, address indexed holder, address indexed token, uint256 amount);
    event AuxiliaryTokenHolderPaid(uint256 indexed policyId, address indexed holder, address indexed token, uint256 amount);
    event AuxiliaryTokenBeneficiariesPaid(uint256 indexed policyId, address indexed token, uint256 amount);

    modifier onlyPolicyManager() {
        require(msg.sender == policyManager, "ONLY_POLICY_MANAGER");
        _;
    }

    constructor(IERC20 paymentToken_, RiskaBeneficiaryRegistry beneficiaryRegistry_) Ownable(msg.sender) {
        require(address(paymentToken_) != address(0), "INVALID_TOKEN");
        require(address(beneficiaryRegistry_) != address(0), "INVALID_REGISTRY");

        paymentToken = paymentToken_;
        beneficiaryRegistry = beneficiaryRegistry_;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setPolicyManager(address nextPolicyManager) external onlyOwner {
        require(nextPolicyManager != address(0), "INVALID_POLICY_MANAGER");
        policyManager = nextPolicyManager;
        emit PolicyManagerUpdated(nextPolicyManager);
    }

    function collectPremium(uint256 policyId, address holder, uint256 amount)
        external
        onlyPolicyManager
        whenNotPaused
        nonReentrant
    {
        require(policyId != 0, "INVALID_POLICY");
        require(holder != address(0), "INVALID_HOLDER");
        require(amount > 0, "INVALID_AMOUNT");

        totalPrincipalLiability += amount;
        paymentToken.safeTransferFrom(holder, address(this), amount);

        emit PremiumCollected(policyId, holder, amount);
    }

    function payHolder(uint256 policyId, address holder, uint256 amount)
        external
        onlyPolicyManager
        whenNotPaused
        nonReentrant
    {
        require(policyId != 0, "INVALID_POLICY");
        require(holder != address(0), "INVALID_HOLDER");
        require(amount > 0, "INVALID_AMOUNT");
        require(amount <= totalPrincipalLiability, "INSUFFICIENT_LIABILITY");

        totalPrincipalLiability -= amount;
        paymentToken.safeTransfer(holder, amount);

        emit HolderPaid(policyId, holder, amount);
    }

    function settleBeneficiaryPayout(uint256 policyId, uint256 releasedPrincipal, uint256 payout)
        external
        onlyPolicyManager
        whenNotPaused
        nonReentrant
    {
        require(policyId != 0, "INVALID_POLICY");
        require(payout <= releasedPrincipal, "PAYOUT_EXCEEDS_RELEASED");
        require(releasedPrincipal <= totalPrincipalLiability, "INSUFFICIENT_LIABILITY");

        totalPrincipalLiability -= releasedPrincipal;

        uint256 retained = releasedPrincipal - payout;
        protocolReserveBalance += retained;

        if (payout > 0) {
            _payBeneficiaries(policyId, payout);
        }

        emit BeneficiariesPaid(policyId, payout, retained);
    }

    function collectAuxiliaryToken(uint256 policyId, address holder, IERC20 token, uint256 amount)
        external
        onlyPolicyManager
        whenNotPaused
        nonReentrant
        returns (uint256 received)
    {
        require(policyId != 0, "INVALID_POLICY");
        require(holder != address(0), "INVALID_HOLDER");
        require(address(token) != address(0), "INVALID_TOKEN");
        require(address(token) != address(paymentToken), "PAYMENT_TOKEN_NOT_ALLOWED");
        require(amount > 0, "INVALID_AMOUNT");

        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(holder, address(this), amount);
        received = token.balanceOf(address(this)) - balanceBefore;
        require(received > 0, "NO_TOKEN_RECEIVED");

        auxiliaryTokenLiability[address(token)] += received;

        emit AuxiliaryTokenCollected(policyId, holder, address(token), received);
    }

    function payAuxiliaryTokenHolder(uint256 policyId, address holder, IERC20 token, uint256 amount)
        external
        onlyPolicyManager
        whenNotPaused
        nonReentrant
    {
        require(policyId != 0, "INVALID_POLICY");
        require(holder != address(0), "INVALID_HOLDER");
        require(address(token) != address(0), "INVALID_TOKEN");
        require(address(token) != address(paymentToken), "PAYMENT_TOKEN_NOT_ALLOWED");
        require(amount > 0, "INVALID_AMOUNT");
        require(amount <= auxiliaryTokenLiability[address(token)], "INSUFFICIENT_TOKEN_LIABILITY");

        auxiliaryTokenLiability[address(token)] -= amount;
        token.safeTransfer(holder, amount);

        emit AuxiliaryTokenHolderPaid(policyId, holder, address(token), amount);
    }

    function settleAuxiliaryTokenBeneficiaries(uint256 policyId, IERC20 token, uint256 amount)
        external
        onlyPolicyManager
        whenNotPaused
        nonReentrant
    {
        require(policyId != 0, "INVALID_POLICY");
        require(address(token) != address(0), "INVALID_TOKEN");
        require(address(token) != address(paymentToken), "PAYMENT_TOKEN_NOT_ALLOWED");
        require(amount > 0, "INVALID_AMOUNT");
        require(amount <= auxiliaryTokenLiability[address(token)], "INSUFFICIENT_TOKEN_LIABILITY");

        auxiliaryTokenLiability[address(token)] -= amount;
        _payBeneficiaries(policyId, token, amount);

        emit AuxiliaryTokenBeneficiariesPaid(policyId, address(token), amount);
    }

    function _payBeneficiaries(uint256 policyId, uint256 amount) private {
        _payBeneficiaries(policyId, paymentToken, amount);
    }

    function _payBeneficiaries(uint256 policyId, IERC20 token, uint256 amount) private {
        uint256 count = beneficiaryRegistry.beneficiaryCount(policyId);
        require(count > 0, "NO_BENEFICIARIES");

        uint256 remaining = amount;

        for (uint256 i = 0; i < count; i++) {
            (address account, uint16 shareBps) = beneficiaryRegistry.beneficiaryAt(policyId, i);
            uint256 share = i == count - 1 ? remaining : (amount * shareBps) / RiskaPolicyMath.BPS_DENOMINATOR;

            remaining -= share;
            token.safeTransfer(account, share);
        }
    }
}
