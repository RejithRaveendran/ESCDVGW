import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CalendarClock, ClipboardList, Factory, FlaskConical, Globe2, Handshake, ShieldCheck, TrendingUp } from 'lucide-react';
import { CATEGORIES } from '@/content';
import { CheckList, CtaBand, Disclaimer, IconTile, PageHero, SectionHeading, Seo } from '@/components/ui';
import { LifecycleDiagram } from '@/components/blocks';

const TOC = [
  ['what', 'What is DVGW?'],
  ['importance', 'Importance of DVGW'],
  ['standards', 'DVGW standards'],
  ['benefits', 'Certification benefits'],
  ['categories', 'Product categories'],
  ['testing', 'Product testing process'],
  ['audit', 'Audit process'],
  ['timelines', 'Typical timelines'],
  ['lifecycle', 'Certification lifecycle'],
  ['market', 'Market access benefits'],
];

const TIMELINE_BARS = [
  { phase: 'Preparation & documentation', from: 0, to: 3 },
  { phase: 'Laboratory type testing', from: 2, to: 7 },
  { phase: 'Initial factory inspection', from: 6, to: 8 },
  { phase: 'Evaluation & certificate', from: 8, to: 10 },
];

export default function Dvgw() {
  return (
    <>
      <Seo
        title="What is DVGW Certification? Standards, Process & Timelines"
        description="DVGW certification explained for Indian manufacturers: what DVGW is, the standards involved, the product testing and audit process, typical timelines and the certification lifecycle."
      />
      <PageHero
        crumbs={[{ label: 'DVGW Certification' }]}
        eyebrow="DVGW Certification"
        title="Understanding DVGW certification"
        text="Everything Indian manufacturers need to know about Germany's most important certification for gas and drinking-water products."
        image="/images/water-treatment.jpg"
        imageAlt="Drinking water treatment plant with filtration basins"
      >
        <Link to="/contact?type=assessment" className="btn-primary">
          Get Certification Assessment <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHero>

      <div className="container-site grid gap-12 py-16 md:py-24 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-28">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">On this page</p>
            <ul className="mt-4 space-y-1 border-l border-line">
              {TOC.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-sm text-muted hover:border-red hover:text-navy">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0 space-y-24">
          <section id="what" className="scroll-mt-28">
            <SectionHeading eyebrow="01 · Definition" title="What is DVGW?" />
            <div className="mt-6 grid gap-8 md:grid-cols-[1.4fr_1fr]">
              <div className="space-y-4 text-body">
                <p>
                  <strong className="text-navy">DVGW (Deutscher Verein des Gas- und Wasserfaches e.V.)</strong> is the German Technical and Scientific Association for Gas and Water. Founded in 1859, it develops the
                  technical rules, known as DVGW worksheets (Arbeitsblätter), that German gas and water utilities, installers and authorities rely on.
                </p>
                <p>
                  Products are certified by <strong className="text-navy">DVGW CERT GmbH</strong>, the association's certification body. A certificate confirms that a product meets the applicable DVGW rules and European
                  (EN / DIN EN) standards, based on independent laboratory testing and inspection of the manufacturer's factory.
                </p>
              </div>
              <dl className="card grid grid-cols-2 gap-px overflow-hidden bg-line p-0">
                {[
                  ['1859', 'Founded'],
                  ['Gas & water', 'Technical scope'],
                  ['G & W', 'Worksheet series'],
                  ['DVGW CERT', 'Certification body'],
                ].map(([v, l]) => (
                  <div key={l} className="bg-white p-5">
                    <dd className="font-display text-xl font-bold text-navy">{v}</dd>
                    <dt className="mt-1 text-xs text-muted">{l}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <section id="importance" className="scroll-mt-28">
            <SectionHeading eyebrow="02 · Relevance" title="Why DVGW certification is important" />
            <p className="mt-6 max-w-3xl text-body">
              German law requires gas and water installations to follow the "generally accepted rules of technology", and the DVGW rules define them. For products in contact with drinking water, the German Drinking Water
              Ordinance (TrinkwV) also requires materials to meet the hygiene criteria of the German Environment Agency (UBA). A DVGW certificate is the most widely accepted evidence of both.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ['Utilities', 'Specify DVGW-certified products in their technical rules and tenders.'],
                ['Installers', 'Need certified products to work in line with the generally accepted rules of technology.'],
                ['Wholesalers', 'List certified products to protect themselves and their customers.'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-card bg-surface p-6">
                  <h3 className="text-base">{t}</h3>
                  <p className="mt-2 text-sm text-muted">{d}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="standards" className="scroll-mt-28">
            <SectionHeading eyebrow="03 · Technical rules" title="DVGW standards and related rules" />
            <p className="mt-6 max-w-3xl text-body">Certification usually combines several layers of requirements:</p>
            <div className="mt-8 overflow-hidden rounded-card border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-navy text-white">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 font-semibold">Layer</th>
                    <th scope="col" className="px-5 py-3.5 font-semibold">Examples</th>
                    <th scope="col" className="hidden px-5 py-3.5 font-semibold md:table-cell">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                    ['DVGW worksheets & test specifications', 'W 534, GW 335, W 406, W 512, W 294, G-series', 'German technical rules and test bases'],
                    ['European product standards', 'EN 1074, EN 12201, EN 1254, EN 13443, EN ISO 4064', 'Harmonised product requirements and tests'],
                    ['Drinking-water hygiene', 'UBA evaluation criteria (organic materials, metals)', 'Material suitability for contact with drinking water'],
                    ['EU legislation (in parallel)', 'MID 2014/32/EU, Machinery Regulation, CE', 'Legal market access, assessed separately'],
                  ].map((r) => (
                    <tr key={r[0]} className="align-top">
                      <th scope="row" className="px-5 py-4 font-semibold text-navy">{r[0]}</th>
                      <td className="px-5 py-4">{r[1]}</td>
                      <td className="hidden px-5 py-4 text-muted md:table-cell">{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Disclaimer className="mt-4" />
          </section>

          <section id="benefits" className="scroll-mt-28">
            <SectionHeading eyebrow="04 · Value" title="Certification benefits" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {[
                [ShieldCheck, 'Independent proof of quality', 'Third-party testing and factory inspection build immediate credibility.'],
                [Handshake, 'Faster buyer acceptance', 'Certified products pass utility and wholesaler qualification more easily.'],
                [TrendingUp, 'Premium positioning', 'Certification sets you apart from low-cost competitors.'],
                [ClipboardList, 'Better internal processes', 'Factory production control strengthens your quality system for every market.'],
              ].map(([Icon, t, d]) => (
                <div key={t as string} className="card flex gap-5 p-6">
                  <IconTile icon={Icon as typeof ShieldCheck} />
                  <div>
                    <h3 className="text-base">{t as string}</h3>
                    <p className="mt-1.5 text-sm text-muted">{d as string}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="categories" className="scroll-mt-28">
            <SectionHeading eyebrow="05 · Scope" title="Product categories" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {CATEGORIES.map((c) => (
                <Link key={c.slug} to={`/certification-requirements/${c.slug}`} className="group rounded-card border border-line p-5 transition-colors hover:border-navy">
                  <h3 className="flex items-center justify-between text-base">
                    {c.name} <ArrowRight className="h-4 w-4 text-red transition-transform group-hover:translate-x-1" />
                  </h3>
                  <p className="mt-2 text-sm text-muted">{c.products.slice(0, 3).join(' · ')}</p>
                </Link>
              ))}
            </div>
          </section>

          <section id="testing" className="scroll-mt-28">
            <SectionHeading eyebrow="06 · Laboratory" title="Product testing process" />
            <ProcessDiagram
              steps={[
                ['Test programme', 'Applicable tests defined from the standards'],
                ['Sample selection', 'Representative sizes and variants chosen'],
                ['Type testing', 'Performance, tightness, endurance, hygiene'],
                ['Test report', 'Results evaluated against the requirements'],
              ]}
              icon={FlaskConical}
            />
          </section>

          <section id="audit" className="scroll-mt-28">
            <SectionHeading eyebrow="07 · Factory" title="Audit process" />
            <p className="mt-6 max-w-3xl text-body">
              The certification body inspects your factory to confirm that the product you sell matches the product that was tested, consistently and traceably. After certification, surveillance inspections keep this
              assurance up to date.
            </p>
            <ProcessDiagram
              steps={[
                ['Audit planning', 'Date, scope and agenda agreed'],
                ['Opening & documents', 'Quality system and FPC review'],
                ['Production walk-through', 'Incoming goods to final inspection'],
                ['Findings & closure', 'Corrective actions documented'],
              ]}
              icon={Factory}
            />
          </section>

          <section id="timelines" className="scroll-mt-28">
            <SectionHeading eyebrow="08 · Planning" title="Typical timelines" text="Indicative timeline for a well-prepared product (months from project start). Actual timelines depend on product complexity and laboratory capacity." />
            <figure className="mt-8 card p-6">
              <div className="grid grid-cols-[10rem_1fr] gap-y-4 text-sm sm:grid-cols-[14rem_1fr]">
                <div />
                <div className="relative flex justify-between text-xs text-muted" aria-hidden>
                  {Array.from({ length: 11 }, (_, i) => (
                    <span key={i} className="w-0 text-center">
                      {i}
                    </span>
                  ))}
                </div>
                {TIMELINE_BARS.map((b) => (
                  <div key={b.phase} className="contents">
                    <div className="pr-4 font-medium text-navy">{b.phase}</div>
                    <div className="relative h-7 rounded bg-surface">
                      <div
                        className="absolute inset-y-0 rounded bg-navy"
                        style={{ left: `${b.from * 10}%`, width: `${(b.to - b.from) * 10}%` }}
                        role="img"
                        aria-label={`${b.phase}: month ${b.from} to ${b.to}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <figcaption className="mt-4 flex items-center gap-2 text-xs text-muted">
                <CalendarClock className="h-4 w-4 text-red" aria-hidden /> Typical total: 6–12 months. Long-term tests (e.g. plastic pipes) can extend this.
              </figcaption>
            </figure>
          </section>

          <section id="lifecycle" className="scroll-mt-28">
            <SectionHeading eyebrow="09 · Validity" title="Certification lifecycle" />
            <div className="mt-8 grid items-center gap-10 md:grid-cols-2">
              <LifecycleDiagram />
              <div className="space-y-4 text-body">
                <p>Certificates are issued for a limited period, commonly up to five years. During this time:</p>
                <CheckList
                  items={['Surveillance inspections confirm ongoing factory production control', 'Product, material or site changes must be reported', 'Extensions add new sizes or variants', 'Renewal is applied for before expiry']}
                />
              </div>
            </div>
          </section>

          <section id="market" className="scroll-mt-28">
            <SectionHeading eyebrow="10 · Outcome" title="Market access benefits" />
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                [Globe2, 'Germany & DACH', 'Access to utilities, wholesalers and OEMs in Germany, Austria and Switzerland.'],
                [BadgeCheck, 'Tenders', 'Eligibility for public procurement in the gas and water sector.'],
                [TrendingUp, 'EU expansion', 'A strong technical basis for other European certifications.'],
              ].map(([Icon, t, d]) => (
                <div key={t as string} className="rounded-card bg-navy p-6 text-white">
                  {(() => {
                    const I = Icon as typeof Globe2;
                    return <I className="h-6 w-6 text-red" aria-hidden />;
                  })()}
                  <h3 className="mt-4 text-base text-white">{t as string}</h3>
                  <p className="mt-2 text-sm text-white/65">{d as string}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <CtaBand />
    </>
  );
}

function ProcessDiagram({ steps, icon: Icon }: { steps: [string, string][]; icon: typeof Factory }) {
  return (
    <ol className="mt-8 grid gap-3 md:grid-cols-4" aria-label="Process steps">
      {steps.map(([t, d], i) => (
        <li key={t} className="relative rounded-card border border-line bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white">{i + 1}</span>
            {i === 0 && <Icon className="h-5 w-5 text-red" aria-hidden />}
          </div>
          <h3 className="mt-4 text-base">{t}</h3>
          <p className="mt-1.5 text-sm text-muted">{d}</p>
          {i < steps.length - 1 && (
            <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-white text-red md:block" aria-hidden />
          )}
        </li>
      ))}
    </ol>
  );
}
