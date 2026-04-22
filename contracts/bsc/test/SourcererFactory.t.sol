// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {SourcererFactory} from "../src/SourcererFactory.sol";
import {SourcererToken} from "../src/SourcererToken.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev Uses a mock router so we can run locally without a PancakeSwap fork.
contract MockRouter {
    address public factoryAddr = address(0xdead);
    address public wethAddr = address(0xbeef);

    function factory() external view returns (address) {
        return factoryAddr;
    }

    function WETH() external view returns (address) {
        return wethAddr;
    }

    function addLiquidityETH(
        address,
        uint256 amountTokenDesired,
        uint256,
        uint256,
        address,
        uint256
    ) external payable returns (uint256, uint256, uint256) {
        return (amountTokenDesired, msg.value, 1 ether);
    }
}

contract MockFactory {
    function getPair(address, address) external pure returns (address) {
        return address(0);
    }
}

contract SourcererFactoryTest is Test {
    SourcererFactory internal factory;
    MockRouter internal router;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    address internal feeRecipient = address(0xFEE);

    function setUp() public {
        router = new MockRouter();
        factory = new SourcererFactory(
            address(this),
            feeRecipient,
            address(router),
            100,
            85 ether
        );
        vm.deal(alice, 100 ether);
        vm.deal(bob, 50 ether);
    }

    function testCreateAndBuy() public {
        vm.prank(alice);
        address token = factory.createToken("Pepe Coin", "PEPE", "ipfs://meta");

        uint256 before = alice.balance;
        vm.prank(alice);
        factory.buy{value: 1 ether}(token, 0);

        assertLt(alice.balance, before);
        uint256 bal = IERC20(token).balanceOf(alice);
        assertGt(bal, 0);
    }

    function testBuyThenSellRoundtripApprox() public {
        vm.prank(alice);
        address token = factory.createToken("Pepe Coin", "PEPE", "ipfs://meta");

        vm.prank(alice);
        factory.buy{value: 2 ether}(token, 0);
        uint256 bal = IERC20(token).balanceOf(alice);

        vm.prank(alice);
        IERC20(token).approve(address(factory), bal);
        uint256 balBefore = alice.balance;
        vm.prank(alice);
        factory.sell(token, bal, 0);
        uint256 recovered = alice.balance - balBefore;

        // Two round-trip fees (1% each) ≈ 2% loss.
        assertGt(recovered, 1.9 ether);
        assertLt(recovered, 2 ether);
    }
}
