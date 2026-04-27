const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ethers } = require('ethers');
const { v4: uuidv4 } = require('uuid');
const { readCollection, writeCollection } = require('../models/db');
const { generateTokenId, generateTxHash } = require('../utils/hashGenerator');
const { uploadToIPFS } = require('../utils/ipfs');
const {
  getDefaultRecipientAddress,
  isBlockchainConfigured,
  issueCredentialOnChain,
  revokeCredentialOnChain,
} = require('../utils/blockchain');

const DEFAULT_STUDENT_PASSWORD = 'Student123!';

function createVerificationKey(existingKeys = new Set()) {
  let key = '';

  do {
    key = `0x${crypto.randomBytes(32).toString('hex')}`;
  } while (existingKeys.has(key));

  return key;
}

async function issueCredential(req, res) {
  try {
    const { studentEmail, studentName, degree, major, graduationDate, mockStudentAddress } = req.body;

    if (!studentEmail || !studentName || !degree || !major || !graduationDate) {
      return res.status(400).json({
        message: 'Student email, student name, degree, major, and graduation date are required.',
      });
    }

    const institutions = await readCollection('institutions');
    const institution = institutions.find((entry) => entry.id === req.user.institutionId);

    if (!institution) {
      return res.status(404).json({ message: 'Institution record not found.' });
    }

    if (institution.status !== 'approved') {
      return res.status(403).json({ message: 'Only approved institutions can issue credentials.' });
    }

    const users = await readCollection('users');
    const normalizedStudentEmail = String(studentEmail).trim().toLowerCase();
    let studentAccountCreated = false;
    let student = users.find(
      (entry) => entry.email === normalizedStudentEmail && entry.role === 'student'
    );

    if (!student) {
      const emailInUse = users.find((entry) => entry.email === normalizedStudentEmail);

      if (emailInUse) {
        return res.status(409).json({
          message: 'This email is already in use by a non-student account.',
        });
      }

      student = {
        id: uuidv4(),
        name: String(studentName).trim(),
        email: normalizedStudentEmail,
        passwordHash: await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10),
        role: 'student',
        institutionId: institution.id,
        createdAt: new Date().toISOString(),
      };

      users.push(student);
      await writeCollection('users', users);
      studentAccountCreated = true;
    }

    const issuedAt = new Date().toISOString();
    const metadataJSON = {
      name: `Credential for ${studentName}`,
      description: `${degree} in ${major}`,
      studentEmail: normalizedStudentEmail,
      institutionName: institution.name,
      graduationDate,
      issuedAt,
    };

    // 1. Upload metadata to IPFS (Pinata when configured, mock fallback otherwise)
    const uploadResult = await uploadToIPFS(metadataJSON);
    const ipfsCID =
      typeof uploadResult === 'string' ? uploadResult : uploadResult?.uri || uploadResult?.cid;
    const ipfsProvider =
      typeof uploadResult === 'string' ? 'mock' : uploadResult?.provider || 'mock';

    // 2. Prefer on-chain minting when configured; otherwise fall back to mock hashes.
    const recipientAddress = mockStudentAddress || getDefaultRecipientAddress();
    let tokenId;
    let txHash;
    let chainMode = 'mock';

    if (isBlockchainConfigured()) {
      if (!ethers.isAddress(recipientAddress) || recipientAddress === ethers.ZeroAddress) {
        return res.status(400).json({ message: 'Invalid recipient wallet address for on-chain minting.' });
      }

      const onChainResult = await issueCredentialOnChain({
        recipient: recipientAddress,
        tokenURI: ipfsCID,
        credentialType: 'degree',
        expiresAt: 0,
      });

      tokenId = onChainResult.tokenId || generateTokenId({ studentEmail: normalizedStudentEmail, issuedAt, nonce: uuidv4() });
      txHash = onChainResult.txHash;
      chainMode = 'onchain';
    } else {
      tokenId = generateTokenId({
        studentEmail: normalizedStudentEmail,
        studentName,
        degree,
        major,
        graduationDate,
        institutionId: institution.id,
        issuedAt,
        nonce: uuidv4(),
      });
      txHash = generateTxHash();
    }

    const credentials = await readCollection('credentials');
    const existingVerificationKeys = new Set(
      credentials.map((entry) => entry.verificationKey).filter(Boolean)
    );
    const verificationKey = createVerificationKey(existingVerificationKeys);

    const credential = {
      id: uuidv4(),
      tokenId: String(tokenId),
      verificationKey,
      studentId: student.id,
      institutionId: institution.id,
      studentName,
      degree,
      major,
      graduationDate,
      issuedAt,
      txHash,
      metadataJSON,
      status: 'active',
      ipfsCID,
      ipfsProvider,
      recipientAddress,
      chainMode,
    };

    credentials.push(credential);
    await writeCollection('credentials', credentials);

    return res.status(201).json({
      message:
        credential.chainMode === 'onchain'
          ? 'Credential issued successfully on-chain.'
          : 'Credential issued successfully in mock mode (blockchain not configured).',
      credential,
      studentAccountCreated,
      defaultStudentPassword: studentAccountCreated ? DEFAULT_STUDENT_PASSWORD : undefined,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to issue credential.' });
  }
}

async function getMyCredentials(req, res) {
  try {
    const credentials = await readCollection('credentials');
    const institutions = await readCollection('institutions');

    const result = credentials.filter((entry) => entry.studentId === req.user.id);

    const enriched = result.map((credential) => ({
      ...credential,
      institutionName:
        institutions.find((entry) => entry.id === credential.institutionId)?.name || 'Unknown Institution',
    }));

    return res.json({ credentials: enriched });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch credentials.' });
  }
}

async function getIssuedCredentials(req, res) {
  try {
    const credentials = await readCollection('credentials');
    const institutions = await readCollection('institutions');
    const issuedCredentials = credentials.filter(
      (entry) => entry.institutionId === req.user.institutionId
    );

    const enriched = issuedCredentials.map((credential) => ({
      ...credential,
      institutionName:
        institutions.find((entry) => entry.id === credential.institutionId)?.name || 'Unknown Institution',
    }));

    return res.json({ credentials: enriched });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch issued credentials.' });
  }
}

async function revokeCredential(req, res) {
  try {
    const { id } = req.params;
    const credentials = await readCollection('credentials');
    const credential = credentials.find((entry) => entry.id === id);

    if (!credential) {
      return res.status(404).json({ message: 'Credential not found.' });
    }

    if (credential.institutionId !== req.user.institutionId) {
      return res.status(403).json({ message: 'You can only revoke credentials issued by your institution.' });
    }

    if (credential.status === 'revoked') {
      return res.status(400).json({ message: 'Credential is already revoked.' });
    }

    let revokeTxHash = null;
    const numericTokenId = /^\d+$/.test(String(credential.tokenId));

    if (isBlockchainConfigured() && numericTokenId) {
      const revokeResult = await revokeCredentialOnChain(credential.tokenId);
      revokeTxHash = revokeResult.txHash;
    }

    credential.status = 'revoked';
    credential.revokedAt = new Date().toISOString();
    if (revokeTxHash) {
      credential.revokeTxHash = revokeTxHash;
    }

    await writeCollection('credentials', credentials);

    return res.json({ message: 'Credential revoked successfully.', credential });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to revoke credential.' });
  }
}

module.exports = {
  issueCredential,
  getMyCredentials,
  getIssuedCredentials,
  revokeCredential,
};
