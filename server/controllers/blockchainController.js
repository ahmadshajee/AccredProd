const { readCollection } = require('../models/db');

function buildChainTransactions(credentials, institutions) {
  const sortedCredentials = [...credentials].sort(
    (left, right) => new Date(left.issuedAt).getTime() - new Date(right.issuedAt).getTime()
  );

  const mintedTransactions = sortedCredentials.map((credential, index) => {
    const institution = institutions.find((entry) => entry.id === credential.institutionId);
    return {
      blockNumber: 120000 + index + 1,
      txHash: credential.txHash,
      tokenId: credential.tokenId,
      verificationKey: credential.verificationKey || credential.txHash || credential.tokenId,
      minedAt: credential.issuedAt,
      institutionName: institution?.name || 'Unknown Institution',
      studentName: credential.studentName,
      degree: credential.degree,
      major: credential.major,
      status: credential.status,
    };
  });

  return mintedTransactions.reverse();
}

async function listTransactions(_req, res) {
  try {
    const credentials = await readCollection('credentials');
    const institutions = await readCollection('institutions');
    const transactions = buildChainTransactions(credentials, institutions);

    const summary = {
      network: 'AccredChain Network',
      latestBlock: transactions[0]?.blockNumber || 120000,
      totalTransactions: transactions.length,
      activeCredentials: credentials.filter((entry) => entry.status === 'active').length,
      revokedCredentials: credentials.filter((entry) => entry.status === 'revoked').length,
    };

    return res.json({ summary, transactions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch blockchain transactions.' });
  }
}

async function getTransaction(req, res) {
  try {
    const { txHash } = req.params;
    const credentials = await readCollection('credentials');
    const institutions = await readCollection('institutions');
    const transactions = buildChainTransactions(credentials, institutions);
    const transaction = transactions.find((entry) => entry.txHash === txHash);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    return res.json({ transaction });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch transaction details.' });
  }
}

module.exports = {
  listTransactions,
  getTransaction,
};