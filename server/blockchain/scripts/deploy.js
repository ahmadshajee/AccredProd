const hre = require('hardhat');

async function main() {
  const AccredChainCredential = await hre.ethers.getContractFactory('AccredChainCredential');
  const credential = await AccredChainCredential.deploy();
  await credential.deployed();
  console.log('AccredChainCredential deployed to:', credential.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
