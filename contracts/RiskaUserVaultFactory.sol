// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RiskaProtocolConfig} from "./RiskaProtocolConfig.sol";
import {RiskaUserVault} from "./RiskaUserVault.sol";

/// @notice Permissionless factory. Each address can create exactly one isolated RiskaUserVault.
contract RiskaUserVaultFactory {
    RiskaProtocolConfig public immutable config;
    mapping(address => address) public vaultOf;
    address[] private vaults;

    event UserVaultCreated(address indexed owner, address indexed vault, uint256 index);

    constructor(RiskaProtocolConfig config_) {
        require(address(config_) != address(0), "INVALID_CONFIG");
        config = config_;
    }

    function createVault() external returns (address vault) {
        require(config.accountCreationEnabled(), "CREATION_DISABLED");
        require(vaultOf[msg.sender] == address(0), "VAULT_EXISTS");

        vault = address(new RiskaUserVault{salt: bytes32(uint256(uint160(msg.sender)))}(msg.sender, config));
        vaultOf[msg.sender] = vault;
        vaults.push(vault);
        emit UserVaultCreated(msg.sender, vault, vaults.length - 1);
    }

    function vaultCount() external view returns (uint256) {
        return vaults.length;
    }

    function vaultAt(uint256 index) external view returns (address) {
        return vaults[index];
    }
}
