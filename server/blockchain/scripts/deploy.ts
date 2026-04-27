import { ethers } from "hardhat";

async function main() {
  const AccredChainCredential = await ethers.getContractFactory("AccredChainCredential");
  const credential = await AccredChainCredential.deploy();

  await credential.deployed();

  console.log("AccredChainCredential deployed to:", credential.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
