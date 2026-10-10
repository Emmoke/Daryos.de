// Dauerhafte Speicherung. Die Stores halten ihre Daten im Arbeitsspeicher und schreiben jede Änderung
// sofort einzeln durch ("write-through") – lokal in JSON-Dateien, im Betrieb in Cloud Firestore.
//
// Hinweis Betrieb: Weil die Stores beim Start alles laden und danach aus dem Speicher lesen, muss genau
// EINE Server-Instanz laufen (Cloud Run: --max-instances=1). Das genügt für Daryos bei Weitem.
import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface Backend {
  readonly name: string;
  loadAll<T>(collection: string): Promise<T[]>;
  put(collection: string, id: string, doc: unknown): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
}

/** Nur für Tests: nichts wird dauerhaft gespeichert. */
export class MemoryBackend implements Backend {
  readonly name = 'Arbeitsspeicher (nicht dauerhaft)';
  private data = new Map<string, Map<string, unknown>>();
  private col(c: string) {
    if (!this.data.has(c)) this.data.set(c, new Map());
    return this.data.get(c)!;
  }
  async loadAll<T>(c: string) {
    return [...this.col(c).values()].map((d) => structuredClone(d) as T);
  }
  async put(c: string, id: string, doc: unknown) {
    this.col(c).set(id, structuredClone(doc));
  }
  async remove(c: string, id: string) {
    this.col(c).delete(id);
  }
}

/** Lokale Entwicklung / Einzelserver mit dauerhaftem Datenträger: eine JSON-Datei je Sammlung. */
export class FileBackend implements Backend {
  readonly name: string;
  private cache = new Map<string, Record<string, unknown>>();
  private writing = new Map<string, Promise<void>>();

  constructor(private readonly dir: string) {
    this.name = `Dateien (${dir})`;
  }

  private file(c: string) {
    if (!/^[a-z0-9_-]+$/i.test(c)) throw new Error('Ungültiger Sammlungsname');
    return path.join(this.dir, `${c}.json`);
  }

  private async load(c: string) {
    if (this.cache.has(c)) return this.cache.get(c)!;
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(await fs.readFile(this.file(c), 'utf8'));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
    this.cache.set(c, data);
    return data;
  }

  async loadAll<T>(c: string) {
    return Object.values(await this.load(c)).map((d) => structuredClone(d) as T);
  }

  private flush(c: string) {
    const snapshot = JSON.stringify(this.cache.get(c) ?? {}, null, 2);
    const file = this.file(c);
    const next = (this.writing.get(c) ?? Promise.resolve()).catch(() => {}).then(async () => {
      await fs.mkdir(this.dir, { recursive: true, mode: 0o700 });
      const tmp = `${file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, snapshot, { mode: 0o600 });
      await fs.rename(tmp, file);
    });
    this.writing.set(c, next);
    return next;
  }

  async put(c: string, id: string, doc: unknown) {
    (await this.load(c))[id] = structuredClone(doc);
    await this.flush(c);
  }

  async remove(c: string, id: string) {
    delete (await this.load(c))[id];
    await this.flush(c);
  }
}

/** Minimaler Ausschnitt der Firestore-API, den wir nutzen (erlaubt Tests ohne Google-Konto). */
export interface FirestoreLike {
  collection(name: string): {
    get(): Promise<{ docs: { id: string; data(): unknown }[] }>;
    doc(id: string): { set(data: unknown): Promise<unknown>; delete(): Promise<unknown> };
  };
}

/** Cloud Firestore: ein Dokument je Datensatz. */
export class FirestoreBackend implements Backend {
  readonly name: string;
  constructor(private readonly db: FirestoreLike, private readonly prefix = 'daryos_', projectId?: string) {
    this.name = `Cloud Firestore${projectId ? ` (${projectId})` : ''}`;
  }
  private col(c: string) {
    return this.db.collection(`${this.prefix}${c}`);
  }
  async loadAll<T>(c: string) {
    const snap = await this.col(c).get();
    return snap.docs.map((d) => d.data() as T);
  }
  async put(c: string, id: string, doc: unknown) {
    // JSON-Rundreise entfernt undefined-Werte, die Firestore ablehnt
    await this.col(c).doc(id).set(JSON.parse(JSON.stringify(doc)));
  }
  async remove(c: string, id: string) {
    await this.col(c).doc(id).delete();
  }
}

/**
 * STORAGE=firestore → Cloud Firestore (Zugangsdaten: auf Cloud Run automatisch über das Dienstkonto,
 *   lokal über GOOGLE_APPLICATION_CREDENTIALS oder FIRESTORE_EMULATOR_HOST).
 * sonst → JSON-Dateien in DATA_DIR (Standard: ./data).
 */
export async function backendFromEnv(env: NodeJS.ProcessEnv, root: string): Promise<Backend> {
  if ((env.STORAGE || '').toLowerCase() === 'firestore') {
    const { initializeApp, getApps } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    const projectId = env.FIREBASE_PROJECT_ID || env.GOOGLE_CLOUD_PROJECT || undefined;
    const app = getApps()[0] ?? initializeApp(projectId ? { projectId } : undefined);
    const db = env.FIRESTORE_DATABASE_ID ? getFirestore(app, env.FIRESTORE_DATABASE_ID) : getFirestore(app);
    return new FirestoreBackend(db as unknown as FirestoreLike, env.FIRESTORE_PREFIX ?? 'daryos_', projectId);
  }
  return new FileBackend(env.DATA_DIR || path.join(root, 'data'));
}
