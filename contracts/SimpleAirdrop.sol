// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleAirdrop
 * @author Mihailo Maksa
 * @notice Simple airdrop claimer contract, inspired by Arbitrum's ARB token airdrop
 */
contract SimpleAirdrop is Ownable, Pausable {
  using SafeERC20 for IERC20;

  /// @notice The token that will be airdropped
  IERC20 public immutable token;

  /// @notice The address that will receive the leftovers after the airdrop is over
  address public sweepReceiver;

  /// @notice The amount of tokens that each recipient can claim
  mapping(address => uint256) public claimableTokens;

  /// @notice Emitted when a recipient is added to the airdrop
  event CanClaim(address indexed recipient, uint256 amount);

  /// @notice Emitted when a recipient claims their tokens
  event HasClaimed(address indexed recipient, uint256 amount);

  /// @notice Emitted when the leftovers are swept from the contract
  event Swept(uint256 amount);

  /**
   * @notice The constructor for the SimpleAirdrop contract
   * @param _token IERC20 - The address of the token that will be airdropped
   * @param _owner address - The address of the owner of the contract
   * @dev The token address cannot be the zero address
   * @dev The owner cannot be the zero address
   */
  constructor(IERC20 _token, address _owner) Ownable(_owner) {
    require(
      address(_token) != address(0),
      "SimpleAirdrop::constructor: Zero token address."
    );
    require(
      _owner != address(0),
      "SimpleAirdrop::constructor: Zero sweep address."
    );
    token = _token;
    sweepReceiver = _owner;
  }

  /// @notice Pauses the airdrop claiming
  function pause() external onlyOwner {
    _pause();
  }

  /// @notice Unpauses the airdrop claiming
  function unpause() external onlyOwner {
    _unpause();
  }

  /**
   * @notice Claims the tokens for the caller
   * @dev The caller cannot claim zero tokens
   */
  function claim() external whenNotPaused {
    uint256 amount = claimableTokens[msg.sender];
    require(amount > 0, "SimpleAirdrop::claim: Nothing to claim.");
    claimableTokens[msg.sender] = 0;
    token.safeTransfer(msg.sender, amount);
    emit HasClaimed(msg.sender, amount);
  }

  /**
   * @notice Sets the recipients of the airdrop
   * @param _recipients address[] calldata - The addresses of the recipients
   * @param _claimableAmount uint256[] calldata - The amounts of tokens that each recipient can claim
   * @dev The caller must be the owner of the contract
   * @dev The array lengths must match
   * @dev The recipients cannot be set more than once
   */
  function setRecipients(
    address[] calldata _recipients,
    uint256[] calldata _claimableAmount
  ) external onlyOwner {
    require(
      _recipients.length == _claimableAmount.length,
      "SimpleAirdrop::setRecipients: Array lengths mismatch."
    );

    for (uint256 i = 0; i < _recipients.length; i++) {
      require(
        claimableTokens[_recipients[i]] == 0,
        "SimpleAirdrop::setRecipients: Recipient already set."
      );
      claimableTokens[_recipients[i]] = _claimableAmount[i];
      emit CanClaim(_recipients[i], _claimableAmount[i]);
    }
  }

  /**
   * @notice Sweeps the leftovers from the contract
   * @dev The caller must be the owner of the contract
   * @dev The contract must have leftovers (i.e. non-claimed tokens)
   */
  function sweep() external onlyOwner {
    uint256 leftovers = token.balanceOf(address(this));
    require(leftovers != 0, "SimpleAirdrop::sweep: No leftovers.");
    token.safeTransfer(sweepReceiver, leftovers);
    emit Swept(leftovers);
  }
}
