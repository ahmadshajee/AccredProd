const { readCollection } = require('../models/db');
const { readCredentialOnChain } = require('../utils/blockchain');

async function verifyCredentialByToken(req, res) {
  try {
    const lookupKey = String(req.params.tokenId || '').trim();
    const credentials = await readCollection('credentials');
    const institutions = await readCollection('institutions');

    const credential = credentials.find(
      (entry) =>
        entry.tokenId === lookupKey ||
        entry.verificationKey === lookupKey ||
        entry.txHash === lookupKey
    );

    if (!credential) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    let institutionName = 'Unknown Institution';
    if (credential.credentialType === 'employment') {
      const users = await readCollection('users');
      institutionName = users.find((entry) => entry.id === credential.institutionId)?.name || 'Unknown Employer';
    } else {
      const institution = institutions.find((entry) => entry.id === credential.institutionId);
      institutionName = institution?.name || 'Unknown Institution';
    }

    let onChain = { available: false };
    if (/^\d+$/.test(String(credential.tokenId))) {
      onChain = await readCredentialOnChain(credential.tokenId);
    }

    let effectiveStatus = credential.status;
    if (credential.status !== 'revoked' && onChain.available) {
      effectiveStatus = onChain.isValid ? 'active' : onChain.isExpired ? 'expired' : 'revoked';
    }

    return res.json({
      isValid: effectiveStatus === 'active',
      message: effectiveStatus === 'active'
        ? 'This credential is valid and active.'
        : effectiveStatus === 'expired'
          ? 'This credential has expired.'
          : 'This credential has been revoked.',
      credential: {
        tokenId: credential.tokenId,
        verificationKey: credential.verificationKey || credential.txHash || credential.tokenId,
        studentName: credential.studentName,
        degree: credential.degree,
        major: credential.major,
        graduationDate: credential.graduationDate,
        institutionName,
        issuedAt: credential.issuedAt,
        txHash: credential.txHash,
        status: effectiveStatus,
        credentialType: credential.credentialType || 'academic',
        chainMode: credential.chainMode || 'mock',
        tokenURI: onChain.tokenURI || credential.ipfsCID || null,
        onChain: {
          available: onChain.available,
          isValid: onChain.available ? onChain.isValid : null,
          isExpired: onChain.available ? onChain.isExpired : null,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to verify credential.' });
  }
}

module.exports = {
  verifyCredentialByToken,
};