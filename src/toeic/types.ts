export type FormRole = 'practice' | 'mock';
export interface Choice { key: string; text: string }
export interface StudyQuestion {
  id: string; number: number; part: number; groupId: string; text: string; choices: Choice[];
  audio: string | null; image: string | null; passage: string | null;
  documents: Array<{ title: string; type: string; text: string }>;
  graphic: { title: string; rows: Array<Record<string, string | number>> } | null;
  sourceHash: string;
}
export interface StudyForm { schemaVersion: 1; id: string; title: string; role: FormRole; contentVersion: string; questions: StudyQuestion[] }
export interface AnswerReview { answer: string; explanation: string; transcript: string; skill: string }
export interface ReviewFile { schemaVersion: 1; formId: string; contentVersion: string; answers: Record<string, AnswerReview> }
export interface CatalogEntry {
  id: string; title: string; role: FormRole; description: string; total: number;
  parts: Array<{ part: number; total: number }>; formUrl: string; reviewUrl: string;
}
export interface StudyCatalog { schemaVersion: 1; contentVersion: string; totalQuestions: number; forms: CatalogEntry[] }
export interface Attempt {
  id: string; formId: string; contentVersion: string; role: FormRole; scopePart: number | null;
  questionIds: string[]; partById: Record<string, number>; answers: Record<string, string>;
  flags: string[]; confirmedGroups: string[]; currentIndex: number;
  status: 'draft' | 'submitted'; createdAt: number; updatedAt: number; submittedAt: number | null;
  elapsedMs: number; revision: number;
}
export interface PartScore { part: number; total: number; correct: number; unanswered: number }
export interface AttemptScore { total: number; answered: number; correct: number; unanswered: number; parts: PartScore[] }
