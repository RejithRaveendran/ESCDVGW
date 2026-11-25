import { useState, type FormEvent } from 'react';
import { Mail, Phone, Search } from 'lucide-react';
import { api, ApiError, cn, fmtDate } from '@/lib/api';
import { ROLE_LABEL, useApi, useAuth, type Role } from './auth';
import { Empty, ErrorNote, Loading, PageTitle, Panel, StatusBadge } from './PortalLayout';

/* ====================================================================== inquiries */
type Inquiry = {
  id: number;
  kind: string;
  company_name: string;
  contact_person: string;
  designation: string;
  email: string;
  mobile: string;
  product_category: string;
  sector: string;
  certification_status: string;
  target_market: string;
  message: string;
  status: string;
  assigned_to: number | null;
  assigned_name: string;
  notes: string;
  created_at: string;
};
const INQ_STATUSES = ['new', 'contacted', 'qualified', 'won', 'closed'];

export function Inquiries() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const qs = new URLSearchParams({ ...(status && { status }), ...(q && { q }) }).toString();
  const { data, error, reload } = useApi<{ items: Inquiry[] }>(`/admin/inquiries?${qs}`);
  const staff = useApi<{ items: { id: number; name: string; role: Role; active: boolean }[] }>('/admin/users');
  const [open, setOpen] = useState<number | null>(null);
  const [err, setErr] = useState('');

  const patch = async (id: number, body: Record<string, unknown>) => {
    try {
      await api(`/admin/inquiries/${id}`, { method: 'PATCH', body });
      setErr('');
      reload();
    } catch (e) {
      setErr((e as ApiError).message);
    }
  };

  return (
    <>
      <PageTitle title="Inquiry management" sub="Consultation and assessment requests from the website" />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" aria-label="Search inquiries" className="field pl-9" placeholder="Company, contact or e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by status">
          {['', ...INQ_STATUSES].map((s) => (
            <button key={s || 'all'} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} className={cn('rounded-full border px-3 py-1 text-xs font-semibold capitalize', status === s ? 'border-navy bg-navy text-white' : 'border-line-strong text-navy')}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>
      {(error || err) && <ErrorNote message={error?.message ?? err} />}
      {!data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <Empty>No inquiries match.</Empty>
      ) : (
        <div className="space-y-3">
          {data.items.map((i) => (
            <article key={i.id} className="card">
              <button type="button" className="flex w-full flex-wrap items-center gap-4 p-5 text-left" aria-expanded={open === i.id} onClick={() => setOpen(open === i.id ? null : i.id)}>
                <span className="w-24 shrink-0 text-xs text-muted">ESC-{String(i.id).padStart(5, '0')}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-navy">{i.company_name}</span>
                  <span className="block text-xs text-muted">
                    {i.contact_person}
                    {i.designation && `, ${i.designation}`} · {i.product_category ?? 'No category'} · {i.kind === 'assessment' ? 'Assessment' : 'Consultation'}
                  </span>
                </span>
                <span className="text-xs text-muted">{fmtDate(i.created_at)}</span>
                <StatusBadge status={i.status} />
              </button>
              {open === i.id && (
                <div className="grid gap-6 border-t border-line p-5 md:grid-cols-2">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Sector', i.sector],
                      ['Certification status', i.certification_status],
                      ['Target market', i.target_market],
                      ['Assigned to', i.assigned_name],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-muted">{k}</dt>
                        <dd className="text-navy">{v || '—'}</dd>
                      </div>
                    ))}
                    <div className="col-span-2">
                      <dt className="text-xs text-muted">Message</dt>
                      <dd className="whitespace-pre-wrap text-body">{i.message || '—'}</dd>
                    </div>
                    <div className="col-span-2 flex flex-wrap gap-4">
                      <a href={`mailto:${i.email}`} className="link-arrow">
                        <Mail className="h-4 w-4" /> {i.email}
                      </a>
                      {i.mobile && (
                        <a href={`tel:${i.mobile.replace(/[^+\d]/g, '')}`} className="link-arrow">
                          <Phone className="h-4 w-4" /> {i.mobile}
                        </a>
                      )}
                    </div>
                  </dl>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="field-label text-xs" htmlFor={`st-${i.id}`}>Status</label>
                        <select id={`st-${i.id}`} className="field py-2" value={i.status} onChange={(e) => patch(i.id, { status: e.target.value })}>
                          {INQ_STATUSES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="field-label text-xs" htmlFor={`as-${i.id}`}>Assign to</label>
                        <select id={`as-${i.id}`} className="field py-2" value={i.assigned_to ?? ''} onChange={(e) => patch(i.id, { assignedTo: e.target.value ? Number(e.target.value) : null })}>
                          <option value="">Unassigned</option>
                          {staff.data?.items
                            .filter((u) => u.role !== 'manufacturer' && u.active)
                            .map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        patch(i.id, { notes: String(new FormData(e.currentTarget).get('notes') ?? '') });
                      }}
                    >
                      <label className="field-label text-xs" htmlFor={`n-${i.id}`}>Internal notes</label>
                      <textarea id={`n-${i.id}`} name="notes" rows={3} className="field" defaultValue={i.notes ?? ''} />
                      <button type="submit" className="btn-secondary mt-2 py-2 text-xs">Save notes</button>
                    </form>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}

/* ====================================================================== analytics */
type Analytics = {
  totals: Record<string, number>;
  byStage: { stage: number; n: number }[];
  byCategory: { category: string; n: number }[];
  inquiriesByStatus: { status: string; n: number }[];
  inquiriesByMonth: { month: string; n: number }[];
  inquiriesByCategory: { category: string; n: number }[];
};
const STAGE_NAMES = ['Consultation', 'Feasibility', 'Documentation', 'Gap analysis', 'Test preparation', 'Lab testing', 'Factory audit', 'Submission', 'Approval', 'Market entry'];

export function AnalyticsPage() {
  const { data, error } = useApi<Analytics>('/admin/analytics');
  if (error) return <ErrorNote message={error.message} />;
  if (!data) return <Loading />;
  const t = data.totals;
  const months = lastMonths(6).map((m) => ({ label: new Date(`${m}-01`).toLocaleDateString('en-GB', { month: 'short' }), n: data.inquiriesByMonth.find((x) => x.month === m)?.n ?? 0 }));

  return (
    <>
      <PageTitle title="Dashboard analytics" sub="Certification pipeline and inquiry performance" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Active projects" value={t.active_projects} note={`${t.certified_projects} certified`} />
        <Stat label="Inquiries (30 days)" value={t.inquiries_30d} note={`${t.inquiries_total} all time`} />
        <Stat label="Documents awaiting review" value={t.docs_pending} />
        <Stat label="Overdue actions" value={t.actions_overdue} note={`${t.audits_next_30d} audits in the next 30 days`} warn={t.actions_overdue > 0} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Active projects by stage">
          <BarList rows={STAGE_NAMES.map((name, i) => ({ label: `${i + 1}. ${name}`, n: data.byStage.find((s) => s.stage === i + 1)?.n ?? 0 }))} unit="project" />
        </Panel>
        <Panel title="Inquiries per month (last 6 months)">
          <ColumnChart rows={months} unit="inquiry" />
        </Panel>
        <Panel title="Inquiries by status">
          <BarList rows={INQ_STATUSES.map((s) => ({ label: s[0].toUpperCase() + s.slice(1), n: data.inquiriesByStatus.find((x) => x.status === s)?.n ?? 0 }))} unit="inquiry" />
        </Panel>
        <Panel title="Inquiries by product category">
          {data.inquiriesByCategory.length ? <BarList rows={data.inquiriesByCategory.map((c) => ({ label: c.category, n: c.n }))} unit="inquiry" /> : <Empty>No inquiries yet.</Empty>}
        </Panel>
      </div>
    </>
  );
}

function lastMonths(n: number) {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

function Stat({ label, value, note, warn }: { label: string; value: number; note?: string; warn?: boolean }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-extrabold text-navy">{value}</p>
      {note && <p className={warn ? 'mt-1 text-xs font-semibold text-red' : 'mt-1 text-xs text-muted'}>{note}</p>}
    </div>
  );
}

/** Single-series horizontal bars: one ink colour, value labels in text colour, hover tooltip, readable as a table. */
function BarList({ rows, unit }: { rows: { label: string; n: number }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <table className="w-full text-sm">
      <thead className="sr-only">
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Count</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="group" title={`${r.label}: ${r.n} ${unit}${r.n === 1 ? '' : unit.endsWith('y') ? '' : 's'}`}>
            <th scope="row" className="w-44 py-1.5 pr-3 text-left text-xs font-medium text-body">
              {r.label}
            </th>
            <td className="py-1.5">
              <div className="flex items-center gap-2">
                <div className="h-3.5 flex-1">
                  <div className="h-full rounded-r-[4px] bg-navy transition-colors group-hover:bg-navy-600" style={{ width: `${(r.n / max) * 100}%`, minWidth: r.n ? 3 : 0 }} />
                </div>
                <span className="w-6 text-right text-xs font-semibold tabular-nums text-navy">{r.n}</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ColumnChart({ rows, unit }: { rows: { label: string; n: number }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <figure>
      <div className="flex h-48 items-end gap-3 border-b border-line-strong" role="img" aria-label={rows.map((r) => `${r.label}: ${r.n}`).join(', ')}>
        {rows.map((r) => (
          <div key={r.label} className="group relative flex h-full flex-1 flex-col items-center justify-end" title={`${r.label}: ${r.n} ${r.n === 1 ? unit : 'inquiries'}`}>
            <span className="mb-1 text-xs font-semibold tabular-nums text-navy">{r.n}</span>
            <div className="w-full max-w-10 rounded-t-[4px] bg-navy transition-colors group-hover:bg-navy-600" style={{ height: `${(r.n / max) * 80}%`, minHeight: r.n ? 3 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {rows.map((r) => (
          <span key={r.label} className="flex-1 text-center text-xs text-muted">
            {r.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

/* ====================================================================== users & organisations */
type UserRow = { id: number; name: string; email: string; role: Role; designation: string; active: boolean; last_login_at: string; organization_name: string };

export function UsersPage() {
  const { user: me } = useAuth();
  const users = useApi<{ items: UserRow[] }>('/admin/users');
  const orgs = useApi<{ items: { id: number; name: string; sector: string; city: string; users: number; projects: number }[] }>('/admin/organizations');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const isAdmin = me?.role === 'admin';

  const act = async (fn: () => Promise<unknown>, ok: string, reload: () => void, form?: HTMLFormElement) => {
    try {
      await fn();
      setMsg({ ok: true, text: ok });
      form?.reset();
      reload();
    } catch (e) {
      setMsg({ ok: false, text: (e as ApiError).message });
    }
  };

  function addUser(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    act(() => api('/admin/users', { body: { ...f, organizationId: f.organizationId ? Number(f.organizationId) : null } }), 'User created. Share the temporary password securely.', users.reload, e.currentTarget);
  }
  function addOrg(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    act(() => api('/admin/organizations', { body: f }), 'Organisation created', orgs.reload, e.currentTarget);
  }

  return (
    <>
      <PageTitle title="Users & organisations" sub={isAdmin ? 'Manage portal access and roles' : 'Read-only: only administrators can change users'} />
      {msg && <p className={cn('mb-5 rounded-btn px-4 py-2.5 text-sm font-medium', msg.ok ? 'bg-success-50 text-success' : 'bg-red-50 text-red')}>{msg.text}</p>}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Users">
          {!users.data ? (
            <Loading />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col" className="pb-3 font-semibold">Name</th>
                    <th scope="col" className="pb-3 font-semibold">Role</th>
                    <th scope="col" className="pb-3 font-semibold">Last sign-in</th>
                    <th scope="col" className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.data.items.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 pr-3">
                        <p className="font-medium text-navy">{u.name}</p>
                        <p className="text-xs text-muted">
                          {u.email}
                          {u.organization_name && ` · ${u.organization_name}`}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        {isAdmin && u.id !== me!.id ? (
                          <select aria-label={`Role of ${u.name}`} className="field w-auto py-1.5 text-xs" value={u.role} onChange={(e) => act(() => api(`/admin/users/${u.id}`, { method: 'PATCH', body: { role: e.target.value } }), 'Role updated', users.reload)}>
                            {Object.entries(ROLE_LABEL).map(([k, l]) => (
                              <option key={k} value={k}>
                                {l}
                              </option>
                            ))}
                          </select>
                        ) : (
                          ROLE_LABEL[u.role]
                        )}
                      </td>
                      <td className="py-3 pr-3 text-xs">{fmtDate(u.last_login_at, true)}</td>
                      <td className="py-3">
                        {isAdmin && u.id !== me!.id ? (
                          <button type="button" className={cn('badge', u.active ? 'bg-success-50 text-success' : 'bg-surface text-muted')} onClick={() => act(() => api(`/admin/users/${u.id}`, { method: 'PATCH', body: { active: !u.active } }), u.active ? 'User deactivated' : 'User activated', users.reload)}>
                            {u.active ? 'Active' : 'Inactive'}
                          </button>
                        ) : (
                          <StatusBadge status={u.active ? 'active' : 'inactive'} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <div className="space-y-6">
          {isAdmin && (
            <Panel title="Add user">
              <form onSubmit={addUser} className="space-y-3">
                <input name="name" required minLength={2} className="field" placeholder="Full name" aria-label="Full name" />
                <input name="email" type="email" required className="field" placeholder="E-mail" aria-label="E-mail" />
                <input name="designation" className="field" placeholder="Designation" aria-label="Designation" />
                <select name="role" className="field" aria-label="Role" defaultValue="manufacturer">
                  {Object.entries(ROLE_LABEL).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
                <select name="organizationId" className="field" aria-label="Organisation (manufacturers)">
                  <option value="">Organisation (manufacturer users)</option>
                  {orgs.data?.items.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <input name="password" type="password" required minLength={10} autoComplete="new-password" className="field" placeholder="Temporary password (min. 10 characters)" aria-label="Temporary password" />
                <button type="submit" className="btn-primary w-full">Create user</button>
              </form>
            </Panel>
          )}
          <Panel title="Organisations">
            <form onSubmit={addOrg} className="mb-4 flex gap-2">
              <input name="name" required minLength={2} className="field" placeholder="New manufacturer name" aria-label="Organisation name" />
              <button type="submit" className="btn-secondary shrink-0">Add</button>
            </form>
            {!orgs.data ? (
              <Loading />
            ) : (
              <ul className="divide-y divide-line text-sm">
                {orgs.data.items.map((o) => (
                  <li key={o.id} className="flex justify-between py-2.5">
                    <span className="font-medium text-navy">{o.name}</span>
                    <span className="text-xs text-muted">
                      {o.users} users · {o.projects} projects
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {users.error && <ErrorNote message={users.error.message} />}
        </div>
      </div>
    </>
  );
}
