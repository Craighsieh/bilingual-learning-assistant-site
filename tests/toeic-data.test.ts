import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudyData } from '../src/toeic/data';

afterEach(() => vi.unstubAllGlobals());
describe('static content loading', () => {
  it('invokes native browser fetch with its Window receiver and preserves the Pages subpath', async () => {
    const seen: string[] = [];
    vi.stubGlobal('fetch', function(this: unknown, input: URL) {
      if (this !== globalThis) throw new TypeError('Illegal invocation');
      seen.push(String(input));
      return Promise.resolve({ ok: true, json: async () => ({ schemaVersion: 1, contentVersion: 'v1', totalQuestions: 1400, forms: ['prac01','prac02','mock01','mock02','mock03','mock04','mock05'].map((id) => ({ id, title: id, role: id.startsWith('prac') ? 'practice' : 'mock', description: 'demo', total: 200, parts: Array.from({length:7}, (_,i) => ({part:i+1,total:1})) })) }) });
    });
    const data = new StudyData(new URL('https://example.test/project/assets/toeic/'));
    expect((await data.catalog()).contentVersion).toBe('v1');
    expect(seen).toEqual(['https://example.test/project/assets/toeic/catalog.json']);
    expect(() => data.asset('../private.json')).toThrow();
  });
});
