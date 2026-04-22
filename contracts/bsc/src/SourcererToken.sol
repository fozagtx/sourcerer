// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title SourcererToken
/// @notice Minimal ERC20 minted once in full supply to the factory during creation.
///         Metadata URI is stored on-chain so the indexer and frontend can fetch it without RPC hacks.
contract SourcererToken is ERC20, Ownable {
    string public tokenURI;
    string private _name;
    string private _symbol;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory uri_,
        uint256 totalSupply_,
        address mintTo_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        _name = name_;
        _symbol = symbol_;
        tokenURI = uri_;
        _mint(mintTo_, totalSupply_);
    }

    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function setTokenURI(string calldata uri_) external onlyOwner {
        tokenURI = uri_;
    }
}
