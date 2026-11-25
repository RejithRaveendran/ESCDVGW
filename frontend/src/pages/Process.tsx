import { CtaBand, PageHero, SectionHeading, Seo } from '@/components/ui';
import { ProcessStrip, ProcessTimeline } from '@/components/blocks';

export default function Process() {
  return (
    <>
      <Seo
        title="The DVGW Certification Process in 10 Stages"
        description="From initial consultation and gap analysis to laboratory testing, factory audit, approval and German market entry: the ESC 10-stage DVGW certification process."
      />
      <PageHero
        crumbs={[{ label: 'Certification process' }]}
        eyebrow="Certification process"
        title="Ten stages from first conversation to German market entry"
        text="A proven, transparent route. At every stage you know what happens, who is responsible and what comes next, and you can track it all in the ESC client portal."
        image="/images/pipes.jpg"
        imageAlt="Engineers joining a ductile iron water pipe"
      />
      <section className="bg-surface py-14">
        <div className="container-site">
          <ProcessStrip />
        </div>
      </section>
      <section className="section">
        <div className="container-site">
          <SectionHeading eyebrow="Stage by stage" title="What happens at each stage" text="Durations are indicative and depend on your product, documentation readiness and laboratory capacity." />
          <div className="mt-16 max-w-5xl">
            <ProcessTimeline />
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
