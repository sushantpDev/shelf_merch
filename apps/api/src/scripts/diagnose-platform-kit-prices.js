/**
 * READ-ONLY: look for recoverable approxValueInr sources.
 * Does not write.
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

const wiped = await db
  .collection('platformkits')
  .find({ $or: [{ approxValueInr: 0 }, { approxValueInr: { $exists: false } }] })
  .toArray();

console.log('Wiped/zero approx kits:', wiped.length);
for (const pk of wiped) {
  console.log(
    JSON.stringify({
      id: String(pk._id),
      name: pk.name,
      approxValueInr: pk.approxValueInr,
      domain: pk.source?.domain,
      externalId: pk.source?.externalId,
      handle: pk.source?.handle,
      provider: pk.source?.provider,
    }),
  );
}

const ok = await db
  .collection('platformkits')
  .find({ approxValueInr: { $gt: 0 } })
  .project({ name: 1, approxValueInr: 1 })
  .toArray();
console.log('\nKits with intact prices:');
for (const pk of ok) {
  console.log(`  ${pk.approxValueInr}  ${pk.name}`);
}

// Compare clone kitPrice (NOT authoritative for approxValueInr — informational only)
const clones = await db.collection('kits').find({ designNotes: { $regex: 'curated' } }).toArray();
console.log('\nClone kitPrice for wiped names (informational, NOT safe restore source):');
for (const pk of wiped) {
  const matches = clones.filter((c) => {
    try {
      const m = JSON.parse(c.designNotes || '{}');
      return String(m.originalId) === String(pk._id) || c.name === pk.name;
    } catch {
      return false;
    }
  });
  for (const m of matches) {
    console.log(
      JSON.stringify({
        platform: pk.name,
        cloneId: String(m._id),
        kitPrice: m.kitPrice,
        note: 'kitPrice is tenant catalog sum — do NOT copy to approxValueInr',
      }),
    );
  }
}

await mongoose.disconnect();
