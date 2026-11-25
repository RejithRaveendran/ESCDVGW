import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Search } from 'lucide-react';
import { RESOURCES, RESOURCE_TYPES, type Resource } from '@/content';
import { api, cn, fmtDate } from '@/lib/api';
import { CtaBand, PageHero, Reveal, Seo } from '@/components/ui';

type Item = Pick<Resource, 'slug' | 'type' | 'title' | 'summary' | 'tags'> & { date: string; readMinutes: number };
const fromBundle = (r: Resource): Item => ({ slug: r.slug, type: r.type, title: r.title, summary: r.summary, tags: r.tags, date: r.date, readMinutes: r.readMinutes });

/** Local fallback search, used if the API is unavailable. */
function localSearch(q: string, type: string): Item[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return RESOURCES.filter((r) => (!type || r.type === type) && words.every((w) => JSON.stringify([r.title, r.summary, r.tags, r.body]).toLowerCase().includes(w))).map(fromBundle);
}

export default function Resources() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const type = params.get('type') ?? '';
  const [input, setInput] = useState(q);
  const [items, setItems] = useState<Item[]>(() => localSearch(q, type));
  const [loading, setLoading] = useState(false);

  useEffect(() => setInput(q), [q]);
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const qs = new URLSearchParams({ ...(q && { q }), ...(type && { type }) });
    api<{ items: { slug: string; type: string; title: string; summary: string; tags: string[]; read_minutes: number; published_at: string }[] }>(`/resources?${qs}`, { signal: ctrl.signal })
      .then((r) => setItems(r.items.map((i) => ({ ...i, readMinutes: i.read_minutes, date: i.published_at }))))
      .catch((e) => e.name !== 'AbortError' && setItems(localSearch(q, type)))
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [q, type]);

  // Debounce typing into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== q) setParams({ ...(input && { q: input }), ...(type && { type }) }, { replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [input, q, type, setParams]);

  const setType = (t: string) => setParams({ ...(q && { q }), ...(t && { type: t }) }, { replace: true });
  const counts = useMemo(() => Object.fromEntries(RESOURCE_TYPES.map((t) => [t, RESOURCES.filter((r) => r.type === t).length])), []);

  return (
    <>
      <Seo title="Resources Center – DVGW Guides, Articles & White Papers" description="DVGW articles, certification guides, export guides, German standards, industry updates, white papers and case studies for Indian manufacturers." />
      <PageHero
        crumbs={[{ label: 'Resources' }]}
        eyebrow="Resources center"
        title="Knowledge for your route to Germany"
        text="Articles, guides and white papers on DVGW certification, German standards and exporting to Europe."
      />
      <section className="section !pt-12">
        <div className="container-site">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <label htmlFor="res-search" className="sr-only">
                Search resources
              </label>
              <input id="res-search" type="search" className="field py-3 pl-10" placeholder="Search articles, guides, standards…" value={input} onChange={(e) => setInput(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
              {['', ...RESOURCE_TYPES].map((t) => (
                <button
                  key={t || 'all'}
                  type="button"
                  aria-pressed={type === t}
                  onClick={() => setType(t)}
                  className={cn('rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors', type === t ? 'border-navy bg-navy text-white' : 'border-line-strong text-navy hover:border-navy')}
                >
                  {t || 'All'}
                  {t && <span className="ml-1.5 opacity-60">{counts[t]}</span>}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-sm text-muted" aria-live="polite">
            {loading ? 'Searching…' : `${items.length} resource${items.length === 1 ? '' : 's'}`}
          </p>
          <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((r, i) => (
              <Reveal key={r.slug} delay={(i % 3) * 60}>
                <Link to={`/resources/${r.slug}`} className="card group flex h-full flex-col p-7 transition-shadow hover:shadow-lift">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="badge bg-red-50 text-red">{r.type}</span>
                    <span className="text-muted">{fmtDate(r.date)}</span>
                  </div>
                  <h2 className="mt-5 text-lg leading-snug group-hover:text-red">{r.title}</h2>
                  <p className="mt-3 text-sm text-muted">{r.summary}</p>
                  <div className="mt-auto flex items-center justify-between pt-6 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" aria-hidden /> {r.readMinutes} min read
                    </span>
                    <ArrowRight className="h-4 w-4 text-red transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          {!loading && items.length === 0 && (
            <div className="mt-6 rounded-card bg-surface p-10 text-center">
              <p className="font-semibold text-navy">No resources match your search.</p>
              <button type="button" className="link-arrow mt-3" onClick={() => setParams({})}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
      <CtaBand title="Want the full white paper or a tailored briefing?" text="Our consultants share practical guidance for your product category and target market." primary={{ label: 'Contact ESC', to: '/contact' }} secondary={null} />
    </>
  );
}

export function ResourceDetail() {
  const { slug } = useParams();
  const r = RESOURCES.find((x) => x.slug === slug);
  if (!r) return <Navigate to="/resources" replace />;
  const related = RESOURCES.filter((x) => x.slug !== r.slug && x.tags.some((t) => r.tags.includes(t))).slice(0, 3);
  return (
    <>
      <Seo title={r.title} description={r.summary} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: r.title, description: r.summary, datePublished: r.date, publisher: { '@type': 'Organization', name: 'ESC Utility Services Pvt. Ltd.' } }),
        }}
      />
      <article className="pt-10 pb-20 md:pt-14">
        <div className="container-site max-w-3xl">
          <Link to="/resources" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-navy">
            <ArrowLeft className="h-4 w-4" /> All resources
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="badge bg-red-50 text-red">{r.type}</span>
            <span>{fmtDate(r.date)}</span>
            <span>·</span>
            <span>{r.readMinutes} min read</span>
          </div>
          <h1 className="mt-5 text-[2rem] leading-[1.15] md:text-[2.6rem]">{r.title}</h1>
          <p className="mt-5 text-lg text-muted">{r.summary}</p>
          <div className="prose-esc mt-10 border-t border-line pt-10">
            {r.body.map((b, i) =>
              b.h ? (
                <h2 key={i}>{b.h}</h2>
              ) : b.ul ? (
                <ul key={i}>
                  {b.ul.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              ) : (
                <p key={i} className={b.p?.startsWith('Note:') ? 'rounded-card bg-surface px-5 py-4 text-sm' : undefined}>
                  {b.p}
                </p>
              ),
            )}
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {r.tags.map((t) => (
              <Link key={t} to={`/resources?q=${encodeURIComponent(t)}`} className="badge border border-line-strong px-3 py-1 text-navy hover:border-navy">
                #{t}
              </Link>
            ))}
          </div>
        </div>
      </article>
      {related.length > 0 && (
        <section className="bg-surface py-16">
          <div className="container-site">
            <h2 className="text-h3">Related resources</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((x) => (
                <Link key={x.slug} to={`/resources/${x.slug}`} className="card group p-6 hover:shadow-lift">
                  <span className="badge bg-red-50 text-red">{x.type}</span>
                  <h3 className="mt-4 text-base leading-snug group-hover:text-red">{x.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}
