import { describe, expect, it } from 'vitest';
import { answerQuestion, canReview, confirmGroup, createAttempt, scoreAttempt, submitAttempt } from '../src/toeic/session';
import type { StudyForm, ReviewFile } from '../src/toeic/types';

export const form: StudyForm = { schemaVersion: 1, id: 'prac01', title: '練習 1', role: 'practice', contentVersion: 'v1', questions: [
  { id: 'a', number: 32, part: 3, groupId: 'g', text: 'Q1', choices: [{ key: 'A', text: 'Yes' }, { key: 'B', text: 'No' }], audio: null, image: null, passage: null, documents: [], graphic: null, sourceHash: 'hash' },
  { id: 'b', number: 33, part: 3, groupId: 'g', text: 'Q2', choices: [{ key: 'A', text: 'Yes' }, { key: 'B', text: 'No' }], audio: null, image: null, passage: null, documents: [], graphic: null, sourceHash: 'hash' },
] };
export const review: ReviewFile = { schemaVersion: 1, formId: 'prac01', contentVersion: 'v1', answers: {
  a: { answer: 'A', explanation: 'Reason A', transcript: 'Audio', skill: 'inference' },
  b: { answer: 'B', explanation: 'Reason B', transcript: 'Audio', skill: 'detail' },
} };

describe('TOEIC practice session', () => {
  it('reveals a practice group only after confirmation and locks its first answers', () => {
    let attempt = createAttempt(form, 3, 1000);
    attempt = answerQuestion(attempt, form, 'a', 'A');
    expect(canReview(attempt, form.questions[0]!)).toBe(false);
    expect(() => confirmGroup(attempt, form, 'g')).toThrow('完成');
    attempt = answerQuestion(attempt, form, 'b', 'A');
    attempt = confirmGroup(attempt, form, 'g');
    expect(canReview(attempt, form.questions[0]!)).toBe(true);
    expect(() => answerQuestion(attempt, form, 'a', 'B')).toThrow();
  });

  it('keeps mock answers hidden until submit and counts unanswered against the selected scope', () => {
    const mock = { ...form, id: 'mock01', role: 'mock' as const };
    const key = { ...review, formId: 'mock01' };
    let attempt = createAttempt(mock, null, 1000);
    attempt = answerQuestion(attempt, mock, 'a', 'A');
    expect(() => confirmGroup(attempt, mock, 'g')).toThrow();
    attempt = submitAttempt(attempt, 2400);
    expect(canReview(attempt, mock.questions[0]!)).toBe(true);
    expect(scoreAttempt(attempt, key)).toMatchObject({ correct: 1, total: 2, unanswered: 1, answered: 1 });
    expect(() => answerQuestion(attempt, mock, 'b', 'B')).toThrow();
    expect(submitAttempt(attempt, 9000)).toEqual(attempt);
    expect(() => scoreAttempt(attempt, { ...key, contentVersion: 'v2' })).toThrow('版本');
  });
});
