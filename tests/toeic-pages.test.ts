// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { appDownload } from '../scripts/generate-toeic-pages.mjs';

describe('App launch configuration', () => {
  it('keeps preparing state honest and enables only verified official store links', () => {
    expect(appDownload({ status: 'preparing', verified: false, downloadUrl: null })).toBeNull();
    expect(appDownload({ status: 'available', verified: true, downloadUrl: 'https://apps.apple.com/tw/app/id123456789' })).toBe('https://apps.apple.com/tw/app/id123456789');
    for (const downloadUrl of ['https://apps.apple.com.evil.test/app/id123', 'javascript:alert(1)', 'https://user:password@apps.apple.com/app/id123', 'https://example.com']) expect(() => appDownload({ status: 'available', verified: true, downloadUrl })).toThrow();
    expect(() => appDownload({ status: 'available', verified: false, downloadUrl: 'https://testflight.apple.com/j/Abcd1234' })).toThrow();
  });
});
