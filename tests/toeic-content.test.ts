// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { toPublicForm, assertSourceAcceptance } from '../scripts/toeic-content.mjs';

const sample = {
  examID: 'prac01', contentVersion: 'core12_test', qa_source_records: [{ secret: 'internal' }],
  questions: [{ id: 'old_mock12_q032', mock_id: 'prac01', number: 32, part: 3,
    group_id: 'destination-group', source_group_id: 'old-group', question_text: 'What will the woman do?',
    choices: [{ key: 'A', text: 'Call.' }, { key: 'B', text: 'Leave.' }], answer: 'B',
    display_explanation_zhHant: 'B 正確：她將離開。', transcript: 'I need to leave.',
    audio_path: 'mock12/audio.mp3', image_path: null, documents: [{ document_id: 'd1', title: 'Notice', type: 'notice', text: 'Closed Monday.' }],
    graphic: { graphic_id: 'g1', type: 'table', title: 'Hours', rows: [{ Day: 'Monday', Open: 'No' }] },
    utterances: null, passage_text: null, skill: 'inference', image_prompt: 'PRIVATE PROMPT',
    source_record_sha256: 'a'.repeat(64), vocabulary_json: '[]',
  }],
};

describe('website content export', () => {
  it('rejects incomplete acceptance even when a source version matches', () => {
    expect(() => assertSourceAcceptance({ contentVersion: 'v1', assignmentSHA256: 'sha' }, { contentVersion: 'v1', assignmentSHA256: 'sha', status: 'FAIL', gates: {} }, { contentVersion: 'v1', assignmentSHA256: 'sha' })).toThrow('驗收');
  });
  it('preserves catalog ownership, groups and display order while excluding private source fields', () => {
    const out = toPublicForm(sample, { id: 'prac01', role: 'practice', displayNumber: 1 }, new Map([
      ['audio:mock12/audio.mp3', { url: 'media/audio/hash.mp3', sha256: 'b'.repeat(64) }],
    ]));
    expect(out.form.questions[0]).toMatchObject({ id: 'old_mock12_q032', number: 32, part: 3, groupId: 'destination-group' });
    expect(out.form.questions[0].audio).toBe('media/audio/hash.mp3');
    expect(out.form.questions[0].documents[0].text).toBe('Closed Monday.');
    expect(out.review.answers.old_mock12_q032).toMatchObject({ answer: 'B', explanation: 'B 正確：她將離開。', transcript: 'I need to leave.' });
    const serialized = JSON.stringify(out);
    for (const forbidden of ['PRIVATE PROMPT', 'qa_source_records', 'source_group_id', 'image_prompt']) expect(serialized).not.toContain(forbidden);
    expect(out.form.questions[0]).not.toHaveProperty('answer');
    expect(out.form.questions[0]).not.toHaveProperty('transcript');
  });
});
