const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const DEFAULT_RPC_URL = 'http://127.0.0.1:8545';
const DEFAULT_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ARTIFACT_PATH = path.join(
  __dirname,
  '..',
  'blockchain',
  'artifacts',
  'contracts',
  'AccredChainCredential.sol',
  'AccredChainCredential.json'
);

const fallbackAbi = [
  'function issueCredential(address recipient, string ipfsCID, string credentialType, uint256 expiresAt) returns (uint256)',
  'function revokeCredential(uint256 tokenId)',
  'function isExpired(uint256 tokenId) view returns (bool)',
  'function isValid(uint256 tokenId) view returns (bool)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function credentials(uint256 tokenId) view returns (address issuer, string credentialType, uint256 issuedAt, uint256 expiresAt, bool isRevoked, bool transferable)',
  'event CredentialIssued(uint256 indexed tokenId, address indexed recipient, address indexed issuer, string credentialType)',
  'event CredentialRevoked(uint256 indexed tokenId)'
];

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function loadArtifactAbi() {
  try {
    if (!fs.existsSync(ARTIFACT_PATH)) {
      return null;
    }

    const raw = fs.readFileSync(ARTIFACT_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.abi) ? parsed.abi : null;
  } catch {
    return null;
  }
}

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || DEFAULT_RPC_URL);
const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY || DEFAULT_PRIVATE_KEY, provider);
const contractAddress = process.env.CONTRACT_ADDRESS || '';
const contractABI = loadArtifactAbi() || fallbackAbi;
const blockchainEnabled = parseBoolean(process.env.BLOCKCHAIN_ENABLED, Boolean(contractAddress));

const accredChainContract =
  blockchainEnabled && contractAddress
    ? new ethers.Contract(contractAddress, contractABI, wallet)
    : null;

function isBlockchainConfigured() {
  return Boolean(accredChainContract);
}

function getDefaultRecipientAddress() {
  return process.env.DEFAULT_RECIPIENT_ADDRESS || wallet.address;
}

async function issueCredentialOnChain({ recipient, tokenURI, credentialType = 'degree', expiresAt = 0 }) {
  if (!accredChainContract) {
    throw new Error('Blockchain contract is not configured.');
  }

  const tx = await accredChainContract.issueCredential(recipient, tokenURI, credentialType, expiresAt);
  const receipt = await tx.wait();

  let tokenId = null;
  for (const log of receipt.logs || []) {
    try {
      const parsed = accredChainContract.interface.parseLog(log);
      if (parsed?.name === 'CredentialIssued') {
        tokenId = parsed.args?.tokenId?.toString() || parsed.args?.[0]?.toString() || null;
        break;
      }
    } catch {
      // Ignore non-matching logs.
    }
  }

  return {
    tokenId,
    txHash: receipt.hash,
    receipt,
  };
}

async function revokeCredentialOnChain(tokenId) {
  if (!accredChainContract) {
    throw new Error('Blockchain contract is not configured.');
  }

  const tx = await accredChainContract.revokeCredential(tokenId);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    receipt,
  };
}

async function readCredentialOnChain(tokenId) {
  if (!accredChainContract) {
    return { available: false };
  }

  try {
    const [isValid, isExpired, tokenURI, details] = await Promise.all([
      accredChainContract.isValid(tokenId),
      accredChainContract.isExpired(tokenId),
      accredChainContract.tokenURI(tokenId),
      accredChainContract.credentials(tokenId),
    ]);

    return {
      available: true,
      isValid,
      isExpired,
      tokenURI,
      details: {
        issuer: details.issuer,
        credentialType: details.credentialType,
        issuedAt: Number(details.issuedAt),
        expiresAt: Number(details.expiresAt),
        isRevoked: details.isRevoked,
        transferable: details.transferable,
      },
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
    };
  }
}

module.exports = {
  provider,
  wallet,
  contractAddress,
  accredChainContract,
  isBlockchainConfigured,
  getDefaultRecipientAddress,
  issueCredentialOnChain,
  revokeCredentialOnChain,
  readCredentialOnChain,
};