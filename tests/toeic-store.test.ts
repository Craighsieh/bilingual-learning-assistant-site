import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { openStudyStore } from '../src/toeic/store';
import type { Attempt } from '../src/toeic/types';

function attempt(): Attempt {
  return { id: 'attempt-1', formId: 'mock01', contentVersion: 'v1', role: 'mock', scopePart: 5,
    questionIds: ['q'], partById: { q: 5 }, answers: {}, flags: [], confirmedGroups: [], currentIndex: 0,
    status: 'draft', createdAt: 100, updatedAt: 100, submittedAt: null, elapsedMs: 0, revision: 0 };
}

describe('local attempt repository', () => {
  it('persists a restart, isolates content versions and atomically rejects a second editor and stale lease', async () => {
    const factory = new IDBFactory();
    const first = await openStudyStore(factory);
    const second = await openStudyStore(factory);
    expect(await first.acquire('attempt-1', 'tab-a', 1000)).toBe(true);
    expect(await second.acquire('attempt-1', 'tab-b', 1001)).toBe(false);
    const saved = await first.save({ ...attempt(), answers: { q: 'B' } }, 'tab-a', 1002);
    expect((await second.get('attempt-1'))?.answers).toEqual({ q: 'B' });
    expect(await second.list('v2')).toEqual([]);
    expect(await second.acquire('attempt-1', 'tab-b', 40000)).toBe(true);
    await expect(first.save(saved, 'tab-a', 40001)).rejects.toThrow('分頁');
    const done = await second.save({ ...saved, status: 'submitted', submittedAt: 40002 }, 'tab-b', 40002);
    await expect(second.save({ ...done, status: 'draft' }, 'tab-b', 40003)).rejects.toThrow('交卷');
    expect((await first.list('v1'))[0]?.status).toBe('submitted');
    first.close(); second.close();
  });

  it('rejects stale revisions even when an old owner reacquires after another tab saved', async () => {
    const store = await openStudyStore(new IDBFactory());
    await store.acquire('attempt-1', 'tab-a', 100);
    const initial = await store.save(attempt(), 'tab-a', 101);
    await store.acquire('attempt-1', 'tab-b', 40000);
    await store.save({ ...initial, answers: { q: 'C' } }, 'tab-b', 40001);
    await store.acquire('attempt-1', 'tab-a', 80000);
    await expect(store.save(initial, 'tab-a', 80001)).rejects.toThrow('更新');
    store.close();
  });

  it('provides visible memory capability when persistence is unavailable', async () => {
    const store = await openStudyStore(null);
    expect(store.persistent).toBe(false);
    await store.acquire('attempt-1', 'tab-a', 100);
    await store.save(attempt(), 'tab-a', 101);
    expect(await store.get('attempt-1')).not.toBeNull();
  });
});
