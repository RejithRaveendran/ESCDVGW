import { useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { CATEGORIES, INDUSTRIES } from '@/content';
import { api, ApiError, cn } from '@/lib/api';

type Kind = 'consultation' | 'assessment';
type Values = Record<string, string>;

const STATUSES = ['Not started – exploring options', 'Preparing documentation', 'Testing in progress', 'Certified for another market (e.g. BIS, WRAS, ACS)', 'DVGW certified – need extension or renewal'];
const MARKETS = ['Germany', 'Germany and Austria / Switzerland', 'European Union', 'Not decided yet'];

const REQUIRED: Record<string, string> = {
  companyName: 'Please enter your company name',
  contactPerson: 'Please enter a contact person',
  email: 'Please enter a valid e-mail address',
  mobile: 'Please enter a valid mobile number',
};

function validate(v: Values) {
  const e: Record<string, string> = {};
  for (const [k, msg] of Object.entries(REQUIRED)) if (!v[k]?.trim() || v[k].trim().length < 2) e[k] = msg;
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = REQUIRED.email;
  if (v.mobile && !/^[+\d][\d\s()-]{6,20}$/.test(v.mobile.trim())) e.mobile = REQUIRED.mobile;
  return e;
}

export function InquiryForm({ initialKind = 'consultation', compact = false }: { initialKind?: Kind; compact?: boolean }) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<{ status: 'idle' | 'sending' | 'done' | 'error'; message?: string; ref?: string }>({ status: 'idle' });

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries()) as Values;
    const e = validate(values);
    setErrors(e);
    if (Object.keys(e).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(e)[0]}"]`)?.focus();
      return;
    }
    setState({ status: 'sending' });
    try {
      const r = await api<{ reference: string }>('/inquiries', { body: { ...values, kind } });
      setState({ status: 'done', ref: r.reference });
      form.reset();
    } catch (err) {
      const ae = err as ApiError;
      if (ae.fields) setErrors(Object.fromEntries(Object.entries(ae.fields).map(([k, v]) => [k, v?.[0] ?? 'Invalid'])));
      setState({ status: 'error', message: ae.message });
    }
  }

  if (state.status === 'done') {
    return (
      <div className="card flex flex-col items-start gap-4 p-8" role="status">
        <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
        <h3 className="text-h3">Thank you. We have received your request.</h3>
        <p className="text-muted">
          Your reference number is <strong className="text-navy">{state.ref}</strong>. An ESC certification consultant will contact you within two working days to discuss your
          {kind === 'assessment' ? ' certification assessment' : ' consultation'}.
        </p>
        <button type="button" className="btn-secondary" onClick={() => setState({ status: 'idle' })}>
          Send another request
        </button>
      </div>
    );
  }

  const field = (name: string, label: string, opts: { type?: string; required?: boolean; autoComplete?: string; placeholder?: string } = {}) => (
    <div>
      <label htmlFor={`f-${name}`} className="field-label">
        {label} {opts.required && <span className="text-red" aria-hidden>*</span>}
      </label>
      <input
        id={`f-${name}`}
        name={name}
        type={opts.type ?? 'text'}
        className={cn('field', errors[name] && 'border-red')}
        autoComplete={opts.autoComplete}
        placeholder={opts.placeholder}
        aria-required={opts.required}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `e-${name}` : undefined}
      />
      {errors[name] && (
        <p id={`e-${name}`} className="field-error">
          {errors[name]}
        </p>
      )}
    </div>
  );
  const select = (name: string, label: string, options: string[]) => (
    <div>
      <label htmlFor={`f-${name}`} className="field-label">
        {label}
      </label>
      <select id={`f-${name}`} name={name} className="field" defaultValue="">
        <option value="">Please select</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );

  return (
    <form noValidate onSubmit={onSubmit} className={cn('card p-6 md:p-8', compact && 'shadow-lift')}>
      <fieldset>
        <legend className="field-label">I would like to</legend>
        <div className="mt-1 grid grid-cols-2 gap-1 rounded-btn bg-surface p-1">
          {(
            [
              ['consultation', 'Request consultation'],
              ['assessment', 'Get certification assessment'],
            ] as [Kind, string][]
          ).map(([k, l]) => (
            <label key={k} className={cn('cursor-pointer rounded-[5px] px-3 py-2 text-center text-sm font-semibold transition-colors', kind === k ? 'bg-white text-navy shadow-card' : 'text-muted hover:text-navy')}>
              <input type="radio" name="kindRadio" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {field('companyName', 'Company name', { required: true, autoComplete: 'organization' })}
        {field('contactPerson', 'Contact person', { required: true, autoComplete: 'name' })}
        {field('designation', 'Designation', { autoComplete: 'organization-title' })}
        {field('email', 'E-mail', { type: 'email', required: true, autoComplete: 'email' })}
        {field('mobile', 'Mobile number', { type: 'tel', required: true, autoComplete: 'tel', placeholder: '+91' })}
        {select('productCategory', 'Product category', [...CATEGORIES.map((c) => c.name), 'Other'])}
        {select('sector', 'Manufacturing sector', INDUSTRIES.map((i) => i.title))}
        {select('certificationStatus', 'Current certification status', STATUSES)}
        <div className="sm:col-span-2">{select('targetMarket', 'Target export market', MARKETS)}</div>
        <div className="sm:col-span-2">
          <label htmlFor="f-message" className="field-label">
            Message
          </label>
          <textarea id="f-message" name="message" rows={compact ? 3 : 5} className="field" placeholder="Tell us about your products, sizes and timeline." maxLength={4000} />
        </div>
        {/* Honeypot – hidden from people */}
        <div className="hidden" aria-hidden>
          <label>
            Website <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>

      {state.status === 'error' && (
        <p className="mt-5 rounded-btn bg-red-50 px-4 py-3 text-sm font-medium text-red" role="alert">
          {state.message}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-sm text-xs text-muted">We use your details only to respond to this request. Fields marked * are required.</p>
        <button type="submit" className="btn-primary px-7" disabled={state.status === 'sending'}>
          {state.status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {kind === 'assessment' ? 'Request assessment' : 'Request consultation'}
        </button>
      </div>
    </form>
  );
}
