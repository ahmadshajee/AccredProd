const crypto = require('crypto');

function isEnabled(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function createMockIpfsResult(metadataJSON) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(metadataJSON)).digest('hex');
  return {
    provider: 'mock',
    cid: hash,
    uri: `ipfs://${hash}`,
  };
}

async function uploadViaPinata(metadataJSON) {
  const pinataJwt = process.env.PINATA_JWT;
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataApiSecret = process.env.PINATA_API_SECRET;

  const hasJwt = Boolean(pinataJwt);
  const hasApiKeyPair = Boolean(pinataApiKey && pinataApiSecret);

  if (!hasJwt && !hasApiKeyPair) {
    return null;
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (hasJwt) {
    headers.Authorization = `Bearer ${pinataJwt}`;
  } else {
    headers.pinata_api_key = pinataApiKey;
    headers.pinata_secret_api_key = pinataApiSecret;
  }

  const payload = {
    pinataContent: metadataJSON,
    pinataMetadata: {
      name: `accredchain-${Date.now()}`,
    },
  };

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata upload failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (!data?.IpfsHash) {
    throw new Error('Pinata upload failed: missing IpfsHash in response.');
  }

  return {
    provider: 'pinata',
    cid: data.IpfsHash,
    uri: `ipfs://${data.IpfsHash}`,
  };
}

async function uploadToIPFS(metadataJSON) {
  const provider = String(process.env.IPFS_PROVIDER || 'auto').trim().toLowerCase();
  const allowMockFallback = isEnabled(process.env.IPFS_ALLOW_MOCK_FALLBACK, true);

  try {
    if (provider === 'pinata' || provider === 'auto') {
      const pinataResult = await uploadViaPinata(metadataJSON);

      if (pinataResult) {
        return pinataResult;
      }

      if (provider === 'pinata') {
        throw new Error('Pinata provider selected but credentials are missing.');
      }
    }

    if (!['auto', 'pinata', 'mock'].includes(provider)) {
      throw new Error(`Unsupported IPFS provider: ${provider}`);
    }
  } catch (error) {
    if (!allowMockFallback) {
      throw error;
    }
  }

  return createMockIpfsResult(metadataJSON);
}

module.exports = {
  uploadToIPFS,
};