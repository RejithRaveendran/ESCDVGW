import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Lock, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { COMPANY, CATEGORIES } from '@/content';
import { cn } from '@/lib/api';

export function Logo({ inverted = false, className, badge = true }: { inverted?: boolean; className?: string; badge?: boolean }) {
  return (
    <Link to="/" className={cn('group inline-flex items-center gap-2.5', className)} aria-label="ESC Utility Services – Certification & German Market Access – Home">
      <span className="font-display text-[1.75rem] font-extrabold leading-none tracking-[-0.04em] text-red">ESC</span>
      <span className={cn('border-l pl-2.5 font-display text-[0.8rem] font-semibold leading-[1.1] tracking-tight', inverted ? 'border-white/25 text-white' : 'border-navy/15 text-navy')}>
        Utility
        <br />
        Services
      </span>
      {badge && <span
        className={cn(
          'ml-1 hidden rounded-sm border px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] sm:inline-block',
          inverted ? 'border-white/25 text-white/80' : 'border-red/25 text-red',
        )}
      >
        Certification
      </span>}
    </Link>
  );
}

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/dvgw-certification', label: 'DVGW Certification' },
  { to: '/certification-requirements', label: 'Requirements' },
  { to: '/services', label: 'Services' },
  { to: '/certification-process', label: 'Process' },
  { to: '/resources', label: 'Resources' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

function Navbar() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      {/* Utility bar: ties this division to the ESC corporate site */}
      <div className="hidden bg-navy text-[0.78rem] text-white/70 md:block">
        <div className="container-site flex h-9 items-center justify-between">
          <p>
            A division of <span className="font-semibold text-white">{COMPANY.name}</span>
          </p>
          <div className="flex items-center gap-6">
            <a href={`tel:${COMPANY.phone.replace(/[^+\d]/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-white">
              <Phone className="h-3.5 w-3.5" aria-hidden /> {COMPANY.phone}
            </a>
            <a href={COMPANY.mainSite} className="inline-flex items-center gap-1 hover:text-white" target="_blank" rel="noopener">
              ESC corporate website <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
            <Link to="/portal" className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-white/80">
              <Lock className="h-3.5 w-3.5" aria-hidden /> Client Portal
            </Link>
          </div>
        </div>
      </div>

      <header className={cn('sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-shadow duration-500', scrolled ? 'shadow-nav' : 'shadow-[0_1px_0_var(--color-line)]')}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-navy focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <div className={cn('container-site flex items-center justify-between gap-6 transition-[height] duration-500', scrolled ? 'h-16' : 'h-20')}>
          <Logo />
          <nav aria-label="Main" className="hidden xl:block">
            <ul className="flex items-center">
              {LINKS.slice(1).map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    className={({ isActive }) => cn('relative block px-2.5 py-2 text-[0.84rem] font-medium transition-colors 2xl:px-3.5', isActive ? 'text-navy' : 'text-navy/70 hover:text-navy')}
                  >
                    {({ isActive }) => (
                      <>
                        {l.label}
                        {isActive && <span className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-red 2xl:inset-x-3.5" aria-hidden />}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden xl:block">
            <Link to="/contact" className="btn-primary py-2.5">
              Request Consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <button type="button" className="rounded-md p-2 text-navy hover:bg-surface xl:hidden" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[60] xl:hidden">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} aria-hidden />
          <div role="dialog" aria-modal="true" aria-label="Menu" className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white">
            <div className="flex h-20 items-center justify-between px-6">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} className="rounded-md p-2 text-navy hover:bg-surface" aria-label="Close menu" autoFocus>
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex-1 px-6 pb-8">
              <ul className="divide-y divide-line border-y border-line">
                {LINKS.map((l) => (
                  <li key={l.to}>
                    <NavLink to={l.to} end={l.end} className={({ isActive }) => cn('flex items-center justify-between py-3.5 font-display text-base font-semibold', isActive ? 'text-red' : 'text-navy')}>
                      {l.label}
                      <ArrowRight className="h-4 w-4 opacity-40" />
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="mt-8 grid gap-3">
                <Link to="/contact" className="btn-primary">
                  Request Consultation
                </Link>
                <Link to="/portal" className="btn-secondary">
                  <Lock className="h-4 w-4" /> Client Portal
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function Footer() {
  const col = (title: string, links: [string, string][]) => (
    <div>
      <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-[0.14em] text-white">{title}</h2>
      <ul className="space-y-3 text-sm">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="transition-colors hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <footer className="bg-navy text-white/70">
      <div className="container-site grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Logo inverted />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">
            Your trusted partner for DVGW certification and German market access. A division of {COMPANY.name}.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red" aria-hidden />
              <span>
                {COMPANY.addressLines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-red" aria-hidden />
              <a href={`tel:${COMPANY.phone.replace(/[^+\d]/g, '')}`} className="hover:text-white">
                {COMPANY.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-red" aria-hidden />
              <a href={`mailto:${COMPANY.email}`} className="hover:text-white">
                {COMPANY.email}
              </a>
            </li>
          </ul>
        </div>
        <div className="lg:col-span-2">
          {col('Company', [
            ['/about', 'About ESC'],
            ['/services', 'Our Services'],
            ['/certification-process', 'Certification Process'],
            ['/contact', 'Contact'],
          ])}
        </div>
        <div className="lg:col-span-3">
          {col('Certification', [
            ['/dvgw-certification', 'What is DVGW?'],
            ...CATEGORIES.slice(0, 6).map((c) => [`/certification-requirements/${c.slug}`, `${c.name} requirements`] as [string, string]),
          ])}
        </div>
        <div className="lg:col-span-3">
          {col('Knowledge', [
            ['/certification-requirements', 'Knowledge Center'],
            ['/resources', 'Resources'],
            ['/faq', 'FAQ'],
            ['/portal', 'Client Portal'],
            ['/image-credits', 'Image credits'],
          ])}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-start justify-between gap-4 py-6 text-xs sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a href={`${COMPANY.mainSite}imprint`} className="hover:text-white" target="_blank" rel="noopener">
              Imprint
            </a>
            <a href={`${COMPANY.mainSite}privacy-policy`} className="hover:text-white" target="_blank" rel="noopener">
              Privacy
            </a>
            <a href={COMPANY.mainSite} className="hover:text-white" target="_blank" rel="noopener">
              ESC corporate website
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
