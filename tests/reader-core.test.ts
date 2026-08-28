import { describe, expect, it } from 'vitest';
import {
  bilingualSrt,
  bilingualText,
  mergeTranslations,
  parseReaderEvent,
  publicHttpsUrl,
} from '../src/reader-core';
import { versionAtLeast } from '../src/reader';
import type { ReaderDocument } from '../src/reader-protocol.generated';

const video: ReaderDocument = {
  sourceKind: 'youtube',
  url: 'https://www.youtube.com/watch?v=test',
  title: 'Test video',
  sourceLanguage: 'en',
  segments: [{ id: 'cue-00001', text: 'Hello world.', startMs: 0, endMs: 1_250 }],
};

describe('public reader core', () => {
  it('rejects non-public and credential-bearing URLs', () => {
    expect(() => publicHttpsUrl('http://example.com')).toThrow();
    expect(() => publicHttpsUrl('https://user:secret@example.com')).toThrow();
    expect(() => publicHttpsUrl('https://127.0.0.1')).toThrow();
    expect(() => publicHttpsUrl('https://[::1]')).toThrow();
    expect(() => publicHttpsUrl('https://[fd00::1]')).toThrow();
    expect(publicHttpsUrl('https://example.com/article').hostname).toBe('example.com');
  });

  it('requires the bridge protocol version on extension events', () => {
    expect(() => parseReaderEvent({ type: 'complete', protocolVersion: 2 })).toThrow();
    expect(
      parseReaderEvent({
        type: 'complete',
        protocolVersion: 1,
        requestId: 'request-0001',
        jobId: 'job-00001',
      }).type,
    ).toBe('complete');
    expect(() =>
      parseReaderEvent({
        type: 'batch-results',
        protocolVersion: 1,
        requestId: 'request-0001',
        jobId: 'job-00001',
        translations: [{ id: 'unknown', text: '' }],
        completed: 99,
        total: 1,
      }),
    ).toThrow();
  });

  it('merges only known non-empty translations and exports bilingual text/SRT', () => {
    const translations = mergeTranslations(video, new Map(), [
      { id: 'cue-00001', text: '你好，世界。' },
      { id: 'unknown', text: 'ignored' },
    ]);
    expect(bilingualText(video, translations)).toContain('Hello world.\n你好，世界。');
    expect(bilingualSrt(video, translations)).toBe(
      '1\n00:00:00,000 --> 00:00:01,250\nHello world.\n你好，世界。',
    );
  });

  it('keeps the production entry disabled for older public extension versions', () => {
    expect(versionAtLeast('0.5.7')).toBe(false);
    expect(versionAtLeast('0.5.8')).toBe(true);
    expect(versionAtLeast('0.6.0')).toBe(true);
  });
});
