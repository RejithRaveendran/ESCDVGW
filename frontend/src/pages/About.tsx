import { Compass, Eye, Handshake, Scale, ShieldCheck, Users } from 'lucide-react';
import { TIMELINE } from '@/content';
import { CheckList, CtaBand, IconTile, PageHero, Reveal, SectionHeading, Seo } from '@/components/ui';
import { IntermediaryDiagram } from '@/components/blocks';

const TRUST = [
  { icon: ShieldCheck, title: 'Confidentiality', text: 'ISO/IEC 27001:2022-certified handling of your drawings, formulations and test data.' },
  { icon: Scale, title: 'Independence', text: 'We are not a certification body, so we represent your interests throughout the process.' },
  { icon: Users, title: 'Two cultures, one team', text: 'We bridge Indian manufacturing practice and German expectations every day.' },
  { icon: Handshake, title: 'Long-term partnership', text: 'Our support continues after the certificate: surveillance, extensions, renewals and market entry.' },
];

export default function About() {
  return (
    <>
      <Seo title="About ESC Certification Services" description="ESC Utility Services' certification division helps Indian manufacturers achieve DVGW certification, backed by years of Indo-German utility-sector experience." />
      <PageHero
        crumbs={[{ label: 'About' }]}
        eyebrow="About ESC Certification Services"
        title="German standards expertise. Indian manufacturing insight."
        text="ESC Utility Services Pvt. Ltd. is an Indo-German company serving the energy, gas and water sectors. Our Certification & German Market Access division helps Indian manufacturers earn the trust of German buyers."
        image="/images/technopark.webp"
        imageAlt="Yamuna building at Technopark, Trivandrum, home of the ESC office"
      />

      <section className="section">
        <div className="container-site grid gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="Company overview" title="A strategic intermediary for certification" />
            <div className="mt-6 space-y-4 text-body">
              <p>
                Indian manufacturers produce high-quality valves, pipes, fittings, pumps and meters, but German certification can feel opaque. There are unfamiliar technical rules, German-language bodies, strict hygiene
                requirements and demanding factory audits.
              </p>
              <p>
                ESC closes that gap. We interpret the requirements, prepare and review your documentation, coordinate laboratories and the certification body, prepare your team for audits and support your entry into
                the German market.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <SectionHeading eyebrow="ESC Group background" title="Built on years of work with German utilities" />
            <div className="mt-6 space-y-4 text-body">
              <p>
                ESC grew out of the need of German utility companies for a dependable partner for data, back-office processes and software. Together with our sister and group companies in Germany, we have supported
                energy and water utilities for many years, from our office at Technopark in Trivandrum.
              </p>
              <p>That experience in the German utility world is the foundation of our certification services.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-surface section">
        <div className="container-site grid gap-6 md:grid-cols-2">
          <Reveal className="card p-8 md:p-10">
            <IconTile icon={Compass} />
            <h2 className="mt-5 text-h3">Our mission</h2>
            <p className="mt-3 text-body">
              To make German certification achievable for Indian manufacturers through clear guidance, careful preparation and dependable coordination, so that quality products reach the German market faster.
            </p>
          </Reveal>
          <Reveal delay={100} className="card p-8 md:p-10">
            <IconTile icon={Eye} />
            <h2 className="mt-5 text-h3">Our vision</h2>
            <p className="mt-3 text-body">To be the most trusted Indo-German partner for certification and market access in the European water and gas sectors.</p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container-site grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <SectionHeading eyebrow="German market expertise" title="We know what happens after the certificate" />
            <p className="mt-5 text-body">
              Certification is only the beginning. German buyers expect German-language documentation, reliable delivery, clear product marking and a responsive technical contact. We help you prepare for all of it.
            </p>
            <CheckList className="mt-6" items={['Utility and wholesaler expectations', 'Public tender requirements', 'German technical documentation', 'Surveillance and renewal planning']} />
          </Reveal>
          <Reveal delay={100}>
            <SectionHeading eyebrow="Industry experience" title="Focused on the water and gas value chain" />
            <p className="mt-5 text-body">
              Our team works with the products that German utilities buy every day, from shut-off valves and PE pipes to meters and treatment equipment. We understand both the technical requirements and the
              commercial context.
            </p>
            <CheckList className="mt-6" items={['Valves, pipes and fittings', 'Pumps and water meters', 'Water treatment equipment', 'Industrial water systems']} />
          </Reveal>
        </div>
      </section>

      <section className="bg-surface section">
        <div className="container-site">
          <SectionHeading align="center" eyebrow="Partnership approach" title="How we work with manufacturers" />
          <Reveal className="mt-14">
            <IntermediaryDiagram />
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container-site">
          <SectionHeading eyebrow="Our journey" title="From utility services to certification partner" />
          <ol className="relative mt-14 grid gap-10 md:grid-cols-5 md:gap-6">
            <span className="absolute left-0 right-0 top-[0.6rem] hidden h-px bg-line-strong md:block" aria-hidden />
            {TIMELINE.map((t, i) => (
              <Reveal as="li" key={t.title} delay={i * 80} className="relative pl-8 md:pl-0 md:pt-10">
                <span className={`absolute left-0 top-1 h-5 w-5 rounded-full border-4 md:top-0 ${i === TIMELINE.length - 1 ? 'border-red bg-white' : 'border-navy bg-white'}`} aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red">{t.label}</p>
                <h3 className="mt-2 text-base leading-snug">{t.title}</h3>
                <p className="mt-2 text-sm text-muted">{t.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-navy section">
        <div className="container-site">
          <SectionHeading light eyebrow="Why manufacturers trust ESC" title="Trust is earned in the details" />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t) => (
              <div key={t.title} className="rounded-card border border-white/10 p-7">
                <t.icon className="h-6 w-6 text-red" strokeWidth={1.7} aria-hidden />
                <h3 className="mt-4 text-lg text-white">{t.title}</h3>
                <p className="mt-2 text-sm text-white/65">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
