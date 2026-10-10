import React, { useCallback, useEffect, useState } from 'react';
import { Bot, BookOpen, HelpCircle, Inbox, LayoutDashboard, LogOut, Menu, MessageCircle, Settings, ShieldCheck, Tag, X } from 'lucide-react';
import { api, ApiError, type AdminUser } from './api';
import { Button, Field, inputCls, Notice, Spinner } from './ui';
import { OverviewPage } from './pages/Overview';
import { RequestsPage } from './pages/Requests';
import { WhatsAppPage } from './pages/WhatsApp';
import { TariffsPage } from './pages/Tariffs';
import { AssistantPage } from './pages/Assistant';
import { GuidePage } from './pages/Guide';
import { AccountingPage } from './pages/Accounting';
import { SettingsPage } from './pages/Settings';

const NAV = [
  { key: 'uebersicht', label: 'Übersicht', icon: LayoutDashboard },
  { key: 'anfragen', label: 'Anfragen', icon: Inbox },
  { key: 'tarife', label: 'Tarife', icon: Tag },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'assistent', label: 'KI-Assistent', icon: Bot },
  { key: 'buchhaltung', label: 'Buchhaltung', icon: BookOpen },
  { key: 'einstellungen', label: 'Einstellungen', icon: Settings },
  { key: 'anleitung', label: 'Anleitung', icon: HelpCircle },
] as const;
type PageKey = (typeof NAV)[number]['key'];

const currentPage = (): PageKey => {
  const key = window.location.hash.replace(/^#\/?/, '').split('/')[0];
  return (NAV.find((n) => n.key === key)?.key ?? 'uebersicht') as PageKey;
};

export function AdminApp() {
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);
  const [twoFactor, setTwoFactor] = useState(false);
  const [page, setPage] = useState<PageKey>(currentPage);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.me().then((r) => { setUser(r.user); setTwoFactor(r.twoFactor); }).catch(() => setUser(null));
    const onHash = () => { setPage(currentPage()); setMenuOpen(false); };
    const onUnauth = () => setUser(null);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('daryos:unauthorized', onUnauth);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('daryos:unauthorized', onUnauth);
    };
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setUser(null);
  }, []);

  if (user === undefined) return <Spinner />;
  if (!user) return <Login onLogin={(u) => { setUser(u); api.me().then((r) => setTwoFactor(r.twoFactor)).catch(() => {}); }} />;

  const nav = (
    <nav className="flex flex-col gap-0.5" aria-label="Hauptnavigation">
      {NAV.map(({ key, label, icon: Icon }) => (
        <a
          key={key}
          href={`#/${key}`}
          aria-current={page === key ? 'page' : undefined}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${page === key ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <Icon className="w-4 h-4" aria-hidden /> {label}
        </a>
      ))}
    </nav>
  );

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-2.5 px-2 pt-1">
        <span className="grid place-items-center w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-bold">D</span>
        <div>
          <p className="text-sm font-semibold leading-tight">Daryos</p>
          <p className="text-[11px] text-slate-500 leading-tight">Verwaltung</p>
        </div>
      </div>
      {nav}
      <div className="mt-auto space-y-3 border-t border-slate-100 pt-4">
        <div className="px-2">
          <p className="text-xs font-medium text-slate-900 truncate">{user.name}</p>
          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
          <p className={`mt-1 inline-flex items-center gap-1 text-[11px] ${twoFactor ? 'text-emerald-700' : 'text-amber-700'}`}>
            <ShieldCheck className="w-3 h-3" aria-hidden /> {twoFactor ? '2FA aktiv' : '2FA nicht aktiv'}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
          <LogOut className="w-3.5 h-3.5" aria-hidden /> Abmelden
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block border-r border-slate-200 bg-white sticky top-0 h-screen">{sidebar}</aside>
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 h-14">
        <span className="font-semibold text-sm">Daryos Verwaltung</span>
        <button onClick={() => setMenuOpen(true)} aria-label="Menü öffnen" className="p-2 rounded-lg hover:bg-slate-100"><Menu className="w-5 h-5" /></button>
      </div>
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/30" onClick={() => setMenuOpen(false)}>
          <aside className="h-full w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end p-2"><button onClick={() => setMenuOpen(false)} aria-label="Menü schließen" className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
            {sidebar}
          </aside>
        </div>
      )}
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8 max-w-7xl">
        {page === 'uebersicht' && <OverviewPage />}
        {page === 'anfragen' && <RequestsPage />}
        {page === 'tarife' && <TariffsPage />}
        {page === 'whatsapp' && <WhatsAppPage />}
        {page === 'assistent' && <AssistantPage />}
        {page === 'buchhaltung' && <AccountingPage />}
        {page === 'einstellungen' && <SettingsPage twoFactor={twoFactor} />}
        {page === 'anleitung' && <GuidePage />}
      </main>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (u: AdminUser) => void }) {
  const [cfg, setCfg] = useState<{ configured: boolean; twoFactor: boolean } | null>(null);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.authConfig().then(setCfg).catch((err) => setError(err instanceof ApiError ? err.message : 'Server nicht erreichbar.'));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onLogin((await api.login(password, cfg?.twoFactor ? code : undefined)).user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Anmeldung fehlgeschlagen.');
      setCode('');
    } finally {
      setBusy(false);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-slate-900 text-white font-bold">D</span>
          <span className="text-lg font-semibold">Daryos Verwaltung</span>
        </div>
        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h1 className="text-base font-semibold">Anmelden</h1>
            <p className="text-xs text-slate-500 mt-0.5">Nur für berechtigte Personen. Alle Anmeldungen werden begrenzt und protokolliert.</p>
          </div>
          {cfg && !cfg.configured && <Notice tone="amber">Der Zugang ist noch nicht eingerichtet. Bitte ADMIN_PASSWORD_HASH auf dem Server setzen.</Notice>}
          <Field label="Passwort">
            <input type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </Field>
          {cfg?.twoFactor && (
            <Field label="Bestätigungscode" hint="6-stelliger Code aus Ihrer Authenticator-App">
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className={`${inputCls} tracking-[0.3em] font-mono`} />
            </Field>
          )}
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" loading={busy} disabled={!password || (cfg?.twoFactor && code.length !== 6)}>
            Anmelden
          </Button>
        </form>
      </div>
    </div>
  );
}
