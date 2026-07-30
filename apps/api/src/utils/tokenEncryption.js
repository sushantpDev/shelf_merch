import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { ApiError } from './errors.js';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Resolve a 32-byte AES key from TOKEN_ENCRYPTION_KEY (hex or base64).
 * Never log the key material.
 */
export function resolveEncryptionKey(raw = env.TOKEN_ENCRYPTION_KEY) {
  if (!raw || typeof raw !== 'string') {
    throw new ApiError(500, 'Token encryption is not configured', 'TOKEN_ENCRYPTION_NOT_CONFIGURED');
  }
  const trimmed = raw.trim();
  let key;
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    key = Buffer.from(trimmed, 'hex');
  } else {
    try {
      key = Buffer.from(trimmed, 'base64');
    } catch {
      throw new ApiError(500, 'Invalid TOKEN_ENCRYPTION_KEY format', 'TOKEN_ENCRYPTION_KEY_INVALID');
    }
  }
  if (key.length !== KEY_LENGTH) {
    throw new ApiError(
      500,
      'TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes',
      'TOKEN_ENCRYPTION_KEY_INVALID',
    );
  }
  return key;
}

/**
 * Authenticated encryption (AES-256-GCM).
 * Wire format: base64url(iv || ciphertext || authTag)
 */
export function encryptToken(plaintext) {
  if (plaintext == null || plaintext === '') {
    throw new ApiError(500, 'Cannot encrypt empty token', 'TOKEN_ENCRYPT_EMPTY');
  }
  const key = resolveEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString('base64url');
}

/**
 * Decrypt a value produced by encryptToken. Throws on tampering / wrong key.
 */
export function decryptToken(payload) {
  if (!payload || typeof payload !== 'string') {
    throw new ApiError(500, 'Cannot decrypt empty token', 'TOKEN_DECRYPT_EMPTY');
  }
  const key = resolveEncryptionKey();
  let buf;
  try {
    buf = Buffer.from(payload, 'base64url');
  } catch {
    throw new ApiError(500, 'Corrupt encrypted token', 'TOKEN_DECRYPT_CORRUPT');
  }
  if (buf.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new ApiError(500, 'Corrupt encrypted token', 'TOKEN_DECRYPT_CORRUPT');
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(buf.length - AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH, buf.length - AUTH_TAG_LENGTH);
  try {
    const decipher = crypto.createDecipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new ApiError(500, 'Failed to decrypt token', 'TOKEN_DECRYPT_FAILED');
  }
}
