import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, copyFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PUBLIC_FORMS = ['prac01', 'prac02', 'mock01', 'mock02', 'mock03', 'mock04', 'mock05'];
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const text = (value) => typeof value === 'string' ? value : '';
const nullableText = (value) => text(value) || null;

export function assertSourceAcceptance(catalog, accepted, selected) {
  if (accepted.contentVersion !== catalog.contentVersion || selected.contentVersion !== catalog.contentVersion || accepted.assignmentSHA256 !== catalog.assignmentSHA256 || selected.assignmentSHA256 !== catalog.assignmentSHA256) throw new Error('來源驗收版本不一致');
  if (accepted.status !== 'PASS' || ['structure','difficulty','semantic','wholeForms','sourceReuse'].some((gate) => accepted.gates?.[gate] !== 'PASS')) throw new Error('來源驗收尚未完成');
}

/** Deliberate public whitelist: source records contain authoring and QA material. */
export function toPublicForm(source, entry, media) {
  if (source.examID !== entry.id || !Array.isArray(source.questions)) throw new Error('套卷來源不一致');
  const answers = {};
  const questions = source.questions.map((q) => {
    if (q.mock_id !== entry.id || !q.id || !Number.isInteger(q.number) || !Number.isInteger(q.part) || q.part < 1 || q.part > 7) throw new Error('題目歸屬或題號無效');
    const choices = q.choices.map(({ key, text: body }) => ({ key: text(key), text: text(body) }));
    if (!choices.some((choice) => choice.key === q.answer) || !text(q.display_explanation_zhHant).trim()) throw new Error(`缺少答案／解析：${q.id}`);
    const resolveMedia = (kind, sourcePath) => {
      if (!sourcePath) return null;
      const asset = media.get(`${kind}:${sourcePath}`);
      if (!asset) throw new Error(`缺少已驗收媒體：${q.id}`);
      return asset.url;
    };
    const utterances = [...(q.utterances ?? [])].sort((a, b) => a.order - b.order);
    answers[q.id] = {
      answer: q.answer, explanation: q.display_explanation_zhHant,
      transcript: text(q.transcript) || utterances.map((u) => `${text(u.role) || text(u.speaker_id)}: ${text(u.text)}`).join('\n'),
      skill: text(q.skill),
    };
    return {
      id: q.id, number: q.number, part: q.part, groupId: q.group_id || q.id,
      text: text(q.question_text), choices,
      audio: resolveMedia('audio', q.audio_path), image: resolveMedia('images', q.image_path),
      passage: nullableText(q.passage_text),
      documents: (q.documents ?? []).map((d) => ({ title: text(d.title), type: text(d.type), text: text(d.text) })),
      graphic: q.graphic ? {
        title: text(q.graphic.title), rows: q.graphic.rows.map((row) => Object.fromEntries(Object.entries(row).filter(([, value]) => typeof value === 'string' || typeof value === 'number'))),
      } : null,
      sourceHash: text(q.source_record_sha256),
    };
  }).sort((a, b) => a.number - b.number);
  return {
    form: { schemaVersion: 1, id: entry.id, title: `${entry.role === 'practice' ? '練習' : '模考'} ${entry.displayNumber}`, role: entry.role, contentVersion: source.contentVersion, questions },
    review: { schemaVersion: 1, formId: entry.id, contentVersion: source.contentVersion, answers },
  };
}

/** Only copies bytes already tied to the current accepted Core12 manifest. */
export async function exportContent({ sourceRoot, mediaRoot, output }) {
  const readJSON = async (name) => JSON.parse(await readFile(path.join(sourceRoot, name), 'utf8'));
  const catalog = await readJSON('backend-export/catalog.json');
  const accepted = await readJSON('backend-export/content-acceptance.json');
  const selected = await readJSON('SELECTED_MANIFEST.json');
  assertSourceAcceptance(catalog, accepted, selected);
  const assets = new Map();
  const integrity = {};
  await mkdir(path.join(output, 'forms'), { recursive: true });
  await mkdir(path.join(output, 'review'), { recursive: true });
  for (const assignment of selected.assignments.filter((a) => PUBLIC_FORMS.includes(a.destinationExamID))) {
    for (const asset of assignment.media) {
      const key = `${asset.kind}:${asset.path}`;
      if (assets.has(key)) continue;
      const base = await realpath(path.join(mediaRoot, asset.kind));
      const original = await realpath(path.resolve(base, asset.path));
      if (!original.startsWith(`${base}${path.sep}`)) throw new Error('媒體路徑超出來源');
      const bytes = await readFile(original);
      if (hash(bytes) !== asset.sha256 || bytes.length !== asset.bytes) throw new Error(`媒體來源雜湊不符：${asset.path}`);
      const extension = asset.kind === 'audio' ? '.mp3' : '.png';
      const url = `media/${asset.kind}/${asset.sha256}${extension}`;
      await mkdir(path.dirname(path.join(output, url)), { recursive: true });
      await copyFile(original, path.join(output, url));
      assets.set(key, { url, sha256: asset.sha256 });
      integrity[url] = { sha256: asset.sha256, bytes: bytes.length };
    }
  }
  const entries = [];
  const ids = new Set();
  const writeJSON = async (name, data) => {
    const bytes = `${JSON.stringify(data)}\n`;
    await writeFile(path.join(output, name), bytes);
    integrity[name] = { sha256: hash(bytes), bytes: Buffer.byteLength(bytes) };
  };
  for (const id of PUBLIC_FORMS) {
    const entry = catalog.entries.find((e) => e.id === id);
    if (!entry || entry.questionCount !== 200) throw new Error(`缺少完整套卷：${id}`);
    const source = await readJSON(`backend-export/forms/${id}.json`);
    const { form, review } = toPublicForm(source, entry, assets);
    const parts = [1, 2, 3, 4, 5, 6, 7].map((part) => ({ part, total: form.questions.filter((q) => q.part === part).length }));
    if (parts.map((p) => p.total).join(',') !== '6,25,39,30,30,16,54' || form.questions.length !== 200) throw new Error(`Part 配額錯誤：${id}`);
    if (entry.questionIDs.length !== 200 || form.questions.some((q) => !entry.questionIDs.includes(q.id))) throw new Error(`題目清單與 catalog 不一致：${id}`);
    form.questions.forEach((q, index) => {
      if (ids.has(q.id) || q.number !== index + 1 || (q.part === 2 ? q.choices.length !== 3 : q.choices.length !== 4)) throw new Error(`題號／選項／ID 錯誤：${q.id}`);
      if (q.part <= 4 && (!q.audio || !review.answers[q.id].transcript)) throw new Error(`聽力內容不完整：${q.id}`);
      ids.add(q.id);
    });
    await writeJSON(`forms/${id}.json`, form);
    await writeJSON(`review/${id}.json`, review);
    entries.push({ id, title: form.title, role: form.role, description: id === 'prac01' ? '入門完整練習，逐題組確認與解析。' : id === 'prac02' ? '接近正式題型的完整練習。' : '完整模考題，自由作答，交卷後看解析。', total: 200, parts,
      formUrl: `forms/${id}.json`, reviewUrl: `review/${id}.json` });
  }
  const result = { schemaVersion: 1, contentVersion: catalog.contentVersion, totalQuestions: ids.size, forms: entries };
  await writeJSON('catalog.json', result);
  await writeFile(path.join(output, 'integrity.json'), `${JSON.stringify({ schemaVersion: 1, contentVersion: catalog.contentVersion, files: integrity }, null, 2)}\n`);
  return { contentVersion: catalog.contentVersion, forms: entries.length, questions: ids.size, media: assets.size, mediaBytes: Object.entries(integrity).filter(([key]) => key.startsWith('media/')).reduce((sum, [, value]) => sum + value.bytes, 0), publicBytes: (await stat(path.join(output, 'catalog.json'))).size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [sourceRoot, mediaRoot, output] = process.argv.slice(2);
  if (!sourceRoot || !mediaRoot || !output) throw new Error('Usage: node scripts/toeic-content.mjs <Core12-root> <Exam-media-root> <output>');
  console.log(JSON.stringify(await exportContent({ sourceRoot, mediaRoot, output }), null, 2));
}
