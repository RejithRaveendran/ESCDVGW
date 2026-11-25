import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { config } from '../config.js';
import { many, one, query } from '../db/index.js';
import { HttpError, assertCanManage, isManager, isStaff, loadProjectFor, projectScope, requireAuth, requireRole } from '../auth.js';
import { createMilestones } from '../db/seed.js';
import { CATEGORY_NAMES, STAGES } from '../shared.js';

export const portalRouter = Router();
portalRouter.use(requireAuth);

const log = (projectId, userId, action, detail) =>
  query(`INSERT INTO activity_log (project_id, user_id, action, detail) VALUES ($1,$2,$3,$4)`, [projectId, userId, action, detail]);

const parse = (schema, data) => {
  const r = schema.safeParse(data);
  if (!r.success) {
    const err = new HttpError(400, r.error.issues[0]?.message ?? 'Invalid input');
    err.fields = z.flattenError(r.error).fieldErrors;
    throw err;
  }
  return r.data;
};
const dateStr = z.iso.date().nullable().optional();

/* ------------------------------------------------------------------ dashboard */

portalRouter.get('/dashboard', async (req, res) => {
  const u = req.user;
  const s = projectScope(u);
  const projects = await many(
    `SELECT p.id, p.title, p.product_category, p.current_stage, p.status, p.target_date, o.name AS organization_name,
            c.name AS consultant_name,
            (SELECT count(*)::int FROM actions a WHERE a.project_id = p.id AND a.status = 'open') AS open_actions,
            (SELECT count(*)::int FROM documents d WHERE d.project_id = p.id AND d.status = 'pending_review') AS pending_docs
       FROM projects p JOIN organizations o ON o.id = p.organization_id LEFT JOIN users c ON c.id = p.consultant_id
      WHERE ${s.where} ORDER BY p.updated_at DESC`,
    s.params,
  );
  const ids = projects.map((p) => p.id);
  const ownerFilter = u.role === 'manufacturer' ? `AND a.owner = 'manufacturer'` : '';
  const pendingActions = ids.length
    ? await many(
        `SELECT a.id, a.title, a.owner, a.due_date, a.project_id, p.title AS project_title
           FROM actions a JOIN projects p ON p.id = a.project_id
          WHERE a.project_id = ANY($1::int[]) AND a.status = 'open' ${ownerFilter}
          ORDER BY a.due_date NULLS LAST LIMIT 12`,
        [ids],
      )
    : [];
  const upcomingAudits = ids.length
    ? await many(
        `SELECT au.id, au.kind, au.title, au.scheduled_at, au.location, au.status, au.project_id, p.title AS project_title
           FROM audits au JOIN projects p ON p.id = au.project_id
          WHERE au.project_id = ANY($1::int[]) AND au.status = 'scheduled' AND au.scheduled_at >= now() - interval '1 day'
          ORDER BY au.scheduled_at LIMIT 8`,
        [ids],
      )
    : [];
  const recentMessages = ids.length
    ? await many(
        `SELECT m.id, m.body, m.created_at, m.project_id, p.title AS project_title, us.name AS sender_name, us.role AS sender_role
           FROM messages m JOIN projects p ON p.id = m.project_id LEFT JOIN users us ON us.id = m.sender_id
          WHERE m.project_id = ANY($1::int[]) ORDER BY m.created_at DESC LIMIT 6`,
        [ids],
      )
    : [];
  const newInquiries = isManager(u) ? (await one(`SELECT count(*)::int AS n FROM inquiries WHERE status = 'new'`)).n : null;
  res.json({ projects, pendingActions, upcomingAudits, recentMessages, newInquiries, stages: STAGES });
});

/* ------------------------------------------------------------------ projects */

portalRouter.get('/projects', async (req, res) => {
  const s = projectScope(req.user);
  const rows = await many(
    `SELECT p.id, p.title, p.product_category, p.current_stage, p.status, p.target_date, p.updated_at,
            o.name AS organization_name, c.name AS consultant_name
       FROM projects p JOIN organizations o ON o.id = p.organization_id LEFT JOIN users c ON c.id = p.consultant_id
      WHERE ${s.where} ORDER BY p.updated_at DESC`,
    s.params,
  );
  res.json({ items: rows });
});

const newProjectSchema = z.object({
  organizationId: z.coerce.number().int().positive(),
  title: z.string().trim().min(3).max(200),
  productCategory: z.enum(CATEGORY_NAMES, { message: 'Choose a product category' }),
  scope: z.string().trim().max(2000).optional(),
  standards: z.string().trim().max(1000).optional(),
  consultantId: z.coerce.number().int().positive().nullable().optional(),
  targetDate: dateStr,
});

portalRouter.post('/projects', requireRole('certification_manager', 'admin'), async (req, res) => {
  const d = parse(newProjectSchema, req.body);
  const org = await one(`SELECT id FROM organizations WHERE id = $1`, [d.organizationId]);
  if (!org) throw new HttpError(400, 'Organisation not found');
  if (d.consultantId) {
    const c = await one(`SELECT id FROM users WHERE id = $1 AND role = 'consultant' AND active`, [d.consultantId]);
    if (!c) throw new HttpError(400, 'Consultant not found');
  }
  const p = await one(
    `INSERT INTO projects (organization_id, title, product_category, scope, standards, consultant_id, manager_id, target_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [d.organizationId, d.title, d.productCategory, d.scope ?? null, d.standards ?? null, d.consultantId ?? null, req.user.id, d.targetDate ?? null],
  );
  await createMilestones(p.id, 1);
  await log(p.id, req.user.id, 'created', `Project created: ${d.title}`);
  res.status(201).json({ id: p.id });
});

portalRouter.get('/projects/:id', async (req, res) => {
  const p = await loadProjectFor(req.user, req.params.id);
  const [milestones, actions, audits, activity] = await Promise.all([
    many(`SELECT id, stage, title, status, due_date, completed_at FROM milestones WHERE project_id = $1 ORDER BY stage`, [p.id]),
    many(
      `SELECT a.id, a.title, a.description, a.owner, a.due_date, a.status, a.created_at, a.completed_at
         FROM actions a WHERE a.project_id = $1 ORDER BY (a.status = 'done'), a.due_date NULLS LAST, a.id`,
      [p.id],
    ),
    many(`SELECT id, kind, title, scheduled_at, location, status, notes FROM audits WHERE project_id = $1 ORDER BY scheduled_at`, [p.id]),
    many(
      `SELECT l.id, l.action, l.detail, l.created_at, us.name AS user_name FROM activity_log l LEFT JOIN users us ON us.id = l.user_id
        WHERE l.project_id = $1 ORDER BY l.created_at DESC LIMIT 15`,
      [p.id],
    ),
  ]);
  res.json({ project: p, milestones, actions, audits, activity, canManage: isManager(req.user) || p.consultant_id === req.user.id });
});

const patchProjectSchema = z.object({
  currentStage: z.coerce.number().int().min(1).max(10).optional(),
  status: z.enum(['active', 'on_hold', 'certified', 'closed']).optional(),
  consultantId: z.coerce.number().int().positive().nullable().optional(),
  targetDate: dateStr,
  scope: z.string().trim().max(2000).optional(),
  standards: z.string().trim().max(1000).optional(),
});

portalRouter.patch('/projects/:id', async (req, res) => {
  const p = await loadProjectFor(req.user, req.params.id);
  assertCanManage(req.user, p);
  const d = parse(patchProjectSchema, req.body);
  if (d.consultantId !== undefined && !isManager(req.user)) throw new HttpError(403, 'Only managers can reassign consultants');

  await query(
    `UPDATE projects SET
        current_stage = COALESCE($2, current_stage),
        status        = COALESCE($3, status),
        consultant_id = CASE WHEN $4::boolean THEN $5 ELSE consultant_id END,
        target_date   = CASE WHEN $6::boolean THEN $7::date ELSE target_date END,
        scope         = COALESCE($8, scope),
        standards     = COALESCE($9, standards),
        updated_at    = now()
      WHERE id = $1`,
    [p.id, d.currentStage ?? null, d.status ?? null, d.consultantId !== undefined, d.consultantId ?? null, d.targetDate !== undefined, d.targetDate ?? null, d.scope ?? null, d.standards ?? null],
  );
  if (d.currentStage && d.currentStage !== p.current_stage) {
    // Keep milestones consistent with the current stage.
    await query(
      `UPDATE milestones SET
          status = CASE WHEN stage < $2 THEN 'completed' WHEN stage = $2 THEN 'in_progress' ELSE 'pending' END,
          completed_at = CASE WHEN stage < $2 THEN COALESCE(completed_at, now()) ELSE NULL END
        WHERE project_id = $1`,
      [p.id, d.currentStage],
    );
    await log(p.id, req.user.id, 'stage', `Moved to stage ${d.currentStage}: ${STAGES[d.currentStage - 1].title}`);
  }
  if (d.status && d.status !== p.status) await log(p.id, req.user.id, 'status', `Status changed to ${d.status.replace('_', ' ')}`);
  res.json({ ok: true });
});

portalRouter.patch('/milestones/:id', async (req, res) => {
  const m = await one(`SELECT id, project_id, title FROM milestones WHERE id = $1`, [Number(req.params.id) || 0]);
  if (!m) throw new HttpError(404, 'Milestone not found');
  const p = await loadProjectFor(req.user, m.project_id);
  assertCanManage(req.user, p);
  const d = parse(z.object({ status: z.enum(['pending', 'in_progress', 'completed']).optional(), dueDate: dateStr }), req.body);
  await query(
    `UPDATE milestones SET status = COALESCE($2, status),
        due_date = CASE WHEN $3::boolean THEN $4::date ELSE due_date END,
        completed_at = CASE WHEN $2 = 'completed' THEN COALESCE(completed_at, now()) WHEN $2 IS NULL THEN completed_at ELSE NULL END
      WHERE id = $1`,
    [m.id, d.status ?? null, d.dueDate !== undefined, d.dueDate ?? null],
  );
  if (d.status) await log(p.id, req.user.id, 'milestone', `${m.title}: ${d.status.replace('_', ' ')}`);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ actions */

portalRouter.post('/projects/:id/actions', async (req, res) => {
  const p = await loadProjectFor(req.user, req.params.id);
  assertCanManage(req.user, p);
  const d = parse(
    z.object({
      title: z.string().trim().min(3).max(300),
      description: z.string().trim().max(2000).optional(),
      owner: z.enum(['manufacturer', 'esc']).default('manufacturer'),
      dueDate: dateStr,
    }),
    req.body,
  );
  const a = await one(
    `INSERT INTO actions (project_id, title, description, owner, due_date, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [p.id, d.title, d.description ?? null, d.owner, d.dueDate ?? null, req.user.id],
  );
  await log(p.id, req.user.id, 'action', `New action: ${d.title}`);
  res.status(201).json({ id: a.id });
});

portalRouter.patch('/actions/:id', async (req, res) => {
  const a = await one(`SELECT id, project_id, owner, title FROM actions WHERE id = $1`, [Number(req.params.id) || 0]);
  if (!a) throw new HttpError(404, 'Action not found');
  const p = await loadProjectFor(req.user, a.project_id);
  // Manufacturers may complete their own actions; staff assigned to the project may update any.
  if (!isStaff(req.user) && a.owner !== 'manufacturer') throw new HttpError(403, 'This action is handled by ESC');
  if (isStaff(req.user)) assertCanManage(req.user, p);
  const d = parse(z.object({ status: z.enum(['open', 'done']) }), req.body);
  await query(`UPDATE actions SET status = $2, completed_at = CASE WHEN $2 = 'done' THEN now() ELSE NULL END WHERE id = $1`, [a.id, d.status]);
  await log(p.id, req.user.id, 'action', `${d.status === 'done' ? 'Completed' : 'Re-opened'}: ${a.title}`);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ documents */

fs.mkdirSync(config.uploadDir, { recursive: true });

const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.png', '.jpg', '.jpeg', '.webp', '.dwg', '.dxf', '.step', '.stp', '.zip']);
export const DOC_CATEGORIES = [
  'company-registration',
  'product-datasheets',
  'technical-drawings',
  'material-specifications',
  'quality-certificates',
  'test-reports',
  'process-documentation',
  'product-images',
  'inspection-records',
  'factory-information',
  'report',
  'other',
];

const upload = multer({
  storage: multer.diskStorage({
    destination: config.uploadDir,
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.has(ext)) cb(null, true);
    else cb(new HttpError(400, `File type ${ext || '(none)'} is not allowed`));
  },
});

portalRouter.get('/projects/:id/documents', async (req, res) => {
  const p = await loadProjectFor(req.user, req.params.id);
  const rows = await many(
    `SELECT d.id, d.category, d.original_name, d.mime_type, d.size_bytes, d.is_report, d.status, d.review_note, d.created_at,
            us.name AS uploaded_by_name, us.role AS uploaded_by_role
       FROM documents d LEFT JOIN users us ON us.id = d.uploaded_by
      WHERE d.project_id = $1 ORDER BY d.created_at DESC`,
    [p.id],
  );
  res.json({ items: rows, categories: DOC_CATEGORIES });
});

portalRouter.post('/projects/:id/documents', async (req, res, next) => {
  // Authorise before accepting any bytes.
  const p = await loadProjectFor(req.user, req.params.id);
  upload.array('files', 10)(req, res, async (err) => {
    try {
      if (err) throw err instanceof HttpError ? err : new HttpError(400, err.code === 'LIMIT_FILE_SIZE' ? `Files must be smaller than ${config.maxUploadMb} MB` : err.message);
      const files = req.files ?? [];
      if (!files.length) throw new HttpError(400, 'Please choose at least one file');
      const category = DOC_CATEGORIES.includes(req.body.category) ? req.body.category : 'other';
      const asReport = isStaff(req.user) && (req.body.isReport === 'true' || category === 'report');
      if (asReport) assertCanManage(req.user, p);
      for (const f of files) {
        await query(
          `INSERT INTO documents (project_id, uploaded_by, category, original_name, stored_name, mime_type, size_bytes, is_report, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [p.id, req.user.id, asReport ? 'report' : category, f.originalname.slice(0, 255), f.filename, f.mimetype, f.size, asReport, asReport ? 'final' : 'pending_review'],
        );
      }
      await log(p.id, req.user.id, 'document', `${files.length} file(s) uploaded${asReport ? ' as report' : ''}`);
      res.status(201).json({ ok: true, count: files.length });
    } catch (e) {
      for (const f of req.files ?? []) fs.rm(f.path, { force: true }, () => {});
      next(e);
    }
  });
});

portalRouter.patch('/documents/:id', async (req, res) => {
  const d0 = await one(`SELECT id, project_id, original_name FROM documents WHERE id = $1`, [Number(req.params.id) || 0]);
  if (!d0) throw new HttpError(404, 'Document not found');
  const p = await loadProjectFor(req.user, d0.project_id);
  assertCanManage(req.user, p);
  const d = parse(z.object({ status: z.enum(['pending_review', 'approved', 'needs_revision']), reviewNote: z.string().trim().max(2000).optional() }), req.body);
  await query(`UPDATE documents SET status = $2, review_note = $3, reviewed_by = $4 WHERE id = $1`, [d0.id, d.status, d.reviewNote ?? null, req.user.id]);
  await log(p.id, req.user.id, 'review', `${d0.original_name}: ${d.status.replace('_', ' ')}`);
  res.json({ ok: true });
});

portalRouter.get('/documents/:id/download', async (req, res) => {
  const d = await one(`SELECT id, project_id, original_name, stored_name, mime_type FROM documents WHERE id = $1`, [Number(req.params.id) || 0]);
  if (!d) throw new HttpError(404, 'Document not found');
  await loadProjectFor(req.user, d.project_id);
  const file = path.join(config.uploadDir, path.basename(d.stored_name));
  if (!fs.existsSync(file)) throw new HttpError(410, 'File is no longer available');
  res.setHeader('Cache-Control', 'private, no-store');
  res.download(file, d.original_name);
});

/* ------------------------------------------------------------------ messages */

portalRouter.get('/projects/:id/messages', async (req, res) => {
  const p = await loadProjectFor(req.user, req.params.id);
  const rows = await many(
    `SELECT m.id, m.body, m.created_at, m.sender_id, us.name AS sender_name, us.role AS sender_role
       FROM messages m LEFT JOIN users us ON us.id = m.sender_id WHERE m.project_id = $1 ORDER BY m.created_at`,
    [p.id],
  );
  res.json({ items: rows });
});

portalRouter.post('/projects/:id/messages', async (req, res) => {
  const p = await loadProjectFor(req.user, req.params.id);
  const d = parse(z.object({ body: z.string().trim().min(1, 'Message is empty').max(5000) }), req.body);
  const m = await one(`INSERT INTO messages (project_id, sender_id, body) VALUES ($1,$2,$3) RETURNING id`, [p.id, req.user.id, d.body]);
  await query(`UPDATE projects SET updated_at = now() WHERE id = $1`, [p.id]);
  res.status(201).json({ id: m.id });
});

/* ------------------------------------------------------------------ audits */

const auditSchema = z.object({
  kind: z.enum(['mock_audit', 'factory_audit', 'lab_test', 'surveillance', 'meeting']),
  title: z.string().trim().min(3).max(200),
  scheduledAt: z.iso.datetime({ local: true, offset: true }),
  location: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

portalRouter.post('/projects/:id/audits', async (req, res) => {
  const p = await loadProjectFor(req.user, req.params.id);
  assertCanManage(req.user, p);
  const d = parse(auditSchema, req.body);
  const a = await one(
    `INSERT INTO audits (project_id, kind, title, scheduled_at, location, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [p.id, d.kind, d.title, d.scheduledAt, d.location ?? null, d.notes ?? null],
  );
  await log(p.id, req.user.id, 'audit', `Scheduled: ${d.title}`);
  res.status(201).json({ id: a.id });
});

portalRouter.patch('/audits/:id', async (req, res) => {
  const a = await one(`SELECT id, project_id, title FROM audits WHERE id = $1`, [Number(req.params.id) || 0]);
  if (!a) throw new HttpError(404, 'Audit not found');
  const p = await loadProjectFor(req.user, a.project_id);
  assertCanManage(req.user, p);
  const d = parse(
    z.object({ status: z.enum(['scheduled', 'completed', 'postponed', 'cancelled']).optional(), scheduledAt: z.iso.datetime({ local: true, offset: true }).optional(), notes: z.string().trim().max(2000).optional() }),
    req.body,
  );
  await query(`UPDATE audits SET status = COALESCE($2, status), scheduled_at = COALESCE($3::timestamptz, scheduled_at), notes = COALESCE($4, notes) WHERE id = $1`, [
    a.id,
    d.status ?? null,
    d.scheduledAt ?? null,
    d.notes ?? null,
  ]);
  if (d.status) await log(p.id, req.user.id, 'audit', `${a.title}: ${d.status}`);
  res.json({ ok: true });
});
