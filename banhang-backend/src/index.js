import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import {
  loadBackendModules,
  readModuleSelection,
} from './platform/loadBackendModules.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banhang';

const start = async () => {
  const selection = readModuleSelection();
  const modules = await loadBackendModules(selection);
  console.log(
    `Edition: ${selection.edition}, customer: ${selection.customer || '-'}, modules: ${
      modules.map((module) => module.id).join(', ') || '-'
    }`
  );
  const app = createApp({ modules });
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`Ban hang API running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
