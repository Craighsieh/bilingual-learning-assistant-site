import { sendFeedback } from './feedback-delivery.js';
import { isPublicFormId } from './public-forms.js';

const categories = {
  answer: '答案有疑問', explanation: '解題說明不清楚', audio: '聽力或逐字稿',
  image: '圖片或圖表', wording: '題目表達或品質', other: '其他問題',
} as const;

export interface FeedbackDraft {
  formId: string;
  questionNumber: number | null;
  category: string;
  description: string;
  contentVersion: string;
}

export interface FeedbackPayload {
  _subject: string;
  _url: string;
  _template: string;
  _honey: string;
  form: string;
  question: string;
  category: string;
  content_version: string;
  message: string;
  reference: string;
}

function formTitle(formId: string): string {
  if (!isPublicFormId(formId)) throw new Error('請選擇要回饋的套卷。');
  return `${formId.startsWith('prac') ? '練習' : '模考'} ${Number(formId.slice(-2))}`;
}

/** Explicit whitelist: never derive the URL or report from study storage or location.search. */
export function buildFeedbackPayload(draft: FeedbackDraft, reference: string): FeedbackPayload {
  const title = formTitle(draft.formId);
  if (draft.questionNumber !== null && (!Number.isInteger(draft.questionNumber) || draft.questionNumber < 1 || draft.questionNumber > 200)) throw new Error('題號請填 1～200，或留白回報整份套卷。');
  if (!Object.hasOwn(categories, draft.category)) throw new Error('請選擇問題類別。');
  const message = draft.description.trim();
  if (!message) throw new Error('請填寫問題說明。');
  // Match the browser maxlength's UTF-16 units, including pasted input.
  if (message.length > 1000) throw new Error('問題說明請控制在 1,000 字內。');
  if (!/^DC-[A-Za-z0-9-]{1,80}$/.test(reference)) throw new Error('回饋編號無效，請重新整理。');
  return {
    _subject: `[DualCue TOEIC 回饋] ${title} · ${reference}`,
    _url: 'https://craighsieh.github.io/bilingual-learning-assistant-site/toeic/feedback/',
    _template: 'table', _honey: '',
    form: `${title}（${draft.formId}）`,
    question: draft.questionNumber === null ? '整份套卷／未指定題號' : `第 ${draft.questionNumber} 題`,
    category: categories[draft.category as keyof typeof categories],
    content_version: draft.contentVersion, message, reference,
  };
}

export function feedbackHref(pageRoot: URL, formId: string, questionNumber: number): string {
  formTitle(formId);
  if (!Number.isInteger(questionNumber) || questionNumber < 1 || questionNumber > 200) throw new Error('題號無效。');
  const url = new URL('feedback/', pageRoot);
  url.searchParams.set('form', formId); url.searchParams.set('question', String(questionNumber));
  return url.href;
}

/** Deliberately independent of the study database: only an explicit valid submit sends a report. */
export function mountFeedbackForm(form: HTMLFormElement, params: URLSearchParams, deliver: (payload: FeedbackPayload) => Promise<void> = sendFeedback): void {
  const formChoice = form.querySelector<HTMLSelectElement>('#feedback-form-id');
  const question = form.querySelector<HTMLInputElement>('#feedback-question');
  const category = form.querySelector<HTMLSelectElement>('#feedback-category');
  const description = form.querySelector<HTMLTextAreaElement>('#feedback-description');
  const honey = form.querySelector<HTMLInputElement>('#feedback-website');
  const error = form.querySelector<HTMLElement>('[role="alert"]');
  const status = form.querySelector<HTMLElement>('[role="status"]');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const another = form.querySelector<HTMLButtonElement>('#feedback-another');
  if (!formChoice || !question || !category || !description || !honey || !error || !status || !submit || !another) throw new Error('回饋表單暫時無法使用，請重新整理。');
  const controls = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')];
  const setLocked = (locked: boolean): void => { controls.forEach(control => { control.disabled = locked; }); };
  const formParam = params.get('form') ?? '';
  const numberParam = params.get('question') ?? '';
  if (isPublicFormId(formParam) && [...formChoice.options].some(option => option.value === formParam)) {
    formChoice.value = formParam;
    if (/^\d{1,3}$/.test(numberParam) && Number(numberParam) >= 1 && Number(numberParam) <= 200) question.value = String(Number(numberParam));
  }
  let state: 'ready' | 'pending' | 'sent' = 'ready';
  let signature = ''; let reference = '';
  submit.disabled = false; form.noValidate = true;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state !== 'ready') return;
    error.hidden = true; status.textContent = '';
    if (!form.checkValidity()) {
      error.textContent = '尚未送出。請選擇套卷、問題類別並填寫說明；題號可留白，或填 1～200。';
      error.hidden = false; form.querySelector<HTMLElement>(':invalid')?.focus(); return;
    }
    let payload: FeedbackPayload;
    try {
      // A filled honeypot must not show a fake success or silently discard a legitimate report.
      if (honey.value) throw new Error('表單暫時無法送出，請重新整理後再試。');
      const draft = { formId: formChoice.value, questionNumber: question.value === '' ? null : question.valueAsNumber,
        category: category.value, description: description.value, contentVersion: form.dataset.contentVersion ?? 'unspecified' };
      const nextSignature = JSON.stringify(buildFeedbackPayload(draft, 'DC-draft'));
      if (signature !== nextSignature) { signature = nextSignature; reference = `DC-${crypto.randomUUID()}`; }
      payload = buildFeedbackPayload(draft, reference);
    } catch (failure) {
      error.textContent = `尚未送出。${(failure as Error).message}`; error.hidden = false; description.focus(); return;
    }
    state = 'pending'; setLocked(true); submit.disabled = true;
    form.setAttribute('aria-busy', 'true'); status.textContent = '回饋送出中，請稍候…';
    try {
      await deliver(payload);
      state = 'sent'; submit.hidden = true; another.hidden = false;
      status.textContent = `回饋已送出，感謝你幫助我們改善題目！參考編號：${reference}`;
      another.focus();
    } catch {
      state = 'ready'; setLocked(false); submit.disabled = false; submit.textContent = '重試送出';
      status.textContent = '';
      error.textContent = `尚未確認送出。內容仍保留在本頁，可稍後重試；回饋可能已抵達，重試可能產生相同編號的回報。參考編號：${reference}。重新整理會清除這次填寫內容。`;
      error.hidden = false; error.focus();
    } finally { form.setAttribute('aria-busy', 'false'); }
  });
  another.addEventListener('click', () => {
    if (state !== 'sent') return;
    state = 'ready'; signature = ''; reference = ''; description.value = '';
    setLocked(false); submit.hidden = false; submit.disabled = false; submit.textContent = '送出回饋';
    another.hidden = true; status.textContent = ''; error.hidden = true; description.focus();
  });
}
