import type { Attempt } from './types.js';

const DATABASE = 'dualcue-toeic-study-v1';
const LEASE_MS = 30_000;
interface Lease { id: string; owner: string; expiresAt: number }
export interface StudyStore {
  readonly persistent: boolean;
  get(id: string): Promise<Attempt | null>;
  list(version?: string): Promise<Attempt[]>;
  acquire(id: string, owner: string, now?: number, exclusiveWebLock?: boolean): Promise<boolean>;
  save(attempt: Attempt, owner: string, now?: number): Promise<Attempt>;
  release(id: string, owner: string): Promise<void>;
  clear(): Promise<void>;
  close(): void;
}

function validateSave(attempt: Attempt, previous: Attempt | undefined, lease: Lease | undefined, owner: string, now: number): Attempt {
  // Check terminal state before fencing: even a new owner must never reopen a submitted result.
  if (previous?.status === 'submitted') throw new Error('這份作答已交卷，請開始新練習。');
  if (!lease || lease.owner !== owner || lease.expiresAt <= now) throw new Error('另一個分頁正在編輯，或編輯權已逾時。請重新載入。');
  if ((previous?.revision ?? 0) !== attempt.revision) throw new Error('這份進度已更新，請重新載入後繼續。');
  if (previous && (previous.contentVersion !== attempt.contentVersion || previous.formId !== attempt.formId || previous.questionIds.join() !== attempt.questionIds.join())) throw new Error('進度版本或題目範圍不符。');
  return { ...attempt, updatedAt: now, revision: attempt.revision + 1 };
}

function memoryStore(): StudyStore {
  const rows = new Map<string, Attempt>();
  const leases = new Map<string, Lease>();
  return {
    persistent: false,
    async get(id) { return structuredClone(rows.get(id) ?? null); },
    async list(version) { return structuredClone([...rows.values()].filter((a) => !version || a.contentVersion === version).sort((a, b) => b.updatedAt - a.updatedAt)); },
    async acquire(id, owner, now = Date.now(), exclusiveWebLock = false) {
      const lease = leases.get(id);
      if (!exclusiveWebLock && lease && lease.owner !== owner && lease.expiresAt > now) return false;
      leases.set(id, { id, owner, expiresAt: now + LEASE_MS }); return true;
    },
    async save(attempt, owner, now = Date.now()) {
      const saved = validateSave(attempt, rows.get(attempt.id), leases.get(attempt.id), owner, now);
      rows.set(saved.id, structuredClone(saved)); return saved;
    },
    async release(id, owner) { if (leases.get(id)?.owner === owner) leases.delete(id); },
    async clear() { rows.clear(); leases.clear(); },
    close() { /* no persistent connection */ },
  };
}

class IndexedStudyStore implements StudyStore {
  readonly persistent = true;
  constructor(private readonly db: IDBDatabase) {}

  private transaction<T>(mode: IDBTransactionMode, action: (attempts: IDBObjectStore, leases: IDBObjectStore, done: (value: T) => void, fail: (reason: Error) => void) => void): Promise<T> {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['attempts', 'leases'], mode);
      let result: T;
      let failure: Error | null = null;
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(failure ?? new Error('本機進度無法保存。請保留此頁並重試。'));
      try { action(tx.objectStore('attempts'), tx.objectStore('leases'), (value) => { result = value; }, (error) => { failure = error; tx.abort(); }); }
      catch (error) { failure = error as Error; tx.abort(); }
    });
  }

  get(id: string): Promise<Attempt | null> {
    return this.transaction('readonly', (attempts, _leases, done) => {
      const request = attempts.get(id); request.onsuccess = () => done(request.result ?? null);
    });
  }

  list(version?: string): Promise<Attempt[]> {
    return this.transaction('readonly', (attempts, _leases, done) => {
      const request = attempts.getAll();
      request.onsuccess = () => done((request.result as Attempt[]).filter((a) => !version || a.contentVersion === version).sort((a, b) => b.updatedAt - a.updatedAt));
    });
  }

  acquire(id: string, owner: string, now = Date.now(), exclusiveWebLock = false): Promise<boolean> {
    return this.transaction('readwrite', (_attempts, leases, done) => {
      const request = leases.get(id);
      request.onsuccess = () => {
        const lease = request.result as Lease | undefined;
        // Takeover is allowed only to the holder of this attempt's exclusive Web Lock.
        if (!exclusiveWebLock && lease && lease.owner !== owner && lease.expiresAt > now) { done(false); return; }
        leases.put({ id, owner, expiresAt: now + LEASE_MS }); done(true);
      };
    });
  }

  save(attempt: Attempt, owner: string, now = Date.now()): Promise<Attempt> {
    // Both lease fencing and revision/terminal checks share one cross-tab IDB transaction.
    return this.transaction('readwrite', (attempts, leases, done, fail) => {
      const getAttempt = attempts.get(attempt.id);
      getAttempt.onsuccess = () => {
        const getLease = leases.get(attempt.id);
        getLease.onsuccess = () => {
          try {
            const saved = validateSave(attempt, getAttempt.result, getLease.result, owner, now);
            attempts.put(saved); done(saved);
          } catch (error) { fail(error as Error); }
        };
      };
    });
  }

  release(id: string, owner: string): Promise<void> {
    return this.transaction('readwrite', (_attempts, leases, done) => {
      const request = leases.get(id);
      request.onsuccess = () => { if (request.result?.owner === owner) leases.delete(id); done(undefined); };
    });
  }

  clear(): Promise<void> {
    return this.transaction('readwrite', (attempts, leases, done) => { attempts.clear(); leases.clear(); done(undefined); });
  }
  close(): void { this.db.close(); }
}

export async function openStudyStore(factory?: IDBFactory | null): Promise<StudyStore> {
  try {
    const source = factory === undefined ? globalThis.indexedDB : factory;
    if (!source) return memoryStore();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = source.open(DATABASE, 1);
      let finished = false;
      const timeout = setTimeout(() => { finished = true; reject(new Error('儲存空間無法開啟')); }, 2500);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('attempts', { keyPath: 'id' });
        request.result.createObjectStore('leases', { keyPath: 'id' });
      };
      request.onsuccess = () => { clearTimeout(timeout); if (finished) request.result.close(); else { finished = true; resolve(request.result); } };
      request.onerror = request.onblocked = () => { clearTimeout(timeout); finished = true; reject(new Error('儲存空間無法開啟')); };
    });
    return new IndexedStudyStore(db);
  } catch { return memoryStore(); }
}
