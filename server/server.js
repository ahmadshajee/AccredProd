require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const blockchainRoutes = require('./routes/blockchain');
const institutionRoutes = require('./routes/institutions');
const credentialRoutes = require('./routes/credentials');
const verifyRoutes = require('./routes/verify');
const healthRoutes = require('./routes/health');
const { connectDatabase, migrateLegacyData, seedDefaultAdmin } = require('./models/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.redirect('https://ahmadshajee.github.io/AccredProd/');
});

app.use('/api/auth', authRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/health', healthRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

Promise.resolve()
  .then(connectDatabase)
  .then(migrateLegacyData)
  .then(seedDefaultAdmin)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`AccredChain server listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize data store:', error);
    process.exit(1);
  });
