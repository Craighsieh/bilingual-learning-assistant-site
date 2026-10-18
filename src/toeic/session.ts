import type { Attempt, AttemptScore, ReviewFile, StudyForm, StudyQuestion } from './types.js';

export function createAttempt(form: StudyForm, part: number | null, now = Date.now()): Attempt {
  const questions = form.questions.filter((q) => part === null || q.part === part);
  if (questions.length === 0) throw new Error('這個 Part 沒有題目。');
  return {
    id: crypto.randomUUID(), formId: form.id, contentVersion: form.contentVersion, role: form.role, scopePart: part,
    questionIds: questions.map((q) => q.id), partById: Object.fromEntries(questions.map((q) => [q.id, q.part])),
    answers: {}, flags: [], confirmedGroups: [], currentIndex: 0, status: 'draft',
    createdAt: now, updatedAt: now, submittedAt: null, elapsedMs: 0, revision: 0,
  };
}

export function scopeQuestions(attempt: Attempt, form: StudyForm): StudyQuestion[] {
  if (attempt.formId !== form.id || attempt.contentVersion !== form.contentVersion) throw new Error('內容版本已更新，請開始新版練習。');
  const ids = new Set(attempt.questionIds);
  const questions = form.questions.filter((q) => ids.has(q.id));
  if (questions.length !== ids.size) throw new Error('這份進度與題目不符。');
  return questions;
}

function requireDraft(attempt: Attempt): void {
  if (attempt.status !== 'draft') throw new Error('已交卷，請另開一次練習。');
}

export function answerQuestion(attempt: Attempt, form: StudyForm, id: string, choice: string): Attempt {
  requireDraft(attempt);
  const question = scopeQuestions(attempt, form).find((q) => q.id === id);
  if (!question || !question.choices.some((c) => c.key === choice)) throw new Error('選項無效。');
  if (attempt.confirmedGroups.includes(question.groupId)) throw new Error('這個題組已確認，原作答已固定。');
  return { ...attempt, answers: { ...attempt.answers, [id]: choice } };
}

export function confirmGroup(attempt: Attempt, form: StudyForm, groupId: string): Attempt {
  requireDraft(attempt);
  if (attempt.role !== 'practice') throw new Error('模考卷交卷後才顯示解析。');
  const group = scopeQuestions(attempt, form).filter((q) => q.groupId === groupId);
  if (!group.length || group.some((q) => !attempt.answers[q.id])) throw new Error('請先完成這個題組的全部題目。');
  return { ...attempt, confirmedGroups: [...new Set([...attempt.confirmedGroups, groupId])] };
}

export function toggleFlag(attempt: Attempt, id: string): Attempt {
  requireDraft(attempt);
  if (!attempt.questionIds.includes(id)) throw new Error('題號無效。');
  return { ...attempt, flags: attempt.flags.includes(id) ? attempt.flags.filter((value) => value !== id) : [...attempt.flags, id] };
}

export function submitAttempt(attempt: Attempt, now = Date.now()): Attempt {
  if (attempt.status === 'submitted') return attempt;
  return { ...attempt, status: 'submitted', submittedAt: now, updatedAt: now };
}

export function canReview(attempt: Attempt, question: StudyQuestion): boolean {
  return attempt.status === 'submitted' || (attempt.role === 'practice' && attempt.confirmedGroups.includes(question.groupId));
}

export function scoreAttempt(attempt: Attempt, review: ReviewFile): AttemptScore {
  if (attempt.status !== 'submitted') throw new Error('交卷後才計算結果。');
  if (review.formId !== attempt.formId || review.contentVersion !== attempt.contentVersion) throw new Error('解析版本不符。');
  const parts = [...new Set(Object.values(attempt.partById))].sort().map((part) => ({ part, total: 0, correct: 0, unanswered: 0 }));
  for (const id of attempt.questionIds) {
    const key = review.answers[id];
    if (!key) throw new Error('解析不完整，暫時無法計分。');
    const part = parts.find((item) => item.part === attempt.partById[id])!;
    part.total += 1;
    if (!attempt.answers[id]) part.unanswered += 1;
    else if (attempt.answers[id] === key.answer) part.correct += 1;
  }
  const unanswered = parts.reduce((sum, p) => sum + p.unanswered, 0);
  return { total: attempt.questionIds.length, answered: attempt.questionIds.length - unanswered, correct: parts.reduce((sum, p) => sum + p.correct, 0), unanswered, parts };
}

export function skillLabel(skill: string): string {
  if (/cross|integration|graphic/.test(skill)) return '跨文／圖表資訊整合';
  if (/infer|intent|purpose/.test(skill)) return '推論與說話目的';
  if (/photo|spatial|person_action/.test(skill)) return '圖片與動作辨識';
  if (/collocation|vocab|lexical/.test(skill)) return '字義與搭配詞';
  if (/cohesion|insert|reference/.test(skill)) return '篇章銜接與指涉';
  if (/grammar|verb|word_form|preposition|conjunction|modifier|relative|conditional|comparison|pronoun|determiner|nonfinite/.test(skill)) return '句型與文法運用';
  if (/next_step|action/.test(skill)) return '後續行動';
  if (/listening/.test(skill)) return '聽力理解與回應';
  return '細節定位與閱讀理解';
}
