// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

/// @dev ERC-4626 test double. MetaMorpho vaults expose this same deposit/redeem surface.
contract MockERC4626Vault is ERC4626 {
    constructor(IERC20 asset_) ERC20("Mock Morpho USDC Vault", "mmUSDC") ERC4626(asset_) {}
}
