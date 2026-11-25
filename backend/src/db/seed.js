import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import { many, migrate, one, query, close } from './index.js';
import { STAGES, bodyToText, resourcesData } from '../shared.js';

/** Upsert knowledge-base resources from shared/resources.json. */
export async function seedResources() {
  for (const r of resourcesData) {
    await query(
      `INSERT INTO resources (slug, type, title, summary, body, body_text, tags, read_minutes, published_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)
       ON CONFLICT (slug) DO UPDATE SET type=EXCLUDED.type, title=EXCLUDED.title, summary=EXCLUDED.summary,
         body=EXCLUDED.body, body_text=EXCLUDED.body_text, tags=EXCLUDED.tags,
         read_minutes=EXCLUDED.read_minutes, published_at=EXCLUDED.published_at`,
      [r.slug, r.type, r.title, r.summary, JSON.stringify(r.body), bodyToText(r.body), r.tags, r.readMinutes, r.date],
    );
  }
}

/** Create the 10 standard milestones for a new project. */
export async function createMilestones(projectId, currentStage = 1) {
  for (const s of STAGES) {
    const status = s.stage < currentStage ? 'completed' : s.stage === currentStage ? 'in_progress' : 'pending';
    await query(
      `INSERT INTO milestones (project_id, stage, title, status, completed_at)
       VALUES ($1,$2,$3,$4, CASE WHEN $4 = 'completed' THEN now() ELSE NULL END)
       ON CONFLICT (project_id, stage) DO NOTHING`,
      [projectId, s.stage, s.title, status],
    );
  }
}

/** Production bootstrap: create the first administrator from env vars if none exists. */
export async function ensureAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  const existing = await one(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  if (existing) return;
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await query(`INSERT INTO users (name, email, password_hash, role, designation) VALUES ($1,$2,$3,'admin','Administrator')`, [
    ADMIN_NAME || 'Administrator',
    ADMIN_EMAIL.toLowerCase(),
    hash,
  ]);
  console.log(`[seed] Created administrator ${ADMIN_EMAIL}`);
}

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'EscDemo#2026';

/** Demo organisation, users and projects so the portal can be explored. Development only by default. */
export async function seedDemo() {
  const count = await one(`SELECT count(*)::int AS n FROM users`);
  if (count.n > 0) return false;

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const org = await one(
    `INSERT INTO organizations (name, sector, city) VALUES ('Demo Flow Controls Pvt. Ltd.', 'Valves', 'Coimbatore') RETURNING id`,
  );
  const org2 = await one(
    `INSERT INTO organizations (name, sector, city) VALUES ('Demo Polymer Pipes Ltd.', 'Pipes', 'Ahmedabad') RETURNING id`,
  );

  const mk = (name, email, role, designation, orgId = null) =>
    one(
      `INSERT INTO users (organization_id, name, email, password_hash, role, designation) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [orgId, name, email, hash, role, designation],
    );
  const admin = await mk('Portal Administrator', 'admin@demo.esc', 'admin', 'Administrator');
  const manager = await mk('Certification Manager', 'manager@demo.esc', 'certification_manager', 'Head of Certification');
  const consultant = await mk('Senior Consultant', 'consultant@demo.esc', 'consultant', 'Certification Consultant');
  const client = await mk('Quality Head (Demo)', 'client@demo.esc', 'manufacturer', 'Head of Quality', org.id);
  await mk('Export Manager (Demo)', 'client2@demo.esc', 'manufacturer', 'Export Manager', org2.id);

  const p1 = await one(
    `INSERT INTO projects (organization_id, title, product_category, scope, standards, current_stage, consultant_id, manager_id, target_date)
     VALUES ($1, 'Brass ball valves DN15–DN50', 'Valves', 'Ball valves for drinking-water installations, PN 16',
             'DIN EN 13828; UBA evaluation criteria', 5, $2, $3, (CURRENT_DATE + INTERVAL '7 months')::date) RETURNING id`,
    [org.id, consultant.id, manager.id],
  );
  const p2 = await one(
    `INSERT INTO projects (organization_id, title, product_category, scope, standards, current_stage, consultant_id, manager_id, target_date)
     VALUES ($1, 'PE 100 pressure pipes SDR 11 / SDR 17', 'Pipes', 'PE 100 pipes d32–d250 for water distribution',
             'DIN EN 12201-2; DVGW GW 335-A2', 3, $2, $3, (CURRENT_DATE + INTERVAL '10 months')::date) RETURNING id`,
    [org2.id, consultant.id, manager.id],
  );
  await createMilestones(p1.id, 5);
  await createMilestones(p2.id, 3);

  const acts = [
    [p1.id, 'Upload elastomer compound certificates (seat seals)', 'manufacturer', 7],
    [p1.id, 'Confirm brass alloy designation for body and ball', 'manufacturer', 10],
    [p1.id, 'Send 3 samples per size group for pre-test', 'manufacturer', 21],
    [p1.id, 'Prepare test programme for laboratory', 'esc', 14],
    [p2.id, 'Upload resin supplier approval documents', 'manufacturer', 5],
  ];
  for (const [pid, title, owner, days] of acts) {
    await query(
      `INSERT INTO actions (project_id, title, owner, due_date, created_by) VALUES ($1,$2,$3,(CURRENT_DATE + ($4 || ' days')::interval)::date,$5)`,
      [pid, title, owner, String(days), consultant.id],
    );
  }
  await query(
    `INSERT INTO actions (project_id, title, owner, status, completed_at, created_by) VALUES ($1,'Submit company registration documents','manufacturer','done', now() - interval '20 days', $2)`,
    [p1.id, consultant.id],
  );

  await query(
    `INSERT INTO audits (project_id, kind, title, scheduled_at, location, notes) VALUES
      ($1,'mock_audit','Mock factory audit',  now() + interval '18 days', 'Coimbatore plant', 'ESC consultant on site, full FPC walkthrough'),
      ($1,'lab_test','Laboratory type testing (planned start)', now() + interval '45 days', 'Accredited laboratory, Germany', NULL),
      ($2,'meeting','Gap analysis review meeting', now() + interval '6 days', 'Video conference', NULL)`,
    [p1.id, p2.id],
  );

  const msgs = [
    [p1.id, consultant.id, 'Gap analysis report is uploaded under Reports. Key topic: the seat-seal compound needs drinking-water evidence.'],
    [p1.id, client.id, 'Thank you. We have contacted our elastomer supplier and expect the certificates this week.'],
    [p1.id, consultant.id, 'Great. Once received, please upload them. We will then finalise the test programme.'],
  ];
  for (const [pid, sid, body] of msgs) {
    await query(`INSERT INTO messages (project_id, sender_id, body) VALUES ($1,$2,$3)`, [pid, sid, body]);
  }

  await query(
    `INSERT INTO inquiries (kind, company_name, contact_person, designation, email, mobile, product_category, sector, certification_status, target_market, message, status)
     VALUES
     ('assessment','Example Pumps Pvt. Ltd.','Demo Contact','Managing Director','demo-contact@example.com','+91 90000 00000','Pumps','Pump Manufacturer','Not started','Germany','We would like to certify our stainless-steel booster pumps.','new'),
     ('consultation','Example Meters Ltd.','Demo Contact 2','Export Head','demo-contact2@example.com','+91 90000 00001','Water Meters','Water Meter Manufacturer','MID in progress','Germany and EU','Need guidance on DVGW requirements alongside MID.','contacted')`,
  );

  await query(`INSERT INTO activity_log (project_id, user_id, action, detail) VALUES ($1,$2,'stage','Moved to Testing Preparation')`, [
    p1.id,
    consultant.id,
  ]);
  void admin;
  return true;
}

export async function runSeed({ demo = !config.isProd || process.env.SEED_DEMO === 'true' } = {}) {
  await seedResources();
  await ensureAdmin();
  if (demo) {
    const created = await seedDemo();
    if (created) {
      console.log(`[seed] Demo data created. Demo logins (password "${DEMO_PASSWORD}"):`);
      const users = await many(`SELECT email, role FROM users ORDER BY id`);
      users.forEach((u) => console.log(`        ${u.role.padEnd(22)} ${u.email}`));
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await migrate();
  await runSeed();
  await close();
}
