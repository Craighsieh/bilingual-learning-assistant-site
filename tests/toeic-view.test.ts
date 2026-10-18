import { describe, expect, it } from 'vitest';
import { renderQuestionGroup } from '../src/toeic/view';
import { createAttempt } from '../src/toeic/session';
import type { StudyForm, ReviewFile } from '../src/toeic/types';

describe('browser question presentation', () => {
  it('renders Part 2 ABC safely and never exposes a mock answer or transcript before submission', () => {
    const form: StudyForm = { schemaVersion: 1, id: 'mock01', title: '模考 1', role: 'mock', contentVersion: 'v1', questions: [
      { id: 'q', number: 7, part: 2, groupId: 'g', text: '<img src=x onerror=alert(1)>', choices: ['A', 'B', 'C'].map((key) => ({ key, text: key + ' option' })), image: null, audio: null, passage: null, documents: [], graphic: null, sourceHash: 'hash' },
    ] };
    const review: ReviewFile = { schemaVersion: 1, formId: 'mock01', contentVersion: 'v1', answers: { q: { answer: 'C', explanation: 'SECRET REASON', transcript: 'SECRET AUDIO', skill: 'detail' } } };
    const draft = createAttempt(form, 2);
    const callbacks = { answer: () => {}, flag: () => {}, confirm: () => {} };
    const before = renderQuestionGroup(form.questions, draft, review, false, callbacks);
    expect(before.querySelectorAll('input[type=radio]')).toHaveLength(3);
    expect(before.querySelector('img')).toBeNull();
    expect(before.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(before.textContent).not.toContain('SECRET');
    const after = renderQuestionGroup(form.questions, { ...draft, status: 'submitted' }, review, false, callbacks);
    expect(after.textContent).toContain('SECRET REASON');
    expect(after.querySelectorAll('input:disabled')).toHaveLength(3);
  });
});
