const { readCollection, writeCollection } = require('../models/db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
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

async function getHistory(req, res) {
  try {
    const users = await readCollection('users');
    const user = users.find((u) => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const savedTokenIds = user.savedVerifications || [];
    const credentials = await readCollection('credentials');
    
    // Filter out credentials that match the saved token IDs
    const savedCredentials = credentials.filter((c) => savedTokenIds.includes(c.tokenId));

    return res.json({ history: savedCredentials });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch verification history.' });
  }
}

async function saveVerification(req, res) {
  try {
    const { tokenId } = req.body;
    if (!tokenId) {
      return res.status(400).json({ message: 'Token ID is required.' });
    }

    const credentials = await readCollection('credentials');
    const credential = credentials.find((c) => c.tokenId === tokenId);
    if (!credential) {
      return res.status(404).json({ message: 'Credential not found.' });
    }

    const users = await readCollection('users');
    const userIndex = users.findIndex((u) => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = users[userIndex];
    if (!user.savedVerifications) {
      user.savedVerifications = [];
    }

    if (user.savedVerifications.includes(tokenId)) {
      return res.status(400).json({ message: 'Verification already saved.' });
    }

    user.savedVerifications.push(tokenId);
    await writeCollection('users', users);

    return res.json({ message: 'Verification saved to history.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to save verification.' });
  }
}

async function removeVerification(req, res) {
  try {
    const { tokenId } = req.params;

    const users = await readCollection('users');
    const userIndex = users.findIndex((u) => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = users[userIndex];
    if (!user.savedVerifications) {
      user.savedVerifications = [];
    }

    user.savedVerifications = user.savedVerifications.filter((id) => id !== tokenId);
    await writeCollection('users', users);

    return res.json({ message: 'Verification removed from history.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to remove verification.' });
  }
}

async function issueCredential(req, res) {
  try {
    const { studentEmail, studentName, position, department, employmentDate, mockStudentAddress } = req.body;

    if (!studentEmail || !studentName || !position || !department || !employmentDate) {
      return res.status(400).json({
        message: 'Student email, student name, position, department, and employment date are required.',
      });
    }

    const users = await readCollection('users');
    const employer = users.find((u) => u.id === req.user.id);
    if (!employer || employer.role !== 'employer') {
      return res.status(403).json({ message: 'Only employers can issue employment credentials.' });
    }

    if (employer.employerStatus !== 'approved') {
      return res.status(403).json({ message: 'Only approved employers can issue credentials.' });
    }

    const normalizedStudentEmail = String(studentEmail).trim().toLowerCase();
    let studentAccountCreated = false;
    let student = users.find(
      (entry) => entry.email === normalizedStudentEmail && entry.role === 'student'
    );

    if (!student) {
      const emailInUse = users.find((entry) => entry.email === normalizedStudentEmail);
      if (emailInUse) {
        return res.status(409).json({ message: 'This email is already in use by a non-student account.' });
      }

      student = {
        id: uuidv4(),
        name: String(studentName).trim(),
        email: normalizedStudentEmail,
        passwordHash: await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10),
        role: 'student',
        institutionId: null,
        createdAt: new Date().toISOString(),
      };
      users.push(student);
      await writeCollection('users', users);
      studentAccountCreated = true;
    }

    const issuedAt = new Date().toISOString();
    const metadataJSON = {
      name: `Employment Credential for ${studentName}`,
      description: `${position} in ${department}`,
      studentEmail: normalizedStudentEmail,
      employerName: employer.name,
      employmentDate,
      issuedAt,
    };

    const uploadResult = await uploadToIPFS(metadataJSON);
    const ipfsCID = typeof uploadResult === 'string' ? uploadResult : uploadResult?.uri || uploadResult?.cid;
    const ipfsProvider = typeof uploadResult === 'string' ? 'mock' : uploadResult?.provider || 'mock';

    const recipientAddress = mockStudentAddress || getDefaultRecipientAddress();
    let tokenId, txHash;
    let chainMode = 'mock';

    if (isBlockchainConfigured()) {
      const { ethers } = require('ethers');
      if (!ethers.isAddress(recipientAddress) || recipientAddress === ethers.ZeroAddress) {
        return res.status(400).json({ message: 'Invalid recipient wallet address for on-chain minting.' });
      }
      try {
        const onChainResult = await issueCredentialOnChain({
          recipient: recipientAddress,
          tokenURI: ipfsCID,
          credentialType: 'employment',
          expiresAt: 0,
        });
        tokenId = onChainResult.tokenId || generateTokenId({ studentEmail: normalizedStudentEmail, issuedAt, nonce: uuidv4() });
        txHash = onChainResult.txHash;
        chainMode = 'onchain';
      } catch (chainError) {
        console.warn('On-chain issuance failed, falling back to mock mode:', chainError.message);
        tokenId = generateTokenId({
          studentEmail: normalizedStudentEmail,
          studentName,
          degree: position,
          major: department,
          graduationDate: employmentDate,
          institutionId: employer.id,
          issuedAt,
          nonce: uuidv4(),
        });
        txHash = generateTxHash();
      }
    } else {
      tokenId = generateTokenId({
        studentEmail: normalizedStudentEmail,
        studentName,
        degree: position,
        major: department,
        graduationDate: employmentDate,
        institutionId: employer.id,
        issuedAt,
        nonce: uuidv4(),
      });
      txHash = generateTxHash();
    }

    const credentials = await readCollection('credentials');
    const existingVerificationKeys = new Set(credentials.map((entry) => entry.verificationKey).filter(Boolean));
    const verificationKey = createVerificationKey(existingVerificationKeys);

    const credential = {
      id: uuidv4(),
      tokenId: String(tokenId),
      verificationKey,
      studentId: student.id,
      institutionId: employer.id, // we map employer id here so getMyCredentials can resolve it
      studentName,
      degree: position, // mapping employer fields to existing schema
      major: department,
      graduationDate: employmentDate,
      credentialType: 'employment',
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
      message: 'Employment credential issued successfully.',
      credential,
      studentAccountCreated,
      defaultStudentPassword: studentAccountCreated ? DEFAULT_STUDENT_PASSWORD : undefined,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to issue credential.' });
  }
}

async function getIssuedCredentials(req, res) {
  try {
    const credentials = await readCollection('credentials');
    const users = await readCollection('users');
    const issuedCredentials = credentials.filter(
      (entry) => entry.institutionId === req.user.id && entry.credentialType === 'employment'
    );

    const enriched = issuedCredentials.map((credential) => ({
      ...credential,
      employerName: users.find((entry) => entry.id === credential.institutionId)?.name || 'Unknown Employer',
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

    if (credential.institutionId !== req.user.id) {
      return res.status(403).json({ message: 'You can only revoke credentials issued by you.' });
    }

    if (credential.status === 'revoked') {
      return res.status(400).json({ message: 'Credential is already revoked.' });
    }

    let revokeTxHash = null;
    const numericTokenId = /^\d+$/.test(String(credential.tokenId));

    if (isBlockchainConfigured() && numericTokenId) {
      try {
        const revokeResult = await revokeCredentialOnChain(credential.tokenId);
        revokeTxHash = revokeResult.txHash;
      } catch (chainError) {
        console.warn('On-chain revoke failed:', chainError.message);
      }
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

async function listEmployers(req, res) {
  try {
    const users = await readCollection('users');
    const employers = users.filter((u) => u.role === 'employer');
    // Map them to hide passwordHash etc
    const safeEmployers = employers.map((emp) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      employerStatus: emp.employerStatus || 'pending',
      createdAt: emp.createdAt,
    }));
    return res.json({ employers: safeEmployers });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to list employers.' });
  }
}

async function approveEmployer(req, res) {
  try {
    const { id } = req.params;
    const users = await readCollection('users');
    const employer = users.find((u) => u.id === id && u.role === 'employer');
    
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found.' });
    }

    employer.employerStatus = 'approved';
    await writeCollection('users', users);
    
    return res.json({ message: 'Employer approved successfully.', employer: { id: employer.id, name: employer.name, employerStatus: employer.employerStatus } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to approve employer.' });
  }
}

async function rejectEmployer(req, res) {
  try {
    const { id } = req.params;
    const users = await readCollection('users');
    const employer = users.find((u) => u.id === id && u.role === 'employer');
    
    if (!employer) {
      return res.status(404).json({ message: 'Employer not found.' });
    }

    employer.employerStatus = 'rejected';
    await writeCollection('users', users);
    
    return res.json({ message: 'Employer rejected successfully.', employer: { id: employer.id, name: employer.name, employerStatus: employer.employerStatus } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to reject employer.' });
  }
}

module.exports = {
  getHistory,
  saveVerification,
  removeVerification,
  issueCredential,
  getIssuedCredentials,
  revokeCredential,
  listEmployers,
  approveEmployer,
  rejectEmployer,
};
