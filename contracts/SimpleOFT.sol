// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@layerzerolabs/solidity-examples/contracts/token/oft/v1/OFT.sol";

/**
 * @title SimpleOFT
 * @author Mihailo Maksa
 * @notice Simple OFT (omnichain fungible token) ERC20 token powered by LayerZero
 */
contract SimpleOFT is OFT {
  /**
   * @notice The constructor for the SimpleOFT contract
   * @param _owner address - The address of the owner of the contract
   * @param _name string memory - Name of the token
   * @param _symbol string memory - Symbol of the token
   * @param _lzEndpoint address - The address of the LayerZero endpoint on the chain of deployment
   * @param _mainChainId uint256 - The chain ID of the main chain
   * @dev The owner cannot be the zero address
   * @dev The LayerZero endpoint cannot be the zero address
   * @dev The main chain ID cannot be zero
   * @dev The contract will mint the max supply of 1 billion tokens to the owner on the main chain
   */
  constructor(
    address _owner,
    string memory _name,
    string memory _symbol,
    address _lzEndpoint,
    uint256 _mainChainId
  ) OFT(_name, _symbol, _lzEndpoint) {
    require(
      _owner != address(0),
      "SimpleOFT::constructor: Zero owner address."
    );
    require(
      _lzEndpoint != address(0),
      "SimpleOFT::constructor: Invalid LayerZero endpoint address."
    );
    require(
      _mainChainId != 0,
      "SimpleOFT::constructor: Invalid main chain ID."
    );

    uint256 chainId;

    assembly {
      chainId := chainid()
    }

    if (chainId == _mainChainId) {
      _mint(_owner, 1000000000 * 10 ** 18);
    }
  }

  /**
   * @notice Burns the specified amount of tokens from the caller's balance
   * @param _amount uint256 - The amount of tokens to burn
   * @dev The caller cannot burn zero tokens
   * @dev The caller cannot burn more tokens than they have
   */
  function burn(uint256 _amount) external {
    require(_amount > 0, "SimpleOFT::burn: Cannot burn zero tokens.");
    require(
      balanceOf(msg.sender) >= _amount,
      "SimpleOFT::burn: Burn amount exceeds balance."
    );

    _burn(msg.sender, _amount);
  }
}
