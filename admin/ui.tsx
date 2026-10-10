// Schlichte UI-Bausteine der Verwaltungs-App (helles, ruhiges Design).
import React from 'react';
import { Loader2 } from 'lucide-react';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ title, actions, children, className = '', padded = true }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; size?: 'sm' | 'md'; loading?: boolean };

export function Button({ variant = 'secondary', size = 'md', loading, className = '', children, disabled, ...rest }: ButtonProps) {
  const styles = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300',
    danger: 'bg-white text-rose-700 hover:bg-rose-50 border-rose-300',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
  }[variant];
  const sizes = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm';
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${styles} ${sizes} ${className}`}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

const TONES = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
} as const;

export function Badge({ tone = 'gray', children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap ${TONES[tone]}`}>{children}</span>;
}

export const inputCls =
  'block w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50';

export function Field({ label, error, hint, children, className = '' }: { label: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-slate-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-[11px] text-rose-600">{error}</span>}
    </label>
  );
}

export function Notice({ tone = 'gray', children }: { tone?: 'gray' | 'amber' | 'red' | 'green' | 'blue'; children: React.ReactNode }) {
  const t = {
    gray: 'bg-slate-50 border-slate-200 text-slate-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    red: 'bg-rose-50 border-rose-200 text-rose-800',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
  }[tone];
  return <div className={`rounded-lg border px-4 py-3 text-sm ${t}`}>{children}</div>;
}

export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'green' | 'red' | 'amber' }) {
  const color = tone === 'green' ? 'text-emerald-700' : tone === 'red' ? 'text-rose-700' : tone === 'amber' ? 'text-amber-700' : 'text-slate-900';
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tracking-tight tabular-nums ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-sm text-slate-500">{children}</p>;
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="w-5 h-5 animate-spin text-slate-400" aria-label="Wird geladen" />
    </div>
  );
}
