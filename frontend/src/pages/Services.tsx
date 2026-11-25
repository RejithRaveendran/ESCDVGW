import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { SERVICES } from '@/content';
import { CtaBand, IconTile, PageHero, Reveal, SERVICE_ICONS, SectionHeading, Seo } from '@/components/ui';

export default function Services() {
  return (
    <>
      <Seo
        title="Our Services – DVGW Certification Consulting"
        description="Certification readiness assessment, documentation support, technical review, gap analysis, testing and certification-body coordination, audit preparation and post-certification support."
      />
      <PageHero
        crumbs={[{ label: 'Services' }]}
        eyebrow="Our services"
        title="End-to-end support for every stage of certification"
        text="Choose the complete package or the individual services you need. Either way, you work with one accountable ESC team."
        image="/images/lab.jpg"
        imageAlt="Laboratory technician holding a test sample"
      />

      <section className="section">
        <div className="container-site">
          <nav aria-label="Services" className="mb-14 flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <a key={s.key} href={`#${s.key}`} className="rounded-full border border-line-strong px-3.5 py-1.5 text-xs font-semibold text-navy hover:border-navy">
                {s.title}
              </a>
            ))}
          </nav>
          <div className="grid gap-6 md:grid-cols-2">
            {SERVICES.map((s, i) => {
              const Icon = SERVICE_ICONS[s.icon];
              return (
                <Reveal key={s.key} delay={(i % 2) * 80} className="h-full">
                  <article id={s.key} className="card flex h-full scroll-mt-28 flex-col p-8">
                    <div className="flex items-start justify-between gap-4">
                      <IconTile icon={Icon} />
                      <span className="font-display text-sm font-bold text-line-strong">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <h2 className="mt-6 text-[1.35rem] leading-snug">{s.title}</h2>
                    <p className="mt-3 text-muted">{s.short}</p>
                    <ul className="mt-6 grid gap-2.5 border-t border-line pt-6 sm:grid-cols-2">
                      {s.points.map((p) => (
                        <li key={p} className="flex gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-red" aria-hidden />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-surface section">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <SectionHeading
            eyebrow="Engagement models"
            title="Flexible ways to work with ESC"
            text="Start with a fixed-scope readiness assessment and decide on the next step with full cost transparency."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Assessment', 'Fixed-scope readiness and feasibility check'],
              ['Full journey', 'End-to-end project management to certificate'],
              ['Modular', 'Individual services where you need support'],
            ].map(([t, d]) => (
              <div key={t} className="card p-6">
                <h3 className="text-base">{t}</h3>
                <p className="mt-2 text-sm text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="container-site mt-10">
          <Link to="/certification-process" className="link-arrow">
            See how the services fit into the 10-stage process <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
