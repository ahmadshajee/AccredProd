import { expect } from "chai";
import { ethers } from "hardhat";

describe("AccredChainCredential", function () {
  async function deployFixture() {
    const [owner, issuer, student] = await ethers.getSigners();

    const AccredChainCredential = await ethers.getContractFactory("AccredChainCredential");
    const acc = await AccredChainCredential.deploy();

    await acc.registerIssuer(issuer.address);

    return { acc, owner, issuer, student };
  }

  it("Should issue a credential successfully", async function () {
    const { acc, issuer, student } = await deployFixture();

    const tx = await acc.connect(issuer).issueCredential(student.address, "ipfs://fake", "degree", 0);
    const receipt = await tx.wait();

    expect(await acc.ownerOf(1)).to.equal(student.address);
    expect(await acc.tokenURI(1)).to.equal("ipfs://fake");
  });

  it("Should block transfers for soulbound tokens", async function () {
    const { acc, issuer, student, owner } = await deployFixture();

    await acc.connect(issuer).issueCredential(student.address, "ipfs://fake", "degree", 0);
    await expect(acc.connect(student).transferFrom(student.address, owner.address, 1)).to.be.revertedWith("Credential is not transferable");
  });

  it("Should allow transfer if unlocked", async function () {
    const { acc, issuer, student, owner } = await deployFixture();

    await acc.connect(issuer).issueCredential(student.address, "ipfs://fake", "degree", 0);
    await acc.connect(owner).unlockTransfer(1);
    await acc.connect(student).transferFrom(student.address, owner.address, 1);
    expect(await acc.ownerOf(1)).to.equal(owner.address);
  });
});
