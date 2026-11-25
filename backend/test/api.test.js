// Integration tests: run with `npm test -w backend`. Uses a throwaway embedded PGlite database.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'esc-dvgw-test-'));
process.env.PGLITE_DIR = path.join(tmp, 'db');
process.env.UPLOAD_DIR = path.join(tmp, 'uploads');
process.env.DATABASE_URL = '';
process.env.NODE_ENV = 'test';

const { migrate, close } = await import('../src/db/index.js');
const { runSeed } = await import('../src/db/seed.js');
const { createApp } = await import('../src/app.js');

let server;
let base;
const PW = 'EscDemo#2026';
const H = { 'X-Requested-With': 'esc-portal' };

async function req(method, url, { body, cookie, form, headers = H } = {}) {
  const h = { ...headers };
  if (cookie) h.Cookie = cookie;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const r = await fetch(base + url, { method, headers: h, body: payload });
  const data = r.headers.get('content-type')?.includes('json') ? await r.json() : await r.text();
  return { status: r.status, data, headers: r.headers };
}
async function login(email) {
  const r = await req('POST', '/api/auth/login', { body: { email, password: PW } });
  assert.equal(r.status, 200, `login ${email}`);
  return r.headers.get('set-cookie').split(';')[0];
}

before(async () => {
  await migrate();
  await runSeed({ demo: true });
  server = createApp().listen(0);
  base = `http://localhost:${server.address().port}`;
});
after(async () => {
  server?.close();
  await close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('state-changing requests require the CSRF header', async () => {
  const r = await req('POST', '/api/inquiries', { body: {}, headers: {} });
  assert.equal(r.status, 403);
});

test('inquiry validation and creation', async () => {
  const bad = await req('POST', '/api/inquiries', { body: { companyName: 'X' } });
  assert.equal(bad.status, 400);
  assert.ok(bad.data.fields.email);
  const ok = await req('POST', '/api/inquiries', {
    body: { companyName: 'Test Valves', contactPerson: 'Tester', email: 't@example.com', mobile: '+91 98765 43210', kind: 'assessment' },
  });
  assert.equal(ok.status, 201);
  assert.match(ok.data.reference, /^ESC-\d{5}$/);
});

test('wrong password is rejected', async () => {
  const r = await req('POST', '/api/auth/login', { body: { email: 'client@demo.esc', password: 'nope' } });
  assert.equal(r.status, 401);
});

test('manufacturers only see their own organisation', async () => {
  const c1 = await login('client@demo.esc');
  const c2 = await login('client2@demo.esc');
  const l1 = await req('GET', '/api/portal/projects', { cookie: c1 });
  const l2 = await req('GET', '/api/portal/projects', { cookie: c2 });
  assert.deepEqual(l1.data.items.map((p) => p.id), [1]);
  assert.deepEqual(l2.data.items.map((p) => p.id), [2]);
  assert.equal((await req('GET', '/api/portal/projects/1', { cookie: c2 })).status, 404);
  assert.equal((await req('GET', '/api/portal/projects/1/messages', { cookie: c2 })).status, 404);
});

test('manufacturers cannot manage projects or see staff areas', async () => {
  const c = await login('client@demo.esc');
  assert.equal((await req('PATCH', '/api/portal/projects/1', { cookie: c, body: { currentStage: 9 } })).status, 403);
  assert.equal((await req('GET', '/api/admin/inquiries', { cookie: c })).status, 403);
  assert.equal((await req('GET', '/api/admin/analytics', { cookie: c })).status, 403);
});

test('consultant moves stage and milestones follow', async () => {
  const k = await login('consultant@demo.esc');
  assert.equal((await req('PATCH', '/api/portal/projects/1', { cookie: k, body: { currentStage: 7 } })).status, 200);
  const d = await req('GET', '/api/portal/projects/1', { cookie: k });
  assert.equal(d.data.project.current_stage, 7);
  assert.equal(d.data.milestones.find((m) => m.stage === 6).status, 'completed');
  assert.equal(d.data.milestones.find((m) => m.stage === 7).status, 'in_progress');
});

test('document upload: allow-list, scoped download, staff review', async () => {
  const c = await login('client@demo.esc');
  const c2 = await login('client2@demo.esc');
  const k = await login('consultant@demo.esc');

  const bad = new FormData();
  bad.append('files', new Blob(['x']), 'evil.exe');
  assert.equal((await req('POST', '/api/portal/projects/1/documents', { cookie: c, form: bad })).status, 400);

  const fd = new FormData();
  fd.append('category', 'product-datasheets');
  fd.append('files', new Blob(['datasheet']), 'datasheet.pdf');
  assert.equal((await req('POST', '/api/portal/projects/1/documents', { cookie: c, form: fd })).status, 201);

  const list = await req('GET', '/api/portal/projects/1/documents', { cookie: c });
  const doc = list.data.items[0];
  assert.equal(doc.status, 'pending_review');
  assert.equal((await req('GET', `/api/portal/documents/${doc.id}/download`, { cookie: c })).data, 'datasheet');
  assert.equal((await req('GET', `/api/portal/documents/${doc.id}/download`, { cookie: c2 })).status, 404);
  assert.equal((await req('PATCH', `/api/portal/documents/${doc.id}`, { cookie: c, body: { status: 'approved' } })).status, 403);
  assert.equal((await req('PATCH', `/api/portal/documents/${doc.id}`, { cookie: k, body: { status: 'approved' } })).status, 200);
});

test('manufacturer can only complete manufacturer-owned actions', async () => {
  const c = await login('client@demo.esc');
  const d = await req('GET', '/api/portal/projects/1', { cookie: c });
  const mine = d.data.actions.find((a) => a.owner === 'manufacturer' && a.status === 'open');
  const esc = d.data.actions.find((a) => a.owner === 'esc');
  assert.equal((await req('PATCH', `/api/portal/actions/${mine.id}`, { cookie: c, body: { status: 'done' } })).status, 200);
  assert.equal((await req('PATCH', `/api/portal/actions/${esc.id}`, { cookie: c, body: { status: 'done' } })).status, 403);
});

test('only admins create users; managers create projects', async () => {
  const m = await login('manager@demo.esc');
  const a = await login('admin@demo.esc');
  const user = { name: 'New User', email: 'new@example.com', role: 'consultant', password: 'longenough123' };
  assert.equal((await req('POST', '/api/admin/users', { cookie: m, body: user })).status, 403);
  assert.equal((await req('POST', '/api/admin/users', { cookie: a, body: user })).status, 201);
  const p = await req('POST', '/api/portal/projects', { cookie: m, body: { organizationId: 1, title: 'Gate valves DN80', productCategory: 'Valves' } });
  assert.equal(p.status, 201);
  const d = await req('GET', `/api/portal/projects/${p.data.id}`, { cookie: m });
  assert.equal(d.data.milestones.length, 10);
});

test('knowledge base search and checklist PDF', async () => {
  const s = await req('GET', '/api/resources?q=hygiene');
  assert.ok(s.data.items.some((r) => r.slug === 'drinking-water-hygiene-uba-criteria'));
  const all = await req('GET', '/api/resources');
  assert.ok(all.data.items.length >= 10);
  const pdf = await fetch(`${base}/api/checklists/pumps.pdf`);
  assert.equal(pdf.headers.get('content-type'), 'application/pdf');
  assert.equal((await fetch(`${base}/api/checklists/unknown.pdf`)).status, 404);
});
