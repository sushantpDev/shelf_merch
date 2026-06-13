import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

const ALLOWED_TYPES = {
  artwork: ['image/svg+xml', 'image/png', 'image/jpeg'],
  document: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  logo: ['image/svg+xml', 'image/png', 'image/jpeg'],
  product: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'],
  production: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
};

const r2Configured = () => Boolean(env.R2_ENDPOINT && env.R2_ACCESS_KEY && env.R2_SECRET_KEY);

let r2Client = null;
async function getR2() {
  if (!r2Client) {
    const { S3Client } = await import('@aws-sdk/client-s3');
    r2Client = new S3Client({
      region: 'auto',
      endpoint: env.R2_ENDPOINT,
      credentials: { accessKeyId: env.R2_ACCESS_KEY, secretAccessKey: env.R2_SECRET_KEY },
    });
  }
  return r2Client;
}

export function validateUpload(file, kind) {
  if (!file) throw new ApiError(400, 'No file uploaded', 'FILE_REQUIRED');
  if (!ALLOWED_TYPES[kind]?.includes(file.mimetype)) {
    throw new ApiError(
      415,
      `Unsupported file type "${file.mimetype}" for ${kind}. Allowed: ${ALLOWED_TYPES[kind].join(', ')}`,
      'UNSUPPORTED_FILE_TYPE',
    );
  }
}

/**
 * §9.2 — R2 when configured; local disk fallback for dev so upload flows are
 * testable without cloud credentials. Returns a URL usable by the frontend.
 */
export async function uploadFile({ tenantId, kind, file }) {
  validateUpload(file, kind);
  const ext = path.extname(file.originalname) || '';
  const key = `${tenantId}/${kind}/${crypto.randomBytes(12).toString('hex')}${ext}`;

  if (r2Configured()) {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await getR2();
    await client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return { key, url: `${env.R2_ENDPOINT}/${env.R2_BUCKET}/${key}` };
  }

  const target = path.join(LOCAL_UPLOAD_DIR, key.replaceAll('/', path.sep));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, file.buffer);
  return { key, url: `/uploads/${key}` };
}

export { LOCAL_UPLOAD_DIR };
