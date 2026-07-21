// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {RiskaProtocolConfig} from "./RiskaProtocolConfig.sol";

/// @notice A user-owned USDC account. Idle funds stay here; yield is opt-in per approved ERC-4626 vault.
contract RiskaUserVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct YieldPosition {
        uint256 shares;
        uint256 costBasis;
    }

    RiskaProtocolConfig public immutable config;
    IERC20 public immutable paymentToken;
    mapping(address => YieldPosition) public yieldPositions;

    event Deposited(address indexed owner, uint256 assets);
    event Withdrawn(address indexed owner, uint256 assets);
    event YieldDeposited(address indexed vault, uint256 assets, uint256 shares);
    event YieldWithdrawn(address indexed vault, uint256 shares, uint256 returnedAssets, uint256 fee);

    constructor(address owner_, RiskaProtocolConfig config_) Ownable(owner_) {
        require(address(config_) != address(0), "INVALID_CONFIG");
        config = config_;
        paymentToken = config_.paymentToken();
    }

    function idleAssets() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }

    function deposit(uint256 assets) external onlyOwner nonReentrant {
        require(assets > 0, "INVALID_AMOUNT");
        paymentToken.safeTransferFrom(msg.sender, address(this), assets);
        emit Deposited(msg.sender, assets);
    }

    function withdrawIdle(uint256 assets) external onlyOwner nonReentrant {
        require(assets > 0, "INVALID_AMOUNT");
        paymentToken.safeTransfer(msg.sender, assets);
        emit Withdrawn(msg.sender, assets);
    }

    function depositToYield(address vault, uint256 assets, uint256 minSharesOut)
        external
        onlyOwner
        nonReentrant
        returns (uint256 shares)
    {
        require(config.isYieldVaultAllowed(vault), "VAULT_NOT_ALLOWED");
        require(IERC4626(vault).asset() == address(paymentToken), "INVALID_ASSET");
        require(assets > 0, "INVALID_AMOUNT");

        paymentToken.forceApprove(vault, assets);
        shares = IERC4626(vault).deposit(assets, address(this));
        require(shares >= minSharesOut, "MIN_SHARES");

        YieldPosition storage position = yieldPositions[vault];
        position.shares += shares;
        position.costBasis += assets;
        emit YieldDeposited(vault, assets, shares);
    }

    function withdrawFromYield(address vault, uint256 shares, uint256 minAssetsOut)
        external
        onlyOwner
        nonReentrant
        returns (uint256 returnedAssets, uint256 fee)
    {
        YieldPosition storage position = yieldPositions[vault];
        require(shares > 0 && shares <= position.shares, "INVALID_SHARES");

        uint256 costBasisPortion = (position.costBasis * shares) / position.shares;
        position.shares -= shares;
        position.costBasis -= costBasisPortion;

        returnedAssets = IERC4626(vault).redeem(shares, address(this), address(this));
        require(returnedAssets >= minAssetsOut, "MIN_ASSETS");

        if (returnedAssets > costBasisPortion) {
            fee = ((returnedAssets - costBasisPortion) * config.yieldFeeBps()) / config.BPS_DENOMINATOR();
            if (fee > 0) paymentToken.safeTransfer(config.feeRecipient(), fee);
        }

        emit YieldWithdrawn(vault, shares, returnedAssets, fee);
    }
}
