import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer, Wallet } from "ethers";
import { delay } from "../utils/utils";

describe("SimpleAirdrop", () => {
  const setupFixture = async () => {
    const [owner, user1, user2] = await ethers.getSigners();

    const simpleOft = await ethers.deployContract("SimpleOFT", [
      owner.address,
      "Simple OFT",
      "SOFT",
      "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675", // ETH mainnet lzEndpoint (used as a placeholder)
      31337, // Hardhat local network chain ID
    ]);
    await simpleOft.waitForDeployment();

    const simpleAirdrop = await ethers.deployContract("SimpleAirdrop", [
      simpleOft.target,
      owner.address,
    ]);
    await simpleAirdrop.waitForDeployment();

    // send tokens to airdrop contract
    const tx = await simpleOft.transfer(
      simpleAirdrop.target,
      ethers.parseEther("100000000"), // 100 million (10% of total supply)
    );
    await tx.wait();

    return {
      owner,
      user1,
      user2,
      simpleOft,
      simpleAirdrop,
    };
  };

  describe("SimpleOFT", () => {
    it("should verify the deployment parameters", async () => {
      const { simpleOft, owner } = await setupFixture();

      expect(await simpleOft.owner()).to.equal(owner.address);
      expect(await simpleOft.name()).to.equal("Simple OFT");
      expect(await simpleOft.symbol()).to.equal("SOFT");
      expect(await simpleOft.lzEndpoint()).to.equal(
        "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
      );
      expect(await simpleOft.decimals()).to.equal(18);
    });

    it("should burn some tokens from the owner", async () => {
      const { simpleOft, owner } = await setupFixture();

      await simpleOft.burn(ethers.parseEther("1000"));

      expect(await simpleOft.balanceOf(owner.address)).to.equal(
        ethers.parseEther("899999000"),
      );
    });

    it("should transfer tokens from the owner to user1 and fail to burn 0 tokens or more than the user 1 has", async () => {
      const { simpleOft, user1 } = await setupFixture();

      await simpleOft.transfer(user1.address, ethers.parseEther("1000"));
      expect(await simpleOft.balanceOf(user1.address)).to.equal(
        ethers.parseEther("1000"),
      );

      await expect(simpleOft.burn(0)).to.be.revertedWith(
        "SimpleOFT::burn: Cannot burn zero tokens.",
      );
      await expect(
        simpleOft.connect(user1).burn(ethers.parseEther("1001")),
      ).to.be.revertedWith("SimpleOFT::burn: Burn amount exceeds balance.");
    });
  });

  describe("SimpleAirdrop", () => {
    it("should verify the deployment parameters", async () => {
      const { simpleOft, simpleAirdrop, owner } = await setupFixture();

      expect(await simpleAirdrop.owner()).to.equal(owner.address);
      expect(await simpleAirdrop.token()).to.equal(simpleOft.target);
    });

    it("should pause and unpause the airdrop", async () => {
      const { simpleAirdrop } = await setupFixture();

      await simpleAirdrop.pause();
      expect(await simpleAirdrop.paused()).to.equal(true);

      await simpleAirdrop.unpause();
      expect(await simpleAirdrop.paused()).to.equal(false);
    });

    it("should set recipients and verify the their claimable balances", async () => {
      const { simpleAirdrop, user1, user2 } = await setupFixture();

      await simpleAirdrop.setRecipients(
        [user1.address, user2.address],
        [ethers.parseEther("1000"), ethers.parseEther("2000")],
      );
      expect(await simpleAirdrop.claimableTokens(user1.address)).to.equal(
        ethers.parseEther("1000"),
      );
      expect(await simpleAirdrop.claimableTokens(user2.address)).to.equal(
        ethers.parseEther("2000"),
      );
    });

    it("should claim airdrop tokens and verify the balances", async () => {
      const { simpleOft, simpleAirdrop, user1, user2 } = await setupFixture();

      await simpleAirdrop.setRecipients(
        [user1.address, user2.address],
        [ethers.parseEther("1000"), ethers.parseEther("2000")],
      );

      await simpleAirdrop.connect(user1).claim();
      expect(await simpleOft.balanceOf(user1.address)).to.equal(
        ethers.parseEther("1000"),
      );

      await simpleAirdrop.connect(user2).claim();
      expect(await simpleOft.balanceOf(user2.address)).to.equal(
        ethers.parseEther("2000"),
      );
    });

    it("should fail to claim twice for user1", async () => {
      const { simpleAirdrop, user1 } = await setupFixture();

      await simpleAirdrop.setRecipients(
        [user1.address],
        [ethers.parseEther("1000")],
      );

      await simpleAirdrop.connect(user1).claim();
      expect(await simpleAirdrop.claimableTokens(user1.address)).to.equal(0);

      await expect(simpleAirdrop.connect(user1).claim()).to.be.revertedWith(
        "SimpleAirdrop::claim: Nothing to claim.",
      );
    });

    it("should fail to set a recipient twice and to have an array length mismatch", async () => {
      const { simpleAirdrop, user1 } = await setupFixture();

      await simpleAirdrop.setRecipients(
        [user1.address],
        [ethers.parseEther("1000")],
      );
      expect(await simpleAirdrop.claimableTokens(user1.address)).to.equal(
        ethers.parseEther("1000"),
      );

      await expect(
        simpleAirdrop.setRecipients(
          [user1.address],
          [ethers.parseEther("1000")],
        ),
      ).to.be.revertedWith(
        "SimpleAirdrop::setRecipients: Recipient already set.",
      );

      await expect(
        simpleAirdrop.setRecipients(
          [user1.address, user1.address],
          [ethers.parseEther("1000")],
        ),
      ).to.be.revertedWith(
        "SimpleAirdrop::setRecipients: Array lengths mismatch.",
      );
      await expect(
        simpleAirdrop.setRecipients(
          [user1.address],
          [ethers.parseEther("1000"), ethers.parseEther("1000")],
        ),
      ).to.be.revertedWith(
        "SimpleAirdrop::setRecipients: Array lengths mismatch.",
      );
    });

    it("should fail to claim when paused", async () => {
      const { simpleAirdrop, user1 } = await setupFixture();

      await simpleAirdrop.setRecipients(
        [user1.address],
        [ethers.parseEther("1000")],
      );
      expect(await simpleAirdrop.claimableTokens(user1.address)).to.equal(
        ethers.parseEther("1000"),
      );

      await simpleAirdrop.pause();
      expect(await simpleAirdrop.paused()).to.equal(true);

      await expect(simpleAirdrop.connect(user1).claim()).to.be.reverted;
    });

    it("should fail to claim when the recipient is not set", async () => {
      const { simpleAirdrop, user1 } = await setupFixture();

      await expect(simpleAirdrop.connect(user1).claim()).to.be.revertedWith(
        "SimpleAirdrop::claim: Nothing to claim.",
      );
    });

    it("should fail to claim when the claimable balance is 0", async () => {
      const { simpleAirdrop, user1 } = await setupFixture();

      await simpleAirdrop.setRecipients(
        [user1.address],
        [ethers.parseEther("0")],
      );
      expect(await simpleAirdrop.claimableTokens(user1.address)).to.equal(0);

      await expect(simpleAirdrop.connect(user1).claim()).to.be.revertedWith(
        "SimpleAirdrop::claim: Nothing to claim.",
      );
    });

    it("should sweep leftover tokens to the owner", async () => {
      const { simpleOft, simpleAirdrop, owner, user1 } = await setupFixture();

      await simpleAirdrop.setRecipients(
        [user1.address],
        [ethers.parseEther("1000")],
      );
      expect(await simpleAirdrop.claimableTokens(user1.address)).to.equal(
        ethers.parseEther("1000"),
      );
      await simpleAirdrop.connect(user1).claim();

      await simpleAirdrop.sweep();
      expect(await simpleOft.balanceOf(owner.address)).to.equal(
        ethers.parseEther("999999000"),
      );
    });

    it("Should fail to sweep tokens twice", async () => {
      const { simpleAirdrop, owner } = await setupFixture();

      await simpleAirdrop.sweep();
      expect(await simpleAirdrop.claimableTokens(owner.address)).to.equal(0);

      await expect(simpleAirdrop.sweep()).to.be.revertedWith(
        "SimpleAirdrop::sweep: No leftovers.",
      );
    });
  });
});
