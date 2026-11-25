import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Inbox, ListTodo, Loader2, Lock, MessageSquare, Plus } from 'lucide-react';
import { Logo } from '@/components/Layout';
import { CATEGORIES } from '@/content';
import { api, ApiError, fmtDate } from '@/lib/api';
import { isManager, isStaff, useApi, useAuth } from './auth';
import { Empty, ErrorNote, Loading, PageTitle, Panel, StageBar, StatusBadge } from './PortalLayout';

/* ====================================================================== login */
export function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/portal" replace />;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErr('');
    try {
      await login(String(f.get('email')), String(f.get('password')));
      nav((loc.state as { from?: string })?.from ?? '/portal', { replace: true });
    } catch (ex) {
      setErr((ex as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <title>Client Portal Sign-in | ESC Utility Services</title>
      <meta name="robots" content="noindex,nofollow" />
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto w-full max-w-sm py-12">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red">
            <Lock className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="mt-6 text-[1.75rem]">Client portal</h1>
          <p className="mt-2 text-sm text-muted">Sign in to track your certification projects, share documents and talk to your consultant.</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="field-label">
                E-mail
              </label>
              <input id="email" name="email" type="email" required autoComplete="username" className="field" />
            </div>
            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
            </div>
            {err && <ErrorNote message={err} />}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
            </button>
          </form>
          <p className="mt-6 text-xs text-muted">
            Access is provided by ESC when your project starts. Need access?{' '}
            <Link to="/contact" className="font-semibold text-red hover:underline">
              Contact us
            </Link>
            .
          </p>
        </div>
        <Link to="/" className="text-sm text-muted hover:text-navy">
          ← Back to website
        </Link>
      </div>
      <div className="relative hidden bg-navy lg:block">
        <img src="/images/hero-valve.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-x-12 bottom-12 text-white">
          <p className="eyebrow">Secure · ISO/IEC 27001:2022</p>
          <p className="mt-3 max-w-md font-display text-2xl font-bold leading-snug">Every milestone, document and audit for your certification, in one place.</p>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== dashboard */
type Dash = {
  projects: { id: number; title: string; product_category: string; current_stage: number; status: string; target_date: string; organization_name: string; consultant_name: string; open_actions: number; pending_docs: number }[];
  pendingActions: { id: number; title: string; owner: string; due_date: string; project_id: number; project_title: string }[];
  upcomingAudits: { id: number; kind: string; title: string; scheduled_at: string; location: string; project_id: number; project_title: string }[];
  recentMessages: { id: number; body: string; created_at: string; project_id: number; project_title: string; sender_name: string }[];
  newInquiries: number | null;
  stages: { stage: number; title: string }[];
};

export function Dashboard() {
  const { user } = useAuth();
  const { data, error } = useApi<Dash>('/portal/dashboard');
  if (error) return <ErrorNote message={error.message} />;
  if (!data) return <Loading />;
  const overdue = data.pendingActions.filter((a) => a.due_date && new Date(a.due_date) < new Date()).length;

  return (
    <>
      <PageTitle title={`Welcome, ${user!.name.split(' ')[0]}`} sub={isStaff(user) ? 'Overview of your certification projects' : `${user!.organization_name ?? ''} · Certification overview`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={ListTodo} label={isStaff(user) ? 'Open actions' : 'Your pending actions'} value={data.pendingActions.length} note={overdue ? `${overdue} overdue` : 'None overdue'} warn={overdue > 0} />
        <Kpi icon={CalendarDays} label="Upcoming audits & tests" value={data.upcomingAudits.length} note={data.upcomingAudits[0] ? `Next: ${fmtDate(data.upcomingAudits[0].scheduled_at)}` : 'Nothing scheduled'} />
        <Kpi icon={MessageSquare} label="Active projects" value={data.projects.filter((p) => p.status === 'active').length} note={`${data.projects.length} in total`} />
        {data.newInquiries !== null ? (
          <Kpi icon={Inbox} label="New inquiries" value={data.newInquiries} note="Awaiting first contact" to="/portal/inquiries" />
        ) : (
          <Kpi icon={Inbox} label="Documents in review" value={data.projects.reduce((s, p) => s + p.pending_docs, 0)} note="Reviewed by your consultant" />
        )}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Certification progress" action={<Link to="/portal/projects" className="link-arrow text-xs">All projects</Link>}>
          {data.projects.length === 0 ? (
            <Empty>No projects yet.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {data.projects.map((p) => (
                <li key={p.id} className="py-4 first:pt-0 last:pb-0">
                  <Link to={`/portal/projects/${p.id}`} className="group block">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-navy group-hover:text-red">{p.title}</p>
                        <p className="text-xs text-muted">
                          {p.product_category}
                          {isStaff(user) && ` · ${p.organization_name}`} · Current: <strong className="font-medium text-navy">{data.stages[p.current_stage - 1]?.title}</strong>
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-3">
                      <StageBar stage={p.current_stage} />
                    </div>
                    <p className="mt-2 flex gap-4 text-xs text-muted">
                      <span>{p.open_actions} open actions</span>
                      <span>{p.pending_docs} documents in review</span>
                      <span>Target {fmtDate(p.target_date)}</span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Pending actions">
            {data.pendingActions.length === 0 ? (
              <Empty>You're all caught up.</Empty>
            ) : (
              <ul className="space-y-3">
                {data.pendingActions.slice(0, 6).map((a) => {
                  const late = a.due_date && new Date(a.due_date) < new Date();
                  return (
                    <li key={a.id}>
                      <Link to={`/portal/projects/${a.project_id}?tab=actions`} className="block rounded-btn border border-line p-3 hover:border-navy">
                        <p className="text-sm font-medium text-navy">{a.title}</p>
                        <p className={late ? 'mt-1 text-xs font-semibold text-red' : 'mt-1 text-xs text-muted'}>
                          {a.owner === 'esc' ? 'ESC' : 'Manufacturer'} · Due {fmtDate(a.due_date)}
                          {late && ' (overdue)'}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          <Panel title="Audit schedule">
            {data.upcomingAudits.length === 0 ? (
              <Empty>No audits scheduled.</Empty>
            ) : (
              <ul className="space-y-3">
                {data.upcomingAudits.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="flex w-12 shrink-0 flex-col items-center rounded-btn bg-navy py-1.5 text-white">
                      <span className="text-[0.65rem] uppercase">{new Date(a.scheduled_at).toLocaleDateString('en-GB', { month: 'short' })}</span>
                      <span className="font-display text-lg font-bold leading-none">{new Date(a.scheduled_at).getDate()}</span>
                    </span>
                    <Link to={`/portal/projects/${a.project_id}?tab=audits`} className="min-w-0 text-sm hover:text-red">
                      <span className="block font-medium text-navy">{a.title}</span>
                      <span className="block truncate text-xs text-muted">
                        {a.location ?? '—'} · {a.project_title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Recent messages">
            {data.recentMessages.length === 0 ? (
              <Empty>No messages yet.</Empty>
            ) : (
              <ul className="space-y-4">
                {data.recentMessages.slice(0, 4).map((m) => (
                  <li key={m.id}>
                    <Link to={`/portal/projects/${m.project_id}?tab=messages`} className="block text-sm hover:text-red">
                      <span className="flex justify-between text-xs text-muted">
                        <span className="font-semibold text-navy">{m.sender_name}</span> {fmtDate(m.created_at)}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-body">{m.body}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function Kpi({ icon: Icon, label, value, note, warn, to }: { icon: typeof Inbox; label: string; value: number; note?: string; warn?: boolean; to?: string }) {
  const body = (
    <div className="card h-full p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <Icon className="h-4 w-4 text-red" aria-hidden />
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold text-navy">{value}</p>
      {note && <p className={warn ? 'mt-1 text-xs font-semibold text-red' : 'mt-1 text-xs text-muted'}>{note}</p>}
    </div>
  );
  return to ? (
    <Link to={to} className="block hover:shadow-lift">
      {body}
    </Link>
  ) : (
    body
  );
}

/* ====================================================================== projects list */
type ProjectRow = { id: number; title: string; product_category: string; current_stage: number; status: string; target_date: string; organization_name: string; consultant_name: string; updated_at: string };

export function Projects() {
  const { user } = useAuth();
  const { data, error, reload } = useApi<{ items: ProjectRow[] }>('/portal/projects');
  const [creating, setCreating] = useState(false);
  return (
    <>
      <PageTitle
        title="Certification projects"
        action={
          isManager(user) && (
            <button type="button" className="btn-primary" onClick={() => setCreating((c) => !c)}>
              <Plus className="h-4 w-4" /> New project
            </button>
          )
        }
      />
      {creating && <NewProject onDone={() => { setCreating(false); reload(); }} />}
      {error && <ErrorNote message={error.message} />}
      {!data ? (
        <Loading />
      ) : data.items.length === 0 ? (
        <Empty>No projects yet.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Project</th>
                {isStaff(user) && <th scope="col" className="px-5 py-3 font-semibold">Manufacturer</th>}
                <th scope="col" className="px-5 py-3 font-semibold">Progress</th>
                <th scope="col" className="px-5 py-3 font-semibold">Consultant</th>
                <th scope="col" className="px-5 py-3 font-semibold">Target</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((p) => (
                <tr key={p.id} className="hover:bg-surface/60">
                  <td className="px-5 py-4">
                    <Link to={`/portal/projects/${p.id}`} className="font-semibold text-navy hover:text-red">
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted">{p.product_category}</p>
                  </td>
                  {isStaff(user) && <td className="px-5 py-4">{p.organization_name}</td>}
                  <td className="w-48 px-5 py-4">
                    <StageBar stage={p.current_stage} />
                  </td>
                  <td className="px-5 py-4">{p.consultant_name ?? '—'}</td>
                  <td className="px-5 py-4">{fmtDate(p.target_date)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function NewProject({ onDone }: { onDone: () => void }) {
  const orgs = useApi<{ items: { id: number; name: string }[] }>('/admin/organizations');
  const consultants = useApi<{ items: { id: number; name: string; active: boolean }[] }>('/admin/users?role=consultant');
  const nav = useNavigate();
  const [err, setErr] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const r = await api<{ id: number }>('/portal/projects', {
        body: { organizationId: f.organizationId, title: f.title, productCategory: f.productCategory, consultantId: f.consultantId || null, targetDate: f.targetDate || null, scope: f.scope || undefined, standards: f.standards || undefined },
      });
      onDone();
      nav(`/portal/projects/${r.id}`);
    } catch (ex) {
      setErr((ex as ApiError).message);
    }
  }
  return (
    <Panel title="New certification project" className="mb-6">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="field-label" htmlFor="np-title">Title</label>
          <input id="np-title" name="title" required minLength={3} className="field" placeholder="e.g. Gate valves DN50–DN300" />
        </div>
        <div>
          <label className="field-label" htmlFor="np-cat">Product category</label>
          <select id="np-cat" name="productCategory" required className="field">
            {CATEGORIES.map((c) => (
              <option key={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="np-org">Manufacturer</label>
          <select id="np-org" name="organizationId" required className="field">
            {orgs.data?.items.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="np-con">Consultant</label>
          <select id="np-con" name="consultantId" className="field">
            <option value="">Unassigned</option>
            {consultants.data?.items.filter((c) => c.active).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="np-date">Target date</label>
          <input id="np-date" name="targetDate" type="date" className="field" />
        </div>
        <div className="md:col-span-2">
          <label className="field-label" htmlFor="np-scope">Scope</label>
          <input id="np-scope" name="scope" className="field" placeholder="Product range, sizes, pressure classes" />
        </div>
        <div>
          <label className="field-label" htmlFor="np-std">Standards</label>
          <input id="np-std" name="standards" className="field" placeholder="e.g. DIN EN 1074" />
        </div>
        {err && <div className="md:col-span-3"><ErrorNote message={err} /></div>}
        <div className="md:col-span-3">
          <button type="submit" className="btn-primary">
            Create project <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </Panel>
  );
}
