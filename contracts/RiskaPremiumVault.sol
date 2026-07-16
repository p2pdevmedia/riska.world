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
    address public yieldStrategyManager;
    uint256 public totalPrincipalLiability;
    uint256 public totalYieldPrincipal;
    uint256 public protocolReserveBalance;
    uint256 public protocolYieldReserveBalance;
    mapping(address => uint256) public auxiliaryTokenLiability;

    event PolicyManagerUpdated(address indexed policyManager);
    event YieldStrategyManagerUpdated(address indexed yieldStrategyManager);
    event PremiumCollected(uint256 indexed policyId, address indexed holder, uint256 amount);
    event HolderPaid(uint256 indexed policyId, address indexed holder, uint256 amount);
    event HolderClaimAllSettled(uint256 indexed policyId, address indexed holder, uint256 payout, uint256 retained);
    event BeneficiariesPaid(uint256 indexed policyId, uint256 payout, uint256 retained);
    event YieldPrincipalDeployed(uint256 indexed policyId, address indexed recipient, uint256 amount);
    event YieldPrincipalReturned(
        uint256 indexed policyId,
        uint256 costBasis,
        uint256 returnedAssets,
        uint256 protocolFee,
        uint256 policyGain,
        uint256 policyLoss
    );
    event ProtocolYieldReserveWithdrawn(address indexed recipient, uint256 amount);
    event AuxiliaryTokenCollected(uint256 indexed policyId, address indexed holder, address indexed token, uint256 amount);
    event AuxiliaryTokenHolderPaid(uint256 indexed policyId, address indexed holder, address indexed token, uint256 amount);
    event AuxiliaryTokenBeneficiariesPaid(uint256 indexed policyId, address indexed token, uint256 amount);

    modifier onlyPolicyManager() {
        require(msg.sender == policyManager, "ONLY_POLICY_MANAGER");
        _;
    }

    modifier onlyYieldStrategyManager() {
        require(msg.sender == yieldStrategyManager, "ONLY_YIELD_MANAGER");
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

    function setYieldStrategyManager(address nextYieldStrategyManager) external onlyOwner {
        require(nextYieldStrategyManager != address(0), "INVALID_YIELD_MANAGER");
        yieldStrategyManager = nextYieldStrategyManager;
        emit YieldStrategyManagerUpdated(nextYieldStrategyManager);
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
        require(amount <= idlePrincipalLiability(), "PRINCIPAL_DEPLOYED");

        totalPrincipalLiability -= amount;
        paymentToken.safeTransfer(holder, amount);

        emit HolderPaid(policyId, holder, amount);
    }

    function settleHolderClaimAll(uint256 policyId, address holder, uint256 releasedPrincipal, uint256 payout)
        external
        onlyPolicyManager
        whenNotPaused
        nonReentrant
    {
        require(policyId != 0, "INVALID_POLICY");
        require(holder != address(0), "INVALID_HOLDER");
        require(payout <= releasedPrincipal, "PAYOUT_EXCEEDS_RELEASED");
        require(releasedPrincipal <= totalPrincipalLiability, "INSUFFICIENT_LIABILITY");
        require(releasedPrincipal <= idlePrincipalLiability(), "PRINCIPAL_DEPLOYED");

        totalPrincipalLiability -= releasedPrincipal;

        uint256 retained = releasedPrincipal - payout;
        protocolReserveBalance += retained;

        if (payout > 0) {
            paymentToken.safeTransfer(holder, payout);
            emit HolderPaid(policyId, holder, payout);
        }

        emit HolderClaimAllSettled(policyId, holder, payout, retained);
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
        require(releasedPrincipal <= idlePrincipalLiability(), "PRINCIPAL_DEPLOYED");

        totalPrincipalLiability -= releasedPrincipal;

        uint256 retained = releasedPrincipal - payout;
        protocolReserveBalance += retained;

        if (payout > 0) {
            _payBeneficiaries(policyId, payout);
        }

        emit BeneficiariesPaid(policyId, payout, retained);
    }

    function transferPrincipalToYield(uint256 policyId, address recipient, uint256 amount)
        external
        onlyYieldStrategyManager
        whenNotPaused
        nonReentrant
    {
        require(policyId != 0, "INVALID_POLICY");
        require(recipient != address(0), "INVALID_RECIPIENT");
        require(amount > 0, "INVALID_AMOUNT");
        require(amount <= idlePrincipalLiability(), "INSUFFICIENT_IDLE_PRINCIPAL");

        totalYieldPrincipal += amount;
        paymentToken.safeTransfer(recipient, amount);

        emit YieldPrincipalDeployed(policyId, recipient, amount);
    }

    function receiveYieldReturn(uint256 policyId, uint256 costBasis, uint256 returnedAssets)
        external
        onlyYieldStrategyManager
        whenNotPaused
        nonReentrant
        returns (uint256 protocolFee, uint256 policyGain, uint256 policyLoss)
    {
        require(policyId != 0, "INVALID_POLICY");
        require(costBasis > 0, "INVALID_COST_BASIS");
        require(costBasis <= totalYieldPrincipal, "YIELD_PRINCIPAL_EXCEEDED");

        totalYieldPrincipal -= costBasis;

        if (returnedAssets > 0) {
            paymentToken.safeTransferFrom(msg.sender, address(this), returnedAssets);
        }

        if (returnedAssets >= costBasis) {
            uint256 grossGain = returnedAssets - costBasis;
            protocolFee = (grossGain * RiskaPolicyMath.YIELD_FEE_BPS) / RiskaPolicyMath.BPS_DENOMINATOR;
            policyGain = grossGain - protocolFee;

            totalPrincipalLiability += policyGain;
            protocolYieldReserveBalance += protocolFee;
        } else {
            policyLoss = costBasis - returnedAssets;
            require(policyLoss <= totalPrincipalLiability, "LOSS_EXCEEDS_LIABILITY");
            totalPrincipalLiability -= policyLoss;
        }

        emit YieldPrincipalReturned(policyId, costBasis, returnedAssets, protocolFee, policyGain, policyLoss);
    }

    function withdrawProtocolYieldReserve(address recipient, uint256 amount)
        external
        onlyOwner
        whenNotPaused
        nonReentrant
    {
        require(recipient != address(0), "INVALID_RECIPIENT");
        require(amount > 0, "INVALID_AMOUNT");
        require(amount <= protocolYieldReserveBalance, "YIELD_RESERVE_EXCEEDED");

        uint256 requiredIdlePrincipal = idlePrincipalLiability();
        uint256 available = paymentToken.balanceOf(address(this));
        require(available >= requiredIdlePrincipal + amount, "INSUFFICIENT_RESERVE_LIQUIDITY");

        protocolYieldReserveBalance -= amount;
        paymentToken.safeTransfer(recipient, amount);

        emit ProtocolYieldReserveWithdrawn(recipient, amount);
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

    function idlePrincipalLiability() public view returns (uint256) {
        return totalPrincipalLiability - totalYieldPrincipal;
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
