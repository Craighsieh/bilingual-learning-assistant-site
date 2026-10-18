import { StudyAudio } from './audio.js';
import { StudyData } from './data.js';
import { acquireEditor, type EditorLease } from './editor.js';
import { answerQuestion, confirmGroup, createAttempt, scopeQuestions, submitAttempt, toggleFlag } from './session.js';
import type { StudyStore } from './store.js';
import type { Attempt, ReviewFile, StudyForm, StudyQuestion } from './types.js';
import { action, element, formatTime, link, renderMaterial, renderQuestionGroup, renderResult } from './view.js';

/** Coordinates persistence and presentation; session rules stay in the pure engine. */
export class PracticePage {
  private attempt!: Attempt;
  private form!: StudyForm;
  private review: ReviewFile | null = null;
  private owner: string = crypto.randomUUID();
  private editor: EditorLease | null = null;
  private readonly status = element('p', 'study-status');
  private readonly error = element('div', 'study-error');
  private readonly retrySave = action('重試保存', () => { void this.retryPending(); });
  private readonly progress = element('strong');
  private readonly time = element('span');
  private readonly navigator = element('div', 'question-navigator');
  private readonly material = element('div');
  private readonly questions = element('div');
  private readonly results = element('div');
  private readonly previous = action('上一題', () => this.navigate(-1));
  private readonly next = action('下一題', () => this.navigate(1));
  private readonly submit = action('交卷並看結果', () => this.confirmSubmit(), 'study-button primary');
  private readonly confirmDialog = element('dialog', 'submit-dialog');
  private readonly wrongOnly = element('input');
  private readonly audioHost = element('section', 'study-audio');
  private readonly audio = new StudyAudio(this.audioHost);
  private readonly visibleQuestions = element('p', 'study-note');
  private readonly lockNotice = element('p', 'lock-notice');
  private readonly heading = element('h1');
  private readonly root: HTMLElement;
  private readonly pageRoot: URL;
  private readonly data: StudyData;
  private readonly store: StudyStore;
  private readonly params: URLSearchParams;
  private readOnly = false;
  private pending: Attempt | null = null;
  private operations = Promise.resolve();
  private heartbeat = 0;
  private lastClock = performance.now();
  private active = !document.hidden;
  private unflushedMs = 0;

  constructor(root: HTMLElement, data: StudyData, store: StudyStore, pageRoot: URL, params: URLSearchParams) {
    this.root = root; this.data = data; this.store = store; this.pageRoot = pageRoot; this.params = params;
  }

  async start(): Promise<void> {
    const catalog = await this.data.catalog();
    const id = this.params.get('form') ?? '';
    this.form = await this.data.form(id, catalog.contentVersion);
    const partParam = this.params.get('part');
    const part = partParam === null ? null : Number(partParam);
    if (part !== null && (!Number.isInteger(part) || part < 1 || part > 7)) throw new Error('Part 無效，請回題庫首頁選擇。');
    const attemptId = this.params.get('attempt');
    if (attemptId) {
      const existing = await this.store.get(attemptId);
      if (!existing) throw new Error('找不到這份本機進度。可能已清除，或使用了不同瀏覽器，請回題庫開始新練習。');
      scopeQuestions(existing, this.form); this.attempt = existing;
    } else this.attempt = createAttempt(this.form, part);
    if (this.attempt.status === 'draft') {
      this.editor = await acquireEditor(this.attempt.id, this.store); this.owner = this.editor.owner;
      this.readOnly = !this.editor.acquired;
      if (!this.readOnly && attemptId) {
        const fresh = await this.store.get(attemptId);
        if (!fresh) throw new Error('這份本機進度已清除，請開始新練習。');
        scopeQuestions(fresh, this.form); this.attempt = fresh;
      }
      if (!this.readOnly && !attemptId) this.attempt = await this.store.save(this.attempt, this.owner);
    }
    if (this.attempt.status === 'submitted' || this.attempt.confirmedGroups.length) this.review = await this.data.review(this.form);
    const url = new URL(location.href); url.searchParams.set('form', this.form.id); url.searchParams.set('attempt', this.attempt.id); url.searchParams.delete('part');
    history.replaceState(null, '', url);
    this.mount(); this.render(); this.lastClock = performance.now();
    this.heartbeat = window.setInterval(() => { if (!document.hidden && !this.readOnly && this.attempt.status === 'draft') this.perform((value) => value, true); }, 10000);
    document.addEventListener('visibilitychange', this.visibilityChanged);
    window.addEventListener('pagehide', this.pageHidden);
    window.addEventListener('pageshow', this.pageShown);
  }

  private mount(): void {
    this.status.setAttribute('role', 'status'); this.status.id = 'save-status';
    this.error.setAttribute('role', 'alert'); this.error.hidden = true; this.retrySave.hidden = true;
    this.heading.tabIndex = -1;
    const top = element('div', 'study-top'); const title = element('div');
    title.append(element('p', 'eyebrow', 'FREE TOEIC PRACTICE'), this.heading);
    top.append(title, link('回免費題庫', this.pageRoot.href, 'study-button quiet'));
    const metrics = element('div', 'study-metrics'); metrics.append(this.progress, this.time, this.status);
    const nav = element('details', 'question-map'); nav.append(element('summary', '', '題號導覽 · 已答／待複習'), this.navigator);
    const columns = element('div', 'study-columns'); columns.append(this.material, this.questions);
    const controls = element('div', 'study-bottom'); controls.append(this.previous, this.next, this.submit);
    const filter = element('label', 'review-filter'); this.wrongOnly.type = 'checkbox'; this.wrongOnly.id = 'wrong-only';
    this.wrongOnly.addEventListener('change', () => { this.attempt = { ...this.attempt, currentIndex: 0 }; this.render(); });
    filter.append(this.wrongOnly, document.createTextNode('只看錯題與未答題')); filter.id = 'review-filter'; filter.hidden = true;
    this.lockNotice.hidden = true; this.lockNotice.setAttribute('role', 'status');
    const children: Node[] = [top];
    if (!this.store.persistent) children.push(element('p', 'storage-warning', '本次進度無法保存：目前使用分頁記憶體，重新整理或關閉後會清除。'));
    children.push(metrics, this.lockNotice, this.error, this.retrySave, this.results, filter, nav, this.visibleQuestions, this.audioHost, columns, controls, this.confirmDialog);
    this.root.replaceChildren(...children);
  }

  private scoped(): StudyQuestion[] { return scopeQuestions(this.attempt, this.form); }
  private filtered(): StudyQuestion[] {
    const questions = this.scoped();
    return this.wrongOnly.checked && this.review && this.attempt.status === 'submitted'
      ? questions.filter((q) => this.attempt.answers[q.id] !== this.review!.answers[q.id]?.answer) : questions;
  }

  private render(): void {
    const focused = (document.activeElement as HTMLElement | null)?.id;
    this.heading.textContent = `${this.form.title}${this.attempt.scopePart ? ` · Part ${this.attempt.scopePart}` : ' · 完整卷'}`;
    const scoped = this.scoped(); const questions = this.filtered();
    this.attempt.currentIndex = Math.min(Math.max(this.attempt.currentIndex, 0), Math.max(0, questions.length - 1));
    const current = questions[this.attempt.currentIndex];
    const group = current ? questions.filter((q) => q.groupId === current.groupId) : [];
    const answered = scoped.filter((q) => !!this.attempt.answers[q.id]).length;
    this.progress.textContent = `已答 ${answered} / ${scoped.length} 題`;
    this.time.textContent = `練習用時 ${formatTime(this.attempt.elapsedMs)}`;
    this.status.textContent = this.attempt.status === 'submitted' ? '已交卷，結果已固定' : this.readOnly ? '目前為唯讀檢視' : this.store.persistent ? '已自動保存於此瀏覽器' : '僅保留在本次分頁';
    this.lockNotice.hidden = !this.readOnly;
    this.lockNotice.textContent = '這份作答由另一個分頁編輯，或本頁進度已過期。目前可檢視，請關閉另一分頁後重新載入。';
    this.navigator.replaceChildren();
    for (const q of questions) {
      const button = action(`${q.number}${this.attempt.flags.includes(q.id) ? ' ★' : ''}`, () => this.goTo(questions.indexOf(q)), 'question-dot');
      button.setAttribute('aria-label', `第 ${q.number} 題${this.attempt.answers[q.id] ? '，已作答' : '，未作答'}${this.attempt.flags.includes(q.id) ? '，待複習' : ''}`);
      if (this.attempt.answers[q.id]) button.classList.add('answered');
      if (current?.id === q.id) button.setAttribute('aria-current', 'step');
      this.navigator.append(button);
    }
    this.visibleQuestions.textContent = current ? `Part ${current.part} · 題組 ${group.map((q) => q.number).join('、')}${this.attempt.status === 'draft' ? this.attempt.role === 'mock' ? ' · 含繁中解題說明，交卷後可查看' : ' · 含繁中解題說明，確認答案後可查看' : ''}` : '這次練習沒有錯題或未答題，做得很好。';
    this.material.replaceChildren(...(current ? [renderMaterial(current, (asset) => this.data.asset(asset))] : []));
    const hasMaterial = !!current && !!(current.image || current.passage || current.documents.length || current.graphic);
    this.material.hidden = !hasMaterial;
    this.material.parentElement?.classList.toggle('single-column', !hasMaterial);
    this.questions.replaceChildren(renderQuestionGroup(group, this.attempt, this.review, this.readOnly, {
      answer: (id, choice) => this.perform((value) => answerQuestion(value, this.form, id, choice)),
      flag: (id) => this.perform((value) => toggleFlag(value, id)),
      confirm: (groupId) => this.perform(async (value) => {
        const next = confirmGroup(value, this.form, groupId);
        await this.ensureReview(); return next;
      }),
    }));
    this.audio.setSource(current?.audio ? this.data.asset(current.audio) : null, `Part ${current?.part ?? ''} · 第 ${group.map((q) => q.number).join('、')} 題聽力`);
    const nextGroup = current && questions.find((q, index) => index > this.attempt.currentIndex && q.groupId !== current.groupId);
    this.audio.prefetchNext(nextGroup?.audio ? this.data.asset(nextGroup.audio) : null);
    this.previous.disabled = this.attempt.currentIndex === 0 || !current;
    this.next.disabled = this.attempt.currentIndex >= questions.length - 1 || !current;
    this.submit.hidden = this.attempt.status === 'submitted'; this.submit.disabled = this.readOnly;
    document.getElementById('review-filter')!.hidden = this.attempt.status !== 'submitted';
    if (this.attempt.status === 'submitted' && this.review) {
      this.results.replaceChildren(renderResult(this.attempt, this.review, new URL('app/', this.pageRoot).href), link('再練一次', this.newAttemptURL(), 'study-button primary'));
    }
    if (focused) document.getElementById(focused)?.focus({ preventScroll: true });
  }

  private newAttemptURL(): string {
    const url = new URL('practice/', this.pageRoot); url.searchParams.set('form', this.form.id);
    if (this.attempt.scopePart) url.searchParams.set('part', String(this.attempt.scopePart)); return url.href;
  }
  private async ensureReview(): Promise<void> { if (!this.review) this.review = await this.data.review(this.form); }
  private tick(): void {
    const now = performance.now(); if (this.active && this.attempt.status === 'draft') this.unflushedMs += now - this.lastClock; this.lastClock = now;
  }

  private perform(change: (attempt: Attempt) => Attempt | Promise<Attempt>, silent = false): void {
    this.operations = this.operations.then(async () => {
      if (this.readOnly || this.attempt.status !== 'draft') return;
      let candidate: Attempt | null = null;
      try {
        if (!(await this.store.acquire(this.attempt.id, this.owner))) throw new Error('另一個分頁已取得編輯權。請重新載入。');
        const changed = await change(this.attempt);
        this.tick(); candidate = { ...changed, elapsedMs: changed.elapsedMs + this.unflushedMs }; this.unflushedMs = 0;
        this.attempt = await this.store.save(candidate, this.owner); this.pending = null;
        this.error.hidden = true; this.retrySave.hidden = true;
        if (!silent || this.attempt.status === 'submitted') this.render();
        else { this.status.textContent = this.store.persistent ? '已自動保存於此瀏覽器' : '僅保留在本次分頁'; this.time.textContent = `練習用時 ${formatTime(this.attempt.elapsedMs)}`; }
        if (this.attempt.status === 'submitted') { this.audio.pause(); await this.editor?.release().catch(() => {}); this.editor = null; }
      } catch (error) {
        this.pending = candidate;
        const message = (error as Error).message;
        // Preserve the user's unsaved selection visibly. A failed submit must still look like a draft.
        if (candidate) this.attempt = { ...candidate, status: 'draft', submittedAt: null };
        if (candidate || /分頁|更新|交卷/.test(message)) { this.readOnly = true; this.audio.pause(); }
        this.render(); this.error.textContent = `${message}${candidate ? ' 本次變更尚未保存，已暫存在此分頁；請重試保存，或重新載入最新進度。' : ''}`; this.error.hidden = false;
        this.retrySave.hidden = !candidate || /分頁|更新|交卷/.test(message);
      }
    });
  }

  private async retryPending(): Promise<void> {
    if (!this.pending) return;
    try {
      if (!(await this.store.acquire(this.attempt.id, this.owner))) throw new Error('另一個分頁正在編輯，請重新載入。');
      this.attempt = await this.store.save(this.pending, this.owner); this.pending = null; this.readOnly = false; this.lastClock = performance.now();
      this.error.hidden = true; this.retrySave.hidden = true; this.render();
      if (this.attempt.status === 'submitted') { await this.editor?.release().catch(() => {}); this.editor = null; }
    } catch (error) { this.error.textContent = (error as Error).message; }
  }

  private goTo(index: number): void {
    if (this.attempt.status === 'submitted' || this.readOnly) { this.attempt = { ...this.attempt, currentIndex: index }; this.render(); }
    else this.perform((value) => ({ ...value, currentIndex: index }));
  }
  private navigate(delta: number): void { this.goTo(Math.min(Math.max(this.attempt.currentIndex + delta, 0), this.filtered().length - 1)); }

  private confirmSubmit(): void {
    const remaining = this.scoped().filter((q) => !this.attempt.answers[q.id]).length;
    const title = element('h2', '', '交卷並查看解析？'); title.id = 'submit-heading'; this.confirmDialog.setAttribute('aria-labelledby', title.id);
    const body = element('p', '', remaining ? `還有 ${remaining} 題未作答，將列為未答題。交卷後答案固定，可另開新練習。` : '交卷後答案固定，可查看完整結果與解析。');
    this.confirmDialog.replaceChildren(title, body, action('繼續作答', () => this.confirmDialog.close()), action('確認交卷', () => {
      this.confirmDialog.close(); this.perform(async (value) => { await this.ensureReview(); return submitAttempt(value); });
    }, 'study-button primary'));
    this.confirmDialog.showModal();
  }

  private visibilityChanged = (): void => {
    this.tick(); this.active = !document.hidden;
    if (document.hidden) { this.audio.pause(); if (!this.readOnly) this.perform((value) => value, true); }
    else if (!this.readOnly && this.attempt.status === 'draft') this.perform((value) => value, true);
  };
  private pageHidden = (): void => { this.audio.pause(); void this.operations.then(async () => { await this.editor?.release(); this.editor = null; }).catch(() => {}); };
  private pageShown = (event: PageTransitionEvent): void => {
    this.lastClock = performance.now();
    // A restored back/forward-cache document must acquire a fresh editor and fresh revision.
    if (event.persisted) location.reload();
  };
  dispose(): void {
    window.clearInterval(this.heartbeat); this.audio.dispose();
    document.removeEventListener('visibilitychange', this.visibilityChanged); window.removeEventListener('pagehide', this.pageHidden); window.removeEventListener('pageshow', this.pageShown);
    void this.editor?.release().catch(() => {});
  }
}
