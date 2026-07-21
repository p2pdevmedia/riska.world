// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMintableTestToken {
    function mint(address to, uint256 amount) external;
}

/// @notice One-time public test-token claim faucet for World Chain Sepolia only.
/// @dev Each token must transfer ownership to this contract before claims can mint.
contract TestnetTokenFaucet {
    error AlreadyClaimed();
    error TestnetOnly();

    uint256 public constant WORLDCHAIN_SEPOLIA_CHAIN_ID = 4801;
    uint256 public constant USDC_AMOUNT = 15_000 * 10 ** 6;
    uint256 public constant BTC_AMOUNT = 2 * 10 ** 8;
    uint256 public constant ETH_AMOUNT = 5 * 10 ** 18;
    uint256 public constant SOL_AMOUNT = 50 * 10 ** 9;

    IMintableTestToken public immutable usdc;
    IMintableTestToken public immutable btc;
    IMintableTestToken public immutable eth;
    IMintableTestToken public immutable sol;

    mapping(address => bool) public claimed;

    event TokensClaimed(address indexed account, uint256 usdcAmount, uint256 btcAmount, uint256 ethAmount, uint256 solAmount);

    constructor(address usdc_, address btc_, address eth_, address sol_) {
        if (block.chainid != WORLDCHAIN_SEPOLIA_CHAIN_ID) revert TestnetOnly();
        usdc = IMintableTestToken(usdc_);
        btc = IMintableTestToken(btc_);
        eth = IMintableTestToken(eth_);
        sol = IMintableTestToken(sol_);
    }

    function claim() external {
        if (block.chainid != WORLDCHAIN_SEPOLIA_CHAIN_ID) revert TestnetOnly();
        if (claimed[msg.sender]) revert AlreadyClaimed();

        claimed[msg.sender] = true;
        usdc.mint(msg.sender, USDC_AMOUNT);
        btc.mint(msg.sender, BTC_AMOUNT);
        eth.mint(msg.sender, ETH_AMOUNT);
        sol.mint(msg.sender, SOL_AMOUNT);

        emit TokensClaimed(msg.sender, USDC_AMOUNT, BTC_AMOUNT, ETH_AMOUNT, SOL_AMOUNT);
    }
}
