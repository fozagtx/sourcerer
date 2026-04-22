// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SourcererFactory} from "../src/SourcererFactory.sol";

contract DeployScript is Script {
    // PancakeSwap router addresses.
    address constant ROUTER_TESTNET = 0xD99D1c33F9fC3444f8101754aBC46c52416550D1;
    address constant ROUTER_MAINNET = 0x10ED43C718714eb63d5aA57B78B54704E256024E;

    function run() external {
        uint256 deployerPk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address feeRecipient = vm.envOr("FEE_RECIPIENT", vm.addr(deployerPk));
        bool isMainnet = block.chainid == 56;
        address router = isMainnet ? ROUTER_MAINNET : ROUTER_TESTNET;

        vm.startBroadcast(deployerPk);
        SourcererFactory factory = new SourcererFactory(
            vm.addr(deployerPk),
            feeRecipient,
            router,
            100,
            85 ether
        );
        vm.stopBroadcast();

        console.log("SourcererFactory deployed at", address(factory));
    }
}
