require('dotenv').config();

const mongoose = require('mongoose');
const { connectDatabase, importLegacySeedData, seedDefaultAdmin } = require('../models/db');

async function run() {
  const args = new Set(process.argv.slice(2));
  const replaceExisting = args.has('--replace');

  try {
    await connectDatabase();

    const summary = await importLegacySeedData({ replaceExisting });
    await seedDefaultAdmin();

    console.log(`Seed import finished (replaceExisting=${replaceExisting}).`);
    summary.forEach((entry) => {
      if (entry.skipped) {
        console.log(`- ${entry.collection}: skipped (${entry.reason})`);
        return;
      }
      console.log(`- ${entry.collection}: imported ${entry.imported}`);
    });
  } catch (error) {
    console.error('Seed import failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();
