// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRiskaYieldAdapter {
    function asset() external view returns (address);
    function totalAssets() external view returns (uint256);
    function previewRedeem(uint256 shares) external view returns (uint256 assets);
    function deposit(uint256 assets) external returns (uint256 shares);
    function redeem(uint256 shares) external returns (uint256 assets);
}
