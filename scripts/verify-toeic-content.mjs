import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = path.resolve('assets/toeic');
const readJSON = async (file) => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const catalog = await readJSON('catalog.json');
const integrity = await readJSON('integrity.json');
const ids = new Set(); let total = 0; let explanations = 0; let audioQuestions = 0;
if (catalog.contentVersion !== integrity.contentVersion) throw new Error('manifest version mismatch');
for (const [relative, expected] of Object.entries(integrity.files)) {
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(root + path.sep)) throw new Error('unsafe path');
  const bytes = await readFile(absolute);
  if (bytes.length !== expected.bytes || createHash('sha256').update(bytes).digest('hex') !== expected.sha256) throw new Error(`asset mismatch: ${relative}`);
}
for (const entry of catalog.forms) {
  const form = await readJSON(entry.formUrl); const review = await readJSON(entry.reviewUrl);
  if (form.id !== entry.id || review.formId !== entry.id || form.contentVersion !== catalog.contentVersion || review.contentVersion !== catalog.contentVersion) throw new Error('form version mismatch');
  if (form.questions.length !== 200) throw new Error('incomplete form');
  const groups = new Map();
  for (const q of form.questions) {
    if (ids.has(q.id)) throw new Error('duplicate question id'); ids.add(q.id); total += 1;
    const key = review.answers[q.id]; if (!key?.explanation || !q.choices.some((c) => c.key === key.answer)) throw new Error('missing explanation/key'); explanations += 1;
    if (q.part === 2 && q.choices.map((c) => c.key).join('') !== 'ABC') throw new Error('Part 2 choices');
    if (q.part <= 4) { if (!q.audio || !key.transcript) throw new Error('missing listening source'); audioQuestions += 1; }
    if (q.part === 6 && !q.passage || q.part === 7 && !q.documents.length) throw new Error('missing reading context');
    for (const relative of [q.audio, q.image].filter(Boolean)) { if (!integrity.files[relative]) throw new Error('unindexed media'); await stat(path.join(root, relative)); }
    const common = JSON.stringify([q.part,q.audio,q.image,q.passage,q.documents,q.graphic,key.transcript]);
    if (groups.has(q.groupId) && groups.get(q.groupId) !== common) throw new Error('broken group context'); groups.set(q.groupId, common);
    const serialized = JSON.stringify(q);
    for (const field of ['qa_source_records','image_prompt','record_json','reviewer']) if (Object.hasOwn(q, field)) throw new Error('private field exposed');
    if (serialized.includes('/Users/')) throw new Error('private workstation path exposed');
  }
}
if (total !== 1400 || explanations !== 1400 || audioQuestions !== 700 || catalog.forms.length !== 7) throw new Error('scope mismatch');
console.log(JSON.stringify({ status:'PASS', contentVersion:catalog.contentVersion, forms:catalog.forms.length, questions:total, explanations, listeningQuestions:audioQuestions, filesVerified:Object.keys(integrity.files).length },null,2));
