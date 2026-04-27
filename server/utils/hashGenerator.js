const crypto = require('crypto');

function generateTokenId(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

function generateTxHash() {
  return crypto
    .createHash('sha256')
    .update(`${Date.now()}:${crypto.randomUUID()}:${Math.random()}`)
    .digest('hex');
}

module.exports = {
  generateTokenId,
  generateTxHash,
};
