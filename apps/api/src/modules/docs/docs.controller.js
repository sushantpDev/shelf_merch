/**
 * Serves public documentation HTML pages (no authentication).
 */
import {
  buildZohoPeopleDocsHomeHtml,
  buildZohoPeopleUserGuideHtml,
  buildZohoPeopleAdminGuideHtml,
  buildZohoPeopleExampleWorkflowHtml,
} from './zohoPeopleDocsPages.js';

const PAGE_BUILDERS = {
  '/docs/zoho-people': buildZohoPeopleDocsHomeHtml,
  '/docs/zoho-people/user-guide': buildZohoPeopleUserGuideHtml,
  '/docs/zoho-people/admin-guide': buildZohoPeopleAdminGuideHtml,
  '/case-studies/zoho-people': buildZohoPeopleExampleWorkflowHtml,
};

const cache = new Map();

export function getDocsHtml(routePath) {
  const build = PAGE_BUILDERS[routePath];
  if (!build) return null;
  if (cache.has(routePath)) return cache.get(routePath);
  const html = build();
  cache.set(routePath, html);
  return html;
}

export function sendDocsPage(routePath) {
  return function sendDocsPageHandler(_req, res) {
    const html = getDocsHtml(routePath);
    if (!html) {
      return res.status(404).type('html').send('<!doctype html><title>Not found</title><h1>Not found</h1>');
    }
    res.status(200).type('html').set('Cache-Control', 'public, max-age=300').send(html);
  };
}

export const DOCS_PUBLIC_ROUTES = Object.keys(PAGE_BUILDERS);
