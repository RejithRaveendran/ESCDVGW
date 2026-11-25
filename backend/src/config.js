import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const BACKEND_ROOT = path.resolve(here, '..');
export const REPO_ROOT = path.resolve(BACKEND_ROOT, '..');

const isProd = process.env.NODE_ENV === 'production';

const jwtSecret = process.env.JWT_SECRET || (isProd ? '' : 'dev-only-insecure-secret-change-me');
if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set in production.');
}

export const config = {
  isProd,
  port: Number(process.env.PORT || 4000),
  /** postgres://… — when empty, an embedded PGlite database is used (development only). */
  databaseUrl: process.env.DATABASE_URL || '',
  pgliteDir: process.env.PGLITE_DIR || path.join(BACKEND_ROOT, '.data', 'pglite'),
  jwtSecret,
  jwtTtl: process.env.JWT_TTL || '8h',
  uploadDir: process.env.UPLOAD_DIR || path.join(BACKEND_ROOT, 'uploads'),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 25),
  frontendDist: process.env.FRONTEND_DIST || path.join(REPO_ROOT, 'frontend', 'dist'),
  trustProxy: process.env.TRUST_PROXY === 'true',
};
