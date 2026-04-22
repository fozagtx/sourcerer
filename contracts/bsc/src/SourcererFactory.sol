// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SourcererToken} from "./SourcererToken.sol";

interface IPancakeRouter {
    function factory() external view returns (address);
    function WETH() external view returns (address);
    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity);
}

interface IPancakeFactory {
    function getPair(address tokenA, address tokenB) external view returns (address);
}

/// @title SourcererFactory
/// @notice Creates ERC20 memecoins on BNB Chain with a virtual constant-product bonding curve.
///         Mirrors the Solana launcher: 1B total supply, 793.1M live on the curve, 30 BNB virtual reserves,
///         ~85 BNB graduation threshold; graduated tokens seed a PancakeSwap pair and LP is burned.
contract SourcererFactory is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether;
    uint256 public constant CURVE_TOKEN_SUPPLY = 793_100_000 ether;
    uint256 public constant VIRTUAL_BNB_RESERVES = 30 ether;
    uint256 public constant VIRTUAL_TOKEN_RESERVES = 1_073_000_000 ether;
    uint256 public constant GRADUATION_LP_TOKENS = TOTAL_SUPPLY - CURVE_TOKEN_SUPPLY; // 206.9M

    uint16 public feeBps;
    uint256 public graduationThreshold;
    address public feeRecipient;
    IPancakeRouter public immutable pancakeRouter;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    struct Curve {
        address creator;
        uint128 virtualBnb;
        uint128 virtualTokens;
        uint128 realBnb;
        uint128 realTokens;
        bool complete;
        uint64 createdAt;
    }

    mapping(address => Curve) public curves;
    address[] public allTokens;

    event TokenCreated(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        string uri,
        uint256 timestamp
    );

    event Traded(
        address indexed token,
        address indexed trader,
        bool isBuy,
        uint256 bnbAmount,
        uint256 tokenAmount,
        uint256 feeAmount,
        uint128 virtualBnb,
        uint128 virtualTokens,
        uint128 realBnb,
        uint128 realTokens,
        uint256 timestamp
    );

    event Graduated(address indexed token, address pair, uint256 bnbAmount, uint256 tokenAmount);

    error ZeroAmount();
    error Slippage();
    error AlreadyGraduated();
    error NotReady();
    error FeeTooHigh();

    constructor(
        address _owner,
        address _feeRecipient,
        address _pancakeRouter,
        uint16 _feeBps,
        uint256 _graduationThreshold
    ) Ownable(_owner) {
        if (_feeBps > 500) revert FeeTooHigh();
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
        graduationThreshold = _graduationThreshold;
        pancakeRouter = IPancakeRouter(_pancakeRouter);
    }

    function setFee(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > 500) revert FeeTooHigh();
        feeBps = newFeeBps;
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
    }

    function setGraduationThreshold(uint256 newThreshold) external onlyOwner {
        graduationThreshold = newThreshold;
    }

    function allTokensLength() external view returns (uint256) {
        return allTokens.length;
    }

    function createToken(
        string calldata name_,
        string calldata symbol_,
        string calldata uri_
    ) external returns (address token) {
        SourcererToken deployed = new SourcererToken(name_, symbol_, uri_, TOTAL_SUPPLY, address(this));
        token = address(deployed);

        curves[token] = Curve({
            creator: msg.sender,
            virtualBnb: uint128(VIRTUAL_BNB_RESERVES),
            virtualTokens: uint128(VIRTUAL_TOKEN_RESERVES),
            realBnb: 0,
            realTokens: uint128(CURVE_TOKEN_SUPPLY),
            complete: false,
            createdAt: uint64(block.timestamp)
        });
        allTokens.push(token);

        emit TokenCreated(token, msg.sender, name_, symbol_, uri_, block.timestamp);
    }

    /// @dev tokens_out = virtual_tokens - (virtual_bnb * virtual_tokens) / (virtual_bnb + bnb_in)
    function quoteBuy(address token, uint256 bnbIn) public view returns (uint256 tokensOut, uint256 fee) {
        Curve memory c = curves[token];
        fee = (bnbIn * feeBps) / 10_000;
        uint256 net = bnbIn - fee;
        uint256 k = uint256(c.virtualBnb) * uint256(c.virtualTokens);
        uint256 newVb = uint256(c.virtualBnb) + net;
        uint256 newVt = k / newVb;
        tokensOut = uint256(c.virtualTokens) - newVt;
    }

    /// @dev bnb_out = virtual_bnb - (virtual_bnb * virtual_tokens) / (virtual_tokens + tokens_in)
    function quoteSell(address token, uint256 tokensIn) public view returns (uint256 bnbOut, uint256 fee) {
        Curve memory c = curves[token];
        uint256 k = uint256(c.virtualBnb) * uint256(c.virtualTokens);
        uint256 newVt = uint256(c.virtualTokens) + tokensIn;
        uint256 newVb = k / newVt;
        uint256 gross = uint256(c.virtualBnb) - newVb;
        fee = (gross * feeBps) / 10_000;
        bnbOut = gross - fee;
    }

    function buy(address token, uint256 minTokensOut) external payable nonReentrant {
        Curve storage c = curves[token];
        if (c.complete) revert AlreadyGraduated();
        if (msg.value == 0) revert ZeroAmount();

        (uint256 tokensOut, uint256 fee) = quoteBuy(token, msg.value);
        if (tokensOut < minTokensOut) revert Slippage();
        if (tokensOut > c.realTokens) revert Slippage();

        uint256 net = msg.value - fee;
        if (fee > 0) {
            (bool ok, ) = feeRecipient.call{value: fee}("");
            require(ok, "fee xfer");
        }

        c.virtualBnb = uint128(uint256(c.virtualBnb) + net);
        c.virtualTokens = uint128(uint256(c.virtualTokens) - tokensOut);
        c.realBnb = uint128(uint256(c.realBnb) + net);
        c.realTokens = uint128(uint256(c.realTokens) - tokensOut);

        IERC20(token).safeTransfer(msg.sender, tokensOut);

        if (uint256(c.realBnb) >= graduationThreshold && !c.complete) {
            c.complete = true;
            _graduate(token);
        }

        emit Traded(
            token,
            msg.sender,
            true,
            msg.value,
            tokensOut,
            fee,
            c.virtualBnb,
            c.virtualTokens,
            c.realBnb,
            c.realTokens,
            block.timestamp
        );
    }

    function sell(address token, uint256 tokensIn, uint256 minBnbOut) external nonReentrant {
        Curve storage c = curves[token];
        if (c.complete) revert AlreadyGraduated();
        if (tokensIn == 0) revert ZeroAmount();

        (uint256 bnbOut, uint256 fee) = quoteSell(token, tokensIn);
        uint256 gross = bnbOut + fee;
        // Absorb constant-product rounding (gross can exceed realBnb by a few wei
        // when the last holder sells everything back).
        if (gross > c.realBnb) {
            gross = c.realBnb;
            fee = (gross * feeBps) / 10_000;
            bnbOut = gross - fee;
        }
        if (bnbOut < minBnbOut) revert Slippage();

        IERC20(token).safeTransferFrom(msg.sender, address(this), tokensIn);

        c.virtualBnb = uint128(uint256(c.virtualBnb) - gross);
        c.virtualTokens = uint128(uint256(c.virtualTokens) + tokensIn);
        c.realBnb = uint128(uint256(c.realBnb) - gross);
        c.realTokens = uint128(uint256(c.realTokens) + tokensIn);

        (bool ok, ) = msg.sender.call{value: bnbOut}("");
        require(ok, "bnb xfer");
        if (fee > 0) {
            (bool fok, ) = feeRecipient.call{value: fee}("");
            require(fok, "fee xfer");
        }

        emit Traded(
            token,
            msg.sender,
            false,
            bnbOut,
            tokensIn,
            fee,
            c.virtualBnb,
            c.virtualTokens,
            c.realBnb,
            c.realTokens,
            block.timestamp
        );
    }

    /// @notice Anyone may trigger graduation if the curve has reached the threshold.
    function graduate(address token) external nonReentrant {
        Curve storage c = curves[token];
        if (c.complete) revert AlreadyGraduated();
        if (uint256(c.realBnb) < graduationThreshold) revert NotReady();
        c.complete = true;
        _graduate(token);
    }

    function _graduate(address token) internal {
        Curve storage c = curves[token];
        uint256 bnbSeed = c.realBnb;
        uint256 tokenSeed = GRADUATION_LP_TOKENS;

        IERC20(token).forceApprove(address(pancakeRouter), tokenSeed);
        (, , uint256 liquidity) = pancakeRouter.addLiquidityETH{value: bnbSeed}(
            token,
            tokenSeed,
            0,
            0,
            address(this),
            block.timestamp + 600
        );

        address pair = IPancakeFactory(pancakeRouter.factory()).getPair(token, pancakeRouter.WETH());
        if (pair != address(0) && liquidity > 0) {
            IERC20(pair).safeTransfer(BURN_ADDRESS, liquidity);
        }

        SourcererToken(token).renounceOwnership();

        emit Graduated(token, pair, bnbSeed, tokenSeed);
    }

    receive() external payable {}
}
