import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Circle, CircleDot, Download, FileUp, Loader2, Send } from 'lucide-react';
import { COMMON_DOCUMENTS } from '@/content';
import { api, ApiError, cn, fmtDate, fmtSize } from '@/lib/api';
import { isStaff, useApi, useAuth } from './auth';
import { BackLink, Empty, ErrorNote, Loading, Panel, StageBar, StatusBadge } from './PortalLayout';

type Detail = {
  project: {
    id: number;
    title: string;
    product_category: string;
    scope: string;
    standards: string;
    current_stage: number;
    status: string;
    target_date: string;
    organization_name: string;
    consultant_name: string;
    consultant_email: string;
    manager_name: string;
  };
  milestones: { id: number; stage: number; title: string; status: string; due_date: string; completed_at: string }[];
  actions: { id: number; title: string; description: string; owner: 'manufacturer' | 'esc'; due_date: string; status: 'open' | 'done'; completed_at: string }[];
  audits: { id: number; kind: string; title: string; scheduled_at: string; location: string; status: string; notes: string }[];
  activity: { id: number; action: string; detail: string; created_at: string; user_name: string }[];
  canManage: boolean;
};
type Doc = { id: number; category: string; original_name: string; size_bytes: number; is_report: boolean; status: string; review_note: string; created_at: string; uploaded_by_name: string; uploaded_by_role: string };

const TABS = [
  ['overview', 'Milestones'],
  ['documents', 'Documents'],
  ['actions', 'Actions'],
  ['messages', 'Messages'],
  ['audits', 'Audits'],
  ['reports', 'Reports'],
] as const;
type Tab = (typeof TABS)[number][0];

const DOC_LABEL: Record<string, string> = Object.fromEntries([...COMMON_DOCUMENTS.map((d) => [d.key, d.title]), ['report', 'Report'], ['other', 'Other']]);
const AUDIT_LABEL: Record<string, string> = { mock_audit: 'Mock audit', factory_audit: 'Factory audit', lab_test: 'Laboratory test', surveillance: 'Surveillance audit', meeting: 'Meeting' };

export function ProjectPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'overview';
  const { data, error, reload } = useApi<Detail>(`/portal/projects/${id}`);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn();
      if (ok) setNote({ ok: true, text: ok });
      reload();
    } catch (e) {
      setNote({ ok: false, text: (e as ApiError).message });
    }
  };

  if (error) return <ErrorNote message={error.status === 404 ? 'Project not found or you do not have access.' : error.message} />;
  if (!data) return <Loading />;
  const { project: p, canManage } = data;

  return (
    <>
      <BackLink to="/portal/projects" label="All projects" />
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red">{p.product_category}</p>
            <h1 className="mt-1 text-[1.6rem] leading-tight">{p.title}</h1>
            <p className="mt-1 text-sm text-muted">
              {p.organization_name} · Consultant: {p.consultant_name ?? 'not assigned'} · Target {fmtDate(p.target_date)}
            </p>
          </div>
          <StatusBadge status={p.status} />
        </div>
        <div className="mt-6">
          <StageBar stage={p.current_stage} compact />
          <p className="mt-2 text-sm">
            <span className="text-muted">Current stage:</span> <strong className="text-navy">{data.milestones.find((m) => m.stage === p.current_stage)?.title}</strong>
          </p>
        </div>
        {canManage && (
          <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-5">
            <div>
              <label htmlFor="stage" className="field-label text-xs">Move to stage</label>
              <select id="stage" className="field py-2" value={p.current_stage} onChange={(e) => run(() => api(`/portal/projects/${p.id}`, { method: 'PATCH', body: { currentStage: Number(e.target.value) } }), 'Stage updated')}>
                {data.milestones.map((m) => (
                  <option key={m.stage} value={m.stage}>
                    {m.stage}. {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pstatus" className="field-label text-xs">Status</label>
              <select id="pstatus" className="field py-2" value={p.status} onChange={(e) => run(() => api(`/portal/projects/${p.id}`, { method: 'PATCH', body: { status: e.target.value } }), 'Status updated')}>
                {['active', 'on_hold', 'certified', 'closed'].map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {note && (
        <p role="status" className={cn('mt-4 rounded-btn px-4 py-2.5 text-sm font-medium', note.ok ? 'bg-success-50 text-success' : 'bg-red-50 text-red')}>
          {note.text}
        </p>
      )}

      <div role="tablist" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => {
              setNote(null);
              setParams({ tab: k }, { replace: true });
            }}
            className={cn('-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-semibold', tab === k ? 'border-red text-navy' : 'border-transparent text-muted hover:text-navy')}
          >
            {l}
            {k === 'actions' && data.actions.filter((a) => a.status === 'open').length > 0 && (
              <span className="ml-2 rounded-full bg-red px-1.5 text-[0.65rem] text-white">{data.actions.filter((a) => a.status === 'open').length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && <Milestones data={data} run={run} />}
        {tab === 'documents' && <Documents projectId={p.id} canManage={canManage} reports={false} />}
        {tab === 'reports' && <Documents projectId={p.id} canManage={canManage} reports />}
        {tab === 'actions' && <Actions data={data} run={run} />}
        {tab === 'messages' && <Messages projectId={p.id} />}
        {tab === 'audits' && <Audits data={data} run={run} />}
      </div>
    </>
  );
}

type Run = (fn: () => Promise<unknown>, ok?: string) => Promise<void>;

/* ------------------------------------------------------------------ milestones */
function Milestones({ data, run }: { data: Detail; run: Run }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <Panel title="Milestone tracking">
        <ol className="space-y-1">
          {data.milestones.map((m) => {
            const Icon = m.status === 'completed' ? CheckCircle2 : m.status === 'in_progress' ? CircleDot : Circle;
            return (
              <li key={m.id} className={cn('flex flex-wrap items-center gap-4 rounded-btn px-3 py-3', m.status === 'in_progress' && 'bg-red-50/60')}>
                <Icon className={cn('h-5 w-5 shrink-0', m.status === 'completed' ? 'text-success' : m.status === 'in_progress' ? 'text-red' : 'text-line-strong')} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-navy">
                    {m.stage}. {m.title}
                  </span>
                  <span className="block text-xs text-muted">
                    {m.status === 'completed' ? `Completed ${fmtDate(m.completed_at)}` : m.due_date ? `Due ${fmtDate(m.due_date)}` : m.status.replace('_', ' ')}
                  </span>
                </span>
                {data.canManage && (
                  <input
                    type="date"
                    aria-label={`Due date for ${m.title}`}
                    className="field w-auto py-1.5 text-xs"
                    defaultValue={m.due_date?.slice(0, 10) ?? ''}
                    onBlur={(e) => e.target.value !== (m.due_date?.slice(0, 10) ?? '') && run(() => api(`/portal/milestones/${m.id}`, { method: 'PATCH', body: { dueDate: e.target.value || null } }), 'Due date saved')}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </Panel>
      <div className="space-y-6">
        <Panel title="Project details">
          <dl className="space-y-3 text-sm">
            {[
              ['Scope', data.project.scope],
              ['Standards', data.project.standards],
              ['Consultant', data.project.consultant_name ? `${data.project.consultant_name} (${data.project.consultant_email})` : '—'],
              ['Certification manager', data.project.manager_name],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="text-navy">{v || '—'}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Recent activity">
          {data.activity.length === 0 ? (
            <Empty>No activity yet.</Empty>
          ) : (
            <ul className="space-y-3 text-sm">
              {data.activity.map((a) => (
                <li key={a.id} className="border-l-2 border-line pl-3">
                  <p className="text-navy">{a.detail}</p>
                  <p className="text-xs text-muted">
                    {a.user_name ?? 'System'} · {fmtDate(a.created_at, true)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ documents & reports */
function Documents({ projectId, canManage, reports }: { projectId: number; canManage: boolean; reports: boolean }) {
  const { user } = useAuth();
  const { data, error, reload } = useApi<{ items: Doc[] }>(`/portal/projects/${projectId}/documents`);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const items = data?.items.filter((d) => d.is_report === reports) ?? [];
  const canUpload = reports ? canManage : true;

  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (reports) fd.set('isReport', 'true');
    if (!(fd.getAll('files') as File[]).some((f) => f.size > 0)) return setMsg({ ok: false, text: 'Please choose a file.' });
    setBusy(true);
    try {
      const r = await api<{ count: number }>(`/portal/projects/${projectId}/documents`, { form: fd });
      setMsg({ ok: true, text: `${r.count} file(s) uploaded.` });
      form.reset();
      reload();
    } catch (ex) {
      setMsg({ ok: false, text: (ex as ApiError).message });
    } finally {
      setBusy(false);
    }
  }
  async function review(id: number, status: string) {
    const reviewNote = status === 'needs_revision' ? (window.prompt('What needs to be revised?') ?? undefined) : undefined;
    try {
      await api(`/portal/documents/${id}`, { method: 'PATCH', body: { status, reviewNote } });
      reload();
    } catch (ex) {
      setMsg({ ok: false, text: (ex as ApiError).message });
    }
  }

  return (
    <div className="space-y-6">
      {canUpload && (
        <Panel title={reports ? 'Upload report' : 'Upload documents'}>
          <form onSubmit={upload} className="flex flex-wrap items-end gap-4">
            {!reports && (
              <div className="min-w-56">
                <label htmlFor="cat" className="field-label">Document type</label>
                <select id="cat" name="category" className="field">
                  {COMMON_DOCUMENTS.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.title}
                    </option>
                  ))}
                  <option value="other">Other</option>
                </select>
              </div>
            )}
            <div className="min-w-64 flex-1">
              <label htmlFor="files" className="field-label">Files (max 25 MB each)</label>
              <input id="files" name="files" type="file" multiple className="field py-2 file:mr-3 file:rounded file:border-0 file:bg-surface file:px-3 file:py-1 file:text-sm file:font-medium file:text-navy" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp,.dwg,.dxf,.step,.stp,.zip" />
            </div>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Upload
            </button>
          </form>
          {msg && <p className={cn('mt-3 text-sm font-medium', msg.ok ? 'text-success' : 'text-red')}>{msg.text}</p>}
        </Panel>
      )}
      {error && <ErrorNote message={error.message} />}
      <Panel title={reports ? 'Reports from ESC' : 'Project documents'}>
        {!data ? (
          <Loading />
        ) : items.length === 0 ? (
          <Empty>{reports ? 'Reports (gap analysis, test reports, audit reports) will appear here.' : 'No documents uploaded yet.'}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="pb-3 font-semibold">File</th>
                  {!reports && <th scope="col" className="pb-3 font-semibold">Type</th>}
                  <th scope="col" className="pb-3 font-semibold">Uploaded</th>
                  {!reports && <th scope="col" className="pb-3 font-semibold">Review</th>}
                  <th scope="col" className="pb-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((d) => (
                  <tr key={d.id} className="align-top">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-navy">{d.original_name}</p>
                      <p className="text-xs text-muted">{fmtSize(d.size_bytes)}</p>
                    </td>
                    {!reports && <td className="py-3 pr-4">{DOC_LABEL[d.category] ?? d.category}</td>}
                    <td className="py-3 pr-4 text-xs">
                      {fmtDate(d.created_at)}
                      <br />
                      <span className="text-muted">{d.uploaded_by_name}</span>
                    </td>
                    {!reports && (
                      <td className="py-3 pr-4">
                        <StatusBadge status={d.status} />
                        {d.review_note && <p className="mt-1 max-w-56 text-xs text-muted">{d.review_note}</p>}
                        {canManage && isStaff(user) && (
                          <div className="mt-2 flex gap-2 text-xs">
                            <button type="button" className="font-semibold text-success hover:underline" onClick={() => review(d.id, 'approved')}>
                              Approve
                            </button>
                            <button type="button" className="font-semibold text-red hover:underline" onClick={() => review(d.id, 'needs_revision')}>
                              Request revision
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                    <td className="py-3 text-right">
                      <a href={`/api/portal/documents/${d.id}/download`} className="btn-ghost px-2 py-1.5 text-xs">
                        <Download className="h-4 w-4" /> Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ actions */
function Actions({ data, run }: { data: Detail; run: Run }) {
  const { user } = useAuth();
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    await run(() => api(`/portal/projects/${data.project.id}/actions`, { body: { title: f.title, owner: f.owner, dueDate: f.dueDate || null } }), 'Action added');
    form.reset();
  }
  return (
    <div className="space-y-6">
      {data.canManage && (
        <Panel title="Add pending action">
          <form onSubmit={add} className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
            <div>
              <label htmlFor="a-title" className="field-label">Action</label>
              <input id="a-title" name="title" required minLength={3} className="field" />
            </div>
            <div>
              <label htmlFor="a-owner" className="field-label">Responsible</label>
              <select id="a-owner" name="owner" className="field">
                <option value="manufacturer">Manufacturer</option>
                <option value="esc">ESC</option>
              </select>
            </div>
            <div>
              <label htmlFor="a-due" className="field-label">Due date</label>
              <input id="a-due" name="dueDate" type="date" className="field" />
            </div>
            <button type="submit" className="btn-primary">Add</button>
          </form>
        </Panel>
      )}
      <Panel title="Pending actions">
        {data.actions.length === 0 ? (
          <Empty>No actions.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {data.actions.map((a) => {
              const mayToggle = data.canManage || (!isStaff(user) && a.owner === 'manufacturer');
              const late = a.status === 'open' && a.due_date && new Date(a.due_date) < new Date();
              return (
                <li key={a.id} className="flex items-start gap-4 py-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--color-red)]"
                    checked={a.status === 'done'}
                    disabled={!mayToggle}
                    aria-label={`Mark "${a.title}" as ${a.status === 'done' ? 'open' : 'done'}`}
                    onChange={() => run(() => api(`/portal/actions/${a.id}`, { method: 'PATCH', body: { status: a.status === 'done' ? 'open' : 'done' } }))}
                  />
                  <div className="flex-1">
                    <p className={cn('text-sm font-medium', a.status === 'done' ? 'text-muted line-through' : 'text-navy')}>{a.title}</p>
                    <p className={cn('text-xs', late ? 'font-semibold text-red' : 'text-muted')}>
                      {a.owner === 'esc' ? 'ESC' : 'Manufacturer'} · {a.status === 'done' ? `Done ${fmtDate(a.completed_at)}` : `Due ${fmtDate(a.due_date)}${late ? ' (overdue)' : ''}`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ messages */
function Messages({ projectId }: { projectId: number }) {
  const { user } = useAuth();
  const { data, error, reload } = useApi<{ items: { id: number; body: string; created_at: string; sender_id: number; sender_name: string; sender_role: string }[] }>(`/portal/projects/${projectId}/messages`);
  const [body, setBody] = useState('');
  const [err, setErr] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [data]);
  useEffect(() => {
    const t = setInterval(reload, 30000); // light polling for new messages
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await api(`/portal/projects/${projectId}/messages`, { body: { body } });
      setBody('');
      setErr('');
      reload();
    } catch (ex) {
      setErr((ex as ApiError).message);
    }
  }
  return (
    <Panel title="Consultant communication">
      {error && <ErrorNote message={error.message} />}
      <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
        {!data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <Empty>Start the conversation with your ESC team.</Empty>
        ) : (
          data.items.map((m) => {
            const mine = m.sender_id === user!.id;
            return (
              <div key={m.id} className={cn('flex', mine && 'justify-end')}>
                <div className={cn('max-w-[75%] rounded-card px-4 py-3 text-sm', mine ? 'bg-navy text-white' : 'bg-surface text-body')}>
                  <p className={cn('mb-1 text-xs', mine ? 'text-white/60' : 'text-muted')}>
                    {mine ? 'You' : m.sender_name} {m.sender_role !== 'manufacturer' && !mine && '· ESC'} · {fmtDate(m.created_at, true)}
                  </p>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="mt-5 flex gap-3 border-t border-line pt-5">
        <label htmlFor="msg" className="sr-only">Message</label>
        <textarea id="msg" rows={2} className="field flex-1" placeholder="Write a message…" value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} />
        <button type="submit" className="btn-primary self-end" disabled={!body.trim()}>
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
      {err && <p className="mt-2 text-sm text-red">{err}</p>}
    </Panel>
  );
}

/* ------------------------------------------------------------------ audits */
function Audits({ data, run }: { data: Detail; run: Run }) {
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    await run(() => api(`/portal/projects/${data.project.id}/audits`, { body: { kind: f.kind, title: f.title, scheduledAt: f.scheduledAt, location: f.location || undefined } }), 'Audit scheduled');
    form.reset();
  }
  return (
    <div className="space-y-6">
      {data.canManage && (
        <Panel title="Schedule audit, test or meeting">
          <form onSubmit={add} className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1.5fr_1fr_1fr_auto] xl:items-end">
            <div>
              <label htmlFor="au-kind" className="field-label">Type</label>
              <select id="au-kind" name="kind" className="field">
                {Object.entries(AUDIT_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="au-title" className="field-label">Title</label>
              <input id="au-title" name="title" required minLength={3} className="field" />
            </div>
            <div>
              <label htmlFor="au-when" className="field-label">Date & time</label>
              <input id="au-when" name="scheduledAt" type="datetime-local" required className="field" />
            </div>
            <div>
              <label htmlFor="au-loc" className="field-label">Location</label>
              <input id="au-loc" name="location" className="field" />
            </div>
            <button type="submit" className="btn-primary">Schedule</button>
          </form>
        </Panel>
      )}
      <Panel title="Audit schedule">
        {data.audits.length === 0 ? (
          <Empty>No audits scheduled yet.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {data.audits.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-4 py-4">
                <span className="w-28 shrink-0 text-sm">
                  <span className="block font-display font-bold text-navy">{fmtDate(a.scheduled_at)}</span>
                  <span className="text-xs text-muted">{new Date(a.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-navy">{a.title}</span>
                  <span className="block text-xs text-muted">
                    {AUDIT_LABEL[a.kind]} · {a.location ?? 'Location to be confirmed'}
                  </span>
                  {a.notes && <span className="mt-1 block text-xs text-muted">{a.notes}</span>}
                </span>
                {data.canManage ? (
                  <select
                    aria-label={`Status of ${a.title}`}
                    className="field w-auto py-1.5 text-xs"
                    value={a.status}
                    onChange={(e) => run(() => api(`/portal/audits/${a.id}`, { method: 'PATCH', body: { status: e.target.value } }), 'Audit updated')}
                  >
                    {['scheduled', 'completed', 'postponed', 'cancelled'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge status={a.status} />
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
