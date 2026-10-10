// Statusmaschine für Kundenanfragen. Jede Änderung wird mit Zeitstempel und Akteur protokolliert.
import type { RequestStatus, StatusHistoryEntry } from '../shared/platform';

const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  NEW: ['VALIDATING', 'ERROR'],
  VALIDATING: ['OFFERS_FOUND', 'ERROR'],
  OFFERS_FOUND: ['CUSTOMER_CONTACTED', 'ERROR'],
  CUSTOMER_CONTACTED: ['WAITING_FOR_ADMIN', 'ERROR'],
  WAITING_FOR_ADMIN: ['APPROVED', 'REJECTED', 'ERROR'],
  APPROVED: ['SUBMITTED', 'REJECTED'],
  // COMPLETED nur nach Bestätigung durch die Anbieterplattform (siehe Admin-Aktion "complete")
  SUBMITTED: ['COMPLETED', 'REJECTED', 'ERROR'],
  COMPLETED: [],
  REJECTED: [],
  ERROR: ['WAITING_FOR_ADMIN', 'REJECTED'],
};

export class TransitionError extends Error {
  constructor(from: RequestStatus, to: RequestStatus) {
    super(`Statuswechsel von ${from} nach ${to} ist nicht erlaubt.`);
    this.name = 'TransitionError';
  }
}

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export interface HasStatus {
  status: RequestStatus;
  history: StatusHistoryEntry[];
  updatedAt: string;
}

export function transition<T extends HasStatus>(record: T, to: RequestStatus, actor: string, note?: string, now = new Date()): T {
  if (!canTransition(record.status, to)) throw new TransitionError(record.status, to);
  const at = now.toISOString();
  record.history.push({ at, actor, from: record.status, to, ...(note ? { note } : {}) });
  record.status = to;
  record.updatedAt = at;
  return record;
}

/** Protokolliert eine Aktion ohne Statuswechsel (z. B. Nachfrage, Notiz). */
export function logNote<T extends HasStatus>(record: T, actor: string, note: string, now = new Date()): T {
  const at = now.toISOString();
  record.history.push({ at, actor, from: record.status, to: record.status, note });
  record.updatedAt = at;
  return record;
}
