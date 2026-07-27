/**
 * READ-ONLY: inspect PlatformKit description state.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 20000,
});
const db = mongoose.connection.db;

const kits = await db.collection('platformkits').find({}).toArray();
console.log('=== PlatformKit descriptions ===');
for (const k of kits) {
  const desc = String(k.description || '');
  console.log(
    JSON.stringify({
      id: String(k._id),
      name: k.name,
      descLen: desc.length,
      descPreview: desc.slice(0, 120),
      handle: k.source?.handle,
      domain: k.source?.domain,
    }),
  );
}

await mongoose.disconnect();
