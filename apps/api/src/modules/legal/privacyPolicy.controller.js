/**
 * Serves the public Privacy Policy HTML (no authentication).
 * Source: apps/api/src/static/privacy-policy.html
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PRIVACY_POLICY_HTML_PATH = path.resolve(__dirname, '../../static/privacy-policy.html');

let cachedHtml = null;

export function getPrivacyPolicyHtml() {
  if (cachedHtml) return cachedHtml;
  if (existsSync(PRIVACY_POLICY_HTML_PATH)) {
    cachedHtml = readFileSync(PRIVACY_POLICY_HTML_PATH, 'utf8');
    return cachedHtml;
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Privacy Policy · ShelfMerch</title></head><body><h1>Privacy Policy</h1><p>Last updated: 30 July 2026</p><p>Chitlu Innovations Private Limited</p><p><a href="mailto:support@shelfmerch.com">support@shelfmerch.com</a></p></body></html>`;
}

export function sendPrivacyPolicy(req, res) {
  res.status(200).type('html').set('Cache-Control', 'public, max-age=300').send(getPrivacyPolicyHtml());
}
