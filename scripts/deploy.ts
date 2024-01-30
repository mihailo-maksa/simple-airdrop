import hre, { ethers } from "hardhat";
import argsToken from "./args/argsToken";
import argsAirdrop from "./args/argsAirdrop";

async function main() {
  const network = hre.network.name;

  const simpleOft = await ethers.deployContract("SimpleOFT", argsToken);
  await simpleOft.waitForDeployment();
  console.log(`SimpleOFT deployed to: ${simpleOft.target} on ${network}`);

  // @ts-ignore
  argsAirdrop[0] = simpleOft.target;

  const simpleAirdrop = await ethers.deployContract(
    "SimpleAirdrop",
    argsAirdrop,
  );
  await simpleAirdrop.waitForDeployment();
  console.log(
    `SimpleAirdrop deployed to: ${simpleAirdrop.target} on ${network}`,
  );

  // send tokens to airdrop contract
  const tx = await simpleOft.transfer(
    simpleAirdrop.target,
    ethers.parseEther("100000000"), // 100 million (10% of total supply)
  );
  await tx.wait();
  console.log(`Sent 100 million tokens to airdrop contract`);

  // set airdrop recipients
  const tx2 = await simpleAirdrop.setRecipients(
    [
      "0x050c28CaF8b629c31ac919dA3d1DaA2548791D8F",
      "0xD8a8653ceD32364DeB582c900Cc3FcD16c34d6D5",
    ],
    [ethers.parseEther("1000"), ethers.parseEther("2000")],
  );
  await tx2.wait();
  console.log(`Set airdrop recipients`); // repeat this step for each recipient, preferably in a loop, and in batches
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
