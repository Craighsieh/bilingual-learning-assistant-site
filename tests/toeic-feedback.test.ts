import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateToeicPages } from '../scripts/generate-toeic-pages.mjs';
import { buildFeedbackIssueUrl, feedbackHref, mountFeedbackForm } from '../src/toeic/feedback';
import { renderQuestionGroup } from '../src/toeic/view';
import { createAttempt } from '../src/toeic/session';
import type { StudyForm } from '../src/toeic/types';

afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); });

describe('TOEIC public feedback handoff', () => {
  it('encodes only the chosen question context and report text into a new GitHub issue draft', () => {
    const url = new URL(buildFeedbackIssueUrl({
      formId: 'mock01', questionNumber: 101, category: 'wording',
      description: '句子不清楚：A & B? <img src=x onerror=alert(1)> #題目',
      contentVersion: 'core12_test',
    }));
    expect(url.origin + url.pathname).toBe('https://github.com/Craighsieh/bilingual-learning-assistant-site/issues/new');
    expect([...url.searchParams.keys()]).toEqual(['title', 'body']);
    expect(url.searchParams.get('title')).toBe('[TOEIC 回饋] 模考 1 · 第 101 題 · 題目表達或品質');
    expect(url.searchParams.get('body')).toContain('句子不清楚：A & B? <img src=x onerror=alert(1)> #題目');
    expect(url.searchParams.get('body')).toContain('內容版本：core12_test');
    expect(url.hash).toBe('');
  });

  it('offers feedback for each displayed question without sharing a source ID, attempt or answer', () => {
    const form: StudyForm = { schemaVersion: 1, id: 'mock04', title: '模考 4', role: 'mock', contentVersion: 'v1', questions: [101, 102].map((number) => ({
      id: `old-mock12-source-${number}`, number, part: 3, groupId: 'shared-group', text: 'Question',
      choices: [{ key: 'A', text: 'Choice' }], audio: null, image: null, passage: null, documents: [], graphic: null, sourceHash: 'hash',
    })) };
    const rendered = renderQuestionGroup(form.questions, createAttempt(form, 3), null, false, {
      answer: () => {}, flag: () => {}, confirm: () => {},
      feedbackHref: (question) => feedbackHref(new URL('https://example.test/site/toeic/'), form.id, question.number),
    });
    const links = [...rendered.querySelectorAll<HTMLAnchorElement>('a')];
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual(['回報第 101 題', '回報第 102 題']);
    expect(links.map((link) => link.href)).toEqual([
      'https://example.test/site/toeic/feedback/?form=mock04&question=101',
      'https://example.test/site/toeic/feedback/?form=mock04&question=102',
    ]);
    expect(links.every((link) => link.rel.includes('noopener') && link.rel.includes('noreferrer'))).toBe(true);
  });

  it('prefills the generated page but reads no progress and navigates only after an explicit valid submission', async () => {
    await generateToeicPages(process.cwd());
    const html = await readFile('toeic/feedback/index.html', 'utf8');
    document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
    const open = vi.fn(); const fetch = vi.fn(); const navigate = vi.fn();
    vi.stubGlobal('indexedDB', { open }); vi.stubGlobal('fetch', fetch);
    const form = document.getElementById('feedback-form') as HTMLFormElement;
    mountFeedbackForm(form, new URLSearchParams('form=mock04&question=101&attempt=PRIVATE&answer=SECRET'), navigate);
    const formChoice = document.getElementById('feedback-form-id') as HTMLSelectElement;
    const question = document.getElementById('feedback-question') as HTMLInputElement;
    expect(formChoice.value).toBe('mock04'); expect(question.value).toBe('101');
    expect(formChoice.options).toHaveLength(8);
    expect(document.body.textContent).toContain('回報將公開');
    expect(document.body.textContent).toContain('GitHub 帳號');
    expect(navigate).not.toHaveBeenCalled(); expect(open).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
    (document.getElementById('feedback-category') as HTMLSelectElement).value = 'explanation';
    (document.getElementById('feedback-description') as HTMLTextAreaElement).value = '這個解釋 A & B <svg onload=alert(1)> 不清楚';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(navigate).toHaveBeenCalledOnce();
    const url = new URL(navigate.mock.calls[0]![0]);
    expect(url.searchParams.get('body')).toContain('展示題號：第 101 題');
    expect(url.searchParams.get('body')).toContain('這個解釋 A & B <svg onload=alert(1)> 不清楚');
    expect(url.href).not.toContain('PRIVATE'); expect(url.href).not.toContain('SECRET');
    expect(document.querySelector('svg')).toBeNull();
    expect(open).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });

  it('ignores malformed shared context and keeps incomplete or invalid reports on the page', async () => {
    document.body.innerHTML = new DOMParser().parseFromString(await readFile('toeic/feedback/index.html', 'utf8'), 'text/html').body.innerHTML;
    const navigate = vi.fn();
    const form = document.getElementById('feedback-form') as HTMLFormElement;
    mountFeedbackForm(form, new URLSearchParams('form=old-mock12&question=201&description=%3Cimg%3E'), navigate);
    expect((document.getElementById('feedback-form-id') as HTMLSelectElement).value).toBe('');
    expect((document.getElementById('feedback-question') as HTMLInputElement).value).toBe('');
    expect((document.getElementById('feedback-description') as HTMLTextAreaElement).value).toBe('');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(navigate).not.toHaveBeenCalled();
    expect(document.getElementById('feedback-error')?.hidden).toBe(false);
    expect(document.getElementById('feedback-error')?.textContent).toContain('尚未送出');
    const draft = { formId: 'prac01', questionNumber: null, category: 'other', description: '整份套卷建議', contentVersion: 'v1' };
    expect(new URL(buildFeedbackIssueUrl(draft)).searchParams.get('body')).toContain('整份套卷／未指定題號');
    expect(() => buildFeedbackIssueUrl({ ...draft, questionNumber: 201 })).toThrow('1～200');
    expect(() => buildFeedbackIssueUrl({ ...draft, category: 'constructor' })).toThrow('問題類別');
    expect(() => buildFeedbackIssueUrl({ ...draft, description: '   ' })).toThrow('問題說明');
  });
});
