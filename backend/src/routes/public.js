import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { many, one, query } from '../db/index.js';
import { HttpError } from '../auth.js';
import { writeChecklistPdf } from '../lib/checklistPdf.js';

export const publicRouter = Router();

const inquiryLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });

const opt = (max) => z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));

export const inquirySchema = z.object({
  kind: z.enum(['consultation', 'assessment']).default('consultation'),
  companyName: z.string({ error: 'Please enter your company name' }).trim().min(2, 'Please enter your company name').max(200),
  contactPerson: z.string({ error: 'Please enter a contact person' }).trim().min(2, 'Please enter a contact person').max(120),
  designation: opt(120),
  email: z.email({ error: 'Please enter a valid e-mail address' }).max(200),
  mobile: z
    .string({ error: 'Please enter a mobile number' })
    .trim()
    .regex(/^[+\d][\d\s()-]{6,20}$/, 'Please enter a valid mobile number'),
  productCategory: opt(80),
  sector: opt(120),
  certificationStatus: opt(120),
  targetMarket: opt(120),
  message: opt(4000),
  // Honeypot: real users never fill this hidden field.
  website: z.string().max(0).optional().or(z.literal('')),
});

publicRouter.post('/inquiries', inquiryLimiter, async (req, res) => {
  const parsed = inquirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please check the highlighted fields', fields: z.flattenError(parsed.error).fieldErrors });
  }
  const d = parsed.data;
  const row = await one(
    `INSERT INTO inquiries (kind, company_name, contact_person, designation, email, mobile, product_category, sector, certification_status, target_market, message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id, created_at`,
    [d.kind, d.companyName, d.contactPerson, d.designation ?? null, d.email.toLowerCase(), d.mobile, d.productCategory ?? null, d.sector ?? null, d.certificationStatus ?? null, d.targetMarket ?? null, d.message ?? null],
  );
  res.status(201).json({ ok: true, reference: `ESC-${String(row.id).padStart(5, '0')}` });
});

/** Knowledge base: full-text + substring search over published resources. */
publicRouter.get('/resources', async (req, res) => {
  const q = String(req.query.q ?? '').trim().slice(0, 120);
  const type = String(req.query.type ?? '').trim().slice(0, 60);
  const params = [];
  const where = [];
  let order = 'published_at DESC';
  if (q) {
    params.push(q);
    const i = params.length;
    where.push(`(search @@ websearch_to_tsquery('english', $${i}) OR title ILIKE '%' || $${i} || '%' OR array_to_string(tags, ' ') ILIKE '%' || $${i} || '%')`);
    order = `ts_rank(search, websearch_to_tsquery('english', $${i})) DESC, published_at DESC`;
  }
  if (type) {
    params.push(type);
    where.push(`type = $${params.length}`);
  }
  const rows = await many(
    `SELECT slug, type, title, summary, tags, read_minutes, published_at
       FROM resources ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY ${order} LIMIT 50`,
    params,
  );
  res.json({ items: rows });
});

publicRouter.get('/resources/:slug', async (req, res) => {
  const r = await one(`SELECT slug, type, title, summary, body, tags, read_minutes, published_at FROM resources WHERE slug = $1`, [req.params.slug]);
  if (!r) throw new HttpError(404, 'Resource not found');
  res.json(r);
});

publicRouter.get('/checklists/:slug.pdf', (req, res) => {
  const slug = String(req.params.slug);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ESC-DVGW-Checklist-${slug}.pdf"`);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  const ok = writeChecklistPdf(slug, res);
  if (!ok) {
    res.removeHeader('Content-Disposition');
    res.status(404).type('json').send({ error: 'Unknown product category' });
  }
});

publicRouter.get('/health', async (_req, res) => {
  await query('SELECT 1');
  res.json({ ok: true });
});
