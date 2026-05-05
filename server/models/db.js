const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const legacySeedDir = path.join(__dirname, '..', 'legacy-seed-data');
const legacyFiles = {
  users: path.join(legacySeedDir, 'users.json'),
  institutions: path.join(legacySeedDir, 'institutions.json'),
  credentials: path.join(legacySeedDir, 'credentials.json'),
};

const baseSchemaOptions = {
  versionKey: false,
  timestamps: false,
};

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, default: uuidv4 },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'institution', 'student', 'employer', 'verifier'] },
    institutionId: { type: String, default: null },
    savedVerifications: { type: [String], default: [] },
    employerStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: String, required: true },
  },
  {
    ...baseSchemaOptions,
    collection: 'users',
  }
);

const institutionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, default: uuidv4 },
    name: { type: String, required: true },
    domain: { type: String, required: true, unique: true, index: true },
    status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'] },
    registeredBy: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  {
    ...baseSchemaOptions,
    collection: 'institutions',
  }
);

const credentialSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, default: uuidv4 },
    tokenId: { type: String, required: true, unique: true, index: true },
    verificationKey: { type: String, unique: true, sparse: true, index: true },
    studentId: { type: String, required: true, index: true },
    institutionId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    degree: { type: String, required: true },
    major: { type: String, required: true },
    graduationDate: { type: String, required: true },
    issuedAt: { type: String, required: true, index: true },
    credentialType: { type: String, enum: ['academic', 'employment'], default: 'academic' },
    txHash: { type: String, required: true, unique: true, index: true },
    revokeTxHash: { type: String, default: null },
    metadataJSON: { type: mongoose.Schema.Types.Mixed, required: true },
    ipfsCID: { type: String, default: null },
    ipfsProvider: { type: String, default: 'mock' },
    recipientAddress: { type: String, default: null },
    chainMode: { type: String, enum: ['mock', 'onchain'], default: 'mock' },
    status: { type: String, required: true, enum: ['active', 'revoked'] },
    revokedAt: { type: String, default: null },
  },
  {
    ...baseSchemaOptions,
    collection: 'credentials',
  }
);

const models = {
  users: mongoose.models.User || mongoose.model('User', userSchema),
  institutions: mongoose.models.Institution || mongoose.model('Institution', institutionSchema),
  credentials: mongoose.models.Credential || mongoose.model('Credential', credentialSchema),
};

let connectionPromise = null;

function getMongoUri() {
  return process.env.MONGODB_URI || 'mongodb+srv://AcePlayer:pass123@cluster0.ljan7ji.mongodb.net/?appName=Cluster0';
}

function getMongoDbName() {
  return process.env.MONGODB_DB_NAME || 'accredchain';
}

let memoryServer = null;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = (async () => {
      mongoose.set('strictQuery', true);
      let uri = getMongoUri();
      
      try {
        if (!uri) throw new Error("No URI");
        console.log("Attempting to connect to external MongoDB...");
        await mongoose.connect(uri, { dbName: getMongoDbName(), serverSelectionTimeoutMS: 3000 });
        console.log("Connected to external MongoDB.");
      } catch (err) {
        console.log("External MongoDB connection failed. Falling back to in-memory MongoDB...");
        const { MongoMemoryServer } = require('mongodb-memory-server');
        if (!memoryServer) {
          memoryServer = await MongoMemoryServer.create();
        }
        uri = memoryServer.getUri();
        await mongoose.connect(uri, { dbName: getMongoDbName() });
        console.log("Connected to in-memory MongoDB.");
      }
    })().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
  return mongoose.connection;
}

function getModel(name) {
  const model = models[name];

  if (!model) {
    throw new Error(`Unknown collection: ${name}`);
  }

  return model;
}

function normalizeDocument(document) {
  const { _id, __v, ...rest } = document || {};
  return rest;
}

async function readLegacyCollection(name) {
  try {
    const content = await fs.readFile(legacyFiles[name], 'utf8');
    const parsed = JSON.parse(content || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function migrateLegacyData() {
  await connectDatabase();

  for (const name of Object.keys(models)) {
    const model = getModel(name);
    const count = await model.countDocuments();

    if (count > 0) {
      continue;
    }

    const legacyDocuments = await readLegacyCollection(name);

    if (!legacyDocuments.length) {
      continue;
    }

    await model.insertMany(legacyDocuments.map(normalizeDocument), { ordered: false });
  }
}

async function importLegacySeedData({ replaceExisting = false } = {}) {
  await connectDatabase();
  const summary = [];

  for (const name of Object.keys(models)) {
    const model = getModel(name);
    const legacyDocuments = await readLegacyCollection(name);

    if (!legacyDocuments.length) {
      summary.push({ collection: name, imported: 0, skipped: true, reason: 'no-seed-file' });
      continue;
    }

    if (!replaceExisting) {
      const existingCount = await model.countDocuments();
      if (existingCount > 0) {
        summary.push({ collection: name, imported: 0, skipped: true, reason: 'collection-not-empty' });
        continue;
      }
    } else {
      await model.deleteMany({});
    }

    await model.insertMany(legacyDocuments.map(normalizeDocument), { ordered: false });
    summary.push({ collection: name, imported: legacyDocuments.length, skipped: false });
  }

  return summary;
}

function getDatabaseHealth() {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const readyState = mongoose.connection.readyState;
  return {
    engine: 'mongodb',
    state: stateMap[readyState] || 'unknown',
    readyState,
    dbName: mongoose.connection.name || getMongoDbName(),
    host: mongoose.connection.host || null,
  };
}

async function readCollection(name) {
  await connectDatabase();
  const model = getModel(name);
  const documents = await model.find().lean();
  return documents.map(normalizeDocument);
}

async function writeCollection(name, value) {
  await connectDatabase();
  const model = getModel(name);

  await model.deleteMany({});

  if (Array.isArray(value) && value.length > 0) {
    await model.insertMany(value.map(normalizeDocument), { ordered: false });
  }

  return value;
}

async function seedDefaultAdmin() {
  await connectDatabase();
  const model = getModel('users');
  const existingAdmin = await model.findOne({ email: 'admin@accredchain.com' }).lean();

  if (!existingAdmin) {
    await model.create({
      id: uuidv4(),
      name: 'Default Admin',
      email: 'admin@accredchain.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
      institutionId: null,
      createdAt: new Date().toISOString(),
    });
  }
}

module.exports = {
  connectDatabase,
  importLegacySeedData,
  getDatabaseHealth,
  migrateLegacyData,
  readCollection,
  writeCollection,
  seedDefaultAdmin,
};
