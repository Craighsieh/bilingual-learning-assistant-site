import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { acquireEditor } from '../src/toeic/editor';
import { openStudyStore } from '../src/toeic/store';

describe('exclusive browser editing lifecycle', () => {
  it('releases the browser lock even if database cleanup fails', async () => {
    let held=false;
    const locks={request:async (_name:string,_options:unknown,callback:(lock:unknown)=>unknown)=>{ if(held)return callback(null);held=true;try{return await callback({name:'test'});}finally{held=false;} }} as unknown as LockManager;
    const store=await openStudyStore(new IDBFactory());
    const first=await acquireEditor('cleanup',store,locks);
    vi.spyOn(store,'release').mockRejectedValueOnce(new Error('cleanup failed'));
    await expect(first.release()).rejects.toThrow('cleanup failed');
    const next=await acquireEditor('cleanup',store,locks);
    expect(next.acquired).toBe(true);
    await next.release(); store.close();
  });
  it('prevents a second tab and permits immediate reload ownership without waiting for the old database lease', async () => {
    let held = false;
    const locks = { request: async (_name: string, _options: unknown, callback: (lock: unknown) => unknown) => {
      if (held) return callback(null);
      held = true; try { return await callback({ name: 'test' }); } finally { held = false; }
    } } as unknown as LockManager;
    const store = await openStudyStore(new IDBFactory());
    await store.acquire('attempt-1', 'old-unloaded-document');
    const first = await acquireEditor('attempt-1', store, locks);
    expect(first.acquired).toBe(true);
    const second = await acquireEditor('attempt-1', store, locks);
    expect(second.acquired).toBe(false);
    await first.release();
    const reload = await acquireEditor('attempt-1', store, locks);
    expect(reload.acquired).toBe(true);
    expect(reload.owner).not.toBe(first.owner);
    await reload.release(); store.close();
  });
});
