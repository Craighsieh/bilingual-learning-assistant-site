import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { examCopy, type ExamSlug } from '../src/exam-copy';
import type { UiLocale } from '../src/i18n';

const locales: UiLocale[] = ['zh-TW', 'zh-CN', 'ja', 'ko'];
const exams: ExamSlug[] = ['toefl', 'ielts', 'toeic'];

function page(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

describe('exam-search landing pages', () => {
  it('keeps the exam-learning navigation available on every public page', () => {
    const publicPages = [
      'index.html',
      'faq.html',
      'privacy.html',
      ...exams.map((exam) => `${exam}-translation/index.html`),
    ];

    for (const publicPage of publicPages) {
      expect(page(publicPage), publicPage).toContain('data-i18n="nav.exams"');
      expect(page(publicPage), publicPage).toContain('class="exam-nav"');
    }
  });

  it('links the three exam guides from crawlable homepage content and metadata', () => {
    const homepage = page('index.html');
    expect(homepage).toContain('TOEFL');
    expect(homepage).toContain('IELTS');
    expect(homepage).toContain('TOEIC');
    for (const exam of exams) expect(homepage).toContain(`${exam}-translation/`);
  });

  it.each(exams)('publishes a unique, canonical %s guide with an honest boundary', (exam) => {
    const html = page(`${exam}-translation/index.html`);
    const sourceCopy = examCopy['zh-TW'][exam];
    expect(html).toContain(`<link rel="canonical" href="https://craighsieh.github.io/bilingual-learning-assistant-site/${exam}-translation/">`);
    expect(html).toContain(sourceCopy.title);
    expect(html).toContain(sourceCopy.intro);
    expect(html).toContain(sourceCopy.disclaimer);
    expect(html).toContain('學習輔助工具');
    expect(html).toContain('不提供官方試題、評分或成績保證');
    expect(html).toContain('Chrome Web Store');
  });

  it('publishes crawl hints for every public page', () => {
    const sitemap = page('sitemap.xml');
    for (const exam of exams) expect(sitemap).toContain(`/${exam}-translation/`);
    expect(page('robots.txt')).toContain('Sitemap: https://craighsieh.github.io/bilingual-learning-assistant-site/sitemap.xml');
  });

  it('keeps localized exam explanations complete without claiming official prep', () => {
    for (const locale of locales) {
      for (const exam of exams) {
        const copy = examCopy[locale][exam];
        expect(copy.title).toBeTruthy();
        expect(copy.intro.length).toBeGreaterThan(40);
        expect(copy.sections).toHaveLength(3);
        expect(copy.disclaimer).toBeTruthy();
      }
    }
  });
});
