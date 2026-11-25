import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './config.js';

const read = (name) => JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'shared', name), 'utf8'));

/** Content shared with the frontend (single source of truth). */
export const categoriesData = read('categories.json');
export const siteData = read('site.json');
export const resourcesData = read('resources.json');

export const STAGES = siteData.process.map((s) => ({ stage: s.n, title: s.title }));
export const CATEGORY_NAMES = categoriesData.categories.map((c) => c.name);

/** Flatten a structured article body into plain text for full-text search. */
export function bodyToText(body) {
  return body
    .map((b) => b.p ?? b.h ?? (Array.isArray(b.ul) ? b.ul.join('. ') : ''))
    .join('\n');
}
