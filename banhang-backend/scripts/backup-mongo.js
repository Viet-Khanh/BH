import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banhang';
const BACKUP_DIR =
  process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

const run = async () => {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  await mongoose.connect(MONGODB_URI);

  const collections = await mongoose.connection.db.collections();
  const data = {};

  for (const collection of collections) {
    const name = collection.collectionName;
    if (name.startsWith('system.')) continue;
    data[name] = await collection.find({}).toArray();
  }

  const payload = {
    createdAt: new Date().toISOString(),
    collections: data,
  };

  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2));
  console.log(`Backup saved to ${outputPath}`);
};

run()
  .catch((error) => {
    console.error('Backup failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
