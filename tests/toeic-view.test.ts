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
    expect(before.textContent).not.toContain('<img src=x onerror=alert(1)>');
    expect(before.textContent).not.toContain('A option');
    expect(before.textContent).not.toContain('B option');
    expect(before.textContent).not.toContain('C option');
    expect([...before.querySelectorAll('label')].map((label) => label.textContent)).toEqual(['A', 'B', 'C']);
    expect(before.textContent).not.toContain('SECRET');
    const after = renderQuestionGroup(form.questions, { ...draft, status: 'submitted' }, review, false, callbacks);
    expect(after.querySelector('img')).toBeNull();
    expect(after.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(after.textContent).toContain('A option');
    expect(after.textContent).toContain('SECRET REASON');
    expect(after.querySelectorAll('input:disabled')).toHaveLength(3);

    const practiceForm = { ...form, role: 'practice' as const };
    const practice = createAttempt(practiceForm, 2);
    const unconfirmed = renderQuestionGroup(form.questions, practice, review, false, callbacks);
    expect(unconfirmed.textContent).not.toContain('A option');
    const confirmed = renderQuestionGroup(form.questions, { ...practice, confirmedGroups: ['g'] }, review, false, callbacks);
    expect(confirmed.textContent).toContain('A option');
    expect(confirmed.textContent).toContain('SECRET AUDIO');

    const part3Form = { ...form, questions: [{ ...form.questions[0]!, part: 3 }] };
    const part3 = renderQuestionGroup(part3Form.questions, createAttempt(part3Form, 3), review, false, callbacks);
    expect(part3.textContent).toContain('A option');
    expect(part3.querySelector('img')).toBeNull();
  });
});
