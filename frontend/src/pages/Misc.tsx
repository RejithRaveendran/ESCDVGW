import { useSearchParams, Link } from 'react-router-dom';
import { Clock, Lock, Mail, MapPin, Phone } from 'lucide-react';
import { COMPANY, CREDITS, FAQS } from '@/content';
import { CtaBand, PageHero, SectionHeading, Seo } from '@/components/ui';
import { FaqList } from '@/components/blocks';
import { InquiryForm } from '@/components/InquiryForm';

/* ------------------------------------------------------------------ FAQ */
export function FaqPage() {
  const groups = [...new Set(FAQS.map((f) => f.group))];
  return (
    <>
      <Seo title="FAQ – DVGW Certification Questions Answered" description="Answers to common questions: what DVGW is, who needs certification, which products can be certified, how long it takes, which documents are required, costs, and how ESC helps." />
      <PageHero crumbs={[{ label: 'FAQ' }]} eyebrow="Frequently asked questions" title="Your DVGW certification questions, answered" text="Can't find your question? Our consultants are happy to help." />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
          }),
        }}
      />
      <section className="section !pt-14">
        <div className="container-site grid gap-12 lg:grid-cols-[15rem_1fr]">
          <nav aria-label="FAQ topics" className="hidden lg:block">
            <ul className="sticky top-28 space-y-1">
              {groups.map((g) => (
                <li key={g}>
                  <a href={`#${g.replace(/\W+/g, '-').toLowerCase()}`} className="block rounded px-3 py-2 text-sm font-medium text-navy hover:bg-surface">
                    {g}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="max-w-3xl space-y-14">
            {groups.map((g) => (
              <section key={g} id={g.replace(/\W+/g, '-').toLowerCase()} className="scroll-mt-28">
                <h2 className="mb-4 text-h3">{g}</h2>
                <FaqList faqs={FAQS.filter((f) => f.group === g)} />
              </section>
            ))}
          </div>
        </div>
      </section>
      <CtaBand title="Still have questions?" text="Speak to an ESC certification consultant about your product and target market." />
    </>
  );
}

/* ------------------------------------------------------------------ Contact */
export function ContactPage() {
  const [params] = useSearchParams();
  const kind = params.get('type') === 'assessment' ? 'assessment' : 'consultation';
  return (
    <>
      <Seo title="Contact – Request a DVGW Consultation or Assessment" description="Contact ESC Utility Services to request a DVGW certification consultation or a certification readiness assessment for your products." />
      <PageHero
        crumbs={[{ label: 'Contact' }]}
        eyebrow="Contact"
        title={kind === 'assessment' ? 'Get your certification assessment' : 'Request a consultation'}
        text="Tell us about your company and products. An ESC certification consultant will respond within two working days."
      />
      <section className="section !pt-14">
        <div className="container-site grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <InquiryForm key={kind} initialKind={kind} />
          <aside className="space-y-6">
            <div className="card p-7">
              <h2 className="text-lg">ESC Utility Services Pvt. Ltd.</h2>
              <p className="mt-1 text-sm text-muted">{COMPANY.division}</p>
              <ul className="mt-6 space-y-4 text-sm">
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
                <li className="flex gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-red" aria-hidden />
                  <span>Monday to Friday, 9:00–18:00 IST</span>
                </li>
              </ul>
            </div>
            <div className="rounded-card bg-navy p-7 text-white">
              <h2 className="text-lg text-white">What happens next?</h2>
              <ol className="mt-4 space-y-3 text-sm text-white/75">
                {['We review your request and product category', 'A consultant calls you for a short scoping discussion', 'You receive a feasibility outline with next steps'].map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="font-display font-bold text-red">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
            <Link to="/portal" className="card flex items-center gap-4 p-5 hover:shadow-lift">
              <Lock className="h-5 w-5 text-red" aria-hidden />
              <span className="text-sm">
                <span className="block font-semibold text-navy">Existing client?</span>
                <span className="text-muted">Sign in to the client portal</span>
              </span>
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ Image credits */
export function ImageCredits() {
  return (
    <>
      <Seo title="Image credits" description="Attribution for photographs used on this website." />
      <PageHero crumbs={[{ label: 'Image credits' }]} eyebrow="Legal" title="Image credits" text="Some photographs on this website come from Wikimedia Commons and are used under the licenses listed below." />
      <section className="section !pt-12">
        <div className="container-site max-w-4xl">
          <ul className="divide-y divide-line rounded-card border border-line">
            {CREDITS.map((c) => (
              <li key={c.file} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <img src={`/images/${c.file}`} alt="" className="h-16 w-24 shrink-0 rounded object-cover" loading="lazy" />
                <div className="text-sm">
                  <p className="font-semibold text-navy">{c.author}</p>
                  <p className="text-muted">
                    {c.licenseUrl ? (
                      <a href={c.licenseUrl} className="underline hover:text-navy" target="_blank" rel="noopener noreferrer">
                        {c.license}
                      </a>
                    ) : (
                      c.license
                    )}{' '}
                    ·{' '}
                    <a href={c.source} className="underline hover:text-navy" target="_blank" rel="noopener noreferrer">
                      Source
                    </a>
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">Other images © ESC Utility Services Pvt. Ltd.</p>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ 404 */
export function NotFound() {
  return (
    <>
      <Seo title="Page not found" description="The page you requested could not be found." noindex />
      <section className="section">
        <div className="container-site max-w-2xl text-center">
          <p className="eyebrow">404</p>
          <SectionHeading align="center" title="This page could not be found" text="It may have been moved. Try the knowledge center or go back to the home page." />
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/" className="btn-primary">
              Home
            </Link>
            <Link to="/certification-requirements" className="btn-secondary">
              Knowledge center
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
