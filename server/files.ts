// Dateispeicher für Kundenunterlagen (z. B. Jahresabrechnung, Foto vom Zähler).
// Produktiv: privater Cloud-Storage-Bucket (kein öffentlicher Zugriff, nur der Server liest/schreibt).
// Lokal: Ordner DATA_DIR/uploads. Tests: Arbeitsspeicher.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface FileStorage {
  readonly name: string;
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | undefined>;
  remove(key: string): Promise<void>;
}

export class MemoryFileStorage implements FileStorage {
  readonly name = 'Arbeitsspeicher';
  readonly files = new Map<string, Buffer>();
  async put(key: string, data: Buffer) {
    this.files.set(key, Buffer.from(data));
  }
  async get(key: string) {
    return this.files.get(key);
  }
  async remove(key: string) {
    this.files.delete(key);
  }
}

export class LocalFileStorage implements FileStorage {
  readonly name: string;
  constructor(private readonly dir: string) {
    this.name = `Ordner (${dir})`;
  }
  private file(key: string) {
    if (!/^[a-zA-Z0-9/_-]+$/.test(key) || key.includes('..')) throw new Error('Ungültiger Dateischlüssel');
    return path.join(this.dir, key);
  }
  async put(key: string, data: Buffer) {
    const f = this.file(key);
    await mkdir(path.dirname(f), { recursive: true });
    await writeFile(f, data);
  }
  async get(key: string) {
    return readFile(this.file(key)).catch(() => undefined);
  }
  async remove(key: string) {
    await rm(this.file(key), { force: true });
  }
}

interface BucketLike {
  file(key: string): {
    save(data: Buffer, opts: { contentType: string; resumable: boolean }): Promise<unknown>;
    download(): Promise<[Buffer]>;
    delete(opts: { ignoreNotFound: boolean }): Promise<unknown>;
  };
}

export class CloudFileStorage implements FileStorage {
  readonly name: string;
  constructor(private readonly bucket: BucketLike, bucketName: string) {
    this.name = `Cloud Storage (${bucketName})`;
  }
  async put(key: string, data: Buffer, contentType: string) {
    await this.bucket.file(key).save(data, { contentType, resumable: false });
  }
  async get(key: string) {
    try {
      return (await this.bucket.file(key).download())[0];
    } catch (err) {
      if ((err as { code?: number }).code === 404) return undefined;
      throw err;
    }
  }
  async remove(key: string) {
    await this.bucket.file(key).delete({ ignoreNotFound: true });
  }
}

export async function fileStorageFromEnv(env: NodeJS.ProcessEnv, root: string): Promise<FileStorage> {
  if (env.STORAGE_BUCKET) {
    const { initializeApp, getApps } = await import('firebase-admin/app');
    const { getStorage } = await import('firebase-admin/storage');
    const projectId = env.FIREBASE_PROJECT_ID || env.GOOGLE_CLOUD_PROJECT || undefined;
    const app = getApps()[0] ?? initializeApp(projectId ? { projectId } : undefined);
    return new CloudFileStorage(getStorage(app).bucket(env.STORAGE_BUCKET) as unknown as BucketLike, env.STORAGE_BUCKET);
  }
  return new LocalFileStorage(path.join(env.DATA_DIR || path.join(root, 'data'), 'uploads'));
}

export const UPLOAD_TYPES = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' } as const;
export type UploadType = keyof typeof UPLOAD_TYPES;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_REQUEST = 10;

/** Erkennt den echten Dateityp am Inhalt (nicht am Namen) – nur PDF, JPEG und PNG sind erlaubt. */
export function detectUploadType(buf: Buffer): UploadType | undefined {
  if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  return undefined;
}

/** Dateiname für Anzeige und Download: ohne Pfade/Steuerzeichen, max. 100 Zeichen, passende Endung */
export function safeFileName(raw: string | undefined, type: UploadType) {
  let name = '';
  try {
    name = decodeURIComponent(raw ?? '');
  } catch {
    name = '';
  }
  name = name.split(/[\\/]/).pop()!.replace(/[^\p{L}\p{N} ._()-]/gu, '').trim().slice(0, 100);
  const ext = UPLOAD_TYPES[type];
  if (!name) name = `dokument.${ext}`;
  if (!name.toLowerCase().endsWith(`.${ext}`) && !(ext === 'jpg' && /\.jpe?g$/i.test(name))) name = `${name.replace(/\.[^.]*$/, '')}.${ext}`;
  return name;
}
