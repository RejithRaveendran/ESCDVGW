import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { many, one, query } from '../db/index.js';
import { HttpError, requireAuth, requireRole } from '../auth.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);

const managers = requireRole('certification_manager', 'admin');
const parse = (schema, data) => {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, r.error.issues[0]?.message ?? 'Invalid input');
  return r.data;
};

/* ------------------------------------------------------------------ inquiries */

adminRouter.get('/inquiries', managers, async (req, res) => {
  const status = String(req.query.status ?? '');
  const q = String(req.query.q ?? '').trim().slice(0, 100);
  const params = [];
  const where = [];
  if (status) {
    params.push(status);
    where.push(`i.status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    where.push(`(i.company_name ILIKE $${params.length} OR i.contact_person ILIKE $${params.length} OR i.email ILIKE $${params.length})`);
  }
  const rows = await many(
    `SELECT i.*, us.name AS assigned_name FROM inquiries i LEFT JOIN users us ON us.id = i.assigned_to
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY i.created_at DESC LIMIT 200`,
    params,
  );
  res.json({ items: rows });
});

adminRouter.patch('/inquiries/:id', managers, async (req, res) => {
  const d = parse(
    z.object({
      status: z.enum(['new', 'contacted', 'qualified', 'won', 'closed']).optional(),
      assignedTo: z.coerce.number().int().positive().nullable().optional(),
      notes: z.string().trim().max(4000).optional(),
    }),
    req.body,
  );
  const updated = await one(
    `UPDATE inquiries SET status = COALESCE($2, status),
        assigned_to = CASE WHEN $3::boolean THEN $4 ELSE assigned_to END,
        notes = COALESCE($5, notes), updated_at = now()
      WHERE id = $1 RETURNING id`,
    [Number(req.params.id) || 0, d.status ?? null, d.assignedTo !== undefined, d.assignedTo ?? null, d.notes ?? null],
  );
  if (!updated) throw new HttpError(404, 'Inquiry not found');
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ analytics */

adminRouter.get('/analytics', managers, async (_req, res) => {
  const [totals, byStage, byCategory, inquiriesByStatus, inquiriesByMonth, inquiriesByCategory, docs] = await Promise.all([
    one(`SELECT
          (SELECT count(*)::int FROM projects WHERE status = 'active') AS active_projects,
          (SELECT count(*)::int FROM projects WHERE status = 'certified') AS certified_projects,
          (SELECT count(*)::int FROM inquiries) AS inquiries_total,
          (SELECT count(*)::int FROM inquiries WHERE created_at >= now() - interval '30 days') AS inquiries_30d,
          (SELECT count(*)::int FROM documents WHERE status = 'pending_review') AS docs_pending,
          (SELECT count(*)::int FROM actions WHERE status = 'open' AND due_date < CURRENT_DATE) AS actions_overdue,
          (SELECT count(*)::int FROM audits WHERE status = 'scheduled' AND scheduled_at BETWEEN now() AND now() + interval '30 days') AS audits_next_30d`),
    many(`SELECT current_stage AS stage, count(*)::int AS n FROM projects WHERE status IN ('active','on_hold') GROUP BY 1 ORDER BY 1`),
    many(`SELECT product_category AS category, count(*)::int AS n FROM projects GROUP BY 1 ORDER BY 2 DESC`),
    many(`SELECT status, count(*)::int AS n FROM inquiries GROUP BY 1`),
    many(`SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, count(*)::int AS n
            FROM inquiries WHERE created_at >= date_trunc('month', now()) - interval '5 months' GROUP BY 1 ORDER BY 1`),
    many(`SELECT COALESCE(product_category, 'Not specified') AS category, count(*)::int AS n FROM inquiries GROUP BY 1 ORDER BY 2 DESC`),
    many(`SELECT status, count(*)::int AS n FROM documents WHERE NOT is_report GROUP BY 1`),
  ]);
  res.json({ totals, byStage, byCategory, inquiriesByStatus, inquiriesByMonth, inquiriesByCategory, docs });
});

/* ------------------------------------------------------------------ organisations */

adminRouter.get('/organizations', managers, async (_req, res) => {
  res.json({
    items: await many(
      `SELECT o.*, (SELECT count(*)::int FROM users u WHERE u.organization_id = o.id) AS users,
              (SELECT count(*)::int FROM projects p WHERE p.organization_id = o.id) AS projects
         FROM organizations o ORDER BY o.name`,
    ),
  });
});

adminRouter.post('/organizations', managers, async (req, res) => {
  const d = parse(
    z.object({ name: z.string().trim().min(2).max(200), sector: z.string().trim().max(120).optional(), city: z.string().trim().max(120).optional(), country: z.string().trim().max(80).optional() }),
    req.body,
  );
  const o = await one(`INSERT INTO organizations (name, sector, city, country) VALUES ($1,$2,$3,COALESCE($4,'India')) RETURNING id`, [
    d.name,
    d.sector ?? null,
    d.city ?? null,
    d.country ?? null,
  ]);
  res.status(201).json({ id: o.id });
});

/* ------------------------------------------------------------------ users */

adminRouter.get('/users', managers, async (req, res) => {
  const role = String(req.query.role ?? '');
  // Managers may list users (to assign consultants); only admins manage them.
  const rows = await many(
    `SELECT u.id, u.name, u.email, u.role, u.designation, u.active, u.last_login_at, u.created_at, u.organization_id, o.name AS organization_name
       FROM users u LEFT JOIN organizations o ON o.id = u.organization_id
      ${role ? 'WHERE u.role = $1' : ''} ORDER BY u.role, u.name`,
    role ? [role] : [],
  );
  res.json({ items: rows });
});

const ROLES = ['manufacturer', 'consultant', 'certification_manager', 'admin'];
const password = z.string().min(10, 'Password must be at least 10 characters').max(200);

adminRouter.post('/users', requireRole('admin'), async (req, res) => {
  const d = parse(
    z.object({
      name: z.string().trim().min(2).max(120),
      email: z.email().max(200),
      role: z.enum(ROLES),
      designation: z.string().trim().max(120).optional(),
      organizationId: z.coerce.number().int().positive().nullable().optional(),
      password,
    }),
    req.body,
  );
  if (d.role === 'manufacturer' && !d.organizationId) throw new HttpError(400, 'Manufacturer users must belong to an organisation');
  const exists = await one(`SELECT id FROM users WHERE email = $1`, [d.email.toLowerCase()]);
  if (exists) throw new HttpError(409, 'A user with this e-mail already exists');
  const hash = await bcrypt.hash(d.password, 12);
  const u = await one(
    `INSERT INTO users (organization_id, name, email, password_hash, role, designation) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [d.role === 'manufacturer' ? d.organizationId : null, d.name, d.email.toLowerCase(), hash, d.role, d.designation ?? null],
  );
  res.status(201).json({ id: u.id });
});

adminRouter.patch('/users/:id', requireRole('admin'), async (req, res) => {
  const id = Number(req.params.id) || 0;
  const d = parse(z.object({ active: z.boolean().optional(), role: z.enum(ROLES).optional(), password: password.optional() }), req.body);
  if (id === req.user.id && (d.active === false || (d.role && d.role !== 'admin'))) throw new HttpError(400, 'You cannot deactivate or demote your own account');
  const hash = d.password ? await bcrypt.hash(d.password, 12) : null;
  await query(`UPDATE users SET active = COALESCE($2, active), role = COALESCE($3, role), password_hash = COALESCE($4, password_hash) WHERE id = $1`, [
    id,
    d.active ?? null,
    d.role ?? null,
    hash,
  ]);
  res.json({ ok: true });
});
