import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Badge, Button, Card } from '../ui';
import { NewAppointment } from './Appointments';

// Termine zu einer Anfrage (z. B. zur Unterschrift oder Beratung vor Ort)
export function RequestAppointments({ req }: { req: any }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.appointments>> | null>(null);
  const [creating, setCreating] = useState(false);
  const load = () => api.appointments().then(setData).catch(() => {});
  useEffect(() => { load(); }, [req.id]);
  if (!data || !req.contact) return null;
  const email = req.contact.email?.toLowerCase();
  const mine = data.appointments.filter((a) => a.requestId === req.id || (email && a.email === email));
  if (creating) return <NewAppointment data={data} preset={{ name: req.contact.name, phone: req.contact.phone ?? '', email: req.contact.email, service: req.input.energyType, requestId: req.id }} onDone={() => { setCreating(false); load(); }} onCancel={() => setCreating(false)} />;
  return (
    <Card title={`Termine (${mine.length})`} actions={<Button size="sm" onClick={() => setCreating(true)}>Termin vereinbaren</Button>}>
      {mine.length ? (
        <ul className="divide-y divide-slate-100 text-sm">
          {mine.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2">
              <span>{(a.confirmed ?? a.wish)?.date} {(a.confirmed ?? a.wish)?.time} · {data.formats[a.format]}</span>
              <a href="#/termine"><Badge tone={a.status === 'bestaetigt' ? 'green' : a.status === 'angefragt' ? 'amber' : 'gray'}>{data.statusLabels[a.status]}</Badge></a>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">Noch kein Termin. Z. B. für eine Beratung vor Ort oder um den Antrag gemeinsam auszufüllen.</p>}
    </Card>
  );
}
