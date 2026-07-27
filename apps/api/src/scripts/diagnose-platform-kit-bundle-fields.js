/**
 * READ-ONLY: inspect PlatformKit image roles + bundle fields.
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
  const pk = await db.collection('platformkits').findOne({ _id: new mongoose.Types.ObjectId(id) });
  if (!pk) { console.log('NOT FOUND', id); continue; }
  console.log(JSON.stringify({
    id,
    name: pk.name,
    descLen: String(pk.description || '').length,
    imageUrlsCount: (pk.imageUrls || []).length,
    heroImage: pk.heroImage || '',
    itemImages: pk.itemImages || [],
    variantImages: pk.variantImages || [],
    approxValueInr: pk.approxValueInr,
  }, null, 2));
}

await mongoose.disconnect();
