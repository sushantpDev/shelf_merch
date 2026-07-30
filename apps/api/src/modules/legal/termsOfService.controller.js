/**
 * Serves the public Terms of Service HTML (no authentication).
 * Source: apps/api/src/static/terms-of-service.html
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TERMS_OF_SERVICE_HTML_PATH = path.resolve(__dirname, '../../static/terms-of-service.html');

let cachedHtml = null;

export function getTermsOfServiceHtml() {
  if (cachedHtml) return cachedHtml;
  if (existsSync(TERMS_OF_SERVICE_HTML_PATH)) {
    cachedHtml = readFileSync(TERMS_OF_SERVICE_HTML_PATH, 'utf8');
    return cachedHtml;
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Terms of Service · ShelfMerch</title></head><body><h1>Terms of Service</h1><p>Last updated: 30 July 2026</p><p>Chitlu Innovations Private Limited</p><p><a href="mailto:support@shelfmerch.com">support@shelfmerch.com</a></p></body></html>`;
}

export function sendTermsOfService(req, res) {
  res.status(200).type('html').set('Cache-Control', 'public, max-age=300').send(getTermsOfServiceHtml());
}
