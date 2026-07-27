/**
 * READ-ONLY: check workspace kit clones for curated meta (description backup).
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const TARGET_IDS = [
  '6a61f3dde66dc62b3d922f6d',
  '6a61f3e2e66dc62b3d922f73',
];

await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 20000,
});
const db = mongoose.connection.db;

for (const id of TARGET_IDS) {
  const clones = await db.collection('kits').find({
    designNotes: { $regex: id },
  }).toArray();
  console.log(`\n=== platformKit ${id} — ${clones.length} clone(s) ===`);
  for (const k of clones) {
    let meta = null;
    try { meta = JSON.parse(k.designNotes || ''); } catch { /* */ }
    console.log(JSON.stringify({
      cloneId: String(k._id),
      name: k.name,
      descriptionLen: String(k.description || '').length,
      metaDescLen: String(meta?.description || '').length,
      metaDescPreview: String(meta?.description || '').slice(0, 120),
    }));
  }
}

await mongoose.disconnect();
