import { Link } from 'react-router-dom';
import { ArrowRight, Award, BadgeCheck, Download, FileCheck2, Globe2, Handshake, Languages, Mail, MapPin, Phone, ShieldCheck, Store, Target, Users } from 'lucide-react';
import { CATEGORIES, COMMON_DOCUMENTS, COMPANY, FAQS, INDUSTRIES } from '@/content';
import { CheckList, IconTile, Reveal, SectionHeading, Seo } from '@/components/ui';
import { FaqList, IntermediaryDiagram, ProcessStrip, ProductFinder } from '@/components/blocks';
import { InquiryForm } from '@/components/InquiryForm';

const WHY_DVGW = [
  { icon: Store, title: 'Access to German buyers', text: 'German utilities, wholesalers and installers expect DVGW-certified products. Without certification, most doors stay closed.' },
  { icon: FileCheck2, title: 'Tender eligibility', text: 'Public and municipal tenders in the gas and water sector routinely require proof of conformity with DVGW rules.' },
  { icon: ShieldCheck, title: 'Proof of safety & hygiene', text: 'Certification shows that your product is safe in gas systems and suitable for contact with drinking water under German rules.' },
  { icon: Globe2, title: 'Recognition across Europe', text: 'The DVGW mark is widely respected in Austria, Switzerland and other EU markets, which supports wider European expansion.' },
];

const WHY_ESC = [
  { icon: Handshake, title: 'One accountable partner', text: 'A single point of contact between your factory and the German certification body and laboratories.' },
  { icon: Languages, title: 'Indo-German team', text: 'We work in English, German and Indian languages, and understand both manufacturing cultures.' },
  { icon: Target, title: 'Preparation that prevents re-tests', text: 'Gap analysis and pre-testing before samples leave India save months and laboratory fees.' },
  { icon: Users, title: 'Utility-sector experience', text: 'Years of work for German energy, gas and water utilities. We know what your buyers expect.' },
  { icon: Award, title: 'Certified information security', text: 'ESC is ISO/IEC 27001:2022 certified. Your drawings and test data are protected.' },
  { icon: BadgeCheck, title: 'Transparent progress', text: 'Track milestones, pending actions, audits and documents in the secure ESC client portal.' },
];

export default function Home() {
  return (
    <>
      <Seo
        title="DVGW Certification & German Market Access for Indian Manufacturers"
        description="ESC Utility Services helps Indian manufacturers of valves, pipes, fittings, pumps, water meters and water treatment equipment achieve DVGW certification and enter the German market."
        path="/"
      />

      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="container-site grid items-center gap-12 pt-12 pb-16 md:pt-16 md:pb-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="eyebrow">DVGW Certification · German Market Access</p>
            <h1 className="mt-5 text-[2.25rem] leading-[1.08] tracking-tight md:text-display">Helping Indian Manufacturers Achieve DVGW Certification and Enter the German Market</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              ESC guides manufacturers through documentation, testing, audits and certification requirements for successful access to Germany and Europe.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/contact" className="btn-primary px-7 py-3.5">
                Request Consultation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact?type=assessment" className="btn-secondary px-7 py-3.5">
                Get Certification Assessment
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-8">
              {[
                ['10', 'managed certification stages'],
                ['6', 'product categories covered'],
                ['ISO 27001', 'certified information security'],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-2xl font-extrabold text-navy md:text-[1.75rem]">{v}</dd>
                  <dd className="mt-1 text-xs leading-snug text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-media bg-surface sm:aspect-[4/3] lg:aspect-[4/5]">
              <img src="/images/hero-valve.jpg" alt="Blue gate valve with handwheel in a German waterworks" className="absolute inset-0 h-full w-full object-cover object-[50%_65%]" fetchPriority="high" />
              <div className="absolute bottom-0 left-0 h-1.5 w-28 bg-red" aria-hidden />
            </div>
            <div className="card absolute -bottom-6 left-4 right-4 p-5 shadow-lift sm:left-auto sm:right-6 sm:w-80">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red">Your route to Germany</p>
              <p className="mt-2 font-display text-base font-bold leading-snug text-navy">From first assessment to certificate, coordinated by one partner.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ what is DVGW + finder */}
      <section className="bg-surface section">
        <div className="container-site grid items-start gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="What is DVGW?" title="Germany's benchmark for gas and drinking-water products" />
            <p className="mt-5 text-body">
              DVGW, the German Technical and Scientific Association for Gas and Water, sets the technical rules that German utilities follow. Its certification shows that a product meets these rules and the related
              European standards, including strict hygiene requirements for drinking water.
            </p>
            <p className="mt-4 text-body">For Indian manufacturers, DVGW certification is often the key requirement for selling valves, pipes, fittings, pumps or meters in Germany.</p>
            <Link to="/dvgw-certification" className="link-arrow mt-6">
              Learn more about DVGW certification <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <ProductFinder />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ why DVGW matters */}
      <section className="section">
        <div className="container-site">
          <div className="grid items-end gap-8 lg:grid-cols-2">
            <SectionHeading eyebrow="Why DVGW certification matters" title="Certification is the entry ticket to the German market" />
            <p className="text-muted lg:pb-1">
              Germany is Europe's largest market for water and gas infrastructure. Its buyers are standards-driven and loyal, and they rarely look at uncertified products.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {WHY_DVGW.map((w, i) => (
              <Reveal key={w.title} delay={i * 80} className="card p-7">
                <IconTile icon={w.icon} />
                <h3 className="mt-5 text-lg">{w.title}</h3>
                <p className="mt-2 text-sm text-muted">{w.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ industries */}
      <section className="bg-surface section">
        <div className="container-site">
          <SectionHeading eyebrow="Industries we serve" title="Built for manufacturers of water and gas infrastructure products" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 3) * 80}>
                <Link to={`/certification-requirements/${c.slug}`} className="card group block overflow-hidden transition-shadow hover:shadow-lift">
                  <div className="relative aspect-[16/9] overflow-hidden bg-line">
                    <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-(--ease-premium) group-hover:scale-[1.03]" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg">{c.name} manufacturers</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{c.summary}</p>
                    <span className="link-arrow mt-4">
                      View requirements <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-2">
            {INDUSTRIES.slice(5).map((i) => (
              <span key={i.key} className="badge border border-line-strong bg-white px-3.5 py-1.5 text-sm text-navy">
                {i.title}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ certification journey */}
      <section className="section">
        <div className="container-site">
          <SectionHeading
            align="center"
            eyebrow="Certification journey"
            title="ESC is the bridge between your factory and Germany"
            text="We act as your strategic intermediary. You focus on manufacturing, and we handle interpretation, preparation and coordination with German certification bodies and laboratories."
          />
          <Reveal className="mt-14">
            <IntermediaryDiagram />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ why choose ESC (dark) */}
      <section className="bg-navy section text-white">
        <div className="container-site">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <SectionHeading light eyebrow="Why choose ESC" title="A trusted industry partner with German roots" />
              <p className="mt-5 text-white/70">
                ESC Utility Services combines German utility-sector knowledge with a strong engineering team in India. Our certification division builds on that experience.
              </p>
              <Link to="/about" className="btn-outline-light mt-8">
                About ESC <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-px overflow-hidden rounded-card bg-white/10 sm:grid-cols-2">
              {WHY_ESC.map((w) => (
                <div key={w.title} className="bg-navy p-7">
                  <w.icon className="h-6 w-6 text-red" strokeWidth={1.7} aria-hidden />
                  <h3 className="mt-4 text-lg text-white">{w.title}</h3>
                  <p className="mt-2 text-sm text-white/65">{w.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ success process */}
      <section className="section">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Certification success process" title="Ten clear stages from first call to German market entry" />
            <Link to="/certification-process" className="btn-secondary">
              Explore the full process <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Reveal className="mt-12">
            <ProcessStrip />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ industry expertise + documents */}
      <section className="bg-surface section">
        <div className="container-site grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="relative aspect-[4/3] overflow-hidden rounded-media">
            <img src="/images/pumps.jpg" alt="Modern pump hall in a German waterworks" loading="lazy" className="h-full w-full object-cover" />
            <div className="absolute bottom-0 left-0 h-1.5 w-24 bg-red" aria-hidden />
          </Reveal>
          <Reveal delay={100}>
            <SectionHeading eyebrow="Industry expertise" title="We speak the language of German water and gas utilities" />
            <p className="mt-5 text-body">
              Our understanding of DVGW worksheets, EN standards and drinking-water hygiene rules comes from years of work with the German utility sector. We know what certification bodies look for, and what
              German buyers expect after the certificate.
            </p>
            <CheckList
              className="mt-6"
              items={['DVGW worksheets and test specifications', 'EN / DIN product standards', 'UBA hygiene criteria for drinking-water contact', 'Factory production control and audits', 'German-language technical documentation']}
            />
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container-site">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <SectionHeading eyebrow="What documents are needed?" title="Ten document groups form the core of every application" />
              <p className="mt-5 text-muted">Download a free checklist for your product category, or explore the requirements in our knowledge center.</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <a key={c.slug} href={`/api/checklists/${c.slug}.pdf`} className="btn-secondary px-3.5 py-2 text-xs">
                    <Download className="h-3.5 w-3.5" /> {c.name}
                  </a>
                ))}
              </div>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2">
              {COMMON_DOCUMENTS.map((d, i) => (
                <li key={d.key} className="flex items-center gap-4 rounded-card border border-line px-5 py-4">
                  <span className="font-display text-sm font-bold text-red">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-semibold text-navy">{d.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ FAQ */}
      <section className="bg-surface section">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <SectionHeading eyebrow="Frequently asked questions" title="Answers for manufacturers" />
            <Link to="/faq" className="link-arrow mt-6">
              All questions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <FaqList faqs={FAQS.filter((f) => ['What is DVGW?', 'Who requires DVGW certification?', 'How long does certification take?', 'What documents are required?', 'How much does certification cost?', 'How can ESC help?'].includes(f.q))} />
        </div>
      </section>

      {/* ------------------------------------------------------------ contact */}
      <section className="section" id="contact">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <SectionHeading eyebrow="Contact" title="Start your certification journey" text="Tell us about your products. We will reply within two working days with a first assessment of the route to certification." />
            <ul className="mt-8 space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-red" aria-hidden />
                <span>
                  {COMPANY.addressLines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="h-5 w-5 shrink-0 text-red" aria-hidden />
                <a href={`tel:${COMPANY.phone.replace(/[^+\d]/g, '')}`} className="font-medium text-navy hover:text-red">
                  {COMPANY.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="h-5 w-5 shrink-0 text-red" aria-hidden />
                <a href={`mailto:${COMPANY.email}`} className="font-medium text-navy hover:text-red">
                  {COMPANY.email}
                </a>
              </li>
            </ul>
          </div>
          <InquiryForm compact />
        </div>
      </section>
    </>
  );
}
