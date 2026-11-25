import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarClock, Download, FileText, ListChecks, Printer, Search, X } from 'lucide-react';
import { CATEGORIES, COMMON_DOCUMENTS, type Category } from '@/content';
import { cn } from '@/lib/api';
import { CheckList, CtaBand, Disclaimer, PageHero, Reveal, SectionHeading, Seo } from '@/components/ui';

type Hit = { kind: 'Category' | 'Standard' | 'Document' | 'Preparation' | 'Common mistake' | 'Product'; text: string; sub?: string; cat?: Category };

function buildIndex(): Hit[] {
  const hits: Hit[] = COMMON_DOCUMENTS.map((d) => ({ kind: 'Document', text: d.title, sub: d.detail }));
  for (const c of CATEGORIES) {
    hits.push({ kind: 'Category', text: c.name, sub: c.summary, cat: c });
    c.products.forEach((p) => hits.push({ kind: 'Product', text: p, sub: c.name, cat: c }));
    c.standards.forEach((s) => hits.push({ kind: 'Standard', text: s.code, sub: s.title, cat: c }));
    c.extraDocuments.forEach((d) => hits.push({ kind: 'Document', text: d, sub: `Additional for ${c.name.toLowerCase()}`, cat: c }));
    c.preparation.forEach((p) => hits.push({ kind: 'Preparation', text: p, cat: c }));
    c.mistakes.forEach((m) => hits.push({ kind: 'Common mistake', text: m, cat: c }));
  }
  return hits;
}

/* ====================================================================== knowledge center */
export default function Requirements() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const index = useMemo(buildIndex, []);
  const term = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (term.length < 2) return [];
    const words = term.split(/\s+/);
    return index.filter((h) => words.every((w) => `${h.text} ${h.sub ?? ''} ${h.cat?.name ?? ''}`.toLowerCase().includes(w))).slice(0, 40);
  }, [index, term]);

  return (
    <>
      <Seo
        title="Product Certification Requirements – Knowledge Center"
        description="Searchable DVGW certification knowledge center: required documents, applicable standards, preparation guides and common mistakes for valves, pipes, fittings, pumps, water meters and water treatment equipment."
      />
      <section className="border-b border-line bg-navy pt-10 pb-16 text-white md:pt-14 md:pb-20">
        <div className="container-site">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs font-medium text-white/60">
            <Link to="/" className="hover:text-white">
              Home
            </Link>{' '}
            / <span className="text-white">Certification requirements</span>
          </nav>
          <p className="eyebrow">Certification knowledge center</p>
          <h1 className="mt-4 max-w-3xl text-[2.1rem] leading-[1.1] text-white md:text-h1">Product certification requirements</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">Search documents, standards, preparation steps and common mistakes for every product category.</p>
          <div className="relative mt-9 max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="kc-search" className="sr-only">
              Search the knowledge center
            </label>
            <input
              id="kc-search"
              type="search"
              value={q}
              onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
              placeholder="Try “EN 1074”, “elastomer”, “drawings” or “water meter”"
              className="w-full rounded-btn border-0 bg-white py-4 pl-12 pr-12 text-base text-navy shadow-lift placeholder:text-muted/70 focus:outline-none focus:ring-4 focus:ring-red/30"
              autoComplete="off"
            />
            {q && (
              <button type="button" onClick={() => setParams({}, { replace: true })} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted hover:text-navy" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {term.length >= 2 && (
        <section className="section !pb-0" aria-live="polite">
          <div className="container-site">
            <p className="text-sm text-muted">
              {results.length} result{results.length === 1 ? '' : 's'} for <strong className="text-navy">“{q}”</strong>
            </p>
            {results.length === 0 ? (
              <p className="mt-4 text-body">
                Nothing found. Try another term, or{' '}
                <Link to="/contact?type=assessment" className="font-semibold text-red hover:underline">
                  ask our consultants
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-6 divide-y divide-line rounded-card border border-line">
                {results.map((h, i) => (
                  <li key={`${h.kind}-${h.text}-${i}`}>
                    <Link to={h.cat ? `/certification-requirements/${h.cat.slug}` : '#documents'} className="flex items-start gap-4 px-5 py-4 hover:bg-surface">
                      <span className="badge mt-0.5 w-28 shrink-0 justify-center bg-red-50 text-red">{h.kind}</span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-navy">{h.text}</span>
                        {h.sub && <span className="mt-0.5 block text-sm text-muted">{h.sub}</span>}
                      </span>
                      {h.cat && <span className="ml-auto hidden shrink-0 text-xs font-medium text-muted sm:block">{h.cat.name}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <section className="section">
        <div className="container-site">
          <SectionHeading eyebrow="Browse by category" title="Choose your product category" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 3) * 80}>
                <Link to={`/certification-requirements/${c.slug}`} className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lift">
                  <div className="aspect-[16/9] overflow-hidden bg-line">
                    <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-lg">{c.name}</h3>
                    <p className="mt-2 text-sm text-muted">{c.summary}</p>
                    <div className="mt-auto flex items-center justify-between pt-5 text-xs text-muted">
                      <span>
                        {COMMON_DOCUMENTS.length + c.extraDocuments.length} documents · {c.standards.length} standards
                      </span>
                      <ArrowRight className="h-4 w-4 text-red transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="documents" className="bg-surface section scroll-mt-28">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading eyebrow="Required for every category" title="Core documents checklist" text="These ten document groups are requested in almost every DVGW application. Each category adds specific evidence." />
            <p className="mt-6 text-sm font-semibold text-navy">Downloadable checklists (PDF)</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <a key={c.slug} href={`/api/checklists/${c.slug}.pdf`} className="btn-secondary px-3.5 py-2 text-xs">
                  <Download className="h-3.5 w-3.5" /> {c.name}
                </a>
              ))}
            </div>
          </div>
          <ol className="space-y-3">
            {COMMON_DOCUMENTS.map((d, i) => (
              <li key={d.key} className="card flex gap-5 p-5">
                <span className="font-display text-sm font-bold text-red">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-base">{d.title}</h3>
                  <p className="mt-1 text-sm text-muted">{d.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <CtaBand title="Not sure which requirements apply to your product?" text="Our certification readiness assessment maps your exact product range to the applicable rules and standards." primary={{ label: 'Get Certification Assessment', to: '/contact?type=assessment' }} secondary={null} />
    </>
  );
}

/* ====================================================================== category detail */
const TABS = [
  ['checklist', 'Documents checklist', ListChecks],
  ['standards', 'Standards & tests', FileText],
  ['preparation', 'Preparation guide', CalendarClock],
  ['mistakes', 'Common mistakes', AlertTriangle],
] as const;

export function RequirementDetail() {
  const { slug } = useParams();
  const cat = CATEGORIES.find((c) => c.slug === slug);
  const storageKey = `esc-checklist-${slug}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('checklist');

  useEffect(() => {
    try {
      setChecked(JSON.parse(localStorage.getItem(storageKey) ?? '{}'));
    } catch {
      setChecked({});
    }
    setTab('checklist');
  }, [storageKey]);

  if (!cat) return <Navigate to="/certification-requirements" replace />;

  const items = [...COMMON_DOCUMENTS.map((d) => ({ id: d.key, title: d.title, detail: d.detail })), ...cat.extraDocuments.map((d, i) => ({ id: `extra-${i}`, title: d, detail: `Specific to ${cat.name.toLowerCase()}` }))];
  const done = items.filter((i) => checked[i.id]).length;
  const toggle = (id: string) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* storage unavailable – keep in memory */
    }
  };

  return (
    <>
      <Seo title={`${cat.name} – DVGW Certification Requirements`} description={`Documents, standards, preparation guide and common mistakes for DVGW certification of ${cat.name.toLowerCase()}. ${cat.summary}`} />
      <PageHero
        crumbs={[{ label: 'Certification requirements', to: '/certification-requirements' }, { label: cat.name }]}
        eyebrow="Product certification requirements"
        title={`${cat.name}: DVGW certification requirements`}
        text={cat.summary}
        image={cat.image}
      >
        <div className="flex flex-wrap gap-3">
          <a href={`/api/checklists/${cat.slug}.pdf`} className="btn-primary">
            <Download className="h-4 w-4" /> Download checklist (PDF)
          </a>
          <button type="button" onClick={() => window.print()} className="btn-secondary no-print">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <div>
            <dt className="text-muted">Typical duration</dt>
            <dd className="font-display text-lg font-bold text-navy">{cat.timeline}</dd>
          </div>
          <div>
            <dt className="text-muted">Documents</dt>
            <dd className="font-display text-lg font-bold text-navy">{items.length}</dd>
          </div>
          <div>
            <dt className="text-muted">Key standards</dt>
            <dd className="font-display text-lg font-bold text-navy">{cat.standards.length}</dd>
          </div>
        </dl>
      </PageHero>

      <section className="section !pt-12">
        <div className="container-site">
          <div role="tablist" aria-label={`${cat.name} requirements`} className="no-print flex gap-1 overflow-x-auto border-b border-line">
            {TABS.map(([id, label, Icon]) => (
              <button
                key={id}
                role="tab"
                id={`tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={cn('-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors', tab === id ? 'border-red text-navy' : 'border-transparent text-muted hover:text-navy')}
              >
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_20rem]">
            <div className="min-w-0">
              {tab === 'checklist' && (
                <div role="tabpanel" id="panel-checklist" aria-labelledby="tab-checklist">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-h3">Required documents checklist</h2>
                    <span className="text-sm font-medium text-muted">
                      {done} of {items.length} ready
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={items.length} aria-label="Checklist progress">
                    <div className="h-full rounded-full bg-red transition-[width] duration-500" style={{ width: `${(done / items.length) * 100}%` }} />
                  </div>
                  <p className="mt-3 text-xs text-muted">Tick documents as you prepare them. Your progress is saved in this browser only.</p>
                  <ul className="mt-6 space-y-3">
                    {items.map((it) => (
                      <li key={it.id}>
                        <label className={cn('flex cursor-pointer gap-4 rounded-card border p-5 transition-colors', checked[it.id] ? 'border-success/40 bg-success-50' : 'border-line hover:border-line-strong')}>
                          <input type="checkbox" checked={!!checked[it.id]} onChange={() => toggle(it.id)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-red)]" />
                          <span>
                            <span className="block font-semibold text-navy">{it.title}</span>
                            <span className="mt-1 block text-sm text-muted">{it.detail}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tab === 'standards' && (
                <div role="tabpanel" id="panel-standards" aria-labelledby="tab-standards">
                  <h2 className="text-h3">Applicable rules & standards</h2>
                  <div className="mt-6 overflow-hidden rounded-card border border-line">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface text-navy">
                        <tr>
                          <th scope="col" className="w-2/5 px-5 py-3 font-semibold">Reference</th>
                          <th scope="col" className="px-5 py-3 font-semibold">Scope</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {cat.standards.map((s) => (
                          <tr key={s.code} className="align-top">
                            <th scope="row" className="px-5 py-4 font-semibold text-navy">{s.code}</th>
                            <td className="px-5 py-4">{s.title}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Disclaimer className="mt-4" />
                  <h3 className="mt-10 text-lg">Typical test focus</h3>
                  <CheckList className="mt-4" items={cat.testFocus} />
                  <h3 className="mt-10 text-lg">Typical products in scope</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {cat.products.map((p) => (
                      <span key={p} className="badge border border-line-strong px-3 py-1 text-sm text-navy">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'preparation' && (
                <div role="tabpanel" id="panel-preparation" aria-labelledby="tab-preparation">
                  <h2 className="text-h3">Certification preparation guide</h2>
                  <ol className="mt-6 space-y-4">
                    {cat.preparation.map((p, i) => (
                      <li key={p} className="flex gap-5 rounded-card border border-line p-5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white">{i + 1}</span>
                        <p className="pt-1.5 text-body">{p}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {tab === 'mistakes' && (
                <div role="tabpanel" id="panel-mistakes" aria-labelledby="tab-mistakes">
                  <h2 className="text-h3">Common mistakes to avoid</h2>
                  <ul className="mt-6 space-y-3">
                    {cat.mistakes.map((m) => (
                      <li key={m} className="flex gap-4 rounded-card border border-warning/20 bg-warning-50 p-5">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
                        <p className="text-body">{m}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-card bg-navy p-6 text-white">
                <h2 className="text-lg text-white">Need help preparing?</h2>
                <p className="mt-2 text-sm text-white/70">Our consultants review your documents and close gaps before anything goes to the laboratory.</p>
                <Link to="/contact?type=assessment" className="btn-primary mt-5 w-full">
                  Get assessment
                </Link>
              </div>
              <nav aria-label="Other categories" className="card p-6">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Other categories</h2>
                <ul className="mt-4 space-y-1">
                  {CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
                    <li key={c.slug}>
                      <Link to={`/certification-requirements/${c.slug}`} className="flex items-center justify-between rounded px-2 py-2 text-sm font-medium text-navy hover:bg-surface">
                        {c.name} <ArrowRight className="h-3.5 w-3.5 text-red" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}

