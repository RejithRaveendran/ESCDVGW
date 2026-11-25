import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { config } from './config.js';
import { HttpError, clearSession, issueSession, requireAuth, verifyLogin } from './auth.js';
import { query } from './db/index.js';
import { publicRouter } from './routes/public.js';
import { portalRouter } from './routes/portal.js';
import { adminRouter } from './routes/admin.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());

  // CSRF defence: state-changing API calls must carry a custom header. Browsers cannot send it
  // cross-origin without a CORS preflight, which this API never approves. Combined with SameSite=strict cookies.
  app.use('/api', (req, _res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.get('X-Requested-With') !== 'esc-portal') return next(new HttpError(403, 'Missing request header'));
    next();
  });

  /* ---------------------------------------------------------------- auth */
  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
  const loginSchema = z.object({ email: z.email(), password: z.string().min(1).max(200) });

  app.post('/api/auth/login', loginLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, 'Please enter your e-mail and password');
    const user = await verifyLogin(parsed.data.email, parsed.data.password);
    if (!user) throw new HttpError(401, 'E-mail or password is incorrect');
    await query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);
    issueSession(res, user);
    res.json({ user });
  });
  app.post('/api/auth/logout', (_req, res) => {
    clearSession(res);
    res.json({ ok: true });
  });
  app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));
  // Non-erroring session probe for the portal shell.
  app.get('/api/auth/session', (req, res, next) => requireAuth(req, res, (err) => (err ? res.json({ user: null }) : res.json({ user: req.user }))).catch(next));

  /* ---------------------------------------------------------------- routers */
  app.use('/api', publicRouter);
  app.use('/api/portal', portalRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found')));

  /* ---------------------------------------------------------------- frontend (production) */
  if (fs.existsSync(path.join(config.frontendDist, 'index.html'))) {
    app.use(express.static(config.frontendDist, { index: false, maxAge: '7d', setHeaders: (res, p) => p.endsWith('.html') && res.setHeader('Cache-Control', 'no-cache') }));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(config.frontendDist, 'index.html')));
  }

  /* ---------------------------------------------------------------- errors */
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Something went wrong. Please try again.' : err.message, fields: err.fields });
  });

  return app;
}
