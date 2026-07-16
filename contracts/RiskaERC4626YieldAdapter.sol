// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

import {IRiskaYieldAdapter} from "./interfaces/IRiskaYieldAdapter.sol";

contract RiskaERC4626YieldAdapter is IRiskaYieldAdapter {
    using SafeERC20 for IERC20;

    IERC20 public immutable paymentToken;
    IERC4626 public immutable vault;
    address public immutable manager;

    modifier onlyManager() {
        require(msg.sender == manager, "ONLY_MANAGER");
        _;
    }

    constructor(IERC4626 vault_, address manager_) {
        require(address(vault_) != address(0), "INVALID_VAULT");
        require(manager_ != address(0), "INVALID_MANAGER");

        vault = vault_;
        paymentToken = IERC20(vault_.asset());
        manager = manager_;
    }

    function asset() external view returns (address) {
        return address(paymentToken);
    }

    function totalAssets() external view returns (uint256) {
        return vault.convertToAssets(vault.balanceOf(address(this)));
    }

    function previewRedeem(uint256 shares) external view returns (uint256 assets) {
        return vault.previewRedeem(shares);
    }

    function deposit(uint256 assets) external onlyManager returns (uint256 shares) {
        require(assets > 0, "INVALID_AMOUNT");

        paymentToken.safeTransferFrom(msg.sender, address(this), assets);
        paymentToken.forceApprove(address(vault), assets);

        shares = vault.deposit(assets, address(this));
        require(shares > 0, "NO_SHARES");
    }

    function redeem(uint256 shares) external onlyManager returns (uint256 assets) {
        require(shares > 0, "INVALID_SHARES");

        assets = vault.redeem(shares, address(this), address(this));
        if (assets > 0) {
            paymentToken.safeTransfer(msg.sender, assets);
        }
    }
}
