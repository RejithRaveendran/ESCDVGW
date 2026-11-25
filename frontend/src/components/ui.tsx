import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  FlaskConical,
  GanttChart,
  Ruler,
  SearchCheck,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/api';

export const SITE_NAME = 'ESC Certification & German Market Access';

/* ------------------------------------------------------------------ SEO */
export function Seo({ title, description, path, noindex }: { title: string; description: string; path?: string; noindex?: boolean }) {
  const loc = useLocation();
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${path ?? loc.pathname}`;
  const full = `${title} | ESC Utility Services`;
  return (
    <>
      <title>{full}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
    </>
  );
}

/* ------------------------------------------------------------------ reveal */
export function Reveal({ children, className, delay = 0, as: Tag = 'div' }: { children: ReactNode; className?: string; delay?: number; as?: 'div' | 'li' | 'section' }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible');
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('is-visible');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={cn('reveal', className)} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ headings */
export function SectionHeading({ eyebrow, title, text, align = 'left', className, light }: { eyebrow?: string; title: string; text?: string; align?: 'left' | 'center'; className?: string; light?: boolean }) {
  return (
    <div className={cn(align === 'center' && 'mx-auto max-w-2xl text-center', className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className={cn('mt-3 text-[1.875rem] leading-tight md:text-h2', light && 'text-white')}>{title}</h2>
      {text && <p className={cn('mt-4', light ? 'text-white/70' : 'text-muted', align === 'left' && 'max-w-2xl')}>{text}</p>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted">
        <li>
          <Link to="/" className="hover:text-navy">
            Home
          </Link>
        </li>
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3" aria-hidden />
            {it.to ? (
              <Link to={it.to} className="hover:text-navy">
                {it.label}
              </Link>
            ) : (
              <span className="text-navy" aria-current="page">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Inner-page hero: text left, image right – same pattern as the ESC corporate site. */
export function PageHero({
  eyebrow,
  title,
  text,
  image,
  imageAlt = '',
  crumbs,
  children,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  image?: string;
  imageAlt?: string;
  crumbs?: { label: string; to?: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-white pt-10 pb-14 md:pt-14 md:pb-20">
      <div className={cn('container-site grid items-center gap-10 lg:gap-14', image && 'lg:grid-cols-2')}>
        <div className={cn(!image && 'max-w-3xl')}>
          {crumbs && <Breadcrumbs items={crumbs} />}
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 text-[2.1rem] leading-[1.1] tracking-tight md:text-h1">{title}</h1>
          {text && <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{text}</p>}
          {children && <div className="mt-8">{children}</div>}
        </div>
        {image && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-media bg-surface">
            <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
            <div className="absolute bottom-0 left-0 h-1.5 w-24 bg-red" aria-hidden />
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ CTA band */
export function CtaBand({
  title = 'Ready to start your DVGW certification journey?',
  text = 'Tell us about your product. Our consultants will assess your readiness and outline a clear route to the German market.',
  primary = { label: 'Request Consultation', to: '/contact' },
  secondary = { label: 'Get Certification Assessment', to: '/contact?type=assessment' },
}: {
  title?: string;
  text?: string;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string } | null;
}) {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="container-site">
        <Reveal>
          <div className="relative overflow-hidden rounded-media bg-navy px-8 py-14 md:px-16 md:py-16">
            <svg className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] text-white/[0.04]" viewBox="0 0 200 200" aria-hidden>
              <circle cx="100" cy="100" r="99" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
            </svg>
            <div className="absolute left-0 top-0 h-full w-1.5 bg-red" aria-hidden />
            <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <h2 className="text-[1.875rem] leading-tight text-white md:text-h2">{title}</h2>
                <p className="mt-4 text-white/70">{text}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <Link to={primary.to} className="btn-primary px-7 py-3.5">
                  {primary.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {secondary && (
                  <Link to={secondary.to} className="btn-outline-light px-7 py-3.5">
                    {secondary.label}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ icons */
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  ClipboardCheck,
  FileText,
  Ruler,
  SearchCheck,
  BookOpen,
  FlaskConical,
  Building2,
  ShieldCheck,
  GanttChart,
  BadgeCheck,
};

export function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red', className)}>
      <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden />
    </span>
  );
}

export function CheckList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-red" aria-hidden />
          <span>{i}</span>
        </li>
      ))}
    </ul>
  );
}

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs leading-relaxed text-muted', className)}>
      Standards are listed for guidance. The rules and test programme that apply to your product are confirmed during the ESC feasibility assessment and by the certification body. ESC is an independent
      consulting partner, not a certification body.
    </p>
  );
}
