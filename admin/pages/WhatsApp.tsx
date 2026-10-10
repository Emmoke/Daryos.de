import React, { useCallback, useEffect, useState } from 'react';
import { Bot, Send, UserRound } from 'lucide-react';
import { api, ApiError, dateTime } from '../api';
import { Badge, Button, Card, Empty, inputCls, Notice, PageHeader, Spinner } from '../ui';

export function WhatsAppPage() {
  const [data, setData] = useState<{ configured: boolean; conversations: any[] } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [conv, setConv] = useState<{ conversation: any; canReply: boolean } | null>(null);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    api.waList().then(setData).catch((e) => setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true }));
  }, []);
  useEffect(() => {
    reload();
    const t = setInterval(reload, 15_000);
    return () => clearInterval(t);
  }, [reload]);
  useEffect(() => {
    if (selected) api.waGet(selected).then(setConv).catch(() => {});
  }, [selected, data]);

  const act = async (fn: () => Promise<{ conversation: any }>, ok: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fn();
      setConv((c) => (c ? { ...c, conversation: r.conversation } : c));
      setMsg({ text: ok });
      reload();
      return true;
    } catch (e) {
      setMsg({ text: e instanceof ApiError ? e.message : 'Fehler', error: true });
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="WhatsApp" description="Gespräche aus der WhatsApp Business Platform. Der Bot antwortet automatisch, bis Sie übernehmen." />
      {!data ? <Spinner /> : !data.configured ? (
        <Card title="WhatsApp ist noch nicht verbunden">
          <p className="text-sm text-slate-600">So verbinden Sie den WhatsApp-Bot – die Schritt-für-Schritt-Anleitung finden Sie unter <a href="#/einstellungen" className="text-indigo-600 hover:underline">Einstellungen → Verbindungen</a>.</p>
        </Card>
      ) : (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-6 items-start">
          <Card padded={false}>
            {data.conversations.length === 0 ? <Empty>Noch keine Nachrichten.</Empty> : (
              <ul className="divide-y divide-slate-100">
                {data.conversations.map((c) => (
                  <li key={c.waId}>
                    <button onClick={() => setSelected(c.waId)} className={`w-full text-left px-5 py-3.5 ${selected === c.waId ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{c.name || `+${c.waId}`}</span>
                        {c.optedOut ? <Badge>abgemeldet</Badge> : c.needsHuman ? <Badge tone="amber">Antwort nötig</Badge> : <Badge tone="blue">Bot aktiv</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">{c.lastMessage}</p>
                      <p className="text-[11px] text-slate-400">{dateTime(c.updatedAt)}{c.linkedRequestId ? ` · ${c.linkedRequestId}` : ''}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {conv && selected ? (
            <Card
              title={`${conv.conversation.name || 'Kunde'} · +${conv.conversation.waId}`}
              actions={
                <Button size="sm" disabled={busy} onClick={() => act(() => api.waBot(selected, !conv.conversation.needsHuman), conv.conversation.needsHuman ? 'Bot antwortet wieder.' : 'Sie haben übernommen.')}>
                  {conv.conversation.needsHuman ? <><Bot className="w-3.5 h-3.5" aria-hidden /> An Bot zurückgeben</> : <><UserRound className="w-3.5 h-3.5" aria-hidden /> Übernehmen</>}
                </Button>
              }
            >
              <ol className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {conv.conversation.messages.map((m: any) => (
                  <li key={m.id} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.direction === 'out' ? 'bg-slate-900 text-white rounded-br-md' : 'bg-slate-100 text-slate-900 rounded-bl-md'}`}>
                      <p className="whitespace-pre-line">{m.text}</p>
                      <p className={`mt-1 text-[10px] ${m.direction === 'out' ? 'text-slate-300' : 'text-slate-500'}`}>
                        {m.author === 'kunde' ? 'Kunde' : m.author === 'bot' ? 'Bot' : m.author.replace('admin:', '')} · {dateTime(m.at)}
                        {m.status === 'failed' && <span className="text-rose-300"> · nicht zugestellt</span>}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-4 border-t border-slate-100 pt-4">
                {conv.canReply && !conv.conversation.optedOut ? (
                  <form onSubmit={async (e) => { e.preventDefault(); if (await act(() => api.waReply(selected, text), 'Gesendet.')) setText(''); }} className="flex gap-2">
                    <label htmlFor="wa-text" className="sr-only">Antwort</label>
                    <input id="wa-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} placeholder="Antwort schreiben …" className={inputCls} />
                    <Button variant="primary" loading={busy} disabled={!text.trim()}><Send className="w-3.5 h-3.5" aria-hidden /> Senden</Button>
                  </form>
                ) : (
                  <Notice tone="amber">{conv.conversation.optedOut ? 'Der Kunde hat WhatsApp-Nachrichten abbestellt.' : 'Das 24-Stunden-Fenster ist abgelaufen. Antworten sind jetzt nur mit einer von Meta freigegebenen Vorlage oder über einen anderen Kanal möglich.'}</Notice>
                )}
                {msg && <p role="status" className={`mt-2 text-sm ${msg.error ? 'text-rose-600' : 'text-emerald-700'}`}>{msg.text}</p>}
              </div>
            </Card>
          ) : <Card><Empty>Wählen Sie ein Gespräch aus.</Empty></Card>}
        </div>
      )}
    </>
  );
}
