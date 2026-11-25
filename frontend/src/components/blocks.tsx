import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, Factory, FlaskConical, Minus, Plus, Search } from 'lucide-react';
import { CATEGORIES, PROCESS, type Faq } from '@/content';
import { cn } from '@/lib/api';
import { Reveal } from './ui';

/* ------------------------------------------------------------------ process: compact 10-step strip */
export function ProcessStrip() {
  return (
    <ol className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
      {PROCESS.map((s) => (
        <li key={s.key} className="group relative bg-white p-6 transition-colors hover:bg-surface">
          <span className="font-display text-xs font-bold uppercase tracking-[0.14em] text-red">Stage {String(s.n).padStart(2, '0')}</span>
          <h3 className="mt-2 text-base leading-snug">{s.title}</h3>
          <p className="mt-2 text-xs text-muted">{s.duration}</p>
          {s.n === 10 && <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-red" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ process: detailed vertical timeline */
export function ProcessTimeline() {
  return (
    <ol className="relative">
      {PROCESS.map((s, i) => (
        <Reveal as="li" key={s.key} className="relative grid gap-4 pb-12 pl-16 last:pb-0 md:grid-cols-[1fr_1.1fr] md:gap-10 md:pl-20">
          {i < PROCESS.length - 1 && <span className="absolute left-[1.35rem] top-12 bottom-0 w-px bg-line-strong md:left-[1.85rem]" aria-hidden />}
          <span
            className={cn(
              'absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border-2 font-display text-sm font-bold md:h-[3.75rem] md:w-[3.75rem] md:text-base',
              s.n === 10 ? 'border-red bg-red text-white' : 'border-navy bg-white text-navy',
            )}
          >
            {String(s.n).padStart(2, '0')}
          </span>
          <div className="md:pt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Stage {s.n} · {s.duration}</p>
            <h3 className="mt-2 text-h3">{s.title}</h3>
            <p className="mt-3 text-body">{s.text}</p>
          </div>
          <div className="card self-start p-5 md:mt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">Deliverables</p>
            <ul className="mt-3 space-y-2">
              {s.deliverables.map((d) => (
                <li key={d} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-red" aria-hidden /> {d}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------------ FAQ accordion (+ schema.org FAQPage) */
export function FaqList({ faqs, withSchema = false }: { faqs: Faq[]; withSchema?: boolean }) {
  const [open, setOpen] = useState<number | null>(0);
  const schema = useMemo(
    () =>
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }),
    [faqs],
  );
  return (
    <div className="divide-y divide-line border-y border-line">
      {withSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />}
      {faqs.map((f, i) => {
        const isOpen = open === i;
        const id = `faq-${i}-${f.q.length}`;
        return (
          <div key={f.q}>
            <h3 className="text-base">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-6 py-5 text-left font-display font-semibold text-navy hover:text-red"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                {f.q}
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors', isOpen ? 'border-red bg-red text-white' : 'border-line-strong text-navy')}>
                  {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
              </button>
            </h3>
            <div id={id} hidden={!isOpen} className="pb-6 pr-12 text-body">
              {f.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ diagram: ESC as intermediary */
export function IntermediaryDiagram() {
  const node = (Icon: typeof Factory, title: string, sub: string, accent = false) => (
    <div className={cn('relative flex flex-col items-center rounded-card border p-6 text-center', accent ? 'border-navy bg-navy text-white' : 'border-line bg-white')}>
      <span className={cn('flex h-12 w-12 items-center justify-center rounded-full', accent ? 'bg-red text-white' : 'bg-red-50 text-red')}>
        <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden />
      </span>
      <p className={cn('mt-4 font-display text-base font-bold', accent ? 'text-white' : 'text-navy')}>{title}</p>
      <p className={cn('mt-1 text-xs', accent ? 'text-white/70' : 'text-muted')}>{sub}</p>
    </div>
  );
  const link = (label: string) => (
    <div className="flex flex-col items-center justify-center gap-1 py-2 text-center text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted lg:px-1">
      <span className="hidden h-px w-full min-w-10 bg-line-strong lg:block" aria-hidden />
      <span className="h-6 w-px bg-line-strong lg:hidden" aria-hidden />
      {label}
    </div>
  );
  return (
    <figure>
      <div className="grid items-stretch gap-2 lg:grid-cols-[1fr_auto_1.15fr_auto_1fr]">
        {node(Factory, 'Indian manufacturer', 'Products, factory, documentation')}
        {link('Documents · Samples')}
        <div className="relative">
          {node(Building2, 'ESC Certification Services', 'Interpretation · Preparation · Coordination · Tracking', true)}
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-red px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white">Single point of contact</span>
        </div>
        {link('Application · Clarifications')}
        {node(FlaskConical, 'German certification body & labs', 'Testing · Factory inspection · Certificate')}
      </div>
      <figcaption className="mt-4 text-center text-xs text-muted">ESC acts as the intermediary between Indian manufacturers and German certification bodies and laboratories.</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ diagram: certificate lifecycle */
export function LifecycleDiagram() {
  const steps = ['Application', 'Type testing', 'Initial inspection', 'Certificate issued', 'Surveillance', 'Renewal'];
  const cx = 200;
  const cy = 200;
  const r = 140;
  return (
    <figure className="mx-auto w-full max-w-md">
      <svg viewBox="0 0 400 400" role="img" aria-labelledby="lc-title lc-desc" className="h-auto w-full">
        <title id="lc-title">DVGW certificate lifecycle</title>
        <desc id="lc-desc">A cycle of six phases: application, type testing, initial inspection, certificate issued, surveillance, and renewal, which leads back to surveillance.</desc>
        <defs>
          <marker id="lc-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--color-navy-600)" />
          </marker>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" strokeDasharray="4 6" />
        {steps.map((s, i) => {
          const a0 = (i / steps.length) * Math.PI * 2 - Math.PI / 2;
          const a1 = ((i + 1) / steps.length) * Math.PI * 2 - Math.PI / 2;
          const mid0 = a0 + 0.3;
          const mid1 = a1 - 0.3;
          return (
            <path
              key={`arc-${s}`}
              d={`M ${cx + r * Math.cos(mid0)} ${cy + r * Math.sin(mid0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(mid1)} ${cy + r * Math.sin(mid1)}`}
              fill="none"
              stroke="var(--color-navy-600)"
              strokeWidth="1.5"
              markerEnd="url(#lc-arrow)"
            />
          );
        })}
        {steps.map((s, i) => {
          const a = (i / steps.length) * Math.PI * 2 - Math.PI / 2;
          const x = cx + r * Math.cos(a);
          const y = cy + r * Math.sin(a);
          const hl = i === 3;
          return (
            <g key={s}>
              <circle cx={x} cy={y} r="30" fill={hl ? 'var(--color-red)' : 'white'} stroke={hl ? 'var(--color-red)' : 'var(--color-navy)'} strokeWidth="2" />
              <text x={x} y={y + 5} textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="15" fill={hl ? 'white' : 'var(--color-navy)'}>
                {i + 1}
              </text>
              <text
                x={x + (Math.cos(a) > 0.2 ? 38 : Math.cos(a) < -0.2 ? -38 : 0)}
                y={y + (Math.abs(Math.cos(a)) <= 0.2 ? (Math.sin(a) < 0 ? -40 : 50) : 5)}
                textAnchor={Math.cos(a) > 0.2 ? 'start' : Math.cos(a) < -0.2 ? 'end' : 'middle'}
                fontFamily="var(--font-sans)"
                fontWeight="600"
                fontSize="12.5"
                fill="var(--color-navy)"
              >
                {s}
              </text>
            </g>
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="20" fill="var(--color-navy)">
          DVGW
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontFamily="var(--font-sans)" fontSize="12" fill="var(--color-muted)">
          certificate lifecycle
        </text>
      </svg>
    </figure>
  );
}

/* ------------------------------------------------------------------ "Does my product need it?" quick finder */
export function ProductFinder() {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const hits = term
    ? CATEGORIES.filter((c) => [c.name, c.summary, ...c.products].join(' ').toLowerCase().includes(term))
    : [];
  return (
    <div className="card p-6 md:p-8">
      <label htmlFor="finder" className="font-display text-lg font-bold text-navy">
        Does my product need DVGW certification?
      </label>
      <p className="mt-1 text-sm text-muted">Type a product, such as "ball valve", "PE pipe", "water meter" or "softener".</p>
      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input id="finder" className="field pl-10" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </div>
      <div aria-live="polite" className="mt-4 min-h-6">
        {term && hits.length === 0 && (
          <p className="text-sm text-muted">
            No direct match.{' '}
            <Link to="/contact?type=assessment" className="font-semibold text-red hover:underline">
              Ask our consultants
            </Link>{' '}
            and we will check the requirements for your product.
          </p>
        )}
        <ul className="space-y-2">
          {hits.map((c) => (
            <li key={c.slug}>
              <Link to={`/certification-requirements/${c.slug}`} className="group flex items-center justify-between gap-4 rounded-lg border border-line px-4 py-3 hover:border-navy">
                <span>
                  <span className="block text-sm font-semibold text-navy">{c.name}: certification is usually expected for the German market</span>
                  <span className="block text-xs text-muted">Typical duration {c.timeline} · {c.standards.length} key rules and standards</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-red transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
