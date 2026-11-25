import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, FolderKanban, Inbox, LayoutDashboard, Loader2, LogOut, Menu, Users, X } from 'lucide-react';
import { Logo } from '@/components/Layout';
import { cn } from '@/lib/api';
import { ROLE_LABEL, isManager, useAuth } from './auth';

export function PortalLayout() {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy" aria-label="Loading" />
      </div>
    );
  if (!user) return <Navigate to="/portal/login" replace state={{ from: pathname }} />;

  const links = [
    { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/portal/projects', label: 'Projects', icon: FolderKanban },
    ...(isManager(user)
      ? [
          { to: '/portal/inquiries', label: 'Inquiries', icon: Inbox },
          { to: '/portal/analytics', label: 'Analytics', icon: BarChart3 },
          { to: '/portal/users', label: 'Users & organisations', icon: Users },
        ]
      : []),
  ];

  const nav = (
    <nav aria-label="Portal" className="flex flex-1 flex-col gap-1 p-4">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) => cn('flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white')}
        >
          <l.icon className="h-4 w-4" aria-hidden /> {l.label}
        </NavLink>
      ))}
      <div className="mt-auto border-t border-white/10 pt-4">
        <p className="px-3 text-sm font-semibold text-white">{user.name}</p>
        <p className="px-3 text-xs text-white/55">
          {ROLE_LABEL[user.role]}
          {user.organization_name ? ` · ${user.organization_name}` : ''}
        </p>
        <button type="button" onClick={logout} className="mt-3 flex w-full items-center gap-3 rounded-btn px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[16rem_1fr]">
      <title>Client Portal | ESC Utility Services</title>
      <meta name="robots" content="noindex,nofollow" />
      <aside className="hidden flex-col bg-navy lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start">
        <div className="flex h-20 items-center border-b border-white/10 px-6">
          <Logo inverted badge={false} />
        </div>
        {nav}
      </aside>
      <div className="flex h-16 items-center justify-between border-b border-line bg-white px-5 lg:hidden">
        <Logo />
        <button type="button" onClick={() => setOpen(true)} className="rounded p-2 text-navy" aria-label="Open portal menu">
          <Menu className="h-6 w-6" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} aria-hidden />
          <div role="dialog" aria-modal="true" className="absolute inset-y-0 left-0 flex w-72 flex-col bg-navy">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <Logo inverted badge={false} />
              <button type="button" onClick={() => setOpen(false)} className="text-white" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}
      <main id="main" className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ shared portal UI */
export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.75rem] leading-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('card', className)}>
      {title && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-base">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const TONES: Record<string, string> = {
  active: 'bg-info-50 text-info',
  in_progress: 'bg-info-50 text-info',
  scheduled: 'bg-info-50 text-info',
  new: 'bg-red-50 text-red',
  open: 'bg-warning-50 text-warning',
  pending_review: 'bg-warning-50 text-warning',
  needs_revision: 'bg-red-50 text-red',
  on_hold: 'bg-warning-50 text-warning',
  postponed: 'bg-warning-50 text-warning',
  contacted: 'bg-info-50 text-info',
  qualified: 'bg-info-50 text-info',
  approved: 'bg-success-50 text-success',
  completed: 'bg-success-50 text-success',
  certified: 'bg-success-50 text-success',
  done: 'bg-success-50 text-success',
  won: 'bg-success-50 text-success',
  final: 'bg-success-50 text-success',
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={cn('badge capitalize', TONES[status] ?? 'bg-surface text-muted')}>{status.replace(/_/g, ' ')}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-btn bg-surface px-4 py-6 text-center text-sm text-muted">{children}</p>;
}

export function Loading() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-navy" aria-label="Loading" />
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-btn bg-red-50 px-4 py-3 text-sm font-medium text-red" role="alert">
      {message}
    </p>
  );
}

export function StageBar({ stage, compact }: { stage: number; compact?: boolean }) {
  return (
    <div>
      <div className="flex gap-1" role="img" aria-label={`Stage ${stage} of 10`}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', i + 1 < stage ? 'bg-navy' : i + 1 === stage ? 'bg-red' : 'bg-line-strong')} />
        ))}
      </div>
      {!compact && <p className="mt-1.5 text-xs text-muted">Stage {stage} of 10</p>}
    </div>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="mb-4 inline-block text-sm font-medium text-muted hover:text-navy">
      ← {label}
    </Link>
  );
}
