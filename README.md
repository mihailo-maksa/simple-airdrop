# Simple OFT Airdrop

Simple OFT Airdrop contracts, inspired by Arbitrum's ARB token airdrop and powered by LayerZero.

Potential considerations, modifications and variations to the `SimpleAirdrop.sol` contract:

- Make the claim process non-pausable by removing the use of `Pausable.sol` from the contract.
- Make the leftover tokens be burned instead of being sent to the owner.
- Enforce airdrop start and end dates.
- Don't allow the owner to sweep or burn the leftover tokens before the airdrop end date.
- Introduce multiple airdrop rounds.
- Include token transfers directly into the `setRecipient` function. (note that this approach will consume significantly more gas)
