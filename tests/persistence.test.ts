import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { FileBackend, FirestoreBackend, MemoryBackend, type Backend, type FirestoreLike } from '../server/persistence';
import { MemoryRequestStore, newRequestId, type RequestRecord } from '../server/store';
import { AccountingStore } from '../server/accounting';
import { ConversationStore } from '../server/whatsapp';

const NOW = new Date('2026-10-10T10:00:00Z');
const SETTINGS = { ownerName: 'Max Muster', taxNumber: '231/123/45678' };
const invoiceBody = { customer: { name: 'Erika Kunde', street: 'Hauptstr. 1', postalCode: '04109', city: 'Leipzig' }, items: [{ description: 'Beratung', quantity: 1, unitPriceCents: 8900, vatRate: 19 }] };

function record(deleteAfter = '2027-01-01T00:00:00Z'): RequestRecord {
  return {
    id: newRequestId(),
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    status: 'NEW',
    history: [],
    input: { energyType: 'gas', postalCode: '04109', annualConsumptionKwh: 12000 },
    comparison: null,
    drafts: [],
    notifications: [],
    deleteAfter,
  };
}

/** Nachbildung der Firestore-API für Tests ohne Google-Konto. */
class FakeFirestore implements FirestoreLike {
  data = new Map<string, Map<string, unknown>>();
  writes: string[] = [];
  collection(name: string) {
    if (!this.data.has(name)) this.data.set(name, new Map());
    const col = this.data.get(name)!;
    return {
      get: async () => ({ docs: [...col.entries()].map(([id, d]) => ({ id, data: () => structuredClone(d) })) }),
      doc: (id: string) => ({
        set: async (d: unknown) => {
          if (JSON.stringify(d).includes('undefined')) throw new Error('undefined nicht erlaubt');
          this.writes.push(`${name}/${id}`);
          col.set(id, structuredClone(d));
        },
        delete: async () => col.delete(id),
      }),
    };
  }
}

async function roundtrip(makeBackend: () => Backend) {
  // 1. Daten anlegen
  let backend = makeBackend();
  const requests = await MemoryRequestStore.open(backend);
  const r = record();
  await requests.create(r);
  await requests.update(r.id, (x) => { x.status = 'VALIDATING'; });
  const old = record('2020-01-01T00:00:00Z');
  await requests.create(old);
  assert.equal(await requests.purgeExpired(NOW), 1);

  const acc = await AccountingStore.open(backend, () => NOW);
  await acc.updateSettings(SETTINGS);
  const inv = await acc.createInvoice(invoiceBody, 'admin:test');
  await acc.markPaid(inv.id, undefined, 'admin:test');

  const wa = await ConversationStore.open(backend);
  await wa.upsert('4917600000001', (c) => c.messages.push({ id: 'wamid.1', at: NOW.toISOString(), direction: 'in', author: 'kunde', text: 'Hallo' }), NOW, 180);

  // 2. "Neustart": alles neu aus dem Backend laden
  backend = makeBackend();
  const requests2 = await MemoryRequestStore.open(backend);
  assert.equal((await requests2.get(r.id))?.status, 'VALIDATING');
  assert.equal(await requests2.get(old.id), undefined, 'abgelaufene Anfrage bleibt gelöscht');

  const acc2 = await AccountingStore.open(backend, () => NOW);
  assert.equal(acc2.getSettings().ownerName, 'Max Muster');
  assert.equal(acc2.listInvoices()[0].status, 'bezahlt');
  assert.equal(acc2.summary('2026').incomeCents, 8900);
  const next = await acc2.createInvoice(invoiceBody, 'admin:test');
  assert.equal(next.number, 'RE-2026-0002', 'Rechnungsnummer läuft nach Neustart lückenlos weiter');

  const wa2 = await ConversationStore.open(backend);
  assert.equal(wa2.get('4917600000001')?.messages.length, 1);
  assert.equal(wa2.seen('wamid.1'), true, 'bereits verarbeitete Nachricht wird nach Neustart erkannt');
}

test('Dateispeicher: Anfragen, Buchhaltung und WhatsApp überstehen einen Neustart', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'daryos-'));
  try {
    await roundtrip(() => new FileBackend(dir));
    const raw = JSON.parse(await readFile(path.join(dir, 'accounting_invoices.json'), 'utf8'));
    assert.equal(Object.keys(raw).length, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('Firestore: ein Dokument je Datensatz, Präfix, keine undefined-Werte', async () => {
  const fake = new FakeFirestore();
  await roundtrip(() => new FirestoreBackend(fake));
  assert.deepEqual([...fake.data.keys()].sort(), ['daryos_accounting_bookings', 'daryos_accounting_invoices', 'daryos_accounting_meta', 'daryos_requests', 'daryos_whatsapp_conversations']);
  assert.equal(fake.data.get('daryos_accounting_invoices')!.size, 2);
  assert.ok(fake.writes.includes('daryos_accounting_meta/counters'));
});

test('Speicherfehler: nichts Ungespeichertes bleibt im Arbeitsspeicher', async () => {
  class FailingBackend extends MemoryBackend {
    fail = false;
    async put(c: string, id: string, doc: unknown) {
      if (this.fail) throw new Error('Datenbank nicht erreichbar');
      return super.put(c, id, doc);
    }
  }
  const backend = new FailingBackend();
  const acc = await AccountingStore.open(backend, () => NOW);
  await acc.updateSettings(SETTINGS);
  backend.fail = true;
  await assert.rejects(acc.createInvoice(invoiceBody, 'admin:test'), /nicht erreichbar/);
  assert.equal(acc.listInvoices().length, 0, 'Rechnung nicht angezeigt, wenn nicht gespeichert');
  backend.fail = false;
  const inv = await acc.createInvoice(invoiceBody, 'admin:test');
  assert.equal(inv.number, 'RE-2026-0001', 'fehlgeschlagener Versuch verbraucht keine Nummer');

  const requests = await MemoryRequestStore.open(backend);
  const r = record();
  backend.fail = true;
  await assert.rejects(requests.create(r));
  assert.equal(await requests.get(r.id), undefined);
});
