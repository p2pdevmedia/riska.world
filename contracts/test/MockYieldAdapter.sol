// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IRiskaYieldAdapter} from "../interfaces/IRiskaYieldAdapter.sol";

contract MockYieldAdapter is IRiskaYieldAdapter, Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant SHARE_SCALE = 1e18;

    IERC20 public immutable paymentToken;
    address public immutable manager;
    uint256 public assetsPerShare = SHARE_SCALE;
    bool public redeemShouldRevert;

    modifier onlyManager() {
        require(msg.sender == manager, "ONLY_MANAGER");
        _;
    }

    constructor(IERC20 paymentToken_, address manager_) Ownable(msg.sender) {
        require(address(paymentToken_) != address(0), "INVALID_TOKEN");
        require(manager_ != address(0), "INVALID_MANAGER");

        paymentToken = paymentToken_;
        manager = manager_;
    }

    function asset() external view returns (address) {
        return address(paymentToken);
    }

    function totalAssets() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }

    function previewRedeem(uint256 shares) external view returns (uint256 assets) {
        return _assetsForShares(shares);
    }

    function setAssetsPerShare(uint256 nextAssetsPerShare) external onlyOwner {
        require(nextAssetsPerShare > 0, "INVALID_RATE");
        assetsPerShare = nextAssetsPerShare;
    }

    function setRedeemShouldRevert(bool nextRedeemShouldRevert) external onlyOwner {
        redeemShouldRevert = nextRedeemShouldRevert;
    }

    function deposit(uint256 assets) external onlyManager returns (uint256 shares) {
        require(assets > 0, "INVALID_AMOUNT");

        shares = (assets * SHARE_SCALE) / assetsPerShare;
        require(shares > 0, "NO_SHARES");

        paymentToken.safeTransferFrom(msg.sender, address(this), assets);
    }

    function redeem(uint256 shares) external onlyManager returns (uint256 assets) {
        require(!redeemShouldRevert, "REDEEM_FAILED");
        require(shares > 0, "INVALID_SHARES");

        assets = _assetsForShares(shares);
        if (assets > 0) {
            paymentToken.safeTransfer(msg.sender, assets);
        }
    }

    function _assetsForShares(uint256 shares) private view returns (uint256) {
        return (shares * assetsPerShare) / SHARE_SCALE;
    }
}
