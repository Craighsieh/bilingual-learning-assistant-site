const issueEndpoint = 'https://github.com/Craighsieh/bilingual-learning-assistant-site/issues/new';
const categories = {
  answer: '答案有疑問',
  explanation: '解題說明不清楚',
  audio: '聽力或逐字稿',
  image: '圖片或圖表',
  wording: '題目表達或品質',
  other: '其他問題',
} as const;

export interface FeedbackDraft {
  formId: string;
  questionNumber: number | null;
  category: string;
  description: string;
  contentVersion: string;
}

function formTitle(formId: string): string {
  if (!/^(prac0[12]|mock0[1-5])$/.test(formId)) throw new Error('請選擇要回饋的套卷。');
  return `${formId.startsWith('prac') ? '練習' : '模考'} ${Number(formId.slice(-2))}`;
}

export function buildFeedbackIssueUrl(draft: FeedbackDraft): string {
  const title = formTitle(draft.formId);
  if (draft.questionNumber !== null && (!Number.isInteger(draft.questionNumber) || draft.questionNumber < 1 || draft.questionNumber > 200)) throw new Error('題號請填 1～200，或留白回報整份套卷。');
  if (!Object.hasOwn(categories, draft.category)) throw new Error('請選擇問題類別。');
  const description = draft.description.trim();
  if (!description) throw new Error('請填寫問題說明。');
  if (description.length > 1000) throw new Error('問題說明請控制在 1,000 字內。');
  const category = categories[draft.category as keyof typeof categories];
  const number = draft.questionNumber === null ? '整份套卷／未指定題號' : `第 ${draft.questionNumber} 題`;
  const url = new URL(issueEndpoint);
  url.searchParams.set('title', `[TOEIC 回饋] ${title} · ${number} · ${category}`);
  url.searchParams.set('body', [
    '## 題目資訊', `套卷：${title}（${draft.formId}）`, `展示題號：${number}`,
    `內容版本：${draft.contentVersion}`, `問題類別：${category}`,
    '', '## 問題說明', description,
    '', '（由使用者確認後自行在 GitHub 發布；網站未附上作答紀錄。）',
  ].join('\n'));
  return url.href;
}

export function feedbackHref(pageRoot: URL, formId: string, questionNumber: number): string {
  formTitle(formId);
  if (!Number.isInteger(questionNumber) || questionNumber < 1 || questionNumber > 200) throw new Error('題號無效。');
  const url = new URL('feedback/', pageRoot);
  url.searchParams.set('form', formId); url.searchParams.set('question', String(questionNumber));
  return url.href;
}

/** This page never opens the study database; only an explicit submit hands off the typed report. */
export function mountFeedbackForm(form: HTMLFormElement, params: URLSearchParams, navigate: (url: string) => void = (url) => location.assign(url)): void {
  const formChoice = form.querySelector<HTMLSelectElement>('#feedback-form-id');
  const question = form.querySelector<HTMLInputElement>('#feedback-question');
  const category = form.querySelector<HTMLSelectElement>('#feedback-category');
  const description = form.querySelector<HTMLTextAreaElement>('#feedback-description');
  const error = form.querySelector<HTMLElement>('[role="alert"]');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!formChoice || !question || !category || !description || !error || !submit) throw new Error('回饋表單暫時無法使用，請重新整理。');
  const formParam = params.get('form') ?? '';
  if ([...formChoice.options].some((option) => option.value === formParam)) formChoice.value = formParam;
  const numberParam = params.get('question') ?? '';
  if (/^\d{1,3}$/.test(numberParam) && Number(numberParam) >= 1 && Number(numberParam) <= 200) question.value = String(Number(numberParam));
  submit.disabled = false;
  form.noValidate = true;
  form.addEventListener('submit', (event) => {
    event.preventDefault(); error.hidden = true;
    if (!form.checkValidity()) {
      error.textContent = '尚未送出。請選擇套卷、問題類別並填寫說明；題號可留白，或填 1～200。';
      error.hidden = false; form.querySelector<HTMLElement>(':invalid')?.focus(); return;
    }
    try {
      const url = buildFeedbackIssueUrl({
        formId: formChoice.value, questionNumber: question.value === '' ? null : question.valueAsNumber,
        category: category.value, description: description.value, contentVersion: form.dataset.contentVersion ?? '未指定',
      });
      navigate(url);
    } catch (failure) {
      error.textContent = `尚未送出。${(failure as Error).message}`; error.hidden = false; description.focus();
    }
  });
}
